class_name BuildingSlot
extends Node3D
## One building's place on the map (CITY block in the book's index.html): the building at its level and, for a
## house, the family squishies the player owns, each in its own spot doing its idle loop (house pages,
## "Life around the house"). Call show_state() whenever the level or the family changes.

const SCALE_DEFAULT := 1.2
const LIFT := 0.15

var id: StringName
var level := -1
var owned: Array[StringName] = []
var _model: Node3D
var _pin := Vector3.ZERO
var _pin_dirty := true


static func make(entry: Dictionary, city: Dictionary) -> BuildingSlot:
	var s := BuildingSlot.new()
	s.id = StringName(entry["id"])
	s.name = String(s.id)
	# a hair above the ground: the plot's top is exactly at grass height and would flicker against it
	s.position = Vector3(float(entry["x"]), LIFT, float(entry["z"]))
	s.rotation.y = float(entry.get("ry", float(city.get("yaw", 0.0)) + float(entry.get("turn", 0.0))))
	s.scale = Vector3.ONE * float(city.get("buildingScale", SCALE_DEFAULT))
	return s


## Show the building at `new_level` with these family squishies (houses show at least level 1).
func show_state(new_level: int, family_owned: Array[StringName]) -> void:
	var shown := maxi(1, new_level) if GameData.building(id).get("type") == "house" else new_level
	if shown == level and family_owned == owned and _model != null:
		return
	level = shown
	owned = family_owned.duplicate()
	_pin_dirty = true
	if _model != null:
		_model.queue_free()
		remove_child(_model)
	var scene := ArtLibrary.building(id, level)
	_model = scene.instantiate() as Node3D if scene else Node3D.new()
	add_child(_model)
	for sq in owned:
		_add_life(sq)


## Where the bubble floats: just above the building (3 above its top, at most 33 high).
func bubble_point() -> Vector3:
	# above the middle of what is actually built (a level 1 playground is just a sandbox in one corner of its
	# plot), 3 above its top (at most 30 high). art/city3d.js puts pins at least 12 high, which left small things
	# like the sandbox with a pin floating far above them once the plot square was gone.
	# worked out once per look (cheap every frame, and pins don't wobble while squishies walk about)
	if _pin_dirty and _model != null and _model.is_inside_tree():
		var b := world_bounds()
		var c := b.get_center()
		_pin = Vector3(c.x, minf(b.end.y, 30.0) + 3.0, c.z)
		_pin_dirty = false
	return _pin if not _pin_dirty else global_position + Vector3(0, 15, 0)


## The building's box in world space (for tapping it).
func world_bounds() -> AABB:
	return global_transform * _bounds()


## A short "builders" moment: the building squashes down and springs up again.
func play_build() -> void:
	if _model == null or Settings.reduced_motion():
		return
	_model.scale = Vector3(1.15, 0.7, 1.15)
	var t := create_tween()
	t.tween_property(_model, "scale", Vector3.ONE, 0.6).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)


func _add_life(sq: StringName) -> void:
	var scene := ArtLibrary.life(sq)
	if scene == null:
		return
	var life := scene.instantiate() as Node3D
	var info := ArtLibrary.life_heights(id, sq)
	var wraps: Dictionary = info.get("wraps", {})
	var clips: Array[Node3D] = []
	for w: String in wraps:
		var heights: Array = wraps[w]
		var node := life.find_child(w, true, false) as Node3D
		if node != null and level >= 1 and level <= heights.size():
			node.position.y = float(heights[level - 1])
		if node != null and _extras(node).has("clip_y"):
			clips.append(node)
	var parent: Node = _model.find_child("Body", true, false) if info.get("on", false) else null
	(parent if parent != null else _model).add_child(life)
	for node in clips:
		_clip_below(node, float(_extras(node)["clip_y"]))


## Window peekers: hide everything of this squishy below the window sill (a fixed height in the world).
func _clip_below(wrap: Node3D, local_y: float) -> void:
	var parent := wrap.get_parent() as Node3D
	var y := (parent.global_transform * Vector3(0, local_y, 0)).y
	for mi in wrap.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		for i in m.mesh.get_surface_count():
			var mat := m.get_active_material(i)
			if mat is ShaderMaterial:
				var own := mat.duplicate() as ShaderMaterial
				own.set_shader_parameter(&"clip_below", y)
				if own.next_pass is ShaderMaterial:
					own.next_pass = own.next_pass.duplicate()
					(own.next_pass as ShaderMaterial).set_shader_parameter(&"clip_below", y)
				m.set_surface_override_material(i, own)


func _bounds() -> AABB:
	var box := AABB()
	var first := true
	if _model == null:
		return AABB(Vector3(-8, 0, -8), Vector3(16, 12, 16))
	for mi in _model.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		var b := global_transform.affine_inverse() * (m.global_transform * m.get_aabb()) if m.is_inside_tree() else m.get_aabb()
		box = b if first else box.merge(b)
		first = false
	return box


func _extras(n: Node) -> Dictionary:
	return n.get_meta(&"extras", {}) if n.has_meta(&"extras") else {}
