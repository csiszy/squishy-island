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
