extends GutTest
## Choosing the server (DEV menu): the pretend one on the phone, or a real one (your laptop, later the live one).

func _service() -> ServerService:
	var s := ServerService.new()
	s.storage = MemoryStorage.new()
	add_child_autofree(s)
	return s


func test_the_pretend_server_is_the_default() -> void:
	var s := _service()
	assert_eq(s.address(), "")
	assert_true(s.api is FakeGameServer)


func test_a_server_that_does_not_answer_is_not_used() -> void:
	var s := _service()
	var answer: Dictionary = await s.use("127.0.0.1:9")
	assert_false(answer["ok"])
	assert_eq(s.address(), "", "still the pretend server")
	assert_true(s.api is FakeGameServer)


func test_a_laptop_address_is_completed_and_remembered() -> void:
	var s := _service()
	var store := s.storage
	await s.use("192.168.1.20", false)
	assert_eq(s.address(), "http://192.168.1.20:7350", "http:// and the server's port are added")
	assert_true(s.api is NakamaGameServer)
	# the next start of the game remembers it, and the phone keeps its guest id
	var id := s.device_id()
	var again := ServerService.new()
	again.storage = store
	add_child_autofree(again)
	assert_eq(again.address(), "http://192.168.1.20:7350")
	assert_eq(again.device_id(), id)
	assert_true(id.begins_with("island-") and id.length() > 30, "a random guest id, not the phone's own")
	await again.use("", false)
	assert_true(again.api is FakeGameServer, "back to the pretend server")
