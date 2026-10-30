extends GutTest
## The Visitor of the week on the phone (guide.html "Daily visits"): who visits, saying hi once a day, moving in.

var server: FakeGameServer


func before_each() -> void:
	Save.wipe()
	Save.load_game()
	server = FakeGameServer.new(Save.section(&"pretend_server"), Save.mark_dirty, 3)
	Server.api = server
	Collection.server = server
	await Collection.sync()
	Quests.visitor = {}


func test_a_squishy_i_dont_own_visits_all_week() -> void:
	var v: Dictionary = await Quests.refresh_visitor()
	assert_true(v["ok"])
	var id := StringName(v["squishy"])
	assert_ne(id, &"")
	assert_false(Collection.owned(id), "one I don't have yet")
	assert_true(v["rarity"] in ["C", "U", "R", "E"])
	assert_eq([v["days"], v["needed"], v["moved_in"]], [0, 4, false])
	assert_true(Quests.visitor_waiting(), "the map pin shows a !")
	# later in the same week: the same visitor
	var monday := FakeQuests.day_text(FakeQuests.week_of("2026-11-04") * 7 + 4)
	assert_eq(monday, "2026-11-02")
	var state := {"collection": {}}
	var a := FakeVisitor.answer(state, "2026-11-02")
	assert_eq(FakeVisitor.answer(state, "2026-11-06")["squishy"], a["squishy"])
	assert_eq(a["until"], "2026-11-08", "it leaves on Sunday")
	assert_ne(FakeVisitor.answer(state, "2026-11-09")["squishy"], a["squishy"], "next week someone else")


func test_one_hi_a_day_and_the_last_one_moves_it_in() -> void:
	await Quests.refresh_visitor()
	var id := StringName(Quests.visitor["squishy"])
	var hi: Dictionary = await Quests.say_hi()
	assert_eq([hi["ok"], hi["days"], hi["today_done"]], [true, 1, true])
	assert_false(Quests.visitor_waiting(), "said hi today: no ! on the pin")
	assert_eq((await Quests.say_hi())["error"], &"already_today")
	# pretend hi was said on three other days this week (and not yet today)
	server.state["visitor"]["days"] = ["day 1", "day 2", "day 3"]
	var moved := []
	var listen := func(sq: StringName) -> void: moved.append(sq)
	Events.squishy_moved_in.connect(listen)
	var last: Dictionary = await Quests.say_hi()
	Events.squishy_moved_in.disconnect(listen)
	assert_true(last["moved_in"])
	assert_true(Collection.owned(id), "it lives on the island now")
	assert_eq(moved, [id])
	assert_eq((await Quests.say_hi())["error"], &"moved_in")


func test_a_visitor_arriving_on_friday_stays_through_next_week() -> void:
	var state := {"collection": {}}
	var v := FakeVisitor.answer(state, "2026-10-30")
	assert_eq(v["until"], "2026-11-08")
	var give := func(_id: StringName, _s: bool) -> bool: return true
	for day: String in ["2026-10-30", "2026-10-31", "2026-11-01"]:
		assert_true(FakeVisitor.hi(state, day, give)["ok"])
	state["collection"][String(v["squishy"])] = {"level": 1, "spares": 0, "sparkly": false}
	var monday := FakeVisitor.hi(state, "2026-11-02", give)
	assert_eq([monday["squishy"], monday["moved_in"]], [v["squishy"], true])


func test_the_map_shows_the_visitor_in_the_park() -> void:
	await Quests.refresh_visitor()
	var city: Control = (load("res://features/city/city_screen.tscn") as PackedScene).instantiate()
	add_child_autofree(city)
	await wait_frames(2)
	var park: ParkVisitor = city.get("_visitor")
	assert_not_null(park)
	assert_true(park.visible)
	assert_eq(park.squishy, StringName(Quests.visitor["squishy"]))
	var art: Control = city.call("_visitor_art", park.squishy, 2, 4)
	var hearts := art.find_child("Hearts", true, false)
	assert_eq(hearts.get_child_count(), 4)
	assert_eq((hearts.get_child(1) as Control).modulate.a, 1.0, "two days: two full hearts")
	assert_lt((hearts.get_child(2) as Control).modulate.a, 1.0)
	# moved in: the park is empty again
	Quests.visitor["moved_in"] = true
	Quests.visitor_changed.emit()
	assert_false(park.visible)
