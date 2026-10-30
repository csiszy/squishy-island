@tool
class_name InstanceSet
extends MultiMeshInstance3D
## Many copies of one mesh (the island's trees, bushes, flowers, rocks), drawn in one go. The import step
## (addons/squishy_art_import) fills in the mesh, every copy's transform and colour; the MultiMesh itself is built
## when the scene starts (a MultiMesh made during a headless import would lose its transforms).

## Every copy's transform: 16 numbers each, column by column (three.js order).
@export var transforms := PackedFloat32Array()
## Every copy's colour (empty = the mesh's own colour).
@export var colors := PackedColorArray()
@export var mesh: Mesh


func _ready() -> void:
	build()


func build() -> void:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_custom_data = true
	mm.mesh = mesh
	mm.instance_count = transforms.size() / 16
	for i in mm.instance_count:
		var k := i * 16
		var e := transforms
		mm.set_instance_transform(i, Transform3D(Basis(Vector3(e[k], e[k + 1], e[k + 2]), Vector3(e[k + 4], e[k + 5], e[k + 6]), Vector3(e[k + 8], e[k + 9], e[k + 10])), Vector3(e[k + 12], e[k + 13], e[k + 14])))
		# the toon shader reads the colour from the custom data (alpha 1 = "use me")
		mm.set_instance_custom_data(i, Color(colors[i].r, colors[i].g, colors[i].b, 1.0) if i < colors.size() else Color(1, 1, 1, 0))
	multimesh = mm
