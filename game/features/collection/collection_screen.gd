extends Control
## The collection book and the Spare Shelf (guide.html #collection, factory.html).
## Book: every squishy by family; ones not found yet are soft silhouettes. Sparkly: the book's second page.
## Spare Shelf: copies you got twice. Use them to level that squishy up (level 5 = Sparkly) or swap them for
## Squish Stars. (Trading at the Market comes with the server, Step 4.)

var _tab: StringName = &"book"
var _tabs: Dictionary[StringName, Button] = {}
var _count: Label
var _list: VBoxContainer


func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	var bg := ColorRect.new()
	bg.color = Color("#FFF8EC")
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
	var spacer := Control.new()
	spacer.size_flags_horizontal = SIZE_EXPAND_FILL
	top.add_child(spacer)
	var wallet := WalletBar.new()
	wallet.size_flags_vertical = SIZE_SHRINK_BEGIN
	top.add_child(wallet)
	col.add_child(Ui.label(Text.t(&"collection.title"), "Title"))
	_count = Ui.label("", "Small")
	col.add_child(_count)
	var tabs := HBoxContainer.new()
	col.add_child(tabs)
	for t: StringName in [&"book", &"sparkly", &"shelf"]:
		var b := Ui.button(Text.t(StringName("collection.tab_" + String(t))), "PillButton")
		b.toggle_mode = true
		b.pressed.connect(show_tab.bind(t))
		tabs.add_child(b)
		_tabs[t] = b
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)
	_list = VBoxContainer.new()
	_list.size_flags_horizontal = SIZE_EXPAND_FILL
	_list.add_theme_constant_override("separation", 18)
	scroll.add_child(_list)
	Collection.changed.connect(_rebuild)


func open(args: Dictionary) -> void:
	Audio.music(&"shop")
	show_tab(StringName(args.get("tab", &"book")))


func screen_shown() -> void:
	_rebuild()


func show_tab(tab: StringName) -> void:
	_tab = tab
	for t: StringName in _tabs:
		_tabs[t].button_pressed = t == tab
	_rebuild()


func _rebuild() -> void:
	if _list == null:
		return
	var total := GameData.squishies().size()
	_count.text = Text.t(&"collection.sparkly_owned", {"n": Collection.sparkly_count(), "total": total}) if _tab == &"sparkly" else Text.t(&"collection.owned", {"n": Collection.owned_count(), "total": total})
	for c in _list.get_children():
		c.queue_free()
	if _tab == &"shelf":
		_build_shelf()
	else:
		_build_book(_tab == &"sparkly")


# ---------------------------------------------------------------- book

func _build_book(sparkly_page: bool) -> void:
	for h in GameData.houses():
		var section := VBoxContainer.new()
		section.add_child(Ui.label(Text.t(StringName(GameData.building(h).get("family", ""))), "Heading"))
		var grid := GridContainer.new()
		grid.columns = 3
		grid.add_theme_constant_override("h_separation", 12)
		grid.add_theme_constant_override("v_separation", 12)
		section.add_child(grid)
		for id in GameData.family(h):
			grid.add_child(_tile(id, sparkly_page))
		_list.add_child(section)


func _tile(id: StringName, sparkly_page: bool) -> Control:
	var info := GameData.squishy(id)
	var rarity := String(info.get("rarity", "C"))
	var e := Collection.entry(id)
	var have: bool = not e.is_empty() and (not sparkly_page or bool(e.get("sparkly", false)))
	var card := PanelContainer.new()
	var st := ToyStyleBox.new()
	st.radius = 26
	st.line = UiTheme.RARITY[rarity] if have else Color("#D8D2EA")
	st.shadow = Vector2(4, 4) if have else Vector2.ZERO
	st.fill = Color("#FFF7D6") if have and e.get("sparkly", false) else Color.WHITE
	st.pad = Vector4(10, 10, 10, 10)
	card.add_theme_stylebox_override("panel", st)
	card.size_flags_horizontal = SIZE_EXPAND_FILL
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 2)
	card.add_child(col)
	var pic := Ui.texture(ArtLibrary.portrait(id), Vector2(150, 150))
	if not have:
		pic.modulate = Color(0.17, 0.13, 0.25, 0.18)
	col.add_child(pic)
	var name_label := Ui.label(Text.t(StringName(info.get("name", ""))) if have else Text.t(&"collection.not_found"), "", HORIZONTAL_ALIGNMENT_CENTER, true)
	name_label.add_theme_font_size_override("font_size", 22)
	col.add_child(name_label)
	if have:
		var line := Text.t(StringName("rarity.%s.name" % rarity)) + " · " + Text.t(&"collection.level", {"n": int(e.get("level", 1))})
		var sub := Ui.label(line, "Small", HORIZONTAL_ALIGNMENT_CENTER)
		sub.add_theme_font_size_override("font_size", 18)
		sub.add_theme_color_override("font_color", UiTheme.RARITY[rarity])
		col.add_child(sub)
	return card


# ---------------------------------------------------------------- spare shelf

func _build_shelf() -> void:
	var ids := Collection.spare_ids()
	if ids.is_empty():
		_list.add_child(Ui.label(Text.t(&"collection.shelf_empty"), "Hand", HORIZONTAL_ALIGNMENT_LEFT, true))
		return
	for id in ids:
		_list.add_child(_shelf_row(id))
	_list.add_child(Ui.label(Text.t(&"collection.trade_soon"), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))


func _shelf_row(id: StringName) -> Control:
	var info := GameData.squishy(id)
	var e := Collection.entry(id)
	var rarity := String(info.get("rarity", "C"))
	var card := PanelContainer.new()
	card.theme_type_variation = "Card"
	var row := HBoxContainer.new()
	card.add_child(row)
	row.add_child(Ui.texture(ArtLibrary.portrait(id), Vector2(140, 140)))
	var col := VBoxContainer.new()
	col.size_flags_horizontal = SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 6)
	row.add_child(col)
	var name_label := Ui.label(Text.t(StringName(info.get("name", ""))), "", HORIZONTAL_ALIGNMENT_LEFT, true)
	name_label.add_theme_font_override("font", UiTheme.font(900))
	col.add_child(name_label)
	col.add_child(Ui.label(Text.t(StringName("rarity.%s.name" % rarity)) + " · " + Text.t(&"collection.level", {"n": int(e["level"])}) + " · " + Text.t(&"collection.spares", {"n": int(e["spares"])}), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
	var need := Collection.spares_for_next_level(id)
	if need == 0:
		col.add_child(Ui.label(Text.t(&"collection.max_level"), "Hand"))
	else:
		var up := Ui.button(Text.t(&"collection.level_up", {"n": need}), "BigButton")
		up.add_theme_font_size_override("font_size", 28)
		up.disabled = int(e["spares"]) < need
		up.pressed.connect(_level_up.bind(id))
		col.add_child(up)
	var stars := int(GameData.economy()["starsPerSpare"].get(rarity, 0))
	var swap := Ui.button(Text.t(&"collection.swap", {"n": stars}), "", "star")
	swap.pressed.connect(_swap.bind(id, stars))
	col.add_child(swap)
	return card


func _level_up(id: StringName) -> void:
	var answer: Dictionary = await Collection.level_up(id)
	if not answer.get("ok", false):
		Audio.play(&"nope")
		return
	var level := int(answer["entry"]["level"])
	Audio.play(&"sparkly" if answer["entry"].get("sparkly", false) and level >= 5 else &"unlock")
	Haptics.play(&"light")
	UiToast.show_text(Text.t(&"collection.levelled", {"name": Text.t(StringName(GameData.squishy(id).get("name", ""))), "n": level}))


func _swap(id: StringName, stars: int) -> void:
	var name_text := Text.t(StringName(GameData.squishy(id).get("name", "")))
	if not await UiPopup.ask(Text.t(&"collection.swap_title", {"name": name_text, "n": stars}), Text.t(&"collection.swap_body"), Text.t(&"ui.yes"), Text.t(&"ui.not_now")):
		return
	var answer: Dictionary = await Collection.swap_spare(id)
	if answer.get("ok", false):
		Audio.play(&"star")
		Haptics.play(&"light")
	else:
		Audio.play(&"nope")
