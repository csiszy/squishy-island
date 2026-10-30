extends GutTest
## The contract test (build.html, "Why a broken game can't break the rest"): every minigame is started without
## the rest of the game and played by its robot for two (simulated) minutes. It fails on an error, a run without
## a valid Result, a score that goes backwards, missing words, or nodes left behind.

const HARNESS := preload("res://minigame_kit/v1/harness.gd")
const PLAY_SECONDS := 120.0
const STEP := 1.0 / 30.0


func _games() -> Array[MinigameManifest]:
	return MinigameCatalog.scan()


func test_there_are_games() -> void:
	assert_gte(_games().size(), 4, "Sky Bounce, Bistro Rush, Sort-a-Lot, Grow Grow Garden, ...")


func test_every_manifest_is_complete() -> void:
	for m in _games():
		assert_true(m.is_ok(), "%s: %s" % [m.id(), m.problems])
		assert_false(GameData.building(m.building()).is_empty(), "%s: building %s exists" % [m.id(), m.building()])
		assert_true(FileAccess.file_exists(m.folder.path_join("bot.gd")), "%s has a bot" % m.id())
		assert_true(FileAccess.file_exists(m.folder.path_join("harness.tscn")), "%s has a harness" % m.id())
		var words := HARNESS.read_words(m.strings_path())
		for key in _word_keys(m.data):
			assert_true(words.has(key), "%s: words for %s" % [m.id(), key])
		for track: Dictionary in m.songs():
			for key: String in [track.get("title", "")] + track.get("tags", []):
				assert_true(words.has(key), "%s: words for track %s" % [m.id(), key])
			assert_gt(float(track.get("len", 0.0)), 0.0, "%s: every track has a length" % m.id())
		for key: String in words:
			assert_true(key.begins_with(String(m.id()) + "."), "%s: key %s starts with the game id" % [m.id(), key])


## Games draw through the kit's helpers (rect, rr, circle, text, ...), which draw at the phone's real pixel size.
## Godot's own draw_ functions would draw small and get scaled up: blurry words and soft edges.
func test_games_draw_only_through_the_kit() -> void:
	var direct := RegEx.create_from_string("(?<![\\w.])draw_[a-z_]+\\(")
	for m: MinigameManifest in _games() + [MinigameManifest.from_file("res://minigames/_template/manifest.json")]:
		for f in DirAccess.get_files_at(m.folder):
			if not f.ends_with(".gd"):
				continue
			var code := FileAccess.get_file_as_string(m.folder.path_join(f))
			var hit := direct.search(code)
			assert_null(hit, "%s/%s draws with %s; use the kit's helper instead" % [m.id(), f, hit.get_string() if hit else ""])


func test_every_game_plays_two_minutes_with_its_bot() -> void:
	for m in _games():
		await _play(m)


## The template is a complete little game too (it is what new games start from).
func test_the_template_works() -> void:
	var m := MinigameManifest.from_file("res://minigames/_template/manifest.json")
	assert_true(m.is_ok(), str(m.problems))
	assert_false(m.enabled(), "the template never shows up in town")
	await _play(m)


## Random taps instead of a good player: every endless game must end by itself, offering "keep going?" once
## (the player watches the ad and the game carries on; next time the run simply ends).
func test_random_taps_lose_and_keep_going_is_offered_once() -> void:
	for m in _games():
		if m.data.get("kind") != "endless":
			continue
		var ctx := HARNESS.fake_context(m, HARNESS.read_words(m.strings_path()))
		var asked := [0]
		ctx.ask_revive = func() -> bool:
			asked[0] += 1
			return true
		var game := (load(m.scene_path()) as PackedScene).instantiate() as Minigame
		game.process_mode = Node.PROCESS_MODE_DISABLED
		add_child_autofree(game)
		var results: Array[MinigameResult] = []
		game.finished.connect(func(r: MinigameResult) -> void: results.append(r))
		game.setup(ctx)
		game.start(0)
		var rng := RandomNumberGenerator.new()
		rng.seed = 11
		var played := 0.0
		var next_tap := 0.0
		var size := m.size()
		while results.is_empty() and played < 900.0:
			if played >= next_tap:
				next_tap = played + 0.4
				_tap(game, Vector2(rng.randf() * size.x, rng.randf() * size.y), true)
			elif played >= next_tap - 0.2:
				_tap(game, Vector2(rng.randf() * size.x, rng.randf() * size.y), false)
			game.advance(STEP)
			played += STEP
		assert_eq(results.size(), 1, "%s ended by itself" % m.id())
		assert_eq(asked[0], 1, "%s: keep going was offered exactly once" % m.id())


func _tap(game: Minigame, at: Vector2, down: bool) -> void:
	var e := InputEventScreenTouch.new()
	e.position = at
	e.pressed = down
	game.call(&"_unhandled_input", e)


func _play(m: MinigameManifest) -> void:
	var orphans_before := Performance.get_monitor(Performance.OBJECT_ORPHAN_NODE_COUNT)
	var words := HARNESS.read_words(m.strings_path())
	var missing: Array[String] = []
	var ctx := HARNESS.fake_context(m, words)
	ctx.translate = func(key: StringName, args: Dictionary) -> String:
		if not words.has(String(key)):
			missing.append(String(key))
		return String(words.get(String(key), key)).format(args)
	var revives := [0]
	ctx.ask_revive = func() -> bool:
		revives[0] += 1
		return revives[0] == 1    # the first time the player watches the ad, then says no thanks
	var game := (load(m.scene_path()) as PackedScene).instantiate() as Minigame
	assert_not_null(game, "%s: the scene's root is a Minigame" % m.id())
	if game == null:
		return
	game.process_mode = Node.PROCESS_MODE_DISABLED   # time only moves when the test says so
	add_child(game)
	var bot: Object = (load(m.folder.path_join("bot.gd")) as GDScript).new()
	var results: Array[MinigameResult] = []
	game.finished.connect(func(r: MinigameResult) -> void: results.append(r))
	var last_score := [0]
	var backwards := [false]
	game.score_changed.connect(func(s: int) -> void:
		if s < last_score[0]:
			backwards[0] = true
		last_score[0] = s)
	game.setup(ctx)
	var played := 0.0
	var runs := 0
	while played < PLAY_SECONDS:
		runs += 1
		var before := results.size()
		last_score[0] = 0
		game.start(1 if m.data.get("kind") in ["levels", "songs"] else 0)
		while results.size() == before and played < PLAY_SECONDS:
			bot.call(&"act", game, STEP)
			game.advance(STEP)
			played += STEP
		if results.size() == before:
			game.stop()
		assert_eq(results.size(), before + 1, "%s run %d: exactly one Result" % [m.id(), runs])
	for r in results:
		assert_true(r.is_valid(), "%s: valid Result %s" % [m.id(), r.to_dict()])
		assert_gt(r.seconds_played, 0.0, "%s: time was counted" % m.id())
	assert_false(backwards[0], "%s: the score never went down" % m.id())
	assert_eq(missing, [] as Array[String], "%s: every word it asked for exists" % m.id())
	var best := 0
	for r in results:
		best = maxi(best, r.score)
	var coins := 0
	for r in results:
		coins += int(MinigamePayout.endless(m.coins(), r)["total"]) if m.data.get("kind") == "endless" else 0
	gut.p("%s: %d runs in %d s, best score %d, revive asked %d times, %.0f coins per minute" % [m.id(), runs, PLAY_SECONDS, best, revives[0], coins / (PLAY_SECONDS / 60.0)])
	assert_gt(best, 0, "%s: the bot scored something" % m.id())
	game.queue_free()
	await wait_frames(2)
	assert_lte(Performance.get_monitor(Performance.OBJECT_ORPHAN_NODE_COUNT), orphans_before, "%s: no nodes left behind" % m.id())


## Every manifest value that is a words key ("<game>.something").
func _word_keys(v: Variant) -> Array[String]:
	var out: Array[String] = []
	if v is Dictionary:
		for k: String in v:
			if k in ["id", "scene", "building", "kind", "music", "backdrop", "version", "goal", "from", "milestones_on", "list"]:
				continue
			out.append_array(_word_keys(v[k]))
	elif v is Array:
		for x: Variant in v:
			out.append_array(_word_keys(x))
	elif v is String and (v as String).contains(".") and not (v as String).ends_with(".tscn"):
		out.append(v)
	return out
