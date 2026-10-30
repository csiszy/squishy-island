extends GutTest
## Sound rules from the Sound page: no repeats within 40 ms, pitch wobble, ducking, switches, music engine off.

var out: FakeAudioOutput
var settings: SettingsService
var audio: AudioService
var now_ms: Array[int] = [1000]


func before_each() -> void:
	out = FakeAudioOutput.new()
	settings = autofree(SettingsService.new())
	settings.storage = MemoryStorage.new()
	settings.device = FakeDevice.new()
	settings.load_settings()
	audio = AudioService.new()
	audio.output = out
	audio.settings = settings
	audio.catalog = {
		"sfx": {&"tap": {}, &"buy": {}, &"tick": {}},
		"music": {&"city": {}, &"shop": {}},
	}
	audio.clock = func() -> int: return now_ms[0]
	audio.rng.seed = 1
	add_child_autofree(audio)


func test_effects_are_preloaded() -> void:
	assert_eq(out.preloaded.size(), 3)


func test_an_effect_plays() -> void:
	assert_true(audio.play(&"buy"))
	assert_eq(out.sfx_ids(), [&"buy"] as Array[StringName])
	assert_eq(out.sfx_played[0]["pitch"], 1.0, "rare sounds keep their pitch")


func test_the_same_effect_never_plays_twice_within_40_ms() -> void:
	audio.play(&"tick")
	now_ms[0] += 39
	assert_false(audio.play(&"tick"))
	now_ms[0] += 1
	assert_true(audio.play(&"tick"))
	assert_true(audio.play(&"buy"), "a different sound is fine")
	assert_eq(out.sfx_played.size(), 3)


func test_frequent_effects_wobble_in_pitch() -> void:
	var pitches: Array[float] = []
	for i in 5:
		now_ms[0] += 100
		audio.play(&"tap")
		pitches.append(out.sfx_played[-1]["pitch"])
	for p in pitches:
		assert_between(p, 1.0 - AudioService.PITCH_WOBBLE, 1.0 + AudioService.PITCH_WOBBLE)
	assert_ne(pitches[0], pitches[1])


func test_effects_switch() -> void:
	settings.set_value(&"sfx", false)
	assert_false(audio.play(&"buy"))
	assert_eq(out.bus_volume[&"sfx"], 0.0)
	settings.set_value(&"sfx", true)
	assert_eq(out.bus_volume[&"sfx"], 0.8)


func test_unknown_effects_are_ignored() -> void:
	assert_false(audio.play(&"kaboom"))
	assert_eq(out.sfx_played.size(), 0)


func test_music_switches_tracks_once() -> void:
	audio.music(&"city")
	audio.music(&"city")
	audio.music(&"shop")
	assert_eq(out.music_calls, [&"city", &"shop"] as Array[StringName])
	assert_eq(audio.current_music(), &"shop")


func test_music_off_stops_the_engine_and_on_resumes_the_right_song() -> void:
	audio.music(&"city")
	settings.set_value(&"music", false)
	assert_eq(out.music_now, &"")
	audio.music(&"shop")
	assert_eq(out.music_now, &"", "still silent while off")
	settings.set_value(&"music", true)
	assert_eq(out.music_now, &"shop", "comes back with the song for where the player is now")


func test_ducking_makes_music_quieter_and_nests() -> void:
	audio.music(&"city")
	assert_eq(out.bus_volume[&"music"], 0.5)
	audio.duck()
	assert_almost_eq(out.bus_volume[&"music"], 0.5 * AudioService.DUCK_LEVEL, 0.0001)
	audio.duck()
	audio.unduck()
	assert_true(audio.is_ducked(), "still ducked: one duck is left")
	audio.unduck()
	assert_eq(out.bus_volume[&"music"], 0.5)
	audio.unduck()
	assert_false(audio.is_ducked())


func test_music_volume_follows_the_slider() -> void:
	settings.set_value(&"music_volume", 0.2)
	assert_almost_eq(out.bus_volume[&"music"], 0.2, 0.0001)


func test_a_new_sound_takes_a_free_voice_first() -> void:
	var busy: Array[bool] = [true, false, true]
	var vol: Array[float] = [0.1, 0.9, 0.5]
	assert_eq(GodotAudioOutput.pick_voice(busy, vol, 0.3), 1)


func test_when_all_voices_are_busy_the_quietest_makes_room() -> void:
	var busy: Array[bool] = [true, true, true]
	var vol: Array[float] = [0.6, 0.2, 0.9]
	assert_eq(GodotAudioOutput.pick_voice(busy, vol, 0.5), 1)
	assert_eq(GodotAudioOutput.pick_voice(busy, vol, 0.1), -1, "a sound quieter than all others is dropped")


func test_the_real_catalog_lists_every_effect_and_song() -> void:
	var real := AudioService.load_catalog(AudioService.CATALOG_PATH)
	assert_eq((real["sfx"] as Dictionary).size(), 38)
	assert_eq((real["music"] as Dictionary).size(), 14)
	for id: StringName in real["sfx"]:
		assert_true(ResourceLoader.exists(GodotAudioOutput.SFX_DIR % id), "file for effect %s" % id)
	for id: StringName in real["music"]:
		assert_true(ResourceLoader.exists(GodotAudioOutput.MUSIC_DIR % id), "file for song %s" % id)
