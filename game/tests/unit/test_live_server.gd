extends GutTest
## The game talking to a real server (server/), the way a phone does. Runs only when one is running and named:
##   cd server && docker compose up -d;  SQUISHY_SERVER=http://127.0.0.1:7350 game/run_tests.sh
## (CI does this in its "server" job.) Without SQUISHY_SERVER these tests are skipped.

var address := OS.get_environment("SQUISHY_SERVER")


func _api(device: String) -> NakamaGameServer:
	return NakamaGameServer.new(address, ServerService.DEV_KEY, device, self)


func _device() -> String:
	return "gut-" + Crypto.new().generate_random_bytes(12).hex_encode()


func test_a_phone_plays_with_the_real_server() -> void:
	if address == "":
		pass_test("no server to talk to (set SQUISHY_SERVER)")
		return
	var api := _api(_device())
	var hello: Dictionary = await api.hello()
	assert_true(hello.get("ok", false), "the server answers: %s" % hello)
	var state: Dictionary = await api.load_state()
	assert_true(state["ok"])
	assert_eq((state["collection"] as Dictionary).keys(), ["bao"], "the starter squishy")
	assert_typeof(state["collection"]["bao"]["level"], TYPE_INT, "numbers come back as whole numbers")
	var box: Dictionary = await api.open_box(&"mystery", &"", true)
	assert_eq(box["squishy"], &"gyoza", "the tutorial box")
	assert_typeof(box["squishy"], TYPE_STRING_NAME)
	var run: Dictionary = await api.submit_run(&"sky_bounce", 30.0, 999)
	assert_eq(run["coins"], 60, "the server's coin check")
	assert_true(run["capped"])
	var bad: Dictionary = await api.level_up(&"whale")
	assert_eq(bad["error"], &"not_owned")


func test_the_whole_game_follows_the_server() -> void:
	if address == "":
		pass_test("no server to talk to (set SQUISHY_SERVER)")
		return
	var api := _api(_device())
	Save.wipe()
	Save.load_game()
	Collection.server = api
	assert_true(await Collection.sync(), "the collection came from the server")
	assert_true(Collection.owned(&"bao"))
	Economy.earn(500, &"test")
	var answer: Dictionary = await Collection.open_box(&"mystery", &"", 1)
	assert_true(answer.get("ok", false), str(answer))
	assert_true(Collection.owned(StringName(answer["squishy"])), "the server's squishy moved in")


func test_no_server_means_offline_not_a_crash() -> void:
	var api := NakamaGameServer.new("http://127.0.0.1:9", ServerService.DEV_KEY, _device(), self)
	var answer: Dictionary = await api.load_state()
	assert_false(answer["ok"])
	assert_eq(answer["error"], &"offline")


func test_moving_a_town_to_a_new_phone() -> void:
	if address == "":
		pass_test("no server to talk to (set SQUISHY_SERVER)")
		return
	var old_phone := _api(_device())
	var new_phone_id := _device()
	var new_phone := _api(new_phone_id)
	await old_phone.load_state()
	await old_phone.open_box(&"mystery", &"", true)
	var town := JSON.stringify({"version": 1, "revision": 9, "data": {"town": {"levels": {"dumpling": 5}}}})
	assert_true((await old_phone.save_town(town, 9))["ok"])
	var made: Dictionary = await old_phone.transfer_create()
	await new_phone.load_state()
	var look: Dictionary = await new_phone.transfer_use(made["code"], made["pin"], false)
	assert_eq(int(look["saved"]["steamhouse"]), 5, "Which town? shows the saved town")
	assert_true((await new_phone.transfer_use(made["code"], made["pin"], true))["ok"])
	var back: Dictionary = await new_phone.load_town()
	assert_eq(back["town"], town, "the new phone now has the saved town")
	assert_true((await new_phone.load_state())["collection"].has("gyoza"))


func test_daily_quests_on_the_real_server() -> void:
	if address == "":
		pass_test("no server to talk to (set SQUISHY_SERVER)")
		return
	var api := _api(_device())
	await api.load_state()
	var games := [{"id": "sky_bounce", "kind": "endless"}, {"id": "squish_breaker", "kind": "levels"}]
	var day := QuestsService.today()
	var board: Dictionary = await api.quests(day, games)
	assert_true(board["ok"], str(board))
	assert_eq((board["quests"] as Array).size(), 2)
	var game := StringName(board["challenge"]["game"])
	var report := {"day": day, "games": games, "score": 10, "metric": 1, "won": true, "level": 1, "stars": 3, "prev_stars": 0, "newest": false}
	var run: Dictionary = await api.submit_run(game, 60.0, 15, &"levels" if game == &"squish_breaker" else &"endless", report)
	assert_true(run["first_today"])
	assert_eq(run["coins"], 30, "double for the first game today")
	assert_true("challenge" in run["quests_done"])
	var got: Dictionary = await api.quest_claim(day, "challenge")
	assert_eq(got["gems"], 3)


func test_the_visitor_on_the_real_server() -> void:
	if address == "":
		pass_test("no server to talk to (set SQUISHY_SERVER)")
		return
	var api := _api(_device())
	await api.load_state()
	var v: Dictionary = await api.visitor(QuestsService.today())
	assert_true(v.get("ok", false), str(v))
	assert_true(v["squishy"] is StringName and v["squishy"] != &"", "a squishy id, like the pretend server's")
	assert_false(GameData.squishy(v["squishy"]).is_empty(), "one of the game's squishies")
	var hi: Dictionary = await api.visitor_hi(QuestsService.today())
	assert_eq([hi["ok"], hi["days"], hi["today_done"]], [true, 1, true])
	assert_eq((await api.visitor_hi(QuestsService.today()))["error"], &"already_today")
