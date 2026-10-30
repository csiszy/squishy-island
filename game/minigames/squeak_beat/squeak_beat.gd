extends KitGame
## SQUEAK BEAT (Squeak Stage): a Piano Tiles style game with real songs. Squishies slide down four columns; tap
## the lowest one (or anywhere in its column) any time once it is its turn (no other squishy below it). A squishy
## sliding off the bottom, a tap on the wrong column or letting go of a long squishy too early each cost one of
## 3 hearts. Every tap plays the next note of the tune. 30 tracks, one complete song each; level n = track n (the
## host shows the track list and opens tracks with stars). Ported from prototypes/games/squeak-beat.js.
##
## The songs come ready-made from the prototype's own band (tools/render_squeak_beat.js): charts.json (every
## squishy: time, column, hold, pitch), songs/track_NN.ogg (the backing band) and notes/<voice>_<pitch>.ogg (one
## melody note per pitch, played the moment you tap). Phones play sound a little late, differently on each one,
## so the clock follows the song as it is heard, and the game learns how early or late this player's taps land
## and moves the PERFECT window to match (ctx.store "offset", a few hundredths of a second).
##
## Result: score = points, metric = accuracy in % (squishies tapped ÷ all squishies), won = the song finished,
## level = track, stars from accuracy (finish ★, 85% ★★, 95% ★★★).

const HERE := "res://minigames/squeak_beat/"
const NL := 4
const LW := 84.0
const LX0 := 12.0
const HIT_Y := 546.0
const TOP_Y := 60.0
const LANE_COL: Array[Color] = [Color("#FF6FA3"), Color("#FFC93C"), Color("#5ACB7A"), Color("#4A9BFF")]
const STYLE_BG := {"pop": ["#2E2452", "#5A3A8C"], "disco": ["#3A1F5C", "#8C2F7A"], "swing": ["#1F3550", "#3F6E8C"],
	"chill": ["#22403F", "#4A7A6E"], "march": ["#4A2A1F", "#8C5A2F"]}
## A tap closer than this to the line is PERFECT (Sea Squish helpers widen it: perk "wider_window").
const PERFECT := 0.09
const START_AT := -0.35
const VOICES := 10
const LANE_KEYS := [[KEY_D, KEY_1, KEY_LEFT], [KEY_F, KEY_2, KEY_DOWN], [KEY_J, KEY_3, KEY_UP], [KEY_K, KEY_4, KEY_RIGHT]]

static var _charts: Array = []

var trk: Dictionary = {}
var tiles: Array[Dictionary] = []
var lives := 3
var dead := false
var hurt := 0.0
var combo := 0
var best_combo := 0
var acc := 0.0
var counts := {"perfect": 0, "nice": 0, "miss": 0}
## The song clock: seconds since the song's first beat (negative during the count-in).
var song_t := START_AT
## How late this player's taps land, learned while playing (seconds; the PERFECT window moves with it).
var offset := 0.0
var _pressed := [0, 0, 0, 0]
var _flash := [0.0, 0.0, 0.0, 0.0]
var _squish := [0.0, 0.0, 0.0, 0.0]
var _judge := {}
var _holds := {}
var _ptr := {}
var _errors: Array[float] = []
var _won := false
var _song: AudioStreamPlayer
var _voices: Array[AudioStreamPlayer] = []
var _fades := {}
var _notes := {}
var _next_voice := 0
var _last_pos := -1.0
var _stuck := 0


## Every track's chart (from charts.json): name, tempo, length, band, tiles [time, column, hold, pitch, pair].
static func charts() -> Array:
	if _charts.is_empty():
		var data: Variant = JSON.parse_string(FileAccess.get_file_as_string(HERE + "charts.json"))
		if data is Dictionary:
			_charts = (data as Dictionary).get("tracks", [])
	return _charts


static func mult(c: int) -> float:
	return minf(2.0, 1.0 + floorf(c / 20.0) * 0.25)


func _init_run(level: int) -> void:
	var list := charts()
	var i := clampi(level - 1, 0, list.size() - 1)
	trk = list[i]
	trk["i"] = i
	tiles.clear()
	for a: Array in trk["tiles"]:
		tiles.append({"t": float(a[0]), "lane": int(a[1]), "hold": float(a[2]), "pitch": int(a[3]), "end": float(a[0]) + float(a[2]),
			"hit": false, "miss": false, "holding": false, "broken": false, "done": false})
	lives = 3
	dead = false
	hurt = 0.0
	combo = 0
	best_combo = 0
	acc = 0.0
	counts = {"perfect": 0, "nice": 0, "miss": 0}
	song_t = START_AT
	offset = clampf(float(ctx.store.get("offset", 0.0)), -0.05, 0.2)
	_pressed = [0, 0, 0, 0]
	_flash = [0.0, 0.0, 0.0, 0.0]
	_squish = [0.0, 0.0, 0.0, 0.0]
	_judge.clear()
	_holds.clear()
	_ptr.clear()
	_errors.clear()
	_won = false
	_stop_sound()


func start(level := 0) -> void:
	super(level)
	_start_sound()


func pause() -> void:
	super()
	_sync_song()


func resume() -> void:
	super()
	_sync_song()


func advance(delta: float) -> void:
	super(delta)
	_sync_song()


func can_revive() -> bool:
	return dead


## After the ad: 1 heart, and the next squishies are skipped so there is a moment to get ready.
func revive() -> void:
	lives = 1
	dead = false
	for tl in tiles:
		if not tl["hit"] and not tl["miss"] and tl["t"] < song_t + 1.2:
			tl["hit"] = true
			tl["skip"] = true


func _update(dt: float) -> void:
	song_t += dt
	_follow_song()
	var now := song_t
	for tl in tiles:
		if not tl["hit"] and not tl["miss"] and now - tl["t"] > 0.25:
			tl["miss"] = true
			counts["miss"] += 1
			_mistake(tl["lane"], &"squeak_beat.miss")
	for lane: int in _holds.keys():
		var h: Dictionary = _holds[lane]
		while h["tick"] <= minf(now, h["end"]):
			add_score(roundi(20 * mult(combo)))
			h["tick"] += float(trk["spb"]) / 4.0
		if now >= h["end"]:
			_end_hold(lane, h)
	for l in NL:
		_flash[l] = maxf(0.0, _flash[l] - dt * 5.0)
		_squish[l] = maxf(0.0, _squish[l] - dt * 4.0)
		if _judge.has(l):
			_judge[l]["life"] -= dt
			if _judge[l]["life"] <= 0.0:
				_judge.erase(l)
	hurt = maxf(0.0, hurt - dt * 2.5)
	if lives <= 0 and not dead:
		dead = true
		end()
	elif not dead and now > float(trk["len"]):
		_won = true
		_finish()


## The squishy whose turn it is: the lowest one not tapped yet (two side by side share the turn).
func next_time() -> float:
	var next_t := INF
	for tl in tiles:
		if not tl["hit"] and not tl["miss"] and tl["t"] < next_t:
			next_t = tl["t"]
	return next_t


func press(lane: int) -> void:
	var now := song_t - offset
	_pressed[lane] += 1
	_flash[lane] = 1.0
	var next_t := next_time()
	var cand: Dictionary = {}
	if next_t - now <= float(trk["travel"]) * 1.08:
		for tl in tiles:
			if tl["lane"] == lane and not tl["hit"] and not tl["miss"] and absf(tl["t"] - next_t) < 0.001:
				cand = tl
				break
	if cand.is_empty():
		_mistake(lane, &"squeak_beat.oops")
		tone(170, 0.1, &"triangle", 0.07, 0.65)
		return
	var e := absf(cand["t"] - now)
	var on_beat := e < PERFECT + ctx.perk(&"wider_window")
	if e < 0.15:
		_errors.append(now - cand["t"])
	cand["hit"] = true
	cand["hit_at"] = now
	acc += 1.0
	combo += 1
	best_combo = maxi(best_combo, combo)
	counts["perfect" if on_beat else "nice"] += 1
	add_score(roundi((300 if on_beat else 200) * mult(combo)))
	_judge[lane] = {"txt": ctx.t(&"squeak_beat.perfect" if on_beat else &"squeak_beat.nice"), "col": Color("#FFD54A") if on_beat else Color("#7ED3B2"), "life": 0.45}
	cand["snd"] = _play_note(cand, 1.0 if on_beat else 0.9)
	if cand["hold"] > 0.0:
		cand["holding"] = true
		_holds[lane] = cand
		cand["tick"] = now + float(trk["spb"]) / 4.0
	if on_beat:
		burst(Vector2(_lane_x(lane), HIT_Y), LANE_COL[lane], 7, 130)
	_squish[lane] = 1.0


func release(lane: int) -> void:
	_pressed[lane] = maxi(0, _pressed[lane] - 1)
	if _pressed[lane] > 0 or not _holds.has(lane):
		return
	var h: Dictionary = _holds[lane]
	var now := song_t - offset
	if now < h["end"] - 0.12:
		acc += clampf((now - h["hit_at"]) / maxf(0.1, h["end"] - h["hit_at"]), 0.0, 1.0)
		h["broken"] = true
		h["holding"] = false
		_holds.erase(lane)
		_stop_note(h)
		_mistake(lane, &"squeak_beat.let_go")
	else:
		_end_hold(lane, h)


func _end_hold(lane: int, h: Dictionary) -> void:
	acc += 1.0
	h["holding"] = false
	h["done"] = true
	_holds.erase(lane)
	add_score(roundi(50 * mult(combo)))
	_stop_note(h)
	burst(Vector2(_lane_x(lane), HIT_Y - 20), Color.WHITE, 6, 90)
	_judge[lane] = {"txt": ctx.t(&"squeak_beat.hold"), "col": Color("#FFD54A"), "life": 0.45}


func _mistake(lane: int, key: StringName) -> void:
	lives = maxi(0, lives - 1)
	combo = 0
	_judge[lane] = {"txt": ctx.t(key), "col": Color("#FF8FB8"), "life": 0.5}
	hurt = 1.0
	shake(0.2)
	ctx.buzz(60)


func _make_result() -> MinigameResult:
	var ratio := minf(1.0, acc / maxf(1.0, float(trk["acc_max"])))
	var stars := 0
	if _won:
		stars = 3 if ratio >= 0.95 else (2 if ratio >= 0.85 else 1)
	var r := MinigameResult.make(score, roundi(ratio * 100.0), t)
	r.won = _won
	r.level = int(trk["i"]) + 1
	r.stars = stars
	r.note = ctx.t(&"squeak_beat.note", {"perfect": counts["perfect"], "nice": counts["nice"], "miss": counts["miss"], "combo": best_combo})
	_learn_offset()
	_stop_sound(0.6)
	return r


## Taps near the line tell how late this phone (and player) is: move the PERFECT window halfway towards it.
func _learn_offset() -> void:
	if _errors.size() < 12:
		return
	var sum := 0.0
	for e in _errors:
		sum += e
	ctx.store_set("offset", snappedf(clampf(offset + sum / _errors.size() * 0.5, -0.05, 0.2), 0.001))


# ---------------------------------------------------------------- sound

func _start_sound() -> void:
	if ctx.sound_bus == &"":
		return
	if _song == null:
		_song = AudioStreamPlayer.new()
		_song.bus = ctx.sound_bus
		add_child(_song)
		for i in VOICES:
			var p := AudioStreamPlayer.new()
			p.bus = ctx.sound_bus
			add_child(p)
			_voices.append(p)
	var path := HERE + "songs/track_%02d.ogg" % (int(trk["i"]) + 1)
	var song := load(path) as AudioStream if ResourceLoader.exists(path) else null
	for tl in tiles:
		var key := _note_key(tl)
		if not _notes.has(key) and ResourceLoader.exists(HERE + "notes/%s.ogg" % key):
			_notes[key] = load(HERE + "notes/%s.ogg" % key)
	if song != null:
		_song.stream = song
		_song.volume_db = 0.0
		_song.play(maxf(0.0, float(trk["lead"]) + song_t))


func _note_key(tl: Dictionary) -> String:
	return "%s_%d%s" % [trk["tone"], tl["pitch"], "_hold" if tl["hold"] > 0.0 else ""]


## The song keeps time: the clock drifts gently towards what the player hears (or jumps, if far off). If the
## phone's sound is not moving at all (no speaker), the game's own clock carries on.
func _follow_song() -> void:
	if _song == null or not _song.playing or _song.stream_paused:
		return
	var pos := _song.get_playback_position()
	_stuck = _stuck + 1 if pos == _last_pos else 0
	_last_pos = pos
	if _stuck > 20:
		return
	var heard := pos + AudioServer.get_time_since_last_mix() - AudioServer.get_output_latency() - float(trk["lead"])
	var drift := heard - song_t
	if absf(drift) > 0.12:
		song_t = heard
	else:
		song_t += drift * 0.1


## The song only plays while the game does (paused, or waiting for "keep going?": it waits too).
func _sync_song() -> void:
	if _song != null and _song.playing:
		_song.stream_paused = not (state == State.PLAY and not _paused)
	for p in _voices:
		if p.playing:
			p.stream_paused = _paused or state == State.WAITING


func _play_note(tl: Dictionary, loud: float) -> AudioStreamPlayer:
	var stream: AudioStream = _notes.get(_note_key(tl))
	if stream == null or _voices.is_empty():
		return null
	var busy := []
	for h: Dictionary in _holds.values():
		busy.append(h.get("snd"))
	var p := _voices[_next_voice]
	for i in VOICES:
		p = _voices[(_next_voice + i) % VOICES]
		if not p in busy:
			_next_voice = (_next_voice + i + 1) % VOICES
			break
	if _fades.has(p) and (_fades[p] as Tween).is_valid():
		(_fades[p] as Tween).kill()
	p.stream = stream
	p.volume_db = linear_to_db(loud)
	p.play()
	return p


func _stop_note(h: Dictionary) -> void:
	var p: AudioStreamPlayer = h.get("snd")
	if p == null or not p.playing:
		return
	var tw := create_tween()
	tw.tween_property(p, "volume_db", -40.0, 0.12)
	tw.tween_callback(p.stop)
	_fades[p] = tw


func _stop_sound(fade := 0.0) -> void:
	for p: AudioStreamPlayer in _voices + ([_song] if _song != null else []):
		if not p.playing:
			continue
		if fade > 0.0 and is_inside_tree():
			var tw := create_tween()
			tw.tween_property(p, "volume_db", -40.0, fade)
			tw.tween_callback(p.stop)
		else:
			p.stop()


# ---------------------------------------------------------------- input

func _lane_x(l: int) -> float:
	return LX0 + LW * l + LW / 2.0


func _down(p: Vector2, id: int) -> void:
	var lane := clampi(floori((p.x - LX0) / LW), 0, NL - 1)
	_ptr[id] = lane
	press(lane)


func _up(_p: Vector2, id: int) -> void:
	if not _ptr.has(id):
		return
	var lane: int = _ptr[id]
	_ptr.erase(id)
	release(lane)


func _key(keycode: Key, pressed: bool) -> bool:
	for lane in NL:
		if keycode in LANE_KEYS[lane]:
			if pressed:
				press(lane)
			else:
				release(lane)
			return true
	return false


# ---------------------------------------------------------------- drawing

func _y_at(time: float) -> float:
	return TOP_Y + (HIT_Y - TOP_Y) * (1.0 - (time - song_t) / float(trk["travel"]))


func _draw_game() -> void:
	var now := song_t
	var cols: Array = STYLE_BG.get(trk["style"], STYLE_BG["pop"])
	vgradient(view_rect, Color(cols[0]), Color(cols[1]))
	for i in 22:
		rect(float((i * 83) % 360), 60.0 + (i * 137) % 460, 2, 2, Color("#FFF3B0", 0.25 + 0.45 * absf(sin(t * 1.3 + i))))
	var spb: float = trk["spb"]
	var ph := fposmod(now, spb) / spb
	rect(view_rect.position.x, 52, view_rect.size.x, view_rect.end.y - 52, Color(1, 1, 1, 0.12 * (1.0 - ph)))
	# lanes
	for l in NL:
		var c := LANE_COL[l]
		c.a = 0.13 + _flash[l] * 0.22 + (0.12 if _holds.has(l) else 0.0)
		rr(LX0 + l * LW + 3, 58, LW - 6, 572, 16, c, null)
	rect(8, HIT_Y - 2, W - 16, 4, Color(1, 1, 1, 0.92))
	var next_t := next_time()
	# hold stripes first, then the squishies on top
	for tl in tiles:
		if tl["hold"] <= 0.0 or tl["miss"] or tl["broken"] or tl["done"]:
			continue
		var y1 := minf(HIT_Y, _y_at(tl["t"])) if tl["holding"] else _y_at(tl["t"])
		var y2 := maxf(TOP_Y - 40, _y_at(tl["end"]))
		if y1 < TOP_Y - 40 or y2 > H:
			continue
		var x := _lane_x(tl["lane"])
		var c := LANE_COL[tl["lane"]]
		c.a = 0.75
		rr(x - 15, y2, 30, maxf(8, y1 - y2), 15, c, Color(1, 1, 1, 0.75), 3)
		rect(x - 3, y2 + 10, 6, maxf(0, y1 - y2 - 20), Color(1, 1, 1, 0.7))
		star(x, y2 + 4, 9, 4, Color("#FFF3B0"), INK, 1.5)
	var band: Array = trk["sq"]
	for tl in tiles:
		if (tl["hit"] and not tl["holding"]) or tl["broken"]:
			continue
		var y := minf(HIT_Y, _y_at(tl["t"])) if tl["holding"] else _y_at(tl["t"])
		if y < TOP_Y - 70 or y > view_rect.end.y + 40:
			continue
		var x := _lane_x(tl["lane"])
		var sq := 0.78 + 0.05 * sin(t * 20) if tl["holding"] else 1.0
		var a := 0.35 if tl["miss"] else 1.0
		if absf(tl["t"] - next_t) < 0.001 and not tl["miss"]:
			rr(x - 38, y - 64, 76, 66, 18, null, Color(1, 1, 1, 0.55 + 0.35 * sin(t * 10)), 4)
		var c := LANE_COL[tl["lane"]]
		c.a = a
		rr(x - 34, y - 60, 68, 58, 16, c, Color(1, 1, 1, a), 3)
		sprite(StringName(band[tl["lane"]]), x, y - 2, 60, {"sx": 2.0 - sq, "sy": sq, "alpha": a})
	# pads under the line
	for l in NL:
		var x := _lane_x(l)
		var on: bool = _flash[l] > 0.0
		rr(x - 36, 562, 72, 56, 16, Color.WHITE if on else Color(1, 1, 1, 0.18), Color(1, 1, 1, 0.6), 2)
		circle(x, 590, 7, LANE_COL[l] if on else Color(1, 1, 1, 0.75), null)
		if _judge.has(l):
			var j: Dictionary = _judge[l]
			text(j["txt"], x, HIT_Y - 76, 12 if (j["txt"] as String).length() > 6 else 15, j["col"], &"center", &"display", INK, 4)
	if combo >= 10:
		text(ctx.t(&"squeak_beat.combo", {"n": combo}), W / 2, 112, 20, Color("#FFD54A"), &"center", &"display", INK, 5)
	# the count-in
	var beats_in := now / spb
	if beats_in < 8:
		var n := 8 - floori(maxf(0.0, beats_in))
		var words := ctx.t(StringName(trk["title"])) if n > 4 else (ctx.t(&"squeak_beat.go") if n == 0 else str(n))
		text(words, W / 2, 300, 26 if n > 4 else 54, Color.WHITE, &"center", &"display", INK, 6)
		if n > 4:
			var tags: Array = trk["tags"]
			text("%s · %s" % [ctx.t(StringName(tags[1])), ctx.t(StringName(tags[0]))], W / 2, 334, 13, Color("#FFF3B0"), &"center", &"body")
	# the bar at the top
	hud(Color("#7C4DDB"), fmt(score), 100)
	hearts(136, 26, lives)
	if hurt > 0.0:
		rect(view_rect.position.x, 52, view_rect.size.x, view_rect.end.y - 52, Color("#FF5E6C", hurt * 0.35))
	text(ctx.t(&"squeak_beat.song"), 254, 21, 10, Color.WHITE, &"center", &"body")
	bar(232, 28, 118, 14, maxf(0.0, now) / float(trk["len"]), Color("#FFD54A"))
