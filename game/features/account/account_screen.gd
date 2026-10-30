extends Control
## "Your town" (account.html "Accounts & saving"), opened from the cloud button on the map: is the town saved, and
## the grown-up things: save my town (email + 6-digit code), moving to a new phone (transfer code + PIN), I already
## have a town (bring a saved town onto this phone), and delete the account. Everything grown-up starts with the
## grown-up gate. The server does the work (Account service + Server.api); this screen only asks and explains.

var _status: VBoxContainer
var _save_button: Button


func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	var bg := ColorRect.new()
	bg.color = Color("#EAF4FF")
	bg.set_anchors_preset(PRESET_FULL_RECT)
	add_child(bg)
	var inset := SafeArea.insets(get_viewport())
	var margin := MarginContainer.new()
	margin.set_anchors_preset(PRESET_FULL_RECT)
	for k: String in ["left", "top", "right", "bottom"]:
		margin.add_theme_constant_override("margin_" + k, int({"left": inset.x, "top": inset.y, "right": inset.z, "bottom": inset.w}[k]))
	add_child(margin)
	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 14)
	margin.add_child(outer)
	var top := HBoxContainer.new()
	outer.add_child(top)
	var back := Ui.icon_button("back", Text.t(&"ui.back"))
	back.size_flags_vertical = SIZE_SHRINK_BEGIN
	back.set_meta(&"silent", true)
	back.pressed.connect(func() -> void:
		Audio.play(&"back")
		Nav.back())
	top.add_child(back)
	var scroll := TouchScroll.new()
	scroll.size_flags_vertical = SIZE_EXPAND_FILL
	outer.add_child(scroll)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 18)
	scroll.add_child(col)
	col.add_child(Ui.label(Text.t(&"account.title"), "Title"))
	_status = VBoxContainer.new()
	_status.add_theme_constant_override("separation", 6)
	col.add_child(_status)
	_save_button = Ui.button(Text.t(&"account.save_my_town"), "BigButton", "cloud")
	_save_button.name = "SaveMyTown"
	_save_button.pressed.connect(save_my_town)
	col.add_child(_save_button)
	var move := Ui.button(Text.t(&"account.moving"))
	move.name = "Moving"
	move.pressed.connect(moving_to_new_phone)
	col.add_child(move)
	var already := Ui.button(Text.t(&"account.already"))
	already.name = "Already"
	already.pressed.connect(already_have_a_town)
	col.add_child(already)
	col.add_child(Ui.label(Text.t(&"account.privacy"), "Heading"))
	col.add_child(Ui.label(Text.t(&"account.what_we_keep"), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
	var delete := Ui.button(Text.t(&"account.delete"))
	delete.name = "Delete"
	delete.pressed.connect(delete_account)
	col.add_child(delete)
	Account.status_changed.connect(_show_status)
	_show_status()
	Account.refresh_status()


func open(_args: Dictionary) -> void:
	Audio.music(&"house")


func screen_shown() -> void:
	Account.refresh_status()


func _show_status() -> void:
	if not is_instance_valid(_status):
		return
	for c in _status.get_children():
		c.queue_free()
	var linked := Account.is_linked()
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	row.add_child(Ui.texture(Ui.icon("check" if linked else "cloud"), Vector2(56, 56)))
	row.add_child(Ui.label(Text.t(&"account.saved" if linked else &"account.not_saved"), "Heading", HORIZONTAL_ALIGNMENT_LEFT, true))
	_status.add_child(row)
	if linked:
		_status.add_child(Ui.label(Text.t(&"account.saved_with", {"email": String(Account.status.get("email", ""))}), "", HORIZONTAL_ALIGNMENT_LEFT, true))
	else:
		_status.add_child(Ui.label(Text.t(&"account.not_saved_why"), "", HORIZONTAL_ALIGNMENT_LEFT, true))
	var after := float(Account.status.get("deletion_after", 0))
	if after > 0.0:
		var day := Time.get_date_string_from_unix_time(int(after / 1000.0))
		_status.add_child(Ui.label(Text.t(&"account.deleting_on", {"date": day}), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
	if not Server.api.is_remote():
		_status.add_child(Ui.label(Text.t(&"account.pretend_note"), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
	_save_button.visible = not linked


## The server said no: say why in friendly words.
func _oops(answer: Dictionary) -> void:
	var key := StringName("account.err_" + String(answer.get("error", "offline")))
	if not Text.has(key):
		key = &"account.err_offline"
	await UiPopup.ask(Text.t(&"account.oops"), Text.t(key), Text.t(&"ui.ok"))


## A pop-up with typing fields (only behind the grown-up gate: never for children). Returns the texts, or [] if
## cancelled.
func _ask_fields(title: String, body: String, fields: Array[Dictionary], yes_text: String) -> PackedStringArray:
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 10)
	var edits: Array[LineEdit] = []
	for f in fields:
		var edit := LineEdit.new()
		edit.name = String(f.get("name", "Field"))
		edit.placeholder_text = String(f.get("hint", ""))
		edit.virtual_keyboard_type = f.get("keyboard", LineEdit.KEYBOARD_TYPE_DEFAULT)
		edit.max_length = int(f.get("max", 254))
		edit.custom_minimum_size = Vector2(480, 76)
		edit.add_theme_font_size_override("font_size", 32)
		edit.alignment = HORIZONTAL_ALIGNMENT_CENTER
		box.add_child(edit)
		edits.append(edit)
	if not await UiPopup.ask(title, body, yes_text, Text.t(&"ui.cancel"), box):
		return PackedStringArray()
	var out := PackedStringArray()
	for e in edits:
		out.append(e.text.strip_edges())
	return out


# ---------------------------------------------------------------- save my town (email + code)

func save_my_town() -> void:
	if not await GrownUpGate.ask(Text.t(&"account.gate_save")):
		return
	var typed := await _ask_fields(Text.t(&"account.email_title"), Text.t(&"account.email_body"),
		[{"name": "Email", "hint": "name@example.com", "keyboard": LineEdit.KEYBOARD_TYPE_EMAIL_ADDRESS}], Text.t(&"account.send_code"))
	if typed.is_empty():
		return
	var start: Dictionary = await Server.api.email_start(typed[0], &"link")
	if not start.get("ok", false):
		await _oops(start)
		return
	var code := await _ask_code(start)
	if code == "":
		return
	var done: Dictionary = await Server.api.email_confirm(code, true)
	if not done.get("ok", false):
		await _oops(done)
		return
	Audio.play(&"tada")
	await Account.refresh_status()
	await UiPopup.ask(Text.t(&"account.saved_title"), Text.t(&"account.saved_body", {"email": String(done.get("email", ""))}), Text.t(&"ui.ok"))


## "We sent a 6-digit code to p•••@example.com" (a test server shows the code too). Returns the code or "".
func _ask_code(start: Dictionary) -> String:
	var body := Text.t(&"account.code_body", {"email": String(start.get("email", ""))})
	if start.has("dev_code"):
		body += "\n" + Text.t(&"account.code_dev", {"code": String(start["dev_code"])})
	var typed := await _ask_fields(Text.t(&"account.code_title"), body,
		[{"name": "Code", "hint": "123456", "keyboard": LineEdit.KEYBOARD_TYPE_NUMBER, "max": 6}], Text.t(&"ui.ok"))
	return typed[0] if not typed.is_empty() else ""


# ---------------------------------------------------------------- moving to a new phone (code + PIN)

func moving_to_new_phone() -> void:
	if not await GrownUpGate.ask(Text.t(&"account.gate_move")):
		return
	var made: Dictionary = await Server.api.transfer_create()
	if not made.get("ok", false):
		await _oops(made)
		return
	var art := VBoxContainer.new()
	var code := Ui.label(String(made["code"]), "Title", HORIZONTAL_ALIGNMENT_CENTER)
	code.name = "TransferCode"
	art.add_child(code)
	art.add_child(Ui.label(Text.t(&"account.pin", {"pin": String(made["pin"])}), "Heading", HORIZONTAL_ALIGNMENT_CENTER))
	await UiPopup.ask(Text.t(&"account.moving_title"), Text.t(&"account.moving_body"), Text.t(&"ui.ok"), "", art)


# ---------------------------------------------------------------- I already have a town

func already_have_a_town() -> void:
	if not await GrownUpGate.ask(Text.t(&"account.gate_already")):
		return
	var by_code := await UiPopup.ask(Text.t(&"account.already_title"), Text.t(&"account.already_body"), Text.t(&"account.with_code"), Text.t(&"account.with_email"))
	var look: Dictionary
	var code := ""
	var pin := ""
	var email_code := ""
	if by_code:
		var typed := await _ask_fields(Text.t(&"account.code_pin_title"), Text.t(&"account.code_pin_body"), [
			{"name": "TransferCode", "hint": "4F7Q-KX2M", "max": 9},
			{"name": "Pin", "hint": Text.t(&"account.pin_hint"), "keyboard": LineEdit.KEYBOARD_TYPE_NUMBER, "max": 4}], Text.t(&"ui.ok"))
		if typed.is_empty():
			return
		code = typed[0]
		pin = typed[1]
		look = await Server.api.transfer_use(code, pin, false)
	else:
		var typed := await _ask_fields(Text.t(&"account.email_title"), Text.t(&"account.email_login_body"),
			[{"name": "Email", "hint": "name@example.com", "keyboard": LineEdit.KEYBOARD_TYPE_EMAIL_ADDRESS}], Text.t(&"account.send_code"))
		if typed.is_empty():
			return
		var start: Dictionary = await Server.api.email_start(typed[0], &"login")
		if not start.get("ok", false):
			await _oops(start)
			return
		email_code = await _ask_code(start)
		if email_code == "":
			return
		look = await Server.api.email_confirm(email_code, false)
	if not look.get("ok", false):
		await _oops(look)
		return
	if look.get("same", false):
		await UiPopup.ask(Text.t(&"account.same_title"), Text.t(&"account.same_body"), Text.t(&"ui.ok"))
		return
	if not await _which_town(look.get("saved", {}), look.get("phone", {})):
		return
	var done: Dictionary = await (Server.api.transfer_use(code, pin, true) if by_code else Server.api.email_confirm(email_code, true))
	if not done.get("ok", false):
		await _oops(done)
		return
	Audio.play(&"tada")
	await UiPopup.ask(Text.t(&"account.welcome_back_title"), Text.t(&"account.welcome_back_body"), Text.t(&"ui.ok"))
	await Account.took_saved_town()


## "Which town?": the saved one or the one on this phone (the bigger one is suggested). true = the saved town.
func _which_town(saved: Dictionary, phone: Dictionary) -> bool:
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 14)
	row.add_child(_town_card(Text.t(&"account.on_this_phone"), phone, int(phone.get("squishies", 0)) > int(saved.get("squishies", 0))))
	row.add_child(_town_card(Text.t(&"account.saved_town"), saved, int(saved.get("squishies", 0)) >= int(phone.get("squishies", 0))))
	return await UiPopup.ask(Text.t(&"account.which_title"), Text.t(&"account.which_body"), Text.t(&"account.play_saved"), Text.t(&"account.keep_phone"), row)


func _town_card(title: String, town: Dictionary, suggested: bool) -> Control:
	var card := PanelContainer.new()
	card.theme_type_variation = "Card"
	card.custom_minimum_size = Vector2(250, 0)
	if suggested:
		card.self_modulate = Color("#FFF3B0")
	var col := VBoxContainer.new()
	card.add_child(col)
	col.add_child(Ui.label(title, "Heading", HORIZONTAL_ALIGNMENT_LEFT, true))
	col.add_child(Ui.label(Text.t(&"account.squishies", {"n": int(town.get("squishies", 0))}), "", HORIZONTAL_ALIGNMENT_LEFT, true))
	if int(town.get("steamhouse", 0)) > 0:
		col.add_child(Ui.label(Text.t(&"account.steamhouse", {"n": int(town["steamhouse"])}), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
	return card


# ---------------------------------------------------------------- deleting

func delete_account() -> void:
	if not await GrownUpGate.ask(Text.t(&"account.gate_delete")):
		return
	if not await UiPopup.ask(Text.t(&"account.delete_title"), Text.t(&"account.delete_body"), Text.t(&"account.delete_yes"), Text.t(&"account.delete_no")):
		return
	if not await UiPopup.ask(Text.t(&"account.delete_sure_title"), Text.t(&"account.delete_sure_body"), Text.t(&"account.delete_yes"), Text.t(&"account.delete_no")):
		return
	var answer: Dictionary = await Account.delete_account()
	if not answer.get("ok", false):
		await _oops(answer)
