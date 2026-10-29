extends GutTest
## The screens start and their main actions work (with the real services, in memory).


func before_each() -> void:
	Save.wipe()
	Save.load_game()
	var server := FakeGameServer.new(Save.section(&"pretend_server"), Save.mark_dirty, 3)
	Server.api = server
	Collection.server = server
	await Collection.sync()
	Town.reload()


func test_the_map_shows_every_building() -> void:
	var city: Control = add_child_autofree((load("res://features/city/city_screen.tscn") as PackedScene).instantiate())
	await wait_frames(2)
	var slots: Dictionary = city.get("_slots")
	assert_eq(slots.size(), 21)
	assert_eq((slots[&"dumpling"] as BuildingSlot).level, 1)
	assert_eq((slots[&"dumpling"] as BuildingSlot).owned, [&"bao"] as Array[StringName], "Bao lives at the Steamhouse")


func test_fixing_up_from_the_map_card() -> void:
	var city: Control = add_child_autofree((load("res://features/city/city_screen.tscn") as PackedScene).instantiate())
	await wait_frames(2)
	Economy.earn(100, &"test")
	city.call("_on_card_action", &"dumpling", &"upgrade")
	assert_eq(Town.level(&"dumpling"), 2)
	assert_eq((city.get("_slots")[&"dumpling"] as BuildingSlot).level, 2, "the map shows the new level")


func test_buying_decor_in_a_house() -> void:
	var house: Control = add_child_autofree((load("res://features/houses/house_screen.tscn") as PackedScene).instantiate())
	house.call("open", {"id": &"dumpling"})
	await wait_frames(2)
	Economy.earn(500, &"test")
	house.call("_pick_design", 6, &"candy")
	assert_eq(Town.decor_style(&"dumpling", 6), &"", "trying it on is free")
	assert_true((house.get("_decor_nodes") as Dictionary).has(6), "but it shows in the room")
	house.call("_buy", 6, &"candy", "Lucky Knot")
	assert_eq(Town.decor_style(&"dumpling", 6), &"candy")
	assert_eq(Economy.coins(), 500 - 140)
