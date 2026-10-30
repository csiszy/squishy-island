class_name PretendAd
extends Control
## The stand-in for a rewarded video until real ads exist (Step 5), exactly like the prototypes' one: a short
## wait with a progress bar; after 5 seconds a "Close (no reward)" button appears. Watching to the end = reward.
## The app shell plugs PretendAd.play into the pretend ad provider.

signal done(watched: bool)

var _bar: ProgressBar
var _close: Button
var _hint: Label
var _left: Label
var _length := 8
var _closable := 5
var _time := 0.0


static func play(seconds: int, closable_after: int) -> bool:
	var host := Ui.overlay()
	if host == null:
		return true
	var ad := PretendAd.new()
	ad._length = seconds
	ad._closable = closable_after
	host.add_child(ad)
	var watched: bool = await ad.done
	return watched


func _ready() -> void:
	# anchors AND offsets, or it stays 0 x 0 in the corner
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	var dim := ColorRect.new()
	dim.color = Color(UiTheme.INK, 0.85)
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
	card.add_child(col)
	col.add_child(Ui.label(Text.t(&"ad.eyebrow"), "Eyebrow", HORIZONTAL_ALIGNMENT_CENTER))
	col.add_child(Ui.label(Text.t(&"ad.title"), "Heading", HORIZONTAL_ALIGNMENT_CENTER, true))
	_left = Ui.label("", "", HORIZONTAL_ALIGNMENT_CENTER, true)
	col.add_child(_left)
	_bar = ProgressBar.new()
	_bar.custom_minimum_size = Vector2(0, 28)
	_bar.max_value = 1.0
	_bar.step = 0.001
	col.add_child(_bar)
	_hint = Ui.label(Text.t(&"ad.close_after", {"n": _closable}), "Small", HORIZONTAL_ALIGNMENT_CENTER, true)
	col.add_child(_hint)
	_close = Ui.button(Text.t(&"ad.close_no_reward"), "", "close")
	_close.visible = false
	_close.pressed.connect(_finish.bind(false))
	col.add_child(_close)
	Audio.duck()


func _process(delta: float) -> void:
	_time += delta
	_bar.value = _time / _length
	_left.text = Text.t(&"ad.body", {"n": maxi(0, ceili(_length - _time))})
	if _time >= _closable and not _close.visible:
		_close.visible = true
		_hint.visible = false
	if _time >= _length:
		_finish(true)


func _finish(watched: bool) -> void:
	set_process(false)
	done.emit(watched)
	queue_free()
