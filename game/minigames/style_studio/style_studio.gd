extends KitGame
## STYLE STUDIO (Fluff & Puff Salon): endless. Guests keep coming with a picture of the hairdo they want. Copy it
## fast: style, colour, accessory, fringe and finish. Each guest waits a little less than the last. 3 unhappy
## guests and the salon closes. Ported from prototypes/games/style-studio.js.
## Score = points; metric = guests styled.

const GUESTS: Array[StringName] = [&"bunny", &"kitty", &"puppy", &"hamster", &"marshmallow", &"peach", &"toast", &"macaron", &"bao", &"egg"]
const STYLES := ["curly", "spiky", "bob"]
const COLS := ["#B48CFF", "#FF8FB8", "#8CCBFF", "#FFD54A", "#7ED3B2"]
const ACCS := ["none", "bow", "flower", "star"]
const FRINGES := ["none", "straight", "swoop"]
const FINISH := ["plain", "shiny", "glitter"]
const KEYS := ["style", "col", "acc", "fringe", "fin"]
const CURLS := [[-34, 8, 15], [-22, -10, 17], [0, -18, 19], [22, -10, 17], [34, 8, 15], [-12, -2, 15], [12, -2, 15]]

var rng := RandomNumberGenerator.new()
var seed_value := -1

var hearts_left := 3
var level := 0
var done_count := 0
var perfect := 0
var combo := 0
var anim := 0.0
var g: Dictionary = {}


func _init_run(_level: int) -> void:
	if seed_value >= 0:
		rng.seed = seed_value
	else:
		rng.randomize()
	hearts_left = 3
	level = 0
	done_count = 0
	perfect = 0
	combo = 0
	anim = 0.0
	_next_guest()


func _pick(a: Array) -> Variant:
	return a[rng.randi() % a.size()]


func _rand_look() -> Dictionary:
	return {"style": _pick(STYLES), "col": _pick(COLS), "acc": _pick(ACCS), "fringe": _pick(FRINGES), "fin": _pick(FINISH)}


func _next_guest() -> void:
	var want := _rand_look()
	var have := _rand_look()
	while KEYS.filter(func(k: String) -> bool: return have[k] == want[k]).size() > 1:
		have = _rand_look()
	g = {"who": _pick(GUESTS), "want": want, "have": have, "p": 1.0,
		"max": maxf(8.0, 24.0 - level * 0.8) * (1.0 + (ctx.perk(&"more_patience") if ctx != null else 0.0)),
		"in": 0.0, "out": 0.0, "res": {}, "pop": 0.0}


func match_pct() -> int:
	return roundi(KEYS.filter(func(k: String) -> bool: return g["have"][k] == g["want"][k]).size() * 100.0 / KEYS.size())


## The tool tray: {"k", "v", "x", "y"}.
func tools() -> Array[Dictionary]:
	var out: Array[Dictionary] = [{"k": "comb", "x": 56.0, "y": 488.0}, {"k": "fringe", "x": 132.0, "y": 488.0},
		{"k": "spray", "x": 208.0, "y": 488.0}, {"k": "done", "x": 300.0, "y": 488.0}]
	for i in COLS.size():
		out.append({"k": "col", "v": COLS[i], "x": 44.0 + i * 68.0, "y": 552.0})
	for i in ACCS.size():
		out.append({"k": "acc", "v": ACCS[i], "x": 54.0 + i * 84.0, "y": 606.0})
	return out


func can_revive() -> bool:
	return true


func revive() -> void:
	hearts_left = 1


func _update(dt: float) -> void:
	g["in"] = minf(1.0, g["in"] + dt * 2.5)
	g["pop"] = maxf(0.0, g["pop"] - dt * 4.0)
	anim = maxf(0.0, anim - dt * 3.0)
	if not (g["res"] as Dictionary).is_empty():
		g["out"] += dt * 1.1
		if g["out"] > 1.0:
			if hearts_left <= 0:
				end()
				return
			level += 1
			_next_guest()
		return
	if g["in"] >= 1.0:
		g["p"] -= dt / g["max"]
		if g["p"] <= 0.0:
			_finish_guest()


## Use a tool (the tray, the keys and the bot all come here).
func use(k: String, v: Variant = null) -> void:
	if not (g["res"] as Dictionary).is_empty() or g["in"] < 1.0:
		return
	var h: Dictionary = g["have"]
	anim = 1.0
	g["pop"] = 1.0
	match k:
		"fringe":
			h["fringe"] = FRINGES[(FRINGES.find(h["fringe"]) + 1) % 3]
			tone(1500, 0.04, &"square", 0.04)
			noise(0.04, 0.05, 5000)
		"spray":
			h["fin"] = FINISH[(FINISH.find(h["fin"]) + 1) % 3]
			noise(0.3, 0.06, 2500)
			if h["fin"] == "glitter":
				burst(Vector2(120, 170), Color("#FFF3B0"), 10, 80)
		"comb":
			h["style"] = STYLES[(STYLES.find(h["style"]) + 1) % 3]
			tone(700, 0.08, &"triangle", 0.06, 1.4)
		"col":
			h["col"] = v
			tone(500, 0.1, &"sine", 0.07, 1.8)
			burst(Vector2(120, 180), Color(String(v)), 8, 90)
		"acc":
			h["acc"] = v
			tone(1100, 0.07, &"sine", 0.07)
		"done":
			_finish_guest()


func _finish_guest() -> void:
	var m := match_pct()
	var ok := m >= 80
	var miss: Array[String] = []
	for k: String in KEYS:
		if g["have"][k] != g["want"][k]:
			miss.append(ctx.t(StringName("style_studio.part." + k)))
	g["res"] = {"m": m, "ok": ok, "miss": miss}
	g["out"] = 0.0
	done_count += 1
	if m == 100:
		perfect += 1
		combo += 1
	else:
		combo = 0
	var pts: int = m * 10 + (100 * combo if m == 100 else 0) + roundi(g["p"] * 300.0) if ok else m * 2
	add_score(pts)
	if pts > 0:
		float_text(Vector2(120, 120), "+%d" % pts, Color("#FFD54A"), 22)
	if ok:
		burst(Vector2(120, 200), Color("#FF8FB8"), 16)
		tone(1050, 0.12, &"triangle", 0.08, 1.4)
	else:
		hearts_left -= 1
		shake(0.25)
		ctx.buzz(80)
		tone(220, 0.3, &"sawtooth", 0.06, 0.6)


func _make_result() -> MinigameResult:
	return MinigameResult.make(score, done_count, t)


func _down(p: Vector2, _id: int) -> void:
	for o in tools():
		var hit := false
		match String(o["k"]):
			"col":
				hit = p.distance_to(Vector2(o["x"], o["y"])) < 24.0
			"acc":
				hit = absf(o["x"] - p.x) < 36.0 and absf(o["y"] - p.y) < 22.0
			_:
				hit = p.distance_to(Vector2(o["x"], o["y"] - 6.0)) < 36.0
		if hit:
			use(o["k"], o.get("v"))
			return


func _key(keycode: Key, pressed: bool) -> bool:
	var k: String = {KEY_1: "comb", KEY_2: "fringe", KEY_3: "spray", KEY_ENTER: "done"}.get(keycode, "")
	if k == "":
		return false
	if pressed:
		use(k)
	return true


# ---------------------------------------------------------------- drawing

func _draw_game() -> void:
	var v := view_rect
	fill_view(Color("#FFE3EF"))
	for i in range(floori(v.position.x / 32.0), ceili(v.end.x / 32.0)):
		rect(i * 32, 52, 16, 400, Color("#FFD6E6") if absi(i) % 2 else Color("#FFE3EF"))
	# mirror
	ellipse(118, 256, 100, 150, Color("#F6FBFF"), Color("#FFD06B"), 10)
	ellipse(118, 256, 100, 150, null, INK, 2.5)
	ellipse(70, 170, 10, 40, Color(1, 1, 1, 0.6), null, 0, 0.3)
	# chair + guest
	var res: Dictionary = g["res"]
	var slide: float = (1.0 - g["in"]) * -260.0 + (-g["out"] * 300.0 if not res.is_empty() else 0.0)
	rr(50 + slide, 372, 140, 18, 9, Color("#C7509A"))
	rect(112 + slide, 390, 16, 30, Color("#9A8FAA"))
	rr(84 + slide, 414, 72, 10, 5, Color("#9A8FAA"))
	var gx := 120.0 + slide
	var gy := 376.0
	var sz := 128.0
	var bounce: float = g["pop"] * 8.0 + (absf(sin(t * 10.0)) * 10.0 if not res.is_empty() and res["ok"] else 0.0)
	sprite(g["who"], gx, gy - bounce, sz, {"sx": 1.0 + anim * 0.04, "sy": 1.0 - anim * 0.04})
	_hair(gx, gy - sz * 0.78 - bounce, g["have"], 1.1)
	if not res.is_empty():
		var a := clampf((1.0 - g["out"]) * 2.5, 0.0, 1.0)
		var m: int = res["m"]
		text("%d%%%s" % [m, "!" if res["ok"] else "…"], 118, 150, 32, Color("#FFD54A" if res["ok"] else "#FF6F7D", a), &"center", &"display", Color(INK, a), 6)
		var miss: Array = res["miss"]
		if not miss.is_empty():
			rr(20, 176, 196, 24, 12, Color(1, 1, 1, 0.95 * a), null, 0)
			var words := ctx.t(&"style_studio.missed_many", {"n": miss.size()}) if miss.size() > 3 else ctx.t(&"style_studio.missed", {"list": ", ".join(PackedStringArray(miss))})
			text(words, 118, 188, 11, Color("#C7509A", a), &"center", &"body")
	# the wants card
	rr(234, 64, 116, 168, 16, Color.WHITE)
	text(ctx.t(&"style_studio.wants"), 292, 82, 12, Color("#C7509A"), &"center", &"body")
	sprite(g["who"], 292, 210, 76)
	_hair(292, 210 - 76 * 0.78, g["want"], 0.66)
	bar(244, 240, 96, 12, 0.0 if not res.is_empty() else g["p"])
	text(ctx.t(&"style_studio.patience"), 292, 262, 11, Color("#7C7494"), &"center", &"body")
	# the match stays a secret until Done!
	rr(234, 278, 116, 70, 16, Color.WHITE)
	text(ctx.t(&"style_studio.match"), 292, 296, 11, Color("#7C7494"), &"center", &"body")
	if not res.is_empty():
		text("%d%%" % res["m"], 292, 325, 26, Color("#2FB673") if res["m"] == 100 else Color("#C7509A"), &"center", &"display")
	else:
		text("?", 292, 325, 28, Color("#CFC8E3"), &"center", &"display")
	if combo >= 2:
		text(ctx.t(&"style_studio.perfect", {"n": combo}), 292, 366, 14, Color("#C7509A"), &"center", &"display", Color.WHITE, 4)
	# the tool tray
	rr(8, 446, W - 16, 188, 20, Color.WHITE)
	var have: Dictionary = g["have"]
	for o in tools():
		var ox: float = o["x"]
		var oy: float = o["y"]
		match String(o["k"]):
			"col":
				var on: bool = have["col"] == o["v"]
				var drop := quad(Vector2(ox, oy - 20), Vector2(ox + 17, oy + 2), Vector2(ox, oy + 16))
				drop.append_array(quad(Vector2(ox, oy + 16), Vector2(ox - 17, oy + 2), Vector2(ox, oy - 20)))
				poly(drop, Color(String(o["v"])), INK, 4 if on else 2.5)
			"acc":
				var on2: bool = have["acc"] == o["v"]
				rr(ox - 34, oy - 20, 68, 40, 14, Color("#FFF3B0") if on2 else Color("#F6F3FF"), INK if on2 else Color("#CFC8E3"), 3 if on2 else 2)
				if o["v"] == "none":
					text(ctx.t(&"style_studio.none"), ox, oy + 1, 13, Color("#7C7494"), &"center", &"body")
				else:
					_acc_icon(o["v"], ox, oy, 1.15)
			"done":
				circle(ox, oy - 6, 30, Color("#C7509A"), INK, 2.5)
				text(ctx.t(&"style_studio.done"), ox, oy - 6, 15, Color.WHITE, &"center", &"display")
			_:
				circle(ox, oy - 6, 27, Color("#F6F3FF"), INK, 2.5)
				_tool_icon(o["k"], ox, oy - 6)
				text(ctx.t(StringName("style_studio.tool." + String(o["k"]))), ox, oy + 30, 11, Color("#7C7494"), &"center", &"body")
	# top bar
	hud(Color("#C7509A"), "★ " + fmt(score), 116)
	hearts(W - 66, 26, hearts_left)
	rr(134, 12, 84, 28, 14, Color.WHITE)
	text(ctx.t(&"style_studio.guest", {"n": done_count + 1}), 176, 27, 13, INK, &"center", &"body")


func _hair(x: float, y: float, h: Dictionary, f: float) -> void:
	var col := Color(String(h["col"]))
	var lw := 2.5 / f
	push(Vector2(x, y), 0.0, Vector2(f, f))
	match String(h["style"]):
		"curly":
			for c: Array in CURLS:
				circle(c[0], c[1], c[2] + lw / 2.0, INK, null, 0)
			for c: Array in CURLS:
				circle(c[0], c[1], c[2] - 1.3, col, null, 0)
		"spiky":
			var pts := PackedVector2Array([Vector2(-40, 14)])
			for i in 8:
				pts.append(Vector2(-40 + i * 80.0 / 7.0, -34.0 + sin(t * 3.0 + i) if i % 2 else 2.0))
			pts.append(Vector2(40, 14))
			pts.append_array(quad(Vector2(40, 14), Vector2(0, 22), Vector2(-40, 14)))
			poly(pts, col, INK, lw)
		"bob":
			var pts2 := quad(Vector2(-42, 22), Vector2(-46, -30), Vector2(0, -30))
			pts2.append_array(quad(Vector2(0, -30), Vector2(46, -30), Vector2(42, 22)))
			pts2.append_array(quad(Vector2(42, 22), Vector2(30, 8), Vector2(18, 12)))
			pts2.append_array(quad(Vector2(18, 12), Vector2(0, 2), Vector2(-18, 12)))
			pts2.append_array(quad(Vector2(-18, 12), Vector2(-30, 8), Vector2(-42, 22)))
			poly(pts2, col, INK, lw)
	# the fringe (bangs) hangs over the forehead
	match String(h["fringe"]):
		"straight":
			var fr := PackedVector2Array([Vector2(-26, 8), Vector2(26, 8), Vector2(26, 22)])
			for i in 5:
				var a := 26.0 - i * 13.0
				fr.append_array(quad(Vector2(a, 22), Vector2(a - 3, 30), Vector2(a - 6.5, 22), 4))
				fr.append_array(quad(Vector2(a - 6.5, 22), Vector2(a - 10, 30), Vector2(a - 13, 22), 4))
			poly(fr, col, INK, lw)
		"swoop":
			var sw := quad(Vector2(-28, 6), Vector2(0, 2), Vector2(30, 8))
			sw.append_array(quad(Vector2(30, 8), Vector2(30, 30), Vector2(18, 34)))
			sw.append_array(quad(Vector2(18, 34), Vector2(8, 20), Vector2(-28, 18)))
			poly(sw, col, INK, lw)
	# the finish
	match String(h["fin"]):
		"shiny":
			arc(-4, 2, 24, PI * 1.08, PI * 1.42, Color(1, 1, 1, 0.85), 5.0 / f)
			arc(4, 2, 22, PI * 1.58, PI * 1.75, Color(1, 1, 1, 0.85), 3.5 / f)
		"glitter":
			var spots := [[-24, -6], [-6, -20], [14, -12], [28, 2], [-14, 6], [6, 0]]
			for i in spots.size():
				var tw := 0.7 + 0.35 * sin(t * 5.0 + i * 1.7)
				star(spots[i][0], spots[i][1], 5.5 * tw, 2.2 * tw, Color.WHITE, INK, 1.2 / f)
	pop()
	if h["acc"] != "none":
		_acc_icon(h["acc"], x + 22 * f, y - 18 * f, f * 1.1)


func _acc_icon(a: String, x: float, y: float, s: float) -> void:
	push(Vector2(x, y), 0.0, Vector2(s, s))
	match a:
		"bow":
			poly(PackedVector2Array([Vector2.ZERO, Vector2(-13, -8), Vector2(-13, 8)]), Color("#FF6FA3"), INK, 2)
			poly(PackedVector2Array([Vector2.ZERO, Vector2(13, -8), Vector2(13, 8)]), Color("#FF6FA3"), INK, 2)
			circle(0, 0, 4, Color("#FF6FA3"), INK, 2)
		"flower":
			for i in 5:
				var an := i / 5.0 * TAU
				circle(cos(an) * 7.0, sin(an) * 7.0, 5.5, Color.WHITE, INK, 1.6)
			circle(0, 0, 4.5, Color("#FFD54A"), INK, 1.6)
		"star":
			star(0, 0, 12, 5.5, Color("#FFD54A"), INK, 2)
	pop()


func _tool_icon(k: String, x: float, y: float) -> void:
	push(Vector2(x, y))
	match k:
		"fringe":
			var pts := PackedVector2Array([Vector2(-12, -10), Vector2(12, -10), Vector2(12, 2)])
			pts.append_array(quad(Vector2(12, 2), Vector2(9, 9), Vector2(6, 2), 4))
			pts.append_array(quad(Vector2(6, 2), Vector2(3, 9), Vector2(0, 2), 4))
			pts.append_array(quad(Vector2(0, 2), Vector2(-3, 9), Vector2(-6, 2), 4))
			pts.append_array(quad(Vector2(-6, 2), Vector2(-9, 9), Vector2(-12, 2), 4))
			poly(pts, Color("#B48CFF"), INK, 2.5)
		"spray":
			rr(-7, -6, 14, 18, 4, Color("#8CCBFF"), INK, 2)
			rr(-4, -11, 8, 6, 2, Color.WHITE, INK, 2)
			for d: Vector2 in [Vector2(10, -12), Vector2(14, -6), Vector2(11, -1)]:
				circle(d.x, d.y, 1.8, Color("#C7509A"), null, 0)
		"comb":
			rr(-12, -8, 24, 7, 3, Color("#FFD06B"), INK, 2)
			for i in 6:
				line(PackedVector2Array([Vector2(-10 + i * 4, -1), Vector2(-10 + i * 4, 8)]), Color("#C98A12"), 2)
	pop()
