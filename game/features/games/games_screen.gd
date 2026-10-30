extends Control
## The Games page (guide.html#games): every minigame in one place, opened from the pink Games button on the map.
## A card per game with its building, your best score and Play; games still being made are shown below, greyed,
## as "on the way". Playing works exactly like from the building (same host, same coins and goals).

## Fun buildings that are shops, not games.
const NOT_GAMES := [&"factory", &"market", &"gemmine"]

var _list: VBoxContainer


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
	var spacer := Control.new()
	spacer.size_flags_horizontal = SIZE_EXPAND_FILL
	top.add_child(spacer)
	var wallet := WalletBar.new()
	wallet.size_flags_vertical = SIZE_SHRINK_BEGIN
	top.add_child(wallet)
	col.add_child(Ui.label(Text.t(&"games.title"), "Title"))
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)
	_list = VBoxContainer.new()
	_list.size_flags_horizontal = SIZE_EXPAND_FILL
	_list.add_theme_constant_override("separation", 18)
	scroll.add_child(_list)
	refresh()
	Audio.music(&"city")


func screen_shown() -> void:
	refresh()
	Audio.music(&"city")


## The buildings that have (or will have) a minigame, in map order: [playable], [coming].
static func game_buildings() -> Array:
	var playable: Array[StringName] = []
	var coming: Array[StringName] = []
	for b: Dictionary in GameData.buildings():
		var id := StringName(b.get("id", ""))
		if b.get("type") == "house" or b.get("single", false) or id in NOT_GAMES:
			continue
		if GameData.minigame_for(id) != &"":
			playable.append(id)
		else:
			coming.append(id)
	return [playable, coming]


func refresh() -> void:
	for c in _list.get_children():
		c.queue_free()
	var lists := game_buildings()
	for id: StringName in lists[0]:
		_list.add_child(_game_card(id))
	if not (lists[1] as Array).is_empty():
		_list.add_child(Ui.label(Text.t(&"games.more_soon"), "Heading"))
		var grid := GridContainer.new()
		grid.columns = 2
		grid.add_theme_constant_override("h_separation", 14)
		grid.add_theme_constant_override("v_separation", 14)
		for id: StringName in lists[1]:
			grid.add_child(_soon_chip(id))
		_list.add_child(grid)


func _game_card(id: StringName) -> Control:
	var info: Dictionary = GameData.minigames.get(id, {})
	var card := PanelContainer.new()
	card.theme_type_variation = "Card"
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 18)
	card.add_child(row)
	var badge := Ui.texture(ArtLibrary.badge(id), Vector2(120, 120))
	badge.size_flags_vertical = SIZE_SHRINK_CENTER
	row.add_child(badge)
	var words := VBoxContainer.new()
	words.size_flags_horizontal = SIZE_EXPAND_FILL
	words.add_theme_constant_override("separation", 2)
	row.add_child(words)
	words.add_child(Ui.label(Text.t(StringName(info.get("title", ""))), "Heading", HORIZONTAL_ALIGNMENT_LEFT, true))
	words.add_child(Ui.label(Text.t(StringName(GameData.building(id).get("name", ""))), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
	var best := int((Save.section(&"minigames").get(String(info.get("id", "")), {}) as Dictionary).get("best", 0))
	if best > 0:
		words.add_child(Ui.label(Text.t(&"games.best", {"n": Ui.number(best), "what": Text.t(StringName(info.get("score_name", "")))}), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
	var built := Town.level(id) > 0
	var go: Button
	if built:
		go = Ui.button(Text.t(&"games.play"), "BigButton", "play")
		go.pressed.connect(func() -> void: Nav.go(&"minigame", {"building": id}))
	else:
		words.add_child(Ui.label(Text.t(&"games.build_first"), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
		go = Ui.button(Text.t(&"games.show_me"), "PillButton")
		go.pressed.connect(func() -> void:
			Nav.back()
			Events.show_building.emit(id))
	go.size_flags_vertical = SIZE_SHRINK_CENTER
	go.name = "Go_%s" % id
	row.add_child(go)
	return card


func _soon_chip(id: StringName) -> Control:
	var chip := PanelContainer.new()
	var box := ToyStyleBox.new()
	box.fill = Color("#F4F1FA")
	box.radius = 28
	box.shadow = Vector2.ZERO
	box.line_width = 3
	box.pad = Vector4(14, 10, 14, 10)
	chip.add_theme_stylebox_override("panel", box)
	chip.size_flags_horizontal = SIZE_EXPAND_FILL
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	chip.add_child(row)
	var badge := Ui.texture(ArtLibrary.badge(id), Vector2(60, 60))
	badge.modulate = Color(1, 1, 1, 0.55)
	row.add_child(badge)
	var name_label := Ui.label(Text.t(StringName(GameData.building(id).get("name", ""))), "Small", HORIZONTAL_ALIGNMENT_LEFT, true)
	name_label.size_flags_vertical = SIZE_SHRINK_CENTER
	row.add_child(name_label)
	return chip
