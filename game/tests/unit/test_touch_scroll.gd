extends GutTest
## Lists scroll under a finger even when the finger lands on a button, and that button does not click
## (owner's phone test: "scrolling is laggy or doesn't scroll").

var scroll: TouchScroll
var clicks := 0


func before_each() -> void:
	clicks = 0
	scroll = TouchScroll.new()
	scroll.position = Vector2.ZERO
	scroll.size = Vector2(400, 400)
	add_child_autofree(scroll)
	var box := VBoxContainer.new()
	scroll.add_child(box)
	for i in 30:
		var b := Button.new()
		b.text = "b%d" % i
		b.custom_minimum_size = Vector2(380, 80)
		b.pressed.connect(func() -> void: clicks += 1)
		box.add_child(b)
	await wait_frames(2)


## A finger as the phone sends it: a touch plus its mouse copy (which the buttons listen to).
func _finger(kind: String, at: Vector2) -> void:
	var vp := get_viewport()
	if kind == "down" or kind == "up":
		var t := InputEventScreenTouch.new()
		t.position = at
		t.pressed = kind == "down"
		vp.push_input(t, true)
		var m := InputEventMouseButton.new()
		m.position = at
		m.global_position = at
		m.button_index = MOUSE_BUTTON_LEFT
		m.pressed = kind == "down"
		m.button_mask = MOUSE_BUTTON_MASK_LEFT if kind == "down" else 0
		vp.push_input(m, true)
	else:
		var d := InputEventScreenDrag.new()
		d.position = at
		vp.push_input(d, true)
		var mm := InputEventMouseMotion.new()
		mm.position = at
		mm.global_position = at
		mm.button_mask = MOUSE_BUTTON_MASK_LEFT
		vp.push_input(mm, true)


func test_a_drag_on_a_button_scrolls_and_does_not_click() -> void:
	_finger("down", Vector2(100, 300))
	for k in 10:
		_finger("drag", Vector2(100, 300 - (k + 1) * 20))
		await wait_frames(1)
	_finger("up", Vector2(100, 100))
	await wait_frames(3)
	assert_gte(scroll.scroll_vertical, 170, "the list followed the finger (and glides on a little)")
	assert_eq(clicks, 0, "the button under the finger did not click")


func test_a_tap_still_clicks() -> void:
	_finger("down", Vector2(100, 120))
	await wait_frames(1)
	_finger("up", Vector2(100, 120))
	await wait_frames(2)
	assert_eq(clicks, 1)
	assert_eq(scroll.scroll_vertical, 0)


func test_a_flick_keeps_gliding_and_stops_at_the_end() -> void:
	_finger("down", Vector2(100, 380))
	for k in 6:
		_finger("drag", Vector2(100, 380 - (k + 1) * 40))
	_finger("up", Vector2(100, 140))
	var after_release := scroll.scroll_vertical
	await wait_seconds(1.5)
	assert_gt(scroll.scroll_vertical, after_release, "it kept moving after the finger let go")
	assert_lte(float(scroll.scroll_vertical), scroll.max_scroll())


func test_sideways_drags_are_left_alone() -> void:
	_finger("down", Vector2(100, 200))
	for k in 6:
		_finger("drag", Vector2(100 + (k + 1) * 30, 205))
	_finger("up", Vector2(280, 205))
	await wait_frames(2)
	assert_eq(scroll.scroll_vertical, 0)
