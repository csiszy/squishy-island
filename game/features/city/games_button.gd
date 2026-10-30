class_name GamesButton
extends Button
## The round pink "Games" button in the map's bottom-left corner (guide.html#games): bigger and brighter than the
## little white buttons, so it is easy to find, but it stays still (one small hop when the map appears).

const SIZE := 132.0

var _tag: PanelContainer


func _init() -> void:
	custom_minimum_size = Vector2(SIZE, SIZE + 22)
	flat = true
	focus_mode = FOCUS_NONE
	tooltip_text = Text.t(&"games.open")
	for state: String in ["normal", "hover", "pressed", "disabled", "focus"]:
		add_theme_stylebox_override(state, StyleBoxEmpty.new())
	var ball := PanelContainer.new()
	var round_box := ToyStyleBox.new()
	round_box.fill = UiTheme.PINK
	round_box.radius = 999
	round_box.shadow = Vector2(6, 6)
	round_box.line_width = 5
	ball.add_theme_stylebox_override("panel", round_box)
	ball.mouse_filter = MOUSE_FILTER_IGNORE
	ball.position = Vector2.ZERO
	ball.size = Vector2(SIZE, SIZE)
	add_child(ball)
	var pic := Ui.texture(Ui.icon("games"), Vector2(84, 84))
	pic.mouse_filter = MOUSE_FILTER_IGNORE
	pic.position = Vector2((SIZE - 84) / 2.0, (SIZE - 84) / 2.0 - 10)
	add_child(pic)
	_tag = PanelContainer.new()
	var pill := ToyStyleBox.new()
	pill.radius = 999
	pill.shadow = Vector2(3, 3)
	pill.line_width = 4
	pill.pad = Vector4(16, 2, 16, 4)
	_tag.add_theme_stylebox_override("panel", pill)
	_tag.mouse_filter = MOUSE_FILTER_IGNORE
	var words := Ui.label(Text.t(&"games.button"), "")
	words.add_theme_font_override("font", UiTheme.display_font())
	words.add_theme_font_size_override("font_size", 28)
	_tag.add_child(words)
	add_child(_tag)
	_tag.resized.connect(func() -> void: _tag.position = Vector2((SIZE - _tag.size.x) / 2.0, SIZE - 34.0))


## A small hop to say "I'm here" (when the map appears; never repeating).
func hop() -> void:
	if Settings.reduced_motion() or not is_inside_tree():
		return
	pivot_offset = Vector2(SIZE / 2.0, SIZE)
	var t := create_tween()
	t.tween_property(self, "scale", Vector2(1.08, 0.92), 0.12)
	t.tween_property(self, "scale", Vector2(0.96, 1.06), 0.14)
	t.tween_property(self, "scale", Vector2.ONE, 0.3).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
