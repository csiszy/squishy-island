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


func test_every_house_is_open_from_day_one() -> void:
	var c := _card(&"kitchen")
	assert_eq(c["level_text"], "Level 1")
	assert_eq(_action_ids(c), [&"open_house", &"upgrade"])


func test_an_empty_plot_can_be_built() -> void:
	w.economy.earn(100000, &"test")
	var c := _card(&"salon")
	assert_eq(c["level_text"], "Empty plot")
	assert_eq(c["actions"][0]["text"], "Build it! (420 coins)")
	assert_true(c["actions"][0]["enabled"])


func test_not_enough_coins_is_said_kindly() -> void:
	w.economy.earn(100, &"test")
	var c := _card(&"salon")
	assert_false(c["actions"][0]["enabled"])
	assert_eq(c["note"], "You need 320 more coins")


func test_three_games_are_ready_to_play() -> void:
	for id: StringName in [&"playground", &"restaurant", &"post"]:
		assert_has(_action_ids(_card(id)), &"play", String(id))


func test_the_factory_opens_and_says_its_next_goal() -> void:
	var c := _card(&"factory")
	assert_eq(_action_ids(c), [&"open_factory", &"upgrade"])
	assert_eq(c["note"], "Next level needs: Open 5 boxes")


func test_the_gem_mine_has_one_level() -> void:
	var c := _card(&"gemmine")
	assert_eq(c["level_text"], "")
	assert_eq(_action_ids(c), [&"gem_store"])
