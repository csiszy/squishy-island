extends KitGame
## SQUISH BREAKER (Squish Arcade): level-based "balls versus bricks". Your squishies are the balls: one ball for
## every squishy you own. Aim, let go, and they all fly out in a stream, bouncing off walls and bricks; each hit
## takes 1 off a brick's number (Epic 2, Legendary 3, +1 per squishy level above 1). When every squishy is back,
## all bricks move down one row. Clear every brick to win; a brick on the floor loses. Each level is built for a
## "recommended" number of squishies; more squishies make it easier. Ported from prototypes/games/squish-breaker.js
## (same recipe and random numbers: KitRng). Result: won, level, stars (score = stars), metric = turns.

const COLS := 7
const CELL := 48.0
const X0 := (360.0 - 7 * 48.0) / 2.0
const TOP := 66.0
const ROWH := 44.0
const FLOOR_ROW := 10
const LY := 566.0
const BR := 8.0
const SPEED := 760.0
const BALL_SQ: Array[StringName] = [&"bao", &"kitty", &"jelly", &"marshmallow", &"puppy", &"peach", &"toast", &"bunny", &"whale", &"donut", &"sunny", &"acorn", &"octopus", &"macaron", &"hamster", &"shroomy"]
const HP_COLS := [Color8(255, 213, 74), Color8(255, 111, 163), Color8(165, 124, 255), Color8(74, 155, 255)]

var lv: Dictionary = {}
var bricks: Array[Dictionary] = []
var balls: Array[Dictionary] = []
var ball_ids: Array[StringName] = []
var n_balls := 8
var lx := W / 2.0
var next_x := -1.0
var phase := "aim"
var aiming := false
var ang := -PI / 2.0
var has_ang := false
var to_shoot := 0
var shoot_t := 0.0
var turns := 0
var fast := 1.0
var shot_t := 0.0
var desc := 0.0
var banner := 1.6
var sqi := 0
var _won := false
var _stars := 0
var _note := ""
var _restarted := false
var _rng := RandomNumberGenerator.new()


## How many squishies level n is built for (48 is every squishy in the game). Not a lock: just how tough it is.
static func need(n: int) -> int:
	return mini(48, 5 + int((n - 1) * 0.6))


static func recipe(n: int) -> Dictionary:
	var r := KitRng.new(n * 6151 + 3)
	var req := need(n)
	var d := minf(1.0, (n - 1) / 60.0)
	var rows := mini(12, 5 + n / 5)
	var grid: Array[Dictionary] = []
	for row in rows:
		var cnt := maxi(2, mini(COLS, roundi(2 + r.next() * 3 + d * 0.3)))
		# the prototype shuffles with sort(() => R() - .5): copy its result by running the same comparisons
		var cols := _js_shuffle_sort([0, 1, 2, 3, 4, 5, 6], r).slice(0, cnt)
		for c: int in cols:
			var hp := maxi(1, roundi(req * (0.72 + d * 0.08 + float(row) / rows * 0.25) * (0.6 + r.next() * 0.8)))
			grid.append({"r": row - rows + 2, "c": c, "hp": hp, "max": hp, "bomb": n >= 4 and r.next() < 0.06, "flash": 0.0})
	return {"n": n, "req": req, "rows": rows, "grid": grid, "par": rows + 2, "big": n % 10 == 0}


## The prototype shuffles brick columns with JavaScript's sort and a random comparator, which gives different
## levels in different browsers. This follows V8's TimSort for short lists (first run, then binary insertion) as
## Node 22 runs it: the same as the prototype there, and above all the same for every player of the game.
static func _js_shuffle_sort(a: Array, r: KitRng) -> Array:
	var out := a.duplicate()
	var n := out.size()
	if n < 2:
		return out
	# CountAndMakeRun
	var run := 2
	var descending := (r.next() - 0.5) < 0.0
	for i in range(2, n):
		var order := r.next() - 0.5
		if descending:
			if order >= 0.0:
				break
		elif order < 0.0:
			break
		run += 1
	if descending:
		var head := out.slice(0, run)
		head.reverse()
		for i in run:
			out[i] = head[i]
	# BinaryInsertionSort from the end of the run
	for start in range(run, n):
		var left := 0
		var right := start
		var pivot: Variant = out[start]
		while left < right:
			var mid := left + ((right - left) >> 1)
			if r.next() - 0.5 < 0.0:
				right = mid
			else:
				left = mid + 1
		var p := start
		while p > left:
			out[p] = out[p - 1]
			p -= 1
		out[left] = pivot
	return out


func _init_run(level: int) -> void:
	_rng.randomize()
	lv = recipe(maxi(1, level))
	bricks = []
	for b: Dictionary in lv["grid"]:
		bricks.append(b.duplicate())
	ball_ids = []
	if ctx != null:
		ball_ids.assign(ctx.squad)
	n_balls = clampi(ball_ids.size(), 1, 48) if not ball_ids.is_empty() else 8
	balls = []
	lx = W / 2.0
	next_x = -1.0
	phase = "aim"
	aiming = false
	ang = -PI / 2.0
	has_ang = false
	to_shoot = 0
	turns = 0
	fast = 1.0
	shot_t = 0.0
	desc = 0.0
	banner = 1.6
	sqi = 0
	_won = false
	_stars = 0
	_note = ""
	_restarted = false


func _brick_rect(b: Dictionary) -> Rect2:
	return Rect2(X0 + b["c"] * CELL + 3, TOP + b["r"] * ROWH + 3, CELL - 6, ROWH - 6)


func bricks_left() -> int:
	return bricks.filter(func(b: Dictionary) -> bool: return b["hp"] > 0).size()


## How hard a ball hits: Epic 2, Legendary 3, plus 1 for every level above 1.
func _power(id: StringName) -> int:
	var info: Dictionary = ctx.squad_info.get(id, {})
	var base := {"E": 2, "L": 3}.get(String(info.get("rarity", "C")), 1) as int
	return base + maxi(0, int(info.get("level", 1)) - 1)


func _ball_id(i: int) -> StringName:
	return ball_ids[i % ball_ids.size()] if not ball_ids.is_empty() else BALL_SQ[i % BALL_SQ.size()]


func can_revive() -> bool:
	return not _won and not _restarted


func revive() -> void:
	for b in bricks:
		b["r"] -= 3
	phase = "aim"


func _update(dt: float) -> void:
	banner = maxf(0.0, banner - dt)
	for b in bricks:
		b["flash"] = maxf(0.0, b["flash"] - dt * 5.0)
	if phase == "shoot":
		var sdt := dt * fast
		shot_t += dt
		if shot_t > 7.0:
			fast = maxf(fast, 2.5)
		if to_shoot > 0:
			shoot_t -= sdt
			while to_shoot > 0 and shoot_t <= 0.0:
				var id := _ball_id(sqi)
				sqi += 1
				balls.append({"x": lx, "y": LY - BR, "vx": cos(ang) * SPEED, "vy": sin(ang) * SPEED, "sq": id, "power": _power(id),
					"live": true, "homing": false, "rot": 0.0, "floaty": ctx.squad_info.get(id, {}).get("family", "") == "sky"})
				to_shoot -= 1
				shoot_t += 0.07
		for b in balls:
			_move_ball(b, sdt)
		for b in balls:
			if not b["live"] and b["homing"]:
				b["x"] += (next_x - b["x"]) * minf(1.0, sdt * 10.0)
				if absf(b["x"] - next_x) < 1.0:
					b["homing"] = false
		if to_shoot == 0 and balls.all(func(b: Dictionary) -> bool: return not b["live"] and not b["homing"]):
			_end_turn()
	elif phase == "descend":
		desc -= dt * 3.0
		if desc <= 0.0:
			phase = "aim"
			if bricks.any(func(b: Dictionary) -> bool: return b["hp"] > 0 and b["r"] >= FLOOR_ROW):
				_finish_level(false)


func set_aim(p: Vector2) -> void:
	var a := atan2(p.y - (LY - BR), p.x - lx)
	if a > -0.16 and a < PI / 2.0:
		a = -0.16
	if a >= PI / 2.0 or a < -PI + 0.16:
		a = -PI + 0.16
	ang = a
	has_ang = true


func shoot() -> void:
	if not has_ang or phase != "aim":
		return
	phase = "shoot"
	to_shoot = n_balls
	shoot_t = 0.0
	balls = []
	next_x = -1.0
	fast = 1.0
	shot_t = 0.0
	tone(520, 0.12, &"triangle", 0.07, 1.6)


func _end_turn() -> void:
	turns += 1
	if next_x >= 0.0:
		lx = next_x
	balls = []
	if bricks_left() == 0:
		_finish_level(true)
		return
	for b in bricks:
		b["r"] += 1
	phase = "descend"
	desc = 1.0
	tone(240, 0.15, &"sine", 0.05, 0.8)


func _finish_level(win: bool) -> void:
	_won = win
	_stars = (3 if turns <= lv["par"] else (2 if turns <= lv["par"] + 3 else 1)) if win else 0
	_note = ctx.t(&"squish_breaker.note.win", {"n": turns, "balls": n_balls}) if win else ctx.t(&"squish_breaker.note.lose", {"n": bricks_left()})
	phase = "over"
	if win:
		raise_score(_stars)
	end()


func restart_level() -> void:
	_restarted = true
	_won = false
	_note = ""
	end()


func _make_result() -> MinigameResult:
	var r := MinigameResult.make(_stars if _won else 0, turns, t)
	r.won = _won
	r.level = lv["n"]
	r.stars = _stars if _won else 0
	r.note = _note
	return r


func _hit(b: Dictionary, power: int) -> void:
	b["hp"] = maxi(0, b["hp"] - power)
	b["flash"] = 1.0
	if b["hp"] > 0:
		if _rng.randf() < 0.5:
			tone(500 + _rng.randf() * 300, 0.03, &"square", 0.025)
		return
	var rc := _brick_rect(b)
	burst(rc.get_center(), Color("#FF8A3D") if b["bomb"] else _hp_col(0.5), 10, 120)
	tone(880, 0.08, &"triangle", 0.06, 1.4)
	if b["bomb"]:
		shake(0.2)
		ctx.buzz(30)
		for o in bricks:
			if o["hp"] > 0 and absi(o["r"] - b["r"]) <= 1 and absi(o["c"] - b["c"]) <= 1:
				o["hp"] = maxi(0, o["hp"] - 5)
				o["flash"] = 1.0
				if o["hp"] == 0:
					burst(_brick_rect(o).get_center(), _hp_col(0.5), 10, 120)


func _move_ball(b: Dictionary, dt: float) -> void:
	if not b["live"]:
		return
	var rem := SPEED * dt
	while rem > 0.0 and b["live"]:
		var s := minf(rem, 5.0)
		rem -= s
		var v := Vector2(b["vx"], b["vy"]).normalized()
		b["x"] += v.x * s
		b["y"] += v.y * s
		b["rot"] += s * 0.02
		if b["x"] < X0 + BR:
			b["x"] = X0 + BR
			b["vx"] = absf(b["vx"])
		if b["x"] > X0 + COLS * CELL - BR:
			b["x"] = X0 + COLS * CELL - BR
			b["vx"] = -absf(b["vx"])
		if b["y"] < TOP + BR - 4.0:
			b["y"] = TOP + BR - 4.0
			b["vy"] = absf(b["vy"])
			if b["floaty"]:
				# Sky Puffs drift down from the top more gently (and so stay up among the bricks longer)
				b["vy"] *= 1.0 - ctx.perk(&"float_longer")
		for k in bricks:
			if k["hp"] <= 0:
				continue
			var rc := _brick_rect(k)
			if b["x"] < rc.position.x - BR or b["x"] > rc.end.x + BR or b["y"] < rc.position.y - BR or b["y"] > rc.end.y + BR:
				continue
			var cx := clampf(b["x"], rc.position.x, rc.end.x)
			var cy := clampf(b["y"], rc.position.y, rc.end.y)
			var n := Vector2(b["x"] - cx, b["y"] - cy)
			var d := n.length()
			if d >= BR:
				continue
			if d < 0.000001:
				n = -Vector2(b["vx"], b["vy"])
				d = n.length()
			n /= d
			b["x"] = cx + n.x * BR
			b["y"] = cy + n.y * BR
			var dot: float = b["vx"] * n.x + b["vy"] * n.y
			if dot < 0.0:
				b["vx"] -= 2.0 * dot * n.x
				b["vy"] -= 2.0 * dot * n.y
			_hit(k, b["power"])
			break
		if absf(b["vy"]) < SPEED * 0.12:
			b["vy"] = (-1.0 if b["vy"] < 0.0 else 1.0) * SPEED * 0.12
			var m := Vector2(b["vx"], b["vy"]).length()
			b["vx"] *= SPEED / m
			b["vy"] *= SPEED / m
		if b["y"] > LY - BR and b["vy"] > 0.0:
			b["y"] = LY - BR
			b["live"] = false
			if next_x < 0.0:
				next_x = clampf(b["x"], X0 + 16, X0 + COLS * CELL - 16)
			else:
				b["homing"] = true


## The dotted aim line: to the first wall or brick, then one bounce.
func _trace(start: Vector2, a: float) -> PackedVector2Array:
	var pts := PackedVector2Array([start])
	var p := start
	var v := Vector2(cos(a), sin(a))
	var length := 0.0
	var bounces := 0
	while length < 900.0 and bounces < 2:
		p += v * 4.0
		length += 4.0
		if p.x < X0 + BR or p.x > X0 + COLS * CELL - BR:
			v.x = -v.x
			bounces += 1
			pts.append(p)
		if p.y < TOP + BR - 4.0:
			v.y = -v.y
			bounces += 1
			pts.append(p)
		var hit := false
		for k in bricks:
			if k["hp"] > 0 and _brick_rect(k).grow(BR).has_point(p):
				hit = true
				break
		if hit:
			break
		if p.y > LY:
			break
	pts.append(p)
	return pts


func _hp_col(f: float) -> Color:
	var i := mini(2, int(f * 3.0))
	return HP_COLS[i].lerp(HP_COLS[i + 1], minf(1.0, f * 3.0 - i))


# ---------------------------------------------------------------- controls

func _down(p: Vector2, _id: int) -> void:
	if phase == "shoot":
		if p.y > 590.0 and p.x > W - 100.0:
			fast = 1.0 if fast > 1.0 else 2.5
		return
	if phase != "aim":
		return
	aiming = true
	set_aim(p)


func _move(p: Vector2, _id: int, _pressed: bool) -> void:
	if aiming and phase == "aim":
		set_aim(p)


func _up(p: Vector2, _id: int) -> void:
	if not aiming or phase != "aim":
		return
	aiming = false
	if p.y < LY - 12.0:
		shoot()


func _key(keycode: Key, pressed: bool) -> bool:
	if not pressed:
		return keycode in [KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_F]
	match keycode:
		KEY_F:
			if phase == "shoot":
				fast = 1.0 if fast > 1.0 else 2.5
		KEY_LEFT, KEY_RIGHT:
			if phase == "aim":
				ang = clampf(ang + (-0.04 if keycode == KEY_LEFT else 0.04), -PI + 0.16, -0.16)
				has_ang = true
				aiming = false
		KEY_SPACE:
			if phase == "aim":
				has_ang = true
				shoot()
		_:
			return false
	return true


# ---------------------------------------------------------------- drawing

func _draw_game() -> void:
	vgradient(view_rect, Color("#2A2350"), Color("#4A2F6E"))
	for i in 26:
		var a := 0.2 + 0.4 * absf(sin(t + i * 1.7))
		rect(float((i * 97) % int(W)), 70 + (i * 61) % 480, 2, 2, Color("#FFE9A8", a))
	rr(X0 - 4, TOP - 6, COLS * CELL + 8, LY - TOP + 12, 14, Color(1, 1, 1, 0.05), Color(1, 1, 1, 0.25), 2)
	var dy := TOP + (FLOOR_ROW - 1) * ROWH + ROWH
	dashed(Vector2(X0, dy), Vector2(X0 + COLS * CELL, dy), Color(1.0, 0.435, 0.49, 0.7), 2, 8)
	# bricks
	var off := -desc * ROWH if phase == "descend" else 0.0
	for b in bricks:
		if b["hp"] <= 0:
			continue
		var rc := _brick_rect(b)
		rc.position.y += off
		if rc.end.y < TOP - 2.0 or rc.position.y > LY:
			continue
		var f := minf(1.0, b["hp"] / maxf(1.0, lv["req"] * 2.0))
		var col := Color("#FF8A3D") if b["bomb"] else _hp_col(f)
		var fl: float = b["flash"]
		push(rc.get_center(), 0.0, Vector2(1.0 + fl * 0.08, 1.0 - fl * 0.06))
		var x := -rc.size.x / 2.0
		var y := -rc.size.y / 2.0
		rr(x, y, rc.size.x, rc.size.y, 9, col, INK, 2.5)
		rect(x + 5, y + 4, rc.size.x - 10, 4, Color(1, 1, 1, 0.28))
		if b["bomb"]:
			circle(0, -2, 9, Color("#3A2A4A"), null, 0)
			line(PackedVector2Array([Vector2(5, -9), Vector2(9, -14)]), Color("#FFD54A"), 2)
			text(str(b["hp"]), 0, -1, 10, Color.WHITE, &"center", &"body")
		else:
			text(str(b["hp"]), 0, 1, 13 if b["hp"] > 99 else 16, Color.WHITE, &"center", &"display", INK, 3)
		if fl > 0.0:
			rr(x, y, rc.size.x, rc.size.y, 9, Color(1, 1, 1, fl * 0.6), null, 0)
		pop()
	# the aim guide: little dots along the path
	if phase == "aim" and has_ang and (aiming or not balls.is_empty() or true):
		var pts := _trace(Vector2(lx, LY - BR), ang)
		var carry := 0.0
		for i in range(1, pts.size()):
			var a2 := pts[i - 1]
			var b2 := pts[i]
			var seg := a2.distance_to(b2)
			var d := carry
			while d < seg:
				circle(a2.lerp(b2, d / seg).x, a2.lerp(b2, d / seg).y, 2, Color(1, 1, 1, 0.8), null, 0)
				d += 11.0
			carry = d - seg
	# floor and launcher
	rect(X0, LY + 2, COLS * CELL, 3, Color(1, 1, 1, 0.15))
	for b in balls:
		if b["live"] or b["homing"]:
			circle(b["x"], b["y"], BR + 3, Color(1, 1, 1, 0.22), null, 0)
			sprite(b["sq"], b["x"], b["y"], 28, {"rot": b["rot"], "anchor": 0.6})
	if phase != "shoot" or to_shoot > 0:
		sprite(_ball_id(sqi), lx, LY + 6, 30, {"sy": 1.0 + sin(t * 6.0) * 0.05})
	text("×%d" % (to_shoot if phase == "shoot" else n_balls), minf(W - 26, lx + 30), LY - 8, 13, Color.WHITE, &"center", &"display", INK, 3)
	# bottom bar
	rr(10, 590, W - 20, 42, 16, Color(1, 1, 1, 0.12), null, 0)
	text(ctx.t(&"squish_breaker.turn", {"n": turns + 1}), 60, 611, 13, Color.WHITE, &"center", &"body")
	text(ctx.t(&"squish_breaker.bricks", {"n": bricks_left()}), 160, 611, 13, Color.WHITE, &"center", &"body")
	if phase == "shoot":
		rr(W - 96, 596, 80, 30, 15, Color("#FFD54A") if fast > 1.0 else Color.WHITE)
		text(ctx.t(&"squish_breaker.fast" if fast > 1.0 else &"squish_breaker.speed"), W - 56, 611, 12, INK, &"center", &"body")
	else:
		text(ctx.t(&"squish_breaker.target", {"n": lv["par"]}), W - 70, 611, 12, Color("#FFE9A8"), &"center", &"body")
	# top bar
	hud(Color("#FF7A45"), ctx.t(&"squish_breaker.level", {"n": lv["n"]}), 96)
	rr(W - 138, 12, 128, 28, 14, Color.WHITE)
	text(ctx.t(&"squish_breaker.squishies", {"n": n_balls}), W - 74, 27, 14, INK, &"center", &"body")
	if lv["big"]:
		text(ctx.t(&"squish_breaker.big"), 150, 27, 11, Color("#FFF3B0"), &"center", &"body")
	if banner > 0.0:
		var al := minf(1.0, banner * 2.0)
		rr(40, 280, W - 80, 76, 20, Color(1, 1, 1, al), Color(INK, al))
		text(ctx.t(&"squish_breaker.level", {"n": lv["n"]}), W / 2.0, 304, 24, Color("#FF7A45", al), &"center", &"display")
		text(ctx.t(&"squish_breaker.banner", {"rows": lv["rows"], "need": lv["req"], "have": n_balls}), W / 2.0, 334, 12, Color(INK, al), &"center", &"body")
