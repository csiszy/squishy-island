extends Control
## The home screen: the island seen from above (index.html, art/city3d.js). Drag to move, pinch or scroll to
## zoom, tap a building or its bubble to see its card. Buildings show their level, houses their squishies.
## Top left: help, settings, music, save my town, Gem store, collection book; top right: the wallet;
## bottom right: zoom buttons. Layout: data/city.json (the CITY block in the book's index.html).

const TAP_MOVE := 14.0
const TAP_TIME := 0.45
const NAMES_BELOW := 175.0

var view: CityView
var _city: Dictionary
var _viewport: SubViewport
var _view: NativeViewport
var _camera: Camera3D
var _sun: DirectionalLight3D
var _env: Environment
var _slots: Dictionary[StringName, BuildingSlot] = {}
var _bubbles: Dictionary[StringName, MapBubble] = {}
var _bubble_layer: Control
var _fx_layer: Control
var _card: BuildingCard
var _music_button: Button
var _pending_fly: StringName = &""

# gestures
var _touches: Dictionary[int, Vector2] = {}
var _pan_anchor := Vector3.INF
var _pinch := {}
var _down := {}
var _last_move := 0.0
var _vel := Vector2.ZERO


func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	_city = GameData.file("city.json")
	view = CityView.from_city(_city)
	_build_world()
	_build_hud()
	_card = BuildingCard.new()
	add_child(_card)
	_card.action.connect(_on_card_action)
	Town.changed.connect(refresh)
	Collection.changed.connect(refresh)
	Events.squishy_moved_in.connect(_on_moved_in)
	Events.building_upgraded.connect(_on_upgraded)
	resized.connect(_on_resized)
	_on_resized.call_deferred()
	refresh()
	_aim()
	Audio.music(&"city")


func open(_args: Dictionary) -> void:
	pass


## Back on the map (from a house or the Factory): music, and fly to a house a new squishy just moved into.
func screen_shown() -> void:
	Audio.music(&"city")
	refresh()
	if _pending_fly != &"":
		select(_pending_fly, false)
		_pending_fly = &""


## Show every building at its current level with the squishies that live there.
func refresh() -> void:
	for id: StringName in _slots:
		var family: Array[StringName] = []
		if Town.is_house(id):
			for sq in GameData.family(id):
				if Collection.owned(sq):
					family.append(sq)
		_slots[id].show_state(Town.level(id), family)
		_bubbles[id].show_state(Town.level(id), not Town.is_unlocked(id))
	_card.refresh()


## Fly to a building and open its card.
func select(id: StringName, with_card := true) -> void:
	var slot: BuildingSlot = _slots.get(id)
	if slot == null:
		return
	view.fly_to(slot.position.x, slot.position.z + 4.0, minf(view.dist, 90.0))
	Audio.play(&"whoosh", 1.0, 0.5)
	if with_card:
		_card.show_building(id)


# ---------------------------------------------------------------- world

func _build_world() -> void:
	# drawn at the phone's real resolution (NativeViewport); the tier sets the render scale and edge smoothing
	_view = NativeViewport.new()
	_view.set_anchors_preset(PRESET_FULL_RECT)
	_view.gui_input.connect(_on_input)
	add_child(_view)
	_viewport = _view.viewport
	_viewport.transparent_bg = false
	var tier := Settings.graphics_tier()
	# Settings page tier table: smooth edges (4x) on Medium and High; full resolution except on Low (70%) and on a
	# Medium phone with a very sharp screen (80%); a smaller picture is enlarged with FSR, sharper than stretching
	_view.msaa = Viewport.MSAA_DISABLED if tier == GraphicsTier.LOW else Viewport.MSAA_4X
	var scale := 0.7 if tier == GraphicsTier.LOW else 1.0
	if tier == GraphicsTier.MEDIUM and DisplayServer.window_get_size().x > 1200:
		scale = 0.8
	if scale < 1.0:
		_viewport.scaling_3d_mode = Viewport.SCALING_3D_MODE_FSR
		_viewport.scaling_3d_scale = scale
	var world := Node3D.new()
	world.name = "World"
	_viewport.add_child(world)
	var env := WorldEnvironment.new()
	_env = BookLights.make_environment(Color("#BFE6FF"))
	_env.fog_enabled = true
	_env.fog_mode = Environment.FOG_MODE_DEPTH
	_env.fog_light_color = Color("#CFEBFF")
	_env.fog_density = 1.0
	env.environment = _env
	world.add_child(env)
	_sun = BookLights.make_sun()
	_sun.shadow_enabled = Settings.graphics_tier() != GraphicsTier.LOW
	world.add_child(_sun)
	var island := ArtLibrary.island()
	if island:
		world.add_child(island.instantiate())
	for entry: Dictionary in _city.get("buildings", []):
		var id := StringName(entry["id"])
		if GameData.building(id).is_empty():
			continue
		var slot := BuildingSlot.make(entry, _city)
		world.add_child(slot)
		_slots[id] = slot
	_camera = Camera3D.new()
	_camera.fov = 30.0
	_camera.near = 1.0
	world.add_child(_camera)
	_camera.make_current()
	_bubble_layer = Control.new()
	_bubble_layer.set_anchors_preset(PRESET_FULL_RECT)
	_bubble_layer.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_bubble_layer)
	# celebrations go over the pins but under the buttons
	_fx_layer = Control.new()
	_fx_layer.set_anchors_preset(PRESET_FULL_RECT)
	_fx_layer.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_fx_layer)
	for id: StringName in _slots:
		var b := MapBubble.make(id)
		b.pressed.connect(func() -> void: select(id))
		_bubble_layer.add_child(b)
		_bubbles[id] = b


func _process(delta: float) -> void:
	if view.step(delta):
		_aim()
	_place_bubbles()


## Point the camera, move the sun and the fog with the view (art/city3d.js, place()).
func _aim() -> void:
	_camera.position = view.camera_position()
	_camera.look_at(view.target(), Vector3.UP)
	_camera.far = view.dist * 4.0
	# a nearer near-plane when zoomed out keeps flat things (river, roads) from flickering into the ground
	_camera.near = clampf(view.dist * 0.08, 1.0, 120.0)
	_env.fog_depth_begin = view.dist * 1.4
	_env.fog_depth_end = view.dist * 3.4
	var s := minf(215.0, view.dist * 0.85)
	_sun.directional_shadow_max_distance = view.dist * 2.0
	_sun.global_position = view.target() + Vector3(-s * 0.55, s * 1.25, s * 0.75)
	_sun.look_at(view.target(), Vector3.UP)


func _place_bubbles() -> void:
	var k := clampf(150.0 / view.dist + 0.35, 0.62, 1.0)
	var names := view.dist < NAMES_BELOW
	var area := Rect2(Vector2(-60, -60), size + Vector2(120, 160))
	var order: Array = []
	for id: StringName in _slots:
		var p := _slots[id].bubble_point()
		var b := _bubbles[id]
		if _camera.is_position_behind(p):
			b.visible = false
			continue
		var screen := _to_screen(p)
		b.visible = area.has_point(screen)
		if b.visible:
			b.place(screen, k, names)
			order.append([_camera.global_position.distance_to(p), b])
	# nearer pins on top of further ones, by their order in the pin layer (not z_index, which would also lift them
	# above the buttons and the building card)
	order.sort_custom(func(a: Array, c: Array) -> bool: return a[0] > c[0])
	for i in order.size():
		var pin: MapBubble = order[i][1]
		if pin.get_index() != i:
			_bubble_layer.move_child(pin, i)


var _sized_once := false


## Furthest zoom: just enough to see the whole island on this screen (art/city3d.js, fitAll()).
## The first time: on a tall phone screen start a bit further out, like the book.
func _on_resized() -> void:
	if _viewport == null or size.x < 2.0:
		return
	_fit_all()
	if not _sized_once:
		_sized_once = true
		var aspect := size.x / maxf(1.0, size.y)
		if aspect < 1.1:
			view.dist = minf(view.dmax, view.dist * minf(1.5, 1.1 / aspect))
			view.clamp_view()
			_aim()


func _fit_all() -> void:
	var keep := [view.x, view.z, view.dist]
	var w := float((_city.get("size", [340, 290]) as Array)[0])
	var h := float((_city.get("size", [340, 290]) as Array)[1])
	var lo := 150.0
	var hi := 3000.0
	view.x = 0.0
	view.z = 0.0
	for i in 22:
		var mid := (lo + hi) / 2.0
		view.dmax = mid
		view.dist = mid
		_aim()
		var fits := true
		for j in 24:
			var a := j / 24.0 * TAU
			var p := Vector3(cos(a) * w / 2.0 * 1.08, 0.0, sin(a) * h / 2.0 * 1.08)
			if _camera.is_position_behind(p):
				fits = false
				break
			var q := _camera.unproject_position(p) / Vector2(_viewport.size) * 2.0 - Vector2.ONE
			if absf(q.x) >= 0.96 or absf(q.y) >= 0.92:
				fits = false
				break
		if fits:
			hi = mid
		else:
			lo = mid
	view.dmax = hi
	view.x = keep[0]
	view.z = keep[1]
	view.dist = keep[2]
	view.clamp_view()
	_aim()


# ---------------------------------------------------------------- gestures

func _on_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		var t := event as InputEventScreenTouch
		if t.pressed:
			_touches[t.index] = t.position
			view.stop()
			if _touches.size() == 1:
				_pan_anchor = _ground_at(t.position)
				_down = {"pos": t.position, "time": Time.get_ticks_msec() / 1000.0}
			elif _touches.size() == 2:
				_pinch = {"d": _pinch_distance(), "dist": view.dist}
				_pan_anchor = Vector3.INF
		else:
			_touches.erase(t.index)
			if _touches.size() < 2:
				_pinch = {}
			if _touches.is_empty():
				if not _down.is_empty() and t.position.distance_to(_down["pos"]) < TAP_MOVE and Time.get_ticks_msec() / 1000.0 - float(_down["time"]) < TAP_TIME:
					_tap(t.position)
				elif Time.get_ticks_msec() / 1000.0 - _last_move < 0.08:
					view.fling(_vel)
				_pan_anchor = Vector3.INF
				_down = {}
			elif _touches.size() == 1:
				_pan_anchor = _ground_at(_touches.values()[0])
	elif event is InputEventScreenDrag:
		var d := event as InputEventScreenDrag
		_touches[d.index] = d.position
		if not _pinch.is_empty() and _touches.size() >= 2:
			view.dist = float(_pinch["dist"]) * float(_pinch["d"]) / maxf(20.0, _pinch_distance())
			view.clamp_view()
			_aim()
		elif _pan_anchor != Vector3.INF:
			var g := _ground_at(d.position)
			if g != Vector3.INF:
				var dx := _pan_anchor.x - g.x
				var dz := _pan_anchor.z - g.z
				view.pan_by(dx, dz)
				_aim()
				var now := Time.get_ticks_msec() / 1000.0
				var dt := maxf(0.008, now - _last_move)
				_vel = Vector2(dx, dz) / dt / 60.0
				_last_move = now
	elif event is InputEventMouseButton:
		var m := event as InputEventMouseButton
		if m.pressed and m.button_index in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_DOWN]:
			_zoom_at(m.position, 0.9 if m.button_index == MOUSE_BUTTON_WHEEL_UP else 1.0 / 0.9)
	elif event is InputEventMagnifyGesture:
		_zoom_at((event as InputEventMagnifyGesture).position, 1.0 / (event as InputEventMagnifyGesture).factor)


## Zoom keeping the ground under the pointer where it is (mouse wheel, trackpad).
func _zoom_at(pos: Vector2, factor: float) -> void:
	view.stop()
	var before := _ground_at(pos)
	view.zoom_by(factor)
	_aim()
	var after := _ground_at(pos)
	if before != Vector3.INF and after != Vector3.INF:
		view.pan_by(before.x - after.x, before.z - after.z)
	_aim()


func _pinch_distance() -> float:
	var pts := _touches.values()
	return (pts[0] as Vector2).distance_to(pts[1]) if pts.size() >= 2 else 1.0


## The point on the ground under a screen position (or INF).
func _ground_at(pos: Vector2) -> Vector3:
	var p := pos * (Vector2(_viewport.size) / size)
	var from := _camera.project_ray_origin(p)
	var dir := _camera.project_ray_normal(p)
	if absf(dir.y) < 0.0001:
		return Vector3.INF
	var t := -from.y / dir.y
	return from + dir * t if t > 0.0 else Vector3.INF


func _tap(pos: Vector2) -> void:
	var p := pos * (Vector2(_viewport.size) / size)
	var from := _camera.project_ray_origin(p)
	var dir := _camera.project_ray_normal(p)
	var best := &""
	var best_d := INF
	for id: StringName in _slots:
		var hit: Variant = _slots[id].world_bounds().intersects_ray(from, dir)
		if hit != null and from.distance_to(hit) < best_d:
			best_d = from.distance_to(hit)
			best = id
	if best != &"":
		select(best)
	else:
		_card.close()


# ---------------------------------------------------------------- HUD + card

func _build_hud() -> void:
	var hud := MarginContainer.new()
	hud.set_anchors_preset(PRESET_FULL_RECT)
	hud.mouse_filter = MOUSE_FILTER_IGNORE
	var inset := SafeArea.insets(get_viewport())
	hud.add_theme_constant_override("margin_left", int(inset.x))
	hud.add_theme_constant_override("margin_top", int(inset.y))
	hud.add_theme_constant_override("margin_right", int(inset.z))
	hud.add_theme_constant_override("margin_bottom", int(inset.w))
	add_child(hud)
	var left := VBoxContainer.new()
	left.size_flags_horizontal = SIZE_SHRINK_BEGIN
	left.size_flags_vertical = SIZE_SHRINK_BEGIN
	left.add_theme_constant_override("separation", 14)
	hud.add_child(left)
	for b: Array in [["info", &"ui.help", _soon], ["gear", &"ui.settings", _soon], ["music", &"ui.music", _toggle_music],
			["cloud", &"ui.save_town", _soon], ["gem", &"ui.gem_store", _soon], ["book", &"map.collection", func() -> void: Nav.go(&"collection")]]:
		var btn := Ui.icon_button(b[0], Text.t(b[1]))
		btn.pressed.connect(b[2])
		left.add_child(btn)
		if b[0] == "music":
			_music_button = btn
	_update_music_icon()
	var wallet := WalletBar.new()
	wallet.size_flags_horizontal = SIZE_SHRINK_END
	wallet.size_flags_vertical = SIZE_SHRINK_BEGIN
	hud.add_child(wallet)
	var zoom := VBoxContainer.new()
	zoom.size_flags_horizontal = SIZE_SHRINK_END
	zoom.size_flags_vertical = SIZE_SHRINK_END
	zoom.add_theme_constant_override("separation", 14)
	hud.add_child(zoom)
	for b: Array in [["plus", &"ui.zoom_in", 0.62], ["minus", &"ui.zoom_out", 1.6], ["fit", &"ui.show_island", 0.0]]:
		var btn := Ui.icon_button(b[0], Text.t(b[1]))
		var factor: float = b[2]
		btn.pressed.connect(func() -> void:
			if factor == 0.0:
				view.fly_to(0.0, 0.0, view.dmax)
			else:
				view.fly_to(view.x, view.z, view.dist * factor, 0.35))
		zoom.add_child(btn)


func _toggle_music() -> void:
	var on: bool = not Settings.get_value(&"music")
	Settings.set_value(&"music", on)
	Audio.play(&"toggleOn" if on else &"toggleOff")
	_update_music_icon()


func _update_music_icon() -> void:
	if _music_button:
		_music_button.icon = Ui.icon("music" if Settings.get_value(&"music") else "music_off")


func _soon() -> void:
	UiToast.show_text(Text.t(&"ui.coming_soon"))


func _on_card_action(id: StringName, action: StringName) -> void:
	match action:
		&"open_house":
			Nav.go(&"house", {"id": id})
		&"open_factory":
			Nav.go(&"factory", {})
		&"build", &"upgrade":
			var r := Town.upgrade(id)
			if r["can"]:
				Audio.play(&"build")
				_slots[id].play_build()
				await get_tree().create_timer(0.7).timeout
				Audio.play(&"tada")
				Haptics.play(&"medium")
				_celebrate(id)
				var name_text := Text.t(StringName(GameData.building(id).get("name", "")))
				UiToast.show_text(Text.t(&"map.built", {"name": name_text}) if r["next"] == 1 else Text.t(&"map.upgraded", {"name": name_text, "n": r["next"]}))
			else:
				Audio.play(&"nope")
		_:
			_soon()


## Confetti and little fireworks around a building that was just built or upgraded (it follows the map's movement).
func _celebrate(id: StringName) -> void:
	var slot := _slots[id]
	var middle := func() -> Vector2:
		var b := slot.world_bounds()
		return _to_screen(b.get_center())
	Celebration.burst(_fx_layer, middle.call(), clampf(150.0 / view.dist + 0.35, 0.62, 1.0) * 1.2, middle)


func _to_screen(world: Vector3) -> Vector2:
	return _camera.unproject_position(world) * (size / Vector2(_viewport.size))


func _on_moved_in(squishy: StringName) -> void:
	_pending_fly = StringName(GameData.squishy(squishy).get("family", ""))


func _on_upgraded(_id: StringName, _level: int) -> void:
	refresh()
