extends RefCounted
## A robot player: aims at the lowest brick (a little off-centre, so balls spread), shoots, and fast-forwards.

var _rng := RandomNumberGenerator.new()
var _wait := 0.0


func act(game: Minigame, delta: float) -> void:
	_wait -= delta
	if _wait > 0.0:
		return
	_wait = 0.5
	var phase: String = game.get(&"phase")
	if phase == "shoot":
		game.set(&"fast", 2.5)
		return
	if phase != "aim":
		return
	var lowest: Dictionary = {}
	for b: Dictionary in game.get(&"bricks"):
		if b["hp"] > 0 and (lowest.is_empty() or b["r"] > lowest["r"]):
			lowest = b
	if lowest.is_empty():
		return
	var rc: Rect2 = game.call(&"_brick_rect", lowest)
	game.call(&"set_aim", rc.get_center() + Vector2(_rng.randf_range(-14, 14), 0))
	game.call(&"shoot")
