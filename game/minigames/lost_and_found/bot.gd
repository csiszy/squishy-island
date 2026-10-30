extends RefCounted
## A robot detective: when the board is still, it makes one of the possible swaps (a mega combo if there is one,
## otherwise one lower down the board, which tends to dig up paw prints), one move every 0.5 s.

var _wait := 0.0
var _rng := RandomNumberGenerator.new()


func act(game: Minigame, delta: float) -> void:
	_wait -= delta
	if _wait > 0.0 or game.get(&"phase") != "idle":
		return
	_wait = 0.5
	var moves: Array = game.call(&"find_moves")
	if moves.is_empty():
		return
	var grid: Array = game.get(&"grid")
	var best: Array = moves[_rng.randi() % moves.size()]
	for m: Array in moves:
		var a: Vector2i = m[0]
		var b: Vector2i = m[1]
		if grid[a.y][a.x]["sp"] != "" and grid[b.y][b.x]["sp"] != "":
			best = m
			break
		if a.y > best[0].y and _rng.randf() < 0.5:
			best = m
	game.call(&"try_swap", best[0], best[1])
