extends RefCounted
## A robot player: taps each squishy when it reaches the line (a little early or late, like a person), holds long
## squishies to the end, and now and then misses one, so it rarely gets every star.

var _rng := RandomNumberGenerator.new()
var _held := {}


func _init() -> void:
	_rng.seed = 5


func act(game: Minigame, _delta: float) -> void:
	var now: float = game.get(&"song_t")
	for lane: int in _held.keys():
		if now >= _held[lane]:
			_held.erase(lane)
			game.call(&"release", lane)
	var next_t: float = game.call(&"next_time")
	if next_t == INF or now < next_t - 0.03 + _rng.randf_range(-0.04, 0.04):
		return
	for tl: Dictionary in game.get(&"tiles"):
		if tl["hit"] or tl["miss"] or absf(tl["t"] - next_t) > 0.001 or _held.has(tl["lane"]):
			continue
		if not tl.has("bot_skip"):
			tl["bot_skip"] = _rng.randf() < 0.02
		if tl["bot_skip"]:
			continue
		game.call(&"press", tl["lane"])
		if tl["hold"] > 0.0:
			_held[tl["lane"]] = tl["end"] + 0.02
		else:
			game.call(&"release", tl["lane"])
