class_name GrownUpGate
extends Control
## The grown-up gate (art/ui.js SQU.gate): before anything for grown-ups (saving the town with an email, moving it,
## deleting it; later buying and settings), a sum written in words ("seven plus nine") answered on a number pad.
## Easy for an adult, too hard for a young child to guess. Three wrong answers: a new sum and a 30-second pause.
##     if await GrownUpGate.ask(Text.t(&"account.gate_why_save")):
##         ...

signal answered(passed: bool)

const LOCK_SECONDS := 30.0
const TRIES := 3

## Shared by every gate: after too many wrong answers the gate waits a moment (Time.get_ticks_msec() when it opens).
static var _locked_until := 0
## The sum (tests read it).
var answer := 0
var _typed := ""
var _tries := 0
var _shown: Label
var _error: Label


## Opens the gate; true when a grown-up answered the sum, false if cancelled.
static func ask(why: String) -> bool:
	var host := Ui.overlay()
	if host == null:
		return false
	if Time.get_ticks_msec() < _locked_until:
		Audio.play(&"nope")
		await UiPopup.ask(Text.t(&"gate.wait_title"), Text.t(&"gate.wait_body", {"n": ceili((_locked_until - Time.get_ticks_msec()) / 1000.0)}), Text.t(&"ui.ok"))
		return false
	var g := GrownUpGate.new()
	g._build(why)
	host.add_child(g)
	Audio.play(&"open")
	var passed: bool = await g.answered
	return passed


## "seven plus nine" / "fifteen minus six" (numbers in words, so a child who can read digits can't just copy them).
static func words(n: int) -> String:
	if n <= 20:
		return Text.t(StringName("gate.n%d" % n))
	return Text.t(&"gate.twenty_plus", {"n": Text.t(StringName("gate.n%d" % (n - 20)))})


func _build(why: String) -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	var a := 6 + randi() % 9
	var b := 5 + randi() % 9
	var question := ""
	if randf() < 0.6:
		answer = a + b
		question = Text.t(&"gate.plus", {"a": words(a), "b": words(b)})
	else:
		answer = a
		question = Text.t(&"gate.minus", {"a": words(a + b), "b": words(b)})
	var dim := ColorRect.new()
	dim.color = UiTheme.DIM
	dim.set_anchors_preset(PRESET_FULL_RECT)
	add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_preset(PRESET_FULL_RECT)
	add_child(center)
	var card := PanelContainer.new()
	card.theme_type_variation = "Card"
	card.custom_minimum_size = Vector2(600, 0)
	center.add_child(card)
	var col := VBoxContainer.new()
	col.alignment = BoxContainer.ALIGNMENT_CENTER
	col.add_theme_constant_override("separation", 10)
	card.add_child(col)
	col.add_child(Ui.label(Text.t(&"gate.tag"), "Eyebrow", HORIZONTAL_ALIGNMENT_CENTER))
	col.add_child(Ui.label(Text.t(&"gate.title"), "Heading", HORIZONTAL_ALIGNMENT_CENTER, true))
	col.add_child(Ui.label(why, "Small", HORIZONTAL_ALIGNMENT_CENTER, true))
	col.add_child(Ui.label(Text.t(&"gate.question"), "", HORIZONTAL_ALIGNMENT_CENTER, true))
	col.add_child(Ui.label(question + "?", "Heading", HORIZONTAL_ALIGNMENT_CENTER, true))
	_shown = Ui.label(" ", "Title", HORIZONTAL_ALIGNMENT_CENTER)
	col.add_child(_shown)
	_error = Ui.label(" ", "Small", HORIZONTAL_ALIGNMENT_CENTER)
	_error.add_theme_color_override("font_color", UiTheme.PINK)
	col.add_child(_error)
	var pad := GridContainer.new()
	pad.columns = 3
	pad.add_theme_constant_override("h_separation", 10)
	pad.add_theme_constant_override("v_separation", 10)
	var pad_box := CenterContainer.new()
	pad_box.add_child(pad)
	col.add_child(pad_box)
	for k: String in ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "ok"]:
		var key := Button.new()
		key.name = "Key_" + k
		key.focus_mode = FOCUS_NONE
		key.custom_minimum_size = Vector2(140, 96)
		key.text = {"del": "⌫", "ok": Text.t(&"ui.ok")}.get(k, k)
		key.theme_type_variation = "BigButton" if k == "ok" else "PillButton"
		key.pressed.connect(press.bind(k))
		pad.add_child(key)
	var cancel := Ui.button(Text.t(&"ui.cancel"))
	cancel.name = "Cancel"
	cancel.pressed.connect(_close.bind(false))
	col.add_child(cancel)


## A key on the pad: a digit, "del" or "ok".
func press(k: String) -> void:
	if k == "del":
		_typed = _typed.substr(0, maxi(0, _typed.length() - 1))
	elif k == "ok":
		if _typed != "" and int(_typed) == answer:
			Audio.play(&"unlock")
			_close(true)
			return
		_tries += 1
		_typed = ""
		Audio.play(&"nope")
		if _tries >= TRIES:
			GrownUpGate._locked_until = Time.get_ticks_msec() + int(LOCK_SECONDS * 1000.0)
			_close(false)
			return
		_error.text = Text.t(&"gate.not_quite")
	elif _typed.length() < 3:
		_typed += k
	_shown.text = _typed if _typed != "" else " "


func _close(passed: bool) -> void:
	if not passed:
		Audio.play(&"back")
	answered.emit(passed)
	queue_free()
