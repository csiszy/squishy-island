extends KitGame
## GROW GROW GARDEN (Sprout Club Greenhouse): endless. Seeds pop up in the beds on their own, on a timer that keeps
## getting quicker. Give each plant what its bubble asks for (water or sun) until it blooms, then harvest it. Shoo
## away snails. 3 wilted plants and it closes. Ported from prototypes/games/grow-grow-garden.js.
## Score = points; metric = flowers harvested (the milestones and the building's goal count those).

const TOOLS := [["water", 70.0], ["sun", 180.0], ["basket", 290.0]]
const FLOWERS := ["#FF7AA8", "#FFD54A", "#B48CFF", "#FF8A5C", "#8CCBFF"]

var rng := RandomNumberGenerator.new()
var seed_value := -1

var beds_rects: Array[Rect2] = []
var beds: Array = []
var tool := "water"
var hearts_left := 3
var harvest := 0
var level := 0
var snails: Array[Dictionary] = []
var snail_t := 9.0
var hint_text := ""
var hint_t := 0.0
var sprout_t := 0.4
var next_bed := -1
var first := 3


func _init_run(_level: int) -> void:
	if seed_value >= 0:
		rng.seed = seed_value
	else:
		rng.randomize()
	beds_rects.clear()
	for r in 3:
		for c in 3:
			beds_rects.append(Rect2(26 + c * 106, 74 + r * 118, 96, 108))
	beds = [null, null, null, null, null, null, null, null, null]
	tool = "water"
	hearts_left = 3
	harvest = 0
	level = 0
	snails.clear()
	snail_t = 9.0
	hint_text = ""
	hint_t = 0.0
	sprout_t = 0.4
	next_bed = -1
	first = 3


func patience() -> float:
	return maxf(3.8, 11.0 - level * 0.5)


func _grow_time() -> float:
	return maxf(1.1, 2.6 - level * 0.09)


## A new seed sprouts every few seconds by itself; the gap shrinks smoothly with time and harvests.
func _sprout_gap() -> float:
	return 1.25 + 2.6 * exp(-(t / 70.0 + harvest / 16.0))


func can_revive() -> bool:
	return true


func revive() -> void:
	hearts_left = 1
	for p: Variant in beds:
		if p != null and p["dead"] == 0.0:
			p["wait"] = 0.0
	snails.clear()


func _update(dt: float) -> void:
	level = harvest / 5
	# auto-sprouting: pick the next bed ahead of time so it can wiggle before the seed pops up
	if next_bed < 0 or beds[next_bed] != null:
		var empty: Array[int] = []
		for i in 9:
			if beds[i] == null:
				empty.append(i)
		next_bed = empty[rng.randi() % empty.size()] if not empty.is_empty() else -1
	sprout_t -= dt
	if sprout_t <= 0.0 and next_bed >= 0:
		var gold_chance := 0.1 * (2.0 if ctx.perk(&"gold_twice") > 0.0 else 1.0)
		beds[next_bed] = {"stage": 0, "g": 0.0, "growing": true, "need": "", "wait": 0.0, "col": FLOWERS[rng.randi() % FLOWERS.size()],
			"gold": level >= 2 and rng.randf() < gold_chance, "bounce": 1.0, "dead": 0.0}
		tone(500, 0.08, &"sine", 0.05, 1.6)
		next_bed = -1
		if first > 0:
			first -= 1
			sprout_t = 1.1
		else:
			sprout_t = _sprout_gap() * (0.8 + rng.randf() * 0.4)
	for i in 9:
		var p: Variant = beds[i]
		if p == null:
			continue
		if p["dead"] > 0.0:
			p["dead"] += dt
			if p["dead"] > 1.2:
				beds[i] = null
			continue
		p["bounce"] = maxf(0.0, p["bounce"] - dt * 3.0)
		if p["growing"]:
			p["g"] += dt / _grow_time()
			if p["g"] >= 1.0:
				p["growing"] = false
				p["stage"] += 1
				# Forest Folk gardeners: sometimes a plant grows a stage further by itself
				if p["stage"] < 4 and p["stage"] > 0 and rng.randf() < ctx.perk(&"grow_skip"):
					p["stage"] += 1
				p["g"] = 0.0
				p["wait"] = 0.0
				p["need"] = "harvest" if p["stage"] >= 4 else ("water" if rng.randf() < 0.5 else "sun")
				p["bounce"] = 1.0
				if p["stage"] >= 4:
					tone(1200, 0.15, &"triangle", 0.07, 1.3)
			continue
		p["wait"] += dt
		var lim := patience() * (1.5 if p["need"] == "harvest" else 1.0)
		if p["wait"] > lim:
			p["dead"] = 0.01
			hearts_left -= 1
			shake(0.25)
			ctx.buzz(80)
			float_text(Vector2(beds_rects[i].position.x + 48, beds_rects[i].position.y + 30), ctx.t(&"grow_grow_garden.wilted"), Color("#FF6F7D"), 16)
			tone(200, 0.35, &"sawtooth", 0.06, 0.6)
			if hearts_left <= 0:
				end()
				return
	# snails
	snail_t -= dt
	if snail_t <= 0.0:
		var targets: Array[int] = []
		for i in 9:
			if beds[i] != null and beds[i]["dead"] == 0.0:
				targets.append(i)
		if not targets.is_empty():
			var ti := targets[rng.randi() % targets.size()]
			var b := beds_rects[ti]
			var left := rng.randf() < 0.5
			snails.append({"x": -20.0 if left else W + 20.0, "y": b.end.y - 10.0, "ti": ti, "sp": 14.0 + level * 2.2, "dir": 1.0 if left else -1.0, "eat": 0.0, "home": false})
		snail_t = maxf(2.2, 9.0 - level * 0.5) * (0.7 + rng.randf() * 0.6)
	for s in snails:
		var b := beds_rects[s["ti"]]
		var target := Vector2(b.position.x + b.size.x / 2.0, b.end.y - 18.0)
		if s["home"]:
			s["x"] += s["dir"] * -120.0 * dt
			s["y"] -= 10.0 * dt
			continue
		var d := target - Vector2(s["x"], s["y"])
		if d.length() > 4.0:
			var step: Vector2 = d.normalized() * float(s["sp"]) * dt
			s["x"] += step.x
			s["y"] += step.y
			s["dir"] = 1.0 if d.x > 0.0 else -1.0
		else:
			s["eat"] += dt
			if s["eat"] > 0.8:
				var p: Variant = beds[s["ti"]]
				if p != null and p["dead"] == 0.0:
					p["stage"] -= 1
					p["growing"] = false
					p["g"] = 0.0
					p["wait"] = 0.0
					p["need"] = "water" if rng.randf() < 0.5 else "sun"
					if p["stage"] <= 0:
						p["dead"] = 0.01
						hearts_left -= 1
						shake(0.2)
					float_text(target - Vector2(0, 50), ctx.t(&"grow_grow_garden.munch"), Color("#FF6F7D"), 15)
					tone(260, 0.15, &"square", 0.04, 0.7)
				s["home"] = true
				if hearts_left <= 0:
					end()
					return
	snails = snails.filter(func(s: Dictionary) -> bool: return s["x"] > -60.0 and s["x"] < W + 60.0)
	if hint_t > 0.0:
		hint_t -= dt


func _make_result() -> MinigameResult:
	return MinigameResult.make(score, harvest, t)


# ---------------------------------------------------------------- controls

func _down(p: Vector2, _id: int) -> void:
	if p.y > 470.0:
		for o: Array in TOOLS:
			if p.distance_to(Vector2(o[1], 516)) < 44.0:
				tool = o[0]
				tone(640, 0.05, &"sine", 0.05)
		return
	for s in snails:
		if not s["home"] and p.distance_to(Vector2(s["x"], s["y"])) < 26.0:
			s["home"] = true
			add_score(20)
			float_text(Vector2(s["x"], s["y"] - 20), "+20", Color("#FFD54A"), 15)
			tone(900, 0.08, &"triangle", 0.06, 1.5)
			return
	var i := -1
	for k in 9:
		if beds_rects[k].has_point(p):
			i = k
	if i < 0:
		return
	tap_bed(i)


## Use the tool in hand on bed i (the bot uses this too).
func tap_bed(i: int) -> void:
	var p: Variant = beds[i]
	var b := beds_rects[i]
	if p == null:
		_hint(&"grow_grow_garden.hint.empty")
		return
	if p["dead"] > 0.0 or p["growing"]:
		return
	var wants: String = "harvest" if tool == "basket" else tool
	if p["need"] != wants:
		_hint(&"grow_grow_garden.hint.ready" if p["need"] == "harvest" else (&"grow_grow_garden.hint.water" if p["need"] == "water" else &"grow_grow_garden.hint.sun"))
		return
	if p["need"] == "harvest":
		harvest += 1
		var pts := (300 if p["gold"] else 100) + roundi(maxf(0.0, 1.0 - p["wait"] / patience()) * 50.0)
		add_score(pts)
		float_text(b.position + Vector2(48, 20), "+%d" % pts, Color("#FFD54A"), 20)
		burst(b.position + Vector2(48, 40), Color("#FFD54A") if p["gold"] else Color(p["col"]), 14)
		tone(1100, 0.12, &"triangle", 0.08, 1.4)
		beds[i] = null
		return
	var fed: String = p["need"]
	p["need"] = ""
	p["growing"] = true
	p["g"] = 0.0
	p["bounce"] = 1.0
	add_score(10)
	burst(b.position + Vector2(48, 50), Color("#8FD3FF") if fed == "water" else Color("#FFD54A"), 6, 80)
	tone(380 if tool == "water" else 760, 0.12, &"sine", 0.06, 1.5)


func _hint(key: StringName) -> void:
	hint_text = ctx.t(key)
	hint_t = 1.2
	tone(220, 0.08, &"square", 0.04)


func _key(keycode: Key, pressed: bool) -> bool:
	if keycode < KEY_1 or keycode > KEY_3:
		return false
	if pressed:
		tool = TOOLS[keycode - KEY_1][0]
	return true


# ---------------------------------------------------------------- drawing

func _draw_game() -> void:
	var v := view_rect
	fill_view(Color("#E9FFF6"))
	var x := floorf(v.position.x / 40.0) * 40.0
	while x < v.end.x:
		line(PackedVector2Array([Vector2(x, 52), Vector2(x, 430)]), Color(0.231, 0.655, 0.627, 0.15), 2)
		x += 40.0
	for i in 9:
		var b := beds_rects[i]
		var p: Variant = beds[i]
		rr(b.position.x, b.position.y, b.size.x, b.size.y, 14, Color("#B5764A"))
		rr(b.position.x + 6, b.position.y + 6, b.size.x - 12, b.size.y - 12, 10, Color("#8E5E34"), null, 0)
		var cx := b.position.x + b.size.x / 2.0
		var gy := b.end.y - 18.0
		if p == null:
			if i == next_bed and sprout_t < 1.0:
				# the soil wiggles just before a seed pops up
				var w := sin(t * 30.0) * 2.0 * (1.0 - sprout_t)
				var mound := PackedVector2Array()
				for k in 13:
					var a := PI + PI * k / 12.0
					mound.append(Vector2(cx + w + cos(a) * 14.0, gy + 2.0 + sin(a) * 7.0))
				poly(mound, Color("#B5764A"), INK, 2)
			continue
		var wilt := 0.0
		if p["need"] != "" and not p["growing"]:
			wilt = minf(1.0, p["wait"] / (patience() * (1.5 if p["need"] == "harvest" else 1.0)))
		var lean := (maxf(0.0, wilt - 0.6) * 0.9) + (0.9 if p["dead"] > 0.0 else 0.0)
		_plant(cx, gy, p, lean, wilt, maxf(0.0, 1.0 - p["dead"]) if p["dead"] > 0.0 else 1.0)
		if p["dead"] > 0.0:
			continue
		if p["growing"]:
			bar(b.position.x + 14, b.end.y - 13, b.size.x - 28, 8, p["g"], Color("#7ED3B2"))
		elif p["need"] != "":
			var bx := b.end.x - 20.0
			var by := b.position.y + 20.0 + sin(t * 4.0 + i) * 2.0
			var urgent := wilt > 0.65
			circle(bx, by, 15, Color.WHITE, Color("#E5484D") if urgent else INK, 3 if urgent else 2.5)
			_need_icon(p["need"], bx, by, 0.8)
			arc(bx, by, 19, -PI / 2.0, -PI / 2.0 + TAU * (1.0 - wilt), Color("#E5484D") if urgent else Color("#FFC94D"), 3)
	for s in snails:
		push(Vector2(s["x"], s["y"]), 0.0, Vector2(s["dir"], 1.0))
		ellipse(0, 4, 14, 5, Color("#B9D98A"), INK, 2)
		circle(-3, -3, 8, Color("#C98A55"), INK, 2)
		var spiral := PackedVector2Array()
		for k in 12:
			var a := 5.0 * k / 11.0
			spiral.append(Vector2(-3, -3) + Vector2(cos(a), sin(a)) * 4.0)
		line(spiral, INK, 1.6)
		line(PackedVector2Array([Vector2(9, 1), Vector2(13, -8)]), INK, 1.6)
		line(PackedVector2Array([Vector2(11, 2), Vector2(17, -5)]), INK, 1.6)
		pop()
	# tools
	rr(8, 440, W - 16, 192, 20, Color.WHITE)
	text(ctx.t(&"grow_grow_garden.tools"), 30, 460, 11, Color("#3BA7A0"), &"left", &"body")
	for i in TOOLS.size():
		var o: Array = TOOLS[i]
		var on: bool = tool == o[0]
		circle(o[1], 516, 36, Color("#FFF3B0") if on else Color("#F6F3FF"), INK if on else Color("#CFC8E3"), 3.5 if on else 2.5)
		_need_icon(o[0], o[1], 516, 1.25)
		text(ctx.t(StringName("grow_grow_garden.tool." + String(o[0]))), o[1], 566, 12, INK if on else Color("#7C7494"), &"center", &"body")
		text(str(i + 1), o[1] + 44, 486, 11, Color("#B0A8C8"), &"center", &"body")
	var who: StringName = ctx.squad[0] if not ctx.squad.is_empty() else &"sprout"
	sprite(who, 36, 624, 40, {"sy": 1.0 + sin(t * 3.0) * 0.04})
	text(hint_text if hint_t > 0.0 else _tip(), W / 2.0 + 14, 604, 13, Color("#E5484D") if hint_t > 0.0 else Color("#5E5679"), &"center", &"body")
	# top bar
	hud(Color("#3BA7A0"), "★ " + fmt(score), 116)
	hearts(W - 66, 26, hearts_left)
	rr(134, 12, 92, 28, 14, Color.WHITE)
	text(ctx.t(&"grow_grow_garden.harvest_count", {"n": harvest}), 180, 27, 13, INK, &"center", &"body")


func _tip() -> String:
	if not beds.any(func(p: Variant) -> bool: return p != null):
		return ctx.t(&"grow_grow_garden.tip.waiting")
	return ctx.t(StringName("grow_grow_garden.tip." + tool))


func _need_icon(k: String, x: float, y: float, s: float) -> void:
	push(Vector2(x, y), 0.0, Vector2(s, s))
	match k:
		"water":
			var drop := quad(Vector2(0, -12), Vector2(11, 2), Vector2(0, 10))
			drop.append_array(quad(Vector2(0, 10), Vector2(-11, 2), Vector2(0, -12)))
			poly(drop, Color("#8FD3FF"), INK, 2)
		"sun":
			for i in 8:
				var a := i / 8.0 * TAU
				line(PackedVector2Array([Vector2(cos(a), sin(a)) * 9.0, Vector2(cos(a), sin(a)) * 14.0]), Color("#F59E0B"), 2.6)
			circle(0, 0, 8, Color("#FFD54A"), INK, 2)
		"harvest", "basket":
			poly(PackedVector2Array([Vector2(-12, -2), Vector2(12, -2), Vector2(8, 10), Vector2(-8, 10)]), Color("#C98A55"), INK, 2)
			line(quad(Vector2(-8, -2), Vector2(0, -16), Vector2(8, -2)), INK, 2)
	pop()


func _plant(x: float, y: float, p: Dictionary, lean: float, wilt: float, alpha: float) -> void:
	var st: float = p["stage"] + p["g"] * 0.9 if p["growing"] else float(p["stage"])
	var h := 8.0 + st * 15.0
	var wobble: float = p["bounce"] * sin(t * 20.0) * 0.06
	push(Vector2(x, y), lean * (1.0 if sin(x) > 0.0 else -1.0) + wobble, Vector2(1.35, 1.35))
	if st < 0.6:
		circle(0, 0, 4, Color("#E0B07A", alpha), Color(INK, alpha), 1.6)
		pop()
		return
	var stem := Color("#9AA36A" if wilt > 0.6 else "#4E9B4E", alpha)
	var leaf := Color("#C6C98A" if wilt > 0.6 else "#7ED36A", alpha)
	var ink := Color(INK, alpha)
	line(quad(Vector2.ZERO, Vector2(-3, -h / 2.0), Vector2(0, -h)), stem, 3.5)
	var leaves := [[-1.0, 0.45], [1.0, 0.65]]
	for n in (2 if st >= 2.0 else 1):
		var k: float = leaves[n][0]
		var f: float = leaves[n][1]
		var c := Vector2(0, -h * f) + Vector2(k * 10.0, 0).rotated(k * 0.7)
		ellipse(c.x, c.y, 11, 5, leaf, ink, 2, k * 0.7)
	if st >= 3.0 and st < 4.0:
		circle(0, -h - 4, 7, Color("#7ED36A", alpha), ink, 2)
	if p["stage"] >= 4:
		var col := Color("#FFD54A" if p["gold"] else p["col"], alpha)
		for i in 6:
			var a := i / 6.0 * TAU + t
			circle(cos(a) * 9.0, -h - 6.0 + sin(a) * 9.0, 7, col, ink, 2)
		circle(0, -h - 6, 6, Color("#FFE27A", alpha), ink, 2)
		if p["gold"]:
			star(16, -h - 20, 6, 2.5, Color("#FFF3B0", alpha), ink, 1.5)
	pop()
