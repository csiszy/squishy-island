class_name SettingsService
extends Node
## The player's settings (autoload: Settings). Every row of the Settings page in the design book.
##
##     Settings.get_value(&"music")             -> true
##     Settings.set_value(&"music", false)      -> SetResult.OK (saved at once, `changed` fires)
##     Settings.set_value(&"purchases", false)  -> SetResult.NEEDS_GROWN_UP (ask the gate first)
##     Settings.set_value(&"purchases", false, true)   # after the grown-up gate was passed
##
## Settings stay on this phone only (they are not part of the cloud save).

signal changed(key: StringName, value: Variant)

const FILE := "settings.json"

enum SetResult { OK, UNCHANGED, NEEDS_GROWN_UP, INVALID }

## Which changes need the grown-up gate.
enum Gate { NONE, TO_TURN_OFF, ANY_CHANGE }

## Every setting: its default, what values it may take, and whether it needs the grown-up gate.
## "auto" means "follow the phone" (or, for graphics, "let the game pick").
const SCHEMA: Dictionary[StringName, Dictionary] = {
	# Sound
	&"sfx": {"default": true},
	&"sfx_volume": {"default": 0.8, "min": 0.0, "max": 1.0},
	&"music": {"default": true},
	&"music_volume": {"default": 0.5, "min": 0.0, "max": 1.0},
	&"vibration": {"default": true},
	# Graphics and battery
	&"graphics": {"default": &"auto", "options": [&"auto", &"low", &"medium", &"high"]},
	&"fps": {"default": 0, "options": [0, 30, 60]},  # 0 = set by the graphics tier
	&"battery_saver": {"default": false},
	&"motion": {"default": &"auto", "options": [&"auto", &"full", &"reduced"]},
	# Playing
	&"gem_confirm": {"default": true, "gate": Gate.TO_TURN_OFF},
	&"hints": {"default": true},
	&"left_handed": {"default": false},
	&"colour_helpers": {"default": false},
	&"text_size": {"default": &"auto", "options": [&"auto", &"normal", &"large"]},
	# Grown-ups
	&"purchases": {"default": true, "gate": Gate.ANY_CHANGE},
	&"spending_limit": {"default": 0, "options": [0, 5, 10, 20], "gate": Gate.ANY_CHANGE},  # euros a month, 0 = none
	&"rewarded_ads": {"default": true, "gate": Gate.ANY_CHANGE},
	&"trading": {"default": true, "gate": Gate.ANY_CHANGE},
	&"play_reminder": {"default": 0, "options": [0, 30, 45, 60, 90], "gate": Gate.ANY_CHANGE},  # minutes a day
	&"notifications": {"default": false, "gate": Gate.ANY_CHANGE},
}

## Set before the node enters the tree to use fakes.
var storage: Storage
var device: DeviceInfo

var _values: Dictionary[StringName, Variant] = {}
## The tier picked for this phone the first time the game ran (kept so it does not change by itself).
var _detected_tier: StringName = &""


func _ready() -> void:
	if storage == null:
		storage = FileStorage.new()
	if device == null:
		device = DeviceInfo.new()
	load_settings()


func get_value(key: StringName) -> Variant:
	assert(SCHEMA.has(key), "Unknown setting: %s" % key)
	return _values.get(key, SCHEMA[key]["default"])


## True if changing `key` to `value` has to go through the grown-up gate first.
func needs_grown_up(key: StringName, value: Variant) -> bool:
	if not SCHEMA.has(key):
		return false
	match SCHEMA[key].get("gate", Gate.NONE):
		Gate.ANY_CHANGE:
			return true
		Gate.TO_TURN_OFF:
			return value is bool and not value
	return false


## Change a setting. Saves at once and fires `changed`.
## Pass grown_up = true only right after the grown-up gate was answered correctly.
func set_value(key: StringName, value: Variant, grown_up := false) -> SetResult:
	if not SCHEMA.has(key):
		push_warning("Settings: unknown setting %s" % key)
		return SetResult.INVALID
	var clean: Variant = _clean(key, value)
	if typeof(clean) == TYPE_NIL:
		push_warning("Settings: %s cannot be %s" % [key, value])
		return SetResult.INVALID
	if clean == get_value(key):
		return SetResult.UNCHANGED
	if needs_grown_up(key, clean) and not grown_up:
		return SetResult.NEEDS_GROWN_UP
	_values[key] = clean
	_write()
	changed.emit(key, clean)
	return SetResult.OK


## The graphics tier in use right now: battery saver forces Low; a hand-picked tier wins; else the detected one.
func graphics_tier() -> StringName:
	if get_value(&"battery_saver"):
		return GraphicsTier.LOW
	var chosen: StringName = get_value(&"graphics")
	if chosen != &"auto":
		return chosen
	return detected_tier()


## The tier the game picked for this phone (what "Auto" means).
func detected_tier() -> StringName:
	if _detected_tier == &"":
		_detected_tier = GraphicsTier.from_device(device)
		_write()
	return _detected_tier


## Lower the automatic tier by one step (the game was too slow). Never raises it.
func lower_detected_tier() -> void:
	var i := GraphicsTier.ALL.find(detected_tier())
	if i > 0:
		_detected_tier = GraphicsTier.ALL[i - 1]
		_write()
		changed.emit(&"graphics", get_value(&"graphics"))


## Frames per second to aim for: battery saver = 30; otherwise the player's choice, or 30 on Low and 60 above.
func frame_rate() -> int:
	if get_value(&"battery_saver"):
		return 30
	var fps: int = get_value(&"fps")
	if fps != 0:
		return fps
	return 30 if graphics_tier() == GraphicsTier.LOW else 60


## How many particles (confetti, sparkles, steam) to show: Settings page tier table, Low 25%, Medium 60%, High 100%.
func particle_amount() -> float:
	return {GraphicsTier.LOW: 0.25, GraphicsTier.MEDIUM: 0.6}.get(graphics_tier(), 1.0)


func reduced_motion() -> bool:
	match get_value(&"motion"):
		&"full":
			return false
		&"reduced":
			return true
	return device.prefers_reduced_motion()


func large_text() -> bool:
	match get_value(&"text_size"):
		&"normal":
			return false
		&"large":
			return true
	return device.prefers_large_text()


## The volume to actually use (0 when the switch is off). bus is &"sfx" or &"music".
func volume(bus: StringName) -> float:
	if not get_value(bus):
		return 0.0
	return get_value(StringName(String(bus) + "_volume"))


## Put every setting back to its default (used by account deletion and tests).
func reset() -> void:
	_values.clear()
	_write()
	for key: StringName in SCHEMA:
		changed.emit(key, get_value(key))


func load_settings() -> void:
	_values.clear()
	_detected_tier = &""
	var json := JSON.new()
	if not storage.exists(FILE) or json.parse(storage.read_text(FILE)) != OK or not json.data is Dictionary:
		return
	var saved: Dictionary = json.data
	var values: Variant = saved.get("values", {})
	if values is Dictionary:
		for raw_key: Variant in values:
			var key := StringName(str(raw_key))
			if not SCHEMA.has(key):
				continue  # a setting that no longer exists
			var clean: Variant = _clean(key, (values as Dictionary)[raw_key])
			if typeof(clean) != TYPE_NIL:
				_values[key] = clean
	var tier := StringName(str(saved.get("detected_tier", "")))
	if tier in GraphicsTier.ALL:
		_detected_tier = tier


## The value in the setting's own type, or null if it is not allowed.
func _clean(key: StringName, value: Variant) -> Variant:
	var spec: Dictionary = SCHEMA[key]
	var default: Variant = spec["default"]
	match typeof(default):
		TYPE_BOOL:
			return value if value is bool else null
		TYPE_FLOAT:
			if not (value is float or value is int):
				return null
			return clampf(float(value), spec.get("min", 0.0), spec.get("max", 1.0))
		TYPE_INT:
			if not (value is float or value is int):
				return null
			var n := int(value)
			if float(n) != float(value):
				return null
			return n if (spec["options"] as Array).has(n) else null
		TYPE_STRING_NAME:
			if not (value is String or value is StringName):
				return null
			var s := StringName(value)
			return s if (spec["options"] as Array).has(s) else null
	return null


func _write() -> void:
	if storage == null:
		return
	var values := {}
	for key: StringName in _values:
		values[String(key)] = _values[key]
	var out := {"version": 1, "values": values}
	if _detected_tier != &"":
		out["detected_tier"] = String(_detected_tier)
	if not storage.write_text(FILE, JSON.stringify(out)):
		push_warning("Settings: could not save settings")
