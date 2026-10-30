extends GutTest
## The Squish Lab's Squish Run (owner's idea): thrown up out of the picture, a squishy rides the run above the
## lab and always comes back down to the table, whatever it is made of. Nothing in the run can hold it.

const HARNESS := preload("res://minigame_kit/v1/harness.gd")


func _lab(id: StringName) -> Node:
	var m := MinigameManifest.from_file("res://minigames/squish_lab/manifest.json")
	var ctx := HARNESS.fake_context(m, HARNESS.read_words(m.strings_path()))
	ctx.squad.assign([id])
	var game: Node = (load(m.scene_path()) as PackedScene).instantiate()
	game.process_mode = Node.PROCESS_MODE_DISABLED
	add_child_autofree(game)
	game.call(&"setup", ctx)
	game.call(&"start", 0)
	return game


func test_every_kind_of_squishy_rides_the_run_and_comes_back() -> void:
	for id: StringName in [&"bao", &"jelly", &"kitty"]:
		var game := _lab(id)
		game.call(&"launch")
		var highest := INF
		var squishes_before: int = game.get(&"squishes")
		var seconds := 0.0
		while seconds < 40.0:
			game.advance(1.0 / 30.0)
			seconds += 1.0 / 30.0
			var x: PackedVector2Array = game.get(&"x")
			for p in x:
				highest = minf(highest, p.y)
			if seconds > 3.0 and game.get(&"run") == 0:
				break
		assert_eq(game.get(&"run"), 0, "%s came back out of the run (%.0f s)" % [id, seconds])
		assert_lt(seconds, 30.0, "%s took %.0f s" % [id, seconds])
		assert_lt(highest, -1400.0, "%s went all the way up" % id)
		var x: PackedVector2Array = game.get(&"x")
		var low := -INF
		for p in x:
			low = maxf(low, p.y)
		# back on the table after a moment
		for f in 90:
			game.advance(1.0 / 30.0)
		x = game.get(&"x")
		low = -INF
		for p in x:
			low = maxf(low, p.y)
		assert_almost_eq(low, 510.0, 6.0, "%s is back on the table" % id)
		assert_gt(int(game.get(&"squishes")), squishes_before, "%s got squished on the way" % id)


func test_a_throw_out_of_the_top_starts_the_run_and_the_camera_follows() -> void:
	var game := _lab(&"bao")
	var v: PackedVector2Array = game.get(&"v")
	for i in v.size():
		v[i] = Vector2(0, -2200)
	game.set(&"v", v)
	var top_cam := 0.0
	for f in 60:
		game.advance(1.0 / 30.0)
		top_cam = minf(top_cam, float(game.get(&"cam_dy")))
	assert_ne(game.get(&"run"), 0, "it went into the wind tunnel")
	assert_lt(top_cam, -600.0, "the camera went up with it")


func test_nobody_can_grab_it_in_the_run() -> void:
	var game := _lab(&"bao")
	game.call(&"launch")
	for f in 20:
		game.advance(1.0 / 30.0)
	game.call(&"_down", Vector2(180, 300), 0)
	assert_eq((game.get(&"grabs") as Array).size(), 0)
