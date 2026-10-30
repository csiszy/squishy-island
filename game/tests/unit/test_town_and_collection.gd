extends GutTest
## Town, Collection and Economy together: day one, boxes, renovating, unlock order, decor and Cozy.

var w: TestWorld


func before_each() -> void:
	w = TestWorld.new()
	add_child_autofree(w)


func test_day_one_matches_the_book() -> void:
	assert_eq(w.collection.owned_ids(), [&"bao"] as Array[StringName], "a free Bao Bun")
	assert_eq(w.town.level(&"dumpling"), 1, "the Steamhouse starts broken")
	assert_eq(w.town.level(&"kitchen"), 1, "every house is there, broken")
	for built: StringName in [&"playground", &"restaurant", &"post", &"factory"]:
		assert_eq(w.town.level(built), 1, "%s is built on day one" % built)
	assert_eq(w.town.level(&"salon"), 0, "other fun buildings are empty plots")
	assert_eq(w.town.level(&"market"), 0)
	assert_eq(w.economy.coins(), 0)


func test_the_whole_island_is_open_from_day_one() -> void:
	for b: Dictionary in GameData.buildings():
		assert_true(w.town.is_unlocked(StringName(b["id"])), "%s is open" % b["id"])


func test_opening_a_box_costs_coins_and_counts_for_the_factory() -> void:
	watch_signals(Events)
	w.economy.earn(250, &"test")
	var a: Dictionary = await w.collection.open_box(&"mystery", &"", 1)
	assert_true(a["ok"])
	assert_eq(w.economy.coins(), 50)
	assert_true(w.collection.owned(a["squishy"]))
	assert_eq(w.town.progress(&"factory"), 1, "boxes opened grow the Factory")
	assert_signal_emitted(Events, "box_opened")


func test_boxes_need_coins_and_the_right_factory_level() -> void:
	assert_eq(w.collection.box_blocker(&"mystery", 1), &"coins")
	w.economy.earn(5000, &"test")
	assert_eq(w.collection.box_blocker(&"golden", 5), &"factory_level", "Golden Boxes from Factory level 6")
	assert_eq(w.collection.box_blocker(&"family", 2), &"factory_level", "Family Boxes from Factory level 3")
	assert_eq(w.collection.box_blocker(&"golden", 6), &"")
	var a: Dictionary = await w.collection.open_box(&"golden", &"", 2)
	assert_false(a["ok"])
	assert_eq(w.economy.coins(), 5000, "nothing was charged")


func test_coins_come_back_when_the_server_cannot_be_reached() -> void:
	w.economy.earn(200, &"test")
	w.server.offline = true
	var a: Dictionary = await w.collection.open_box(&"mystery", &"", 1)
	assert_eq(a["error"], &"offline")
	assert_eq(w.economy.coins(), 200)


func test_the_tutorial_box_is_free() -> void:
	var a: Dictionary = await w.collection.open_box(&"mystery", &"", 1, true)
	assert_eq(a["squishy"], &"gyoza")
	assert_eq(w.economy.coins(), 0)
	assert_eq(w.collection.family_count(&"dumpling"), 2)


func test_rare_guarantee_countdown() -> void:
	assert_eq(w.collection.boxes_until_rare(), 10)
	w.economy.earn(200 * 3, &"test")
	for i in 3:
		await w.collection.open_box(&"mystery", &"", 1)
	assert_eq(w.collection.boxes_until_rare(), 10 - w.collection.pity())


func test_fixing_up_the_steamhouse() -> void:
	var check := w.town.upgrade_check(&"dumpling")
	assert_eq(check["reason"], &"coins")
	assert_eq(check["coins"], 100)
	w.economy.earn(100, &"test")
	watch_signals(Events)
	assert_true(w.town.upgrade(&"dumpling")["can"])
	assert_eq(w.town.level(&"dumpling"), 2)
	assert_eq(w.economy.coins(), 0)
	assert_signal_emitted_with_parameters(Events, "building_upgraded", [&"dumpling", 2])


func test_some_house_levels_need_family_squishies() -> void:
	w.economy.earn(100000, &"test")
	for i in 3:
		w.town.upgrade(&"dumpling")
	assert_eq(w.town.level(&"dumpling"), 4, "levels 3-4 need 1 family squishy: Bao is enough")
	var check := w.town.upgrade_check(&"dumpling")
	assert_eq(check["reason"], &"squishies", "level 5 needs 2")
	assert_eq(check["squishies_have"], 1)
	assert_eq(check["squishies_needed"], 2)
	await w.give([&"gyoza"])
	assert_true(w.town.upgrade_check(&"dumpling")["can"])


func test_a_squishy_moves_into_a_house_nobody_has_fixed_yet() -> void:
	await w.give([&"toast"])
	assert_eq(w.collection.family_count(&"kitchen"), 1)
	assert_true(w.town.is_unlocked(&"kitchen"))


func test_unlocks_are_announced_once() -> void:
	var first := w.town.check_unlocks()
	assert_has(first, &"dumpling")
	assert_has(first, &"forest", "everything is open, so everything is announced on day one")
	assert_eq(w.town.check_unlocks(), [] as Array[StringName])


func test_fun_buildings_need_their_goal_then_coins() -> void:
	w.economy.earn(100000, &"test")
	var c := w.town.upgrade_check(&"factory")
	assert_eq(c["reason"], &"goal", "Factory level 2: open 5 boxes first")
	assert_eq(c["target"], 5)
	w.town.add_progress(&"factory", 5)
	assert_true(w.town.upgrade(&"factory")["can"])
	assert_eq(w.town.level(&"factory"), 2)


func test_building_an_empty_plot_only_costs_coins() -> void:
	w.economy.earn(100000, &"test")
	var c := w.town.upgrade_check(&"salon")
	assert_true(c["can"])
	assert_eq(c["coins"], 420, "300 × the Salon's 1.4")
	w.town.upgrade(&"salon")
	assert_eq(w.town.level(&"salon"), 1)


func test_best_scores_only_go_up() -> void:
	w.town.offer_progress(&"restaurant", 3000)
	w.town.offer_progress(&"restaurant", 1000)
	assert_eq(w.town.progress(&"restaurant"), 3000)


func test_buying_decor_adds_cozy() -> void:
	w.economy.earn(1000, &"test")
	assert_true(w.town.buy_decor(&"dumpling", 6, &"classic")["ok"], "the Lucky Knot")
	assert_eq(w.economy.coins(), 880)
	assert_eq(w.town.cozy(&"dumpling"), 1)
	assert_eq(w.town.buy_decor(&"dumpling", 6, &"classic")["reason"], &"owned")
	assert_true(w.town.buy_decor(&"dumpling", 6, &"candy")["ok"])
	assert_eq(w.town.decor_style(&"dumpling", 6), &"candy")
	assert_eq(w.town.cozy(&"dumpling"), 1, "a second design of the same item adds no Cozy")
	assert_true(w.town.use_decor(&"dumpling", 6, &"classic"))
	assert_false(w.town.use_decor(&"dumpling", 6, &"star"), "only designs you own")


func test_cozy_bonus_is_five_percent_per_five_points() -> void:
	w.economy.earn(100000, &"test")
	w.town.buy_decor(&"dumpling", 1, &"classic")  # +4
	assert_eq(w.town.cozy_bonus(&"dumpling"), 0.0)
	w.town.buy_decor(&"dumpling", 2, &"classic")  # +2
	assert_almost_eq(w.town.cozy_bonus(&"dumpling"), 0.05, 0.0001)


func test_decor_can_be_bought_in_any_house() -> void:
	w.economy.earn(1000, &"test")
	assert_true(w.town.buy_decor(&"kitchen", 1, &"classic")["ok"])


func test_spares_level_up_and_swap_for_stars() -> void:
	await w.give([&"bao", &"bao"])  # two spares
	assert_eq(w.collection.spare_ids(), [&"bao"] as Array[StringName])
	assert_true((await w.collection.level_up(&"bao"))["ok"])
	assert_eq(int(w.collection.entry(&"bao")["level"]), 2)
	assert_eq(w.collection.spares_for_next_level(&"bao"), 2)
	assert_true((await w.collection.swap_spare(&"bao"))["ok"])
	assert_eq(w.economy.stars(), 5)
	assert_eq(w.collection.spare_ids(), [] as Array[StringName])


func test_everything_is_saved() -> void:
	w.economy.earn(500, &"test")
	w.town.upgrade(&"dumpling")
	w.save.save_now()
	var again := TestWorld.new()
	again.save.storage = w.save.storage
	again.save.load_game()
	again.server.state = again.save.section(&"pretend_server")
	add_child_autofree(again)
	await again.collection.sync()
	assert_eq(again.economy.coins(), 400)
	assert_eq(again.town.level(&"dumpling"), 2)
	assert_true(again.collection.owned(&"bao"))
