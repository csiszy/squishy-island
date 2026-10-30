extends RefCounted
## A robot player: one tap every 0.35 s. Sends snails home, then looks after the plant that has waited longest
## (picking the right tool first, which also takes a tap).

const REACTION := 0.35

var _wait := 0.0


func act(game: Minigame, delta: float) -> void:
	_wait -= delta
	if _wait > 0.0:
		return
	_wait = REACTION
	for s: Dictionary in game.get(&"snails"):
		if not s["home"] and s["x"] > 10.0 and s["x"] < 350.0:
			game.call(&"_down", Vector2(s["x"], s["y"]), 0)
			return
	var beds: Array = game.get(&"beds")
	var best := -1
	var most := -1.0
	for i in beds.size():
		var p: Variant = beds[i]
		if p == null or p["dead"] > 0.0 or p["growing"] or p["need"] == "":
			continue
		if p["wait"] > most:
			most = p["wait"]
			best = i
	if best < 0:
		return
	var need: String = beds[best]["need"]
	var tool: String = "basket" if need == "harvest" else need
	if game.get(&"tool") != tool:
		for o: Array in game.get(&"TOOLS"):
			if o[0] == tool:
				game.call(&"_down", Vector2(o[1], 516), 0)
		return
	game.call(&"tap_bed", best)
