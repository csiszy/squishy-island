extends Control
## The minigame host (build.html, "The host does, so games never have to"): the only thing that touches a
## minigame, and only through the contract (minigame_api v1). Around the gameplay it does the start card (how to
## play, coins, best score, which squishy plays), pause and leaving, "Keep going?" with a rewarded ad (closable
## after 5 s), the results card with the half-second count-up, and paying out (checked by the server).
## Opened with Nav.go(&"minigame", {"building": &"playground"}) (or {"game": &"sky_bounce"}).

## A choice on the current card (keep going: watch / no thanks).
signal card_choice(yes: bool)

const COUNT_TIME := 0.5
const COUNT_GAP := 0.11

var building := &""
var manifest: MinigameManifest
var game: Minigame
var player_squishy := &""
## The last run's numbers (tests read them).
var last_result: MinigameResult
var last_payout: Dictionary = {}

var _stage: Control
var _ui: Control
var _card_host: Control
var _pause_button: Button
var _playing := false
var _run_open := false
var _revives := 0
var _counting: Array[Tween] = []
var _skip := false


func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	resized.connect(_fit)
	Events.app_paused.connect(_on_app_paused)


func open(args: Dictionary) -> void:
	building = StringName(args.get("building", args.get("id", "")))
	var game_id := StringName(args.get("game", GameData.minigame_for(building)))
	manifest = MinigameCatalog.find(game_id) if game_id != &"" else null
	if manifest == null or not manifest.enabled():
		_show_napping()
		return
	if building == &"":
		building = manifest.building()
	var tr_path := manifest.folder.path_join("strings_en.en.translation")
	if ResourceLoader.exists(tr_path):
		TranslationServer.add_translation(load(tr_path) as Translation)
	var scene := load(manifest.scene_path()) as PackedScene
	var node: Node = scene.instantiate() if scene != null else null
	if not node is Minigame:
		if node != null:
			node.free()
		_show_napping()
		return
	game = node as Minigame
	_build()
	player_squishy = _default_squishy()
	game.setup(_make_context())
	game.finished.connect(_on_finished)
	game.process_mode = Node.PROCESS_MODE_PAUSABLE
	Audio.music(StringName(manifest.data.get("music", "city")))
	Audio.unduck()
	_show_start()


## The phone's back button: pause a running game instead of leaving it.
func back_pressed() -> bool:
	if _playing:
		_pause()
		return true
	return false


func screen_shown() -> void:
	if manifest != null:
		Audio.music(StringName(manifest.data.get("music", "city")))


# ---------------------------------------------------------------- layout

func _build() -> void:
	var bg := ColorRect.new()
	bg.color = Color(String(manifest.data.get("backdrop", "#FFF6E8")))
	bg.set_anchors_preset(PRESET_FULL_RECT)
	bg.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(bg)
	_stage = Control.new()
	_stage.clip_contents = true
	_stage.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_stage)
	_stage.add_child(game)
	_ui = Control.new()
	_ui.set_anchors_preset(PRESET_FULL_RECT)
	_ui.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_ui)
	_pause_button = Ui.icon_button("pause", Text.t(&"game.pause"))
	_pause_button.custom_minimum_size = Vector2(76, 76)
	_pause_button.pressed.connect(_pause)
	_pause_button.visible = false
	_ui.add_child(_pause_button)
	_card_host = Control.new()
	_card_host.set_anchors_preset(PRESET_FULL_RECT)
	_card_host.mouse_filter = MOUSE_FILTER_IGNORE
	add_child(_card_host)
	_fit()


## The game keeps its own shape (360 x 640 for the prototypes), as big as fits, centred; the bands around it
## show the game's backdrop colour. The pause button sits in the top band when there is room.
func _fit() -> void:
	if _stage == null or manifest == null:
		return
	var s := manifest.size()
	var k := minf(size.x / s.x, size.y / s.y)
	_stage.size = s * k
	_stage.position = ((size - s * k) / 2.0).floor()
	game.scale = Vector2(k, k)
	var inset := SafeArea.insets(get_viewport()) if is_inside_tree() else Vector4.ZERO
	var band := _stage.position.y
	if band >= 92.0 + inset.y:
		# in the band above the game, on the left
		_pause_button.position = Vector2(inset.x, band - 86.0)
		_pause_button.modulate.a = 1.0
	else:
		# no room: over the game, top middle, a little see-through
		_pause_button.position = Vector2(size.x / 2.0 - 38.0, inset.y + 6.0)
		_pause_button.modulate.a = 0.8


func _make_context() -> MinigameContext:
	var c := MinigameContext.new()
	c.game_id = manifest.id()
	c.squad = [player_squishy] as Array[StringName]
	var info := GameData.squishy(player_squishy)
	c.perks = MinigamePayout.perks_for(manifest.data.get("perks", []), String(info.get("family", "")), String(info.get("rarity", "")))
	c.best = int(_record().get("best", 0))
	c.settings = {"graphics": Settings.graphics_tier(), "reduced_motion": Settings.reduced_motion(),
		"left_handed": bool(Settings.get_value(&"left_handed")), "vibration": bool(Settings.get_value(&"vibration"))}
	c.store = _record().get("store", {})
	c.play_sound = func(stream: AudioStream, loudness: float, pitch: float) -> void: Audio.play_stream(stream, pitch, loudness)
	c.play_named = func(id: StringName, pitch: float) -> void: Audio.play(id, pitch)
	c.vibrate = func(ms: int) -> void: Haptics.buzz(ms)
	c.ask_revive = _ask_revive
	c.get_portrait = func(id: StringName) -> Texture2D: return ArtLibrary.portrait(id)
	c.get_font = func(kind: StringName) -> Font: return UiTheme.display_font() if kind == &"display" else UiTheme.font(900)
	c.translate = func(key: StringName, args: Dictionary) -> String: return Text.t(key, args)
	c.save_store = func(store: Dictionary) -> void:
		_record()["store"] = store
		Save.mark_dirty()
	return c


# ---------------------------------------------------------------- running

func _start() -> void:
	_close_card()
	_revives = 0
	_run_open = true
	_playing = true
	_pause_button.visible = true
	Audio.unduck()
	var level := 0
	if manifest.data.get("kind") == "levels":
		level = int(_record().get("top", 1))
	game.ctx.squad = [player_squishy] as Array[StringName]
	game.ctx.best = int(_record().get("best", 0))
	game.start(level)


func _pause() -> void:
	if not _playing:
		return
	_playing = false
	game.pause()
	_pause_button.visible = false
	Audio.duck()
	var col := _card(Text.t(&"game.paused"), "")
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	for key: StringName in [&"sfx", &"music"]:
		var on: bool = Settings.get_value(key)
		var b := Ui.button(Text.t(StringName("game.%s_%s" % [key, "on" if on else "off"])))
		b.pressed.connect(func() -> void:
			Settings.set_value(key, not bool(Settings.get_value(key)))
			var now: bool = Settings.get_value(key)
			b.text = Text.t(StringName("game.%s_%s" % [key, "on" if now else "off"])))
		row.add_child(b)
	col.add_child(row)
	var go := Ui.button(Text.t(&"game.keep_playing"), "BigButton", "play")
	go.pressed.connect(_resume)
	col.add_child(go)
	var leave := Ui.button(Text.t(&"game.leave"))
	leave.pressed.connect(_leave_run)
	col.add_child(leave)


func _resume() -> void:
	_close_card()
	_playing = true
	_pause_button.visible = true
	Audio.unduck()
	game.resume()


## Leaving mid-run ends it: coins for what was reached are still paid (nothing is lost by stopping).
func _leave_run() -> void:
	_close_card()
	game.resume()
	game.stop()


func _on_app_paused() -> void:
	if _playing:
		_pause()


## The game asks "may I keep going?": offer the ad once per run, only if ads are allowed (grown-up switch).
func _ask_revive() -> bool:
	var limit := int(GameData.economy().get("ads", {}).get("keepGoingPerRun", 1))
	if not manifest.data.get("revive", {}).get("allowed", false) or _revives >= limit or not Ads.can_offer():
		return false
	_playing = false
	_pause_button.visible = false
	Audio.duck()
	var col := _card(Text.t(&"game.keep_going"), Text.t(&"game.oh_no"))
	var score_name := Text.t(StringName(manifest.data.get("score_name", "game.points")))
	var current: int = game.get(&"score") if game.get(&"score") is int else 0
	col.add_child(Ui.label(Text.t(&"game.so_far", {"n": Ui.number(current), "what": score_name}), "", HORIZONTAL_ALIGNMENT_CENTER, true))
	var watch := Ui.button(Text.t(&"game.watch_ad"), "BigButton", "play")
	col.add_child(watch)
	var gift := StringName(manifest.data.get("revive", {}).get("gift", "game.revive_gift"))
	col.add_child(Ui.label(Text.t(&"game.once_per_game", {"gift": Text.t(gift)}), "Small", HORIZONTAL_ALIGNMENT_CENTER, true))
	var no := Ui.button(Text.t(&"game.no_thanks"))
	col.add_child(no)
	watch.pressed.connect(func() -> void: card_choice.emit(true))
	no.pressed.connect(func() -> void: card_choice.emit(false))
	var yes: bool = await card_choice
	if not is_inside_tree():
		return false
	_close_card()
	var watched := false
	if yes:
		Audio.play(&"adStart")
		watched = await Ads.show_rewarded(&"keep_going")
	if watched:
		_revives += 1
		_playing = true
		_pause_button.visible = true
		Audio.unduck()
	return watched


# ---------------------------------------------------------------- results and payout

func _on_finished(result: MinigameResult) -> void:
	if not _run_open:
		return
	_run_open = false
	_playing = false
	_pause_button.visible = false
	last_result = result
	var rec := _record()
	var old_best := int(rec.get("best", 0))
	var level_game: bool = manifest.data.get("kind") == "levels"
	var pay := {}
	if level_game:
		var levels: Dictionary = rec.get("levels", {})
		var prev := int(levels.get(str(result.level), 0))
		pay = MinigamePayout.level(result, prev)
		if result.won:
			levels[str(result.level)] = maxi(prev, result.stars)
			rec["levels"] = levels
			rec["top"] = maxi(int(rec.get("top", 1)), result.level + 1)
	else:
		var info := GameData.squishy(player_squishy)
		var boost := MinigamePayout.helper_boost(manifest.coins(), String(info.get("rarity", "")), Town.cozy_bonus(StringName(info.get("family", ""))))
		pay = MinigamePayout.endless(manifest.coins(), result, boost)
	var answer: Dictionary = await Server.api.submit_run(manifest.id(), result.seconds_played, int(pay["total"]))
	# offline: minigames still pay (the server checks later); otherwise the server's amount
	var paid: int = int(answer.get("coins", pay["total"])) if answer.get("ok", false) else int(pay["total"])
	pay["paid"] = paid
	last_payout = pay
	var jar_before := Economy.coins()
	Economy.earn(paid, &"minigame")
	var new_best := not level_game and result.score > old_best
	if new_best:
		rec["best"] = result.score
	rec["plays"] = int(rec.get("plays", 0)) + 1
	rec["squishy"] = String(player_squishy)
	Save.mark_dirty()
	match String(manifest.data.get("goal", "score")):
		"metric":
			Town.offer_progress(building, result.metric)
		"levels":
			Town.offer_progress(building, int(rec.get("top", 1)) - 1)
		_:
			Town.offer_progress(building, result.score)
	Events.minigame_played.emit(manifest.id(), result.score, paid)
	Audio.duck()
	if not is_inside_tree():
		return
	_show_results(result, pay, new_best, old_best, jar_before)


func _show_results(r: MinigameResult, pay: Dictionary, new_best: bool, old_best: int, jar_before: int) -> void:
	var level_game: bool = manifest.data.get("kind") == "levels"
	var title := Text.t(&"game.over") if not level_game else Text.t(&"game.level_n", {"n": r.level})
	var col := _card(Text.t(&"game.level_clear") if level_game and r.won else Ui.number(r.score), title)
	var counters: Array = []
	if not level_game:
		counters.append({"label": col.get_child(1), "from": 0, "to": r.score, "coins": false})
		var line := Text.t(StringName(manifest.data.get("score_name", "game.points")))
		if manifest.data.has("metric_line"):
			line += " · " + Text.t(StringName(manifest.data["metric_line"]), {"n": Ui.number(r.metric)})
		col.add_child(Ui.label(line, "Small", HORIZONTAL_ALIGNMENT_CENTER, true))
	var stamp := Ui.label(Text.t(&"game.new_best"), "Heading", HORIZONTAL_ALIGNMENT_CENTER)
	stamp.add_theme_color_override("font_color", UiTheme.PINK)
	if new_best:
		col.add_child(stamp)
		stamp.modulate.a = 0.0
	elif not level_game and old_best > 0:
		col.add_child(Ui.label(Text.t(&"game.best", {"n": Ui.number(old_best)}), "Small", HORIZONTAL_ALIGNMENT_CENTER))
	# the coins box
	var box := PanelContainer.new()
	var style := UiTheme.card(Color("#FFF8E6"), 28)
	style.shadow = Vector2.ZERO
	box.add_theme_stylebox_override("panel", style)
	var pc := VBoxContainer.new()
	pc.add_theme_constant_override("separation", 6)
	box.add_child(pc)
	col.add_child(box)
	var coin_row := HBoxContainer.new()
	coin_row.alignment = BoxContainer.ALIGNMENT_CENTER
	coin_row.add_child(Ui.texture(Ui.icon("coin"), Vector2(56, 56)))
	var coins_label := Ui.label("+%s" % Ui.number(int(pay["paid"])), "Heading")
	coin_row.add_child(coins_label)
	coin_row.add_child(Ui.label(Text.t(&"game.coins_word"), "Heading"))
	pc.add_child(coin_row)
	counters.append({"label": coins_label, "from": 0, "to": int(pay["paid"]), "coins": true, "plus": true})
	for words in _pay_lines(r, pay):
		pc.add_child(Ui.label(words, "Small", HORIZONTAL_ALIGNMENT_CENTER, true))
	var jar := Ui.label(Ui.number(Economy.coins()), "")
	var jar_row := HBoxContainer.new()
	jar_row.alignment = BoxContainer.ALIGNMENT_CENTER
	jar_row.add_child(Ui.label(Text.t(&"game.coin_jar"), "Small"))
	jar_row.add_child(jar)
	pc.add_child(jar_row)
	counters.append({"label": jar, "from": jar_before, "to": Economy.coins(), "coins": true, "jar": true})
	var goal := _goal_line()
	if goal != "":
		col.add_child(Ui.label(goal, "Small", HORIZONTAL_ALIGNMENT_CENTER, true))
	var again := Ui.button(Text.t(&"game.play_again"), "BigButton", "play")
	again.pressed.connect(_start)
	col.add_child(again)
	var town := Ui.button(Text.t(&"game.back_to_town"))
	town.pressed.connect(Nav.back)
	col.add_child(town)
	_count_up(counters, stamp if new_best else null)


func _pay_lines(r: MinigameResult, pay: Dictionary) -> PackedStringArray:
	var out := PackedStringArray()
	if manifest.data.get("kind") == "levels":
		if not r.won:
			out.append(Text.t(&"game.level_no_coins"))
		elif pay["first"]:
			out.append(Text.t(&"game.level_first_big" if pay["big"] else &"game.level_first"))
		else:
			out.append(Text.t(&"game.level_replay", {"n": pay["new_stars"]}))
		return out
	out.append(Text.t(&"game.time_played", {"time": "%d:%02d" % [int(r.seconds_played) / 60, int(r.seconds_played) % 60]}))
	var rule := manifest.coins()
	var from_line := Text.t(&"game.coins_from", {"n": Ui.number(int(pay["base"])), "rule": Text.t(StringName(rule.get("rule", "game.points")))})
	if int(pay["bonus"]) > 0:
		from_line += " · " + Text.t(&"game.bonus_line", {"n": pay["bonus"], "at": Ui.number(int((rule["milestones"] as Array)[int(pay["tier"])])), "unit": Text.t(StringName(rule.get("unit", "game.points")))})
	out.append(from_line)
	if int(pay["helper"]) > 0:
		out.append(Text.t(&"game.helper_line", {"n": pay["helper"], "name": Text.t(StringName(GameData.squishy(player_squishy).get("name", "")))}))
	if (rule.get("milestones", []) as Array).size() > 0:
		if int(pay["next_at"]) > 0:
			out.append(Text.t(&"game.next_bonus", {"n": pay["next_add"], "at": Ui.number(int(pay["next_at"])), "unit": Text.t(StringName(rule.get("unit", "game.points")))}))
		else:
			out.append(Text.t(&"game.top_bonus"))
	if int(pay["paid"]) < int(pay["total"]):
		out.append(Text.t(&"game.capped"))
	return out


## What the run means for the building: ready to upgrade, or what the next level needs.
func _goal_line() -> String:
	var check := Town.upgrade_check(building)
	var name_text := Text.t(StringName(GameData.building(building).get("name", "")))
	if Town.level(building) <= 0 or check["reason"] in [&"max", &"locked"]:
		return ""
	if check["reason"] == &"goal":
		var goal_key := StringName(GameData.building(building).get("goal", {}).get("text", ""))
		return Text.t(&"game.next_goal", {"name": name_text, "level": check["next"]}) + "\n" + Text.t(goal_key, {"n": Ui.number(int(check["target"]))})
	return Text.t(&"game.building_ready", {"name": name_text})


## Every number counts up from where it was in about half a second, one after the other, with ticks and a ding;
## the "New best!" stamp pops in after. A tap skips to the end. Reduced motion: no counting.
func _count_up(counters: Array, stamp: Label) -> void:
	_skip = false
	for c: Dictionary in counters:
		_set_count(c, int(c["to"]) if Settings.reduced_motion() else int(c["from"]))
	if Settings.reduced_motion():
		Audio.play(&"countDone")
		_reveal(stamp)
		return
	await get_tree().create_timer(0.15).timeout
	for c: Dictionary in counters:
		if not is_inside_tree() or not is_instance_valid(c["label"]):
			return
		if int(c["from"]) == int(c["to"]):
			continue
		var t0 := Time.get_ticks_msec()
		var last_tick := 0
		while true:
			var u := 1.0 if _skip else minf(1.0, (Time.get_ticks_msec() - t0) / (COUNT_TIME * 1000.0))
			var e := 1.0 - pow(1.0 - u, 3.0)
			_set_count(c, roundi(lerpf(float(c["from"]), float(c["to"]), e)))
			if u >= 1.0:
				break
			if Time.get_ticks_msec() - last_tick > 42:
				last_tick = Time.get_ticks_msec()
				Audio.play(&"coinsCount" if c["coins"] else &"tick", 1.0 + u * 0.5)
			await get_tree().process_frame
			if not is_inside_tree() or not is_instance_valid(c["label"]):
				return
		Audio.play(&"jar" if c["coins"] else &"countDone")
		var l: Label = c["label"]
		l.pivot_offset = l.size / 2.0
		l.scale = Vector2(1.15, 1.15)
		create_tween().tween_property(l, "scale", Vector2.ONE, 0.2)
		if not _skip:
			await get_tree().create_timer(COUNT_GAP).timeout
	_reveal(stamp)


func _set_count(c: Dictionary, v: int) -> void:
	var l: Label = c["label"]
	if is_instance_valid(l):
		l.text = ("+" if c.get("plus", false) else "") + Ui.number(v)


func _reveal(stamp: Label) -> void:
	if stamp == null or not is_instance_valid(stamp):
		return
	stamp.modulate.a = 1.0
	Audio.play(&"newBest")
	Haptics.buzz(40)
	if not Settings.reduced_motion():
		stamp.pivot_offset = stamp.size / 2.0
		stamp.scale = Vector2(1.6, 1.6)
		create_tween().tween_property(stamp, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


## A tap on the dimmed area while numbers count: jump to the end.
func _on_dim_input(event: InputEvent) -> void:
	if (event is InputEventScreenTouch or event is InputEventMouseButton) and event.is_pressed():
		_skip = true


# ---------------------------------------------------------------- the start card

func _show_start() -> void:
	var col := _card(Text.t(StringName(manifest.data.get("title", ""))), Text.t(&"game.eyebrow"))
	if manifest.data.has("where"):
		col.add_child(Ui.label(Text.t(StringName(manifest.data["where"])), "Small", HORIZONTAL_ALIGNMENT_CENTER, true))
	var how := VBoxContainer.new()
	how.add_theme_constant_override("separation", 4)
	for key: String in manifest.data.get("how_to", []):
		how.add_child(Ui.label("•  " + Text.t(StringName(key)), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))
	col.add_child(how)
	var rule := manifest.coins()
	if manifest.data.get("kind") == "levels":
		col.add_child(Ui.label(Text.t(&"game.coins_levels"), "Small", HORIZONTAL_ALIGNMENT_CENTER, true))
	else:
		var words := Text.t(&"game.coins_rule", {"rule": Text.t(StringName(rule.get("rule", "game.points")))})
		var ms: Array = rule.get("milestones", [])
		if not ms.is_empty():
			var table: Array = GameData.economy().get("minigames", {}).get("milestoneBonus", [10, 25, 50])
			var adds := PackedStringArray()
			var ats := PackedStringArray()
			for i in ms.size():
				adds.append("+%d" % int(table[i]))
				ats.append(Ui.number(int(ms[i])))
			words += "\n" + Text.t(&"game.bonus_at", {"adds": " / ".join(adds), "ats": " / ".join(ats), "unit": Text.t(StringName(rule.get("unit", "game.points")))})
		col.add_child(Ui.label(words, "Small", HORIZONTAL_ALIGNMENT_CENTER, true))
	var best := int(_record().get("best", 0))
	if best > 0:
		col.add_child(Ui.label(Text.t(&"game.your_best", {"n": Ui.number(best)}), "", HORIZONTAL_ALIGNMENT_CENTER))
	col.add_child(_squishy_row())
	var play := Ui.button(Text.t(&"game.play"), "BigButton", "play")
	play.pressed.connect(_start)
	col.add_child(play)
	var town := Ui.button(Text.t(&"game.back_to_town"))
	town.pressed.connect(Nav.back)
	col.add_child(town)


## "Playing: [picture] Marshmallow  (Change)". Helpers this squishy brings are listed under it.
func _squishy_row() -> Control:
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 4)
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_child(Ui.texture(ArtLibrary.portrait(player_squishy), Vector2(84, 84)))
	row.add_child(Ui.label(Text.t(&"game.playing_as", {"name": Text.t(StringName(GameData.squishy(player_squishy).get("name", "")))}), ""))
	if Collection.owned_ids().size() > 1:
		var change := Ui.button(Text.t(&"game.change"), "PillButton")
		change.pressed.connect(_pick_squishy)
		row.add_child(change)
	box.add_child(row)
	var helps := game.ctx.perks if game != null and game.ctx != null else {}
	if not helps.is_empty():
		box.add_child(Ui.label(Text.t(&"game.has_helpers"), "Small", HORIZONTAL_ALIGNMENT_CENTER, true))
	return box


func _pick_squishy() -> void:
	var col := _card(Text.t(&"game.who_plays"), "")
	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(560, 520)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 12)
	scroll.add_child(grid)
	col.add_child(scroll)
	for id in Collection.owned_ids():
		var b := Button.new()
		b.icon = ArtLibrary.portrait(id)
		b.expand_icon = true
		b.custom_minimum_size = Vector2(120, 120)
		b.tooltip_text = Text.t(StringName(GameData.squishy(id).get("name", "")))
		b.theme_type_variation = "IconButton"
		b.pressed.connect(func() -> void:
			player_squishy = id
			game.setup(_make_context())
			_show_start())
		grid.add_child(b)


func _default_squishy() -> StringName:
	var owned := Collection.owned_ids()
	var last := StringName(_record().get("squishy", ""))
	if last in owned:
		return last
	return owned[0] if not owned.is_empty() else &"bao"


# ---------------------------------------------------------------- cards

## A card over the game: eyebrow, big title, then whatever the caller adds. Returns the column to fill.
func _card(title: String, eyebrow: String) -> VBoxContainer:
	_close_card()
	var dim := ColorRect.new()
	dim.color = Color(UiTheme.DIM, 0.35)
	dim.set_anchors_preset(PRESET_FULL_RECT)
	dim.mouse_filter = MOUSE_FILTER_STOP
	dim.gui_input.connect(_on_dim_input)
	_card_host.add_child(dim)
	var scroll := ScrollContainer.new()
	scroll.set_anchors_preset(PRESET_FULL_RECT)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_card_host.add_child(scroll)
	var center := CenterContainer.new()
	center.size_flags_horizontal = SIZE_EXPAND_FILL
	center.size_flags_vertical = SIZE_EXPAND_FILL
	center.custom_minimum_size = size
	scroll.add_child(center)
	var card := PanelContainer.new()
	card.theme_type_variation = "Card"
	card.custom_minimum_size = Vector2(minf(640.0, size.x - 40.0), 0)
	center.add_child(card)
	var col := VBoxContainer.new()
	col.alignment = BoxContainer.ALIGNMENT_CENTER
	col.add_theme_constant_override("separation", 14)
	card.add_child(col)
	var eyebrow_label := Ui.label(eyebrow, "Eyebrow", HORIZONTAL_ALIGNMENT_CENTER)
	eyebrow_label.visible = eyebrow != ""
	col.add_child(eyebrow_label)
	col.add_child(Ui.label(title, "Title", HORIZONTAL_ALIGNMENT_CENTER, true))
	Audio.play(&"open")
	return col


func _close_card() -> void:
	if _card_host == null:
		return
	for c in _card_host.get_children():
		c.queue_free()


## The game could not be found or did not start: a friendly card, and back to town.
func _show_napping() -> void:
	if _card_host == null:
		_card_host = Control.new()
		_card_host.set_anchors_preset(PRESET_FULL_RECT)
		add_child(_card_host)
	var col := _card(Text.t(&"game.napping"), "")
	var town := Ui.button(Text.t(&"game.back_to_town"), "BigButton")
	town.pressed.connect(Nav.back)
	col.add_child(town)


## This game's own corner of the save file: {"best", "plays", "squishy", "store", "levels", "top"}.
func _record() -> Dictionary:
	var all := Save.section(&"minigames")
	var key := String(manifest.id())
	if not all.get(key) is Dictionary:
		all[key] = {}
	return all[key]
