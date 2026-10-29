extends GutTest
## The exported art is all there and got the Squishy Island look on import.


func _json(file_name: String) -> Dictionary:
	return JSON.parse_string(FileAccess.get_file_as_string("res://data/" + file_name))


func test_every_building_level_has_a_model() -> void:
	for b: Dictionary in _json("buildings.json")["buildings"]:
		for lv: Dictionary in b["levels"]:
			var path := ArtLibrary.building_path(StringName(b["id"]), int(lv["level"]))
			assert_true(ResourceLoader.exists(path), path)


func test_every_squishy_has_a_model_and_a_portrait() -> void:
	var data := _json("squishies.json")
	for q: Dictionary in (data["squishies"] as Array) + (data["exclusives"] as Array):
		assert_true(ResourceLoader.exists(ArtLibrary.squishy_path(StringName(q["id"]))), "model for %s" % q["id"])
		assert_true(ResourceLoader.exists(ArtLibrary.portrait_path(StringName(q["id"]))), "portrait for %s" % q["id"])


func test_models_get_the_toon_look_outline_and_idle_motion() -> void:
	var scene: Node = autofree(ArtLibrary.building(&"dumpling", 10).instantiate())
	var toon := 0
	var outlined := 0
	for mi in scene.find_children("*", "MeshInstance3D", true, false):
		var mesh := (mi as MeshInstance3D).mesh
		for i in mesh.get_surface_count():
			var m := mesh.surface_get_material(i)
			if m is ShaderMaterial:
				toon += 1
				if m.next_pass != null:
					outlined += 1
	assert_gt(toon, 20, "toon materials")
	assert_gt(outlined, 20, "outlines")
	var kinds := {}
	for idle in scene.find_children("*", "IdleMotion", true, false):
		kinds[(idle as IdleMotion).kind] = true
	assert_has(kinds, &"squish", "the house breathes")
	assert_has(kinds, &"glow", "level 10 fairy lights glow")


func test_the_book_colours_come_through() -> void:
	# The Steamhouse door is the book's red #D2483F; a colour-space mistake turns it pale pink.
	var scene: Node = autofree(ArtLibrary.building(&"dumpling", 10).instantiate())
	var reds := 0
	for mi in scene.find_children("*", "MeshInstance3D", true, false):
		var m := (mi as MeshInstance3D).mesh.surface_get_material(0)
		if m is ShaderMaterial:
			var c: Color = m.get_shader_parameter(&"albedo")
			if c.r > 0.75 and c.g < 0.4 and c.b < 0.4:
				reds += 1
	assert_gt(reds, 0, "the Steamhouse's red parts are still red")


func test_idle_motion_moves_and_returns() -> void:
	var parent: Node3D = add_child_autofree(Node3D.new())
	var idle := IdleMotion.new()
	idle.kind = &"bob"
	parent.add_child(idle)
	idle.apply(0.0)
	var y0 := parent.position.y
	idle.apply(0.6)
	assert_ne(parent.position.y, y0)
	idle.apply(TAU / 2.4)
	assert_almost_eq(parent.position.y, y0, 0.0001, "one full bob later it is back")


func test_hand_made_art_wins() -> void:
	assert_eq(ArtLibrary.building_path(&"dumpling", 3), "res://art/models/buildings/dumpling/building_dumpling_L03.glb")
	var stand_in := "res://art/models/squishies/"  # pretend this folder holds hand-made files
	assert_eq(ArtLibrary._pick("res://art/models/elsewhere/squishy_bao.glb", stand_in), stand_in + "squishy_bao.glb")
