class_name UiToast
extends PanelContainer
## A small message that pops up near the bottom for a moment ("Saved!", "This needs the internet").

const SHOW_TIME := 2.6


static func show_text(text: String) -> void:
	var host := Ui.overlay()
	if host == null:
		return
	for old in host.get_children():
		if old is UiToast:
			old.queue_free()
	var t := UiToast.new()
	var box := ToyStyleBox.new()
	box.fill = UiTheme.INK
	box.line = UiTheme.INK
	box.radius = 999
	box.shadow = Vector2.ZERO
	box.pad = Vector4(36, 18, 36, 18)
	t.add_theme_stylebox_override("panel", box)
	var l := Ui.label(text, "", HORIZONTAL_ALIGNMENT_CENTER)
	l.add_theme_color_override("font_color", Color.WHITE)
	t.add_child(l)
	t.mouse_filter = MOUSE_FILTER_IGNORE
	host.add_child(t)
	t.set_anchors_and_offsets_preset(PRESET_CENTER_BOTTOM, PRESET_MODE_MINSIZE, 160)
	t.grow_horizontal = GROW_DIRECTION_BOTH
	t.grow_vertical = GROW_DIRECTION_BEGIN
	var tw := t.create_tween()
	t.modulate.a = 0.0
	tw.tween_property(t, "modulate:a", 1.0, 0.15)
	tw.tween_interval(SHOW_TIME)
	tw.tween_property(t, "modulate:a", 0.0, 0.3)
	tw.tween_callback(t.queue_free)
