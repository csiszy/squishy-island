class_name ModelViewer
extends NativeViewport
## A little 3D stage for one model (a room, a squishy, a box), lit like the design book, that you can drag to
## turn within limits (the book's Viewer in art/kit3d.js). It has its own world, so it never mixes with the map.
##     var v := ModelViewer.new(); add_child(v); v.set_model(node)

## Starting angle (radians) and how far a drag may turn it.
@export var yaw := 0.45
@export var pitch := 0.42
@export var yaw_limit := PI
@export var pitch_min := 0.05
@export var pitch_max := 1.1
## How much of the view the model fills (smaller = more room around it).
@export var pad := 0.75
@export var background := Color(0, 0, 0, 0)
@export var draggable := true

var model: Node3D
var camera: Camera3D
var _root: Node3D
var _yaw0 := 0.0
var _bounds := AABB(Vector3(-1, 0, -1), Vector3(2, 2, 2))
var _dragging := false


func _init() -> void:
	super()
	msaa = Viewport.MSAA_4X
	_root = Node3D.new()
	viewport.add_child(_root)
	var env := WorldEnvironment.new()
	env.environment = BookLights.make_environment(background)
	if background.a < 1.0:
		env.environment.background_mode = Environment.BG_CLEAR_COLOR
	_root.add_child(env)
	_root.add_child(BookLights.make_sun())
	camera = Camera3D.new()
	camera.fov = 30.0
	_root.add_child(camera)


func _ready() -> void:
	super()
	_yaw0 = yaw
	resized.connect(_aim)
	gui_input.connect(_on_input)


## Show this model (the old one is freed). It is framed to fit.
func set_model(node: Node3D) -> void:
	if model != null:
		model.queue_free()
	model = node
	if node == null:
		return
	_root.add_child(node)
	_bounds = _measure(node)
	_aim()


## Recompute the framing (after the model changed size).
func refit() -> void:
	if model:
		_bounds = _measure(model)
		_aim()


func _aim() -> void:
	if camera == null:
		return
	var c := _bounds.get_center()
	var radius := _bounds.size.length() * 0.5
	var aspect := size.x / maxf(1.0, size.y)
	var half := deg_to_rad(camera.fov) * 0.5
	var fit_v := radius / tan(half)
	var fit_h := radius / (tan(half) * maxf(0.2, aspect))
	var d := maxf(fit_v, fit_h) * pad
	camera.position = c + Vector3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch)) * d
	camera.look_at(c, Vector3.UP)
	camera.near = maxf(0.05, d * 0.02)
	camera.far = d * 6.0


func _on_input(event: InputEvent) -> void:
	if not draggable:
		return
	if event is InputEventScreenTouch:
		_dragging = (event as InputEventScreenTouch).pressed
	elif event is InputEventScreenDrag and _dragging:
		var rel := (event as InputEventScreenDrag).relative
		yaw = clampf(yaw - rel.x * 0.008, _yaw0 - yaw_limit, _yaw0 + yaw_limit)
		pitch = clampf(pitch + rel.y * 0.006, pitch_min, pitch_max)
		_aim()


func _measure(n: Node3D) -> AABB:
	var box := AABB()
	var first := true
	for mi in n.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		var b := n.global_transform.affine_inverse() * (m.global_transform * m.get_aabb()) if m.is_inside_tree() else m.get_aabb()
		box = b if first else box.merge(b)
		first = false
	return n.transform * box if not first else AABB(Vector3(-1, 0, -1), Vector3(2, 2, 2))
