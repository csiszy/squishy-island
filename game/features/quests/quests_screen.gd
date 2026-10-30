extends Control
## The quest board (guide.html "Daily visits"), from the Quests button on the map: today's 2 coin quests, the Gem
## Challenge (+Gems), how many Gem Challenge days this week (5 = a bonus), tomorrow's Gem Challenge game as a
## teaser, and "your first game today pays double". A quest's Play button opens its game. Nothing here ever scolds
## or counts down: missing a day only means missing that day's quests.

var _list: VBoxContainer


func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	var bg := ColorRect.new()
	bg.color = Color("#FFF8E6")
	bg.set_anchors_preset(PRESET_FULL_RECT)
	add_child(bg)
	var inset := SafeArea.insets(get_viewport())
	var margin := MarginContainer.new()
	margin.set_anchors_preset(PRESET_FULL_RECT)
	for k: String in ["left", "top", "right", "bottom"]:
		margin.add_theme_constant_override("margin_" + k, int({"left": inset.x, "top": inset.y, "right": inset.z, "bottom": inset.w}[k]))
	add_child(margin)
	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 14)
	margin.add_child(outer)
	var top := HBoxContainer.new()
	outer.add_child(top)
	var back := Ui.icon_button("back", Text.t(&"ui.back"))
	back.size_flags_vertical = SIZE_SHRINK_BEGIN
	back.set_meta(&"silent", true)
	back.pressed.connect(func() -> void:
		Audio.play(&"back")
		Nav.back())
	top.add_child(back)
	var spacer := Control.new()
	spacer.size_flags_horizontal = SIZE_EXPAND_FILL
	top.add_child(spacer)
	var wallet := WalletBar.new()
	wallet.size_flags_vertical = SIZE_SHRINK_BEGIN
	top.add_child(wallet)
	outer.add_child(Ui.label(Text.t(&"quests.title"), "Title"))
	var scroll := TouchScroll.new()
	scroll.size_flags_vertical = SIZE_EXPAND_FILL
	outer.add_child(scroll)
	_list = VBoxContainer.new()
	_list.size_flags_horizontal = SIZE_EXPAND_FILL
	_list.add_theme_constant_override("separation", 16)
	scroll.add_child(_list)
	Quests.changed.connect(_show)
	_show()
	Quests.refresh()


func open(_args: Dictionary) -> void:
	Audio.music(&"house")


func screen_shown() -> void:
	Quests.refresh()


## A game's name from its id ("Sky Bounce").
static func game_name(id: String) -> String:
	for b: Variant in GameData.minigames:
		var info: Dictionary = GameData.minigames[b]
		if String(info.get("id", "")) == id:
			return Text.t(StringName(info.get("title", "")))
	return id


static func _score_unit(id: String) -> String:
	for b: Variant in GameData.minigames:
		var info: Dictionary = GameData.minigames[b]
		if String(info.get("id", "")) == id:
			return Text.t(StringName(info.get("score_name", "game.points")))
	return Text.t(&"game.points")


## A quest's words: its text is a words key, or (a quest added live on the server) plain English.
static func quest_words(q: Dictionary) -> String:
	var text := String(q.get("text", ""))
	var args := {"n": Ui.number(int(q.get("target", 1))), "game": game_name(String(q.get("game", "")))}
	return Text.t(StringName(text), args) if Text.has(StringName(text)) else text.format(args)


static func challenge_words(c: Dictionary) -> String:
	var game := String(c.get("game", ""))
	match String(c.get("goal", "")):
		"levels3":
			return Text.t(&"quests.goal_levels3", {"game": game_name(game)})
		"song3":
			return Text.t(&"quests.goal_song3", {"game": game_name(game)})
	if int(c.get("target", 1)) <= 1:
		return Text.t(&"quests.goal_first", {"game": game_name(game)})
	return Text.t(&"quests.goal_score", {"game": game_name(game), "n": Ui.number(int(c["target"])), "unit": _score_unit(game)})


func _show() -> void:
	if not is_instance_valid(_list):
		return
	for c in _list.get_children():
		_list.remove_child(c)
		c.queue_free()
	var b := Quests.board
	if b.is_empty():
		_list.add_child(Ui.label(Text.t(&"quests.offline"), "", HORIZONTAL_ALIGNMENT_LEFT, true))
		return
	if b.get("first_run_left", false):
		_list.add_child(Ui.label(Text.t(&"quests.first_run"), "Heading", HORIZONTAL_ALIGNMENT_LEFT, true))
	var quests: Array = b.get("quests", [])
	if quests.is_empty() and not b.get("challenge") is Dictionary:
		_list.add_child(Ui.label(Text.t(&"quests.no_games"), "", HORIZONTAL_ALIGNMENT_LEFT, true))
	for q: Dictionary in quests:
		_list.add_child(_card(quest_words(q), int(q["progress"]), int(q["target"]), Text.t(&"quests.reward_coins", {"n": int(q["reward"])}),
			"coin", String(q["id"]), q["claimed"], String(q.get("game", "")), Color.WHITE))
	var c: Variant = b.get("challenge")
	if c is Dictionary:
		_list.add_child(Ui.label(Text.t(&"quests.challenge"), "Heading"))
		var target := int(c["target"]) if c["goal"] == "score" else 1
		var progress := mini(int(c["progress"]), target) if c["goal"] == "score" else (1 if c["done"] else 0)
		_list.add_child(_card(challenge_words(c), progress, target, Text.t(&"quests.reward_gems", {"n": int(b.get("rewards", {}).get("challenge", 3))}),
			"gem", "challenge", c["claimed"], String(c["game"]), Color("#EEF6FF"), c["done"]))
	var s: Dictionary = b.get("streak", {})
	if not s.is_empty():
		var needed := int(s.get("needed", 5))
		var days := mini(int(s.get("days", 0)), needed)
		_list.add_child(_card(Text.t(&"quests.streak", {"days": days, "needed": needed}) + "\n" + Text.t(&"quests.streak_reward", {"needed": needed, "gems": int(s.get("gems", 15))}),
			days, needed, Text.t(&"quests.reward_gems", {"n": int(s.get("gems", 15))}), "gem", "streak", s.get("claimed", false), "", Color("#EEF6FF")))
	if String(b.get("tomorrow", "")) != "":
		_list.add_child(Ui.label(Text.t(&"quests.tomorrow", {"game": game_name(String(b["tomorrow"]))}), "", HORIZONTAL_ALIGNMENT_LEFT, true))
	_list.add_child(Ui.label(Text.t(&"quests.no_rush"), "Small", HORIZONTAL_ALIGNMENT_LEFT, true))


## One quest: words, a progress bar, the reward, and Collect (when done) or Play (when it has a game).
func _card(words: String, progress: int, target: int, reward: String, icon: String, id: String, claimed: bool, game: String, tint: Color, done := false) -> Control:
	var card := PanelContainer.new()
	card.name = "Quest_" + id
	card.theme_type_variation = "Card"
	card.self_modulate = tint
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 8)
	card.add_child(col)
	col.add_child(Ui.label(words, "", HORIZONTAL_ALIGNMENT_LEFT, true))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	col.add_child(row)
	var bar := ProgressBar.new()
	bar.max_value = maxi(1, target)
	bar.value = mini(progress, target)
	bar.show_percentage = false
	bar.custom_minimum_size = Vector2(0, 28)
	bar.size_flags_horizontal = SIZE_EXPAND_FILL
	bar.size_flags_vertical = SIZE_SHRINK_CENTER
	row.add_child(bar)
	if target > 1:
		row.add_child(Ui.label("%s / %s" % [Ui.number(mini(progress, target)), Ui.number(target)], "Small"))
	row.add_child(Ui.texture(Ui.icon(icon), Vector2(40, 40)))
	row.add_child(Ui.label(reward, "Small"))
	var ready := (progress >= target or done) and not claimed
	if claimed:
		col.add_child(Ui.label(Text.t(&"quests.collected"), "Small"))
	elif ready:
		var collect := Ui.button(Text.t(&"quests.collect"), "BigButton", icon)
		collect.name = "Collect"
		collect.pressed.connect(func() -> void:
			collect.disabled = true
			var answer: Dictionary = await Quests.claim(id)
			if answer.get("ok", false):
				Audio.play(&"tada" if icon == "gem" else &"jar")
			else:
				collect.disabled = false)
		col.add_child(collect)
	elif game != "" and game != "any":
		var play := Ui.button(Text.t(&"quests.play"), "PillButton", "play")
		play.name = "Play"
		play.pressed.connect(func() -> void: Nav.go(&"minigame", {"game": StringName(game)}))
		col.add_child(play)
	return card
