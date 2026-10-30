class_name WalletBar
extends HBoxContainer
## Coins, Squish Stars and Squish Gems in little pills (top of the map and the shops). Numbers run up or down
## quickly when they change, so the player sees where their coins went.

const COUNT_TIME := 0.5

var economy: EconomyService
var _labels: Dictionary[StringName, Label] = {}
var _shown: Dictionary[StringName, int] = {}


func _ready() -> void:
	if economy == null:
		economy = get_node("/root/Economy") as EconomyService
	alignment = BoxContainer.ALIGNMENT_END
	add_theme_constant_override("separation", 10)
	for what: StringName in [&"coins", &"stars", &"gems"]:
		add_child(_pill(what))
	economy.changed.connect(_refresh)
	_refresh(true)


func _pill(what: StringName) -> PanelContainer:
	var p := PanelContainer.new()
	var box := ToyStyleBox.new()
	box.radius = 999
	box.shadow = Vector2(4, 4)
	box.line_width = 4
	box.pad = Vector4(10, 4, 20, 4)
	p.add_theme_stylebox_override("panel", box)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)
	row.add_child(Ui.texture(Ui.icon({&"coins": "coin", &"stars": "star", &"gems": "gem"}[what]), Vector2(44, 44)))
	var l := Ui.label("0")
	l.add_theme_font_override("font", UiTheme.font(900))
	l.autowrap_mode = TextServer.AUTOWRAP_OFF
	row.add_child(l)
	p.add_child(row)
	p.name = String(what)
	_labels[what] = l
	return p


func _refresh(instant := false) -> void:
	var now := {&"coins": economy.coins(), &"stars": economy.stars(), &"gems": economy.gems()}
	for what: StringName in now:
		var from: int = _shown.get(what, now[what])
		var to: int = now[what]
		_shown[what] = to
		if instant or from == to or Settings.reduced_motion():
			_labels[what].text = Ui.number(to)
		else:
			var l := _labels[what]
			create_tween().tween_method(func(v: float) -> void: l.text = Ui.number(roundi(v)), float(from), float(to), COUNT_TIME).set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_CUBIC)
