extends RefCounted
## A robot tester: switches tools now and then, pulls the squishy's edges, presses, squeezes, drops balls and
## drops the squishy, so every part of the Lab gets a workout.

var _rng := RandomNumberGenerator.new()
var _wait := 0.0
var _down := false
var _at := Vector2.ZERO
var _to := Vector2.ZERO


func _init() -> void:
	_rng.seed = 3


func act(game: Minigame, delta: float) -> void:
	_wait -= delta
	if _down:
		_at = _at.move_toward(_to, 160.0 * delta)
		game.call(&"_move", _screen(game, _at), 0, true)
	if _wait > 0.0:
		return
	if _down:
		game.call(&"_up", _screen(game, _at), 0)
		_down = false
		_wait = 0.4
		return
	var tools: Array = game.get(&"TOOLS")
	var k: StringName = tools[_rng.randi() % tools.size()]
	if game.call(&"tool_open", k) and _rng.randf() < 0.3:
		game.call(&"pick_tool", k)
	var pts: PackedVector2Array = game.get(&"x")
	if pts.is_empty():
		return
	var tool: StringName = game.get(&"tool")
	if tool == &"hand":
		# an edge point, pulled outwards
		var p := pts[_rng.randi() % pts.size()]
		var c := Vector2.ZERO
		for q in pts:
			c += q
		c /= pts.size()
		_at = p
		_to = p + (p - c).normalized() * _rng.randf_range(40, 120)
	else:
		_at = Vector2(_rng.randf_range(60, 300), _rng.randf_range(250, 450))
		_to = _at + Vector2(_rng.randf_range(-80, 80), 0)
	game.call(&"_down", _screen(game, _at), 0)
	_down = true
	_wait = _rng.randf_range(0.6, 1.8)


## The game reads fingers in screen space; turn a physics point back into one.
func _screen(game: Minigame, p: Vector2) -> Vector2:
	return game.call(&"to_screen", p.x, p.y)
