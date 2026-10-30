extends GutTest
## The pretend server follows the Factory page's rules: odds, Rare guarantee, Sparkly, Spare Shelf, Stars.

var server: FakeGameServer


func before_each() -> void:
	server = FakeGameServer.new({}, Callable(), 42)
	server.load_state()


func _count_rarities(kind: StringName, n: int, family := &"") -> Dictionary:
	var c := {"C": 0, "U": 0, "R": 0, "E": 0, "L": 0}
	for i in n:
		var a := server.open_box(kind, family)
		c[a["rarity"]] = int(c[a["rarity"]]) + 1
	return c


func test_a_new_player_starts_with_bao() -> void:
	var s := server.load_state()
	assert_true(s["ok"])
	assert_eq((s["collection"] as Dictionary).keys(), ["bao"])
	server.load_state()
	assert_eq((server.state["collection"] as Dictionary).size(), 1, "the gift comes only once")


func test_mystery_box_odds_are_close_to_the_published_ones() -> void:
	var n := 20000
	var c := _count_rarities(&"mystery", n)
	# the Rare guarantee pushes Rare a little above 13%; the others stay near their odds
	assert_almost_eq(c["C"] * 100.0 / n, 55.0, 3.0, "Common")
	assert_almost_eq(c["U"] * 100.0 / n, 25.0, 2.0, "Uncommon")
	assert_between(c["R"] * 100.0 / n, 12.0, 18.0, "Rare")
	assert_almost_eq(c["E"] * 100.0 / n, 6.0, 1.0, "Epic")
	assert_almost_eq(c["L"] * 100.0 / n, 1.0, 0.4, "Legendary")


func test_golden_boxes_have_no_commons() -> void:
	assert_eq(_count_rarities(&"golden", 2000)["C"], 0)


func test_family_boxes_only_roll_that_family() -> void:
	for i in 200:
		var a := server.open_box(&"family", &"pets")
		assert_eq(GameData.squishy(a["squishy"])["family"], "pets")
		if not is_passing():
			return


func test_never_more_than_9_boxes_in_a_row_without_a_rare() -> void:
	var run := 0
	var longest := 0
	for i in 5000:
		var a := server.open_box(&"mystery")
		run = run + 1 if a["rarity"] in ["C", "U"] else 0
		longest = maxi(longest, run)
	assert_lte(longest, 9)


func test_a_duplicate_goes_onto_the_spare_shelf() -> void:
	server.state["collection"] = {}
	var seen := {}
	var spares := 0
	for i in 300:
		var a := server.open_box(&"mystery")
		assert_eq(a["is_new"], not seen.has(a["squishy"]))
		if not seen.has(a["squishy"]):
			seen[a["squishy"]] = true
		else:
			spares += 1
	var total := 0
	for e: Dictionary in (server.state["collection"] as Dictionary).values():
		total += int(e["spares"])
	assert_eq(total, spares)


func test_about_one_box_in_fifty_is_sparkly() -> void:
	var n := 10000
	var sparkly := 0
	for i in n:
		if server.open_box(&"mystery")["sparkly"]:
			sparkly += 1
	assert_almost_eq(sparkly * 100.0 / n, 2.0, 0.5)


func test_the_tutorial_box_is_always_gyoza_once() -> void:
	assert_eq(server.open_box(&"mystery", &"", true)["squishy"], &"gyoza")
	var again := server.open_box(&"mystery", &"", true)
	assert_true(again["ok"])
	assert_eq(int(server.state["boxes_opened"]), 2)


func test_levelling_up_uses_the_spare_table() -> void:
	# Common: 1 / 2 / 3 / 4 spares; level 5 is Sparkly
	server.state["collection"] = {"bao": {"level": 1, "spares": 10, "sparkly": false}}
	for want_spares_left: int in [9, 7, 4, 0]:
		var a := server.level_up(&"bao")
		assert_true(a["ok"])
		assert_eq(int(a["entry"]["spares"]), want_spares_left)
	assert_eq(int(server.state["collection"]["bao"]["level"]), 5)
	assert_true(server.state["collection"]["bao"]["sparkly"], "level 5 = Sparkly")
	assert_eq(server.level_up(&"bao")["error"], &"max_level")


func test_legendaries_need_one_spare_per_level() -> void:
	assert_eq(FakeGameServer.spares_needed(&"goldumpling", 1), 1)
	assert_eq(FakeGameServer.spares_needed(&"goldumpling", 4), 1)
	assert_eq(FakeGameServer.spares_needed(&"bao", 4), 4)


func test_not_enough_spares() -> void:
	server.state["collection"] = {"bao": {"level": 2, "spares": 1, "sparkly": false}}
	assert_eq(server.level_up(&"bao")["error"], &"no_spares")
	assert_eq(server.level_up(&"gyoza")["error"], &"not_owned")


func test_swapping_a_spare_gives_stars_by_rarity() -> void:
	server.state["collection"] = {"bao": {"level": 1, "spares": 2, "sparkly": false}, "goldumpling": {"level": 1, "spares": 1, "sparkly": false}}
	assert_eq(server.swap_spare(&"bao")["stars"], 5)
	assert_eq(server.swap_spare(&"goldumpling")["stars"], 305)
	assert_eq(server.swap_spare(&"goldumpling")["error"], &"no_spares")


func test_offline_answers_kindly() -> void:
	server.offline = true
	assert_eq(server.open_box(&"mystery")["error"], &"offline")
	assert_eq(server.load_state()["error"], &"offline")
