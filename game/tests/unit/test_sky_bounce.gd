extends GutTest
## Sky Bounce never makes a cloud you cannot reach (owner's phone test: a gap too far to jump).

const HARNESS := preload("res://minigame_kit/v1/harness.gd")


func test_every_next_cloud_is_reachable() -> void:
	var m := MinigameManifest.from_file("res://minigames/sky_bounce/manifest.json")
	var game: Node = (load(m.scene_path()) as PackedScene).instantiate()
	add_child_autofree(game)
	game.process_mode = Node.PROCESS_MODE_DISABLED
	game.call(&"setup", HARNESS.fake_context(m, {}))
	var rise := 760.0 * 760.0 / (2.0 * 1500.0)
	for s in 20:
		game.set(&"seed_value", s)
		game.call(&"start", 0)
		var py := 0.0
		# climb far: 30,000 high, where the gaps are biggest
		while py > -30000.0:
			py -= game.call(&"_next_gap", -py)
			game.call(&"_add_plat", py)
		var plats: Array = game.get(&"plats")
		for i in range(1, plats.size()):
			var a: Dictionary = plats[i - 1]
			var b: Dictionary = plats[i]
			var gap: float = a["y"] - b["y"]
			assert_lte(gap, rise * 0.73, "a bounce rises %d, this gap is %d" % [rise, gap])
			# straight across, not round the edge; and the reach leaves time to react
			var dx := absf(b["x"] - a["x"])
			# a drifting leaf can be up to 70 further away by the time you jump
			if a["vx"] != 0.0 or b["vx"] != 0.0:
				dx += 70.0
				assert_false(a["vx"] != 0.0 and b["vx"] != 0.0, "never two drifting leaves in a row")
			assert_lte(dx, maxf(40.0 + 70.0, float(game.call(&"reach_x", gap))) + 1.0, "sideways %d is within reach" % dx)


## A moving leaf right by the edge of the screen used to turn back every frame and shake in place.
func test_moving_leaves_never_shake_at_the_edge() -> void:
	var m := MinigameManifest.from_file("res://minigames/sky_bounce/manifest.json")
	var game: Node = (load(m.scene_path()) as PackedScene).instantiate()
	add_child_autofree(game)
	game.process_mode = Node.PROCESS_MODE_DISABLED
	game.call(&"setup", HARNESS.fake_context(m, {}))
	game.call(&"start", 0)
	var leaf := {"x": 20.0, "x0": 20.0, "y": -300.0, "w": 60.0, "type": "leaf", "vx": -90.0, "dead": 0.0, "spring": false}
	(game.get(&"plats") as Array).append(leaf)
	var turns := 0
	var last_vx: float = leaf["vx"]
	for f in 60:
		game.advance(1.0 / 60.0)
		if signf(leaf["vx"]) != signf(last_vx):
			turns += 1
		last_vx = leaf["vx"]
	assert_lte(turns, 2, "it turns back once at the edge, then glides")
	assert_gte(float(leaf["x"]), 30.0, "and stays on the screen")
