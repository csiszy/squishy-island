class_name KitTone
extends RefCounted
## The prototypes' little synthesiser (sfx / noise in prototypes/engine.js) as ready-made sounds: a tone with a
## falling volume and an optional pitch slide, or a short noise burst. Made once and kept.

const RATE := 22050

static var _cache: Dictionary = {}


static func make(freq: float, dur: float, wave: StringName, slide := 0.0) -> AudioStreamWAV:
	var key := "%s|%s|%s|%s" % [snappedf(freq, 1.0), snappedf(dur, 0.005), wave, snappedf(slide, 0.01)]
	if _cache.has(key):
		return _cache[key]
	var n := int(RATE * (dur + 0.02))
	var data := PackedByteArray()
	data.resize(n * 2)
	var phase := 0.0
	var end_freq := maxf(40.0, freq * slide) if slide > 0.0 else freq
	for i in n:
		var u := minf(1.0, float(i) / (RATE * dur))
		var f := freq * pow(end_freq / freq, u) if slide > 0.0 else freq
		phase = fmod(phase + f / RATE, 1.0)
		var s := 0.0
		match wave:
			&"square":
				s = 1.0 if phase < 0.5 else -1.0
			&"triangle":
				s = 4.0 * absf(phase - 0.5) - 1.0
			&"sawtooth":
				s = 2.0 * phase - 1.0
			_:
				s = sin(phase * TAU)
		var gain := pow(0.0001, u) if i < RATE * dur else 0.0
		data.encode_s16(i * 2, int(clampf(s * gain * 0.25, -1.0, 1.0) * 32767.0))
	var w := _wav(data)
	_cache[key] = w
	return w


static func noise(dur: float, highpass := 4000.0) -> AudioStreamWAV:
	var key := "noise|%s|%s" % [snappedf(dur, 0.005), snappedf(highpass, 10.0)]
	if _cache.has(key):
		return _cache[key]
	var n := int(RATE * dur)
	var data := PackedByteArray()
	data.resize(n * 2)
	var r := RandomNumberGenerator.new()
	r.seed = 7
	var k := exp(-TAU * highpass / RATE)
	var prev_in := 0.0
	var prev_out := 0.0
	for i in n:
		var x := r.randf_range(-1.0, 1.0) * (1.0 - float(i) / n)
		var y := k * (prev_out + x - prev_in)
		prev_in = x
		prev_out = y
		data.encode_s16(i * 2, int(clampf(y * 0.5, -1.0, 1.0) * 32767.0))
	var w := _wav(data)
	_cache[key] = w
	return w


static func _wav(data: PackedByteArray) -> AudioStreamWAV:
	var w := AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS
	w.mix_rate = RATE
	w.stereo = false
	w.data = data
	return w
