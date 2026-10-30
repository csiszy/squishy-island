class_name MapBubble
extends Button
## The round sticker floating over a building on the map: what it is at a glance (fun buildings: their icon;
## houses: a little house in the family colour with the family's emblem squishy), plus a chip with its level,
## a lock, or a "+" on an empty plot. Its name shows underneath when zoomed in (art/city3d.js, map-bub).

const SIZE := 104.0
const TAIL := 22.0

var id: StringName
var _chip: Label
var _name: Label
var _icon_box: Control
var _colour := Color("#FF6FA3")
var _locked := false
var _empty := false

static var _house_icons: Dictionary = {}


static func make(building_id: StringName) -> MapBubble:
	var b := MapBubble.new()
	b.id = building_id
	b._build()
	return b


func _build() -> void:
	var info := GameData.building(id)
	_colour = Color(str(info.get("color", "#FF6FA3")))
	flat = true
	focus_mode = FOCUS_NONE
	custom_minimum_size = Vector2(SIZE, SIZE + TAIL)
	size = custom_minimum_size
	pivot_offset = Vector2(SIZE / 2.0, SIZE + TAIL)
	_icon_box = Control.new()
	_icon_box.position = Vector2(16, 16)
	_icon_box.size = Vector2(SIZE - 32, SIZE - 32)
	_icon_box.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_icon_box)
	if info.get("type") == "house":
		_icon_box.add_child(_fill(Ui.texture(house_icon(_colour), Vector2.ZERO)))
		if info.get("emblem"):
			var emb := Ui.texture(ArtLibrary.portrait(StringName(info["emblem"])), Vector2.ZERO)
			emb.set_anchors_preset(PRESET_FULL_RECT)
			emb.offset_left = 14
			emb.offset_right = -14
			emb.offset_top = 22
			emb.offset_bottom = -2
			_icon_box.add_child(emb)
	else:
		var tex := ArtLibrary.badge(id)
		if tex:
			_icon_box.add_child(_fill(Ui.texture(tex, Vector2.ZERO)))
	# the chip at the top right: level number, "+" on an empty plot, or a lock
	_chip = Ui.label("", "", HORIZONTAL_ALIGNMENT_CENTER)
	_chip.add_theme_font_override("font", UiTheme.font(900))
	_chip.add_theme_font_size_override("font_size", 24)
	_chip.custom_minimum_size = Vector2(42, 42)
	_chip.position = Vector2(SIZE - 30, -12)
	_chip.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_chip)
	# the name pill floats above the pin (shown when zoomed in)
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


## Level chip: a number, a lock, a plus (empty plot) or nothing (the one-level Gem Mine).
func show_state(level: int, locked: bool) -> void:
	var info := GameData.building(id)
	var house: bool = info.get("type") == "house"
	_locked = locked
	_empty = level == 0 and not house
	var shown := maxi(1, level) if house else level
	for c in _chip.get_children():
		c.queue_free()
	_chip.visible = not info.get("single", false)
	var chip_bg := StyleBoxFlat.new()
	chip_bg.border_color = UiTheme.INK
	chip_bg.set_border_width_all(4)
	chip_bg.set_corner_radius_all(999)
	chip_bg.content_margin_left = 8
	chip_bg.content_margin_right = 8
	if locked:
		_chip.text = ""
		chip_bg.bg_color = Color("#EEEAF5")
		var lock := Ui.texture(Ui.icon("lock"), Vector2(28, 28))
		lock.position = Vector2(7, 6)
		_chip.add_child(lock)
	elif _empty:
		_chip.text = "+"
		chip_bg.bg_color = UiTheme.SUN
		_chip.add_theme_color_override("font_color", UiTheme.INK)
	else:
		_chip.text = str(shown)
		chip_bg.bg_color = UiTheme.PINK
		_chip.add_theme_color_override("font_color", Color.WHITE)
	_chip.add_theme_stylebox_override("normal", chip_bg)
	var name_text := Text.t(StringName(info.get("name", "")))
	var level_text := "" if info.get("single", false) else (Text.t(&"map.locked") if locked else (Text.t(&"map.empty_plot") if _empty else Text.t(&"collection.level", {"n": shown})))
	_name.text = name_text + ("  " + level_text if level_text != "" else "")
	_name.reset_size()
	_name.position = Vector2(SIZE / 2.0 - _name.size.x / 2.0, -_name.size.y - 10)
	_icon_box.modulate = Color(0.75, 0.72, 0.8) if locked else Color.WHITE
	tooltip_text = name_text
	queue_redraw()


## Put the bubble so that the tip of its tail sits on `point` (screen), at this size (map zoom).
func place(point: Vector2, scale_factor: float, show_name: bool) -> void:
	scale = Vector2.ONE * scale_factor
	position = point - Vector2(SIZE / 2.0, SIZE + TAIL)
	_name.visible = show_name


## The pin itself (index.html, .map-bub .bb): a white circle with a ring in the building's colour (dashed on an
## empty plot), a thin plum outline, a soft shadow and a little tail pointing down at the building.
func _draw() -> void:
	var c := Vector2(SIZE / 2.0, SIZE / 2.0)
	var r := SIZE / 2.0 - 6.0
	var fill := Color("#EEEAF5") if _locked else (Color("#FFF7C2") if is_hovered() else Color.WHITE)
	var tail := PackedVector2Array([c + Vector2(-16, r - 8), c + Vector2(16, r - 8), Vector2(c.x, SIZE + TAIL - 4)])
	# shadow (every edge is drawn smoothed, or the pin's outline looks jagged on a phone)
	draw_circle(c + Vector2(6, 8), r + 5, Color(0.169, 0.129, 0.255, 0.35), true, -1.0, true)
	# plum outline, then the colour ring, then the white face
	_shape(PackedVector2Array([tail[0] + Vector2(-5, 0), tail[1] + Vector2(5, 0), tail[2] + Vector2(0, 6)]), UiTheme.INK)
	draw_circle(c, r + 5, UiTheme.INK, true, -1.0, true)
	_shape(tail, _colour)
	draw_circle(c, r, _colour if not _empty else fill, true, -1.0, true)
	if _empty:
		for i in 16:
			var a := i * TAU / 16.0
			draw_arc(c, r - 3.0, a, a + TAU / 32.0, 6, _colour, 6.0, true)
	draw_circle(c, r - 6.0, fill, true, -1.0, true)
	_shape(PackedVector2Array([tail[0] + Vector2(6, -6), tail[1] + Vector2(-6, -6), tail[2] + Vector2(0, -9)]), fill)


## A filled shape with a smoothed edge.
func _shape(points: PackedVector2Array, colour: Color) -> void:
	draw_colored_polygon(points, colour)
	var ring := points.duplicate()
	ring.append(points[0])
	draw_polyline(ring, colour, 1.0, true)


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
