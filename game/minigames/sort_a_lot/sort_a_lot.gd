extends KitGame
## SORT-A-LOT (Squishy Post Office): endless. Letters ride the conveyor belt; swipe each one into the mail bag with
## the same stamp. The belt speeds up and more bags open the longer you go. 3 hearts.
## Ported from prototypes/games/sort-a-lot.js. Score = points; metric = letters sorted (the building's goal).

const BAGS := [["#E2B676", &"bao"], ["#FF8FB8", &"marshmallow"], ["#8CCBFF", &"jelly"], ["#7ED3B2", &"sprout"], ["#FFB833", &"toast"], ["#B48CFF", &"moon"]]
const BELT_Y := 236.0

var rng := RandomNumberGenerator.new()
var seed_value := -1

var letters: Array[Dictionary] = []
var hearts_left := 3
var sorted_count := 0
var streak := 0
var level := 0
var spawn := 0.4
var drag: Dictionary = {}
var belt := 0.0
var flashes: Array[Dictionary] = []
var fetch_timer := 0.0


func _init_run(_level: int) -> void:
	if seed_value >= 0:
		rng.seed = seed_value
	else:
		rng.randomize()
	letters.clear()
	hearts_left = 3
	sorted_count = 0
	streak = 0
	level = 0
	spawn = 0.4
	drag = {}
	belt = 0.0
	flashes.clear()
	fetch_timer = 0.0


## The bags open right now: {"col", "sq", "pat", "x", "w", "i"}.
func bags_now() -> Array[Dictionary]:
	var n := mini(6, 2 + level / 2)
	var spots := level >= 9
	var out: Array[Dictionary] = []
	var w := (W - 20.0) / n
	for i in n:
		var b: Array = BAGS[i % 4 if spots else i]
		out.append({"col": b[0], "sq": b[1], "pat": "dots" if spots and i >= 4 else "plain", "x": 10.0 + w * (i + 0.5), "w": w - 6.0, "i": i})
	return out


func mult() -> int:
	return mini(5, 1 + streak / 5)


func can_revive() -> bool:
	return true


func revive() -> void:
	hearts_left = 1
	streak = 0
	letters = letters.filter(func(l: Dictionary) -> bool: return l["x"] < W * 0.5 or l["fly"] != null)


func _update(dt: float) -> void:
	level = sorted_count / 7
	var speed := minf(175.0, 46.0 + level * 9.0) * (1.0 - ctx.perk(&"slower_belt"))
	var interval := maxf(0.55, 2.1 - level * 0.12)
	var bags := bags_now()
	belt = fmod(belt + speed * dt, 30.0)
	spawn -= dt
	if spawn <= 0.0:
		var b := bags[rng.randi() % bags.size()]
		letters.append({"x": -30.0, "y": BELT_Y - 22.0, "bag": b["i"], "col": b["col"], "pat": b["pat"], "r": (rng.randf() - 0.5) * 0.2, "fly": null})
		spawn = interval * (0.75 + rng.randf() * 0.5)
	# Pet Pals helpers fetch a letter now and then
	var every := ctx.perk(&"fetch_every")
	if every > 0.0:
		fetch_timer += dt
		if fetch_timer >= every:
			fetch_timer = 0.0
			var front := _front_letter()
			if not front.is_empty():
				for b in bags:
					if b["i"] == front["bag"]:
						float_text(Vector2(front["x"], front["y"] - 30.0), ctx.t(&"sort_a_lot.fetched"), Color("#7ED3B2"), 15)
						send_to(front, b)
						break
	for l in letters:
		if l["fly"] != null:
			var f: Dictionary = l["fly"]
			f["t"] += dt * 4.0
			var u := minf(1.0, f["t"])
			l["x"] = lerpf(f["x0"], f["x1"], u)
			l["y"] = lerpf(f["y0"], f["y1"], u) - sin(u * PI) * 40.0
			if u >= 1.0:
				l["dead"] = true
			continue
		if not drag.is_empty() and is_same(drag["l"], l):
			continue
		if l["y"] < BELT_Y - 22.0:
			l["y"] = minf(BELT_Y - 22.0, l["y"] + dt * 300.0)
		l["x"] += speed * dt
		if l["x"] > W + 30.0:
			l["dead"] = true
			_miss(ctx.t(&"sort_a_lot.missed"))
			if state != State.PLAY:
				return
	letters = letters.filter(func(l: Dictionary) -> bool: return not l.get("dead", false))
	for f in flashes:
		f["t"] -= dt
	flashes = flashes.filter(func(f: Dictionary) -> bool: return f["t"] > 0.0)


func _front_letter() -> Dictionary:
	var best: Dictionary = {}
	for l in letters:
		if l["fly"] == null and l["x"] > 0.0 and (drag.is_empty() or not is_same(drag["l"], l)) and (best.is_empty() or l["x"] > best["x"]):
			best = l
	return best


func send_to(l: Dictionary, b: Dictionary) -> void:
	l["fly"] = {"t": 0.0, "x0": l["x"], "y0": l["y"], "x1": b["x"], "y1": 500.0}
	var ok: bool = l["bag"] == b["i"] or (l["col"] == b["col"] and l["pat"] == b["pat"])
	flashes.append({"i": b["i"], "t": 0.5, "ok": ok})
	if ok:
		sorted_count += 1
		streak += 1
		var pts := 10 * mult()
		add_score(pts)
		float_text(Vector2(b["x"], 440), "+%d" % pts, Color("#FFD54A"), 18)
		tone(700 + mini(12, streak) * 40, 0.07, &"triangle", 0.07, 1.3)
	else:
		_miss(ctx.t(&"sort_a_lot.wrong_bag"), b["x"])


func _miss(words: String, at_x := W - 40.0) -> void:
	hearts_left -= 1
	streak = 0
	shake(0.25)
	ctx.buzz(70)
	float_text(Vector2(at_x, 420), words, Color("#FF6F7D"), 16)
	tone(200, 0.25, &"square", 0.05, 0.6)
	if hearts_left <= 0:
		end()


func _make_result() -> MinigameResult:
	return MinigameResult.make(score, sorted_count, t)


# ---------------------------------------------------------------- controls

func _down(p: Vector2, _id: int) -> void:
	for i in range(letters.size() - 1, -1, -1):
		var l := letters[i]
		if l["fly"] == null and absf(l["x"] - p.x) < 34.0 and absf(l["y"] - p.y) < 30.0:
			drag = {"l": l, "x": p.x, "y": p.y, "hist": [[p.x, p.y, t]]}
			return


func _move(p: Vector2, _id: int, _pressed: bool) -> void:
	if drag.is_empty():
		return
	drag["x"] = p.x
	drag["y"] = p.y
	drag["l"]["x"] = p.x
	drag["l"]["y"] = p.y - 10.0
	(drag["hist"] as Array).append([p.x, p.y, t])
	if (drag["hist"] as Array).size() > 6:
		(drag["hist"] as Array).pop_front()


func _up(p: Vector2, _id: int) -> void:
	if drag.is_empty():
		return
	var d := drag
	drag = {}
	var first: Array = (d["hist"] as Array)[0]
	var ms := maxf(16.0, (t - float(first[2])) * 1000.0)
	var vx := (p.x - float(first[0])) / ms
	var vy := (p.y - float(first[1])) / ms
	var tx := p.x
	if p.y < 430.0 and vy > 0.25:
		tx = p.x + vx / vy * (540.0 - p.y)   # a quick swipe flies toward where it is heading
	elif p.y < 400.0:
		return                               # let go too high: the letter goes back to the belt
	var bags := bags_now()
	var best := bags[0]
	for b in bags:
		if absf(b["x"] - tx) < absf(best["x"] - tx):
			best = b
	send_to(d["l"], best)


func _key(keycode: Key, pressed: bool) -> bool:
	if keycode < KEY_1 or keycode > KEY_6:
		return false
	if pressed:
		var bags := bags_now()
		var i := keycode - KEY_1
		var front := _front_letter()
		if i < bags.size() and not front.is_empty():
			send_to(front, bags[i])
	return true


# ---------------------------------------------------------------- drawing

func _draw_game() -> void:
	var bags := bags_now()
	draw_rect(Rect2(0, 0, W, H), Color("#FFF7D6"))
	for i in 8:
		draw_rect(Rect2(0, 52 + i * 60, W, 60), Color("#FFF2C2") if i % 2 else Color("#FFF7D6"))
	rr(70, 76, 220, 56, 14, Color.WHITE)
	text(ctx.t(&"sort_a_lot.help.1"), 180, 94, 13, Color("#3BA7A0"), &"center", &"body")
	text(ctx.t(&"sort_a_lot.help.2"), 180, 114, 13, Color("#3BA7A0"), &"center", &"body")
	# belt
	rr(-10, BELT_Y - 4, W + 20, 30, 8, Color("#5A5170"))
	for i in range(-1, 14):
		circle(i * 30 + belt, BELT_Y + 11, 7, Color("#9A8FAA"), INK, 2)
	draw_rect(Rect2(W - 24, BELT_Y - 60, 24, 90), Color(0.898, 0.282, 0.302, 0.18))
	text("!", W - 12, BELT_Y - 40, 16, Color("#E5484D"), &"center", &"display")
	# bags
	for b in bags:
		var bx: float = b["x"]
		var w := minf(70.0, b["w"])
		var top := 466.0
		var hot: bool = not drag.is_empty() and absf(drag["x"] - bx) < b["w"] / 2.0 and drag["y"] > 380.0
		var k := 1.08 if hot else 1.0
		var fl: Dictionary = {}
		for f in flashes:
			if f["i"] == b["i"]:
				fl = f
		push(Vector2(bx, 600) * (1.0 - k), 0.0, Vector2(k, k))
		var shape := quad(Vector2(bx - w / 2.0, 630), Vector2(bx - w / 2.0 - 6, top + 30), Vector2(bx - w * 0.3, top))
		shape.append_array(quad(Vector2(bx + w * 0.3, top), Vector2(bx + w / 2.0 + 6, top + 30), Vector2(bx + w / 2.0, 630)))
		poly(shape, Color(b["col"]))
		line(quad(Vector2(bx - w * 0.3, top + 6), Vector2(bx, top - 8), Vector2(bx + w * 0.3, top + 6)), Color(INK, 0.5), 2)
		rr(bx - 19, top + 14, 38, 40, 8, Color.WHITE, INK, 2)
		_stamp(bx, top + 34, Color(b["col"]), b["pat"], 1.3)
		if not fl.is_empty():
			circle(bx, top + 60, 40, Color("#4FCFA0" if fl["ok"] else "#FF6F7D", fl["t"] * 2.0), null, 0)
		pop()
		sprite(b["sq"], bx, 616, minf(56.0, w * 0.9))
		text(str(b["i"] + 1), bx, 632, 10, Color(INK, 0.45), &"center", &"body")
	# letters
	for l in letters:
		var held := not drag.is_empty() and is_same(drag["l"], l)
		_letter(l["x"], l["y"], Color(l["col"]), l["pat"], l["r"] + (sin(t * 20.0) * 0.05 if held else 0.0), 1.25 if held else 1.0)
	if not drag.is_empty():
		draw_dashed_line(Vector2(drag["x"], drag["y"] + 20), Vector2(drag["x"], 460), Color(INK, 0.35), 2.0, 6.0)
	# top bar
	hud(Color("#3BA7A0"), "★ " + fmt(score), 116)
	hearts(W - 66, 26, hearts_left)
	rr(134, 12, 84, 28, 14, Color.WHITE)
	text(ctx.t(&"sort_a_lot.streak", {"n": mult()}), 176, 27, 13, INK, &"center", &"body")
	text(ctx.t(&"sort_a_lot.sorted", {"n": sorted_count}), W / 2.0, 448, 13, Color("#3BA7A0"), &"center", &"body")


func _letter(x: float, y: float, col: Color, pat: String, r: float, s: float) -> void:
	push(Vector2(x, y), r, Vector2(s, s))
	rr(-27, -18, 54, 36, 4, Color.WHITE, Color("#9A8FAA"), 2.5)
	line(PackedVector2Array([Vector2(-27, -18), Vector2(0, 2), Vector2(27, -18)]), Color("#9A8FAA"), 2)
	_stamp(15, -6, col, pat, 0.9)
	pop()


## A stamp (in whatever transform is active): a coloured square, with white spots for the later "dots" kind.
func _stamp(x: float, y: float, col: Color, pat: String, s: float) -> void:
	rr(x - 8 * s, y - 9 * s, 16 * s, 18 * s, 2 * s, col, INK, 2)
	if pat == "dots":
		for d: Vector2 in [Vector2(-3, -4), Vector2(3, 0), Vector2(-3, 4)]:
			circle(x + d.x * s, y + d.y * s, 2 * s, Color.WHITE, null, 0)
