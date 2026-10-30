class_name UiPopup
extends Control
## A friendly pop-up card over a dimmed screen (art/ui.js, SQU.ask). Await the answer:
##     if await UiPopup.ask(Text.t(&"house.fix_title"), Text.t(&"house.fix_body"), Text.t(&"ui.yes"), Text.t(&"ui.no")):
## With no "no" button it is just a message (always true). Neutral wording only: no countdowns, no pressure.

signal answered(yes: bool)

var _card: PanelContainer


static func ask(title: String, body: String, yes_text: String, no_text := "", art: Control = null) -> bool:
	var p := UiPopup.new()
	p._build(title, body, yes_text, no_text, art)
	var host := Ui.overlay()
	if host == null:
		p.queue_free()
		return true
	host.add_child(p)
	Audio.play(&"open")
	var yes: bool = await p.answered
	return yes


func _build(title: String, body: String, yes_text: String, no_text: String, art: Control) -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_STOP
	var dim := ColorRect.new()
	dim.color = UiTheme.DIM
	dim.set_anchors_preset(PRESET_FULL_RECT)
	add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_preset(PRESET_FULL_RECT)
	add_child(center)
	_card = PanelContainer.new()
	_card.theme_type_variation = "Card"
	_card.custom_minimum_size = Vector2(600, 0)
	center.add_child(_card)
	var col := VBoxContainer.new()
	col.alignment = BoxContainer.ALIGNMENT_CENTER
	_card.add_child(col)
	if art != null:
		col.add_child(art)
	col.add_child(Ui.label(title, "Heading", HORIZONTAL_ALIGNMENT_CENTER, true))
	if body != "":
		col.add_child(Ui.label(body, "", HORIZONTAL_ALIGNMENT_CENTER, true))
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	col.add_child(row)
	if no_text != "":
		var no := Ui.button(no_text)
		no.pressed.connect(_close.bind(false))
		row.add_child(no)
	var yes := Ui.button(yes_text, "BigButton")
	yes.pressed.connect(_close.bind(true))
	row.add_child(yes)
	if not Settings.reduced_motion():
		_card.scale = Vector2(0.85, 0.85)
		_card.pivot_offset = Vector2(300, 150)
		create_tween().tween_property(_card, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func _close(yes: bool) -> void:
	if not yes:
		Audio.play(&"back")
	answered.emit(yes)
	queue_free()
