class_name SafeArea
extends RefCounted
## How much room the phone's notch, rounded corners and gesture bar take, in screen (canvas) units:
## Vector4(left, top, right, bottom). Put buttons inside this; let pictures run under it.


static func insets(viewport: Viewport) -> Vector4:
	var safe := DisplayServer.get_display_safe_area()
	var screen := DisplayServer.screen_get_size()
	if safe.size.x <= 0 or screen.x <= 0 or OS.has_feature("editor") and not OS.has_feature("mobile"):
		return Vector4(16, 16, 16, 16)
	var visible := viewport.get_visible_rect().size
	var k := visible.x / float(screen.x)
	return Vector4(safe.position.x * k, safe.position.y * k, (screen.x - safe.end.x) * k, (screen.y - safe.end.y) * k) + Vector4(16, 16, 16, 16)
