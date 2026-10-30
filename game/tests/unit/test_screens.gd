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


func test_pins_stay_under_the_buttons() -> void:
	var city: Control = add_child_autofree((load("res://features/city/city_screen.tscn") as PackedScene).instantiate())
	await wait_frames(3)
	var layer: Control = city.get("_bubble_layer")
	for pin in layer.get_children():
		assert_eq((pin as CanvasItem).z_index, 0, "pins are sorted by order, not lifted with z_index")
	var hud := city.get_children().filter(func(n: Node) -> bool: return n is MarginContainer)
	assert_false(hud.is_empty())
	assert_gt((hud[0] as Node).get_index(), layer.get_index(), "the buttons are drawn after (over) the pins")


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


func test_opening_a_box_in_the_factory() -> void:
	var factory: Control = add_child_autofree((load("res://features/factory/factory_screen.tscn") as PackedScene).instantiate())
	factory.call("open", {})
	Economy.earn(200, &"test")
	await factory.call("open_box")
	assert_eq(Economy.coins(), 0)
	assert_eq(Collection.owned_count() + (1 if Collection.spare_ids().size() > 0 else 0) >= 2, true, "a squishy arrived (new or a spare)")
	assert_eq(Town.progress(&"factory"), 1)
	assert_not_null(factory.get("_result"), "the result card shows")


func test_a_locked_box_cannot_be_opened() -> void:
	var factory: Control = add_child_autofree((load("res://features/factory/factory_screen.tscn") as PackedScene).instantiate())
	factory.call("open", {})
	Economy.earn(1000, &"test")
	factory.call("_choose", &"golden")
	await factory.call("open_box")
	assert_eq(Economy.coins(), 1000, "Golden Boxes need Factory level 6")


func test_the_spare_shelf_levels_up_and_swaps() -> void:
	var col: Dictionary = (Server.api as FakeGameServer).state["collection"]
	col["bao"] = {"level": 1, "spares": 2, "sparkly": false}
	await Collection.sync()
	var screen: Control = add_child_autofree((load("res://features/collection/collection_screen.tscn") as PackedScene).instantiate())
	screen.call("open", {"tab": &"shelf"})
	await screen.call("_level_up", &"bao")
	assert_eq(int(Collection.entry(&"bao")["level"]), 2)
	await screen.call("_swap", &"bao", 5)
	assert_eq(Economy.stars(), 5)
	assert_eq(Collection.spare_ids(), [] as Array[StringName])


## A duplicate's "Spare Shelf" button: the message is gone when you come back to the Factory.
func test_going_to_the_shelf_clears_the_factory_message() -> void:
	var factory: Control = add_child_autofree((load("res://features/factory/factory_screen.tscn") as PackedScene).instantiate())
	factory.call("open", {})
	var asked: Array = []
	var catch_go := func(screen: StringName, args: Dictionary) -> void: asked.append([screen, args])
	Nav.go_requested.connect(catch_go)
	# open boxes until one is a duplicate (the pretend server is seeded, so this is quick)
	var shelf: Button = null
	for i in 30:
		Economy.earn(200, &"test")
		await factory.call("open_box")
		var result: Control = factory.get("_result")
		if result == null:
			continue
		for b in result.find_children("*", "Button", true, false):
			if (b as Button).text == Text.t(&"factory.spare_shelf"):
				shelf = b
		if shelf != null:
			break
	assert_not_null(shelf, "a duplicate came up")
	shelf.pressed.emit()
	Nav.go_requested.disconnect(catch_go)
	assert_eq(asked, [[&"collection", {"tab": &"shelf"}]])
	assert_null(factory.get("_result"), "the message is closed")


## A squishy not found yet in the book: tapping it goes to the Factory with its family chosen.
func test_a_missing_squishy_leads_to_the_factory() -> void:
	var book: Control = add_child_autofree((load("res://features/collection/collection_screen.tscn") as PackedScene).instantiate())
	book.call("open", {"tab": &"book"})
	await wait_frames(1)
	var asked: Array = []
	var catch_go := func(screen: StringName, args: Dictionary) -> void: asked.append([screen, args])
	Nav.go_requested.connect(catch_go)
	var tap := book.find_child("Find_gyoza", true, false) as Button
	assert_not_null(tap, "Gyoza is not found yet, so its tile can be tapped")
	tap.pressed.emit()
	Nav.go_requested.disconnect(catch_go)
	assert_eq(asked, [[&"factory", {"family": &"dumpling"}]])
	assert_null(book.find_child("Find_bao", true, false), "Bao is owned: nothing to find")


## Book -> Factory -> book goes back to the book already open, instead of piling up screens.
func test_screens_are_not_opened_twice() -> void:
	var vp := SubViewport.new()
	vp.size = Vector2i(720, 1280)
	add_child_autofree(vp)
	var app: Control = (load("res://app/main.tscn") as PackedScene).instantiate()
	vp.add_child(app)
	await wait_frames(2)
	Nav.go(&"collection", {"tab": &"book"})
	Nav.go(&"factory", {"family": &"dumpling"})
	Nav.go(&"collection", {"tab": &"shelf"})
	await wait_frames(1)
	assert_eq(app.call("screen_ids"), [&"city", &"collection"] as Array[StringName])
