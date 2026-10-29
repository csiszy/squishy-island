extends GutTest
## The building card on the map shows the right words and buttons.

var w: TestWorld


func before_each() -> void:
	w = TestWorld.new()
	add_child_autofree(w)


func _card(id: StringName) -> Dictionary:
	return BuildingCardModel.for_building(id, w.town, w.collection, w.economy)


func _action_ids(card: Dictionary) -> Array:
	return (card["actions"] as Array).map(func(a: Dictionary) -> StringName: return a["id"])


func test_a_house_you_can_enter() -> void:
	var c := _card(&"dumpling")
	assert_eq(c["title"], "Dumpling Steamhouse")
	assert_eq(c["kind"], "Family house · Dumpling Gang")
	assert_eq(c["level_text"], "Level 1")
	assert_eq(_action_ids(c), [&"open_house", &"upgrade"])
	assert_eq(c["actions"][1]["text"], "Fix it up! (100 coins)")
	assert_eq(c["note"], "You need 100 more coins")


func test_a_house_that_needs_more_family() -> void:
	w.economy.earn(100000, &"test")
	for i in 3:
		w.town.upgrade(&"dumpling")
	assert_eq(_card(&"dumpling")["note"], "Needs 2 family squishies living here (you have 1)")


func test_a_locked_house_says_what_unlocks_it() -> void:
	var c := _card(&"kitchen")
	assert_eq(c["level_text"], "Locked")
	assert_eq(c["note"], "Unlocks when the Dumpling Steamhouse reaches level 4")
	assert_eq(_action_ids(c), [])


func test_the_market_unlocks_with_squishies() -> void:
	assert_eq(_card(&"market")["note"], "Unlocks when you have 8 squishies")


func test_an_empty_plot_can_be_built() -> void:
	w.economy.earn(100000, &"test")
	await w.give([&"gyoza"])
	w.town.upgrade(&"dumpling")
	w.town.upgrade(&"dumpling")
	var c := _card(&"restaurant")
	assert_eq(c["level_text"], "Empty plot")
	assert_eq(c["actions"][0]["text"], "Build it! (360 coins)")
	assert_true(c["actions"][0]["enabled"])


func test_not_enough_coins_is_said_kindly() -> void:
	w.economy.earn(100, &"test")
	await w.give([&"gyoza"])
	w.town.upgrade(&"dumpling")
	w.economy.earn(200, &"test")
	w.town.upgrade(&"dumpling")
	var c := _card(&"restaurant")
	assert_false(c["actions"][0]["enabled"])
	assert_eq(c["note"], "You need 360 more coins")


func test_the_factory_opens_and_says_its_next_goal() -> void:
	var c := _card(&"factory")
	assert_eq(_action_ids(c), [&"open_factory", &"upgrade"])
	assert_eq(c["note"], "Next level needs: Open 5 boxes")


func test_the_gem_mine_has_one_level() -> void:
	var c := _card(&"gemmine")
	assert_eq(c["level_text"], "")
	assert_eq(_action_ids(c), [&"gem_store"])
