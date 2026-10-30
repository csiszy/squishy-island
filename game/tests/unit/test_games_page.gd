extends GutTest
## The Games page (guide.html#games): every playable game with Play, the others "on the way".


func before_each() -> void:
	Save.wipe()
	Save.load_game()
	var server := FakeGameServer.new(Save.section(&"pretend_server"), Save.mark_dirty, 3)
	Server.api = server
	Collection.server = server
	await Collection.sync()
	Town.reload()
	GameData.minigames = MinigameCatalog.by_building()
	MinigameCatalog.load_all_words()


func test_three_games_to_play_and_seven_on_the_way() -> void:
	var lists: Array = load("res://features/games/games_screen.gd").call(&"game_buildings")
	assert_eq((lists[0] as Array).size(), 3, "Sky Bounce, Bistro Rush, Sort-a-Lot")
	assert_eq((lists[1] as Array).size(), 7, "the other fun buildings (not the Factory, Market or Gem Mine)")


func test_play_opens_the_game() -> void:
	var page: Control = add_child_autofree((load("res://features/games/games_screen.tscn") as PackedScene).instantiate())
	await wait_frames(2)
	var asked: Array = []
	var catch_go := func(screen: StringName, args: Dictionary) -> void: asked.append([screen, args])
	Nav.go_requested.connect(catch_go)
	var go := page.find_child("Go_post", true, false) as Button
	assert_not_null(go, "Sort-a-Lot has a Play button")
	go.pressed.emit()
	Nav.go_requested.disconnect(catch_go)
	assert_eq(asked, [[&"minigame", {"building": &"post"}]])


func test_words_of_every_game_are_ready_at_start() -> void:
	assert_eq(Text.t(&"sky_bounce.title"), "Sky Bounce")
	assert_eq(Text.t(&"bistro_rush.title"), "Bistro Rush")
	assert_eq(Text.t(&"sort_a_lot.title"), "Sort-a-Lot")
