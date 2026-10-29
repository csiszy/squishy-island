class_name IdleMotion
extends Node
## Makes its parent bob, breathe, hop, sway, spin, glow, ... forever: the idle animations from the design book
## (art/kit3d.js, D.tick). The import plugin adds one to every part of a model that was tagged with an animation.
## Turn all of them off with IdleMotion.paused = true (battery saver, far from the camera).

static var paused := false

@export var kind: StringName = &"bob"
@export var phase := 0.0
@export var amount := 1.0
@export var speed := 0.7
@export var depth := 1.4

var _target: Node3D
var _pos: Vector3
var _rot: Vector3
var _scale: Vector3
var _time := 0.0


func _ready() -> void:
	_target = get_parent() as Node3D
	if _target == null:
		set_process(false)
		return
	_pos = _target.position
	_rot = _target.rotation
	_scale = _target.scale
	# a glowing part gets its own copy of its material, so it pulses on its own
	var mi := _target as MeshInstance3D
	if kind == &"glow" and mi != null and mi.mesh != null and mi.mesh.get_surface_count() > 0:
		var m := mi.mesh.surface_get_material(0)
		if m is ShaderMaterial:
			mi.material_override = m.duplicate()


func _process(delta: float) -> void:
	if paused:
		return
	_time += delta
	apply(_time)


## Put the parent where it should be at time t (seconds). Tests call this directly.
func apply(t: float) -> void:
	var o := _target
	var k := amount
	var ph := phase
	match kind:
		&"bob":
			o.position.y = _pos.y + (sin(t * 2.4 + ph) * 0.5 + 0.5) * 0.25 * k
		&"squish", &"sleep":
			var v := sin(t * (1.7 if kind == &"sleep" else 2.8) + ph) * 0.5 + 0.5
			o.scale = Vector3(_scale.x * (1.0 + 0.05 * v * k), _scale.y * (1.0 - 0.07 * v * k), _scale.z * (1.0 + 0.05 * v * k))
		&"hop":
			var u := fmod(t + ph, 1.8) / 1.8
			var up := sin((u - 0.15) / 0.7 * PI) if u > 0.15 and u < 0.85 else 0.0
			var sq := 1.0 - sin(u / 0.15 * PI) * 0.18 if u < 0.15 else 1.0
			o.position.y = _pos.y + up * 1.7 * k
			o.scale = Vector3(_scale.x * (2.0 - sq), _scale.y * sq, _scale.z * (2.0 - sq))
		&"mow":
			o.position.x = _pos.x + (1.0 - cos(t * 1.75 + ph)) * 0.5 * 2.4 * k
		&"sway":
			o.rotation.z = _rot.z + sin(t * 2.1 + ph) * 0.13 * k
		&"wiggle":
			o.rotation.z = _rot.z + sin(t * 5.0 + ph) * 0.2 * k
		&"float":
			o.position.y = _pos.y + sin(t * 1.7 + ph) * 0.45 * k
		&"drift":
			o.position.y = _pos.y + sin(t * 1.4 + ph) * 0.3 * k
		&"spin":
			o.rotation.y = _rot.y + t * speed
		&"spinz":
			o.rotation.z = _rot.z + t * speed
		&"spinx":
			o.rotation.x = _rot.x + t * speed
		&"twinkle":
			o.scale = _scale * (0.35 + 0.65 * absf(sin(t * 1.6 + ph)))
		&"blink":
			o.scale.y = _scale.y * (0.12 if fmod(t + ph, 4.2) > 4.0 else 1.0)
		&"smoke":
			var u := fmod(t + ph, 3.0) / 3.0
			o.position = Vector3(_pos.x + u * 0.8, _pos.y + u * 3.2, _pos.z)
			o.scale = _scale * (sin(u * PI) * 1.3)
		&"flag":
			o.rotation.y = _rot.y + sin(t * 4.0 + ph) * 0.3
		&"swing":
			o.rotation.x = _rot.x + sin(t * 2.6 + ph) * 0.32 * k
		&"rock":
			o.rotation.z = _rot.z + sin(t * 1.8 + ph) * 0.2 * k
		&"peek":
			var u := fmod(t + ph, 4.6) / 4.6
			var v := 0.0
			if u >= 0.12 and u < 0.3:
				v = (u - 0.12) / 0.18
			elif u >= 0.3 and u < 0.78:
				v = 1.0
			elif u >= 0.78 and u < 0.95:
				v = 1.0 - (u - 0.78) / 0.17
			o.position.y = _pos.y - (1.0 - v) * depth
		&"glow":
			var mi := o as MeshInstance3D
			if mi != null and mi.material_override is ShaderMaterial:
				# the book pulses the glow between 0.45 and 0.9 of its strength; the material holds the full strength
				(mi.material_override as ShaderMaterial).set_shader_parameter(&"emission_energy", (0.45 + 0.45 * (sin(t * 2.6 + ph) * 0.5 + 0.5)) / 0.9)
