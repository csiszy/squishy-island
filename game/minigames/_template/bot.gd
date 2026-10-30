extends RefCounted
## A robot player: taps the highest bubble every 0.3 s.

var _wait := 0.0


func act(game: Minigame, delta: float) -> void:
	_wait -= delta
	if _wait > 0.0:
		return
	_wait = 0.3
	var bubbles: Array = game.get(&"bubbles")
	if bubbles.is_empty():
		return
	var top: Dictionary = bubbles[0]
	for b: Dictionary in bubbles:
		if b["y"] < top["y"]:
			top = b
	game.call(&"_down", Vector2(top["x"], top["y"]), 0)
