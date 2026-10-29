class_name CityView
extends RefCounted
## Where the map camera is and how it may move: the rules of the book's map engine (art/city3d.js, "camera").
## The camera looks at a point on the ground (x, z) from `dist` away; it tilts down as you zoom out, and past
## dref keeps tilting toward a bird's-eye overview. You can pan less far as you zoom out, so the island stays
## on screen. Pure maths, so it is tested without a screen.

var x := 0.0
var z := 0.0
var dist := 190.0
var yaw := -0.35
## Half the island size (how far you may pan when zoomed in).
var lim_x := 178.0
var lim_z := 135.0
var dmin := 34.0
## The zoom where the "normal" tilt ends (CITY.maxZoom).
var dref := 270.0
## Furthest zoom: just far enough to see the whole island (set by the screen from its shape).
var dmax := 900.0

var _fly := {}
var _vel := Vector2.ZERO


static func from_city(city: Dictionary) -> CityView:
	var v := CityView.new()
	var size: Array = city.get("size", [340, 290])
	var start: Array = city.get("start", [0, 10, 190])
	v.lim_x = float(size[0]) / 2.0
	v.lim_z = float(size[1]) / 2.0
	v.x = float(start[0])
	v.z = float(start[1])
	v.dist = float(start[2])
	v.yaw = float(city.get("yaw", -0.35))
	v.dref = float(city.get("maxZoom", 270))
	return v


## How far the camera tilts down (radians above the ground) at this zoom.
func pitch(d := dist) -> float:
	if d <= dref:
		return 0.4 + maxf(0.0, (d - dmin) / (dref - dmin)) * 0.46
	return 0.86 + minf(1.0, (d - dref) / maxf(1.0, dmax - dref)) * 0.3


## 0 when zoomed in, 1 at the overview.
func overview() -> float:
	return clampf((dist - 110.0) / maxf(1.0, dmax - 110.0), 0.0, 1.0)


## Keep the view inside the rules (call after every change).
func clamp_view() -> void:
	dist = clampf(dist, dmin, dmax)
	var u := 1.0 - overview()
	x = clampf(x, -lim_x * u, lim_x * u)
	z = clampf(z, -lim_z * u, lim_z * u)


func camera_position() -> Vector3:
	var p := pitch()
	return Vector3(x + dist * cos(p) * sin(yaw), dist * sin(p), z + dist * cos(p) * cos(yaw))


func target() -> Vector3:
	return Vector3(x, 0.0, z)


## Move by a ground offset (dragging).
func pan_by(dx: float, dz: float) -> void:
	x += dx
	z += dz
	clamp_view()


## Zoom by a factor (pinch, wheel, buttons); < 1 zooms in.
func zoom_by(factor: float) -> void:
	dist *= factor
	clamp_view()


## Glide to a spot over `seconds` (ease in and out).
func fly_to(tx: float, tz: float, tdist: float, seconds := 0.7) -> void:
	_vel = Vector2.ZERO
	_fly = {"from": Vector3(x, z, dist), "to": Vector3(tx, tz, clampf(tdist, dmin, dmax)), "t": 0.0, "len": maxf(0.01, seconds)}


func is_flying() -> bool:
	return not _fly.is_empty()


## After letting go of a drag: keep sliding at this ground speed (per 1/60 s), slowing down.
func fling(velocity: Vector2) -> void:
	_vel = velocity


func stop() -> void:
	_vel = Vector2.ZERO
	_fly = {}


## Advance flying / sliding by `delta` seconds. Returns true if the view changed.
func step(delta: float) -> bool:
	if not _fly.is_empty():
		_fly["t"] = float(_fly["t"]) + delta
		var u := minf(1.0, float(_fly["t"]) / float(_fly["len"]))
		var e := 2.0 * u * u if u < 0.5 else 1.0 - pow(-2.0 * u + 2.0, 2.0) / 2.0
		var a: Vector3 = _fly["from"]
		var b: Vector3 = _fly["to"]
		x = lerpf(a.x, b.x, e)
		z = lerpf(a.y, b.y, e)
		dist = lerpf(a.z, b.z, e)
		clamp_view()
		if u >= 1.0:
			_fly = {}
		return true
	if _vel.length() > 0.01:
		var k := delta * 60.0
		pan_by(_vel.x * k, _vel.y * k)
		_vel *= pow(0.92, k)
		return true
	return false
