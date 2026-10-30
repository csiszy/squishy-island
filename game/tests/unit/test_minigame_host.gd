extends GutTest
## The minigame host: coins from a run (guide "Coins", building pages "Rewards"), the server's per-minute check,
## and the whole round trip on the real screen: start card -> play -> results -> coins, best score, building goal.


func before_each() -> void:
	Save.wipe()
	Save.load_game()
	var server := FakeGameServer.new(Save.section(&"pretend_server"), Save.mark_dirty, 3)
	Server.api = server
	Collection.server = server
	await Collection.sync()
	Town.reload()
	Economy.reload()


func _result(score: int, metric := 0, seconds := 60.0) -> MinigameResult:
	return MinigameResult.make(score, metric, seconds)


func test_points_divided_plus_the_highest_milestone() -> void:
	var rule := {"from": "score", "divide": 420, "milestones": [15000, 30000, 50000]}
	var p := MinigamePayout.endless(rule, _result(31000))
	assert_eq(p["base"], 73, "31,000 ÷ 420")
	assert_eq(p["bonus"], 25, "only the highest milestone reached")
	assert_eq(p["total"], 98)
	assert_eq(p["next_at"], 50000)
	assert_eq(p["next_add"], 50)


func test_sky_bounce_keeps_the_coins_grabbed() -> void:
	var rule := {"from": "metric", "divide": 1, "milestones": [600, 1200, 2000]}
	var p := MinigamePayout.endless(rule, _result(650, 41))
	assert_eq(p["base"], 41)
	assert_eq(p["bonus"], 10, "600 m reached")


func test_no_milestones_no_bonus() -> void:
	var p := MinigamePayout.endless({"from": "score", "divide": 55, "milestones": []}, _result(3690))
	assert_eq(p["total"], 67)
	assert_eq(p["next_at"], -1)


func test_cozy_and_rarity_helpers_add_a_share_of_the_base() -> void:
	var rule := {"from": "score", "divide": 10, "milestones": [], "rarity_bonus": {"E": 0.2}}
	var boost := MinigamePayout.helper_boost(rule, "E", 0.05)
	assert_almost_eq(boost, 0.25, 0.0001)
	var p := MinigamePayout.endless(rule, _result(1000), boost)
	assert_eq(p["helper"], 25)
	assert_eq(p["total"], 125)


func test_level_games_pay_first_clears_and_new_stars() -> void:
	var r := _result(0)
	r.won = true
	r.level = 3
	r.stars = 2
	assert_eq(MinigamePayout.level(r, 0)["total"], 60, "first clear: 30 + 15 per star")
	r.level = 10
	assert_eq(MinigamePayout.level(r, 0)["total"], 120, "every 10th level pays double")
	r.stars = 3
	assert_eq(MinigamePayout.level(r, 2)["total"], 25, "replay: 10 + 15 for 1 new star")
	r.won = false
	assert_eq(MinigamePayout.level(r, 0)["total"], 0)


func test_perks_follow_family_and_rarity() -> void:
	var perks := [{"family": "sky", "effect": "fall_slower", "amount": 0.25}, {"rarity": ["E", "L"], "effect": "start_balloon", "amount": 1}]
	assert_eq(MinigamePayout.perks_for(perks, "sky", "C"), {&"fall_slower": 0.25})
	assert_eq(MinigamePayout.perks_for(perks, "fruit", "L"), {&"start_balloon": 1.0})
	assert_eq(MinigamePayout.perks_for(perks, "fruit", "C"), {})


func test_the_server_refuses_impossible_coins() -> void:
	var server := FakeGameServer.new({}, Callable(), 1)
	var ok := server.submit_run(&"sort_a_lot", 120.0, 70)
	assert_eq(ok["coins"], 70)
	var too_many := server.submit_run(&"sort_a_lot", 30.0, 500)
	assert_eq(too_many["coins"], 60, "a run counts as at least a minute; 60 coins per minute at most")
	assert_true(too_many["capped"])
	var level := server.submit_run(&"bucket_brigade", 15.0, 75, &"levels")
	assert_eq(level["coins"], 75, "a quickly beaten level still pays its fixed reward")


func test_the_catalog_finds_the_three_games() -> void:
	var by := MinigameCatalog.by_building()
	assert_eq(StringName(by[&"playground"]["id"]), &"sky_bounce")
	assert_eq(StringName(by[&"restaurant"]["id"]), &"bistro_rush")
	assert_eq(StringName(by[&"post"]["id"]), &"sort_a_lot")


func test_a_whole_run_pays_and_counts_for_the_building() -> void:
	GameData.minigames = MinigameCatalog.by_building()
	var screen: Control = add_child_autofree((load("res://features/minigame_host/minigame_screen.tscn") as PackedScene).instantiate())
	screen.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
	screen.size = Vector2(720, 1280)
	screen.call(&"open", {"building": &"post"})
	var game: Minigame = screen.get(&"game")
	assert_not_null(game, "Sort-a-Lot loaded")
	game.process_mode = Node.PROCESS_MODE_DISABLED
	screen.call(&"_start")
	var coins_before := Economy.coins()
	# sort 30 letters by hand (the bot's way), then stop
	var bot: Object = (load("res://minigames/sort_a_lot/bot.gd") as GDScript).new()
	for i in 900:
		bot.call(&"act", game, 1.0 / 30.0)
		game.advance(1.0 / 30.0)
	game.stop()
	await wait_frames(3)
	var r: MinigameResult = screen.get(&"last_result")
	assert_not_null(r, "the run ended")
	var pay: Dictionary = screen.get(&"last_payout")
	assert_gt(int(pay["paid"]), 0)
	assert_eq(Economy.coins(), coins_before + int(pay["paid"]), "coins went into the jar")
	assert_eq(int(Save.section(&"minigames")["sort_a_lot"]["best"]), r.score, "best score saved")
	assert_eq(Town.progress(&"post"), r.metric, "letters sorted count for the Post Office")


func test_the_map_card_plays_only_games_that_exist() -> void:
	GameData.minigames = {}
	var card := BuildingCardModel.for_building(&"playground", Town, Collection, Economy)
	var play: Dictionary = (card["actions"] as Array).filter(func(a: Dictionary) -> bool: return a["id"] == &"play")[0]
	assert_false(play["enabled"], "no game for it yet")
	GameData.minigames = MinigameCatalog.by_building()
	card = BuildingCardModel.for_building(&"playground", Town, Collection, Economy)
	play = (card["actions"] as Array).filter(func(a: Dictionary) -> bool: return a["id"] == &"play")[0]
	assert_true(play["enabled"])


## A real tap, sent through the whole app (shell, screen, cards) the way the phone sends it, reaches the game.
func test_a_real_tap_reaches_the_game() -> void:
	GameData.minigames = MinigameCatalog.by_building()
	var vp := SubViewport.new()
	vp.size = Vector2i(720, 1280)
	vp.handle_input_locally = true
	add_child_autofree(vp)
	var app: Control = (load("res://app/main.tscn") as PackedScene).instantiate()
	vp.add_child(app)
	await wait_frames(2)
	Nav.go(&"minigame", {"building": &"playground"})
	await wait_frames(2)
	var screen := app.find_child("MinigameScreen", true, false)
	assert_not_null(screen, "the game screen opened")
	screen.call(&"_start")
	await wait_frames(2)
	var game: Minigame = screen.get(&"game")
	var touch := InputEventScreenTouch.new()
	touch.index = 0
	touch.pressed = true
	touch.position = Vector2(100, 900)
	vp.push_input(touch)
	await wait_frames(1)
	var target: float = game.get(&"target")
	assert_almost_eq(target, 50.0, 1.0, "the tap at x=100 steers to 50 in the game's own 360-wide space")
	touch = touch.duplicate() as InputEventScreenTouch
	touch.pressed = false
	vp.push_input(touch)
	await wait_frames(1)
	assert_eq(game.get(&"target"), -1.0, "letting go stops steering")


## The pretend ad covers the whole screen with its card in the middle (it was stuck in the top-left corner).
func test_the_pretend_ad_is_in_the_middle() -> void:
	var overlay := Control.new()
	overlay.size = Vector2(720, 1280)
	overlay.add_to_group(&"ui_overlay")
	add_child_autofree(overlay)
	PretendAd.play(1, 1)
	await wait_frames(3)
	var ad: Control = overlay.get_child(0)
	assert_eq(ad.size, Vector2(720, 1280), "fills the screen")
	var card := ad.find_children("*", "PanelContainer", true, false)[0] as Control
	assert_almost_eq(card.get_global_rect().get_center().x, 360.0, 2.0, "centred across")
	assert_almost_eq(card.get_global_rect().get_center().y, 640.0, 2.0, "centred down")
	await wait_seconds(1.2)


## Puzzle levels use the prototypes' random numbers, so level N is the same level as in the design book.
func test_kit_random_numbers_match_the_prototypes() -> void:
	var r := KitRng.new(1 * 4099 + 23)
	assert_almost_eq(r.next(), 0.9249939669, 0.0000000001)
	assert_almost_eq(r.next(), 0.8234821295, 0.0000000001)
	var r2 := KitRng.new(37 * 4099 + 23)
	assert_almost_eq(r2.next(), 0.8092258757, 0.0000000001)


## A level game: beating level 1 pays 30 + 15 per star, opens level 2 and counts for the Fire Station.
func test_beating_a_level() -> void:
	GameData.minigames = MinigameCatalog.by_building()
	var screen: Control = add_child_autofree((load("res://features/minigame_host/minigame_screen.tscn") as PackedScene).instantiate())
	screen.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
	screen.size = Vector2(720, 1280)
	screen.call(&"open", {"building": &"fire"})
	var game: Minigame = screen.get(&"game")
	game.process_mode = Node.PROCESS_MODE_DISABLED
	screen.call(&"_start")
	var coins_before := Economy.coins()
	var bot: Object = (load("res://minigames/bucket_brigade/bot.gd") as GDScript).new()
	for i in 1800:
		if screen.get(&"last_result") != null:
			break
		bot.call(&"act", game, 1.0 / 30.0)
		game.advance(1.0 / 30.0)
	await wait_frames(3)
	var r: MinigameResult = screen.get(&"last_result")
	assert_not_null(r, "level 1 finished")
	assert_true(r.won)
	assert_eq(r.level, 1)
	assert_eq(int(screen.get(&"last_payout")["total"]), 30 + 15 * r.stars, "first clear")
	assert_eq(Economy.coins(), coins_before + 30 + 15 * r.stars)
	assert_eq(int(Save.section(&"minigames")["bucket_brigade"]["top"]), 2, "level 2 is open")
	assert_eq(Town.progress(&"fire"), 1, "one level beaten counts for the Fire Station")
