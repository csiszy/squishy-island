class_name UiTheme
extends RefCounted
## The one theme every screen uses (build.html: "one theme = one place to change the look"), matching the design
## book's pages: plum outlines, white cards with offset shadows, Bagel Fat One titles, heavy Nunito text.
## Sizes are for the 720 x 1280 base screen (2x the book's 360 x 640 phone mock-ups).
##
## Label variations: "Title", "Heading", "Eyebrow", "Small", "Hand". Button variations: "BigButton", "PillButton",
## "IconButton". Panel variation: "Card".

const INK := Color("#2B2141")
const INK2 := Color("#5E5679")
const PAPER := Color("#FFFFFF")
const BG := Color("#F2F5FF")
const PINK := Color("#FF6FA3")
const SUN := Color("#FFC94D")
const MINT := Color("#4FCFA0")
const SKY := Color("#8CCBFF")
const LILAC := Color("#B9A6FF")
const GRASS := Color("#9ED67E")
const DIM := Color(0.169, 0.129, 0.255, 0.45)
## Rarity colours (data/rarity.json has the same).
const RARITY := {"C": Color("#8E9BB0"), "U": Color("#2FB673"), "R": Color("#3B82F6"), "E": Color("#9B5CF6"), "L": Color("#F59E0B"), "X": Color("#E25BB0")}

const FONT_DIR := "res://shared_ui/fonts/"

static var _theme: Theme


static func font(weight: int = 800) -> Font:
	return load(FONT_DIR + "nunito-latin-%d-normal.woff2" % clampi(weight, 700, 900)) as Font


static func display_font() -> Font:
	return load(FONT_DIR + "bagel-fat-one-latin-400-normal.woff2") as Font


static func hand_font() -> Font:
	return load(FONT_DIR + "patrick-hand-latin-400-normal.woff2") as Font


static func card(fill := PAPER, radius := 40) -> ToyStyleBox:
	var s := ToyStyleBox.new()
	s.fill = fill
	s.radius = radius
	s.shadow = Vector2(8, 8)
	s.pad = Vector4(32, 28, 32, 28)
	return s


static func get_theme() -> Theme:
	if _theme == null:
		_theme = build()
	return _theme


static func build() -> Theme:
	var t := Theme.new()
	t.default_font = font(800)
	t.default_font_size = 30
	t.set_color("font_color", "Label", INK)

	_label(t, "Title", display_font(), 64, INK)
	_label(t, "Heading", display_font(), 44, INK)
	_label(t, "Eyebrow", font(900), 22, INK2)
	_label(t, "Small", font(700), 24, INK2)
	_label(t, "Hand", hand_font(), 34, INK)

	var normal := ToyStyleBox.new()
	normal.radius = 28
	_button(t, "Button", normal, 30)
	var big := ToyStyleBox.new()
	big.fill = PINK
	big.radius = 36
	big.pad = Vector4(44, 24, 44, 24)
	_button(t, "BigButton", big, 40, PAPER)
	t.set_font("font", "BigButton", display_font())
	var pill := ToyStyleBox.new()
	pill.radius = 999
	pill.shadow = Vector2(4, 4)
	pill.line_width = 4
	pill.pad = Vector4(24, 10, 24, 10)
	_button(t, "PillButton", pill, 26)
	var icon := ToyStyleBox.new()
	icon.radius = 24
	icon.shadow = Vector2(5, 5)
	icon.pad = Vector4(14, 14, 14, 14)
	_button(t, "IconButton", icon, 36)

	t.set_type_variation("Card", "PanelContainer")
	t.set_stylebox("panel", "Card", card())
	t.set_stylebox("panel", "PanelContainer", StyleBoxEmpty.new())

	var bar := StyleBoxFlat.new()
	bar.bg_color = Color("#EEEAF7")
	bar.border_color = INK
	bar.set_border_width_all(4)
	bar.set_corner_radius_all(999)
	var fill := bar.duplicate() as StyleBoxFlat
	fill.bg_color = PINK
	t.set_stylebox("background", "ProgressBar", bar)
	t.set_stylebox("fill", "ProgressBar", fill)
	t.set_font_size("font_size", "ProgressBar", 1)
	t.set_color("font_color", "ProgressBar", Color.TRANSPARENT)

	t.set_stylebox("panel", "ScrollContainer", StyleBoxEmpty.new())
	t.set_constant("separation", "VBoxContainer", 16)
	t.set_constant("separation", "HBoxContainer", 16)
	return t


static func _label(t: Theme, variation: String, f: Font, size: int, colour: Color) -> void:
	t.set_type_variation(variation, "Label")
	t.set_font("font", variation, f)
	t.set_font_size("font_size", variation, size)
	t.set_color("font_color", variation, colour)


static func _button(t: Theme, variation: String, normal: ToyStyleBox, size: int, text := INK) -> void:
	if variation != "Button":
		t.set_type_variation(variation, "Button")
	var lighter := normal.fill.lerp(Color.WHITE, 0.25) if normal.fill != Color.WHITE else Color("#FFF7FB")
	t.set_stylebox("normal", variation, normal)
	t.set_stylebox("hover", variation, normal.variant(lighter))
	var pressed := normal.variant(normal.fill.darkened(0.06), Vector2.ZERO)
	pressed.press_offset = normal.shadow
	t.set_stylebox("pressed", variation, pressed)
	t.set_stylebox("disabled", variation, normal.variant(Color("#E6E2EF"), normal.shadow))
	t.set_stylebox("focus", variation, StyleBoxEmpty.new())
	t.set_font_size("font_size", variation, size)
	for state: String in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color", "font_hover_pressed_color"]:
		t.set_color(state, variation, text)
	t.set_color("font_disabled_color", variation, INK2)
	t.set_constant("h_separation", variation, 12)
