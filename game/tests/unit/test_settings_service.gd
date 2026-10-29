extends GutTest
## Settings: the defaults from the Settings page, saving, the grown-up gate, graphics tier and frame rate.

var storage: MemoryStorage
var device: FakeDevice
var settings: SettingsService


func before_each() -> void:
	storage = MemoryStorage.new()
	device = FakeDevice.new()
	settings = _new_settings()


func _new_settings() -> SettingsService:
	var s: SettingsService = autofree(SettingsService.new())
	s.storage = storage
	s.device = device
	s.load_settings()
	return s


func test_defaults_match_the_settings_page() -> void:
	assert_eq(settings.get_value(&"sfx"), true)
	assert_eq(settings.get_value(&"sfx_volume"), 0.8)
	assert_eq(settings.get_value(&"music"), true)
	assert_eq(settings.get_value(&"music_volume"), 0.5)
	assert_eq(settings.get_value(&"vibration"), true)
	assert_eq(settings.get_value(&"graphics"), &"auto")
	assert_eq(settings.get_value(&"battery_saver"), false)
	assert_eq(settings.get_value(&"gem_confirm"), true)
	assert_eq(settings.get_value(&"hints"), true)
	assert_eq(settings.get_value(&"left_handed"), false)
	assert_eq(settings.get_value(&"colour_helpers"), false)
	assert_eq(settings.get_value(&"purchases"), true)
	assert_eq(settings.get_value(&"spending_limit"), 0)
	assert_eq(settings.get_value(&"rewarded_ads"), true)
	assert_eq(settings.get_value(&"trading"), true)
	assert_eq(settings.get_value(&"play_reminder"), 0)
	assert_eq(settings.get_value(&"notifications"), false, "notifications are off by default")


func test_a_change_saves_at_once_and_comes_back() -> void:
	assert_eq(settings.set_value(&"music", false), SettingsService.SetResult.OK)
	assert_eq(settings.set_value(&"sfx_volume", 0.3), SettingsService.SetResult.OK)
	assert_eq(settings.set_value(&"graphics", &"low"), SettingsService.SetResult.OK)
	var again := _new_settings()
	assert_eq(again.get_value(&"music"), false)
	assert_almost_eq(float(again.get_value(&"sfx_volume")), 0.3, 0.0001)
	assert_eq(again.get_value(&"graphics"), &"low")


func test_a_change_is_announced() -> void:
	watch_signals(settings)
	settings.set_value(&"hints", false)
	assert_signal_emitted_with_parameters(settings, "changed", [&"hints", false])
	settings.set_value(&"hints", false)
	assert_signal_emit_count(settings, "changed", 1, "setting the same value again is not a change")


func test_wrong_values_are_refused() -> void:
	assert_eq(settings.set_value(&"music", "yes"), SettingsService.SetResult.INVALID)
	assert_eq(settings.set_value(&"graphics", &"ultra"), SettingsService.SetResult.INVALID)
	assert_eq(settings.set_value(&"fps", 45), SettingsService.SetResult.INVALID)
	assert_eq(settings.set_value(&"no_such_setting", true), SettingsService.SetResult.INVALID)
	settings.set_value(&"music_volume", 7.0)
	assert_eq(settings.get_value(&"music_volume"), 1.0, "volumes are kept between 0 and 1")


func test_grown_up_settings_need_the_gate() -> void:
	for key: StringName in [&"purchases", &"rewarded_ads", &"trading", &"notifications"]:
		var flipped: bool = not settings.get_value(key)
		assert_eq(settings.set_value(key, flipped), SettingsService.SetResult.NEEDS_GROWN_UP, String(key))
		assert_eq(settings.get_value(key), not flipped, "unchanged without the gate")
		assert_eq(settings.set_value(key, flipped, true), SettingsService.SetResult.OK)
	assert_eq(settings.set_value(&"spending_limit", 10), SettingsService.SetResult.NEEDS_GROWN_UP)
	assert_eq(settings.set_value(&"play_reminder", 45), SettingsService.SetResult.NEEDS_GROWN_UP)
	assert_eq(settings.set_value(&"music", false), SettingsService.SetResult.OK, "everyday settings need no gate")


func test_ask_before_spending_gems_only_needs_the_gate_to_turn_off() -> void:
	assert_eq(settings.set_value(&"gem_confirm", false), SettingsService.SetResult.NEEDS_GROWN_UP)
	assert_eq(settings.set_value(&"gem_confirm", false, true), SettingsService.SetResult.OK)
	assert_eq(settings.set_value(&"gem_confirm", true), SettingsService.SetResult.OK, "turning it back on is always allowed")


func test_a_saved_file_with_old_or_broken_values_is_cleaned() -> void:
	storage.files[SettingsService.FILE] = JSON.stringify({"version": 1, "values": {
		"music": false, "graphics": "potato", "old_setting": 3, "spending_limit": 5.0, "fps": 30}})
	var s := _new_settings()
	assert_eq(s.get_value(&"music"), false)
	assert_eq(s.get_value(&"graphics"), &"auto", "unknown value falls back to the default")
	assert_eq(s.get_value(&"spending_limit"), 5, "numbers read from JSON become whole numbers")
	assert_eq(s.get_value(&"fps"), 30)


func test_an_unreadable_settings_file_means_defaults() -> void:
	storage.files[SettingsService.FILE] = "nope"
	var s := _new_settings()
	assert_eq(s.get_value(&"sfx_volume"), 0.8)


func test_auto_graphics_follows_the_phone() -> void:
	device.memory = 1.8
	assert_eq(_new_settings().graphics_tier(), GraphicsTier.LOW)
	storage = MemoryStorage.new()  # a different phone
	device.memory = 5.5
	device.cores = 8
	assert_eq(_new_settings().graphics_tier(), GraphicsTier.HIGH, "a 6 GB phone reports about 5.5 GB")


func test_the_detected_tier_is_remembered() -> void:
	device.memory = 8.0
	assert_eq(settings.graphics_tier(), GraphicsTier.HIGH)
	device.memory = 2.0
	assert_eq(_new_settings().graphics_tier(), GraphicsTier.HIGH, "the same phone keeps its tier")


func test_a_hand_picked_tier_wins_and_battery_saver_wins_over_everything() -> void:
	device.memory = 8.0
	settings.set_value(&"graphics", &"medium")
	assert_eq(settings.graphics_tier(), GraphicsTier.MEDIUM)
	settings.set_value(&"battery_saver", true)
	assert_eq(settings.graphics_tier(), GraphicsTier.LOW)
	assert_eq(settings.frame_rate(), 30)


func test_frame_rate_follows_the_tier_unless_chosen() -> void:
	settings.set_value(&"graphics", &"low")
	assert_eq(settings.frame_rate(), 30)
	settings.set_value(&"graphics", &"high")
	assert_eq(settings.frame_rate(), 60)
	settings.set_value(&"fps", 30)
	assert_eq(settings.frame_rate(), 30)


func test_slow_phones_drop_a_tier_but_never_below_low() -> void:
	device.memory = 4.0
	assert_eq(settings.detected_tier(), GraphicsTier.MEDIUM)
	settings.lower_detected_tier()
	assert_eq(settings.detected_tier(), GraphicsTier.LOW)
	settings.lower_detected_tier()
	assert_eq(settings.detected_tier(), GraphicsTier.LOW)
	assert_eq(_new_settings().detected_tier(), GraphicsTier.LOW, "remembered")


func test_animations_and_text_size_follow_the_phone_on_auto() -> void:
	device.reduced_motion = true
	device.large_text = true
	assert_true(settings.reduced_motion())
	assert_true(settings.large_text())
	settings.set_value(&"motion", &"full")
	settings.set_value(&"text_size", &"normal")
	assert_false(settings.reduced_motion())
	assert_false(settings.large_text())


func test_volume_is_zero_when_switched_off() -> void:
	assert_eq(settings.volume(&"music"), 0.5)
	settings.set_value(&"music", false)
	assert_eq(settings.volume(&"music"), 0.0)


func test_reset_puts_everything_back() -> void:
	settings.set_value(&"music", false)
	settings.set_value(&"trading", false, true)
	settings.reset()
	assert_eq(settings.get_value(&"music"), true)
	assert_eq(_new_settings().get_value(&"trading"), true)
