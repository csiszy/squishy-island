extends RefCounted
## A robot player: works out a solution with the game's own solver (it peeks under the smoke), then taps it out,
## one tap every 0.3 s.

const REACTION := 0.3

var _wait := 0.0
var _plan: Array = []
var _level := -1
var _second := -1


func act(game: Minigame, delta: float) -> void:
	_wait -= delta
	if _wait > 0.0 or game.call(&"busy"):
		return
	_wait = REACTION
	var lv: Dictionary = game.get(&"lv")
	if lv["n"] != _level or (_plan.is_empty() and _second < 0):
		_level = lv["n"]
		var colours: Array = (game.get(&"tubes") as Array).map(func(t: Array) -> Array: return t.map(func(u: Dictionary) -> int: return u["c"]))
		var answer: Dictionary = game.call(&"solve", colours, game.get(&"cap"), KitRng.new(7), 20000)
		_plan = answer["path"] if answer["ok"] else []
		_second = -1
		if _plan.is_empty():
			game.call(&"button", "restart")
			return
	if _second >= 0:
		game.call(&"pick", _second)
		_second = -1
		return
	if _plan.is_empty():
		return
	var m: Array = _plan.pop_front()
	game.call(&"pick", m[0])
	_second = m[1]
