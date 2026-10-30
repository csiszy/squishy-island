extends RefCounted
## A robot player for tests and balancing: every 0.45 s it sends the front letter to its bag (like the 1-6 keys).

const REACTION := 0.45

var _wait := 0.0


func act(game: Minigame, delta: float) -> void:
	_wait -= delta
	if _wait > 0.0:
		return
	_wait = REACTION
	var front: Dictionary = game.call(&"_front_letter")
	if front.is_empty() or front["x"] < 20.0:
		return
	game.call(&"_key", KEY_1 + int(front["bag"]), true)
