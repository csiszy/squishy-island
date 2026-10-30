class_name Celebration
extends Control
## A one-second "well done!" around something the player just built or fixed up (guide.html, "Upgrade
## celebration"): confetti pops up and flutters down while three little fireworks burst above it.
## It draws itself, never catches taps and removes itself when it is over.
##     Celebration.burst(layer, point)                       # a fixed spot
##     Celebration.burst(layer, point, 1.0, func() -> Vector2: return where_it_is_now)   # follows a moving thing
## Fewer pieces on lower graphics tiers (Settings.particle_amount()); with "reduced motion" only a few stars twinkle
## in place, nothing flies.

const LENGTH := 1.3
const COLOURS: Array[Color] = [UiTheme.PINK, UiTheme.SUN, UiTheme.MINT, UiTheme.SKY, UiTheme.LILAC, Color.WHITE]
const GRAVITY := 900.0
const CONFETTI := 46
const SPARKS := 12

## Where the celebration is centred (in the parent's coordinates); `follow` moves it every frame if set.
var follow: Callable
var size_scale := 1.0
var calm := false
var time := 0.0
var _pieces: Array[Dictionary] = []
var _fireworks: Array[Dictionary] = []
var _rng := RandomNumberGenerator.new()


static func burst(parent: Control, at: Vector2, scale_factor := 1.0, follow_point := Callable()) -> Celebration:
	var c := Celebration.new()
	c.size_scale = scale_factor
	c.follow = follow_point
	c.calm = Settings.reduced_motion()
	c.position = at
	c.mouse_filter = MOUSE_FILTER_IGNORE
	c._make(Settings.particle_amount())
	parent.add_child(c)
	return c


func _make(amount: float) -> void:
	if calm:
		# a few stars that twinkle where they are
		for i in 6:
			var a := i * TAU / 6.0 + 0.3
			_pieces.append({"p": Vector2(cos(a), sin(a) * 0.7 - 0.6) * 110.0, "c": COLOURS[i % 3], "star": true, "delay": i * 0.08})
		return
	for i in maxi(6, roundi(CONFETTI * amount)):
		var a := _rng.randf_range(-PI * 0.85, -PI * 0.15)
		var speed := _rng.randf_range(420.0, 820.0)
		_pieces.append({
			"p": Vector2(_rng.randf_range(-30, 30), _rng.randf_range(-20, 20)), "v": Vector2(cos(a), sin(a)) * speed,
			"c": COLOURS[i % COLOURS.size()], "spin": _rng.randf_range(-12.0, 12.0), "r": _rng.randf() * TAU,
			"w": _rng.randf_range(14.0, 22.0), "h": _rng.randf_range(7.0, 11.0), "flutter": _rng.randf() * TAU,
		})
	var bursts := 3 if amount > 0.5 else (2 if amount > 0.3 else 1)
	var spots: Array[Vector2] = [Vector2(-120, -190), Vector2(125, -230), Vector2(0, -300)]
	for i in bursts:
		_fireworks.append({"p": spots[i], "c": COLOURS[i], "delay": i * 0.22})


func _process(delta: float) -> void:
	time += delta
	if time >= LENGTH:
		queue_free()
		return
	if follow.is_valid():
		position = follow.call()
	if not calm:
		for piece in _pieces:
			var v: Vector2 = piece["v"]
			v.y += GRAVITY * delta
			v *= 1.0 - 2.2 * delta     # air slows it, so it flutters down instead of dropping
			piece["v"] = v
			piece["p"] += v * delta
			piece["r"] += piece["spin"] * delta
	queue_redraw()


func _draw() -> void:
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE * size_scale)
	var fade := clampf((LENGTH - time) / 0.35, 0.0, 1.0)
	if calm:
		for piece in _pieces:
			var t := clampf((time - float(piece["delay"])) / 0.5, 0.0, 1.0)
			_star(piece["p"], 14.0 * sin(t * PI) + 2.0, Color(piece["c"], fade * minf(1.0, t * 3.0)))
		return
	for fw in _fireworks:
		var t := (time - float(fw["delay"])) / 0.8
		if t <= 0.0 or t >= 1.0:
			continue
		var reach := 115.0 * (1.0 - pow(1.0 - t, 3.0))
		var c := Color(fw["c"], 1.0 - t)
		for i in SPARKS:
			var dir := Vector2.from_angle(i * TAU / SPARKS)
			var tip: Vector2 = fw["p"] + dir * reach
			draw_line(tip - dir * minf(reach, 26.0), tip, Color(c, c.a * 0.6), 4.0, true)
			draw_circle(tip, 6.5 * (1.0 - t * 0.5), c, true, -1.0, true)
		draw_circle(fw["p"], 10.0 * (1.0 - t), Color(Color.WHITE, 1.0 - t), true, -1.0, true)
	for piece in _pieces:
		# a paper rectangle turning in the air: its width shrinks and grows as it flips
		var flip := absf(cos(time * 9.0 + float(piece["flutter"])))
		var half := Vector2(float(piece["w"]) * maxf(0.2, flip), float(piece["h"])) * 0.5
		var rot := Transform2D(float(piece["r"]), piece["p"])
		var pts := PackedVector2Array([rot * Vector2(-half.x, -half.y), rot * Vector2(half.x, -half.y), rot * half, rot * Vector2(-half.x, half.y)])
		draw_colored_polygon(pts, Color(piece["c"], fade))


func _star(at: Vector2, r: float, c: Color) -> void:
	var pts := PackedVector2Array()
	for i in 8:
		pts.append(at + Vector2.from_angle(i * TAU / 8.0 - PI / 2.0) * (r if i % 2 == 0 else r * 0.38))
	draw_colored_polygon(pts, c)
