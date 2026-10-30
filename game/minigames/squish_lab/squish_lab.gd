extends KitGame
## SQUISH LAB (Squishy Testing Facility): a toy, not a game. No score, no coins, no timer: pick one of your
## squishies and squish it. Ported from prototypes/games/squish-lab.js (same physics, same numbers).
##
## Each squishy is a soft body: a ring of 40 points with stretchy skin, a volume it keeps and a shape it remembers.
## Foam's remembered shape gives in while it is squished and only creeps back slowly (slow rise); jelly keeps its
## volume and wobbles; rubber bounces. Tools: Hand (stretch, throw, poke), Drop, Ball, Press, Roller, Squeeze;
## the Lab's building level opens them one by one (testlab.html "Building levels").
##
## The look is 3D like the prototype (a lab room, a table, a chrome press...), drawn in a SubViewport behind the
## buttons. The physics stays flat (2D). The squishy is its real 3D model from the island (testlab.html "Use the
## real 3D squishy"): its outline is traced from the model, and every point of the model follows the soft body
## (lab.gdshader), puffing out towards you when it is squished flat.
##
## A squish counts when the squish-o-meter goes past 50%. Result: metric = squishes (they add up for the Lab's
## next level), score = the best squish in % (just for fun).

const FLOOR := 512.0
const N := 40
const HSTEP := 1.0 / 600.0
const GRAV := 1800.0
const PR := 2.0
const U := 40.0
const SQUISH_AT := 0.5
const MAT := {
	# edge/bend/area/shape = how hard each rule pulls per physics step; mu = grip on the table and the press
	# (static friction); rest = bounciness. Foam: its relaxed shape gives in when squished (yield) and only creeps
	# back at `recover` px/s, so it rises back slowly.
	&"foam": {"edge": 0.3, "bend": 0.04, "area": 0.07, "shape": 0.012, "memory": true, "yield": 0.01, "recover": 30.0, "damp": 8.0, "rest": 0.04, "fric": 0.55, "mu": 1.1, "min_press": 0.16, "squish": &"soft"},
	&"jelly": {"edge": 0.35, "bend": 0.02, "area": 0.55, "shape": 0.010, "memory": false, "damp": 1.2, "rest": 0.2, "fric": 0.2, "mu": 0.6, "min_press": 0.33, "squish": &"wet"},
	&"bouncy": {"edge": 0.7, "bend": 0.12, "area": 0.35, "shape": 0.03, "memory": false, "damp": 2.5, "rest": 0.55, "fric": 0.35, "mu": 0.8, "min_press": 0.28, "squish": &"boing"},
}
## The prototype's shelf, then each family's usual stuff (ocean squishies are jelly, pets and sky ones rubber).
const MATERIAL_OF := {&"bao": &"foam", &"marshmallow": &"foam", &"toast": &"foam", &"peach": &"foam", &"donut": &"foam", &"shroomy": &"foam",
	&"jelly": &"jelly", &"axolotl": &"jelly", &"whale": &"jelly", &"gummy": &"jelly", &"raindrop": &"jelly",
	&"kitty": &"bouncy", &"puppy": &"bouncy", &"bunny": &"bouncy", &"sunny": &"bouncy", &"mossball": &"bouncy", &"egg": &"bouncy"}
const FAMILY_MATERIAL := {"ocean": &"jelly", "pets": &"bouncy", "sky": &"bouncy"}
const TOOLS: Array[StringName] = [&"hand", &"press", &"roller", &"squeeze", &"ball", &"drop"]
## The Lab's building level that opens each tool.
const TOOL_LEVEL := {&"hand": 1, &"drop": 1, &"ball": 2, &"press": 3, &"roller": 4, &"squeeze": 5}
const TY := 586.0

# ---- the soft body
var body_id := &""
var mat_id := &"foam"
var M: Dictionary = MAT[&"foam"]
var x := PackedVector2Array()
var v := PackedVector2Array()
var o := PackedVector2Array()
var q := PackedVector2Array()
var qm := PackedVector2Array()
var rx := PackedVector2Array()
var L := PackedFloat32Array()
var L2 := PackedFloat32Array()
var Lm := PackedFloat32Array()
var L2m := PackedFloat32Array()
var touch := PackedInt32Array()
var A0 := 1.0
var Am := 1.0
var h0 := 1.0
var w0 := 1.0

# ---- the lab
var tool := &"hand"
var holding := false
var grabs: Array[Dictionary] = []
var press_y := -70.0
var press_moving := false
var sq_gap := 9999.0
var roller := {"on": false, "x": 0.0, "y": 0.0, "tx": 0.0, "ty": 0.0, "r": 24.0, "spin": 0.0, "placed": false}
var balls: Array[Dictionary] = []
var feet := {}
var anchor := false
var grounded := false
var meter := 0.0
var best := 0.0
var squishes := 0
var shelf_open := false
var _armed := true
var _ptrs := {}
var _acc := 0.0
var _tip := 4.0
var _tip_text := &""
var _sfx: Array = []
var _vy_in := 0.0
var _bcd := 0.0
var _last_def := -1.0
var _prev_def := 0.0
var _last_sq := 0.0
var _hiss := 0.0
var _rest_pts := PackedVector2Array()   # the outline the model was bound to (physics units, around 0)
var _art := {}                           # the 3D scene's parts
# per-step copies of the tools' numbers (Dictionary lookups are slow inside the 600-a-second loop)
var _mu := 1.0
var _roll_on := false
var _roll := Vector2.ZERO
var _roll_r := 0.0


# ---------------------------------------------------------------- setting up

func setup(context: MinigameContext) -> void:
	ctx = context
	if _art.is_empty():
		_build_lab()
	super(context)


func _init_run(_level: int) -> void:
	tool = &"hand"
	holding = false
	grabs.clear()
	press_y = -70.0
	sq_gap = 9999.0
	roller["on"] = false
	roller["placed"] = false
	balls.clear()
	feet.clear()
	squishes = 0
	best = 0.0
	meter = 0.0
	shelf_open = false
	_armed = true
	_ptrs.clear()
	_tip = 4.0
	_tip_text = &"squish_lab.tip.hand"
	var first: StringName = ctx.squad[0] if not ctx.squad.is_empty() else &"bao"
	if body_id != first or x.is_empty():
		load_squishy(first)


## Which kind of squish a squishy is made of.
func material_for(id: StringName) -> StringName:
	if MATERIAL_OF.has(id):
		return MATERIAL_OF[id]
	var info: Dictionary = ctx.squad_info.get(id, {})
	return FAMILY_MATERIAL.get(String(info.get("family", "")), &"foam")


func tool_open(k: StringName) -> bool:
	return int(TOOL_LEVEL.get(k, 1)) <= maxi(1, ctx.building_level)


## Put a squishy on the table: trace its outline, make its soft body, and bind its 3D model to it.
func load_squishy(id: StringName) -> void:
	body_id = id
	mat_id = material_for(id)
	M = MAT[mat_id]
	var model := ctx.model(id)
	var pts := PackedVector2Array()
	if model != null:
		pts = _model_points(model)
	var shape := outline_of(pts if pts.size() >= 12 else _blob_points())
	var sh: PackedVector2Array = shape["pts"]
	var rc: Vector2 = shape["centre"]
	var sc := 150.0 / maxf(shape["h"], shape["w"] * 0.85)
	q.resize(N)
	for i in N:
		q[i] = (sh[i] - rc) * sc
	var by := -INF
	for p in q:
		by = maxf(by, p.y)
	var start := Vector2(W / 2.0, FLOOR - by - 160.0)
	x = PackedVector2Array()
	v = PackedVector2Array()
	o = PackedVector2Array()
	rx = PackedVector2Array()
	x.resize(N)
	v.resize(N)
	o.resize(N)
	rx.resize(N)
	touch.resize(N)
	L.resize(N)
	L2.resize(N)
	for i in N:
		x[i] = start + q[i]
		L[i] = q[i].distance_to(q[(i + 1) % N])
		L2[i] = q[i].distance_to(q[(i + 2) % N])
	A0 = area(q)
	qm = q.duplicate()
	Lm = L.duplicate()
	L2m = L2.duplicate()
	Am = A0
	var ys := _extent(q)
	h0 = ys.y
	w0 = ys.x
	best = 0.0
	grabs.clear()
	balls.clear()
	_rest_pts = q.duplicate()
	if model != null:
		_bind_model(model, rc, sc)
	else:
		_clear_model()


## Every point of the model seen from the front, as a picture (y down), in the model's own units.
func _model_points(model: Node3D) -> PackedVector2Array:
	var out := PackedVector2Array()
	for mi in _meshes(model):
		var xf: Transform3D = mi["xf"]
		var mesh: Mesh = (mi["node"] as MeshInstance3D).mesh
		for s in mesh.get_surface_count():
			var verts: PackedVector3Array = mesh.surface_get_arrays(s)[Mesh.ARRAY_VERTEX]
			for p in verts:
				var w := xf * p
				out.append(Vector2(w.x, -w.y))
	return out


## A plain rounded squishy shape (when there is no model: the harness and tests).
func _blob_points() -> PackedVector2Array:
	var out := PackedVector2Array()
	for i in 72:
		var a := i / 72.0 * TAU
		out.append(Vector2(cos(a) * 60.0, sin(a) * 50.0 - absf(sin(a)) * 4.0))
	return out


## The prototype's shapeOf(): the squishy's outline as 40 points at even angles around its middle, spikes
## softened (ears, stems), left-right symmetric (never smaller than the picture) and with a flat bottom so it
## stands steady. {"pts", "centre" (the ring's true middle), "w", "h"}
static func outline_of(points: PackedVector2Array) -> Dictionary:
	var lo := Vector2(INF, INF)
	var hi := Vector2(-INF, -INF)
	for p in points:
		lo = lo.min(p)
		hi = hi.max(p)
	var mid := (lo + hi) / 2.0
	var rad := PackedFloat32Array()
	rad.resize(N)
	for p in points:
		var d := p - mid
		var k := posmod(roundi((atan2(d.y, d.x) + PI / 2.0) / TAU * N), N)
		rad[k] = maxf(rad[k], d.length())
	for i in N:
		if rad[i] <= 0.0:
			rad[i] = maxf(rad[(i + N - 1) % N], rad[(i + 1) % N])
	var margin := (hi.y - lo.y) * 0.01
	var sm := PackedFloat32Array()
	sm.resize(N)
	for i in N:
		var r := rad[i] + margin
		var a := rad[(i + N - 1) % N] + margin
		var b := rad[(i + 1) % N] + margin
		sm[i] = minf(r, minf(maxf(a, b) * 1.35, (a + b) / 2.0 * 1.6))
	var pts := PackedVector2Array()
	pts.resize(N)
	for i in N:
		var r := maxf(sm[i], sm[(N - i) % N])
		var th := -PI / 2.0 + float(i) / N * TAU
		pts[i] = mid + Vector2(cos(th), sin(th)) * r
	var yb := -INF
	var yt := INF
	for p in pts:
		yb = maxf(yb, p.y)
		yt = minf(yt, p.y)
	var cut := yb - (yb - yt) * 0.09
	for i in N:
		if pts[i].y > cut:
			pts[i].y = yb - (yb - pts[i].y) * 0.15
	var centre := Vector2.ZERO
	for p in pts:
		centre += p
	var size := _extent(pts)
	return {"pts": pts, "centre": centre / N, "w": size.x, "h": size.y}


static func _extent(pts: PackedVector2Array) -> Vector2:
	var lo := Vector2(INF, INF)
	var hi := Vector2(-INF, -INF)
	for p in pts:
		lo = lo.min(p)
		hi = hi.max(p)
	return hi - lo


static func area(p: PackedVector2Array) -> float:
	var s := 0.0
	var n := p.size()
	for i in n:
		var a := p[i]
		var b := p[(i + 1) % n]
		s += a.x * b.y - b.x * a.y
	return s / 2.0


static func centroid(p: PackedVector2Array) -> Vector2:
	var c := Vector2.ZERO
	for a in p:
		c += a
	return c / p.size()


static func inside(p: PackedVector2Array, px: float, py: float) -> bool:
	var c := false
	var j := p.size() - 1
	for i in p.size():
		var a := p[i]
		var b := p[j]
		if (a.y > py) != (b.y > py) and px < (b.x - a.x) * (py - a.y) / (b.y - a.y) + a.x:
			c = not c
		j = i
	return c


# ---------------------------------------------------------------- the physics (prototype step())

func _update(dt: float) -> void:
	if x.is_empty():
		return
	_acc += minf(dt, 0.05)
	var n := 0
	while _acc >= HSTEP and n < 40:
		step(HSTEP)
		_acc -= HSTEP
		n += 1
	_tip = maxf(0.0, _tip - dt)
	# squish-o-meter: how far the squishy is from its relaxed shape
	var size := _extent(x)
	var def := maxf(maxf(1.0 - size.y / h0, size.x / w0 - 1.0), maxf(size.y / h0 - 1.0, 1.0 - area(x) / A0))
	meter += (clampf(def * 1.4, 0.0, 1.0) - meter) * minf(1.0, dt * 10.0)
	best = maxf(best, meter)
	add_score(roundi(best * 100.0) - score)
	if meter > SQUISH_AT and _armed:
		_armed = false
		squishes += 1
		float_text(Vector2(W - 70, 120), ctx.t(&"squish_lab.squish"), Color("#FF6FA3"), 16)
	elif meter < SQUISH_AT * 0.6:
		_armed = true
	# sounds from impacts and fast squishing
	var ch := absf(def - (_last_def if _last_def >= 0.0 else def)) / maxf(dt, 0.001)
	_last_def = def
	_last_sq -= dt
	if ch > 1.6 and _last_sq <= 0.0:
		if M["squish"] == &"boing" and def < _prev_def:
			_boing(minf(1.0, ch / 6.0))
		else:
			_squelch(minf(1.0, ch / 5.0), M["squish"])
		_last_sq = 0.12
		if ch > 4.0:
			ctx.buzz(15)
	_prev_def = def
	for s: Array in _sfx:
		if s[0] == &"boing":
			_boing(s[1])
		elif s[0] == &"pop":
			_squelch(1.0, &"wet")
			ctx.buzz(25)
	_sfx.clear()
	if press_moving and tool == &"press" and holding:
		_hiss -= dt
		if _hiss <= 0.0:
			_hiss = 0.12
			noise(0.12, 0.02, 3000)
	for b in balls:
		b["life"] -= dt
	balls.assign(balls.filter(func(b: Dictionary) -> bool: return b["life"] > 0.0))


func step(h: float) -> void:
	_tools_move(h)
	anchor = not grabs.is_empty()
	for g in grabs:
		if g["whole"] or g["free"]:
			anchor = false
	if anchor:
		for g in grabs:
			if Vector2(g["x"], g["y"]).distance_to(Vector2(g["sx"], g["sy"])) > w0 * 0.85:
				g["free"] = true
				_sfx.append([&"pop", 1.0])
	for i in N:
		v[i].y += GRAV * h
		o[i] = x[i]
		x[i] += v[i] * h
		touch[i] = 0
	# grabbing hands pull their points toward the finger
	for g in grabs:
		for pt: Array in g["pts"]:
			var i: int = pt[0]
			var target := Vector2(g["x"] + pt[2], g["y"] + pt[3])
			x[i] += (target - x[i]) * 0.22 * pt[1]
	for i in N:
		rx[i] = Vector2.ZERO
	# edges (stretchy skin) + bending, applied together with the shape memory below
	var k_edge: float = M["edge"]
	var k_bend: float = M["bend"]
	for i in N:
		var j := (i + 1) % N
		var d := x[j] - x[i]
		var len := maxf(d.length(), 1e-6)
		var e := d * ((len - Lm[i]) / len * 0.5 * k_edge)
		rx[i] += e
		rx[j] -= e
		j = (i + 2) % N
		d = x[j] - x[i]
		len = maxf(d.length(), 1e-6)
		e = d * ((len - L2m[i]) / len * 0.5 * k_bend)
		rx[i] += e
		rx[j] -= e
	# area: keeps the volume, so a squished squishy bulges out at the sides
	var c_area := area(x) - Am
	var gs := 0.0
	var gr := PackedVector2Array()
	gr.resize(N)
	for i in N:
		var p := x[(i + N - 1) % N]
		var nx := x[(i + 1) % N]
		gr[i] = Vector2((nx.y - p.y) / 2.0, (p.x - nx.x) / 2.0)
		gs += gr[i].length_squared()
	if gs > 1e-6:
		var l := -c_area / gs * float(M["area"])
		for i in N:
			rx[i] += gr[i] * l
	# shape memory: pull toward the best-fitting rotated rest shape
	var c := centroid(x)
	var sxx := 0.0
	var sxy := 0.0
	for i in N:
		var p := x[i] - c
		var r := qm[i]
		sxx += r.x * p.x + r.y * p.y
		sxy += r.x * p.y - r.y * p.x
	# squishies are a little bottom-heavy: when on the table they slowly roll back upright
	var ang := atan2(sxy, sxx)
	if grounded and grabs.is_empty():
		ang *= 1.0 - 0.012
	var ca := cos(ang)
	var sa := sin(ang)
	var k := float(M["shape"]) * (0.5 if not grabs.is_empty() else 1.0)
	for i in N:
		var r := qm[i]
		var goal := c + Vector2(ca * r.x - sa * r.y, sa * r.x + ca * r.y)
		var d := rx[i] + (goal - x[i]) * k
		x[i] += d
		rx[i] = d
	_mu = M["mu"]
	_roll_on = roller["on"]
	_roll = Vector2(roller["x"], roller["y"])
	_roll_r = float(roller["r"]) + PR
	for i in N:
		_collide(i)
	if not balls.is_empty():
		_balls_step(h)
	# velocities from movement, with friction, bounce and internal damping
	var vel := Vector2.ZERO
	for i in N:
		v[i] = (x[i] - o[i]) / h
		vel += v[i]
	vel /= N
	var ang_mom := 0.0
	var inertia := 0.0
	for i in N:
		var r := x[i] - c
		ang_mom += r.x * (v[i].y - vel.y) - r.y * (v[i].x - vel.x)
		inertia += r.length_squared()
	var w := ang_mom / inertia if inertia > 0.0 else 0.0
	grounded = false
	for i in N:
		if touch[i] == 1:
			grounded = true
			break
	if grounded and grabs.is_empty():
		# rolling resistance
		var w2 := w * exp(-22.0 * h)
		var vx2 := vel.x * exp(-9.0 * h)
		for i in N:
			var r := x[i] - c
			v[i] += Vector2((vx2 - vel.x) - (w2 - w) * r.y, (w2 - w) * r.x)
		w = w2
		vel.x = vx2
	var keep := exp(-float(M["damp"]) * h)
	var air := exp(-0.15 * h)
	var fr := exp(-float(M["fric"]) * 40.0 * h)
	for i in N:
		var r := x[i] - c
		var rv := Vector2(vel.x - w * r.y, vel.y + w * r.x)
		v[i] = (rv + (v[i] - rv) * keep) * air
		if touch[i] == 1 or touch[i] == 3:
			v[i].x *= fr
		elif touch[i] == 2:
			v[i].y *= fr
	if M["memory"]:
		_memory(h)
	# bounce: the whole squishy bounces as one (so it doesn't start spinning), with a short cool-down
	_bcd = maxf(0.0, _bcd - h)
	if grounded and _vy_in > 160.0 and _bcd <= 0.0 and grabs.is_empty():
		var my := 0.0
		for i in N:
			my += v[i].y
		my /= N
		var dv := -float(M["rest"]) * _vy_in - minf(0.0, my)
		if dv < 0.0:
			for i in N:
				v[i].y += dv
		_bcd = 0.18
		if M["rest"] > 0.3:
			_sfx.append([&"boing", minf(1.0, _vy_in / 1200.0)])
	var vin := 0.0
	for i in N:
		vin += v[i].y
	_vy_in = vin / N


## Coulomb friction for position-based physics: small sideways slips are cancelled (static), bigger ones slowed.
func _fric(i: int, dn: float) -> void:
	var d := x[i].x - o[i].x
	if absf(d) < _mu * dn:
		x[i].x = o[i].x
	else:
		x[i].x -= signf(d) * _mu * 0.6 * dn


## Foam: the relaxed shape gives in to the squeeze and creeps back slowly (the slow rise).
func _memory(h: float) -> void:
	var c := centroid(x)
	var sxx := 0.0
	var sxy := 0.0
	for i in N:
		var p := x[i] - c
		sxx += q[i].x * p.x + q[i].y * p.y
		sxy += q[i].x * p.y - q[i].y * p.x
	var an := atan2(sxy, sxx)
	var ca := cos(an)
	var sa := sin(an)
	var st := float(M["recover"]) * h
	var yld: float = M["yield"]
	var mid := Vector2.ZERO
	for i in N:
		var p := x[i] - c
		var local := Vector2(ca * p.x + sa * p.y, -sa * p.x + ca * p.y)
		var m := qm[i]
		m += (local - m) * yld
		var d := q[i] - m
		var dl := d.length()
		m = m + d / dl * st if dl > st else q[i]
		qm[i] = m
		mid += m
	mid /= N
	for i in N:
		qm[i] -= mid
	for i in N:
		Lm[i] = qm[i].distance_to(qm[(i + 1) % N])
		L2m[i] = qm[i].distance_to(qm[(i + 2) % N])
	Am = area(qm)


func _collide(i: int) -> void:
	var p := x[i]
	if p.y > FLOOR - PR:
		var dn := p.y - (FLOOR - PR)
		x[i].y = FLOOR - PR
		touch[i] = 1
		_fric(i, dn)
	elif not anchor and p.x >= 6 + PR and p.x <= W - 6 - PR and p.y >= press_y + PR and sq_gap >= 999 and not _roll_on:
		return
	if anchor and feet.has(i):
		x[i] = Vector2(o[i].x, maxf(x[i].y, o[i].y))
	if x[i].x < 6 + PR:
		x[i].x = 6 + PR
		touch[i] = 2
	if x[i].x > W - 6 - PR:
		x[i].x = W - 6 - PR
		touch[i] = 2
	if x[i].y < -500:
		x[i].y = -500
	if press_y > -60 and x[i].y < press_y + PR:
		var dn := press_y + PR - x[i].y
		x[i].y = press_y + PR
		touch[i] = 3
		_fric(i, dn)
	if sq_gap < 999:
		var l := W / 2.0 - sq_gap / 2.0
		var r := W / 2.0 + sq_gap / 2.0
		if x[i].x < l + PR:
			x[i].x = l + PR
			touch[i] = 2
		if x[i].x > r - PR:
			x[i].x = r - PR
			touch[i] = 2
	if _roll_on:
		var d := x[i] - _roll
		var dl := d.length()
		if dl < _roll_r:
			x[i] = _roll + d * (_roll_r / maxf(dl, 1.0))


func _tools_move(h: float) -> void:
	# hydraulic press: comes down while you hold, stops at a kid-safe minimum gap
	var min_y := FLOOR - h0 * float(M["min_press"])
	var top := INF
	for p in x:
		top = minf(top, p.y)
	if tool == &"press" and holding:
		var blocked := press_y >= min_y
		if not blocked:
			press_y = minf(min_y, press_y + (700.0 if press_y < top - 4 else 130.0) * h)
		press_moving = not blocked
	else:
		press_y = maxf(-70.0, press_y - 260.0 * h)
		press_moving = press_y > -70.0
	# squeezer paddles
	var min_gap := w0 * (0.45 if mat_id == &"jelly" else 0.32)
	if tool == &"squeeze" and holding:
		sq_gap = maxf(min_gap, (W - 12 if sq_gap > 900 else sq_gap) - 150.0 * h)
	elif sq_gap < 999:
		sq_gap += 240.0 * h
		if sq_gap > W - 12:
			sq_gap = 9999.0
	# the rolling pin chases your finger at a limited speed
	if roller["on"]:
		var d := Vector2(roller["tx"] - roller["x"], minf(FLOOR - roller["r"] - 14, roller["ty"]) - roller["y"])
		var mx := 700.0 * h
		if d.length() > mx:
			d = d.normalized() * mx
		roller["x"] += d.x
		roller["y"] += d.y
		roller["spin"] += d.x * 0.05


func _balls_step(h: float) -> void:
	for b in balls:
		b["vy"] += GRAV * h
		var vin: float = b["vy"]
		var ox: float = b["x"]
		var oy: float = b["y"]
		b["x"] += b["vx"] * h
		b["y"] += b["vy"] * h
		var r: float = b["r"]
		# ball vs squishy points: the ball is heavier than a slice of the squishy
		for i in N:
			var d := x[i] - Vector2(b["x"], b["y"])
			var dl := d.length()
			if dl < r + PR and dl > 0.0:
				var pen := r + PR - dl
				var nrm := d / dl
				x[i] += nrm * pen * 0.8
				b["x"] -= nrm.x * pen * 0.2
				b["y"] -= nrm.y * pen * 0.2
		# and it can't sink into the middle of the squishy
		if inside(x, b["x"], b["y"]):
			var away := Vector2(b["x"], b["y"]) - centroid(x)
			var al := maxf(away.length(), 1.0)
			b["x"] += away.x / al * 2.0
			b["y"] += away.y / al * 2.0 - 1.0
		b["y"] = minf(b["y"], FLOOR - r)
		b["x"] = clampf(b["x"], 6 + r, W - 6 - r)
		if press_y > -60 and b["y"] < press_y + r:
			b["y"] = press_y + r
		b["vx"] = (b["x"] - ox) / h
		b["vy"] = (b["y"] - oy) / h
		if b["y"] >= FLOOR - r - 0.01:
			if vin > 140.0:
				b["vy"] = -vin * 0.55
				if vin > 300.0:
					_sfx.append([&"boing", minf(1.0, vin / 1400.0)])
			b["vx"] *= exp(-1.5 * h)
		if (b["x"] <= 6 + r + 0.01 and b["vx"] < 0) or (b["x"] >= W - 6 - r - 0.01 and b["vx"] > 0):
			b["vx"] *= -0.6
		b["spin"] += b["vx"] * h / r


# ---------------------------------------------------------------- sounds (made, like the prototype's)

func _squelch(vol: float, kind: StringName) -> void:
	var f0 := (500.0 if kind == &"wet" else 320.0) * (0.8 + randf() * 0.5)
	tone(f0 * 1.8, 0.2, &"sine", 0.09 * vol, 0.33)
	noise(0.1, 0.05 * vol, 600.0)


func _boing(vol: float) -> void:
	tone(180, 0.3, &"sine", 0.18 * vol, 1.45)


# ---------------------------------------------------------------- tools and fingers

func pick_tool(k: StringName) -> void:
	if not tool_open(k):
		_tip = 2.5
		_tip_text = &"squish_lab.locked"
		tone(300, 0.08, &"triangle", 0.05)
		return
	if k == &"drop":
		drop()
		_tip = 2.0
		_tip_text = &"squish_lab.tip.drop"
		return
	tool = k
	_tip = 3.0
	_tip_text = StringName("squish_lab.tip." + String(k))
	holding = false
	roller["on"] = false
	tone(640, 0.05, &"sine", 0.05)


## Up it goes, and lets go.
func drop() -> void:
	if x.is_empty():
		return
	var c := centroid(x)
	var top := INF
	for p in x:
		top = minf(top, p.y)
	var dy := 130.0 - top
	for i in N:
		x[i] += Vector2(W / 2.0 - c.x, dy)
		v[i] = Vector2.ZERO
	grabs.clear()


func poke(at: Vector2) -> void:
	var c := centroid(x)
	for i in N:
		var d := x[i].distance_to(at)
		if d < 46.0:
			x[i] += (c - x[i]).normalized() * (1.0 - d / 46.0) * 20.0
	_squelch(0.6, M["squish"])
	ctx.buzz(12)


func _down(p: Vector2, id: int) -> void:
	if shelf_open:
		_shelf_tap(p)
		return
	if p.y < 52 and p.x > W - 100:
		shelf_open = true
		return
	if p.y > 548:
		for i in TOOLS.size():
			if Vector2(_tool_x(i), TY - 6).distance_to(p) < 28:
				pick_tool(TOOLS[i])
		return
	var at := to_phys(p)
	_ptrs[id] = {"x": at.x, "y": at.y, "t": t, "sx": at.x, "sy": at.y}
	if x.is_empty():
		return
	if tool == &"hand":
		grab(id, at)
	if tool == &"press" or tool == &"squeeze":
		holding = true
	if tool == &"roller":
		roller["on"] = true
		roller["tx"] = at.x
		roller["ty"] = at.y
		if not roller["placed"]:
			var top := INF
			for pt in x:
				top = minf(top, pt.y)
			roller["x"] = at.x
			roller["y"] = minf(at.y, top - roller["r"] - 8)
			roller["placed"] = true
	if tool == &"ball" and balls.size() < 4:
		balls.append({"x": clampf(at.x, 30, W - 30), "y": 110.0, "vx": 0.0, "vy": 0.0, "r": 22.0, "spin": 0.0, "life": 9.0})


## Hand: near the edge = stretch that part (the far side's feet hold on to the table); the middle = pick it up.
func grab(id: int, at: Vector2) -> void:
	var edge := INF
	for p in x:
		edge = minf(edge, p.distance_to(at))
	if not inside(x, at.x, at.y) and edge > 26.0:
		return
	var pts: Array = []
	if edge < 30.0:
		for i in N:
			var d := x[i].distance_to(at)
			if d < 52.0:
				pts.append([i, 1.0 - d / 60.0, x[i].x - at.x, x[i].y - at.y])
	else:
		for i in N:
			pts.append([i, 0.5, x[i].x - at.x, x[i].y - at.y])
	grabs.append({"id": id, "x": at.x, "y": at.y, "sx": at.x, "sy": at.y, "pts": pts, "whole": edge >= 30.0, "free": false})
	if edge < 30.0:
		var near := {}
		for pt: Array in pts:
			if pt[1] > 0.3:
				near[pt[0]] = true
		feet.clear()
		for i in N:
			if x[i].y > FLOOR - PR - 3 and not near.has(i) and x[i].distance_to(at) > 60.0:
				feet[i] = true


func _move(p: Vector2, id: int, _pressed: bool) -> void:
	if not _ptrs.has(id):
		return
	var at := to_phys(p)
	_ptrs[id]["x"] = at.x
	_ptrs[id]["y"] = at.y
	for g in grabs:
		if g["id"] == id:
			g["x"] = at.x
			g["y"] = at.y
	if tool == &"roller":
		roller["tx"] = at.x
		roller["ty"] = at.y


func _up(p: Vector2, id: int) -> void:
	var at := to_phys(p)
	var ptr: Dictionary = _ptrs.get(id, {})
	_ptrs.erase(id)
	var had := false
	for g in grabs:
		if g["id"] == id:
			had = true
	grabs.assign(grabs.filter(func(g: Dictionary) -> bool: return g["id"] != id))
	if had and not ptr.is_empty() and at.distance_to(Vector2(ptr["sx"], ptr["sy"])) < 7.0 and t - float(ptr["t"]) < 0.26:
		poke(at)
	if _ptrs.is_empty():
		holding = false
		roller["on"] = false
		roller["placed"] = false


func _key(keycode: Key, pressed: bool) -> bool:
	if keycode >= KEY_1 and keycode <= KEY_6:
		if pressed:
			pick_tool(TOOLS[keycode - KEY_1])
		return true
	if keycode == KEY_SPACE:
		if pressed and (tool == &"press" or tool == &"squeeze"):
			holding = true
		elif pressed:
			drop()
		else:
			holding = false
		return true
	if keycode == KEY_S and pressed:
		shelf_open = not shelf_open
		return true
	return false


## The shelf: tap a squishy to put it on the table.
func _shelf_tap(p: Vector2) -> void:
	for i in _shelf_ids().size():
		if _shelf_cell(i).has_point(p):
			load_squishy(_shelf_ids()[i])
			shelf_open = false
			tone(640, 0.05, &"sine", 0.05)
			return
	if Rect2(W / 2 - 70, 556, 140, 40).has_point(p) or not Rect2(14, 70, W - 28, 540).has_point(p):
		shelf_open = false


func _shelf_ids() -> Array[StringName]:
	var ids: Array[StringName] = []
	for id in ctx.squad:
		if ids.size() < 48:
			ids.append(id)
	if ids.is_empty():
		ids.append(&"bao")
	return ids


func _shelf_cell(i: int) -> Rect2:
	return Rect2(27 + (i % 6) * 52, 130 + (i / 6) * 52, 48, 48)


func _tool_x(i: int) -> float:
	return 32 + i * 59.2


func _make_result() -> MinigameResult:
	return MinigameResult.make(roundi(best * 100.0), squishes, t)


# ---------------------------------------------------------------- 3D: the lab (prototype setup3D())

## Physics -> 3D: 40 physics px = 1 unit, the table top at height 0, the squishy in the plane z = 0.
static func wx(px: float) -> float:
	return (px - W / 2.0) / U


static func wy(py: float) -> float:
	return (FLOOR - py) / U


const EYE := Vector3(0, 13.5, 20.5)
const LOOK := Vector3(0, 4.1, 0)
const FOV := 38.0


static func camera_xf() -> Transform3D:
	return Transform3D(Basis.looking_at(LOOK - EYE, Vector3.UP), EYE)


## A finger on the screen (game space) -> the point under it on the squishy's plane (physics space).
func to_phys(p: Vector2) -> Vector2:
	var th := tan(deg_to_rad(FOV / 2.0))
	var dir := camera_xf().basis * Vector3((p.x / W * 2.0 - 1.0) * th * W / H, -(p.y / H * 2.0 - 1.0) * th, -1.0)
	if absf(dir.z) < 1e-6:
		return p
	var hit := EYE + dir * (-EYE.z / dir.z)
	return Vector2(hit.x * U + W / 2.0, FLOOR - hit.y * U)


## A physics point -> where it shows on the screen (game space).
func to_screen(px: float, py: float) -> Vector2:
	var th := tan(deg_to_rad(FOV / 2.0))
	var c := camera_xf().affine_inverse() * Vector3(wx(px), wy(py), 0.0)
	if c.z > -1e-6:
		return Vector2(px, py)
	return Vector2((c.x / (-c.z * th * W / H) + 1.0) / 2.0 * W, (1.0 - c.y / (-c.z * th)) / 2.0 * H)


func _material(col: Color, tex: Texture2D = null, scale := Vector2.ONE) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = preload("res://minigames/squish_lab/lab.gdshader")
	m.set_shader_parameter(&"albedo", col)
	m.set_shader_parameter(&"softness", 1.0)
	if tex != null:
		m.set_shader_parameter(&"use_texture", true)
		m.set_shader_parameter(&"albedo_texture", tex)
		m.set_shader_parameter(&"uv_scale", scale)
	return m


func _part(mesh: Mesh, mat: Material, at: Vector3, parent: Node3D, shadows := true) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = mat
	mi.position = at
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)
	return mi


static func _box(size: Vector3) -> BoxMesh:
	var b := BoxMesh.new()
	b.size = size
	return b


static func _cyl(r: float, h: float, seg := 20) -> CylinderMesh:
	var c := CylinderMesh.new()
	c.top_radius = r
	c.bottom_radius = r
	c.height = h
	c.radial_segments = seg
	c.rings = 1
	return c


## Stripes and tiles drawn into small pictures (the prototype's canvas textures).
static func _picture(w: int, h: int, bg: Color, paint: Callable) -> ImageTexture:
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	img.fill(bg)
	paint.call(img)
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)


static func _hazard(w: int, h: int, bg: Color, step_px: int, band: int) -> ImageTexture:
	return _picture(w, h, bg, func(img: Image) -> void:
		for yy in h:
			for xx in w:
				# a slanted yellow band every step_px pixels
				if posmod(xx + int(yy * float(band) / h), step_px) < band / 2:
					img.set_pixel(xx, yy, Color("#FFD54A")))


func _build_lab() -> void:
	var vp := SubViewport.new()
	vp.own_world_3d = true
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	vp.size = Vector2i(360, 640)
	var tier := ctx.graphics() if ctx != null else &"high"
	vp.msaa_3d = Viewport.MSAA_DISABLED if tier == &"low" else Viewport.MSAA_4X
	add_child(vp)
	var view := Sprite2D.new()
	view.texture = vp.get_texture()
	view.centered = false
	view.show_behind_parent = true
	add_child(view)
	var world := Node3D.new()
	vp.add_child(world)
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#CFE0F3")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_DISABLED
	env.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	var we := WorldEnvironment.new()
	we.environment = env
	world.add_child(we)
	var cam := Camera3D.new()
	cam.transform = camera_xf()
	cam.near = 0.1
	cam.far = 120.0
	cam.projection = Camera3D.PROJECTION_FRUSTUM
	cam.keep_aspect = Camera3D.KEEP_HEIGHT
	world.add_child(cam)
	var sun := DirectionalLight3D.new()
	var sc := Color("#FFF6E8")
	sun.light_color = Color(sc.r * 0.62, sc.g * 0.62, sc.b * 0.62)
	sun.shadow_enabled = tier != &"low"
	sun.shadow_bias = 0.03
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
	sun.directional_shadow_max_distance = 40.0
	sun.basis = Basis.looking_at(-Vector3(-6, 14, 10).normalized(), Vector3.UP)
	world.add_child(sun)
	# the lab room: tiled wall and floor
	var tile := _picture(256, 256, Color("#EAF3FD"), func(img: Image) -> void:
		for i in range(0, 257, 64):
			img.fill_rect(Rect2i(clampi(i - 2, 0, 251), 0, 5, 256), Color("#C3D5EC"))
			img.fill_rect(Rect2i(0, clampi(i - 2, 0, 251), 256, 5), Color("#C3D5EC")))
	var wall_mesh := QuadMesh.new()
	wall_mesh.size = Vector2(44, 30)
	_part(wall_mesh, _material(Color.WHITE, tile, Vector2(10, 7)), Vector3(0, 11, -5.5), world, false)
	var floor_mesh := PlaneMesh.new()
	floor_mesh.size = Vector2(70, 50)
	_part(floor_mesh, _material(Color("#C2CFE0")), Vector3(0, -3.2, 0), world, false)
	# height marks for drop tests (1 m to 4 m)
	for k in range(1, 5):
		var y := wy(FLOOR - k * 100)
		_part(_box(Vector3(1.3, 0.08, 0.05)), _material(Color("#8EA4C2")), Vector3(-4.4, y, -5.45), world, false)
		var lab := Label3D.new()
		lab.text = ctx.t(&"squish_lab.metres", {"n": k}) if ctx != null else "%d m" % k
		lab.font = ctx.font(&"body") if ctx != null else null
		lab.font_size = 40
		lab.pixel_size = 0.01
		lab.modulate = Color("#5A78A0")
		lab.outline_size = 0
		lab.shaded = false
		lab.position = Vector3(-4.4, y + 0.35, -5.4)
		world.add_child(lab)
	# the test table with a hazard stripe along the front
	_part(_box(Vector3(10.6, 0.8, 6.6)), _material(Color("#8FA6C8")), Vector3(0, -0.4, 0), world)
	var stripe_mesh := QuadMesh.new()
	stripe_mesh.size = Vector2(10.6, 0.8)
	_part(stripe_mesh, _material(Color.WHITE, _hazard(256, 32, Color("#3A3A48"), 32, 32), Vector2(5, 1)), Vector3(0, -0.4, 3.302), world, false)
	for leg: Vector2 in [Vector2(-4.6, 2.6), Vector2(4.6, 2.6), Vector2(-4.6, -2.6), Vector2(4.6, -2.6)]:
		_part(_cyl(0.18, 2.4), _material(Color("#8EA4C2")), Vector3(leg.x, -2, leg.y), world)
	# the hydraulic press: a heavy plate on two shiny pistons
	var metal := _material(Color("#5B6B85"))
	var chrome := _material(Color("#D6DEE9"))
	var press := Node3D.new()
	world.add_child(press)
	var plate := Node3D.new()
	press.add_child(plate)
	_part(_box(Vector3(8.8, 1, 2)), metal, Vector3.ZERO, plate)
	var pstripe := QuadMesh.new()
	pstripe.size = Vector2(8.8, 1)
	_part(pstripe, _material(Color.WHITE, _hazard(256, 32, Color("#5B6B85"), 28, 24), Vector2(3, 1)), Vector3(0, 0, 1.002), plate, false)
	var rods: Array = []
	for rx_: float in [-3.1, 3.1]:
		var rod := _part(_cyl(0.2, 1.0), chrome, Vector3(rx_, 0, 0), press)
		var sleeve := _part(_cyl(0.38, 4.0), metal, Vector3(rx_, 0, 0), press)
		rods.append([rod, sleeve])
	# the rolling pin (its round end is what the physics sees)
	var wood := _material(Color("#E9C994"))
	var handle := _material(Color("#B9824F"))
	var pin := Node3D.new()
	world.add_child(pin)
	var barrel := _part(_cyl(24.0 / U, 3.8, 28), wood, Vector3.ZERO, pin)
	barrel.rotation.x = PI / 2.0
	for k: float in [-1.0, 1.0]:
		var hd := _part(_cyl(0.13, 1.1, 12), handle, Vector3(0, 0, k * 2.45), pin)
		hd.rotation.x = PI / 2.0
		var knob := SphereMesh.new()
		knob.radius = 0.2
		knob.height = 0.4
		_part(knob, handle, Vector3(0, 0, k * 3.05), pin)
	# squeeze paddles on arms
	var yellow := _material(Color("#FFC93C"))
	var paddles: Array[Node3D] = []
	for k: float in [-1.0, 1.0]:
		var g := Node3D.new()
		world.add_child(g)
		_part(_box(Vector3(0.5, 4.7, 2.2)), yellow, Vector3(0, 2.35, 0), g)
		var arm := _part(_cyl(0.18, 8.0), chrome, Vector3(k * 4.2, 2.5, 0), g)
		arm.rotation.z = PI / 2.0
		paddles.append(g)
	# rubber balls
	var ball_tex := _picture(128, 64, Color("#FF6F7D"), func(img: Image) -> void:
		img.fill_rect(Rect2i(0, 26, 128, 12), Color.WHITE)
		img.fill_rect(Rect2i(58, 0, 12, 64), Color.WHITE))
	var ball_meshes: Array[MeshInstance3D] = []
	for i in 4:
		var s := SphereMesh.new()
		s.radius = 22.0 / U
		s.height = 44.0 / U
		ball_meshes.append(_part(s, _material(Color.WHITE, ball_tex), Vector3.ZERO, world))
	_art = {"vp": vp, "view": view, "world": world, "cam": cam, "press": press, "plate": plate, "rods": rods, "pin": pin,
		"paddles": paddles, "balls": ball_meshes, "body": [], "mats": []}


## The model's meshes with their place inside the model: [{"node", "xf"}].
static func _meshes(model: Node3D) -> Array[Dictionary]:
	var out: Array[Dictionary] = []
	var stack: Array[Node] = [model]
	while not stack.is_empty():
		var n: Node = stack.pop_back()
		stack.append_array(n.get_children())
		if n is MeshInstance3D and (n as MeshInstance3D).mesh != null:
			var xf := (n as Node3D).transform
			var p := n.get_parent()
			while p != null and p != model.get_parent():
				if p is Node3D:
					xf = (p as Node3D).transform * xf
				if p == model:
					break
				p = p.get_parent()
			out.append({"node": n, "xf": xf})
	return out


func _clear_model() -> void:
	if _art.is_empty():
		return
	for n: Node in _art["body"]:
		n.queue_free()
	_art["body"] = []
	_art["mats"] = []


## Copy the model's meshes into the Lab, each point stored in the relaxed pose around the ring's middle (3D units)
## with its ring sector in UV2.x, and give them the Lab's bending materials (same colours as the island's).
func _bind_model(model: Node3D, rc: Vector2, sc: float) -> void:
	_clear_model()
	if _art.is_empty():
		model.free()
		return
	var s := sc / U
	# the rest outline in 3D (y up) and each sector's direction test
	var rest := PackedVector2Array()
	for p in _rest_pts:
		rest.append(Vector2(p.x / U, -p.y / U))
	var turn := signf(rest[0].cross(rest[1]))
	var nodes: Array[Node] = []
	var mats: Array[ShaderMaterial] = []
	for mi in _meshes(model):
		var node: MeshInstance3D = mi["node"]
		var xf: Transform3D = mi["xf"]
		var src: Mesh = node.mesh
		var out := ArrayMesh.new()
		for si in src.get_surface_count():
			var arrays := src.surface_get_arrays(si)
			var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
			var normals: PackedVector3Array = arrays[Mesh.ARRAY_NORMAL] if arrays[Mesh.ARRAY_NORMAL] != null else PackedVector3Array()
			var cols: PackedColorArray = arrays[Mesh.ARRAY_COLOR] if arrays[Mesh.ARRAY_COLOR] != null else PackedColorArray()
			var uv2 := PackedVector2Array()
			uv2.resize(verts.size())
			for i in verts.size():
				var w := xf * verts[i]
				var p := Vector3((w.x - rc.x) * s, (w.y + rc.y) * s, w.z * s)
				verts[i] = p
				uv2[i] = Vector2(_sector(rest, turn, Vector2(p.x, p.y)), 0)
				if i < normals.size():
					normals[i] = (xf.basis * normals[i]).normalized()
				if i < cols.size() and cols[i].a > 0.5:
					var sn := (xf.basis * Vector3(cols[i].r * 2 - 1, cols[i].g * 2 - 1, cols[i].b * 2 - 1)).normalized()
					cols[i] = Color(sn.x * 0.5 + 0.5, sn.y * 0.5 + 0.5, sn.z * 0.5 + 0.5, 1.0)
			arrays[Mesh.ARRAY_VERTEX] = verts
			if not normals.is_empty():
				arrays[Mesh.ARRAY_NORMAL] = normals
			if not cols.is_empty():
				arrays[Mesh.ARRAY_COLOR] = cols
			arrays[Mesh.ARRAY_TEX_UV2] = uv2
			arrays[Mesh.ARRAY_TANGENT] = null
			out.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
			var old := node.get_active_material(si)
			var m := _material(Color.WHITE)
			m.set_shader_parameter(&"deform", true)
			if old is ShaderMaterial:
				for key: StringName in [&"albedo", &"albedo_texture", &"use_texture", &"uv_scale", &"uv_offset", &"emission", &"emission_energy", &"softness"]:
					var val: Variant = (old as ShaderMaterial).get_shader_parameter(key)
					if val != null:
						m.set_shader_parameter(key, val)
				if old.next_pass != null:
					var line := ShaderMaterial.new()
					line.shader = preload("res://minigames/squish_lab/lab_outline.gdshader")
					m.next_pass = line
					mats.append(line)
			mats.append(m)
			out.surface_set_material(si, m)
		var copy := MeshInstance3D.new()
		copy.mesh = out
		copy.custom_aabb = AABB(Vector3(-30, -20, -20), Vector3(60, 60, 40))
		(_art["world"] as Node3D).add_child(copy)
		nodes.append(copy)
	model.free()
	_art["body"] = nodes
	_art["mats"] = mats


## Which slice of the ring (centre, point i, point i+1) a point of the model sits in.
static func _sector(rest: PackedVector2Array, turn: float, p: Vector2) -> int:
	var best_i := 0
	var best_a := INF
	for i in N:
		var a := rest[i]
		var b := rest[(i + 1) % N]
		if turn * a.cross(p) >= 0.0 and turn * p.cross(b) >= 0.0:
			return i
		var off := absf(angle_difference(p.angle(), (a + b).angle()))
		if off < best_a:
			best_a = off
			best_i = i
	return best_i


## Every frame: the press, pin, paddles and balls where the physics has them, and the squishy's bend.
func _sync_3d() -> void:
	if _art.is_empty():
		return
	var vp: SubViewport = _art["vp"]
	var view: Sprite2D = _art["view"]
	var px := maxf(1.0, get_global_transform_with_canvas().get_scale().x)
	var want := Vector2i(maxi(2, roundi(view_rect.size.x * px)), maxi(2, roundi(view_rect.size.y * px)))
	if vp.size != want:
		vp.size = want
	view.position = view_rect.position
	view.scale = Vector2(view_rect.size.x / want.x, view_rect.size.y / want.y)
	# the camera sees the 360 x 640 game like the prototype's, and more of the room around it on taller screens
	var cam: Camera3D = _art["cam"]
	var k := 2.0 * cam.near * tan(deg_to_rad(FOV / 2.0)) / H
	cam.size = view_rect.size.y * k
	var mid := view_rect.get_center()
	cam.frustum_offset = Vector2((mid.x - W / 2.0) * k, -(mid.y - H / 2.0) * k)
	var press: Node3D = _art["press"]
	var py := wy(press_y)
	press.visible = press_y > -69
	if press.visible:
		(_art["plate"] as Node3D).position = Vector3(0, py + 0.5, 0)
		for pair: Array in _art["rods"]:
			var rod: MeshInstance3D = pair[0]
			var sleeve: MeshInstance3D = pair[1]
			var len := maxf(0.1, 15.0 - (py + 1.0))
			rod.scale = Vector3(1, len, 1)
			rod.position.y = py + 1.0 + len / 2.0
			sleeve.position.y = 13.5
	var paddles: Array[Node3D] = []
	paddles.assign(_art["paddles"])
	for i in 2:
		paddles[i].visible = sq_gap < 999
		paddles[i].position = Vector3((1.0 if i else -1.0) * (sq_gap / 2.0 / U + 0.25), 0, 0)
	var pin: Node3D = _art["pin"]
	pin.visible = roller["on"]
	pin.position = Vector3(wx(roller["x"]), wy(roller["y"]), 0)
	pin.rotation.z = -float(roller["spin"])
	var bms: Array[MeshInstance3D] = []
	bms.assign(_art["balls"])
	for i in bms.size():
		bms[i].visible = i < balls.size()
		if i < balls.size():
			var b: Dictionary = balls[i]
			bms[i].position = Vector3(wx(b["x"]), wy(b["y"]), 0)
			bms[i].rotation.z = -float(b["spin"])
			bms[i].scale = Vector3.ONE * clampf(b["life"], 0.01, 1.0)
	if (_art["mats"] as Array).is_empty() or x.is_empty():
		return
	# the bend: one matrix per ring slice mapping the relaxed slice (centre, i, i+1) onto where it is now
	var c := centroid(x)
	var c3 := Vector2(wx(c.x), wy(c.y))
	var aff := PackedVector4Array()
	var nrm := PackedVector4Array()
	aff.resize(N)
	nrm.resize(N)
	for i in N:
		var j := (i + 1) % N
		var r := Transform2D(Vector2(_rest_pts[i].x, -_rest_pts[i].y) / U, Vector2(_rest_pts[j].x, -_rest_pts[j].y) / U, Vector2.ZERO)
		var now := Transform2D(Vector2(wx(x[i].x), wy(x[i].y)) - c3, Vector2(wx(x[j].x), wy(x[j].y)) - c3, Vector2.ZERO)
		var a := now * r.affine_inverse()
		if absf(r.determinant()) < 1e-8:
			a = Transform2D.IDENTITY
		var ni := a.affine_inverse()
		aff[i] = Vector4(a.x.x, a.x.y, a.y.x, a.y.y)
		# normals use the inverse transpose
		nrm[i] = Vector4(ni.x.x, ni.y.x, ni.x.y, ni.y.y)
	var size := _extent(x)
	var squash := sqrt(absf(A0) / maxf(absf(area(x)), 1.0)) * (1.0 + 0.55 * maxf(0.0, 1.0 - size.y / h0))
	var puff := clampf(squash, 0.8, 2.0)
	for m: ShaderMaterial in _art["mats"]:
		m.set_shader_parameter(&"aff", aff)
		m.set_shader_parameter(&"nrm", nrm)
		m.set_shader_parameter(&"centre", c3)
		m.set_shader_parameter(&"puff", puff)
		if m.shader.resource_path.ends_with("lab_outline.gdshader"):
			m.set_shader_parameter(&"width_px", 1.6 * px)


# ---------------------------------------------------------------- drawing (the buttons and meters on top)

func advance(delta: float) -> void:
	super(delta)
	_sync_3d()


func _draw_game() -> void:
	if (_art.get("mats", []) as Array).is_empty() and not x.is_empty():
		# no 3D model (harness, tests): the outline, seen through the lab's camera
		var pts := PackedVector2Array()
		for p in x:
			pts.append(to_screen(p.x, p.y))
		poly(pts, Color("#FFD9E6"), INK, 2.5)
		var c := centroid(x)
		var at := to_screen(c.x, c.y + h0 * 0.3)
		sprite(body_id, at.x, at.y, 70)
	# fingers
	for g in grabs:
		var at := to_screen(g["x"], g["y"])
		circle(at.x, at.y, 13, Color(1, 1, 1, 0.75), INK, 2.5)
		circle(at.x, at.y, 4, Color("#FF6FA3"), null, 0)
	# the bar at the top: squish-o-meter, best, squishes, swap
	hud(Color("#4A7BD0"))
	rr(10, 10, 168, 32, 16, Color.WHITE)
	text(ctx.t(&"squish_lab.meter"), 52, 26, 9, Color("#6E6688"), &"center", &"body")
	bar(92, 18, 80, 16, meter, Color("#FF6FA3") if meter > 0.7 else (Color("#FFC93C") if meter > 0.4 else Color("#4FCFA0")))
	text("%d%%" % roundi(meter * 100), 132, 26, 10, INK, &"center", &"body")
	text(ctx.t(&"squish_lab.best", {"n": roundi(best * 100)}), 214, 20, 11, Color.WHITE, &"center", &"body")
	text(ctx.t(&"squish_lab.count", {"n": squishes}), 214, 34, 11, Color("#FFF3B0"), &"center", &"body")
	rr(W - 98, 7, 90, 38, 19, Color.WHITE)
	sprite(body_id, W - 78, 42, 34)
	text(ctx.t(&"squish_lab.swap"), W - 40, 26, 12, INK, &"center", &"body")
	rr(10, 60, 190, 26, 13, Color(1, 1, 1, 0.85), null, 0)
	text(ctx.t(StringName("squish_lab.mat." + String(mat_id))), 105, 73, 11, Color("#4A7BD0"), &"center", &"body")
	if _tip > 0.0:
		var lines := ctx.t(_tip_text, {"n": _locked_level()}).split("|")
		for k in lines.size():
			text(lines[k], W / 2, 104 + k * 17, 12.5, Color("#4A7BD0", minf(1.0, _tip)), &"center", &"body")
	# the toolbar
	rr(6, 546, W - 12, 88, 18, Color.WHITE)
	for i in TOOLS.size():
		var k := TOOLS[i]
		var tx := _tool_x(i)
		var on := tool == k
		var open := tool_open(k)
		circle(tx, TY - 6, 23, Color("#FFF3B0") if on else Color("#F2F6FC"), INK if on else Color("#C9D3E2"), 3.0 if on else 2.0)
		_tool_icon(k, tx, TY - 6, 1.0 if open else 0.35)
		if open:
			text(ctx.t(StringName("squish_lab.tool." + String(k))), tx, TY + 28, 10.5, INK if on else Color("#6E7C92"), &"center", &"body")
		else:
			text(ctx.t(&"squish_lab.level_n", {"n": TOOL_LEVEL[k]}), tx, TY + 28, 9.5, Color("#9AA8BC"), &"center", &"body")
	if shelf_open:
		_draw_shelf()


func _locked_level() -> int:
	for k: StringName in TOOLS:
		if not tool_open(k):
			return TOOL_LEVEL[k]
	return 1


func _draw_shelf() -> void:
	rect(view_rect.position.x, view_rect.position.y, view_rect.size.x, view_rect.size.y, Color(0.16, 0.12, 0.24, 0.45))
	rr(14, 70, W - 28, 540, 22, Color.WHITE)
	text(ctx.t(&"squish_lab.pick"), W / 2, 100, 20, INK)
	var ids := _shelf_ids()
	for i in ids.size():
		var r := _shelf_cell(i)
		rr(r.position.x, r.position.y, r.size.x, r.size.y, 12, Color("#FFF3B0") if ids[i] == body_id else Color("#F2F6FC"), Color("#C9D3E2"), 1.5)
		sprite(ids[i], r.get_center().x, r.end.y - 3, 42)
	rr(W / 2 - 70, 556, 140, 40, 20, Color("#F2F6FC"), INK, 2)
	text(ctx.t(&"squish_lab.close"), W / 2, 576, 14, INK, &"center", &"body")


func _tool_icon(k: StringName, cx: float, cy: float, a: float) -> void:
	var ink := Color(INK, a)
	var fill := func(c: String) -> Color: return Color(c, a)
	push(Vector2(cx, cy))
	match k:
		&"hand":
			var pts := PackedVector2Array([Vector2(-8, 10), Vector2(-10, -2)])
			pts.append_array(quad(Vector2(-10, -2), Vector2(-11, -6), Vector2(-7, -5), 4))
			pts.append(Vector2(-6, -11))
			pts.append_array(quad(Vector2(-6, -11), Vector2(-5, -14), Vector2(-2, -12), 4))
			pts.append(Vector2(0, -14))
			pts.append_array(quad(Vector2(0, -14), Vector2(3, -15), Vector2(4, -12), 4))
			pts.append(Vector2(6, -11))
			pts.append_array(quad(Vector2(6, -11), Vector2(9, -11), Vector2(9, -7), 4))
			pts.append(Vector2(9, 4))
			pts.append_array(quad(Vector2(9, 4), Vector2(8, 11), Vector2(2, 12), 4))
			poly(pts, fill.call("#FFD9B8"), ink, 2.2)
		&"press":
			rr(-13, -12, 26, 8, 2, fill.call("#5B6B85"), ink, 2)
			rect(-11, -16, 4, 4, fill.call("#9AA8BC"))
			rect(7, -16, 4, 4, fill.call("#9AA8BC"))
			ellipse(0, 8, 12, 4, fill.call("#FF8FB8"), ink, 2.2)
		&"roller":
			rr(-15, -3, 6, 6, 3, fill.call("#C98A55"), ink, 1.6)
			rr(9, -3, 6, 6, 3, fill.call("#C98A55"), ink, 1.6)
			rr(-10, -6, 20, 12, 6, fill.call("#F2D7A8"), ink, 2)
		&"squeeze":
			rr(-15, -10, 6, 20, 2, fill.call("#FFC93C"), ink, 1.8)
			rr(9, -10, 6, 20, 2, fill.call("#FFC93C"), ink, 1.8)
			ellipse(0, 0, 8, 10, fill.call("#8CCBFF"), ink, 2.2)
		&"ball":
			circle(0, 0, 10, fill.call("#FF6F7D"), ink, 2)
			poly(PackedVector2Array([Vector2.ZERO, Vector2(10 * cos(-0.4), 10 * sin(-0.4)), Vector2(10, 0), Vector2(10 * cos(0.4), 10 * sin(0.4))]), Color(1, 1, 1, a), null, 0)
		&"drop":
			line(PackedVector2Array([Vector2(0, -13), Vector2(0, 6)]), ink, 2.6)
			line(PackedVector2Array([Vector2(-6, 0), Vector2(0, 7), Vector2(6, 0)]), ink, 2.6)
			ellipse(0, 11, 10, 3, fill.call("#FF8FB8"), ink, 2.2)
	pop()
