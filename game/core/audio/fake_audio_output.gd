class_name FakeAudioOutput
extends AudioOutput
## Pretend speakers for tests: every request is written down.

var sfx_played: Array[Dictionary] = []
var music_now: StringName = &""
var music_calls: Array[StringName] = []
var bus_volume: Dictionary[StringName, float] = {}
var preloaded: Array[StringName] = []


func preload_sfx(ids: Array[StringName]) -> void:
	preloaded.append_array(ids)


func play_sfx(id: StringName, volume: float, pitch: float) -> void:
	sfx_played.append({"id": id, "volume": volume, "pitch": pitch})


func play_music(id: StringName, _fade: float) -> void:
	music_now = id
	music_calls.append(id)


func stop_music(_fade: float) -> void:
	music_now = &""
	music_calls.append(&"")


func set_bus_volume(bus: StringName, volume: float, _fade: float) -> void:
	bus_volume[bus] = volume


func sfx_ids() -> Array[StringName]:
	var out: Array[StringName] = []
	for s: Dictionary in sfx_played:
		out.append(s["id"])
	return out
