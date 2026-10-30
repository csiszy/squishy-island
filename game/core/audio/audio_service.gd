class_name AudioService
extends Node
## Sound effects and music (autoload: Audio). The rules come from the Sound page of the design book.
##
##     Audio.play(&"tap")              # a sound effect (ids: data/audio.json, files: audio/sfx/)
##     Audio.play(&"tick", 1.2)        # a bit higher (results counters climb in pitch)
##     Audio.music(&"city")            # switch song, fading over about a second
##     Audio.duck(); Audio.unduck()    # music quieter during results, ads, Bao speaking
##
## Rules: the same effect never plays twice within 40 ms; frequent effects (taps, coins) shift
## pitch a little each time; music always sits under the effects; Music off stops the music
## engine (and it starts again where the player is when switched back on).

const CATALOG_PATH := "res://data/audio.json"
const REPEAT_GAP_MS := 40
const PITCH_WOBBLE := 0.05
## Effects that play so often they get the pitch wobble so they never get tiring.
const WOBBLY: Array[StringName] = [&"tap", &"back", &"coin", &"coinsCount", &"squish", &"boing"]
const MUSIC_FADE := 1.0
const DUCK_LEVEL := 0.35
const DUCK_FADE := 0.25

## Set before the node enters the tree to use fakes.
var output: AudioOutput
var settings: SettingsService
## {"sfx": {id: info}, "music": {id: info}}; read from data/audio.json if not set.
var catalog: Dictionary = {}
## Milliseconds clock; tests replace it.
var clock: Callable = Time.get_ticks_msec
var rng := RandomNumberGenerator.new()

var _last_played: Dictionary[StringName, int] = {}
var _wanted_music: StringName = &""
var _playing_music: StringName = &""
var _ducks := 0
var _warned: Dictionary[StringName, bool] = {}


func _ready() -> void:
	if settings == null:
		settings = get_node("/root/Settings") as SettingsService
	if output == null:
		output = GodotAudioOutput.new(self)
	if catalog.is_empty():
		catalog = load_catalog(CATALOG_PATH)
	settings.changed.connect(_on_setting_changed)
	_apply_volumes(0.0)
	var ids: Array[StringName] = []
	for id: Variant in sfx_catalog():
		ids.append(StringName(str(id)))
	output.preload_sfx(ids)


func _exit_tree() -> void:
	if output != null:
		output.shutdown()


## Play a sound effect. Returns false if it was skipped (switched off, too soon, unknown).
func play(id: StringName, pitch := 1.0, loudness := 1.0) -> bool:
	if not sfx_catalog().has(id):
		_warn_once(id, "Audio: unknown sound effect %s" % id)
		return false
	if not settings.get_value(&"sfx"):
		return false
	var now: int = clock.call()
	if _last_played.has(id) and now - _last_played[id] < REPEAT_GAP_MS:
		return false
	_last_played[id] = now
	if id in WOBBLY:
		pitch *= 1.0 + rng.randf_range(-PITCH_WOBBLE, PITCH_WOBBLE)
	output.play_sfx(id, clampf(loudness, 0.0, 1.0), pitch)
	return true


## Play a sound that is not in the pack (a minigame's own blips). Follows the sound-effects switch and volume.
func play_stream(stream: AudioStream, pitch := 1.0, loudness := 1.0) -> bool:
	if stream == null or not settings.get_value(&"sfx"):
		return false
	output.play_stream(stream, clampf(loudness, 0.0, 1.0), pitch)
	return true


## Switch the background song (&"" for silence). Does nothing if it is already playing.
func music(id: StringName) -> void:
	if id != &"" and not music_catalog().has(id):
		_warn_once(id, "Audio: unknown music track %s" % id)
		return
	_wanted_music = id
	_sync_music(MUSIC_FADE)


func current_music() -> StringName:
	return _playing_music


## Make the music quieter (results screens, ads, story narration, Bao's voice). Calls can nest.
func duck() -> void:
	_ducks += 1
	_apply_volumes(DUCK_FADE)


func unduck() -> void:
	_ducks = maxi(0, _ducks - 1)
	_apply_volumes(DUCK_FADE)


func is_ducked() -> bool:
	return _ducks > 0


func sfx_catalog() -> Dictionary:
	return catalog.get("sfx", {})


func music_catalog() -> Dictionary:
	return catalog.get("music", {})


## Reads data/audio.json into {"sfx": {id: info}, "music": {id: info}}.
static func load_catalog(path: String) -> Dictionary:
	var out := {"sfx": {}, "music": {}}
	if not FileAccess.file_exists(path):
		push_warning("Audio: %s is missing (run tools/export_data)" % path)
		return out
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if not parsed is Dictionary:
		push_warning("Audio: %s is not valid JSON" % path)
		return out
	for group: String in ["sfx", "music"]:
		var list: Variant = (parsed as Dictionary).get(group, [])
		if list is Array:
			for item: Variant in list:
				if item is Dictionary and (item as Dictionary).has("id"):
					(out[group] as Dictionary)[StringName(str((item as Dictionary)["id"]))] = item
	return out


func _sync_music(fade: float) -> void:
	var target := _wanted_music if settings.get_value(&"music") else &""
	if target == _playing_music:
		return
	if target == &"":
		output.stop_music(fade)
	else:
		output.play_music(target, fade)
	_playing_music = target


func _apply_volumes(fade: float) -> void:
	output.set_bus_volume(&"sfx", settings.volume(&"sfx"), 0.0)
	var m := settings.volume(&"music") * (DUCK_LEVEL if _ducks > 0 else 1.0)
	output.set_bus_volume(&"music", m, fade)


func _on_setting_changed(key: StringName, _value: Variant) -> void:
	if key in [&"sfx", &"sfx_volume", &"music", &"music_volume"]:
		_apply_volumes(0.0)
	if key == &"music":
		_sync_music(MUSIC_FADE)


func _warn_once(id: StringName, message: String) -> void:
	if not _warned.has(id):
		_warned[id] = true
		push_warning(message)
