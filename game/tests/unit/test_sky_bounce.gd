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
			assert_lt(gap, rise * 0.8, "a bounce rises %d, this gap is %d" % [rise, gap])
			var dx := absf(wrapf(b["x"] - a["x"], -200.0, 200.0))
			assert_lte(dx, float(game.call(&"reach_x", gap)) + 1.0, "sideways %d is within reach" % dx)
