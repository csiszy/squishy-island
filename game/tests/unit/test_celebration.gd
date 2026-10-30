extends GutTest
## The upgrade celebration (guide.html#upgrade-celebration): about a second long, fewer pieces on lower tiers,
## only twinkling stars with reduced motion, never in the way of taps.


func after_each() -> void:
	Settings.set_value(&"graphics", &"auto")
	Settings.set_value(&"motion", &"auto")


func _host() -> Control:
	var host := Control.new()
	host.size = Vector2(720, 1280)
	add_child_autofree(host)
	return host


func test_it_ends_by_itself_and_ignores_taps() -> void:
	var c := Celebration.burst(_host(), Vector2(360, 640))
	assert_eq(c.mouse_filter, Control.MOUSE_FILTER_IGNORE)
	assert_lt(Celebration.LENGTH, 2.0, "short: about a second")
	c._process(Celebration.LENGTH + 0.1)
	await wait_frames(1)
	assert_false(is_instance_valid(c), "gone afterwards")


func test_lower_tiers_get_fewer_pieces() -> void:
	Settings.set_value(&"graphics", &"high")
	var high := Celebration.burst(_host(), Vector2.ZERO)
	Settings.set_value(&"graphics", &"low")
	var low := Celebration.burst(_host(), Vector2.ZERO)
	assert_eq(high._pieces.size(), Celebration.CONFETTI)
	assert_lt(low._pieces.size(), high._pieces.size())
	assert_lt(low._fireworks.size(), high._fireworks.size())


func test_reduced_motion_only_twinkles() -> void:
	Settings.set_value(&"motion", &"reduced")
	var c := Celebration.burst(_host(), Vector2(100, 100))
	assert_true(c.calm)
	assert_eq(c._fireworks.size(), 0, "no fireworks")
	var before: Vector2 = c._pieces[0]["p"]
	c._process(0.3)
	assert_eq(c._pieces[0]["p"], before, "nothing flies")


func test_it_follows_a_moving_point() -> void:
	var spot := [Vector2(10, 10)]
	var c := Celebration.burst(_host(), Vector2.ZERO, 1.0, func() -> Vector2: return spot[0])
	spot[0] = Vector2(300, 200)
	c._process(0.05)
	assert_eq(c.position, Vector2(300, 200))
