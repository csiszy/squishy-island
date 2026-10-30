class_name BuildingCard
extends MarginContainer
## The card that slides up when a building is tapped on the map: what it is, its level, what it needs next and
## its buttons (BuildingCardModel decides which). Pressing a button sends `action`; the map does the rest.

signal action(building: StringName, action: StringName)

var building: StringName = &""
var _panel: PanelContainer
var _kind: Label
var _title: Label
var _level: Label
var _note: Label
var _buttons: HFlowContainer


func _ready() -> void:
	set_anchors_and_offsets_preset(PRESET_BOTTOM_WIDE)
	grow_vertical = GROW_DIRECTION_BEGIN
	mouse_filter = MOUSE_FILTER_IGNORE
	for side: String in ["left", "right"]:
		add_theme_constant_override("margin_" + side, 24)
	add_theme_constant_override("margin_bottom", 40)
	_panel = PanelContainer.new()
	_panel.theme_type_variation = "Card"
	add_child(_panel)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 10)
	_panel.add_child(col)
	var top := HBoxContainer.new()
	col.add_child(top)
	var words := VBoxContainer.new()
	words.size_flags_horizontal = SIZE_EXPAND_FILL
	words.add_theme_constant_override("separation", 2)
	top.add_child(words)
	_kind = Ui.label("", "Eyebrow")
	_title = Ui.label("", "Heading", HORIZONTAL_ALIGNMENT_LEFT, true)
	_level = Ui.label("", "Small")
	words.add_child(_kind)
	words.add_child(_title)
	words.add_child(_level)
	var close := Ui.icon_button("close", Text.t(&"ui.close"))
	close.custom_minimum_size = Vector2(72, 72)
	close.size_flags_vertical = SIZE_SHRINK_BEGIN
	close.pressed.connect(close_card)
	top.add_child(close)
	_note = Ui.label("", "Hand", HORIZONTAL_ALIGNMENT_LEFT, true)
	col.add_child(_note)
	# buttons sit side by side when they fit, otherwise the next one goes on a new line (never off the screen)
	_buttons = HFlowContainer.new()
	_buttons.add_theme_constant_override("h_separation", 16)
	_buttons.add_theme_constant_override("v_separation", 14)
	col.add_child(_buttons)
	visible = false


func show_building(id: StringName) -> void:
	building = id
	refresh()
	if not visible:
		visible = true
		if not Settings.reduced_motion():
			_panel.position.y = 300
			create_tween().tween_property(_panel, "position:y", 0.0, 0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func refresh() -> void:
	if building == &"" or _panel == null:
		return
	var m := BuildingCardModel.for_building(building, Town, Collection, Economy)
	_kind.text = m["kind"]
	_title.text = m["title"]
	_level.text = m["level_text"]
	_level.visible = m["level_text"] != ""
	_note.text = m["note"]
	_note.visible = m["note"] != ""
	for c in _buttons.get_children():
		c.queue_free()
	var first := true
	for a: Dictionary in m["actions"]:
		var b := Ui.button(a["text"], "BigButton" if first else "")
		b.disabled = not a["enabled"]
		b.size_flags_horizontal = SIZE_EXPAND_FILL
		var what: StringName = a["id"]
		b.pressed.connect(func() -> void: action.emit(building, what))
		_buttons.add_child(b)
		first = false


func close_card() -> void:
	if visible:
		Audio.play(&"back")
	close()


func close() -> void:
	visible = false
	building = &""
