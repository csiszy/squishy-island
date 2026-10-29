class_name TestWorld
extends Node
## A complete, private copy of the game's state for one test: an in-memory save, a seeded pretend server,
## and fresh Economy / Collection / Town services wired to them. Add it with add_child_autofree(TestWorld.new()).

var save: SaveService
var server: FakeGameServer
var economy: EconomyService
var collection: CollectionService
var town: TownService


func _init(seed_value := 7) -> void:
	save = SaveService.new()
	save.storage = MemoryStorage.new()
	save.load_game()
	server = FakeGameServer.new(save.section(&"pretend_server"), save.mark_dirty, seed_value)
	economy = EconomyService.new()
	economy.save = save
	collection = CollectionService.new()
	collection.save = save
	collection.economy = economy
	collection.server = server
	town = TownService.new()
	town.save = save
	town.economy = economy
	town.collection = collection


func _ready() -> void:
	save.set_process(false)
	add_child(save)
	add_child(economy)
	add_child(collection)
	add_child(town)


## Give the player squishies directly through the pretend server (like boxes would).
func give(ids: Array[StringName]) -> void:
	var col: Dictionary = server.state["collection"]
	for id in ids:
		if col.has(String(id)):
			(col[String(id)] as Dictionary)["spares"] = int(col[String(id)]["spares"]) + 1
		else:
			col[String(id)] = {"level": 1, "spares": 0, "sparkly": false}
	await collection.sync()
