extends GutTest
## Daily quests and the Gem Challenge on the phone (guide.html "Daily visits"): the board, runs counting, collecting.

var server: FakeGameServer


func before_each() -> void:
	Save.wipe()
	Save.load_game()
	server = FakeGameServer.new(Save.section(&"pretend_server"), Save.mark_dirty, 3)
	Server.api = server
	Collection.server = server
	await Collection.sync()
	Town.reload()
	Economy.reload()
	GameData.minigames = MinigameCatalog.by_building()
	MinigameCatalog.load_all_words()
	# build the Bounce Park and the Bistro
	for b: StringName in [&"playground", &"restaurant"]:
		(Save.section(&"town")["levels"] as Dictionary)[String(b)] = 1
	Quests.board = {}


func test_the_board_has_quests_for_the_games_i_built() -> void:
	var built: Array = Quests.built_games()
	assert_has(built, {"id": "bistro_rush", "kind": "endless"})
	assert_has(built, {"id": "sky_bounce", "kind": "endless"})
	for g: Dictionary in built:
		assert_gt(Town.level(GameData.minigames.keys().filter(func(b: Variant) -> bool: return GameData.minigames[b]["id"] == g["id"])[0]), 0, "only built ones")
	var b: Dictionary = await Quests.refresh()
	assert_true(b["ok"])
	assert_eq((b["quests"] as Array).size(), 2)
	for q: Dictionary in b["quests"]:
		assert_true(q["game"] in ["any", ""] or built.any(func(g: Dictionary) -> bool: return g["id"] == q["game"]), "%s: %s" % [q["id"], q["game"]])
	assert_true(built.any(func(g: Dictionary) -> bool: return g["id"] == b["challenge"]["game"]))
	assert_ne(QuestsScreen_words(b["quests"][0]), "", "quests have words")


func QuestsScreen_words(q: Dictionary) -> String:
	return (load("res://features/quests/quests_screen.gd") as GDScript).call(&"quest_words", q)


func test_runs_count_and_rewards_are_collected_once() -> void:
	await Quests.refresh()
	var game := String(Quests.board["challenge"]["game"])
	var report := Quests.run_report(50, 3, false, 0, 0, 0, false)
	var first: Dictionary = await server.submit_run(StringName(game), 60.0, 10, &"endless", report)
	assert_eq(first["coins"], 20, "the day's first run pays double")
	assert_true(first["first_today"])
	assert_true("challenge" in first["quests_done"], "a new player's first Gem Challenge: just play")
	var second: Dictionary = await server.submit_run(StringName(game), 60.0, 10, &"endless", report)
	assert_eq(second["coins"], 10, "only the first")
	await Quests.refresh()
	assert_true(Quests.has_reward(), "the quest button shows a dot")
	var gems_before := Economy.gems()
	var got: Dictionary = await Quests.claim("challenge")
	assert_eq(got["gems"], 3)
	assert_eq(Economy.gems(), gems_before + 3)
	assert_eq((await Quests.claim("challenge"))["error"], &"claimed")


func test_coin_quests_pay_coins_onto_the_phone() -> void:
	await Quests.refresh()
	# play every game a few times: some coin quest gets done (play any game 3 times, play a game twice...)
	for i in 3:
		for g: Dictionary in Quests.built_games():
			await server.submit_run(StringName(g["id"]), 60.0, 0, &"endless", Quests.run_report(1, 40, false, 0, 0, 0, false))
	await Quests.refresh()
	var done: Array = (Quests.board["quests"] as Array).filter(func(q: Dictionary) -> bool: return q["progress"] >= q["target"])
	assert_false(done.is_empty(), "a quest got done: %s" % [Quests.board["quests"]])
	var coins := Economy.coins()
	var got: Dictionary = await Quests.claim(String(done[0]["id"]))
	assert_eq(Economy.coins(), coins + int(got["coins"]))
	assert_eq(int(got["coins"]), 40)


func test_the_quest_board_screen() -> void:
	await Quests.refresh()
	var screen: Control = add_child_autofree((load("res://features/quests/quests_screen.tscn") as PackedScene).instantiate())
	screen.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
	screen.size = Vector2(720, 1280)
	await wait_frames(2)
	assert_not_null(screen.find_child("Quest_challenge", true, false), "the Gem Challenge card")
	assert_not_null(screen.find_child("Quest_streak", true, false), "the week's Gem Challenge days")
	assert_null(screen.find_child("Collect", true, false), "nothing to collect yet")
