extends KitGame
## An example minigame to copy (see README.md): bubbles float up, tap them before they escape. 3 hearts.
## Everything a game needs is here: a run that starts, gets harder, ends; drawing; taps; sounds; "keep going?".

var rng := RandomNumberGenerator.new()
var bubbles: Array[Dictionary] = []
var popped := 0
var hearts_left := 3
var spawn := 0.5


func _init_run(_level: int) -> void:
	rng.randomize()
	bubbles.clear()
	popped = 0
	hearts_left = 3
	spawn = 0.5


func can_revive() -> bool:
	return true


func revive() -> void:
	hearts_left = 1
	bubbles.clear()


func _update(dt: float) -> void:
	spawn -= dt
	if spawn <= 0.0:
		spawn = maxf(0.35, 1.2 - t / 60.0)
		bubbles.append({"x": 40.0 + rng.randf() * (W - 80.0), "y": H + 30.0, "r": 22.0 + rng.randf() * 12.0, "v": 90.0 + t * 2.0})
	for b in bubbles:
		b["y"] -= b["v"] * dt
		if b["y"] < 52.0:
			b["gone"] = true
			hearts_left -= 1
			shake(0.2)
			ctx.buzz(60)
			if hearts_left <= 0:
				end()
	bubbles = bubbles.filter(func(b: Dictionary) -> bool: return not b.get("gone", false))


func _down(p: Vector2, _id: int) -> void:
	for b in bubbles:
		if p.distance_to(Vector2(b["x"], b["y"])) < b["r"] + 8.0:
			b["gone"] = true
			popped += 1
			add_score(10)
			burst(Vector2(b["x"], b["y"]), Color("#8CCBFF"), 8)
			tone(700 + rng.randf() * 200, 0.08, &"sine", 0.08, 1.5)
			return


func _make_result() -> MinigameResult:
	return MinigameResult.make(score, popped, t)


func _draw_game() -> void:
	vgradient(Rect2(0, 0, W, H), Color("#DFF3FF"), Color("#8CCBFF"))
	for b in bubbles:
		circle(b["x"], b["y"], b["r"], Color(1, 1, 1, 0.55))
		circle(b["x"] - b["r"] * 0.35, b["y"] - b["r"] * 0.35, b["r"] * 0.2, Color.WHITE, null, 0)
	hud(Color("#4A9BFF"), "★ " + fmt(score))
	hearts(W - 66, 26, hearts_left)
