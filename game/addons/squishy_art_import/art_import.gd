@tool
extends EditorScenePostImportPlugin
## Runs on every glTF model while Godot imports it (models exported from the design book, and hand-made ones in
## art/overrides/). It reads the tags the exporter left on each part (glTF "extras") and:
##  - look "toon" / "soft": swaps the material for the toon shader (art/shaders/toon.gdshader), keeping its colour,
##    texture and glow; "soft" (squishies) shades smoothly instead of in steps;
##  - adds the plum outline (art/shaders/outline.gdshader) unless the part says outline: false or is see-through,
##    storing smoothed normals in the vertex colour so the outline does not crack at hard corners;
##  - anim {type, ph, amp, sp, depth}: adds an IdleMotion child (art/runtime/idle_motion.gd) that animates the part;
##  - instances [16 numbers each] (+ instance_colors): turns the part into one MultiMesh with a copy per instance
##    (trees, bushes, flowers on the island), colours in the custom data the toon shader reads.
## Other tags (wrap, clip_y, look, ...) stay on the node as meta "extras" for the game to read.
## Parts with no tags (hand-made models) get the toon look and outline.

const TOON := preload("res://art/shaders/toon.gdshader")
const TOON_SEE_THROUGH := preload("res://art/shaders/toon_see_through.gdshader")
const OUTLINE := preload("res://art/shaders/outline.gdshader")
const IDLE := preload("res://art/runtime/idle_motion.gd")

var _materials: Dictionary = {}
## Meshes already restyled (one mesh can be used by many parts; restyle it once).
var _done: Dictionary = {}
var _outline: ShaderMaterial


func _pre_process(scene: Node) -> void:
	_materials.clear()
	_done.clear()
	_outline = ShaderMaterial.new()
	_outline.shader = OUTLINE
	_walk(scene, scene)


func _walk(node: Node, root: Node) -> void:
	var extras: Dictionary = node.get_meta(&"extras", {}) if node.has_meta(&"extras") else {}
	if node is ImporterMeshInstance3D:
		_restyle(node as ImporterMeshInstance3D, extras)
		if extras.get("instances") is Array:
			node = _to_multimesh(node as ImporterMeshInstance3D, extras)
	if extras.has("anim") and extras["anim"] is Dictionary and node is Node3D:
		_add_idle(node as Node3D, extras["anim"], root)
	for child in node.get_children():
		_walk(child, root)


func _restyle(mi: ImporterMeshInstance3D, extras: Dictionary) -> void:
	var mesh := mi.mesh
	if mesh == null or _done.has(mesh):
		return
	_done[mesh] = true
	var look := String(extras.get("look", "toon"))
	var glow := float(extras.get("glow", 1.0))
	var surfaces: Array[Dictionary] = []
	for i in mesh.get_surface_count():
		var src := mesh.get_surface_material(i) as BaseMaterial3D
		var see_through := src != null and src.transparency != BaseMaterial3D.TRANSPARENCY_DISABLED
		var outline: bool = extras.get("outline", true) and not see_through and look != "flat"
		var arrays := mesh.get_surface_arrays(i)
		if outline:
			arrays[Mesh.ARRAY_COLOR] = _smoothed_normals(arrays)
		surfaces.append({
			"primitive": mesh.get_surface_primitive_type(i), "arrays": arrays, "name": mesh.get_surface_name(i),
			"material": _material(src, look, glow, outline, see_through), "format": mesh.get_surface_format(i),
		})
	mesh.clear()
	for s in surfaces:
		mesh.add_surface(s["primitive"], s["arrays"], [], {}, s["material"], s["name"], 0)


## The toon material for this source material (shared between parts that look the same).
## Colours: the book's exporter (three.js r149) writes its sRGB colours into glTF fields that glTF calls linear, so
## Godot converts them once too often; srgb_to_linear() gets the book's colour back. Emission already includes its
## strength. Textures are fine as they are.
func _material(src: BaseMaterial3D, look: String, _glow: float, outline: bool, see_through: bool) -> Material:
	if src == null:
		src = StandardMaterial3D.new()
	var colour := src.albedo_color.srgb_to_linear()
	if look == "flat":
		var keep := src.duplicate() as BaseMaterial3D
		keep.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		keep.albedo_color = colour
		return keep
	var glow := src.emission.srgb_to_linear() * src.emission_energy_multiplier if src.emission_enabled else Color.BLACK
	var key := "%s|%s|%s|%s|%s|%s" % [colour.to_html(), look, glow.to_html(), outline, see_through, src.albedo_texture.get_instance_id() if src.albedo_texture else 0]
	if _materials.has(key):
		return _materials[key]
	var m := ShaderMaterial.new()
	m.shader = TOON_SEE_THROUGH if see_through else TOON
	m.set_shader_parameter(&"albedo", colour)
	if src.albedo_texture != null:
		m.set_shader_parameter(&"albedo_texture", src.albedo_texture)
		m.set_shader_parameter(&"use_texture", true)
	if src.emission_enabled:
		m.set_shader_parameter(&"emission", Color(glow.r, glow.g, glow.b))
		m.set_shader_parameter(&"emission_energy", 1.0)
	m.set_shader_parameter(&"softness", 1.0 if look == "soft" else 0.0)
	if outline:
		m.next_pass = _outline
	_materials[key] = m
	return m


## Normals averaged over every vertex at the same spot, packed into the vertex colour (alpha 1 = "use me").
func _smoothed_normals(arrays: Array) -> PackedColorArray:
	var pos: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	var nrm: PackedVector3Array = arrays[Mesh.ARRAY_NORMAL] if arrays[Mesh.ARRAY_NORMAL] != null else PackedVector3Array()
	var sums: Dictionary[Vector3i, Vector3] = {}
	var keys: Array[Vector3i] = []
	keys.resize(pos.size())
	for i in pos.size():
		var k := Vector3i((pos[i] * 200.0).round())
		keys[i] = k
		sums[k] = sums.get(k, Vector3.ZERO) + (nrm[i] if i < nrm.size() else Vector3.UP)
	var out := PackedColorArray()
	out.resize(pos.size())
	for i in pos.size():
		var n := sums[keys[i]].normalized()
		if n == Vector3.ZERO:
			n = nrm[i] if i < nrm.size() else Vector3.UP
		out[i] = Color(n.x * 0.5 + 0.5, n.y * 0.5 + 0.5, n.z * 0.5 + 0.5, 1.0)
	return out


## Swap an instanced part for a MultiMeshInstance3D with one copy per listed transform.
func _to_multimesh(mi: ImporterMeshInstance3D, extras: Dictionary) -> Node:
	var mats: Array = extras["instances"]
	var cols: Array = extras.get("instance_colors", [])
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_custom_data = true
	mm.mesh = mi.mesh.get_mesh()
	mm.instance_count = mats.size() / 16
	for i in mm.instance_count:
		var e: Array = mats.slice(i * 16, i * 16 + 16)
		# three.js matrices are column-major: x axis, y axis, z axis, position
		var t := Transform3D(Basis(Vector3(e[0], e[1], e[2]), Vector3(e[4], e[5], e[6]), Vector3(e[8], e[9], e[10])), Vector3(e[12], e[13], e[14]))
		mm.set_instance_transform(i, t)
		# like every book colour, these are sRGB values; the shader multiplies in linear light (alpha 1 = "use me")
		if cols.size() >= (i + 1) * 3:
			var c := Color(cols[i * 3], cols[i * 3 + 1], cols[i * 3 + 2]).srgb_to_linear()
			mm.set_instance_custom_data(i, Color(c.r, c.g, c.b, 1.0))
		else:
			mm.set_instance_custom_data(i, Color(1, 1, 1, 0))
	var mmi := MultiMeshInstance3D.new()
	mmi.name = mi.name
	mmi.multimesh = mm
	mmi.transform = mi.transform
	extras.erase("instances")
	extras.erase("instance_colors")
	mmi.set_meta(&"extras", extras)
	mi.replace_by(mmi)
	mi.free()
	return mmi


func _add_idle(node: Node3D, anim: Dictionary, root: Node) -> void:
	var idle: Node = IDLE.new()
	idle.name = "IdleMotion"
	idle.set(&"kind", StringName(str(anim.get("type", "bob"))))
	idle.set(&"phase", float(anim.get("ph", 0.0)))
	idle.set(&"amount", float(anim.get("amp", 1.0)))
	idle.set(&"speed", float(anim.get("sp", 0.7)))
	idle.set(&"depth", float(anim.get("depth", 1.4)))
	node.add_child(idle)
	idle.owner = root
