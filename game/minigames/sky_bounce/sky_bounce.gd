extends KitGame
## SKY BOUNCE (Bounce Park): endless jumper. Bounce from cloud to cloud and climb as high as you can. It gets
## harder the higher you go: bigger gaps, moving leaves, crumbly clouds. Ported from prototypes/games/sky-bounce.js.
## Score = metres high; metric = coins grabbed (the coins you keep).

const SKY := [[0.0, "#DFF3FF", "#8CCBFF"], [2500.0, "#FFE3EE", "#FFB3CE"], [6000.0, "#FFD9A8", "#B9A6FF"], [11000.0, "#5B4BA8", "#2E2452"]]
const CLOUD_PUFFS := [[-0.6, 0.1, 0.55], [-0.2, -0.25, 0.7], [0.3, -0.2, 0.65], [0.68, 0.1, 0.5], [0.0, 0.2, 0.6]]

var rng := RandomNumberGenerator.new()
## Pin the random numbers (tests); -1 = different every run.
var seed_value := -1

var x := W / 2.0
var y := -40.0
var vy := -700.0
var plats: Array[Dictionary] = []
var items: Array[Dictionary] = []
var cam_y := -H + 120.0
var top := 0.0
var coins := 0
var target := -1.0
var keys := {"l": false, "r": false}
var floating := 0.0
var squash := 0.0
var face := 1.0


func _init_run(_level: int) -> void:
	if seed_value >= 0:
		rng.seed = seed_value
	else:
		rng.randomize()
	x = W / 2.0
	y = -40.0
	vy = -700.0
	plats.clear()
	items.clear()
	cam_y = -H + 120.0
	top = 0.0
	coins = 0
	target = -1.0
	keys = {"l": false, "r": false}
	floating = 2.4 if ctx != null and ctx.perk(&"start_balloon") > 0.0 else 0.0
	squash = 0.0
	face = 1.0
	plats.append({"x": W / 2.0, "y": 0.0, "w": 120.0, "type": "cloud", "vx": 0.0, "dead": 0.0, "spring": false})
	var py := 0.0
	while py > -H * 1.6:
		py -= _gap_at(-py) * (0.7 + rng.randf() * 0.5)
		_add_plat(py)


func _gap_at(h: float) -> float:
	return 62.0 + minf(95.0, h / 110.0)


func _add_plat(py: float) -> void:
	var h := -py
	var diff := minf(1.0, h / 12000.0)
	var r := rng.randf()
	var w := 70.0 - diff * 18.0
	var kind := "cloud"
	if h > 600 and r < 0.12 + diff * 0.2:
		kind = "crumble"
	elif h > 300 and r < 0.32 + diff * 0.3:
		kind = "leaf"
	var vx := 0.0
	if kind == "leaf" and h > 1200:
		vx = (-1.0 if rng.randf() < 0.5 else 1.0) * (40.0 + diff * 90.0)
	var p := {"x": 30.0 + rng.randf() * (W - 60.0), "y": py, "w": w, "type": kind, "vx": vx, "dead": 0.0, "spring": false}
	if kind != "crumble" and rng.randf() < 0.08:
		p["spring"] = true
	plats.append(p)
	if rng.randf() < 0.55:
		items.append({"k": "coin", "x": p["x"] + (rng.randf() - 0.5) * 40.0, "y": py - 40.0 - rng.randf() * 30.0})
	elif h > 800 and rng.randf() < 0.035:
		items.append({"k": "balloon", "x": p["x"], "y": py - 60.0})


func can_revive() -> bool:
	return true


func revive() -> void:
	x = W / 2.0
	y = cam_y + H - 140.0
	vy = -900.0
	floating = 1.8
	float_text(Vector2(W / 2.0, H / 2.0), ctx.t(&"sky_bounce.up_you_go"), Color("#FFD54A"), 26)


func _update(dt: float) -> void:
	# steering
	var ax := 0.0
	if keys["l"]:
		ax -= 1.0
	if keys["r"]:
		ax += 1.0
	if target >= 0.0:
		ax = clampf((target - x) / 40.0, -1.0, 1.0)
	x += ax * 330.0 * dt
	if ax != 0.0:
		face = 1.0 if ax > 0.0 else -1.0
	if x < -20.0:
		x += W + 40.0
	if x > W + 20.0:
		x -= W + 40.0
	# physics (Sky Puffs fall more slowly, Sugar Squad bounce higher)
	if floating > 0.0:
		floating -= dt
		vy = -520.0
	else:
		var g := 1500.0 * ((1.0 - ctx.perk(&"fall_slower")) if vy > 0.0 else 1.0)
		vy += g * dt
	var prev_y := y
	y += vy * dt
	squash = maxf(0.0, squash - dt * 4.0)
	var lift := sqrt(1.0 + ctx.perk(&"bounce_higher"))
	if vy > 0.0:
		for p in plats:
			if p["dead"] > 0.0:
				continue
			if prev_y <= p["y"] - 2.0 and y >= p["y"] - 2.0 and absf(x - p["x"]) < p["w"] / 2.0 + 14.0:
				y = p["y"] - 2.0
				squash = 1.0
				if p["spring"] and absf(x - p["x"]) < 22.0:
					vy = -1180.0 * lift
					tone(500, 0.25, &"sine", 0.1, 3)
					burst(Vector2(x, p["y"] - cam_y), Color("#FF6F7D"), 8)
				else:
					vy = -760.0 * lift
					tone(420 + rng.randf() * 80, 0.09, &"sine", 0.08, 1.6)
				if p["type"] == "crumble":
					p["dead"] = 0.01
					noise(0.12, 0.07, 1200)
				break
	for p in plats:
		if p["vx"] != 0.0:
			p["x"] += p["vx"] * dt
			if p["x"] < p["w"] / 2.0 or p["x"] > W - p["w"] / 2.0:
				p["vx"] *= -1.0
		if p["dead"] > 0.0:
			p["dead"] += dt
	# items
	for it in items:
		if it.get("got", false):
			continue
		if Vector2(it["x"] - x, it["y"] - (y - 26.0)).length() < 30.0:
			it["got"] = true
			if it["k"] == "coin":
				coins += 1
				tone(1400, 0.07, &"square", 0.05, 1.4)
				float_text(Vector2(it["x"], it["y"] - cam_y - 10.0), "+1", Color("#FFD54A"), 15)
			else:
				floating = 2.4
				tone(700, 0.4, &"sine", 0.1, 2)
	# camera + score
	top = maxf(top, -y)
	var want := y - H * 0.42
	if want < cam_y:
		cam_y += (want - cam_y) * minf(1.0, dt * 8.0)
	raise_score(floori(top / 10.0))
	# make clouds ahead, forget the ones far below
	var highest := INF
	for p in plats:
		highest = minf(highest, p["y"])
	while highest > cam_y - 200.0:
		highest -= _gap_at(-highest) * (0.7 + rng.randf() * 0.5)
		_add_plat(highest)
	plats = plats.filter(func(p: Dictionary) -> bool: return p["y"] < cam_y + H + 60.0 and p["dead"] < 1.0)
	items = items.filter(func(i: Dictionary) -> bool: return not i.get("got", false) and i["y"] < cam_y + H + 60.0)
	if y > cam_y + H + 40.0:
		end()


func _make_result() -> MinigameResult:
	return MinigameResult.make(score, coins, t)


# ---------------------------------------------------------------- drawing

func _sky_at(h: float) -> Array[Color]:
	for i in range(SKY.size() - 1, -1, -1):
		if h >= SKY[i][0]:
			if i + 1 >= SKY.size():
				return [Color(SKY[i][1]), Color(SKY[i][2])]
			var n: Array = SKY[i + 1]
			var u := minf(1.0, (h - SKY[i][0]) / (n[0] - SKY[i][0]))
			return [Color(SKY[i][1]).lerp(Color(n[1]), u), Color(SKY[i][2]).lerp(Color(n[2]), u)]
	return [Color(SKY[0][1]), Color(SKY[0][2])]


func _draw_game() -> void:
	var h := top
	var sky := _sky_at(h)
	vgradient(Rect2(0, 0, W, H), sky[1], sky[0])
	if h > 8000.0:
		for i in 40:
			var sx := float((i * 97) % int(W))
			var sy := fposmod(i * 173 - cam_y * 0.2, H)
			var a := minf(1.0, (h - 8000.0) / 3000.0) * (0.4 + 0.6 * absf(sin(t * 2.0 + i)))
			draw_rect(Rect2(sx, sy, 2.5, 2.5), Color("#FFF3B0", a))
	# far clouds (parallax)
	for i in 6:
		var fy := fposmod(i * 140 - cam_y * 0.3, H + 120.0) - 60.0
		_cloud(float((i * 131) % int(W)), fy, 34.0, Color(1, 1, 1, 0.5), -1)
	var oy := -cam_y
	if cam_y > -H:
		draw_rect(Rect2(0, oy + 10.0, W, 400.0), Color("#9ED67E"))
	for p in plats:
		var py: float = p["y"] + oy
		if py < -30.0 or py > H + 30.0:
			continue
		var alpha := 1.0
		var drop := 0.0
		if p["dead"] > 0.0:
			alpha = maxf(0.0, 1.0 - p["dead"] * 2.0)
			drop = p["dead"] * 120.0
		py += drop
		var px: float = p["x"]
		var pw: float = p["w"]
		if p["type"] == "leaf":
			ellipse(px, py + 4.0, pw / 2.0, 9.0, Color("#7ED36A", alpha), Color(INK, alpha), 2.5)
			line(PackedVector2Array([Vector2(px - pw / 2.0 + 8.0, py + 4.0), Vector2(px + pw / 2.0 - 8.0, py + 4.0)]), Color("#4E9B4E", alpha), 1.5)
		else:
			_cloud(px, py + 6.0, pw / 2.0, Color("#E3DEEF", alpha) if p["type"] == "crumble" else Color(1, 1, 1, alpha), 1 if p["type"] == "crumble" else 0, alpha)
		if p["spring"]:
			line(PackedVector2Array([Vector2(px - 6, py - 2), Vector2(px + 6, py - 6), Vector2(px - 6, py - 10), Vector2(px + 6, py - 14)]), Color("#9A8FAA", alpha), 2.5)
			rr(px - 12.0, py - 20.0, 24, 7, 3.5, Color("#FF6F7D", alpha), Color(INK, alpha))
	for it in items:
		var iy: float = it["y"] + oy + sin(t * 3.0 + it["x"]) * 3.0
		var ix: float = it["x"]
		if it["k"] == "coin":
			coin(ix, iy, 8)
		else:
			line(quad(Vector2(ix, iy + 16), Vector2(ix - 6, iy + 28), Vector2(ix, iy + 38)), Color("#9A8FAA"), 1.5)
			ellipse(ix, iy, 13, 16, Color("#FF6FA3"))
	# the player
	var py2 := y + oy
	if floating > 0.0:
		line(PackedVector2Array([Vector2(x, py2 - 52), Vector2(x + 4, py2 - 80)]), Color("#9A8FAA"), 1.5)
		ellipse(x + 4, py2 - 96, 14, 18, Color("#FF6FA3"))
	var who: StringName = ctx.squad[0] if not ctx.squad.is_empty() else &"marshmallow"
	var stretch := 0.08 if vy < -300.0 else 0.0
	sprite(who, x, py2, 64, {"sx": 1.0 + squash * 0.22 - stretch, "sy": 1.0 - squash * 0.22 + (0.1 if vy < -300.0 else 0.0), "flip": face < 0.0})
	if target >= 0.0:
		circle(target, H - 30.0, 14, Color(1, 1, 1, 0.35), Color(INK, 0.35), 2)
	# score and coins
	rr(10, 12, 132, 30, 15, Color.WHITE)
	text("%s m" % fmt(score), 76, 28, 16, INK, &"center", &"body")
	rr(W - 92, 12, 82, 30, 15, Color.WHITE)
	coin(W - 74, 27, 8)
	text(str(coins), W - 46, 28, 15, INK, &"center", &"body")
	# the dashed line at your best height
	if ctx.best > 0 and top / 10.0 < ctx.best:
		var by := -ctx.best * 10.0 + oy
		if by > 50.0 and by < H:
			draw_dashed_line(Vector2(0, by), Vector2(W, by), Color("#FF6FA3"), 2.0, 8.0)
			text(ctx.t(&"sky_bounce.your_best"), W - 50, by - 10, 11, Color("#FF6FA3"), &"center", &"body")


## A puffy cloud of five circles. outline: -1 none, 0 plum outline, 1 outline + cracks (crumbly).
func _cloud(cx: float, cy: float, r: float, col: Color, outline: int, alpha := 1.0) -> void:
	if outline >= 0:
		for p: Array in CLOUD_PUFFS:
			draw_circle(Vector2(cx + p[0] * r, cy + p[1] * r * 0.6), p[2] * r * 0.6 + 1.2, Color(INK, alpha), true, -1.0, true)
		for p: Array in CLOUD_PUFFS:
			draw_circle(Vector2(cx + p[0] * r, cy + p[1] * r * 0.6), p[2] * r * 0.6 - 1.4, col, true, -1.0, true)
	else:
		for p: Array in CLOUD_PUFFS:
			draw_circle(Vector2(cx + p[0] * r, cy + p[1] * r * 0.6), p[2] * r * 0.6, col, true, -1.0, true)
	if outline == 1:
		var c := Color("#9A8FAA", alpha)
		line(PackedVector2Array([Vector2(cx - 6, cy - 8), Vector2(cx, cy), Vector2(cx - 4, cy + 6)]), c, 2.0)
		line(PackedVector2Array([Vector2(cx + 10, cy - 6), Vector2(cx + 6, cy + 2)]), c, 2.0)


# ---------------------------------------------------------------- controls

func _down(p: Vector2, _id: int) -> void:
	target = p.x


func _move(p: Vector2, _id: int, pressed: bool) -> void:
	if pressed and target >= 0.0:
		target = p.x


func _up(_p: Vector2, _id: int) -> void:
	target = -1.0


func _key(keycode: Key, pressed: bool) -> bool:
	if keycode == KEY_LEFT or keycode == KEY_A:
		keys["l"] = pressed
	elif keycode == KEY_RIGHT or keycode == KEY_D:
		keys["r"] = pressed
	else:
		return false
	return true
