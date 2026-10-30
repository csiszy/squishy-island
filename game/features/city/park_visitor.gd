class_name ParkVisitor
extends Node3D
## The Visitor of the week camping in the park on the map (guide.html "Daily visits"): a little tent, a picnic
## blanket and the visiting squishy, hopping now and then. Shown while someone is visiting and hasn't moved in yet.
## It camps in the park marked "visitor" in the map's layout (the beach park, near where the game starts).

## How tall the squishy stands (map units; the squishies around the houses are about 2.5).
const SQUISHY_SIZE := 3.0
const TOON := preload("res://art/shaders/toon.gdshader")
const OUTLINE := preload("res://art/shaders/outline.gdshader")

var squishy: StringName = &""
var _model: Node3D
var _camp: Node3D
var _hop: Tween


static func make(park: Dictionary, city: Dictionary) -> ParkVisitor:
	var v := ParkVisitor.new()
	v.name = "Visitor"
	v.position = Vector3(float(park.get("x", 0.0)), BuildingSlot.LIFT, float(park.get("z", 0.0)))
	v.rotation.y = float(city.get("yaw", 0.0))
	v._build_camp()
	v.visible = false
	return v


## Who visits (&"" = nobody: the park is empty).
func show_visitor(id: StringName) -> void:
	visible = id != &""
	if id == squishy:
		return
	squishy = id
	if _model != null:
		_model.queue_free()
		_model = null
	if _hop != null:
		_hop.kill()
	var scene := ArtLibrary.squishy(id) if id != &"" else null
	if scene == null:
		return
	_model = scene.instantiate() as Node3D
	_model.scale = Vector3.ONE * SQUISHY_SIZE
	_model.position = Vector3(0.6, 0.12, 1.4)
	add_child(_model)
	if not Settings.reduced_motion():
		# a happy little hop every few seconds
		_hop = create_tween().set_loops()
		_hop.tween_interval(2.2)
		_hop.tween_property(_model, "position:y", 1.6, 0.22).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		_hop.tween_property(_model, "position:y", 0.12, 0.22).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
		_hop.tween_property(_model, "scale", Vector3(1.15, 0.85, 1.15) * SQUISHY_SIZE, 0.08)
		_hop.tween_property(_model, "scale", Vector3.ONE * SQUISHY_SIZE, 0.16)


## Where its pin floats.
func bubble_point() -> Vector3:
	return global_position + Vector3(0, 6.5, 0)


## Its box in world space (for tapping it).
func world_bounds() -> AABB:
	return AABB(global_position + Vector3(-5, 0, -5), Vector3(10, 7, 10))


## A small tent and a picnic blanket (simple shapes with flat colours, like the town's little decorations).
func _build_camp() -> void:
	_camp = Node3D.new()
	_camp.name = "Camp"
	add_child(_camp)
	var blanket := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(5.5, 0.12, 4.0)
	blanket.mesh = box
	blanket.material_override = _flat(Color("#FF9EC4"))
	blanket.position = Vector3(0.6, 0.06, 1.2)
	_camp.add_child(blanket)
	var stripe := MeshInstance3D.new()
	var s := BoxMesh.new()
	s.size = Vector3(5.6, 0.14, 0.8)
	stripe.mesh = s
	stripe.material_override = _flat(Color("#FFF4F8"))
	stripe.position = Vector3(0.6, 0.07, 1.2)
	_camp.add_child(stripe)
	var tent := MeshInstance3D.new()
	var prism := PrismMesh.new()
	prism.size = Vector3(4.2, 3.6, 4.6)
	tent.mesh = prism
	tent.material_override = _flat(Color("#FFD66B"))
	tent.position = Vector3(-3.4, 1.8, -2.2)
	tent.rotation.y = 0.5
	_camp.add_child(tent)
	var door := MeshInstance3D.new()
	var d := PrismMesh.new()
	d.size = Vector3(1.6, 2.2, 0.1)
	door.mesh = d
	door.material_override = _flat(Color("#3A2A4A"))
	door.position = Vector3(0, -0.7, 2.31)
	tent.add_child(door)


## The town's toon look with its plum outline (art/shaders, like every exported model).
static func _flat(colour: Color) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = TOON
	m.set_shader_parameter(&"albedo", colour)
	var line := ShaderMaterial.new()
	line.shader = OUTLINE
	m.next_pass = line
	return m
