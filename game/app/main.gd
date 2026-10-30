extends Control
## The app shell: holds the current screen, the pop-up layer and the debug menu; turns Nav requests into screen
## changes; gives every button its tap sound and buzz; applies the frame rate from Settings.
## Screens are scenes in features/; this is the only file that knows where they are.

const SCREENS: Dictionary[StringName, String] = {
	&"city": "res://features/city/city_screen.tscn",
	&"house": "res://features/houses/house_screen.tscn",
	&"factory": "res://features/factory/factory_screen.tscn",
	&"collection": "res://features/collection/collection_screen.tscn",
	&"minigame": "res://features/minigame_host/minigame_screen.tscn",
	&"games": "res://features/games/games_screen.tscn",
	&"account": "res://features/account/account_screen.tscn",
}
const FIRST_SCREEN := &"city"
## Screens that are never open twice (opening one again goes back to it).
const SINGLE: Array[StringName] = [&"city", &"factory", &"collection", &"games", &"account"]

var _host: Control
var _overlay: Control
## [{"id", "args", "node"}], the top one is shown.
var _stack: Array[Dictionary] = []


func _ready() -> void:
	theme = UiTheme.get_theme()
	set_anchors_preset(PRESET_FULL_RECT)
	# the shell itself never catches taps: what is not used by a screen's buttons reaches the screen's game
	mouse_filter = MOUSE_FILTER_IGNORE
	_host = Control.new()
	_host.name = "Screens"
	_host.set_anchors_preset(PRESET_FULL_RECT)
	_host.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_host)
	_overlay = Control.new()
	_overlay.name = "Overlay"
	_overlay.set_anchors_preset(PRESET_FULL_RECT)
	_overlay.mouse_filter = MOUSE_FILTER_IGNORE
	_overlay.add_to_group(&"ui_overlay")
	add_child(_overlay)
	# which minigames exist (the host reads every manifest), so the map knows where "Play" leads
	GameData.minigames = MinigameCatalog.by_building()
	MinigameCatalog.load_all_words()
	if Ads.provider is FakeAdProvider:
		(Ads.provider as FakeAdProvider).presenter = PretendAd.play
	# the town was replaced (moved here from another phone, a newer cloud save, a deleted account): start again
	Account.town_replaced.connect(func() -> void:
		Town.reload()
		get_tree().reload_current_scene())
	Nav.go_requested.connect(open_screen)
	Nav.back_requested.connect(go_back)
	get_tree().node_added.connect(_on_node_added)
	get_tree().set_auto_accept_quit(false)
	get_tree().set_quit_on_go_back(false)
	Settings.changed.connect(func(_k: StringName, _v: Variant) -> void: _apply_settings())
	_apply_settings()
	if OS.is_debug_build():
		_add_debug_menu()
	open_screen(FIRST_SCREEN, {})


func _notification(what: int) -> void:
	match what:
		NOTIFICATION_WM_GO_BACK_REQUEST:
			go_back()
		NOTIFICATION_WM_CLOSE_REQUEST:
			Save.save_now()
			get_tree().quit()


## Show a screen on top of the current one (the one below stays alive, hidden, so going back is instant).
func open_screen(id: StringName, args: Dictionary) -> void:
	var path: String = SCREENS.get(id, "")
	if path == "" or not ResourceLoader.exists(path):
		push_warning("Nav: no screen called %s yet" % id)
		UiToast.show_text(Text.t(&"ui.coming_soon"))
		return
	# screens there is only one of: if it is already open further down, go back to it instead of opening a
	# second copy (book -> Factory -> book -> Factory ... would otherwise pile up)
	if id in SINGLE:
		for i in range(_stack.size() - 1, -1, -1):
			if _stack[i]["id"] == id:
				while _stack.size() > i + 1:
					var top: Dictionary = _stack.pop_back()
					(top["node"] as Node).queue_free()
				var again: Node = _stack[-1]["node"]
				_set_visible(again, true)
				Nav.current = id
				if again.has_method(&"open"):
					again.call(&"open", args)
				if again.has_method(&"screen_shown"):
					again.call(&"screen_shown")
				return
	if not _stack.is_empty():
		_set_visible(_stack[-1]["node"], false)
	var node: Node = (load(path) as PackedScene).instantiate()
	_host.add_child(node)
	_stack.append({"id": id, "args": args, "node": node})
	Nav.current = id
	if node.has_method(&"open"):
		node.call(&"open", args)


## Close the top screen. On the first screen, the phone's back button leaves the game.
func go_back() -> void:
	if _overlay.get_child_count() > 0 and _overlay.get_child(-1) is UiPopup:
		return
	# a screen may want the back button for itself (a running minigame pauses instead)
	if not _stack.is_empty() and (_stack[-1]["node"] as Node).has_method(&"back_pressed") and (_stack[-1]["node"] as Node).call(&"back_pressed"):
		return
	if _stack.size() <= 1:
		if Nav.current == FIRST_SCREEN:
			Save.save_now()
			get_tree().quit()
		return
	var top: Dictionary = _stack.pop_back()
	(top["node"] as Node).queue_free()
	var below: Dictionary = _stack[-1]
	_set_visible(below["node"], true)
	Nav.current = below["id"]
	if (below["node"] as Node).has_method(&"screen_shown"):
		(below["node"] as Node).call(&"screen_shown")


func screen_ids() -> Array[StringName]:
	var out: Array[StringName] = []
	for s in _stack:
		out.append(s["id"])
	return out


func _set_visible(node: Node, on: bool) -> void:
	if node is CanvasItem:
		(node as CanvasItem).visible = on
	node.process_mode = PROCESS_MODE_INHERIT if on else PROCESS_MODE_DISABLED


func _apply_settings() -> void:
	Engine.max_fps = Settings.frame_rate()
	BookLights.apply_shadow_quality(Settings.graphics_tier())


## Every button: a soft "pop" and, on phones, a 10 ms tick (Sound page). Set meta "silent" to skip.
func _on_node_added(node: Node) -> void:
	if node is BaseButton and not node.has_meta(&"silent"):
		(node as BaseButton).pressed.connect(_button_feedback.bind(node))


func _button_feedback(button: BaseButton) -> void:
	if button.has_meta(&"silent"):
		return
	Audio.play(&"tap")
	Haptics.play(&"light")


func _server_name() -> String:
	var service := get_node("/root/Server") as ServerService
	return "the pretend server on this phone" if service.address() == "" else service.address()


## Test builds: point the game at a real server (yours on your laptop: server/README.md), or back to the pretend one.
func _debug_server() -> void:
	var service := get_node("/root/Server") as ServerService
	var field := LineEdit.new()
	field.text = service.address().trim_prefix("http://") if service.address() != "" else "192.168.1."
	field.placeholder_text = "192.168.1.20"
	field.custom_minimum_size = Vector2(440, 72)
	field.add_theme_font_size_override("font_size", 30)
	var body := "Now: %s\nType your laptop's address (it is shown when you start the server) and connect. The phone must be on the same Wi-Fi." % _server_name()
	if await UiPopup.ask("Server", body, "Connect", "Use the pretend one", field):
		var answer: Dictionary = await service.use(field.text)
		if answer.get("ok", false):
			await UiPopup.ask("Connected!", "This phone now plays with the server at %s. Your squishies, Stars and boxes live there now (coins stay on the phone)." % service.address(), "OK")
		else:
			await UiPopup.ask("Not found", "No Squishy Island server answered at %s.\nIs the laptop on the same Wi-Fi, is the server running (docker compose up), and is the address right?" % field.text, "OK")
	elif service.address() != "":
		await service.use("")
		await UiPopup.ask("Pretend server", "This phone plays with the pretend server again.", "OK")


## Debug builds only (never in a store build): quick coins and a fresh town, for trying things out.
func _add_debug_menu() -> void:
	var b := Button.new()
	b.text = "DEV"
	b.theme_type_variation = "PillButton"
	b.modulate.a = 0.55
	b.set_anchors_and_offsets_preset(PRESET_CENTER_TOP, PRESET_MODE_MINSIZE, 110)
	b.pressed.connect(_debug_menu)
	_overlay.add_child(b)
	b.mouse_filter = MOUSE_FILTER_STOP


func _debug_menu() -> void:
	var dev := DeviceInfo.new()
	var info := "Only in test builds.\nGraphics: %s (picked: %s) · %.1f GB · %d cores · %d fps\nScreen %s" % [Settings.graphics_tier(), Settings.detected_tier(), dev.memory_gb(), dev.cpu_cores(), Engine.get_frames_per_second(), DisplayServer.window_get_size()]
	if await UiPopup.ask("Developer", info, "+1,000 coins", "More…"):
		Economy.earn(1000, &"debug")
		return
	if await UiPopup.ask("Developer", "Server now: %s" % _server_name(), "Server…", "More…"):
		_debug_server()
		return
	if await UiPopup.ask("Developer", "", "+20,000 coins", "Start a fresh town"):
		Economy.earn(20000, &"debug")
		return
	if await UiPopup.ask("Start a fresh town?", "Everything goes back to day one.", "Yes, start over", "No"):
		Save.wipe()
		Save.load_game()
		(get_node("/root/Server") as ServerService).new_guest()
		Collection.server = Server.api
		await Collection.sync()
		Town.reload()
		get_tree().reload_current_scene()
