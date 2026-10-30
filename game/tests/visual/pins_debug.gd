extends SceneTree
func _init() -> void:
	await process_frame
	change_scene_to_file("res://app/main.tscn")
	for i in 40:
		await process_frame
	var city := root.find_child("CityScreen", true, false)
	var slots: Dictionary = city.get("_slots")
	var bubbles: Dictionary = city.get("_bubbles")
	var cam: Camera3D = city.get("_camera")
	for id: StringName in [&"playground", &"gemmine", &"post", &"restaurant", &"fire"]:
		var s: Node3D = slots[id]
		var b: Control = bubbles[id]
		var ground: Vector2 = city.call("_to_screen", s.global_position)
		var bp: Vector3 = s.call("bubble_point")
		print(id, " slot ", s.global_position, " ground_on_screen ", ground, " bubble_point ", bp, " pin_tip ", b.position + Vector2(52, 104 + 22) * b.scale, " visible ", b.visible, " model ", s.get("_model") != null, " bounds ", s.call("_bounds"))
	quit()
