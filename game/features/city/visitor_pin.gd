class_name VisitorPin
extends MapBubble
## The pin over the Visitor of the week in the park: the visitor's picture in a pink ring, with a yellow "!" chip
## while today's hi is still to be said. Its name ("Visitor: Mochi") shows underneath when zoomed in.

var squishy: StringName = &""


static func make_for(id: StringName) -> VisitorPin:
	var b := VisitorPin.new()
	b.id = &"visitor"
	b._build()
	b.show_visitor(id, false)
	return b


func _build() -> void:
	_colour = UiTheme.PINK
	flat = true
	focus_mode = FOCUS_NONE
	custom_minimum_size = Vector2(SIZE, SIZE + TAIL)
	size = custom_minimum_size
	pivot_offset = Vector2(SIZE / 2.0, SIZE + TAIL)
	_icon_box = Control.new()
	_icon_box.position = Vector2(14, 14)
	_icon_box.size = Vector2(SIZE - 28, SIZE - 28)
	_icon_box.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_icon_box)
	_chip = Ui.label("!", "", HORIZONTAL_ALIGNMENT_CENTER)
	_chip.add_theme_font_override("font", UiTheme.font(900))
	_chip.add_theme_font_size_override("font_size", 26)
	_chip.add_theme_color_override("font_color", UiTheme.INK)
	_chip.custom_minimum_size = Vector2(42, 42)
	_chip.position = Vector2(SIZE - 30, -12)
	_chip.mouse_filter = MOUSE_FILTER_IGNORE
	var chip_bg := StyleBoxFlat.new()
	chip_bg.bg_color = UiTheme.SUN
	chip_bg.border_color = UiTheme.INK
	chip_bg.set_border_width_all(4)
	chip_bg.set_corner_radius_all(999)
	_chip.add_theme_stylebox_override("normal", chip_bg)
	add_child(_chip)
	_name = Ui.label("", "", HORIZONTAL_ALIGNMENT_CENTER)
	_name.add_theme_font_size_override("font_size", 24)
	_name.add_theme_font_override("font", UiTheme.font(900))
	var pill := ToyStyleBox.new()
	pill.radius = 999
	pill.line_width = 4
	pill.shadow = Vector2(4, 4)
	pill.pad = Vector4(18, 8, 18, 8)
	_name.add_theme_stylebox_override("normal", pill)
	_name.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_name)


## Who is visiting, and whether today's hi is still to be said (the "!" chip).
func show_visitor(id: StringName, waiting: bool) -> void:
	_chip.visible = waiting
	if id == squishy:
		return
	squishy = id
	for c in _icon_box.get_children():
		c.queue_free()
	var tex := ArtLibrary.portrait(id) if id != &"" else null
	if tex:
		_icon_box.add_child(_fill(Ui.texture(tex, Vector2.ZERO)))
	var name_text := Text.t(StringName(GameData.squishy(id).get("name", ""))) if id != &"" else ""
	_name.text = Text.t(&"visitor.pin", {"name": name_text})
	_name.reset_size()
	_name.position = Vector2(SIZE / 2.0 - _name.size.x / 2.0, -_name.size.y - 10)
	tooltip_text = _name.text
	queue_redraw()
