extends GutTest
## Accounts (account.html): the grown-up gate, the cloud save of the town, and deleting an account.


## A real-server stand-in: the pretend server's answers, but "remote" (so the town goes to it: cloud save).
class CloudServer extends FakeGameServer:
	func is_remote() -> bool:
		return true


var account: AccountService
var cloud: CloudServer


func before_each() -> void:
	Save.wipe()
	Save.load_game()
	cloud = CloudServer.new({}, Callable(), 1)
	Server.api = cloud
	Collection.server = cloud
	account = AccountService.new()
	account.save = Save
	account.server_service = Server
	add_child_autofree(account)
	await wait_frames(1)


func after_each() -> void:
	Server.api = FakeGameServer.new(Save.section(&"pretend_server"), Save.mark_dirty, 3)
	Collection.server = Server.api


func test_the_town_goes_to_the_cloud_a_moment_after_it_changes() -> void:
	Save.section(&"town")["levels"] = {"dumpling": 3}
	Save.save_now()
	assert_eq(cloud.load_town()["town"], null, "not straight away: several changes become one upload")
	await wait_seconds(AccountService.UPLOAD_DELAY + 0.5)
	var up: Dictionary = cloud.load_town()
	assert_true(up["town"] is String, "uploaded")
	assert_eq(int(up["revision"]), Save.revision)
	assert_false((up["town"] as String).contains("pretend_server"), "the pretend server's memory stays on the phone")


func test_a_newer_town_from_another_phone_replaces_this_one_an_older_one_does_not() -> void:
	Save.section(&"town")["levels"] = {"dumpling": 2}
	Save.save_now()
	var other := {"version": SaveService.CURRENT_VERSION, "revision": Save.revision + 5, "data": {"town": {"levels": {"dumpling": 7}}}}
	cloud.save_town(JSON.stringify(other), Save.revision + 5)
	var replaced := [false]
	account.town_replaced.connect(func() -> void: replaced[0] = true)
	assert_true(await account.pull_town())
	assert_true(replaced[0], "the screens start again")
	assert_eq(int(Save.section(&"town")["levels"]["dumpling"]), 7)
	other["revision"] = 1
	other["data"] = {"town": {"levels": {"dumpling": 1}}}
	cloud.save_town(JSON.stringify(other), 1)
	assert_false(await account.pull_town(), "an older town never overwrites the phone's")
	assert_eq(int(Save.section(&"town")["levels"]["dumpling"]), 7)


func test_a_town_saved_by_a_newer_game_is_refused() -> void:
	var newer := {"version": SaveService.CURRENT_VERSION + 1, "revision": 99, "data": {"town": {}}}
	assert_false(Save.import_text(JSON.stringify(newer)))


func test_deleting_starts_a_new_town_with_a_new_guest_login() -> void:
	Save.section(&"town")["levels"] = {"dumpling": 4}
	Save.save_now()
	var id_before := Server.device_id()
	var answer: Dictionary = await account.delete_account()
	assert_true(answer["ok"])
	assert_gt(float(cloud.state["deletion_after"]), 0.0, "the server deletes it in 30 days")
	assert_false(Save.section(&"town").has("levels") and int((Save.section(&"town")["levels"] as Dictionary).get("dumpling", 0)) == 4, "the phone starts over")
	assert_ne(Server.device_id(), id_before, "a new guest")


func test_the_grown_up_gate() -> void:
	var gate := GrownUpGate.new()
	gate._build("why")
	add_child_autofree(gate)
	var passed := [null]
	gate.answered.connect(func(p: bool) -> void: passed[0] = p)
	for d in str(gate.answer):
		gate.press(d)
	gate.press("ok")
	assert_eq(passed[0], true, "the right sum opens it")
	assert_true(GrownUpGate.words(17) == "seventeen" and GrownUpGate.words(23) == "twenty-three")


func test_three_wrong_answers_close_the_gate_for_a_while() -> void:
	var gate := GrownUpGate.new()
	gate._build("why")
	add_child_autofree(gate)
	var passed := [null]
	gate.answered.connect(func(p: bool) -> void: passed[0] = p)
	for i in 3:
		gate.press(str((gate.answer + 1) % 10))
		gate.press("ok")
	assert_eq(passed[0], false)
	assert_gt(GrownUpGate._locked_until, Time.get_ticks_msec(), "a 30-second pause")
	GrownUpGate._locked_until = 0
