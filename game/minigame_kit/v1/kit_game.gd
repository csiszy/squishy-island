class_name KitGame
extends Minigame
## Optional helpers for minigames (minigame_kit v1, frozen: bug fixes only, new helpers go into v2).
## It is the Godot version of the prototypes' shared engine (prototypes/engine.js), so porting a prototype is
## mostly translating its game file:
##
##   prototype                      here
##   init(G)                        _init_run(level)
##   update(dt, G)                  _update(delta)
##   draw(c, G)                     _draw_game()
##   down/move/up(x, y)             _down/_move/_up(p: Vector2, id)        (p in the game's logical space)
##   key(code, isDown)              _key(keycode, pressed) -> bool
##   G.end()                        end()     (offers "keep going?" once if the game allows it)
##   G.score, G.t, G.best           score, t, ctx.best
##   G.float / G.burst / G.shake    float_text / burst / shake
##   G.sfx / G.noise / G.buzz       tone / noise / ctx.buzz
##   D.rr / D.circle / D.text ...   rr / circle / text ... (same arguments, same plum outline)
##   c.fillRect / arc / setLineDash rect / arc / dashed;  save/translate/rotate/scale/restore = push / pop
##
## Draw ONLY through these helpers, never Godot's draw_ functions: the helpers draw at the phone's real pixel size
## (sharp words and edges, like the book's canvas); the contract test checks this.
##
## Override _make_result() to fill MinigameResult.metric (and level/stars/won for level games).

const INK := Color("#3A2A4A")
const W := 360.0
const H := 640.0

enum State { READY, PLAY, WAITING, OVER }

var state := State.READY
## Seconds played in this run.
var t := 0.0
## The run's score. Use add_score() so the host hears about it.
var score := 0
var revived := false
var _paused := false
var _fx: Array[Dictionary] = []
var _shake := 0.0
var _sprites: Dictionary = {}
var _touches: Dictionary = {}


func setup(context: MinigameContext) -> void:
	super(context)
	# a still first frame under the start card, like the prototypes
	_init_run(0)
	queue_redraw()


func start(level := 0) -> void:
	t = 0.0
	score = 0
	revived = false
	_paused = false
	_fx.clear()
	_shake = 0.0
	_touches.clear()
	_init_run(level)
	state = State.PLAY
	tone(660, 0.12, &"sine", 0.1, 1.5)


func pause() -> void:
	_paused = true
	_touches.clear()


func resume() -> void:
	_paused = false


func stop() -> void:
	if state == State.PLAY or state == State.WAITING:
		_finish()


func can_revive() -> bool:
	return false


func advance(delta: float) -> void:
	if _paused:
		return
	delta = minf(delta, 0.05)
	if state == State.PLAY:
		t += delta
		_update(delta)
	for f in _fx:
		f["life"] -= delta * (0.9 if f["k"] == "txt" else 1.4)
		if f["k"] == "dot":
			f["p"] += f["v"] * delta
			f["v"].y += 420.0 * delta
		else:
			f["p"].y -= 38.0 * delta
	_fx = _fx.filter(func(f: Dictionary) -> bool: return f["life"] > 0.0)
	_shake = maxf(0.0, _shake - delta)
	queue_redraw()


## The run is lost: offer "keep going?" once (if can_revive()), otherwise finish.
func end() -> void:
	if state != State.PLAY:
		return
	if not revived and can_revive():
		state = State.WAITING
		ctx.buzz(120)
		tone(300, 0.4, &"triangle", 0.14, 0.4)
		var again := await ctx.request_revive()
		if state != State.WAITING:
			return
		if again:
			revived = true
			state = State.PLAY
			revive()
			tone(880, 0.2, &"triangle", 0.1, 1.5)
			return
	_finish()


func _finish() -> void:
	_before_over()
	state = State.OVER
	ctx.buzz(120)
	tone(300, 0.4, &"triangle", 0.14, 0.4)
	var r := _make_result()
	finished.emit(r)


func add_score(n: int) -> void:
	if n <= 0:
		return
	score += n
	score_changed.emit(score)


## Set the score to a new, higher value (height games).
func raise_score(to: int) -> void:
	if to > score:
		score = to
		score_changed.emit(score)


# ---------------------------------------------------------------- for the game to fill in

func _init_run(_level: int) -> void:
	pass


func _update(_delta: float) -> void:
	pass


func _draw_game() -> void:
	pass


func _down(_p: Vector2, _id: int) -> void:
	pass


func _move(_p: Vector2, _id: int, _pressed: bool) -> void:
	pass


func _up(_p: Vector2, _id: int) -> void:
	pass


func _key(_keycode: Key, _pressed: bool) -> bool:
	return false


func _before_over() -> void:
	pass


func _make_result() -> MinigameResult:
	return MinigameResult.make(score, 0, t)


# ---------------------------------------------------------------- effects

func float_text(p: Vector2, text_value: String, col := Color.WHITE, size := 18.0) -> void:
	_fx.append({"k": "txt", "p": p, "t": text_value, "col": col, "size": size, "life": 1.0})


func burst(p: Vector2, col := Color("#FFD54A"), n := 10, speed := 140.0) -> void:
	if ctx.reduced_motion():
		n = ceili(n / 3.0)
	if ctx.graphics() == &"low":
		n = ceili(n / 2.0)
	for i in n:
		var a := randf() * TAU
		var s := speed * (0.4 + randf() * 0.8)
		_fx.append({"k": "dot", "p": p, "v": Vector2(cos(a) * s, sin(a) * s - 40.0), "r": 3.0 + randf() * 4.0, "col": col, "life": 0.7 + randf() * 0.4})


func shake(seconds: float) -> void:
	if not ctx.reduced_motion():
		_shake = maxf(_shake, seconds)


## A synthesised blip, like the prototypes' sfx(frequency, duration, wave, volume, slide).
func tone(freq: float, dur := 0.08, wave := &"sine", vol := 0.12, slide := 0.0) -> void:
	ctx.play(KitTone.make(freq, dur, wave, slide), vol * 4.0)


## A short noise burst (crumbling, swishing): prototypes' noise(duration, volume, highpass).
func noise(dur := 0.05, vol := 0.08, highpass := 4000.0) -> void:
	ctx.play(KitTone.noise(dur, highpass), vol * 4.0)


# ---------------------------------------------------------------- input (screen -> logical space)

func _unhandled_input(event: InputEvent) -> void:
	if state != State.PLAY or _paused:
		return
	if event is InputEventScreenTouch:
		var e := event as InputEventScreenTouch
		var p := _to_game(e.position)
		if e.pressed:
			_touches[e.index] = true
			_down(p, e.index)
		else:
			_touches.erase(e.index)
			_up(p, e.index)
		get_viewport().set_input_as_handled()
	elif event is InputEventScreenDrag:
		var d := event as InputEventScreenDrag
		_move(_to_game(d.position), d.index, true)
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton and event.device != InputEvent.DEVICE_ID_EMULATION:
		var m := event as InputEventMouseButton
		if m.button_index != MOUSE_BUTTON_LEFT:
			return
		if m.pressed:
			_touches[0] = true
			_down(_to_game(m.position), 0)
		else:
			_touches.erase(0)
			_up(_to_game(m.position), 0)
	elif event is InputEventMouseMotion and event.device != InputEvent.DEVICE_ID_EMULATION:
		var mm := event as InputEventMouseMotion
		_move(_to_game(mm.position), 0, _touches.has(0))
	elif event is InputEventKey and not event.is_echo():
		var k := event as InputEventKey
		if _key(k.keycode, k.pressed):
			get_viewport().set_input_as_handled()


func _to_game(screen: Vector2) -> Vector2:
	return get_global_transform_with_canvas().affine_inverse() * screen


# ---------------------------------------------------------------- drawing (the prototypes' D helpers)
# Games give every position and size in their own 360 x 640 space; the helpers turn them into the phone's real
# pixels before drawing (like the book's canvas, which draws at the screen's pixel ratio). Godot would otherwise
# draw small and scale the picture up: blurry words, soft edges. So games draw only through these helpers.

## Pixels on the screen per game unit, and the current game -> pixel mapping (with shake and push()).
var _px := 1.0
var _m := Transform2D.IDENTITY
var _root_m := Transform2D.IDENTITY
var _to_local := Transform2D.IDENTITY


func _draw() -> void:
	_px = 1.0
	if is_inside_tree():
		_px = maxf(0.01, get_screen_transform().get_scale().x)
	# draw in screen pixels (relative to this node), then map game units onto them
	_to_local = Transform2D.IDENTITY.scaled(Vector2(1.0 / _px, 1.0 / _px))
	draw_set_transform_matrix(_to_local)
	var shake_by := Vector2.ZERO
	if _shake > 0.0:
		shake_by = Vector2(randf() - 0.5, randf() - 0.5) * 32.0 * _shake
	_root_m = Transform2D(0.0, Vector2(_px, _px), 0.0, shake_by * _px)
	_m = _root_m
	_draw_game()
	_m = _root_m
	for f in _fx:
		var a := clampf(float(f["life"]) * 1.6, 0.0, 1.0)
		if f["k"] == "dot":
			circle(f["p"].x, f["p"].y, f["r"], Color(f["col"], a), null, 0.0)
		else:
			text(f["t"], f["p"].x, f["p"].y, f["size"], Color(f["col"], a), &"center", &"display", Color(INK, a), 4.0)


## Draw with an extra move/turn/scale, like canvas save/translate/rotate/scale/restore. Call pop() after.
func push(at: Vector2, rot := 0.0, scale_by := Vector2.ONE) -> void:
	_m = _root_m * Transform2D(rot, scale_by, 0.0, at)


func pop() -> void:
	_m = _root_m


func _k() -> float:
	return _m.get_scale().x


func _pts(pts: PackedVector2Array) -> PackedVector2Array:
	var out := PackedVector2Array()
	out.resize(pts.size())
	for i in pts.size():
		out[i] = _m * pts[i]
	return out


## A filled rectangle (no outline).
func rect(x: float, y: float, w: float, h: float, col: Color) -> void:
	_shape_px(_pts(PackedVector2Array([Vector2(x, y), Vector2(x + w, y), Vector2(x + w, y + h), Vector2(x, y + h)])), col, null, 0.0)


## Rounded rectangle with the plum outline (fill or stroke may be null / lw 0).
func rr(x: float, y: float, w: float, h: float, r: float, fill: Variant = null, stroke: Variant = INK, lw := 2.5) -> void:
	_shape_px(_pts(rounded_rect(x, y, w, h, r)), fill, stroke, lw * _k())


func circle(x: float, y: float, r: float, fill: Variant = null, stroke: Variant = INK, lw := 2.5) -> void:
	var c := _m * Vector2(x, y)
	var rad := maxf(0.1, r) * _k()
	if fill is Color:
		draw_circle(c, rad, fill, true, -1.0, true)
	if stroke is Color and lw > 0.0:
		draw_arc(c, rad, 0.0, TAU, clampi(int(rad), 24, 128), stroke, lw * _k(), true)


func ellipse(x: float, y: float, rx: float, ry: float, fill: Variant = null, stroke: Variant = INK, lw := 2.5, rot := 0.0) -> void:
	var pts := PackedVector2Array()
	var n := clampi(int((rx + ry) * _k() * 0.5), 24, 96)
	for i in n:
		var a := i * TAU / n
		pts.append(Vector2(x, y) + Vector2(cos(a) * rx, sin(a) * ry).rotated(rot))
	_shape_px(_pts(pts), fill, stroke, lw * _k())


## Part of a circle's outline (angles in radians, 0 = right, clockwise).
func arc(x: float, y: float, r: float, from: float, to: float, col: Color, lw := 2.0) -> void:
	draw_arc(_m * Vector2(x, y), r * _k(), from + _m.get_rotation(), to + _m.get_rotation(), clampi(int(r * _k() * 0.5), 16, 96), col, lw * _k(), true)


func poly(pts: PackedVector2Array, fill: Variant = null, stroke: Variant = INK, lw := 2.5) -> void:
	_shape_px(_pts(pts), fill, stroke, lw * _k())


func line(pts: PackedVector2Array, col: Color, lw := 2.0) -> void:
	draw_polyline(_pts(pts), col, lw * _k(), true)


func dashed(a: Vector2, b: Vector2, col: Color, lw := 2.0, dash := 8.0) -> void:
	draw_dashed_line(_m * a, _m * b, col, lw * _k(), dash * _k(), true, true)


## A closed shape already in screen pixels: filled, then outlined (smoothed edges).
func _shape_px(pts: PackedVector2Array, fill: Variant, stroke: Variant, lw: float) -> void:
	if pts.size() < 3:
		return
	if fill is Color:
		draw_colored_polygon(pts, fill)
		if not stroke is Color or lw <= 0.0:
			var ring := pts.duplicate()
			ring.append(pts[0])
			draw_polyline(ring, fill, 1.0, true)
	if stroke is Color and lw > 0.0:
		var ring2 := pts.duplicate()
		ring2.append(pts[0])
		draw_polyline(ring2, stroke, lw, true)


static func rounded_rect(x: float, y: float, w: float, h: float, r: float) -> PackedVector2Array:
	r = clampf(r, 0.0, minf(w, h) / 2.0)
	var pts := PackedVector2Array()
	var corners := [Vector2(x + w - r, y + r), Vector2(x + w - r, y + h - r), Vector2(x + r, y + h - r), Vector2(x + r, y + r)]
	var steps := clampi(int(r), 3, 12)
	for c in 4:
		var start := -PI / 2.0 + c * PI / 2.0
		for i in steps + 1:
			var a := start + (PI / 2.0) * i / steps
			pts.append(corners[c] + Vector2(cos(a), sin(a)) * r)
	return pts


## Points along a quadratic curve (canvas quadraticCurveTo).
static func quad(p0: Vector2, c: Vector2, p1: Vector2, n := 10) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in n + 1:
		var u := float(i) / n
		pts.append(p0.lerp(c, u).lerp(c.lerp(p1, u), u))
	return pts


## Points along a cubic curve (canvas bezierCurveTo).
static func cubic(p0: Vector2, c1: Vector2, c2: Vector2, p1: Vector2, n := 12) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for i in n + 1:
		var u := float(i) / n
		var a := p0.lerp(c1, u)
		var b := c1.lerp(c2, u)
		var c := c2.lerp(p1, u)
		pts.append(a.lerp(b, u).lerp(b.lerp(c, u), u))
	return pts


## Words, centred on y like the prototypes (align: left | center | right; kind: display | body).
## Drawn at the screen's real size, so they stay sharp.
func text(words: String, x: float, y: float, size := 16.0, fill := INK, align := &"center", kind := &"display", stroke: Variant = null, sw := 4.0) -> void:
	var f := ctx.font(kind)
	var k := _k()
	var px := maxi(1, roundi(size * k))
	var w := f.get_string_size(words, HORIZONTAL_ALIGNMENT_LEFT, -1, px).x
	var at := _m * Vector2(x, y)
	var x0 := at.x - w / 2.0 if align == &"center" else (at.x - w if align == &"right" else at.x)
	var base := at.y + (f.get_ascent(px) - f.get_descent(px)) / 2.0
	if stroke is Color:
		draw_string_outline(f, Vector2(x0, base), words, HORIZONTAL_ALIGNMENT_LEFT, -1, px, maxi(1, roundi(sw * k)), stroke)
	draw_string(f, Vector2(x0, base), words, HORIZONTAL_ALIGNMENT_LEFT, -1, px, fill)


## A squishy picture standing at (x, y) (its feet near y), size = picture size.
## opt: rot, sx, sy, flip, alpha, anchor (0.92 = feet near the bottom).
func sprite(id: StringName, x: float, y: float, size: float, opt: Dictionary = {}) -> void:
	if not _sprites.has(id):
		_sprites[id] = ctx.portrait(id)
	var tex: Texture2D = _sprites[id]
	if tex == null:
		circle(x, y - size * 0.4, size * 0.36, Color("#FFE3EE"))
		return
	var sx: float = float(opt.get("sx", 1.0)) * (-1.0 if opt.get("flip", false) else 1.0)
	var sy: float = opt.get("sy", 1.0)
	draw_set_transform_matrix(_to_local * _m * Transform2D(float(opt.get("rot", 0.0)), Vector2(sx, sy), 0.0, Vector2(x, y)))
	var anchor: float = opt.get("anchor", 0.92)
	draw_texture_rect(tex, Rect2(-size / 2.0, -size * anchor, size, size), false, Color(1, 1, 1, float(opt.get("alpha", 1.0))))
	draw_set_transform_matrix(_to_local)


func shadow(x: float, y: float, rx: float, a := 0.14) -> void:
	ellipse(x, y, rx, rx * 0.28, Color(0.169, 0.129, 0.255, a), null, 0.0)


func heart(x: float, y: float, s: float, fill := Color("#FF6F7D")) -> void:
	var k := s / 20.0
	var pts := cubic(Vector2(0, 7), Vector2(-12, -2), Vector2(-9, -12), Vector2(0, -6))
	pts.append_array(cubic(Vector2(0, -6), Vector2(9, -12), Vector2(12, -2), Vector2(0, 7)))
	for i in pts.size():
		pts[i] = Vector2(x, y) + pts[i] * k
	poly(pts, fill, INK, 2.2 * k)


func star(x: float, y: float, r_out: float, r_in: float, fill := Color("#FFD54A"), stroke: Variant = INK, lw := 2.0) -> void:
	var pts := PackedVector2Array()
	for i in 10:
		var a := -PI / 2.0 + i * PI / 5.0
		var rr_ := r_in if i % 2 else r_out
		pts.append(Vector2(x + rr_ * cos(a), y + rr_ * sin(a)))
	poly(pts, fill, stroke, lw)


func coin(x: float, y: float, r: float) -> void:
	circle(x, y, r, Color("#FFD54A"), Color("#C98A12"), 2.0)
	circle(x - r * 0.3, y - r * 0.3, r * 0.3, Color("#FFF3B0"), null, 0.0)


func hud(col: Color, left_text := "", left_w := 112.0) -> void:
	rect(0, 0, W, 52, col)
	if left_text != "":
		rr(10, 12, left_w, 28, 14, Color.WHITE)
		text(left_text, 10 + left_w / 2.0, 27, 14, INK, &"center", &"body")


func hearts(x: float, y: float, n: int, most := 3) -> void:
	rr(x - 16, y - 14, most * 22 + 10, 28, 14, Color.WHITE)
	for i in most:
		heart(x + i * 22, y + 1, 18, Color("#FF5E6C") if i < n else Color("#E3DEEF"))


func bar(x: float, y: float, w: float, h: float, amount: float, col: Variant = null) -> void:
	rr(x, y, w, h, h / 2.0, Color("#F2EFFA"), INK, 2.0)
	if amount > 0.0:
		var c: Color = col if col is Color else (Color("#4FCFA0") if amount > 0.5 else (Color("#FFC94D") if amount > 0.25 else Color("#FF6F7D")))
		rr(x + 2, y + 2, maxf(h - 4, (w - 4) * minf(1.0, amount)), h - 4, (h - 4) / 2.0, c, null, 0.0)


func vgradient(r: Rect2, top: Color, bottom: Color) -> void:
	draw_polygon(_pts(PackedVector2Array([r.position, Vector2(r.end.x, r.position.y), r.end, Vector2(r.position.x, r.end.y)])),
		PackedColorArray([top, top, bottom, bottom]))


## 12,345 style numbers (the prototypes' toLocaleString).
static func fmt(n: int) -> String:
	var s := str(absi(n))
	var out := ""
	while s.length() > 3:
		out = "," + s.substr(s.length() - 3) + out
		s = s.substr(0, s.length() - 3)
	return ("-" if n < 0 else "") + s + out
