extends RefCounted
## A robot player for tests and balancing: steers toward the best cloud it can reach.


func act(game: Minigame, _delta: float) -> void:
	var g := game as KitGame
	var y: float = g.get(&"y")
	var vy: float = g.get(&"vy")
	var plats: Array = g.get(&"plats")
	var best: Dictionary = {}
	if vy < 0.0:
		var apex := vy * vy / (2.0 * 1500.0)
		for p: Dictionary in plats:
			if p["dead"] > 0.0 or p["y"] > y or p["y"] < y - apex * 0.9:
				continue
			if best.is_empty() or p["y"] < best["y"]:
				best = p
	if best.is_empty():
		for p: Dictionary in plats:
			if p["dead"] > 0.0 or p["y"] < y - 2.0:
				continue
			if best.is_empty() or p["y"] < best["y"]:
				best = p
	g.set(&"target", float(best["x"]) if not best.is_empty() else -1.0)
