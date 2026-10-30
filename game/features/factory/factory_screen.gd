extends Control
## The Squishy Factory's box screen (factory.html, "The box screen"). Pick a box, see exactly what can be inside
## (the odds are shown before every box), tap Open!: the box wiggles, bursts open with light rays in the rarity
## colour, and the squishy appears. A new one moves into its house (the map flies there); one you already have goes
## onto the Spare Shelf. Boxes cost coins only (never Gems or money).

const BOXES: Array[StringName] = [&"mystery", &"family", &"golden"]
const RARITIES := ["C", "U", "R", "E", "L"]

var _box: StringName = &"mystery"
var _family: StringName = &"dumpling"
var _viewer: ModelViewer
var _rays: TextureRect
var _title: Label
var _pity_bar: ProgressBar
var _pity_label: Label
var _box_buttons: Dictionary[StringName, Button] = {}
var _family_row: HBoxContainer
var _odds: VBoxContainer
var _open: Button
var _result: Control
var _busy := false


func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	var bg := ColorRect.new()
	bg.color = Color("#FFF0F6")
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
	var top := HBoxContainer.new()
	col.add_child(top)
	var back := Ui.icon_button("back", Text.t(&"ui.back"))
	back.size_flags_vertical = SIZE_SHRINK_BEGIN
	back.set_meta(&"silent", true)
	back.pressed.connect(func() -> void:
		Audio.play(&"back")
		Nav.back())
	top.add_child(back)
	var shelf := Ui.icon_button("shelf", Text.t(&"factory.spare_shelf"))
	shelf.size_flags_vertical = SIZE_SHRINK_BEGIN
	shelf.pressed.connect(func() -> void: Nav.go(&"collection", {"tab": &"shelf"}))
	top.add_child(shelf)
	var spacer := Control.new()
	spacer.size_flags_horizontal = SIZE_EXPAND_FILL
	top.add_child(spacer)
	var wallet := WalletBar.new()
	wallet.size_flags_vertical = SIZE_SHRINK_BEGIN
	top.add_child(wallet)
	# everything between the top bar and the Open button scrolls on small phones
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)
	var outer := col
	col = VBoxContainer.new()
	col.size_flags_horizontal = SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 14)
	scroll.add_child(col)
	_title = Ui.label("", "Heading", HORIZONTAL_ALIGNMENT_LEFT, true)
	col.add_child(_title)
	# the stage: light rays behind the box / squishy
	var stage := Control.new()
	stage.custom_minimum_size = Vector2(0, 340)
	col.add_child(stage)
	_rays = TextureRect.new()
	_rays.set_anchors_preset(PRESET_CENTER)
	_rays.custom_minimum_size = Vector2(560, 560)
	_rays.size = Vector2(560, 560)
	_rays.position = Vector2(-280, -280)
	_rays.pivot_offset = Vector2(280, 280)
	_rays.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_rays.modulate.a = 0.0
	_rays.mouse_filter = MOUSE_FILTER_IGNORE
	stage.add_child(_rays)
	_viewer = ModelViewer.new()
	_viewer.set_anchors_preset(PRESET_FULL_RECT)
	_viewer.draggable = false
	_viewer.yaw = 0.6
	_viewer.pitch = 0.45
	_viewer.pad = 1.15
	stage.add_child(_viewer)
	# rare guarantee
	_pity_label = Ui.label("", "Small", HORIZONTAL_ALIGNMENT_CENTER)
	col.add_child(_pity_label)
	_pity_bar = ProgressBar.new()
	_pity_bar.custom_minimum_size = Vector2(0, 28)
	_pity_bar.max_value = 10
	_pity_bar.show_percentage = false
	col.add_child(_pity_bar)
	# boxes
	var boxes := HBoxContainer.new()
	boxes.alignment = BoxContainer.ALIGNMENT_CENTER
	col.add_child(boxes)
	for kind in BOXES:
		var b := Ui.button("", "PillButton")
		b.toggle_mode = true
		b.size_flags_horizontal = SIZE_EXPAND_FILL
		b.clip_text = true
		b.add_theme_font_size_override("font_size", 21)
		b.pressed.connect(_choose.bind(kind))
		boxes.add_child(b)
		_box_buttons[kind] = b
	_family_row = HBoxContainer.new()
	_family_row.alignment = BoxContainer.ALIGNMENT_CENTER
	_family_row.add_theme_constant_override("separation", 4)
	col.add_child(_family_row)
	for h in GameData.houses():
		var fb := Button.new()
		fb.flat = true
		fb.toggle_mode = true
		fb.icon = ArtLibrary.portrait(StringName(GameData.building(h).get("emblem", "")))
		fb.expand_icon = true
		fb.custom_minimum_size = Vector2(76, 76)
		fb.tooltip_text = Text.t(StringName(GameData.building(h).get("family", "")))
		fb.focus_mode = FOCUS_NONE
		fb.pressed.connect(_choose_family.bind(h))
		fb.name = String(h)
		_family_row.add_child(fb)
	# odds, always shown before the box
	var odds_card := PanelContainer.new()
	odds_card.theme_type_variation = "Card"
	col.add_child(odds_card)
	_odds = VBoxContainer.new()
	_odds.add_theme_constant_override("separation", 4)
	odds_card.add_child(_odds)
	_open = Ui.button("", "BigButton", "box")
	_open.pressed.connect(open_box)
	outer.add_child(_open)
	Economy.changed.connect(_refresh)
	Collection.changed.connect(_refresh)


## args: {"family": house id} preselects that family for a Family Box (from a missing squishy in the book).
func open(args: Dictionary) -> void:
	if args.has("family"):
		_family = StringName(args["family"])
	_close_result()
	Audio.music(&"shop")
	_show_box()
	_refresh()


func screen_shown() -> void:
	Audio.music(&"shop")
	_refresh()


func _choose(kind: StringName) -> void:
	if _busy:
		return
	_box = kind
	_close_result()
	_show_box()
	_refresh()


func _choose_family(h: StringName) -> void:
	_family = h
	_refresh()


func _refresh() -> void:
	if _title == null:
		return
	var factory_level := Town.level(&"factory")
	_title.text = Text.t(&"building.factory.name") + " · " + Text.t(&"map.level", {"n": factory_level})
	var econ := GameData.economy()
	for kind in BOXES:
		var box: Dictionary = econ["boxes"][String(kind)]
		var b := _box_buttons[kind]
		var locked := factory_level < int(box["factoryLevel"])
		b.text = Text.t(StringName("factory.box_" + String(kind))) + "\n" + (Text.t(&"factory.needs_level", {"n": int(box["factoryLevel"])}) if locked else Text.t(&"factory.price", {"n": Ui.number(int(box["price"]))}))
		b.disabled = locked
		b.button_pressed = kind == _box
	_family_row.visible = _box == &"family"
	for fb in _family_row.get_children():
		(fb as Button).button_pressed = StringName(fb.name) == _family
		(fb as Button).modulate = Color.WHITE if StringName(fb.name) == _family else Color(1, 1, 1, 0.55)
	# rare guarantee
	var until := Collection.boxes_until_rare()
	_pity_bar.value = 10 - until
	_pity_label.text = Text.t(&"factory.rare_in", {"n": until}) if until > 1 else Text.t(&"factory.rare_next")
	# odds
	for c in _odds.get_children():
		c.queue_free()
	_odds.add_child(Ui.label(Text.t(&"factory.odds_title"), "Eyebrow"))
	var odds: Dictionary = econ["boxes"][String(_box)]["odds"]
	for r: String in RARITIES:
		var row := HBoxContainer.new()
		var dot := ColorRect.new()
		dot.color = UiTheme.RARITY[r]
		dot.custom_minimum_size = Vector2(24, 24)
		dot.size_flags_vertical = SIZE_SHRINK_CENTER
		row.add_child(dot)
		var name_label := Ui.label(Text.t(StringName("rarity.%s.name" % r)))
		name_label.size_flags_horizontal = SIZE_EXPAND_FILL
		row.add_child(name_label)
		row.add_child(Ui.label("%s%%" % _pct(float(odds.get(r, 0)))))
		_odds.add_child(row)
	_odds.add_child(Ui.label(Text.t(&"factory.odds_note"), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
	# open button
	var blocker := Collection.box_blocker(_box, factory_level)
	var price := int(econ["boxes"][String(_box)]["price"])
	_open.text = Text.t(&"factory.open", {"n": Ui.number(price)})
	_open.disabled = _busy or blocker != &""


func _pct(v: float) -> String:
	return str(int(v)) if is_equal_approx(v, roundf(v)) else str(v)


func _show_box() -> void:
	var path := "res://art/models/boxes/box_%s.glb" % _box
	if ResourceLoader.exists(path):
		var node := (load(path) as PackedScene).instantiate() as Node3D
		_viewer.set_model(node)


# ---------------------------------------------------------------- opening

## Pay, wiggle, burst, reveal (factory.html demo timings: wiggle 0.55 s, reveal sound 0.12 s after the pop).
func open_box() -> void:
	if _busy:
		return
	var blocker := Collection.box_blocker(_box, Town.level(&"factory"))
	if blocker != &"":
		Audio.play(&"nope")
		return
	_busy = true
	_close_result()
	_refresh()
	_show_box()
	Audio.play(&"boxShake")
	await _wiggle()
	var answer: Dictionary = await Collection.open_box(_box, _family if _box == &"family" else &"", Town.level(&"factory"))
	if not answer.get("ok", false):
		_busy = false
		_refresh()
		UiToast.show_text(Text.t(&"ui.offline") if answer.get("error") == &"offline" else Text.t(&"factory.cannot_open"))
		return
	Audio.play(&"boxPop")
	var rarity: String = answer["rarity"]
	var big := rarity in ["E", "L"]
	Haptics.play(&"big_reveal" if big else &"medium")
	_burst(UiTheme.RARITY.get(rarity, Color.WHITE), big)
	var squishy := ArtLibrary.squishy(StringName(answer["squishy"]))
	if squishy:
		var node := squishy.instantiate() as Node3D
		_viewer.set_model(node)
		_pop_in(node)
	await get_tree().create_timer(0.12).timeout
	# the rarer, the longer and fancier the tune; a squishy you have already gets the Spare Shelf "boop-boop"
	Audio.play(StringName("reveal" + rarity) if answer["is_new"] else &"spare")
	if answer["sparkly"]:
		Audio.play(&"sparkly")
	await get_tree().create_timer(1.2 if big else 0.5).timeout
	_busy = false
	_show_result(answer)
	_refresh()


func _wiggle() -> void:
	var m := _viewer.model
	if m == null or Settings.reduced_motion():
		await get_tree().create_timer(0.3).timeout
		return
	var t := create_tween()
	for i in 6:
		t.tween_property(m, "rotation:z", 0.18 if i % 2 == 0 else -0.18, 0.08)
	t.tween_property(m, "rotation:z", 0.0, 0.07)
	await t.finished


func _pop_in(node: Node3D) -> void:
	if Settings.reduced_motion():
		return
	node.scale = Vector3.ONE * 0.2
	create_tween().tween_property(node, "scale", Vector3.ONE, 0.45).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


## Light rays in the rarity colour. Epic and Legendary spin faster and stay longer.
func _burst(colour: Color, big: bool) -> void:
	_rays.texture = _ray_texture(colour)
	_rays.modulate.a = 0.0
	_rays.scale = Vector2(0.4, 0.4)
	var t := create_tween().set_parallel(true)
	t.tween_property(_rays, "modulate:a", 1.0, 0.2)
	t.tween_property(_rays, "scale", Vector2.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if not Settings.reduced_motion():
		t.tween_property(_rays, "rotation", _rays.rotation + (TAU if big else PI / 2.0), 3.0 if big else 2.0)


func _ray_texture(colour: Color) -> Texture2D:
	var wedges := ""
	for i in 12:
		var a := i * TAU / 12.0
		var b := a + TAU / 28.0
		wedges += '<path d="M100 100 L%.1f %.1f L%.1f %.1f Z"/>' % [100 + cos(a) * 100, 100 + sin(a) * 100, 100 + cos(b) * 100, 100 + sin(b) * 100]
	var svg := '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512"><defs><radialGradient id="g"><stop offset="0" stop-color="#%s" stop-opacity=".9"/><stop offset="1" stop-color="#%s" stop-opacity="0"/></radialGradient></defs><g fill="url(#g)">%s</g><circle cx="100" cy="100" r="34" fill="#%s" opacity=".35"/></svg>' % [colour.to_html(false), colour.to_html(false), wedges, colour.to_html(false)]
	var img := Image.new()
	img.load_svg_from_string(svg)
	return ImageTexture.create_from_image(img)


# ---------------------------------------------------------------- result card

func _show_result(answer: Dictionary) -> void:
	var id := StringName(answer["squishy"])
	var info := GameData.squishy(id)
	var house := StringName(info.get("family", ""))
	_result = Control.new()
	_result.set_anchors_preset(PRESET_FULL_RECT)
	var dim := ColorRect.new()
	dim.color = Color(UiTheme.DIM.r, UiTheme.DIM.g, UiTheme.DIM.b, 0.25)
	dim.set_anchors_preset(PRESET_FULL_RECT)
	_result.add_child(dim)
	var holder := MarginContainer.new()
	holder.set_anchors_and_offsets_preset(PRESET_BOTTOM_WIDE)
	holder.grow_vertical = GROW_DIRECTION_BEGIN
	for side: String in ["left", "right"]:
		holder.add_theme_constant_override("margin_" + side, 28)
	holder.add_theme_constant_override("margin_bottom", 170)
	_result.add_child(holder)
	var card := PanelContainer.new()
	card.theme_type_variation = "Card"
	holder.add_child(card)
	var col := VBoxContainer.new()
	col.alignment = BoxContainer.ALIGNMENT_CENTER
	card.add_child(col)
	var rarity: String = answer["rarity"]
	var tag := Ui.label(("%s · " % Text.t(&"factory.sparkly") if answer["sparkly"] else "") + Text.t(StringName("rarity.%s.name" % rarity)), "Eyebrow", HORIZONTAL_ALIGNMENT_CENTER)
	tag.add_theme_color_override("font_color", UiTheme.RARITY.get(rarity, UiTheme.INK2))
	col.add_child(tag)
	col.add_child(Ui.label(Text.t(StringName(info.get("name", ""))), "Heading", HORIZONTAL_ALIGNMENT_CENTER, true))
	var house_name := Text.t(StringName(GameData.building(house).get("name", "")))
	if answer["is_new"]:
		col.add_child(Ui.label(Text.t(&"factory.new_moves_in", {"house": house_name}), "Hand", HORIZONTAL_ALIGNMENT_CENTER, true))
	else:
		col.add_child(Ui.label(Text.t(&"factory.to_shelf", {"n": int((answer["entry"] as Dictionary).get("spares", 1))}), "Hand", HORIZONTAL_ALIGNMENT_CENTER, true))
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	col.add_child(row)
	if answer["is_new"]:
		var see := Ui.button(Text.t(&"factory.see_move_in"), "BigButton")
		see.pressed.connect(func() -> void: Nav.back())
		row.add_child(see)
	else:
		var shelf := Ui.button(Text.t(&"factory.spare_shelf"), "BigButton", "shelf")
		shelf.pressed.connect(func() -> void:
			# the result is done with: coming back shows the box again, not the old message
			_close_result()
			_show_box()
			Nav.go(&"collection", {"tab": &"shelf"}))
		row.add_child(shelf)
	var again := Ui.button(Text.t(&"factory.another"))
	again.pressed.connect(func() -> void:
		_close_result()
		_show_box())
	row.add_child(again)
	add_child(_result)
	if not Settings.reduced_motion():
		card.modulate.a = 0.0
		create_tween().tween_property(card, "modulate:a", 1.0, 0.2)


func _close_result() -> void:
	if _result != null:
		_result.queue_free()
		_result = null
	if _rays:
		_rays.modulate.a = 0.0
