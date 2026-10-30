extends KitGame
## BUCKET BRIGADE (Fire Station No. 1): level-based colour-sorting puzzle. The coloured water for the Splash Parade
## got all mixed up! Tap a bucket, then another to pour: only onto the same colour or into an empty bucket, and
## only while there is room. Sort every colour into its own bucket to win; fewer moves = more stars. Levels never
## run out: more colours, then smoky (hidden) layers, then taller buckets. Every level is checked by a solver, so
## it can always be solved. Ported from prototypes/games/bucket-brigade.js (same levels: KitRng).
## Result: won, level, stars (score = stars), metric = moves.

const COLORS := [["#FF5E6C", "dot"], ["#FF9F43", "tri"], ["#FFD23F", "star"], ["#5ACB7A", "leaf"], ["#3CC8C8", "diamond"],
	["#4A8BFF", "square"], ["#A57CFF", "heart"], ["#FF7AC8", "ring"], ["#8B5E3C", "plus"], ["#F2F2F7", "moon"]]
const POUR := 0.55

var lv: Dictionary = {}
var cap := 4
var tubes: Array = []        # each tube: Array of {"c", "h" (hidden), "id"}, bottom first
var pos: Array[Dictionary] = []
var sel := -1
var cur := 0
var moves := 0
var undo: Array = []
var extra_used := 0
var anim: Dictionary = {}
var banner := 1.8
var done_t := 0.0
var bounce: Dictionary = {}
var seen: Dictionary = {}
var kb := false
var _note := ""
var _won := false
var _stars := 0


# ---------------------------------------------------------------- the solver and the level recipe

## Moves that solve these tubes ([from, to] pairs), or [] with ok=false. Same search as the prototype.
static func solve(start: Array, size: int, r: KitRng, limit := 60000) -> Dictionary:
	var state := {"seen": {}, "path": [], "nodes": 0}
	var ts: Array = []
	for t: Array in start:
		ts.append(t.duplicate())
	var ok := _dfs(ts, size, r, limit, state)
	return {"ok": ok, "path": state["path"]}


static func _done(ts: Array, size: int) -> bool:
	for t: Array in ts:
		if t.is_empty():
			continue
		if t.size() != size:
			return false
		for x: int in t:
			if x != t[0]:
				return false
	return true


static func _state_key(ts: Array) -> String:
	var parts := PackedStringArray()
	for t: Array in ts:
		parts.append(",".join(PackedStringArray(t.map(func(x: int) -> String: return str(x)))))
	parts.sort()
	return "|".join(parts)


static func _moves(ts: Array, size: int, r: KitRng) -> Array:
	var out: Array = []
	for a in ts.size():
		var aa: Array = ts[a]
		if aa.is_empty():
			continue
		var c: int = aa[-1]
		var run := 1
		while run < aa.size() and aa[aa.size() - 1 - run] == c:
			run += 1
		if run == aa.size() and run == size:
			continue
		var empty_tried := false
		for b in ts.size():
			if a == b:
				continue
			var bb: Array = ts[b]
			if bb.size() >= size:
				continue
			if not bb.is_empty():
				if bb[-1] != c:
					continue
			else:
				if run == aa.size() or empty_tried:
					continue
				empty_tried = true
			var n := mini(run, size - bb.size())
			var score := (2.0 if not bb.is_empty() else 0.0) + (3.0 if bb.size() + n == size else 0.0) + (1.0 if n == run else 0.0) + r.next() * 0.8
			out.append([a, b, n, score])
	out.sort_custom(func(x: Array, y: Array) -> bool: return x[3] > y[3])
	return out


static func _dfs(ts: Array, size: int, r: KitRng, limit: int, st: Dictionary) -> bool:
	if _done(ts, size):
		return true
	st["nodes"] += 1
	if st["nodes"] > limit:
		return false
	var k := _state_key(ts)
	if st["seen"].has(k):
		return false
	st["seen"][k] = true
	for m: Array in _moves(ts, size, r):
		var aa: Array = ts[m[0]]
		var bb: Array = ts[m[1]]
		for i: int in m[2]:
			bb.append(aa.pop_back())
		st["path"].append([m[0], m[1]])
		if _dfs(ts, size, r, limit, st):
			return true
		st["path"].pop_back()
		for i: int in m[2]:
			aa.append(bb.pop_back())
	return false


## Level n, always the same for everyone: colours, bucket size, hidden layers, the 3-star target.
static func recipe(n: int) -> Dictionary:
	var r := KitRng.new(n * 4099 + 23)
	var k := mini(10, 3 + (n - 1) / 2)
	var size := 5 if n >= 18 and n % 3 == 0 else 4
	var hide := 0.0 if n < 8 else minf(0.6, 0.15 + (n - 8) * 0.015)
	var ts: Array = []
	var sol := {"ok": false, "path": []}
	var tries := 0
	while tries < 40 and not sol["ok"]:
		tries += 1
		var units: Array = []
		for c in k:
			for i in size:
				units.append(c)
		for i in range(units.size() - 1, 0, -1):
			var j := int(r.next() * (i + 1))
			var tmp: int = units[i]
			units[i] = units[j]
			units[j] = tmp
		ts = []
		for t in k:
			ts.append(units.slice(t * size, t * size + size))
		if ts.any(func(t: Array) -> bool: return t.all(func(x: int) -> bool: return x == t[0])):
			continue
		ts.append([])
		ts.append([])
		sol = solve(ts, size, r)
	var par: int = (sol["path"] as Array).size()
	for i in 3:
		var s2 := solve(ts, size, r)
		if s2["ok"] and (s2["path"] as Array).size() < par:
			par = (s2["path"] as Array).size()
	var hidden: Array = []
	for t: Array in ts:
		var row: Array[bool] = []
		for i in t.size():
			row.append(i < t.size() - 1 and r.next() < hide)
		hidden.append(row)
	return {"n": n, "k": k, "cap": size, "tubes": ts, "hidden": hidden, "par": par, "hide": hide, "big": n % 10 == 0}


# ---------------------------------------------------------------- a run = one level

func _init_run(level: int) -> void:
	var n := maxi(1, level)
	lv = recipe(n)
	cap = lv["cap"]
	seen = {}
	tubes = []
	var id := 0
	for i in (lv["tubes"] as Array).size():
		var t: Array = []
		for j in (lv["tubes"][i] as Array).size():
			id += 1
			t.append({"c": lv["tubes"][i][j], "h": lv["hidden"][i][j], "id": id})
		tubes.append(t)
	# Sky Puffs blow the smoke off the smokiest bucket
	if ctx != null and ctx.perk(&"clear_smoke") > 0.0:
		var most := -1
		var best := -1
		for i in tubes.size():
			var hid := (tubes[i] as Array).filter(func(u: Dictionary) -> bool: return u["h"]).size()
			if hid > most:
				most = hid
				best = i
		if most > 0:
			for u: Dictionary in tubes[best]:
				u["h"] = false
				seen[u["id"]] = true
	sel = -1
	cur = 0
	moves = 0
	undo = []
	extra_used = 0
	anim = {}
	banner = 1.8
	done_t = 0.0
	bounce = {}
	kb = false
	_note = ""
	_won = false
	_stars = 0
	_layout()


func _layout() -> void:
	var n := tubes.size()
	var per_row := n if n <= 6 else ceili(n / 2.0)
	var rows := ceili(float(n) / per_row)
	var bw := minf(52.0, (W - 30.0) / per_row - 12.0)
	var lh := 21.0 if cap == 5 else 25.0
	var bh := lh * cap + 18.0
	var top := 250.0 if rows == 1 else 174.0
	var row_gap := bh + 64.0
	pos = []
	for i in n:
		var r := i / per_row
		var in_row := mini(per_row, n - r * per_row)
		var g2 := (W - in_row * bw) / (in_row + 1)
		var c := i - r * per_row
		pos.append({"x": g2 + c * (bw + g2), "y": top + r * row_gap, "w": bw, "h": bh, "lh": lh})


func _top_run(t: Array) -> int:
	if t.is_empty():
		return 0
	var c: int = t[-1]["c"]
	var r := 1
	while r < t.size() and t[t.size() - 1 - r]["c"] == c and not t[t.size() - 1 - r]["h"]:
		r += 1
	return r


func is_done(t: Array) -> bool:
	if t.is_empty():
		return true
	if t.size() != cap:
		return false
	for u: Dictionary in t:
		if u["c"] != t[0]["c"] or u["h"]:
			return false
	return true


func solved() -> bool:
	return tubes.all(func(t: Array) -> bool: return is_done(t))


func can_pour(a: int, b: int) -> bool:
	if a == b:
		return false
	var aa: Array = tubes[a]
	var bb: Array = tubes[b]
	if aa.is_empty() or bb.size() >= cap:
		return false
	return bb.is_empty() or bb[-1]["c"] == aa[-1]["c"]


func busy() -> bool:
	return not anim.is_empty() or done_t > 0.0


func extra_allowed() -> int:
	return maxi(1, int(ctx.perk(&"extra_buckets", 1.0)))


func _update(dt: float) -> void:
	banner = maxf(0.0, banner - dt)
	if not anim.is_empty():
		anim["t"] += dt / POUR
		if anim["t"] >= 0.55 and not anim["applied"]:
			_apply_pour()
		if anim["t"] >= 1.0:
			anim = {}
			if solved():
				done_t = 0.01
				tone(880, 0.3, &"triangle", 0.09, 1.5)
	if done_t > 0.0:
		done_t += dt
		if done_t > 1.3:
			_finish_level()
			return
	for k: int in bounce.keys():
		bounce[k] = maxf(0.0, bounce[k] - dt * 1.5)


## Tap bucket i: pick it up, or pour the one in hand into it.
func pick(i: int) -> void:
	var pickable := func(k: int) -> bool: return not (tubes[k] as Array).is_empty() and not is_done(tubes[k])
	if sel < 0:
		if not pickable.call(i):
			bounce[i] = 1.0
			tone(260, 0.06, &"triangle", 0.04)
			return
		sel = i
		tone(620, 0.05, &"sine", 0.05)
		return
	if sel == i:
		sel = -1
		return
	if not can_pour(sel, i):
		bounce[i] = 1.0
		tone(200, 0.1, &"square", 0.04)
		sel = i if pickable.call(i) else -1
		return
	var aa: Array = tubes[sel]
	var n := mini(_top_run(aa), cap - (tubes[i] as Array).size())
	anim = {"a": sel, "b": i, "n": n, "col": aa[-1]["c"], "t": 0.0, "applied": false}
	sel = -1
	tone(420, 0.35, &"sine", 0.05, 1.6)


func _apply_pour() -> void:
	anim["applied"] = true
	var aa: Array = tubes[anim["a"]]
	var bb: Array = tubes[anim["b"]]
	undo.append(tubes.map(func(t: Array) -> Array: return t.map(func(u: Dictionary) -> Dictionary: return u.duplicate())))
	if undo.size() > 60:
		undo.pop_front()
	for i: int in anim["n"]:
		bb.append(aa.pop_back())
	if not aa.is_empty() and aa[-1]["h"]:
		aa[-1]["h"] = false
		seen[aa[-1]["id"]] = true
		var p: Dictionary = pos[anim["a"]]
		float_text(Vector2(p["x"] + p["w"] / 2.0, p["y"] - 10), ctx.t(&"bucket_brigade.poof"), Color("#9A8FAA"), 13)
	moves += 1
	bounce[anim["b"]] = 0.6
	if not bb.is_empty() and is_done(bb):
		var q: Dictionary = pos[anim["b"]]
		burst(Vector2(q["x"] + q["w"] / 2.0, q["y"]), Color(COLORS[bb[0]["c"]][0]), 14, 120)
		tone(1050, 0.15, &"triangle", 0.08, 1.4)
		ctx.buzz(30)


func button(k: String) -> void:
	match k:
		"undo":
			if not undo.is_empty():
				# undo is free, but the move you undid still counts
				tubes = undo.pop_back()
				for t: Array in tubes:
					for u: Dictionary in t:
						if seen.has(u["id"]):
							u["h"] = false
				sel = -1
				tone(500, 0.08, &"sine", 0.05, 0.7)
		"restart":
			if moves > 0:
				_won = false
				_note = ctx.t(&"bucket_brigade.note.restart")
				end()
		"extra":
			if extra_used < extra_allowed():
				extra_used += 1
				tubes.append([])
				_layout()
				tone(760, 0.12, &"triangle", 0.07, 1.3)


func target() -> int:
	return int(lv["par"]) + (2 if lv["hide"] > 0.0 else 0)


func stars_for(m: int) -> int:
	var par := target()
	var st := 3 if m <= par else (2 if m <= par + maxi(3, roundi(par * 0.3)) else 1)
	return mini(2, st) if extra_used > 0 else st


func _finish_level() -> void:
	done_t = 0.0
	_won = true
	_stars = stars_for(moves)
	_note = ctx.t(&"bucket_brigade.note.win", {"n": moves, "t": target()})
	raise_score(_stars)
	end()


func _make_result() -> MinigameResult:
	var r := MinigameResult.make(_stars if _won else 0, moves, t)
	r.won = _won
	r.level = lv["n"]
	r.stars = _stars if _won else 0
	r.note = _note
	return r


func _down(p: Vector2, _id: int) -> void:
	if busy():
		return
	kb = false
	if p.y > 528.0 and p.y < 576.0:
		for b: Array in [["undo", 70.0], ["restart", 180.0], ["extra", 290.0]]:
			if absf(b[1] - p.x) < 50.0:
				button(b[0])
		return
	for i in pos.size():
		var q: Dictionary = pos[i]
		if p.x > q["x"] - 8 and p.x < q["x"] + q["w"] + 8 and p.y > q["y"] - 30 and p.y < q["y"] + q["h"] + 10:
			pick(i)
			return
	sel = -1


func _key(keycode: Key, pressed: bool) -> bool:
	if not pressed or busy():
		return keycode in [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_A, KEY_D, KEY_SPACE, KEY_ENTER, KEY_U, KEY_BACKSPACE, KEY_R]
	var n := tubes.size()
	match keycode:
		KEY_LEFT, KEY_A:
			kb = true
			cur = (cur + n - 1) % n
		KEY_RIGHT, KEY_D:
			kb = true
			cur = (cur + 1) % n
		KEY_UP, KEY_DOWN:
			kb = true
			var per := n if n <= 6 else ceili(n / 2.0)
			cur = mini((cur + per) % (ceili(float(n) / per) * per), n - 1)
		KEY_SPACE, KEY_ENTER:
			kb = true
			pick(cur)
		KEY_U, KEY_BACKSPACE:
			button("undo")
		KEY_R:
			button("restart")
		_:
			return false
	return true


# ---------------------------------------------------------------- drawing

func _draw_game() -> void:
	vgradient(view_rect, Color("#CDEBFF"), Color("#FFE6DA"))
	rect(view_rect.position.x, 520, view_rect.size.x, view_rect.end.y - 520, Color(0.851, 0.227, 0.169, 0.08))
	rr(10, 60, W - 20, 62, 18, Color.WHITE)
	rr(18, 68, 76, 46, 14, Color("#D93A2B"), null, 0)
	text(ctx.t(&"bucket_brigade.moves"), 56, 80, 10, Color("#FFE0DA"), &"center", &"body")
	text(str(moves), 56, 100, 22, Color.WHITE, &"center", &"display")
	var st := stars_for(moves)
	text(ctx.t(&"bucket_brigade.stars_now"), 210, 78, 11, Color("#7C7494"), &"center", &"body")
	for i in 3:
		star(178 + i * 32, 101, 12, 5.5, Color("#FFC93C") if i < st else Color("#E3DEEF"), INK, 2)
	text(ctx.t(&"bucket_brigade.target_extra" if extra_used > 0 else &"bucket_brigade.target", {"n": target()}), W / 2.0, 140, 11, Color("#5E5679"), &"center", &"body")
	# buckets (the one pouring is drawn last, on top)
	var order: Array[int] = []
	for i in tubes.size():
		order.append(i)
	if not anim.is_empty():
		order.erase(int(anim["a"]))
		order.append(int(anim["a"]))
	for i in order:
		var p: Dictionary = pos[i]
		var x: float = p["x"]
		var y: float = p["y"]
		var rot := 0.0
		if sel == i and anim.is_empty():
			y -= 16.0
		if not anim.is_empty() and anim["a"] == i:
			var q: Dictionary = pos[anim["b"]]
			var at: float = anim["t"]
			var u := at / 0.3 if at < 0.3 else ((1.0 - at) / 0.2 if at > 0.8 else 1.0)
			var e := u * u * (3.0 - 2.0 * u)
			var side := 1.0 if q["x"] + q["w"] / 2.0 < W / 2.0 else -1.0
			x += (q["x"] + side * p["w"] * 0.6 - p["x"]) * e
			y += (q["y"] - 56.0 - p["y"]) * e
			rot = -side * 1.15 * e
		_bucket(tubes[i], x, y, p, rot, i)
		if not anim.is_empty() and anim["a"] == i and anim["t"] > 0.3 and anim["t"] < 0.8:
			var q2: Dictionary = pos[anim["b"]]
			var sx: float = q2["x"] + q2["w"] / 2.0
			var side2 := 1.0 if sx < W / 2.0 else -1.0
			line(PackedVector2Array([Vector2(sx + side2 * 5, q2["y"] - 34), Vector2(sx, q2["y"] + q2["h"] - (tubes[anim["b"]] as Array).size() * q2["lh"] - 8)]), Color(COLORS[anim["col"]][0]), 6)
		if kb and cur == i:
			rr(p["x"] - 6, p["y"] - 22, p["w"] + 12, p["h"] + 30, 14, null, Color("#D93A2B"), 3)
	# buttons
	var btns := [["undo", 70.0, ctx.t(&"bucket_brigade.undo"), not undo.is_empty()], ["restart", 180.0, ctx.t(&"bucket_brigade.restart"), moves > 0],
		["extra", 290.0, ctx.t(&"bucket_brigade.used") if extra_used >= extra_allowed() else ctx.t(&"bucket_brigade.add_bucket"), extra_used < extra_allowed()]]
	for b: Array in btns:
		var on: bool = b[3]
		rr(b[1] - 48, 532, 96, 40, 20, Color.WHITE if on else Color("#F2EFFA"), INK if on else Color("#CFC8E3"), 2.5)
		text(b[2], b[1], 552, 14, INK if on else Color("#B0A8C8"), &"center", &"body")
	var who: StringName = ctx.squad[0] if not ctx.squad.is_empty() else &"raindrop"
	sprite(who, 34, 636, 50, {"sy": 1.0 + sin(t * 3.0) * 0.04})
	text(_tip(), W / 2.0 + 18, 606, 12, Color("#9A3A2F"), &"center", &"body")
	# top bar
	hud(Color("#D93A2B"), ctx.t(&"bucket_brigade.level", {"n": lv["n"]}), 100)
	rr(W - 114, 12, 104, 28, 14, Color.WHITE)
	text(ctx.t(&"bucket_brigade.colours", {"n": lv["k"]}), W - 62, 27, 14, INK, &"center", &"body")
	if lv["big"]:
		text(ctx.t(&"bucket_brigade.big"), 178, 27, 11, Color("#FFF3B0"), &"center", &"body")
	if banner > 0.0:
		var a := minf(1.0, banner * 2.0)
		rr(40, 410, W - 80, 70, 20, Color(1, 1, 1, a), Color(INK, a))
		text(ctx.t(&"bucket_brigade.level", {"n": lv["n"]}), W / 2.0, 432, 22, Color("#D93A2B", a), &"center", &"display")
		var key := &"bucket_brigade.banner.smoke" if lv["hide"] > 0.0 else (&"bucket_brigade.banner.tall" if cap == 5 else &"bucket_brigade.banner.plain")
		text(ctx.t(key), W / 2.0, 460, 12, Color(INK, a), &"center", &"body")
	if done_t > 0.0:
		var a2 := minf(1.0, done_t * 3.0)
		text(ctx.t(&"bucket_brigade.sorted_all"), W / 2.0, 220, 34, Color("#FFC93C", a2), &"center", &"display", Color(INK, a2), 6)


func _tip() -> String:
	if sel >= 0:
		return ctx.t(&"bucket_brigade.tip.pour")
	if moves == 0:
		return ctx.t(&"bucket_brigade.tip.start")
	var full := tubes.filter(func(t: Array) -> bool: return not t.is_empty() and is_done(t)).size()
	return ctx.t(&"bucket_brigade.tip.progress", {"n": full, "k": lv["k"]})


## The glass bucket's outline, in its own space (0,0 = top left).
func _glass(w: float, h: float) -> PackedVector2Array:
	var pts := PackedVector2Array([Vector2(0, 6), Vector2(w, 6), Vector2(w - 3, h - 10)])
	pts.append_array(quad(Vector2(w - 3, h - 10), Vector2(w - 4, h), Vector2(w / 2.0, h), 6))
	pts.append_array(quad(Vector2(w / 2.0, h), Vector2(4, h), Vector2(3, h - 10), 6))
	return pts


func _clipped(r: Rect2, glass: PackedVector2Array, col: Color) -> void:
	var box := PackedVector2Array([r.position, Vector2(r.end.x, r.position.y), r.end, Vector2(r.position.x, r.end.y)])
	for piece in Geometry2D.intersect_polygons(box, glass):
		poly(piece, col, null, 0)


func _bucket(tube: Array, x: float, y: float, p: Dictionary, rot: float, i: int) -> void:
	var w: float = p["w"]
	var h: float = p["h"]
	var lh: float = p["lh"]
	var b: float = bounce.get(i, 0.0)
	var wob := b * sin(t * 30.0)
	push_m(Transform2D(rot, Vector2(1.0 + wob * 0.06, 1.0 - wob * 0.05), 0.0, Vector2(x + w / 2.0, y + h)) * Transform2D(0.0, Vector2(-w / 2.0, -h)))
	var finished := not tube.is_empty() and is_done(tube)
	# handle
	var handle := PackedVector2Array()
	for k in 13:
		var a := PI * 1.05 + (PI * 0.9) * k / 12.0
		handle.append(Vector2(w / 2.0, 6) + Vector2(cos(a), sin(a)) * w * 0.42)
	line(handle, Color("#9A8FAA"), 3)
	# glass, water, shine
	var glass := _glass(w, h)
	poly(glass, Color(1, 1, 1, 0.55), null, 0)
	for j in tube.size():
		var u: Dictionary = tube[j]
		var ly := h - (j + 1) * lh - 4.0
		if u["h"]:
			_clipped(Rect2(0, ly, w, lh + 1), glass, Color("#B8B2C8"))
			text("?", w / 2.0, ly + lh / 2.0, 14, Color.WHITE, &"center", &"display")
		else:
			_clipped(Rect2(0, ly, w, lh + 1), glass, Color(COLORS[u["c"]][0]))
			_clipped(Rect2(0, ly, w, 3), glass, Color(1, 1, 1, 0.25))
			_symbol(COLORS[u["c"]][1], w / 2.0, ly + lh / 2.0 + 1.0, Color("#9A8FAA") if u["c"] == 9 else Color(1, 1, 1, 0.9))
	_clipped(Rect2(5, 10, 5, h - 24), glass, Color(1, 1, 1, 0.35))
	poly(glass, null, INK, 2.5)
	rr(-3, 0, w + 6, 11, 5, Color("#FFC93C") if finished else Color("#D93A2B"), INK, 2.5)
	pop()
	if finished and anim.is_empty():
		sprite(&"raindrop", x + w / 2.0, y - 2.0 - absf(sin(t * 4.0 + i)) * 5.0, 30)


func _symbol(s: String, x: float, y: float, col: Color) -> void:
	match s:
		"dot":
			circle(x, y, 3.5, col, null, 0)
		"tri":
			poly(PackedVector2Array([Vector2(x, y - 4.5), Vector2(x + 4.5, y + 3.5), Vector2(x - 4.5, y + 3.5)]), col, null, 0)
		"star":
			star(x, y, 5.5, 2.4, col, null)
		"leaf":
			ellipse(x, y, 5, 2.6, col, null, 0, -0.6)
		"diamond":
			poly(PackedVector2Array([Vector2(x, y - 5), Vector2(x + 4, y), Vector2(x, y + 5), Vector2(x - 4, y)]), col, null, 0)
		"square":
			rect(x - 3.5, y - 3.5, 7, 7, col)
		"heart":
			var pts := cubic(Vector2(x, y + 4), Vector2(x - 6, y), Vector2(x - 4, y - 6), Vector2(x, y - 2.5), 8)
			pts.append_array(cubic(Vector2(x, y - 2.5), Vector2(x + 4, y - 6), Vector2(x + 6, y), Vector2(x, y + 4), 8))
			poly(pts, col, null, 0)
		"ring":
			circle(x, y, 3.5, null, col, 2)
		"plus":
			rect(x - 4, y - 1.2, 8, 2.4, col)
			rect(x - 1.2, y - 4, 2.4, 8, col)
		"moon":
			var outer := PackedVector2Array()
			for k in 13:
				var a := 0.6 + (PI * 1.6 - 0.6) * k / 12.0
				outer.append(Vector2(x, y) + Vector2(cos(a), sin(a)) * 4.5)
			for k in 13:
				var a2 := PI * 1.6 - (PI * 1.6 - 0.6) * k / 12.0
				outer.append(Vector2(x + 2, y - 1) + Vector2(cos(a2), sin(a2)) * 3.4)
			poly(outer, col, null, 0)
