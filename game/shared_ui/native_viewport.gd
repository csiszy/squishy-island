class_name NativeViewport
extends TextureRect
## A 3D picture drawn at the phone's real screen resolution. The game lays out its screens on a 720-wide canvas
## and Godot scales that up to the phone; a 3D view drawn at the canvas size would be scaled up too and look soft
## and pixelated. This draws the 3D at the screen's true pixel count (times the graphics tier's render scale)
## and shows it at its place in the layout. Put the 3D scene under `viewport`; it has a world of its own.

var viewport: SubViewport
## Anti-aliasing for the 3D edges (the graphics tier decides).
var msaa := Viewport.MSAA_2X:
	set(v):
		msaa = v
		if viewport:
			viewport.msaa_3d = v


func _init() -> void:
	viewport = SubViewport.new()
	viewport.own_world_3d = true
	viewport.transparent_bg = true
	viewport.render_target_update_mode = SubViewport.UPDATE_WHEN_PARENT_VISIBLE
	viewport.msaa_3d = msaa
	add_child(viewport)
	expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	stretch_mode = TextureRect.STRETCH_SCALE
	mouse_filter = Control.MOUSE_FILTER_STOP


func _ready() -> void:
	texture = viewport.get_texture()
	resized.connect(_fit)
	get_viewport().size_changed.connect(_fit)
	_fit()


## Screen pixels per layout unit (2 on a 1440-wide phone, 1 on the 720-wide layout itself).
func pixel_scale() -> float:
	var shown := get_viewport().get_visible_rect().size.x
	var real := float(DisplayServer.window_get_size().x)
	return real / shown if shown > 0.0 and real > 0.0 else 1.0


## A position in this control -> the same spot in the 3D viewport's pixels.
func to_viewport(pos: Vector2) -> Vector2:
	return pos * Vector2(viewport.size) / size if size.x > 0.0 else pos


## The 3D viewport's pixels -> this control.
func from_viewport(pos: Vector2) -> Vector2:
	return pos * size / Vector2(viewport.size) if viewport.size.x > 0 else pos


func _fit() -> void:
	var k := pixel_scale()
	# the cartoon outline is as many screen pixels wide as the layout says (art/shaders/outline.gdshader)
	RenderingServer.global_shader_parameter_set(&"outline_scale", k)
	viewport.size = Vector2i(maxi(2, roundi(size.x * k)), maxi(2, roundi(size.y * k)))
