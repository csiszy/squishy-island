extends Control
## Play one minigame on its own, with a pretend host (like the HTML prototypes). Each game folder has a
## harness.tscn that uses this script with `game_folder` set: open it in Godot and press F6.
## Coins, ads, the server and the town are not here on purpose: this is just the game.

@export_dir var game_folder := ""
## Pretend the player always watches the "keep going" ad.
@export var always_revive := true

var game: Minigame
var _manifest: MinigameManifest
var _words: Dictionary = {}
var _info: Label
var _play: Button
var _player: AudioStreamPlayer


func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	_manifest = MinigameManifest.from_file(game_folder.path_join("manifest.json"))
	if not _manifest.is_ok():
		push_error("harness: %s" % ", ".join(_manifest.problems))
		return
	_words = read_words(_manifest.strings_path())
	var bg := ColorRect.new()
	bg.color = Color(String(_manifest.data.get("backdrop", "#FFF6E8")))
	bg.set_anchors_preset(PRESET_FULL_RECT)
	add_child(bg)
	_player = AudioStreamPlayer.new()
	add_child(_player)
	game = (load(_manifest.scene_path()) as PackedScene).instantiate() as Minigame
	add_child(game)
	game.setup(fake_context(_manifest, _words, self))
	game.finished.connect(_on_finished)
	_play = Button.new()
	_play.text = "Play"
	_play.position = Vector2(20, 20)
	_play.pressed.connect(_start)
	add_child(_play)
	_info = Label.new()
	_info.position = Vector2(20, 70)
	add_child(_info)
	resized.connect(_fit)
	_fit()


func _fit() -> void:
	if game == null:
		return
	var s := _manifest.size()
	var k := minf(size.x / s.x, size.y / s.y)
	game.scale = Vector2(k, k)
	game.position = (size - s * k) / 2.0
	game.set_view(Rect2(-game.position / k, size / k))


func _start() -> void:
	_play.visible = false
	_info.text = ""
	game.start(1 if _manifest.data.get("kind") in ["levels", "songs"] else 0)


func _on_finished(r: MinigameResult) -> void:
	_info.text = "score %d · metric %d · %.0f s" % [r.score, r.metric, r.seconds_played]
	_play.text = "Play again"
	_play.visible = true


## A context with pretend sounds, buzz and "keep going?" (always yes, or always no).
static func fake_context(manifest: MinigameManifest, words: Dictionary, host: Node = null) -> MinigameContext:
	var c := MinigameContext.new()
	c.game_id = manifest.id()
	c.settings = {"graphics": &"high", "reduced_motion": false, "left_handed": false, "vibration": true}
	c.building_level = 10
	c.translate = func(key: StringName, args: Dictionary) -> String:
		var s: String = words.get(String(key), String(key))
		return s.format(args) if not args.is_empty() else s
	if host != null and host.has_method(&"_play_sound"):
		c.play_sound = Callable(host, &"_play_sound")
		c.sound_bus = &"Master"
	var answer: bool = host.get(&"always_revive") if host != null else false
	c.ask_revive = func() -> bool: return answer
	return c


func _play_sound(stream: AudioStream, loudness: float, pitch: float) -> void:
	var p := AudioStreamPlayer.new()
	p.stream = stream
	p.volume_db = linear_to_db(clampf(loudness, 0.01, 1.0))
	p.pitch_scale = pitch
	add_child(p)
	p.play()
	p.finished.connect(p.queue_free)


## key -> English words from a game's strings_en.csv (keys,en).
static func read_words(path: String) -> Dictionary:
	var out := {}
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return out
	f.get_csv_line()
	while not f.eof_reached():
		var row := f.get_csv_line()
		if row.size() >= 2 and row[0] != "" and not row[0].begins_with("#"):
			out[row[0]] = row[1]
	return out
