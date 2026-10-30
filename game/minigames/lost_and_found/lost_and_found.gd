extends KitGame
## LOST & FOUND (Squish Patrol Station): level-based match-3. The station's lost-property box tipped over! Swap
## two neighbouring items to make lines of 3 or more of the same kind. Each level has a goal (collect items, find
## the paw-print clues, pop the bubble wrap) and a limited number of moves. Specials: 4 in a row = Siren (clears
## its line), L or T = Bubble Bomb (clears around it), 5 in a row = Gold Badge (swap it with anything to clear
## every item of that kind); two specials together = a mega combo. Ported from prototypes/games/lost-and-found.js
## (same recipe and random numbers: KitRng). Result: won, level, stars, score = points, metric = specials made.

const COLS := 7
const ROWS := 8
const T := 46.0
const X0 := (360.0 - 7 * 46.0) / 2.0
const Y0 := 150.0
const ITEMS := [["balloon", "#FF5E6C", "#C93445"], ["mitten", "#5BA8FF", "#2F6FC2"], ["candy", "#FF8FD0", "#C9579C"],
	["key", "#FFC93C", "#C98A12"], ["clover", "#5ACB7A", "#2F8F4E"], ["bow", "#A57CFF", "#6E48C9"]]
const MASKS := [
	[".#####.", "#######", "#######", "#######", "#######", "#######", "#######", ".#####."],
	["#######", "#######", "##...##", "#######", "#######", "##...##", "#######", "#######"],
	["###.###", "###.###", "#######", "#######", "#######", "#######", "###.###", "###.###"],
	[".#####.", "..###..", "#######", "#######", "#######", "#######", "..###..", ".#####."],
	["#######", ".#####.", "#######", "#.###.#", "#.###.#", "#######", ".#####.", "#######"]]
const TUT := ["collect", "collect", "prints", "collect", "wraps", "prints", "mix", "wraps"]

var lvl: Dictionary = {}
var r: KitRng
var cells: Array = []
var grid: Array = []
var goal: Dictionary = {}
var moves := 0
var phase := "idle"
var wait := 0.0
var chain := 1
var sel := Vector2i(-1, -1)
var drag: Dictionary = {}
var cur := Vector2i(3, 7)
var kb := false
var made := 0
var fx_blast: Array[Dictionary] = []
var flyers: Array[Dictionary] = []
var idle_t := 0.0
var hint: Array = []
var banner := 1.6
var bonus_left := 0
var bonus_t := 0.0
var swap: Dictionary = {}
var prefer: Array = []
var _uid := 0
var _won := false
var _stars := 0
var _note := ""
var _restarted := false
var _fun := RandomNumberGenerator.new()


static func recipe(n: int) -> Dictionary:
	var rr_ := KitRng.new(n * 7919 + 17)
	var d := minf(1.0, (n - 1) / 45.0)
	var types := 5 if n <= 3 else ((6 if n % 3 == 0 else 5) if n < 10 else (5 if n % 5 == 0 else 6))
	var kind: String = TUT[n - 1] if n <= TUT.size() else ["collect", "prints", "wraps", "mix"][(n - 1) % 4]
	var mask: Array = [] if n <= 4 else MASKS[int(rr_.next() * MASKS.size())]
	var lv := {"n": n, "types": types, "kind": kind, "mask": mask, "moves": 0, "collect": [], "prints": 0, "print_layers": 1,
		"wraps": 0, "wrap_layers": 1, "seed": n * 31 + 7, "big": n % 10 == 0}
	var pick_types := func(k: int) -> Array:
		var a: Array = range(types)
		for i in range(a.size() - 1, 0, -1):
			var j := int(rr_.next() * (i + 1))
			var tmp: int = a[i]
			a[i] = a[j]
			a[j] = tmp
		return a.slice(0, k)
	var amt := func(base: float) -> int: return roundi(base + d * base * 0.9 + rr_.next() * 3.0)
	match kind:
		"collect":
			var k := 3 if n >= 7 and rr_.next() < 0.5 else 2
			lv["collect"] = (pick_types.call(k) as Array).map(func(t: int) -> Dictionary: return {"t": t, "need": amt.call(10.0 if k == 3 else 14.0)})
			lv["moves"] = 20 + (2 if k == 3 else 0) - roundi(d * 3)
		"prints":
			lv["print_layers"] = 2 if n >= 14 and rr_.next() < 0.6 else 1
			lv["prints"] = 6 if n <= 3 else roundi((8 + d * 12) * (0.65 if lv["print_layers"] == 2 else 1.0))
			lv["moves"] = 28 + (4 if lv["print_layers"] == 2 else 0) - roundi(d * 2)
		"wraps":
			lv["wraps"] = roundi(6 + d * 10)
			lv["wrap_layers"] = 2 if n >= 12 and rr_.next() < 0.6 else 1
			lv["moves"] = 24 + (5 if lv["wrap_layers"] == 2 else 0) - roundi(d * 2)
		"mix":
			lv["prints"] = roundi(6 + d * 9)
			lv["collect"] = (pick_types.call(1) as Array).map(func(t: int) -> Dictionary: return {"t": t, "need": amt.call(10.0)})
			lv["moves"] = 26 - roundi(d * 2)
	if lv["big"]:
		lv["moves"] += 3
	lv["star2"] = lv["moves"] * 300
	lv["star3"] = lv["moves"] * 430
	return lv


# ---------------------------------------------------------------- board helpers

func _cx(c: int) -> float:
	return X0 + c * T + T / 2.0


func _cy(row: int) -> float:
	return Y0 + row * T + T / 2.0


func _in(row: int, c: int) -> bool:
	return row >= 0 and row < ROWS and c >= 0 and c < COLS


func live(row: int, c: int) -> bool:
	return _in(row, c) and not cells[row][c]["hole"]


func _new_tile(kind: int, row: int, c: int, from_y := INF) -> Dictionary:
	_uid += 1
	return {"id": _uid, "t": kind, "sp": "", "wrap": 0, "x": _cx(c), "y": _cy(row) if from_y == INF else from_y, "vy": 0.0,
		"die": 0.0, "born": 1.0, "spark": 0.0, "land": 0.0}


func _rand_type() -> int:
	return int(r.next() * lvl["types"])


func _tile_type(row: int, c: int) -> int:
	if not live(row, c):
		return -1
	var x: Variant = grid[row][c]
	if x == null or x["sp"] == "badge" or x["die"] > 0.0:
		return -1
	return x["t"]


func _build() -> void:
	cells = []
	for row in ROWS:
		var line_cells: Array = []
		for c in COLS:
			var hole: bool = not (lvl["mask"] as Array).is_empty() and String(lvl["mask"][row])[c] == "."
			line_cells.append({"hole": hole, "print": 0})
		cells.append(line_cells)
	var spots: Array[Vector2i] = []
	for row in ROWS:
		for c in COLS:
			if not cells[row][c]["hole"]:
				spots.append(Vector2i(c, row))
	if lvl["prints"] > 0:
		# paw prints in a lower patch, so you have to dig (lower rows first, a little mixed)
		var keyed: Array = spots.map(func(p: Vector2i) -> Array: return [-p.y * 10.0 + (r.next() - 0.5) * 26.0, p])
		keyed.sort_custom(func(a: Array, b: Array) -> bool: return a[0] < b[0])
		for i in mini(lvl["prints"], keyed.size()):
			var p: Vector2i = keyed[i][1]
			cells[p.y][p.x]["print"] = lvl["print_layers"]
	for tries in 60:
		grid = []
		for row in ROWS:
			var line_tiles: Array = []
			for c in COLS:
				if cells[row][c]["hole"]:
					line_tiles.append(null)
					continue
				var kind := 0
				var k := 0
				while true:
					kind = _rand_type()
					k += 1
					var two_left: bool = c >= 2 and line_tiles[c - 1] != null and line_tiles[c - 1]["t"] == kind and line_tiles[c - 2] != null and line_tiles[c - 2]["t"] == kind
					var two_up: bool = row >= 2 and grid[row - 1][c] != null and grid[row - 1][c]["t"] == kind and grid[row - 2][c] != null and grid[row - 2][c]["t"] == kind
					if k >= 30 or not (two_left or two_up):
						break
				line_tiles.append(_new_tile(kind, row, c, _cy(row) - 400.0 - (ROWS - row) * 30.0))
			grid.append(line_tiles)
		if not find_moves().is_empty():
			break
	if lvl["wraps"] > 0:
		var shuffled := spots.duplicate()
		for i in range(shuffled.size() - 1, 0, -1):
			var j := int(r.next() * (i + 1))
			var tmp: Vector2i = shuffled[i]
			shuffled[i] = shuffled[j]
			shuffled[j] = tmp
		var placed := 0
		for p: Vector2i in shuffled:
			if p.y >= 1 and placed < lvl["wraps"]:
				grid[p.y][p.x]["wrap"] = lvl["wrap_layers"]
				placed += 1
	goal = {"collect": (lvl["collect"] as Array).map(func(g: Dictionary) -> Dictionary: return {"t": g["t"], "need": g["need"], "got": 0, "x": W / 2.0})}


func count_prints() -> int:
	var n := 0
	for row: Array in cells:
		for c: Dictionary in row:
			n += c["print"]
	return n


func count_wraps() -> int:
	var n := 0
	for row: Array in grid:
		for t: Variant in row:
			if t != null:
				n += t["wrap"]
	return n


func goal_left() -> int:
	var left := 0
	for g: Dictionary in goal["collect"]:
		left += maxi(0, g["need"] - g["got"])
	return left + count_prints() + count_wraps()


# ---------------------------------------------------------------- matching

func _runs() -> Array:
	var out: Array = []
	for row in ROWS:
		var c := 0
		while c < COLS:
			var kind := _tile_type(row, c)
			var e := c + 1
			while kind >= 0 and e < COLS and _tile_type(row, e) == kind:
				e += 1
			if kind >= 0 and e - c >= 3:
				var run_cells: Array[Vector2i] = []
				for i in e - c:
					run_cells.append(Vector2i(c + i, row))
				out.append({"dir": "h", "t": kind, "cells": run_cells})
			c = e
	for c in COLS:
		var row2 := 0
		while row2 < ROWS:
			var kind2 := _tile_type(row2, c)
			var e2 := row2 + 1
			while kind2 >= 0 and e2 < ROWS and _tile_type(e2, c) == kind2:
				e2 += 1
			if kind2 >= 0 and e2 - row2 >= 3:
				var run_cells2: Array[Vector2i] = []
				for i in e2 - row2:
					run_cells2.append(Vector2i(c, row2 + i))
				out.append({"dir": "v", "t": kind2, "cells": run_cells2})
			row2 = e2
	return out


## Runs that share a cell form one group (L and T shapes).
func _groups(rs: Array) -> Array:
	var gs: Array = []
	for run: Dictionary in rs:
		var hit: Array = gs.filter(func(g: Dictionary) -> bool:
			return (g["runs"] as Array).any(func(o: Dictionary) -> bool:
				return (o["cells"] as Array).any(func(p: Vector2i) -> bool: return p in run["cells"])))
		var g := {"runs": [run]}
		for h: Dictionary in hit:
			(g["runs"] as Array).append_array(h["runs"])
			gs.erase(h)
		gs.append(g)
	return gs


func find_moves() -> Array:
	var mv: Array = []
	var ok := func(row: int, c: int) -> bool: return live(row, c) and grid[row][c] != null and grid[row][c]["wrap"] == 0
	for row in ROWS:
		for c in COLS:
			for d: Vector2i in [Vector2i(1, 0), Vector2i(0, 1)]:
				var c2 := c + d.x
				var r2 := row + d.y
				if not ok.call(row, c) or not ok.call(r2, c2):
					continue
				var a: Dictionary = grid[row][c]
				var b: Dictionary = grid[r2][c2]
				if a["sp"] == "badge" or b["sp"] == "badge" or (a["sp"] != "" and b["sp"] != ""):
					mv.append([Vector2i(c, row), Vector2i(c2, r2)])
					continue
				grid[row][c] = b
				grid[r2][c2] = a
				var any := not _runs().is_empty()
				grid[row][c] = a
				grid[r2][c2] = b
				if any:
					mv.append([Vector2i(c, row), Vector2i(c2, r2)])
	return mv


# ---------------------------------------------------------------- clearing (with chain reactions)

func _blast(sp: String, row: int, c: int, add: Callable) -> void:
	match sp:
		"h":
			for k in COLS:
				add.call(row, k)
		"v":
			for k in ROWS:
				add.call(k, c)
		"bomb":
			for a in range(-1, 2):
				for b in range(-1, 2):
					add.call(row + a, c + b)
		"badge":
			var present: Array[int] = []
			for line_tiles: Array in grid:
				for t: Variant in line_tiles:
					if t != null and t["sp"] != "badge":
						present.append(t["t"])
			if present.is_empty():
				return
			var kind := present[int(r.next() * present.size())]
			for a in ROWS:
				for b in COLS:
					if grid[a][b] != null and grid[a][b]["t"] == kind:
						add.call(a, b)


func _clear_cells(start: Array, make: Array = []) -> int:
	var found := {}
	var queue: Array[Vector2i] = []
	var keep := {}
	for m: Dictionary in make:
		keep[Vector2i(m["c"], m["r"])] = true
	var add := func(row: int, c: int) -> void:
		if not live(row, c):
			return
		var p := Vector2i(c, row)
		if found.has(p):
			return
		found[p] = true
		queue.append(p)
	for p: Vector2i in start:
		add.call(p.y, p.x)
	while not queue.is_empty():
		var p: Vector2i = queue.pop_front()
		var t: Variant = grid[p.y][p.x]
		if t != null and t["sp"] != "" and not keep.has(p) and t["wrap"] == 0:
			fx_blast.append({"sp": t["sp"], "r": p.y, "c": p.x, "life": 0.35})
			_blast(t["sp"], p.y, p.x, add)
	for p: Vector2i in found:
		var cell: Dictionary = cells[p.y][p.x]
		var t: Variant = grid[p.y][p.x]
		if cell["print"] > 0:
			cell["print"] -= 1
			add_score(60)
			burst(Vector2(_cx(p.x), _cy(p.y)), Color("#B48CFF"), 5, 90)
		if t == null:
			continue
		if t["wrap"] > 0:
			t["wrap"] -= 1
			add_score(50)
			t["spark"] = 1.0
			tone(1300, 0.05, &"square", 0.04, 1.3)
			continue
		var m: Dictionary = {}
		for mm: Dictionary in make:
			if mm["r"] == p.y and mm["c"] == p.x:
				m = mm
		if not m.is_empty():
			t["sp"] = m["sp"]
			if m["sp"] == "badge":
				t["t"] = -1
			t["spark"] = 1.0
			continue
		t["die"] = 0.001
		add_score(30 * chain)
		for g: Dictionary in goal["collect"]:
			if g["t"] == t["t"] and g["got"] < g["need"]:
				g["got"] += 1
				flyers.append({"t": t["t"], "x": t["x"], "y": t["y"], "tx": g["x"], "ty": 92.0, "life": 0.0})
				break
	for m: Dictionary in make:
		var t2: Variant = grid[m["r"]][m["c"]]
		if t2 != null and not found.has(Vector2i(m["c"], m["r"])):
			t2["sp"] = m["sp"]
			if m["sp"] == "badge":
				t2["t"] = -1
			t2["spark"] = 1.0
	return found.size()


## One cascade step: true if something was cleared.
func _step() -> bool:
	var rs := _runs()
	if rs.is_empty():
		return false
	var make: Array = []
	for g: Dictionary in _groups(rs):
		var gcells := {}
		for run: Dictionary in g["runs"]:
			for p: Vector2i in run["cells"]:
				gcells[p] = true
		var longest := 0
		var has_h := false
		var has_v := false
		for run: Dictionary in g["runs"]:
			longest = maxi(longest, (run["cells"] as Array).size())
			has_h = has_h or run["dir"] == "h"
			has_v = has_v or run["dir"] == "v"
		var cross := has_h and has_v
		var sp := ""
		if longest >= 5:
			sp = "badge"
		elif cross:
			sp = "bomb"
		elif longest == 4:
			for run: Dictionary in g["runs"]:
				if (run["cells"] as Array).size() == 4:
					sp = run["dir"]
					break
		if sp == "":
			continue
		var at := Vector2i(-1, -1)
		for p: Vector2i in prefer:
			if gcells.has(p):
				at = p
				break
		if at.x < 0 and cross:
			for h: Dictionary in g["runs"]:
				if h["dir"] != "h":
					continue
				for v: Dictionary in g["runs"]:
					if v["dir"] != "v":
						continue
					for p: Vector2i in h["cells"]:
						if p in v["cells"]:
							at = p
		if at.x < 0:
			var best: Dictionary = g["runs"][0]
			for run: Dictionary in g["runs"]:
				if (run["cells"] as Array).size() > (best["cells"] as Array).size():
					best = run
			at = best["cells"][(best["cells"] as Array).size() / 2]
		if grid[at.y][at.x]["wrap"] > 0:
			continue
		make.append({"r": at.y, "c": at.x, "sp": sp})
		made += 1
	var all: Array = []
	for run: Dictionary in rs:
		all.append_array(run["cells"])
	_clear_cells(all, make)
	if chain > 1:
		float_text(Vector2(W / 2.0, Y0 + ROWS * T / 2.0), ctx.t(&"lost_and_found.amazing" if chain >= 4 else (&"lost_and_found.super" if chain >= 3 else &"lost_and_found.nice")), Color("#FFD54A"), 22)
	tone(520 + chain * 90, 0.09, &"triangle", 0.08, 1.4)
	chain += 1
	return true


## Swapping a badge or two specials.
func _combo(pa: Vector2i, pb: Vector2i) -> void:
	var ta: Dictionary = grid[pa.y][pa.x]
	var tb: Dictionary = grid[pb.y][pb.x]
	var hit: Array = []
	if ta["sp"] == "badge" and tb["sp"] == "badge":
		for i in ROWS:
			for j in COLS:
				hit.append(Vector2i(j, i))
		float_text(Vector2(W / 2.0, 300), ctx.t(&"lost_and_found.wipe"), Color("#FFD54A"), 26)
	elif ta["sp"] == "badge" or tb["sp"] == "badge":
		var other: Dictionary = tb if ta["sp"] == "badge" else ta
		var bp := pa if ta["sp"] == "badge" else pb
		var kind: int = other["t"]
		hit.append(bp)
		grid[bp.y][bp.x]["sp"] = ""
		for i in ROWS:
			for j in COLS:
				var x: Variant = grid[i][j]
				if x != null and x["t"] == kind and x["sp"] != "badge":
					if other["sp"] != "" and x["wrap"] == 0:
						x["sp"] = "bomb" if other["sp"] == "bomb" else ("h" if r.next() < 0.5 else "v")
					hit.append(Vector2i(j, i))
	else:
		var kinds := [String(ta["sp"]), String(tb["sp"])]
		kinds.sort()
		var s := "+".join(PackedStringArray(kinds))
		ta["sp"] = ""
		tb["sp"] = ""
		hit.append(pa)
		hit.append(pb)
		var row := pb.y
		var c := pb.x
		if s == "bomb+bomb":
			for i in range(-2, 3):
				for j in range(-2, 3):
					hit.append(Vector2i(c + j, row + i))
		else:
			var rad := 1 if s.contains("bomb") else 0
			for i in range(-rad, rad + 1):
				for k in COLS:
					hit.append(Vector2i(k, row + i))
				for k in ROWS:
					hit.append(Vector2i(c + i, k))
		fx_blast.append({"sp": "big", "r": row, "c": c, "life": 0.5})
	chain = 2
	_clear_cells(hit.filter(func(p: Vector2i) -> bool: return live(p.y, p.x)))
	shake(0.2)
	tone(300, 0.3, &"sawtooth", 0.07, 2.2)
	ctx.buzz(40)


func _gravity() -> void:
	for c in COLS:
		var spots: Array[int] = []
		for row in ROWS:
			if not cells[row][c]["hole"]:
				spots.append(row)
		var tiles: Array = []
		for row in spots:
			var t: Variant = grid[row][c]
			if t != null and t["die"] == 0.0:
				tiles.append(t)
		var empty := spots.size() - tiles.size()
		for row in spots:
			grid[row][c] = null
		for i in tiles.size():
			grid[spots[empty + i]][c] = tiles[i]
		for i in empty:
			var row: int = spots[i]
			grid[row][c] = _new_tile(_rand_type(), row, c, Y0 - (empty - i) * T - 10.0)


func _shuffle() -> void:
	var tiles: Array = []
	for line_tiles: Array in grid:
		for t: Variant in line_tiles:
			if t != null and t["wrap"] == 0 and t["sp"] == "":
				tiles.append(t)
	var guard := 0
	while true:
		var kinds: Array = tiles.map(func(t: Dictionary) -> int: return t["t"])
		for i in range(kinds.size() - 1, 0, -1):
			var j := int(r.next() * (i + 1))
			var tmp: int = kinds[i]
			kinds[i] = kinds[j]
			kinds[j] = tmp
		for i in tiles.size():
			tiles[i]["t"] = kinds[i]
		guard += 1
		if guard >= 50 or (_runs().is_empty() and not find_moves().is_empty()):
			break
	float_text(Vector2(W / 2.0, 330), ctx.t(&"lost_and_found.shuffle"), Color.WHITE, 22)


# ---------------------------------------------------------------- a run = one level

func _init_run(level: int) -> void:
	_fun.randomize()
	lvl = recipe(maxi(1, level))
	r = KitRng.new(lvl["seed"])
	_uid = 0
	moves = lvl["moves"] + (int(ctx.perk(&"extra_moves")) if ctx != null else 0)
	phase = "idle"
	wait = 0.0
	chain = 1
	sel = Vector2i(-1, -1)
	drag = {}
	cur = Vector2i(3, ROWS - 1)
	kb = false
	made = 0
	fx_blast = []
	flyers = []
	idle_t = 0.0
	hint = []
	banner = 1.6
	bonus_left = 0
	swap = {}
	prefer = []
	_won = false
	_stars = 0
	_note = ""
	_restarted = false
	_build()
	# Pet Pals detectives bring a Siren along
	if ctx != null and ctx.perk(&"start_siren") > 0.0:
		var plain: Array = []
		for line_tiles: Array in grid:
			for t: Variant in line_tiles:
				if t != null and t["sp"] == "" and t["wrap"] == 0:
					plain.append(t)
		if not plain.is_empty():
			plain[int(r.next() * plain.size())]["sp"] = "h" if r.next() < 0.5 else "v"


func can_revive() -> bool:
	return not _won and not _restarted


func revive() -> void:
	moves += 5
	phase = "idle"
	idle_t = 0.0


func _update(dt: float) -> void:
	banner = maxf(0.0, banner - dt)
	var moving := false
	for row in ROWS:
		for c in COLS:
			var t: Variant = grid[row][c]
			if t == null:
				continue
			t["spark"] = maxf(0.0, t["spark"] - dt * 2.5)
			t["born"] = maxf(0.0, t["born"] - dt * 4.0)
			if t["die"] > 0.0:
				t["die"] += dt * 5.5
				moving = true
				continue
			var tx := _cx(c)
			var ty := _cy(row)
			if absf(t["x"] - tx) > 0.5:
				t["x"] += (tx - t["x"]) * minf(1.0, dt * 18.0)
				moving = true
			else:
				t["x"] = tx
			if t["y"] < ty - 0.5:
				t["vy"] += 2600.0 * dt
				t["y"] = minf(ty, t["y"] + t["vy"] * dt)
				moving = true
				if t["y"] >= ty:
					t["vy"] = 0.0
					t["land"] = 1.0
			elif t["y"] > ty + 0.5:
				t["y"] += (ty - t["y"]) * minf(1.0, dt * 18.0)
				moving = true
			else:
				t["y"] = ty
				t["vy"] = 0.0
			t["land"] = maxf(0.0, t["land"] - dt * 5.0)
	for b in fx_blast:
		b["life"] -= dt
	fx_blast = fx_blast.filter(func(b: Dictionary) -> bool: return b["life"] > 0.0)
	for f in flyers:
		f["life"] += dt * 2.2
	flyers = flyers.filter(func(f: Dictionary) -> bool: return f["life"] < 1.0)
	if wait > 0.0:
		wait -= dt
		return
	match phase:
		"swap":
			if not moving:
				var sw := swap
				swap = {}
				_after_swap(sw)
		"back":
			if not moving:
				phase = "idle"
		"resolve":
			var any_dying := false
			var any_dead := false
			for line_tiles: Array in grid:
				for t: Variant in line_tiles:
					if t != null and t["die"] > 0.0:
						any_dead = true
						if t["die"] < 1.0:
							any_dying = true
			if any_dying:
				return
			if any_dead:
				_gravity()
				return
			if moving:
				return
			if _step():
				prefer = []
				wait = 0.05
				return
			chain = 1
			phase = "idle"
			_check_end()
		"bonus":
			if bonus_left > 0:
				bonus_t -= dt
				if bonus_t <= 0.0:
					bonus_left -= 1
					moves -= 1
					add_score(300)
					var all: Array = []
					for line_tiles: Array in grid:
						for t: Variant in line_tiles:
							if t != null:
								all.append(t)
					if not all.is_empty():
						var spot: Dictionary = all[_fun.randi() % all.size()]
						float_text(Vector2(spot["x"], spot["y"]), "+300", Color("#FFD54A"), 16)
						burst(Vector2(spot["x"], spot["y"]), Color("#FFD54A"), 6, 100)
					tone(800 + (10 - bonus_left % 10) * 60, 0.06, &"triangle", 0.06)
					bonus_t = 0.12
			else:
				phase = "done"
				wait = 0.5
		"done":
			_finish_level(true)
		"idle":
			idle_t += dt
			if idle_t > 6.0 and hint.is_empty():
				var mv := find_moves()
				if not mv.is_empty():
					hint = mv[_fun.randi() % mv.size()]


func _check_end() -> void:
	if goal_left() == 0:
		phase = "bonus"
		bonus_left = moves
		bonus_t = 0.4
		float_text(Vector2(W / 2.0, 330), ctx.t(&"lost_and_found.case_closed"), Color("#FFD54A"), 26)
		tone(880, 0.3, &"triangle", 0.09, 1.5)
		return
	if moves <= 0:
		_finish_level(false)
		return
	if find_moves().is_empty():
		_shuffle()


func _finish_level(win: bool) -> void:
	_won = win
	_stars = (3 if score >= lvl["star3"] else (2 if score >= lvl["star2"] else 1)) if win else 0
	_note = ctx.t(&"lost_and_found.note.win", {"n": fmt(score), "s": made}) if win else ctx.t(&"lost_and_found.note.lose", {"n": goal_left()})
	phase = "over"
	end()


func restart_level() -> void:
	if phase != "idle":
		return
	_restarted = true
	_won = false
	_note = ctx.t(&"lost_and_found.note.restart")
	end()


func _make_result() -> MinigameResult:
	var res := MinigameResult.make(score, made, t)
	res.won = _won
	res.level = lvl["n"]
	res.stars = _stars
	res.note = _note
	return res


# ---------------------------------------------------------------- controls

func _down(p: Vector2, _id: int) -> void:
	if p.y < 52.0 and p.x > W - 120.0:
		restart_level()
		return
	kb = false
	var c := floori((p.x - X0) / T)
	var row := floori((p.y - Y0) / T)
	if not live(row, c) or grid[row][c] == null:
		return
	drag = {"cell": Vector2i(c, row), "p": p, "used": false}


func _move(p: Vector2, _id: int, _pressed: bool) -> void:
	if drag.is_empty() or drag["used"]:
		return
	var d: Vector2 = p - drag["p"]
	if d.length() < 16.0:
		return
	drag["used"] = true
	var step := Vector2i(int(signf(d.x)), 0) if absf(d.x) > absf(d.y) else Vector2i(0, int(signf(d.y)))
	sel = Vector2i(-1, -1)
	try_swap(drag["cell"], drag["cell"] + step)


func _up(_p: Vector2, _id: int) -> void:
	var d := drag
	drag = {}
	if d.is_empty() or d["used"]:
		return
	tap_cell(d["cell"])


func _key(keycode: Key, pressed: bool) -> bool:
	if not pressed:
		return false
	var dirs := {KEY_UP: Vector2i(0, -1), KEY_DOWN: Vector2i(0, 1), KEY_LEFT: Vector2i(-1, 0), KEY_RIGHT: Vector2i(1, 0),
		KEY_W: Vector2i(0, -1), KEY_S: Vector2i(0, 1), KEY_A: Vector2i(-1, 0), KEY_D: Vector2i(1, 0)}
	if dirs.has(keycode):
		kb = true
		if sel.x >= 0:
			var s := sel
			sel = Vector2i(-1, -1)
			try_swap(s, s + dirs[keycode])
		else:
			cur = Vector2i(clampi(cur.x + dirs[keycode].x, 0, COLS - 1), clampi(cur.y + dirs[keycode].y, 0, ROWS - 1))
		return true
	if keycode == KEY_SPACE or keycode == KEY_ENTER:
		kb = true
		tap_cell(cur)
		return true
	return false


func tap_cell(p: Vector2i) -> void:
	if phase != "idle":
		return
	if sel.x >= 0:
		if sel == p:
			sel = Vector2i(-1, -1)
			return
		if absi(sel.x - p.x) + absi(sel.y - p.y) == 1:
			var s := sel
			sel = Vector2i(-1, -1)
			try_swap(s, p)
			return
	if live(p.y, p.x) and grid[p.y][p.x] != null:
		sel = p
		cur = p
		tone(700, 0.04, &"sine", 0.05)


func try_swap(a: Vector2i, b: Vector2i) -> void:
	if phase != "idle" or not live(b.y, b.x) or not live(a.y, a.x):
		return
	var ta: Variant = grid[a.y][a.x]
	var tb: Variant = grid[b.y][b.x]
	if ta == null or tb == null:
		return
	if ta["wrap"] > 0 or tb["wrap"] > 0:
		ta["spark"] = 0.6
		tb["spark"] = 0.6
		tone(200, 0.1, &"square", 0.04)
		float_text(Vector2(tb["x"], tb["y"] - 20), ctx.t(&"lost_and_found.wrapped"), Color("#6FA8DC"), 13)
		return
	hint = []
	idle_t = 0.0
	grid[a.y][a.x] = tb
	grid[b.y][b.x] = ta
	swap = {"a": a, "b": b}
	phase = "swap"
	tone(600, 0.05, &"sine", 0.05, 1.3)


func _after_swap(sw: Dictionary) -> void:
	var a: Vector2i = sw["a"]
	var b: Vector2i = sw["b"]
	var ta: Dictionary = grid[b.y][b.x]   # the one that moved to b
	var tb: Dictionary = grid[a.y][a.x]
	if ta["sp"] == "badge" or tb["sp"] == "badge" or (ta["sp"] != "" and tb["sp"] != ""):
		moves -= 1
		_combo(a, b)
		phase = "resolve"
		wait = 0.12
		return
	if _runs().is_empty():
		grid[a.y][a.x] = ta
		grid[b.y][b.x] = tb
		phase = "back"
		tone(240, 0.12, &"triangle", 0.05)
		return
	moves -= 1
	chain = 1
	prefer = [b, a]
	phase = "resolve"


# ---------------------------------------------------------------- drawing

func _goal_text() -> String:
	return ctx.t(StringName("lost_and_found.goal." + String(lvl["kind"])))


func _tip() -> String:
	if phase == "bonus":
		return ctx.t(&"lost_and_found.tip.bonus")
	if moves <= 3 and goal_left() > 0:
		return ctx.t(&"lost_and_found.tip.last", {"n": moves})
	return ctx.t(&"lost_and_found.tip.combo") if made > 0 else _goal_text()


func _draw_game() -> void:
	vgradient(view_rect, Color("#E3EDFF"), Color("#D9F2DF"))
	# the goal panel
	rr(10, 60, W - 20, 78, 18, Color.WHITE)
	rr(18, 68, 70, 62, 14, Color("#2F5BD3"), null, 0)
	text(ctx.t(&"lost_and_found.moves"), 53, 82, 11, Color("#CFE0FF"), &"center", &"body")
	text(str(moves), 53, 108, 28, Color.WHITE, &"center", &"display")
	var goals: Array = []
	for g: Dictionary in goal["collect"]:
		goals.append({"kind": "item", "t": g["t"], "left": maxi(0, g["need"] - g["got"]), "g": g})
	if lvl["prints"] > 0:
		goals.append({"kind": "paw", "left": count_prints()})
	if lvl["wraps"] > 0:
		goals.append({"kind": "wrap", "left": count_wraps()})
	var gw := (W - 120.0) / maxi(1, goals.size())
	for i in goals.size():
		var g: Dictionary = goals[i]
		var x := 104.0 + gw * (i + 0.5)
		var y := 92.0
		match String(g["kind"]):
			"item":
				g["g"]["x"] = x
				_item(g["t"], x, y, 0.62)
			"paw":
				_paw(x, y, 0.8, Color("#8E6CE0"))
			"wrap":
				rr(x - 14, y - 14, 28, 28, 8, Color(0.745, 0.882, 1.0, 0.9), Color("#6FA8DC"), 2)
				for o: Vector2 in [Vector2(-6, -6), Vector2(6, -6), Vector2(-6, 6), Vector2(6, 6)]:
					circle(x + o.x, y + o.y, 3.5, Color.WHITE, Color("#9CC7EE"), 1.2)
		if g["left"] > 0:
			text(str(g["left"]), x, y + 30, 15, INK, &"center", &"display")
		else:
			circle(x + 14, y + 12, 9, Color("#4FCFA0"), INK, 2)
			line(PackedVector2Array([Vector2(x + 9, y + 12), Vector2(x + 13, y + 16), Vector2(x + 19, y + 8)]), Color.WHITE, 2.5)
	# the board
	for row in ROWS:
		for c in COLS:
			var cell: Dictionary = cells[row][c]
			if cell["hole"]:
				continue
			var x := X0 + c * T
			var y := Y0 + row * T
			rect(x, y, T, T, Color(1, 1, 1, 0.82) if (row + c) % 2 else Color(0.941, 0.961, 1.0, 0.92))
			if cell["print"] > 0:
				_paw(x + T / 2.0, y + T / 2.0, 1.05, Color("#6E48C9") if cell["print"] > 1 else Color("#B9A2F0"), 0.9)
	for row in ROWS:
		for c in COLS:
			if cells[row][c]["hole"]:
				continue
			var x := X0 + c * T
			var y := Y0 + row * T
			for e: Array in [[Vector2i(0, -1), Vector2(x, y), Vector2(x + T, y)], [Vector2i(0, 1), Vector2(x, y + T), Vector2(x + T, y + T)],
					[Vector2i(-1, 0), Vector2(x, y), Vector2(x, y + T)], [Vector2i(1, 0), Vector2(x + T, y), Vector2(x + T, y + T)]]:
				var d: Vector2i = e[0]
				if not live(row + d.y, c + d.x):
					line(PackedVector2Array([e[1], e[2]]), INK, 2.5)
	var hint_ids: Array = []
	if not hint.is_empty() and phase == "idle":
		for p: Vector2i in hint:
			if grid[p.y][p.x] != null:
				hint_ids.append(grid[p.y][p.x]["id"])
	for row in ROWS:
		for c in COLS:
			var tl: Variant = grid[row][c]
			if tl == null:
				continue
			var s: float = 1.0 - (minf(1.0, tl["die"]) if tl["die"] > 0.0 else 0.0) + tl["spark"] * 0.15 - tl["born"] * 0.3
			if s <= 0.02:
				continue
			# tiles still falling in from above the board fade in at its top edge
			var fade := clampf((tl["y"] - (Y0 - T * 0.5)) / T, 0.0, 1.0)
			if fade <= 0.0:
				continue
			if sel == Vector2i(c, row):
				rr(X0 + c * T + 2, Y0 + row * T + 2, T - 4, T - 4, 10, Color("#FFF3B0"), Color("#FFC93C"), 3)
			var wig := sin(t * 14.0) * 0.12 if tl["id"] in hint_ids else 0.0
			var land: float = tl["land"] * 0.12
			push(Vector2(tl["x"], tl["y"]), wig, Vector2(s * (1.0 + land), s * (1.0 - land)))
			_tile(tl, fade)
			pop()
	if kb:
		rr(X0 + cur.x * T + 1, Y0 + cur.y * T + 1, T - 2, T - 2, 10, null, Color("#2F5BD3"), 3)
	for b in fx_blast:
		var a := minf(1.0, b["life"] * 3.0)
		var x := _cx(b["c"])
		var y := _cy(b["r"])
		match String(b["sp"]):
			"h":
				rect(X0, y - 8, COLS * T, 16, Color(1, 1, 1, a))
			"v":
				rect(x - 8, Y0, 16, ROWS * T, Color(1, 1, 1, a))
			_:
				circle(x, y, (120.0 if b["sp"] == "big" else 70.0) * (1.0 - b["life"]), Color(1, 1, 1, a), null, 0)
	for f in flyers:
		var u: float = f["life"]
		var e := u * u
		_item(f["t"], f["x"] + (f["tx"] - f["x"]) * e, f["y"] + (f["ty"] - f["y"]) * e - sin(u * PI) * 40.0, 0.6)
	# score and the star bar
	var sx := 20.0
	var sw := W - 40.0
	var by := Y0 + ROWS * T + 18.0
	var most: float = lvl["star3"] * 1.12
	bar(sx, by, sw, 16, score / most, Color("#FFC93C"))
	for v: int in [lvl["star2"], lvl["star3"]]:
		star(sx + sw * v / most, by + 8, 11, 5, Color("#FFC93C") if score >= v else Color("#E3DEEF"), INK, 2)
	text(ctx.t(&"lost_and_found.points", {"n": fmt(score)}), sx, by + 32, 12, Color("#5E5679"), &"left", &"body")
	# the detective
	var who: StringName = ctx.squad[0] if not ctx.squad.is_empty() else &"puppy"
	sprite(who, 40, 634, 58, {"sy": 1.0 + sin(t * 3.0) * 0.03})
	rr(76, 572, W - 88, 46, 16, Color.WHITE, INK, 2)
	text(_tip(), 76 + (W - 88) / 2.0, 595, 12, Color("#2F5BD3"), &"center", &"body")
	# top bar
	hud(Color("#2F5BD3"), ctx.t(&"lost_and_found.level", {"n": lvl["n"]}), 100)
	rr(W - 118, 12, 108, 28, 14, Color.WHITE)
	text(ctx.t(&"lost_and_found.restart"), W - 64, 27, 13, INK, &"center", &"body")
	if lvl["big"]:
		text(ctx.t(&"lost_and_found.big"), 180, 27, 11, Color("#FFF3B0"), &"center", &"body")
	if banner > 0.0:
		var al := minf(1.0, banner * 2.0)
		rr(40, 300, W - 80, 80, 20, Color(1, 1, 1, al), Color(INK, al))
		text(ctx.t(&"lost_and_found.level", {"n": lvl["n"]}), W / 2.0, 326, 24, Color("#2F5BD3", al), &"center", &"display")
		text(_goal_text(), W / 2.0, 356, 13, Color(INK, al), &"center", &"body")


func _tile(tl: Dictionary, a: float) -> void:
	if tl["sp"] == "badge":
		_badge(a)
	else:
		_item(tl["t"], 0, 0, 1.0, a)
		if tl["sp"] == "h" or tl["sp"] == "v":
			push(Vector2.ZERO, PI / 2.0 if tl["sp"] == "v" else 0.0)
			rect(-20, -4, 40, 3, Color(1, 1, 1, 0.9 * a))
			rect(-20, 3, 40, 3, Color(1, 1, 1, 0.9 * a))
			pop()
			circle(13, -13, 6, Color("#FF5E6C" if sin(t * 12.0) > 0.0 else "#5BA8FF", a), Color(INK, a), 1.8)
		if tl["sp"] == "bomb":
			circle(0, 0, 20, null, Color(1, 1, 1, (0.55 + 0.2 * sin(t * 6.0)) * a), 3)
			circle(0, 0, 21.5, null, Color(INK, a), 1.8)
			ellipse(-9, -11, 5, 3, Color(1, 1, 1, 0.85 * a), null, 0, -0.6)
	if tl["wrap"] > 0:
		var thick: bool = tl["wrap"] > 1
		rr(-21, -21, 42, 42, 10, Color(0.588, 0.784, 0.961, 0.75 * 0.85 * a) if thick else Color(0.784, 0.91, 1.0, 0.7 * 0.7 * a), Color("#6FA8DC", a), 2.5)
		for o: Vector2 in [Vector2(-10, -10), Vector2(10, -10), Vector2(-10, 10), Vector2(10, 10), Vector2.ZERO]:
			circle(o.x, o.y, 4.5, Color(1, 1, 1, 0.9 * a), Color("#9CC7EE", a), 1.2)


func _item(k: int, x: float, y: float, s: float, a := 1.0) -> void:
	if k < 0 or k >= ITEMS.size():
		return
	var col := Color(String(ITEMS[k][1]), a)
	var dk := Color(String(ITEMS[k][2]), a)
	var ink := Color(INK, a)
	var white := Color(1, 1, 1, a)
	push(Vector2(x, y), 0.0, Vector2(s, s))
	match String(ITEMS[k][0]):
		"balloon":
			line(quad(Vector2(0, 12), Vector2(-2, 17), Vector2(2, 20), 6), ink, 2.4)
			ellipse(0, -3, 14, 16, col, ink, 2.4)
			poly(PackedVector2Array([Vector2(-3, 12), Vector2(3, 12), Vector2(0, 15)]), col, ink, 2.4)
			ellipse(-6, -9, 3.5, 5.5, Color(1, 1, 1, 0.75 * a), null, 0, -0.4)
		"mitten":
			var m := PackedVector2Array([Vector2(-10, 16), Vector2(-11, -4)])
			m.append_array(quad(Vector2(-11, -4), Vector2(-12, -18), Vector2(1, -18), 6))
			m.append_array(quad(Vector2(1, -18), Vector2(12, -18), Vector2(11, -4), 6))
			m.append(Vector2(11, 0))
			m.append_array(quad(Vector2(11, 0), Vector2(18, -6), Vector2(19, 1), 5))
			m.append_array(quad(Vector2(19, 1), Vector2(19, 8), Vector2(11, 10), 5))
			m.append(Vector2(11, 16))
			poly(m, col, ink, 2.4)
			rr(-12, 10, 25, 9, 4, white, ink, 2)
			for o: Vector2 in [Vector2(-4, -8), Vector2(4, -4), Vector2(-3, 2)]:
				circle(o.x, o.y, 1.8, white, null, 0)
		"candy":
			poly(PackedVector2Array([Vector2(-11, 0), Vector2(-20, -8), Vector2(-20, 8)]), dk, ink, 2.4)
			poly(PackedVector2Array([Vector2(11, 0), Vector2(20, -8), Vector2(20, 8)]), dk, ink, 2.4)
			circle(0, 0, 12.5, col, ink, 2.4)
			arc(0, 0, 7, 0.3, 2.4, white, 2.6)
			arc(0, 0, 7, 3.4, 5.5, white, 2.6)
		"key":
			circle(-7, -6, 10, col, ink, 2.4)
			circle(-7, -6, 3.6, white, ink, 2)
			poly(PackedVector2Array([Vector2(0, 0), Vector2(14, 14), Vector2(10, 18), Vector2(7, 15), Vector2(5, 17), Vector2(2, 14), Vector2(4, 12), Vector2(-4, 4)]), col, ink, 2.4)
		"clover":
			for i in 4:
				push(Vector2.ZERO, i * PI / 2.0 + PI / 4.0)
				var leaf := cubic(Vector2.ZERO, Vector2(-11, -6), Vector2(-10, -19), Vector2(0, -14), 8)
				leaf.append_array(cubic(Vector2(0, -14), Vector2(10, -19), Vector2(11, -6), Vector2.ZERO, 8))
				poly(leaf, col, ink, 2.4)
				pop()
			circle(0, 0, 3, white, ink, 1.5)
		"bow":
			var left := quad(Vector2.ZERO, Vector2(-18, -18), Vector2(-19, -2), 7)
			left.append_array(quad(Vector2(-19, -2), Vector2(-18, 14), Vector2.ZERO, 7))
			poly(left, col, ink, 2.4)
			var right := quad(Vector2.ZERO, Vector2(18, -18), Vector2(19, -2), 7)
			right.append_array(quad(Vector2(19, -2), Vector2(18, 14), Vector2.ZERO, 7))
			poly(right, col, ink, 2.4)
			line(PackedVector2Array([Vector2(-3, 3), Vector2(-8, 17), Vector2(-2, 14)]), ink, 2.4)
			line(PackedVector2Array([Vector2(3, 3), Vector2(8, 17), Vector2(2, 14)]), ink, 2.4)
			circle(0, 0, 5, dk, ink, 2)
	pop()


func _badge(a: float) -> void:
	push(Vector2.ZERO, sin(t * 3.0) * 0.08)
	star(0, 0, 20, 12, Color("#FFC93C", a), Color(INK, a), 2.5)
	circle(0, 0, 7, Color("#FFF3B0", a), Color(INK, a), 2)
	for i in 5:
		var an := -PI / 2.0 + i * TAU / 5.0
		circle(cos(an) * 20.0, sin(an) * 20.0, 2.6, Color("#FFF3B0", a), Color(INK, a), 1.5)
	star(12, -14, 4, 1.6, Color(1, 1, 1, (0.6 + 0.4 * sin(t * 8.0)) * a), null)
	pop()


func _paw(x: float, y: float, s: float, col: Color, a := 1.0) -> void:
	var c := Color(col, col.a * a)
	push(Vector2(x, y), 0.0, Vector2(s, s))
	ellipse(0, 4, 8, 6.5, c, null, 0)
	for o: Vector2 in [Vector2(-8, -4), Vector2(-3, -9), Vector2(3, -9), Vector2(8, -4)]:
		ellipse(o.x, o.y, 3, 3.6, c, null, 0)
	pop()
