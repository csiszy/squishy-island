class_name HapticsService
extends Node
## Short buzzes for hits, rewards and mistakes (autoload: Haptics).
##
##     Haptics.play(&"light")        # a button tap
##     Haptics.play(&"big_reveal")   # an Epic or Legendary from a box
##
## Does nothing when Vibration is off in Settings or the phone cannot vibrate.
## Which moment uses which pattern: the "Where sounds play" table on the Sound page.

## Each pattern: buzz ms, pause ms, buzz ms, ... and how strong (0..1).
const PATTERNS: Dictionary[StringName, Dictionary] = {
	&"light": {"steps": [10], "strength": 0.4},  # button taps, decor placed, unlock, coins spent, new best
	&"medium": {"steps": [30], "strength": 0.7},  # ta-da after building, Gems spent, box pops open
	&"big_reveal": {"steps": [40, 90, 40, 90, 70], "strength": 0.9},  # Epic / Legendary: three pulses
	&"heart_lost": {"steps": [80], "strength": 0.6},
	&"run_over": {"steps": [120], "strength": 0.6},
}

## Set before the node enters the tree to use fakes.
var vibrator: Vibrator
var device: DeviceInfo
var settings: SettingsService

## Buzzes waiting for their turn: [seconds from now, duration_ms, strength].
var _queue: Array[Array] = []


func _ready() -> void:
	if vibrator == null:
		vibrator = Vibrator.new()
	if device == null:
		device = DeviceInfo.new()
	if settings == null:
		settings = get_node("/root/Settings") as SettingsService
	settings.changed.connect(_on_setting_changed)


func _process(delta: float) -> void:
	advance(delta)


func is_available() -> bool:
	return device.can_vibrate()


func play(pattern: StringName) -> void:
	if not PATTERNS.has(pattern):
		push_warning("Haptics: unknown pattern %s" % pattern)
		return
	var p: Dictionary = PATTERNS[pattern]
	var steps: Array = p["steps"]
	var at := 0.0
	for i in steps.size():
		var ms: int = steps[i]
		if i % 2 == 0:
			_queue.append([at, ms, float(p["strength"])])
		at += ms / 1000.0
	advance(0.0)


## A single buzz of any length (minigames use this through their context).
func buzz(duration_ms: int, strength := 0.6) -> void:
	_queue.append([0.0, clampi(duration_ms, 1, 500), clampf(strength, 0.0, 1.0)])
	advance(0.0)


## Move time forward: fire every queued buzz that is due. Tests call this directly.
func advance(seconds: float) -> void:
	var still: Array[Array] = []
	for item: Array in _queue:
		var due: float = item[0] - seconds
		if due <= 0.0:
			_fire(item[1], item[2])
		else:
			still.append([due, item[1], item[2]])
	_queue = still


func _fire(duration_ms: int, strength: float) -> void:
	if not settings.get_value(&"vibration") or not is_available():
		return
	vibrator.vibrate(duration_ms, strength)


## The vibration switch buzzes once when it is turned on, so you feel it works.
func _on_setting_changed(key: StringName, value: Variant) -> void:
	if key == &"vibration" and value == true:
		play(&"light")
