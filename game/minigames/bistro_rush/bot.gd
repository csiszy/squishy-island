extends RefCounted
## A robot player for tests and balancing: one tap every 0.35 s, like a quick child. Serves ready dishes first,
## then cooks what a waiting guest still needs.

const REACTION := 0.35

var _wait := 0.0


func act(game: Minigame, delta: float) -> void:
	_wait -= delta
	if _wait > 0.0:
		return
	_wait = REACTION
	var g := game as KitGame
	var seats: Array = g.get(&"seats")
	var pans: Array = g.get(&"pans")
	var need: Array[String] = []
	# serve: a ready pan that someone wants
	for i: int in pans.size():
		var p: Variant = pans[i]
		if p == null or p["t"] < 1.0:
			continue
		for ci: int in seats.size():
			var s: Variant = seats[ci]
			if s == null or s["leave"] > 0.0 or s["in"] < 1.0:
				continue
			for j: int in s["order"].size():
				if s["order"][j] == p["f"] and not s["got"][j]:
					g.call(&"_down", Vector2(g.PANS[i], 442), 0)
					g.call(&"_down", Vector2(g.SEATS[ci], 200), 0)
					return
	# cook: what guests still need and is not on the stove yet
	for s: Variant in seats:
		if s == null or s["leave"] > 0.0:
			continue
		for j: int in s["order"].size():
			if not s["got"][j]:
				need.append(s["order"][j])
	for p: Variant in pans:
		if p != null:
			need.erase(p["f"])
	if need.is_empty() or not pans.has(null):
		return
	for o: Dictionary in g.call(&"tray"):
		if o["f"] == need[0]:
			g.call(&"_down", Vector2(o["x"], o["y"]), 0)
			return
