class_name GodotAudioOutput
extends AudioOutput
## Real speakers: plays the sound pack in res://audio/ through Godot's audio buses "SFX" and "Music".
## At most MAX_VOICES effects at once; when all are busy the quietest one makes room.

const MAX_VOICES := 8
const SFX_DIR := "res://audio/sfx/%s.wav"
const MUSIC_DIR := "res://audio/music/%s.ogg"
const BUS_NAMES: Dictionary[StringName, StringName] = {&"sfx": &"SFX", &"music": &"Music"}

var _host: Node
var _voices: Array[AudioStreamPlayer] = []
var _voice_volume: Array[float] = []
var _streams: Dictionary[StringName, AudioStream] = {}
## Two music players so one song can fade out while the next fades in.
var _music: Array[AudioStreamPlayer] = []
var _music_on := 0
var _bus_tweens: Dictionary[StringName, Tween] = {}


func _init(host: Node) -> void:
	_host = host
	for i in MAX_VOICES:
		var p := AudioStreamPlayer.new()
		p.bus = BUS_NAMES[&"sfx"]
		host.add_child(p)
		_voices.append(p)
		_voice_volume.append(0.0)
	for i in 2:
		var m := AudioStreamPlayer.new()
		m.bus = BUS_NAMES[&"music"]
		host.add_child(m)
		_music.append(m)


func preload_sfx(ids: Array[StringName]) -> void:
	for id in ids:
		_sfx_stream(id)


func play_sfx(id: StringName, volume: float, pitch: float) -> void:
	var stream := _sfx_stream(id)
	if stream == null:
		return
	play_stream(stream, volume, pitch)


func play_stream(stream: AudioStream, volume: float, pitch: float) -> void:
	var busy: Array[bool] = []
	for v in _voices:
		busy.append(v.playing)
	var i := pick_voice(busy, _voice_volume, volume)
	if i < 0:
		return
	var p := _voices[i]
	p.stream = stream
	p.volume_db = linear_to_db(maxf(volume, 0.0001))
	p.pitch_scale = pitch
	_voice_volume[i] = volume
	p.play()


func play_music(id: StringName, fade: float) -> void:
	var path := MUSIC_DIR % id
	if not ResourceLoader.exists(path):
		push_warning("Audio: missing music file %s" % path)
		return
	var stream := load(path) as AudioStream
	if stream is AudioStreamOggVorbis:
		(stream as AudioStreamOggVorbis).loop = true
	_fade_out(_music[_music_on], fade)
	_music_on = 1 - _music_on
	var p := _music[_music_on]
	p.stream = stream
	p.volume_db = -60.0 if fade > 0.0 else 0.0
	p.play()
	if fade > 0.0:
		_host.create_tween().tween_property(p, "volume_db", 0.0, fade)


func stop_music(fade: float) -> void:
	_fade_out(_music[_music_on], fade)


func set_bus_volume(bus: StringName, volume: float, fade: float) -> void:
	var index := AudioServer.get_bus_index(BUS_NAMES.get(bus, &"Master"))
	if index < 0:
		return
	if _bus_tweens.has(bus) and _bus_tweens[bus].is_valid():
		_bus_tweens[bus].kill()
	var target := clampf(volume, 0.0, 1.0)
	if fade <= 0.0:
		_set_bus_linear(index, target)
		return
	var from := db_to_linear(AudioServer.get_bus_volume_db(index)) if not AudioServer.is_bus_mute(index) else 0.0
	var t := _host.create_tween()
	t.tween_method(func(v: float) -> void: _set_bus_linear(index, v), from, target, fade)
	_bus_tweens[bus] = t


func shutdown() -> void:
	for p in _voices + _music:
		p.stop()
		p.stream = null
	_streams.clear()


## Which voice to use for a new sound: a free one, else the quietest one that is quieter
## than the new sound, else -1 (drop the new sound).
static func pick_voice(busy: Array[bool], volumes: Array[float], new_volume: float) -> int:
	var quietest := -1
	for i in busy.size():
		if not busy[i]:
			return i
		if quietest < 0 or volumes[i] < volumes[quietest]:
			quietest = i
	if quietest >= 0 and volumes[quietest] < new_volume:
		return quietest
	return -1


func _set_bus_linear(index: int, v: float) -> void:
	AudioServer.set_bus_mute(index, v <= 0.001)
	AudioServer.set_bus_volume_db(index, linear_to_db(maxf(v, 0.001)))


func _fade_out(p: AudioStreamPlayer, fade: float) -> void:
	if not p.playing:
		return
	if fade <= 0.0:
		p.stop()
		return
	var t := _host.create_tween()
	t.tween_property(p, "volume_db", -60.0, fade)
	t.tween_callback(p.stop)


func _sfx_stream(id: StringName) -> AudioStream:
	if _streams.has(id):
		return _streams[id]
	var path := SFX_DIR % id
	if not ResourceLoader.exists(path):
		push_warning("Audio: missing sound file %s" % path)
		return null
	var s := load(path) as AudioStream
	_streams[id] = s
	return s
