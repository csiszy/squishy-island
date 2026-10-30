extends GutHookScript
## Runs before every test run: the real autoloads switch to in-memory storage and a fresh pretend server,
## so tests never touch the developer's real save or settings files.


func run() -> void:
	var root := Engine.get_main_loop() as SceneTree
	var save := root.root.get_node("Save") as SaveService
	save.storage = MemoryStorage.new()
	save.load_game()
	var settings := root.root.get_node("Settings") as SettingsService
	settings.storage = MemoryStorage.new()
	settings.load_settings()
	var server := root.root.get_node("Server") as ServerService
	server.api = FakeGameServer.new(save.section(&"pretend_server"), save.mark_dirty, 1)
	var collection := root.root.get_node("Collection") as CollectionService
	collection.server = server.api
	await collection.sync()
