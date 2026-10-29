class_name MapBubble
extends Button
## The round sticker floating over a building on the map: what it is at a glance (fun buildings: their icon;
## houses: a little house in the family colour with the family's emblem squishy), plus a chip with its level,
## a lock, or a "+" on an empty plot. Its name shows underneath when zoomed in (art/city3d.js, map-bub).

const SIZE := 104.0

var id: StringName
var _chip: Label
var _name: Label
var _icon_box: Control

static var _house_icons: Dictionary = {}


static func make(building_id: StringName) -> MapBubble:
	var b := MapBubble.new()
	b.id = building_id
	b._build()
	return b


func _build() -> void:
	var info := GameData.building(id)
	flat = true
	focus_mode = FOCUS_NONE
	custom_minimum_size = Vector2(SIZE, SIZE)
	size = Vector2(SIZE, SIZE)
	pivot_offset = Vector2(SIZE / 2.0, SIZE)
	var circle := Panel.new()
	var st := ToyStyleBox.new()
	st.radius = 999
	st.line_width = 5
	st.shadow = Vector2(4, 4)
	st.fill = Color.WHITE
	circle.add_theme_stylebox_override("panel", st)
	circle.set_anchors_preset(PRESET_FULL_RECT)
	circle.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(circle)
	_icon_box = Control.new()
	_icon_box.set_anchors_and_offsets_preset(PRESET_FULL_RECT, PRESET_MODE_KEEP_SIZE, 14)
	_icon_box.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_icon_box)
	if info.get("type") == "house":
		_icon_box.add_child(_fill(Ui.texture(house_icon(Color(str(info.get("color", "#FF6FA3")))), Vector2.ZERO)))
		if info.get("emblem"):
			var emb := Ui.texture(ArtLibrary.portrait(StringName(info["emblem"])), Vector2.ZERO)
			emb.set_anchors_preset(PRESET_FULL_RECT)
			emb.offset_left = 18
			emb.offset_right = -18
			emb.offset_top = 26
			emb.offset_bottom = -2
			_icon_box.add_child(emb)
	else:
		var tex := ArtLibrary.badge(id)
		if tex:
			_icon_box.add_child(_fill(Ui.texture(tex, Vector2.ZERO)))
	_chip = Ui.label("", "", HORIZONTAL_ALIGNMENT_CENTER)
	_chip.add_theme_font_override("font", UiTheme.font(900))
	_chip.add_theme_font_size_override("font_size", 24)
	_chip.add_theme_color_override("font_color", Color.WHITE)
	var chip_bg := StyleBoxFlat.new()
	chip_bg.bg_color = Color(str(info.get("color", "#FF6FA3")))
	chip_bg.border_color = UiTheme.INK
	chip_bg.set_border_width_all(4)
	chip_bg.set_corner_radius_all(999)
	chip_bg.content_margin_left = 8
	chip_bg.content_margin_right = 8
	_chip.add_theme_stylebox_override("normal", chip_bg)
	_chip.position = Vector2(SIZE - 36, SIZE - 38)
	_chip.custom_minimum_size = Vector2(44, 40)
	_chip.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_chip)
	_name = Ui.label(Text.t(StringName(info.get("name", ""))), "", HORIZONTAL_ALIGNMENT_CENTER)
	_name.autowrap_mode = TextServer.AUTOWRAP_OFF
	_name.add_theme_font_size_override("font_size", 24)
	var pill := StyleBoxFlat.new()
	pill.bg_color = Color.WHITE
	pill.border_color = UiTheme.INK
	pill.set_border_width_all(3)
	pill.set_corner_radius_all(999)
	pill.content_margin_left = 14
	pill.content_margin_right = 14
	_name.add_theme_stylebox_override("normal", pill)
	_name.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_name)
	_name.reset_size()
	_name.position = Vector2(SIZE / 2.0 - _name.size.x / 2.0, SIZE + 4)


## Level chip: a number, a lock, a plus (empty plot) or nothing (the one-level Gem Mine).
func show_state(level: int, locked: bool) -> void:
	var info := GameData.building(id)
	var house: bool = info.get("type") == "house"
	if info.get("single", false):
		_chip.visible = false
	elif locked:
		_chip.text = ""
		_chip.custom_minimum_size = Vector2(44, 40)
		_chip.visible = true
		if _chip.get_child_count() == 0:
			var lock := Ui.texture(Ui.icon("lock"), Vector2(30, 30))
			lock.position = Vector2(7, 5)
			_chip.add_child(lock)
	else:
		for c in _chip.get_children():
			c.queue_free()
		_chip.text = "+" if level == 0 and not house else str(maxi(1, level) if house else level)
		_chip.visible = true
	modulate = Color(1, 1, 1, 0.8) if locked else Color.WHITE
	tooltip_text = Text.t(StringName(info.get("name", "")))


## Put the bubble so that its bottom middle sits on `point` (screen), at this size (map zoom).
func place(point: Vector2, scale_factor: float, show_name: bool) -> void:
	scale = Vector2.ONE * scale_factor
	position = point - Vector2(SIZE / 2.0, SIZE)
	_name.visible = show_name


func _fill(c: Control) -> Control:
	c.set_anchors_preset(PRESET_FULL_RECT)
	return c


## A little house in the family colour (the book's bb-house badge), made once per colour.
static func house_icon(colour: Color) -> Texture2D:
	var key := colour.to_html()
	if _house_icons.has(key):
		return _house_icons[key]
	var svg := '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="160" height="160"><path d="M5 19 L20 6 L35 19 Z" fill="#%s" stroke="#3A2A4A" stroke-width="2.2" stroke-linejoin="round"/><rect x="9" y="18" width="22" height="16" rx="2.5" fill="#FFF8EC" stroke="#3A2A4A" stroke-width="2.2"/><rect x="26.5" y="7.5" width="4" height="7" rx="1" fill="#%s" stroke="#3A2A4A" stroke-width="2"/></svg>' % [colour.to_html(false), colour.to_html(false)]
	var img := Image.new()
	img.load_svg_from_string(svg)
	var tex := ImageTexture.create_from_image(img)
	_house_icons[key] = tex
	return tex
