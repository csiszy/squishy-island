class_name CollectionService
extends Node
## The player's squishies (autoload: Collection): who lives on the island, their level, spares and Sparkly coat.
## The server decides all of this; this is the phone's copy, refreshed from every server answer.
##
##     await Collection.open_box(&"mystery", &"", Town.level(&"factory"))   -> the server's answer (see GameServer)
##     Collection.family_count(&"dumpling")                                  -> squishies living in the Steamhouse
##     await Collection.level_up(&"bao")   /   await Collection.swap_spare(&"bao")

signal changed

## Set before the node enters the tree to use fakes.
var save: SaveService
var server: GameServer
var economy: EconomyService

var _data: Dictionary = {}
var _busy := false


func _ready() -> void:
	if save == null:
		save = get_node("/root/Save") as SaveService
	if economy == null:
		economy = get_node("/root/Economy") as EconomyService
	var service := get_node_or_null("/root/Server") as ServerService
	if server == null and service != null:
		server = service.api
	if service != null:
		# switched servers (DEV menu): the collection comes from the new one
		service.switched.connect(func() -> void:
			server = service.api
			sync())
	reload()
	save.loaded.connect(reload)
	sync()


func reload() -> void:
	_data = save.section(&"collection")
	if not _data.get("owned") is Dictionary:
		_data["owned"] = {}
	changed.emit()


## Ask the server for the latest state (on start; later also after coming back online).
func sync() -> bool:
	var answer: Dictionary = await server.load_state()
	if not answer.get("ok", false):
		return false
	_data["owned"] = answer["collection"]
	_data["pity"] = int(answer.get("pity", 0))
	_data["boxes_opened"] = int(answer.get("boxes_opened", 0))
	economy.set_from_server(int(answer.get("stars", 0)), int(answer.get("gems", 0)))
	_saved()
	return true


func owned(id: StringName) -> bool:
	return _owned().has(String(id))


## {"level", "spares", "sparkly"} for a squishy you own, or {}.
func entry(id: StringName) -> Dictionary:
	return _owned().get(String(id), {})


func owned_ids() -> Array[StringName]:
	var out: Array[StringName] = []
	for q: Dictionary in GameData.squishies():
		if owned(StringName(q["id"])):
			out.append(StringName(q["id"]))
	return out


func owned_count() -> int:
	return owned_ids().size()


func sparkly_count() -> int:
	var n := 0
	for id in owned_ids():
		if entry(id).get("sparkly", false):
			n += 1
	return n


## How many of this house's family live in it (only squishies you own live there).
func family_count(house: StringName) -> int:
	var n := 0
	for id in GameData.family(house):
		if owned(id):
			n += 1
	return n


## Squishies with at least one spare on the Spare Shelf.
func spare_ids() -> Array[StringName]:
	var out: Array[StringName] = []
	for id in owned_ids():
		if int(entry(id).get("spares", 0)) > 0:
			out.append(id)
	return out


## Boxes in a row without anything Rare or better (the Rare guarantee bar).
func pity() -> int:
	return int(_data.get("pity", 0))


## Boxes still to go until a Rare or better is certain (1 = the next box).
func boxes_until_rare() -> int:
	return maxi(1, int(GameData.economy().get("rareGuaranteeAfter", 9)) + 1 - pity())


func boxes_opened() -> int:
	return int(_data.get("boxes_opened", 0))


## Spares needed for the next level, 0 if already at the top.
func spares_for_next_level(id: StringName) -> int:
	return FakeGameServer.spares_needed(id, int(entry(id).get("level", 1)))


## Why a box cannot be opened right now (&"" if it can): unknown_box, factory_level, coins, busy.
func box_blocker(kind: StringName, factory_level: int) -> StringName:
	var box: Dictionary = GameData.economy().get("boxes", {}).get(String(kind), {})
	if box.is_empty():
		return &"unknown_box"
	if _busy:
		return &"busy"
	if factory_level < int(box.get("factoryLevel", 1)):
		return &"factory_level"
	if not economy.can_afford(int(box["price"])):
		return &"coins"
	return &""


## Pay for a box, let the server roll it, move the squishy in (or put it on the Spare Shelf).
## The coins come back if the server cannot be reached. Returns the server's answer.
func open_box(kind: StringName, family: StringName, factory_level: int, first_box := false) -> Dictionary:
	var price := 0 if first_box else int(GameData.economy()["boxes"].get(String(kind), {}).get("price", 0))
	var blocker := &"" if first_box else box_blocker(kind, factory_level)
	if blocker != &"":
		return {"ok": false, "error": blocker}
	if not economy.spend(price, &"box"):
		return {"ok": false, "error": &"coins"}
	_busy = true
	var answer: Dictionary = await server.open_box(kind, family, first_box)
	_busy = false
	if not answer.get("ok", false):
		economy.earn(price, &"refund")
		return answer
	_owned()[String(answer["squishy"])] = answer["entry"]
	_data["pity"] = int(answer.get("pity", 0))
	_data["boxes_opened"] = int(answer.get("boxes_opened", boxes_opened() + 1))
	_saved()
	Events.box_opened.emit(answer)
	if answer.get("is_new", false):
		Events.squishy_moved_in.emit(StringName(answer["squishy"]))
	return answer


## A squishy the server gave some other way (the Visitor of the week moving in): the phone's copy follows.
func received(id: StringName, entry: Dictionary, is_new: bool) -> void:
	_owned()[String(id)] = entry
	_saved()
	if is_new:
		Events.squishy_moved_in.emit(id)


func level_up(id: StringName) -> Dictionary:
	var answer: Dictionary = await server.level_up(id)
	if answer.get("ok", false):
		_owned()[String(id)] = answer["entry"]
		_saved()
	return answer


func swap_spare(id: StringName) -> Dictionary:
	var answer: Dictionary = await server.swap_spare(id)
	if answer.get("ok", false):
		_owned()[String(id)] = answer["entry"]
		economy.set_from_server(int(answer["stars"]), economy.gems())
		_saved()
	return answer


func _owned() -> Dictionary:
	return _data["owned"]


func _saved() -> void:
	save.mark_dirty()
	changed.emit()
