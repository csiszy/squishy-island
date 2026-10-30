class_name TouchScroll
extends ScrollContainer
## A list that scrolls smoothly under a finger (every scrolling list in the game uses this instead of Godot's own
## ScrollContainer touch scrolling, which only starts when the finger lands on bare background and feels sticky).
##
## It watches touches before any button sees them: a finger that moves more up-down than sideways by a few pixels
## takes the list with it (even when it started on a button or a card, whose tap is then cancelled), and a flick
## keeps it gliding for a moment. Sideways drags are left alone (they turn the 3D room). Taps still tap.
## The mouse wheel works as usual.

## How far (in screen points) a finger moves before it counts as scrolling rather than tapping.
const DEADZONE := 12.0
## How quickly a flick slows down (per second).
const FRICTION := 4.5
const FAR := Vector2(-100000, -100000)

## Which list is being dragged right now (a list inside a list: the inner one gets the first chance).
static var _active: TouchScroll = null

var _tracking := false
var _dragging := false
var _start := Vector2.ZERO
var _start_scroll := 0.0
var _last := Vector2.ZERO
var _last_time := 0
var _velocity := 0.0
var _scroll := 0.0
var _gliding := false


func _ready() -> void:
	horizontal_scroll_mode = SCROLL_MODE_DISABLED
	# Godot's own drag scrolling stays out of the way
	scroll_deadzone = 100000
	set_process(false)


func _exit_tree() -> void:
	if _active == self:
		_active = null


## The furthest the list can scroll.
func max_scroll() -> float:
	var bar := get_v_scroll_bar()
	return maxf(0.0, bar.max_value - bar.page)


func _input(event: InputEvent) -> void:
	if not is_visible_in_tree():
		return
	# our own "let go far away" events (see _cancel_press) pass straight through to the buttons
	if event is InputEventMouse and (event as InputEventMouse).position.x <= FAR.x / 2.0:
		return
	if event is InputEventScreenTouch and (event as InputEventScreenTouch).position.x <= FAR.x / 2.0:
		return
	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if touch.index != 0:
			return
		if touch.pressed:
			_on_press(_local(touch.position))
		elif _tracking:
			_on_release()
	elif event is InputEventScreenDrag and _tracking:
		var drag := event as InputEventScreenDrag
		if drag.index == 0:
			_on_drag(_local(drag.position))
	elif _dragging and (event is InputEventMouseMotion or event is InputEventMouseButton):
		# the phone's copy of the touch as a mouse: the list has it, not the button under the finger
		if not (event is InputEventMouseButton and (event as InputEventMouseButton).button_index in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_DOWN]):
			get_viewport().set_input_as_handled()


func _local(screen: Vector2) -> Vector2:
	return get_global_transform_with_canvas().affine_inverse() * screen


func _on_press(at: Vector2) -> void:
	_gliding = false
	_velocity = 0.0
	set_process(false)
	_tracking = Rect2(Vector2.ZERO, size).has_point(at) and max_scroll() > 0.0
	_dragging = false
	_start = at
	_last = at
	_last_time = Time.get_ticks_msec()
	_start_scroll = float(get_v_scroll_bar().value)
	_scroll = _start_scroll


func _on_drag(at: Vector2) -> void:
	if not _dragging:
		var moved := at - _start
		if absf(moved.x) > DEADZONE and absf(moved.x) > absf(moved.y):
			_tracking = false   # sideways: not for the list
			return
		if absf(moved.y) <= DEADZONE or (_active != null and _active != self and is_instance_valid(_active)):
			return
		_dragging = true
		_active = self
		# start from where the finger is now, so the list doesn't jump by the dead zone
		_start = at
		_cancel_press.call_deferred()
	get_viewport().set_input_as_handled()
	var now := Time.get_ticks_msec()
	var dt := maxf(0.001, (now - _last_time) / 1000.0)
	_velocity = lerpf(_velocity, -(at.y - _last.y) / dt, 0.5)
	_last = at
	_last_time = now
	_set_scroll(_start_scroll - (at.y - _start.y))


func _on_release() -> void:
	_tracking = false
	if not _dragging:
		return
	_dragging = false
	if _active == self:
		_active = null
	get_viewport().set_input_as_handled()
	# a finger that stopped before letting go doesn't fling the list
	if Time.get_ticks_msec() - _last_time > 80:
		_velocity = 0.0
	_gliding = absf(_velocity) > 30.0
	set_process(_gliding)


## The button (or 3D view) the finger first landed on lets go of it far away, so it doesn't click.
func _cancel_press() -> void:
	var far := FAR
	var vp := get_viewport()
	if vp == null:
		return
	var move := InputEventMouseMotion.new()
	move.position = far
	move.global_position = far
	move.button_mask = MOUSE_BUTTON_MASK_LEFT
	vp.push_input(move)
	var up := InputEventMouseButton.new()
	up.position = far
	up.global_position = far
	up.button_index = MOUSE_BUTTON_LEFT
	up.pressed = false
	vp.push_input(up)
	var lift := InputEventScreenTouch.new()
	lift.index = 0
	lift.position = far
	lift.pressed = false
	lift.canceled = true
	vp.push_input(lift)


func _set_scroll(v: float) -> void:
	_scroll = clampf(v, 0.0, max_scroll())
	get_v_scroll_bar().value = _scroll
	scroll_vertical = roundi(_scroll)


func _process(delta: float) -> void:
	if not _gliding:
		set_process(false)
		return
	_velocity *= exp(-FRICTION * delta)
	_set_scroll(_scroll + _velocity * delta)
	if absf(_velocity) < 20.0 or _scroll <= 0.0 or _scroll >= max_scroll():
		_gliding = false
		set_process(false)
