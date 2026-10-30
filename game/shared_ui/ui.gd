class_name Ui
extends RefCounted
## Small helpers so every screen builds its controls the same way.
##     Ui.label(Text.t(&"ui.close"), "Heading")
##     Ui.button(Text.t(&"ui.back"), "PillButton", "back")
##     Ui.icon("coin")
## Pop-ups and toasts go on the overlay layer (a node in the "ui_overlay" group, made by the app shell).

const ICON_DIR := "res://shared_ui/icons/%s.svg"


static func icon(icon_name: String) -> Texture2D:
	return load(ICON_DIR % icon_name) as Texture2D


## wrap: break long sentences over several lines (it then needs a width from its container).
static func label(text: String, variation := "", align := HORIZONTAL_ALIGNMENT_LEFT, wrap := false) -> Label:
	var l := Label.new()
	l.text = text
	l.theme_type_variation = variation
	l.horizontal_alignment = align
	if wrap:
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return l


static func button(text: String, variation := "", icon_name := "") -> Button:
	var b := Button.new()
	b.text = text
	b.theme_type_variation = variation
	if icon_name != "":
		b.icon = icon(icon_name)
		b.expand_icon = true
		b.add_theme_constant_override("icon_max_width", 48)
	b.focus_mode = Control.FOCUS_NONE
	return b


static func icon_button(icon_name: String, tooltip: String) -> Button:
	var b := Button.new()
	b.theme_type_variation = "IconButton"
	b.icon = icon(icon_name)
	b.expand_icon = true
	b.custom_minimum_size = Vector2(88, 88)
	b.add_theme_constant_override("icon_max_width", 56)
	b.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	b.tooltip_text = tooltip
	b.focus_mode = Control.FOCUS_NONE
	return b


static func texture(tex: Texture2D, size: Vector2) -> TextureRect:
	var t := TextureRect.new()
	t.texture = tex
	t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	t.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	t.custom_minimum_size = size
	return t


## The layer pop-ups and toasts go on (the app shell's overlay), or null in tests without the shell.
static func overlay() -> Control:
	var tree := Engine.get_main_loop() as SceneTree
	return tree.get_first_node_in_group(&"ui_overlay") as Control if tree else null


## Format a number for players: 1240 -> "1,240".
static func number(n: int) -> String:
	var s := str(absi(n))
	var out := ""
	while s.length() > 3:
		out = "," + s.substr(s.length() - 3) + out
		s = s.substr(0, s.length() - 3)
	return ("-" if n < 0 else "") + s + out
