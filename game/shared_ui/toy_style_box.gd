@tool
class_name ToyStyleBox
extends StyleBox
## The book's "sticker" look for cards and buttons: a rounded box with a thick plum outline and a hard
## offset shadow (no blur), like art/style.css (.card, .pill). Pressed buttons drop onto their shadow.

@export var fill := Color.WHITE
@export var line := UiTheme.INK
@export var line_width := 5
@export var radius := 28
@export var shadow := Vector2(6, 6)
## Content padding inside the outline (left, top, right, bottom).
@export var pad := Vector4(28, 18, 28, 18):
	set(v):
		pad = v
		content_margin_left = v.x
		content_margin_top = v.y
		content_margin_right = v.z
		content_margin_bottom = v.w
## Where the box sits (a pressed button moves down onto its shadow).
@export var press_offset := Vector2.ZERO


func _init() -> void:
	pad = pad


func _draw(to_canvas_item: RID, rect: Rect2) -> void:
	rect.position += press_offset
	if shadow != Vector2.ZERO:
		_box(line, Color.TRANSPARENT, 0).draw(to_canvas_item, Rect2(rect.position + shadow, rect.size))
	_box(fill, line, line_width).draw(to_canvas_item, rect)


func _box(bg: Color, border: Color, width: int) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(width)
	s.set_corner_radius_all(radius)
	s.corner_detail = 6
	s.anti_aliasing = true
	return s


## A copy with other colours / shadow (for pressed, disabled, ...).
func variant(new_fill: Color, new_shadow := shadow) -> ToyStyleBox:
	var s := duplicate() as ToyStyleBox
	s.fill = new_fill
	s.shadow = new_shadow
	return s
