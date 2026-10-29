extends GutTest
## The map camera follows the book's rules (art/city3d.js).

var v: CityView


func before_each() -> void:
	v = CityView.from_city({"size": [356, 270], "yaw": -0.28, "start": [-24, 6, 150], "maxZoom": 270})
	v.dmax = 600.0


func test_starts_where_the_book_starts() -> void:
	assert_eq(v.x, -24.0)
	assert_eq(v.dist, 150.0)
	assert_eq(v.yaw, -0.28)


func test_tilts_down_as_you_zoom_out() -> void:
	assert_almost_eq(v.pitch(34.0), 0.4, 0.0001, "close up: a low, friendly angle")
	assert_almost_eq(v.pitch(270.0), 0.86, 0.0001)
	assert_almost_eq(v.pitch(600.0), 1.16, 0.0001, "overview: nearly straight down")
	assert_lt(v.pitch(100.0), v.pitch(200.0))


func test_zoom_stays_within_limits() -> void:
	v.zoom_by(0.01)
	assert_eq(v.dist, 34.0)
	v.zoom_by(100.0)
	assert_eq(v.dist, 600.0)


func test_panning_is_free_when_close_and_locked_at_the_overview() -> void:
	v.dist = 60.0
	v.pan_by(1000.0, 0.0)
	assert_eq(v.x, 178.0, "zoomed in: up to the island's edge")
	v.dist = 600.0
	v.clamp_view()
	assert_eq(v.x, 0.0, "whole-island view stays centred")


func test_flying_eases_and_arrives() -> void:
	v.fly_to(40.0, -30.0, 90.0, 0.7)
	v.step(0.35)
	assert_almost_eq(v.x, (-24.0 + 40.0) / 2.0, 0.5, "half way in time = half way there (ease in-out)")
	for i in 30:
		v.step(0.05)
	assert_false(v.is_flying())
	assert_almost_eq(v.x, 40.0, 0.001)
	assert_almost_eq(v.dist, 90.0, 0.001)


func test_a_fling_slows_down_and_stops() -> void:
	v.dist = 60.0
	v.fling(Vector2(2.0, 0.0))
	var x0 := v.x
	for i in 200:
		v.step(1.0 / 60.0)
	assert_gt(v.x, x0 + 10.0)
	assert_false(v.step(1.0 / 60.0), "stopped")


func test_camera_looks_at_the_target_from_above() -> void:
	var p := v.camera_position()
	assert_gt(p.y, 0.0)
	assert_almost_eq(Vector2(p.x - v.x, p.z - v.z).length(), v.dist * cos(v.pitch()), 0.001)
