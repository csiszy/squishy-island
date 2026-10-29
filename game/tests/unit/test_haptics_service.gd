extends GutTest
## Vibration: patterns, the Vibration switch, phones without a motor.

var vibrator: FakeVibrator
var device: FakeDevice
var settings: SettingsService
var haptics: HapticsService


func before_each() -> void:
	vibrator = FakeVibrator.new()
	device = FakeDevice.new()
	settings = autofree(SettingsService.new())
	settings.storage = MemoryStorage.new()
	settings.device = device
	settings.load_settings()
	haptics = HapticsService.new()
	haptics.vibrator = vibrator
	haptics.device = device
	haptics.settings = settings
	add_child_autofree(haptics)
	haptics.set_process(false)  # the test moves time by hand


func test_a_light_tap_is_one_short_buzz() -> void:
	haptics.play(&"light")
	assert_eq(vibrator.durations(), [10] as Array[int])


func test_big_reveal_is_three_pulses_spread_over_time() -> void:
	haptics.play(&"big_reveal")
	assert_eq(vibrator.durations(), [40] as Array[int], "first pulse straight away")
	haptics.advance(0.1)
	assert_eq(vibrator.buzzes.size(), 1, "second pulse waits for the pause")
	haptics.advance(0.04)
	assert_eq(vibrator.buzzes.size(), 2)
	haptics.advance(0.2)
	assert_eq(vibrator.durations(), [40, 40, 70] as Array[int])


func test_nothing_when_vibration_is_off() -> void:
	settings.set_value(&"vibration", false)
	haptics.play(&"medium")
	haptics.buzz(80)
	assert_eq(vibrator.buzzes.size(), 0)


func test_switching_vibration_on_buzzes_once() -> void:
	settings.set_value(&"vibration", false)
	settings.set_value(&"vibration", true)
	assert_eq(vibrator.durations(), [10] as Array[int])


func test_nothing_on_a_phone_without_a_motor() -> void:
	device.vibrator = false
	haptics.play(&"heart_lost")
	assert_false(haptics.is_available())
	assert_eq(vibrator.buzzes.size(), 0)


func test_game_buzzes_are_kept_short() -> void:
	haptics.buzz(5000)
	assert_eq(vibrator.durations(), [500] as Array[int])


func test_unknown_pattern_does_nothing() -> void:
	haptics.play(&"earthquake")
	assert_eq(vibrator.buzzes.size(), 0)
