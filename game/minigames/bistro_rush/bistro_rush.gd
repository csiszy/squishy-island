extends KitGame
## BISTRO RUSH (Squish Bistro): endless. Customers keep coming, faster and hungrier. Cook what they show in their
## bubble and serve it before their patience runs out. 3 hearts. Ported from prototypes/games/bistro-rush.js.
## Score = points; metric = orders served.

const COOK := {"noodles": 1.3, "cake": 1.7, "juice": 0.8, "cookie": 1.0, "dumpling": 2.1}
const GUESTS: Array[StringName] = [&"kitty", &"puff", &"puppy", &"bunny", &"toast", &"macaron", &"peach", &"jelly", &"egg", &"hamster", &"donut", &"avocado", &"whale", &"axolotl", &"acorn", &"raindrop"]
const SEATS := [62.0, 180.0, 298.0]
const PANS := [70.0, 160.0, 250.0]
const TRAY_Y := 578.0

var rng := RandomNumberGenerator.new()
var seed_value := -1

var seats: Array = [null, null, null]
var pans: Array = [null, null, null]
var hearts_left := 3
var sel := -1
var drag: Dictionary = {}
var spawn := 1.2
var served := 0
var combo := 0
var chef_bounce := 0.0
var difficulty := 0.0
var fifth := false


func _init_run(_level: int) -> void:
	if seed_value >= 0:
		rng.seed = seed_value
	else:
		rng.randomize()
	seats = [null, null, null]
	pans = [null, null, null]
	hearts_left = 3
	sel = -1
	drag = {}
	spawn = 1.2
	served = 0
	combo = 0
	chef_bounce = 0.0
	difficulty = 0.0
	fifth = false


func tray() -> Array[Dictionary]:
	var list := ["noodles", "cake", "juice", "cookie", "dumpling"] if fifth else ["noodles", "cake", "juice", "cookie"]
	var gap := W / (list.size() + 0.2)
	var out: Array[Dictionary] = []
	for i in list.size():
		out.append({"f": list[i], "x": gap * (i + 0.6), "y": TRAY_Y})
	return out


func can_revive() -> bool:
	return true


func revive() -> void:
	hearts_left = 1
	for c: Variant in seats:
		if c != null and c["leave"] == 0.0:
			c["p"] = 1.0


func _cook_time(f: String) -> float:
	return COOK[f] * (1.0 - ctx.perk(&"cook_faster"))


func _update(dt: float) -> void:
	# one smooth difficulty number: grows with time and with orders served, easing toward a hard-but-fair ceiling
	difficulty = t / 55.0 + served / 22.0
	if not fifth and difficulty >= 1.6:
		fifth = true
		float_text(Vector2(W / 2.0, 500), ctx.t(&"bistro_rush.new_dish"), Color("#FFD54A"), 18)
		tone(990, 0.15, &"triangle", 0.08, 1.3)
	var patience := (7.5 + 8.0 * exp(-difficulty / 2.6)) * (1.0 + ctx.perk(&"more_patience"))
	var interval := 1.45 + 2.1 * exp(-difficulty / 2.4)
	spawn -= dt
	if spawn <= 0.0:
		var free: Array[int] = []
		for i in 3:
			if seats[i] == null:
				free.append(i)
		if not free.is_empty():
			var i := free[rng.randi() % free.size()]
			var foods := tray().map(func(o: Dictionary) -> String: return o["f"])
			var n := 2 if rng.randf() < minf(0.6, 0.12 + difficulty * 0.1) else 1
			var order: Array[String] = []
			while order.size() < n:
				order.append(foods[rng.randi() % foods.size()])
			var got: Array[bool] = []
			got.resize(n)
			got.fill(false)
			seats[i] = {"who": GUESTS[rng.randi() % GUESTS.size()], "order": order, "got": got, "p": 1.0,
				"max": patience * (1.35 if n == 2 else 1.0), "in": 0.0, "leave": 0.0, "mood": 0}
			tone(880, 0.06, &"sine", 0.06)
		spawn = interval * (0.75 + rng.randf() * 0.5)
	for i in 3:
		var c: Variant = seats[i]
		if c == null:
			continue
		c["in"] = minf(1.0, c["in"] + dt * 3.0)
		if c["leave"] > 0.0:
			c["leave"] += dt * 2.2
			if c["leave"] > 1.0:
				seats[i] = null
			continue
		c["p"] -= dt / c["max"]
		if c["p"] <= 0.0:
			c["leave"] = 0.01
			c["mood"] = -1
			hearts_left -= 1
			combo = 0
			shake(0.25)
			ctx.buzz(80)
			tone(220, 0.25, &"sawtooth", 0.07, 0.6)
			float_text(Vector2(SEATS[i], 150), ctx.t(&"bistro_rush.too_slow"), Color("#FF6F7D"), 18)
			if hearts_left <= 0:
				end()
				return
	for p: Variant in pans:
		if p != null and p["t"] < 1.0:
			p["t"] += dt / _cook_time(p["f"])
			if p["t"] >= 1.0:
				p["t"] = 1.0
				tone(1180, 0.08, &"triangle", 0.07)
	chef_bounce = maxf(0.0, chef_bounce - dt * 3.0)


func _make_result() -> MinigameResult:
	return MinigameResult.make(score, served, t)


# ---------------------------------------------------------------- controls

func _down(p: Vector2, _id: int) -> void:
	# tray -> cook
	for o in tray():
		if p.distance_to(Vector2(o["x"], o["y"])) < 34.0:
			var free := pans.find(null)
			if free < 0:
				tone(180, 0.1, &"square", 0.04)
				return
			pans[free] = {"f": o["f"], "t": 0.0}
			chef_bounce = 1.0
			tone(520, 0.07, &"triangle", 0.07)
			return
	# a ready pan -> pick it up (tap, or start dragging)
	for i in 3:
		if p.distance_to(Vector2(PANS[i], 442)) < 32.0 and pans[i] != null and pans[i]["t"] >= 1.0:
			sel = i
			drag = {"i": i, "x": p.x, "y": p.y, "moved": false}
			tone(760, 0.05, &"sine", 0.06)
			return
	# a customer
	var ci := _seat_at(p)
	if ci >= 0 and sel >= 0:
		_serve(ci)


func _move(p: Vector2, _id: int, _pressed: bool) -> void:
	if drag.is_empty():
		return
	drag["x"] = p.x
	drag["y"] = p.y
	if p.y < 380.0:
		drag["moved"] = true


func _up(p: Vector2, _id: int) -> void:
	if drag.is_empty():
		return
	var d := drag
	drag = {}
	if d["moved"]:
		var ci := _seat_at(p)
		if ci >= 0:
			_serve(ci)


func _seat_at(p: Vector2) -> int:
	if p.y > 300.0 or p.y < 80.0:
		return -1
	for i in 3:
		if absf(SEATS[i] - p.x) < 58.0:
			return i
	return -1


func _serve(ci: int) -> void:
	var s: Variant = seats[ci]
	if s == null or s["leave"] > 0.0 or sel < 0 or pans[sel] == null:
		return
	var f: String = pans[sel]["f"]
	var k := -1
	for j: int in s["order"].size():
		if s["order"][j] == f and not s["got"][j]:
			k = j
			break
	if k < 0:
		float_text(Vector2(SEATS[ci], 200), ctx.t(&"bistro_rush.not_this"), Color.WHITE, 16)
		tone(200, 0.12, &"square", 0.05)
		sel = -1
		return
	s["got"][k] = true
	pans[sel] = null
	sel = -1
	tone(990, 0.08, &"sine", 0.08, 1.3)
	if not (s["got"] as Array).has(false):
		served += 1
		combo += 1
		var mult := mini(5, 1 + combo / 5)
		var pts: int = (100 * s["order"].size() + (50 if s["p"] > 0.5 else 0)) * mult
		add_score(pts)
		float_text(Vector2(SEATS[ci], 200), "+%d" % pts, Color("#FFD54A"), 22)
		burst(Vector2(SEATS[ci], 210), Color("#FF8FB8"), 12)
		s["leave"] = 0.01
		s["mood"] = 1
		tone(1320, 0.12, &"triangle", 0.08, 1.5)


# ---------------------------------------------------------------- drawing

func _draw_game() -> void:
	draw_rect(Rect2(0, 0, W, H), Color("#FFF1E0"))
	# window + street
	rr(14, 70, W - 28, 112, 14, Color("#BFE6F7"), Color("#C9A97A"), 4)
	draw_rect(Rect2(17, 150, W - 34, 29), Color("#9ED67E"))
	line(PackedVector2Array([Vector2(W / 2.0, 70), Vector2(W / 2.0, 182)]), Color("#C9A97A"), 3)
	# seats + customers
	for i in 3:
		var sx: float = SEATS[i]
		rr(sx - 22, 262, 44, 10, 5, Color("#E5484D"))
		draw_rect(Rect2(sx - 3, 272, 6, 26), Color("#8A6A4E"))
		var s: Variant = seats[i]
		if s == null:
			continue
		var side := -1.0 if i == 0 else 1.0
		var slide: float = s["leave"] * 260.0 * side if s["leave"] > 0.0 else (1.0 - s["in"]) * 220.0 * side
		var cy := 262.0 + sin(t * 3.0 + i) * 2.0
		var alpha: float = maxf(0.0, 1.0 - s["leave"]) if s["leave"] > 0.0 else 1.0
		sprite(s["who"], sx + slide, cy, 92, {"sy": 1.0 - absf(sin(t * 4.0 + i)) * 0.04, "alpha": alpha})
		if s["leave"] == 0.0 and s["in"] >= 1.0:
			_order_bubble(sx, s)
	# counter
	rr(-6, 296, W + 12, 22, 4, Color("#C98A55"))
	draw_rect(Rect2(0, 318, W, 46), Color("#E5484D"))
	for i in 13:
		draw_rect(Rect2(i * 30, 318, 15, 46), Color(1, 1, 1, 0.28))
	line(PackedVector2Array([Vector2(0, 364), Vector2(W, 364)]), INK, 2.5)
	# kitchen
	for i in 7:
		for j in 4:
			draw_rect(Rect2(i * 52, 365 + j * 40, 52, 40), Color("#FFEFE0") if (i + j) % 2 else Color("#FFF8EC"))
	draw_rect(Rect2(0, 525, W, H - 525), Color("#FFF8EC"))
	rr(22, 398, 268, 68, 16, Color("#E8E4EF"), Color("#9A8FAA"), 3)
	text(ctx.t(&"bistro_rush.pans"), 156, 412, 10, Color("#7C7494"), &"center", &"body")
	for i in 3:
		var px: float = PANS[i]
		var py := 442.0
		circle(px, py, 25, Color("#4A4458"), INK, 2.5)
		draw_rect(Rect2(px + 22, py - 3, 18, 6), Color("#4A4458"))
		circle(px, py, 19, Color("#5E5672"), null, 0)
		var p: Variant = pans[i]
		if p == null:
			continue
		if p["t"] < 1.0:
			_food(p["f"], px, py, 1.0, 0.55)
			draw_arc(Vector2(px, py), 30, -PI / 2.0, -PI / 2.0 + TAU * p["t"], 32, Color("#FFC94D"), 5, true)
			for k in 2:
				circle(px - 6 + k * 12, py - 30 - fmod(t * 30.0 + k * 12, 18.0), 5, Color(1, 1, 1, 0.5), null, 0)
		else:
			if sel == i:
				circle(px, py, 31, null, Color("#FFD54A"), 5)
			_food(p["f"], px, py - 4 + sin(t * 6.0 + i) * 2.0, 1.35)
			text(ctx.t(&"bistro_rush.ready"), px, py + 34, 10, Color("#2FB673"), &"center", &"body")
	# the chef: the squishy who plays
	var chef: StringName = ctx.squad[0] if not ctx.squad.is_empty() else &"bao"
	shadow(322, 470, 26)
	sprite(chef, 322, 470, 74, {"sy": 1.0 + chef_bounce * 0.12})
	push(Vector2(322, 404 - chef_bounce * 6))
	rr(-15, -2, 30, 13, 4, Color.WHITE, Color("#9A8FAA"), 2)
	circle(-9, -6, 8, Color.WHITE, Color("#9A8FAA"), 2)
	circle(0, -10, 9, Color.WHITE, Color("#9A8FAA"), 2)
	circle(9, -6, 8, Color.WHITE, Color("#9A8FAA"), 2)
	draw_rect(Rect2(-13, -6, 26, 8), Color.WHITE)
	pop()
	# tray
	rr(10, 516, W - 20, 116, 22, Color.WHITE)
	text(ctx.t(&"bistro_rush.tap_to_cook"), W / 2.0, 532, 10, Color("#7C7494"), &"center", &"body")
	var busy := not pans.has(null)
	for o in tray():
		circle(o["x"], o["y"], 30, Color("#F2EFFA") if busy else Color("#FFF6D6"), Color("#CFC8E3") if busy else Color("#F59E0B"), 3)
		_food(o["f"], o["x"], o["y"] + 2, 1.35, 0.45 if busy else 1.0)
	if not drag.is_empty() and pans[drag["i"]] != null:
		_food(pans[drag["i"]]["f"], drag["x"], drag["y"], 1.6)
	# top bar
	hud(Color("#E5484D"), "★ " + fmt(score), 116)
	hearts(W - 66, 26, hearts_left)
	if combo >= 5:
		text(ctx.t(&"bistro_rush.combo", {"n": mini(5, 1 + combo / 5)}), W / 2.0, 27, 15, Color("#FFF3B0"), &"center", &"display", INK, 3)
	for i in 14:
		var pts := PackedVector2Array([Vector2(i * 26, 52), Vector2(i * 26 + 26, 52), Vector2(i * 26 + 26, 62)])
		pts.append_array(quad(Vector2(i * 26 + 26, 62), Vector2(i * 26 + 13, 70), Vector2(i * 26, 62), 6))
		poly(pts, Color.WHITE if i % 2 else Color("#E5484D"), Color("#B83238"), 1.5)


func _order_bubble(sx: float, s: Dictionary) -> void:
	var n: int = s["order"].size()
	var bw := n * 44.0 + 16.0
	var bx := sx - bw / 2.0
	var by := 92.0
	rr(bx, by, bw, 50, 14, Color.WHITE)
	poly(PackedVector2Array([Vector2(sx - 7, by + 49), Vector2(sx, by + 60), Vector2(sx + 7, by + 49)]), Color.WHITE, INK, 2.5)
	draw_rect(Rect2(sx - 5.5, by + 46, 11, 4), Color.WHITE)
	for k: int in n:
		var fx := bx + 30.0 + k * 44.0
		var got: bool = s["got"][k]
		_food(s["order"][k], fx, by + 26, 1.1, 0.35 if got else 1.0)
		if got:
			line(PackedVector2Array([Vector2(fx - 9, by + 26), Vector2(fx - 2, by + 33), Vector2(fx + 11, by + 16)]), Color("#4FCFA0"), 4)
	bar(sx - 36, 160, 72, 11, s["p"])
	if sel >= 0 and pans[sel] != null and pans[sel]["t"] >= 1.0:
		var wanted := false
		for j: int in n:
			if s["order"][j] == pans[sel]["f"] and not s["got"][j]:
				wanted = true
		if wanted:
			var pts := rounded_rect(sx - 50, 186, 100, 78, 18)
			pts.append(pts[0])
			for j: int in range(0, pts.size() - 1, 2):
				draw_line(pts[j], pts[j + 1], Color("#FFC94D"), 3, true)


## The five foods, drawn around (x, y) at size s (like the prototype's FOODS[f].draw).
func _food(f: String, x: float, y: float, s: float, alpha := 1.0) -> void:
	push(Vector2(x, y), 0.0, Vector2(s, s))
	var a := func(c: String) -> Color: return Color(c, alpha)
	match f:
		"noodles":
			rr(-14, -2, 28, 14, 7, a.call("#FFFFFF"), a.call("#9A8FAA"), 2)
			for i in 3:
				line(quad(Vector2(-10 + i * 7, -2), Vector2(-7 + i * 7, -10), Vector2(-4 + i * 7, -2), 6), a.call("#F6B93B"), 3)
			line(PackedVector2Array([Vector2(6, -14), Vector2(12, -1)]), a.call("#8A6A4E"), 2)
			line(PackedVector2Array([Vector2(10, -14), Vector2(15, -2)]), a.call("#8A6A4E"), 2)
		"cake":
			poly(PackedVector2Array([Vector2(-13, 11), Vector2(-13, -1), Vector2(13, -7), Vector2(13, 11)]), a.call("#FFF1D6"), a.call("#D9B78A"), 2)
			line(PackedVector2Array([Vector2(-13, 4), Vector2(13, 1)]), a.call("#FF8FB8"), 3)
			circle(6, -11, 4.5, a.call("#EF3E5C"), a.call("#B02E40"), 1.5)
		"juice":
			poly(PackedVector2Array([Vector2(-9, -11), Vector2(9, -11), Vector2(7, 12), Vector2(-7, 12)]), a.call("#FFB833"), a.call("#C98A12"), 2)
			line(PackedVector2Array([Vector2(2, -11), Vector2(8, -19)]), a.call("#FF6FA3"), 2.4)
			circle(-7, -11, 3.6, a.call("#7ED36A"), a.call("#4E9B4E"), 1.2)
		"cookie":
			circle(0, 0, 12, a.call("#E0A060"), a.call("#A86A3A"), 2)
			for c: Vector2 in [Vector2(-4, -3), Vector2(4, 2), Vector2(-1, 5), Vector2(5, -5), Vector2(-6, 4)]:
				circle(c.x, c.y, 1.8, a.call("#7A4A2A"), null, 0)
		"dumpling":
			var pts := quad(Vector2(-13, 7), Vector2(0, -20), Vector2(13, 7))
			pts.append_array(quad(Vector2(13, 7), Vector2(0, 12), Vector2(-13, 7)))
			poly(pts, a.call("#FBF6EC"), a.call("#C9BFB0"), 2)
			for seg: Array in [[Vector2(-5, -4), Vector2(-3, 0)], [Vector2(0, -6), Vector2(0, -1)], [Vector2(5, -4), Vector2(3, 0)]]:
				line(PackedVector2Array(seg), a.call("#C9BFB0"), 2)
	pop()
