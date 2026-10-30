extends Control
## Inside a family house (house pages in the book: "Inside the house", "Renovation", decor shop).
## The room is a 3D shadow box showing the decor the player owns, in the design they picked. Below it: who lives
## here, "Fix it up!" for the next level, and the decor shop. Tapping a design tries it on in the room; a design you
## own is put in at once, others get a Buy button. Every item adds Cozy (more coins for this family in minigames).

var house: StringName = &"dumpling"
var _viewer: ModelViewer
var _room: Node3D
var _title: Label
var _level: Label
var _fix: Button
var _fix_note: Label
var _family: HBoxContainer
var _shop: VBoxContainer
## item number -> design being tried on (not bought yet)
var _trying: Dictionary[int, StringName] = {}
var _decor_nodes: Dictionary[int, Node3D] = {}


func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	var bg := ColorRect.new()
	bg.color = UiTheme.BG
	bg.set_anchors_preset(PRESET_FULL_RECT)
	add_child(bg)
	var inset := SafeArea.insets(get_viewport())
	var margin := MarginContainer.new()
	margin.set_anchors_preset(PRESET_FULL_RECT)
	for k: String in ["left", "top", "right", "bottom"]:
		margin.add_theme_constant_override("margin_" + k, int({"left": inset.x, "top": inset.y, "right": inset.z, "bottom": inset.w}[k]))
	add_child(margin)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 14)
	margin.add_child(col)
	# top bar: back + wallet, then the house name and level
	var top := HBoxContainer.new()
	col.add_child(top)
	var back := Ui.icon_button("back", Text.t(&"ui.back"))
	back.size_flags_vertical = SIZE_SHRINK_BEGIN
	back.set_meta(&"silent", true)
	back.pressed.connect(func() -> void:
		Audio.play(&"back")
		Nav.back())
	top.add_child(back)
	var spacer := Control.new()
	spacer.size_flags_horizontal = SIZE_EXPAND_FILL
	top.add_child(spacer)
	var wallet := WalletBar.new()
	wallet.size_flags_vertical = SIZE_SHRINK_BEGIN
	top.add_child(wallet)
	var words := VBoxContainer.new()
	words.add_theme_constant_override("separation", 0)
	col.add_child(words)
	_title = Ui.label("", "Heading", HORIZONTAL_ALIGNMENT_LEFT, true)
	_level = Ui.label("", "Small")
	words.add_child(_title)
	words.add_child(_level)
	# room
	_viewer = ModelViewer.new()
	_viewer.custom_minimum_size = Vector2(0, 440)
	_viewer.yaw = 0.12
	_viewer.pitch = 0.16
	_viewer.yaw_limit = 0.55
	_viewer.pitch_min = 0.02
	_viewer.pitch_max = 0.55
	_viewer.pad = 0.62
	col.add_child(_viewer)
	# family
	_family = HBoxContainer.new()
	_family.alignment = BoxContainer.ALIGNMENT_CENTER
	_family.add_theme_constant_override("separation", 6)
	col.add_child(_family)
	# fix it up
	var fix_row := HBoxContainer.new()
	col.add_child(fix_row)
	_fix_note = Ui.label("", "Hand", HORIZONTAL_ALIGNMENT_LEFT, true)
	_fix_note.size_flags_horizontal = SIZE_EXPAND_FILL
	fix_row.add_child(_fix_note)
	_fix = Ui.button("", "BigButton", "hammer")
	_fix.pressed.connect(_fix_up)
	fix_row.add_child(_fix)
	# decor shop
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)
	_shop = VBoxContainer.new()
	_shop.size_flags_horizontal = SIZE_EXPAND_FILL
	_shop.add_theme_constant_override("separation", 14)
	scroll.add_child(_shop)
	Town.changed.connect(_refresh_words)
	Economy.changed.connect(_refresh_words)
	Collection.changed.connect(_refresh_family)


func open(args: Dictionary) -> void:
	house = StringName(args.get("id", house))
	Audio.music(&"house")
	_build_room()
	_refresh_words()
	_refresh_family()


func screen_shown() -> void:
	Audio.music(&"house")


# ---------------------------------------------------------------- room

func _build_room() -> void:
	_room = Node3D.new()
	var base := load(ArtLibrary.room_path(house)) as PackedScene if ResourceLoader.exists(ArtLibrary.room_path(house)) else null
	if base:
		_room.add_child(base.instantiate())
	_viewer.set_model(_room)
	_decor_nodes.clear()
	for d: Dictionary in Town.decor_items(house):
		_show_decor(int(d["item"]))


## Put an item in the room in the design being tried on, else the one in use, else leave its spot empty.
func _show_decor(item: int) -> void:
	if _decor_nodes.has(item):
		_decor_nodes[item].queue_free()
		_decor_nodes.erase(item)
	var style: StringName = _trying.get(item, Town.decor_style(house, item))
	if style == &"":
		return
	var path := ArtLibrary.decor_path(house, item, style)
	if not ResourceLoader.exists(path):
		return
	var node := (load(path) as PackedScene).instantiate() as Node3D
	_room.add_child(node)
	_decor_nodes[item] = node


# ---------------------------------------------------------------- words, family, fixing up

func _refresh_words() -> void:
	if _title == null:
		return
	var info := GameData.building(house)
	_title.text = Text.t(StringName(info.get("name", "")))
	var cozy := Town.cozy(house)
	_level.text = Text.t(&"house.level_cozy", {"n": Town.level(house), "cozy": cozy})
	var check := Town.upgrade_check(house)
	if check["reason"] == &"max":
		_fix.visible = false
		_fix_note.text = Text.t(&"house.top_level")
	else:
		_fix.visible = true
		_fix.text = Text.t(&"map.fix_up", {"coins": Ui.number(check["coins"])})
		_fix.disabled = not check["can"]
		var caption := Text.t(StringName(GameData.level_info(house, check["next"]).get("title", "")))
		var need := TownWords.renovate_note(check, Economy)
		_fix_note.text = Text.t(&"house.next_level", {"n": check["next"]}) + " · " + caption + ("\n" + need if need != "" else "")
	_build_shop()


func _refresh_family() -> void:
	if _family == null:
		return
	for c in _family.get_children():
		c.queue_free()
	for id in GameData.family(house):
		var pic := Ui.texture(ArtLibrary.portrait(id), Vector2(96, 96))
		if Collection.owned(id):
			pic.tooltip_text = Text.t(StringName(GameData.squishy(id).get("name", "")))
		else:
			# not found yet: a soft silhouette, never a sad face
			pic.modulate = Color(0.17, 0.13, 0.25, 0.22)
			pic.tooltip_text = Text.t(&"house.missing")
		_family.add_child(pic)


func _fix_up() -> void:
	var r := Town.upgrade(house)
	if not r["can"]:
		Audio.play(&"nope")
		return
	Audio.play(&"build")
	_viewer.scale = Vector2(1.0, 0.96)
	create_tween().tween_property(_viewer, "scale", Vector2.ONE, 0.5).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
	await get_tree().create_timer(0.7).timeout
	Audio.play(&"tada")
	Haptics.play(&"medium")
	Celebration.burst(self, _viewer.get_global_rect().get_center() - get_global_rect().position + Vector2(0, 80))
	UiToast.show_text(Text.t(&"house.fixed", {"n": r["next"]}))


# ---------------------------------------------------------------- decor shop

func _build_shop() -> void:
	for c in _shop.get_children():
		c.queue_free()
	_shop.add_child(Ui.label(Text.t(&"house.decor"), "Heading"))
	var cozy := Town.cozy(house)
	_shop.add_child(Ui.label(Text.t(&"house.cozy_bonus", {"cozy": cozy, "pct": roundi(Town.cozy_bonus(house) * 100.0)}), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
	for d: Dictionary in Town.decor_items(house):
		_shop.add_child(_item_row(d))


func _item_row(d: Dictionary) -> Control:
	var item := int(d["item"])
	var card := PanelContainer.new()
	card.theme_type_variation = "Card"
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 8)
	card.add_child(col)
	var head := HBoxContainer.new()
	col.add_child(head)
	var name_label := Ui.label(Text.t(StringName(d["name"])))
	name_label.add_theme_font_override("font", UiTheme.font(900))
	name_label.size_flags_horizontal = SIZE_EXPAND_FILL
	head.add_child(name_label)
	head.add_child(Ui.label(Text.t(&"house.cozy_points", {"n": int(d["cozy"])}), "Small"))
	col.add_child(Ui.label(Text.t(StringName(d["what"])), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
	var designs := HBoxContainer.new()
	designs.add_theme_constant_override("separation", 8)
	col.add_child(designs)
	var in_use := Town.decor_style(house, item)
	var trying: StringName = _trying.get(item, &"")
	for st: Dictionary in GameData.file("decor_styles.json").get("decor_styles", []):
		var style := StringName(st["id"])
		var owned := Town.owns_decor(house, item, style)
		var price := Town.decor_price(house, item, style)
		var b := Ui.button(Text.t(StringName("decor_style.short." + String(style))) + ("" if owned else "\n" + Ui.number(price)), "PillButton")
		b.add_theme_font_size_override("font_size", 22)
		b.toggle_mode = true
		b.button_pressed = style == (trying if trying != &"" else in_use)
		b.pressed.connect(_pick_design.bind(item, style))
		designs.add_child(b)
	if trying != &"" and not Town.owns_decor(house, item, trying):
		var buy := Ui.button(Text.t(&"house.buy", {"coins": Ui.number(Town.decor_price(house, item, trying))}), "BigButton", "coin")
		buy.disabled = not Economy.can_afford(Town.decor_price(house, item, trying))
		buy.pressed.connect(_buy.bind(item, trying, Text.t(StringName(d["name"]))))
		col.add_child(buy)
		if buy.disabled:
			col.add_child(Ui.label(Text.t(&"map.need_coins", {"n": Ui.number(Town.decor_price(house, item, trying) - Economy.coins())}), "Hand", HORIZONTAL_ALIGNMENT_LEFT, true))
	return card


func _pick_design(item: int, style: StringName) -> void:
	if Town.owns_decor(house, item, style):
		_trying.erase(item)
		Town.use_decor(house, item, style)
		Audio.play(&"squish")
	else:
		_trying[item] = style
	_show_decor(item)
	_build_shop()


func _buy(item: int, style: StringName, item_name: String) -> void:
	var r := Town.buy_decor(house, item, style)
	if not r["ok"]:
		Audio.play(&"nope")
		return
	_trying.erase(item)
	Audio.play(&"buy")
	Audio.play(&"squish")
	Haptics.play(&"light")
	UiToast.show_text(Text.t(&"house.bought", {"item": item_name}))
	_show_decor(item)
