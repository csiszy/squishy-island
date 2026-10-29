class_name FakeGameServer
extends GameServer
## The game server, played on the phone until the real one exists (Step 4), and in tests.
## It follows the same rules the real server will (Factory page and guide):
## - box odds per box kind (data/economy.json), Family Boxes only roll that family, Golden Boxes have no Commons;
## - Rare guarantee: after 9 boxes in a row with nothing Rare or better, the next one is Rare or better;
## - 1 box in 50 is Sparkly; a squishy you already have goes onto the Spare Shelf;
## - spares level a squishy up (C/U 1/2/3/4, R/E 1/1/2/2, L 1/1/1/1; level 5 = Sparkly) or swap for Stars.
## It keeps its own state (like a real server would) in the dictionary it is given.

## The server's own memory (saved by whoever made this server).
var state: Dictionary
## Called after every change, so the state gets saved.
var on_change: Callable
var rng := RandomNumberGenerator.new()
## Pretend the internet is down (tests of the kind "this needs the internet" messages).
var offline := false


func _init(server_state: Dictionary = {}, changed: Callable = Callable(), seed_value: int = -1) -> void:
	state = server_state
	on_change = changed
	if seed_value >= 0:
		rng.seed = seed_value
	else:
		rng.randomize()


func load_state() -> Dictionary:
	if offline:
		return _fail(&"offline")
	if not state.get("started", false):
		state["started"] = true
		state["collection"] = {}
		state["stars"] = 0
		state["gems"] = 0
		state["pity"] = 0
		state["boxes_opened"] = 0
		for u: Dictionary in GameData.economy().get("unlocks", []):
			if u.get("when") is String and u.get("when") == "start" and u.has("gift"):
				_give(StringName(u["gift"]), false)
		_changed()
	return {"ok": true, "collection": _collection().duplicate(true), "stars": int(state["stars"]),
		"gems": int(state["gems"]), "pity": int(state["pity"]), "boxes_opened": int(state["boxes_opened"])}


func open_box(kind: StringName, family: StringName = &"", first_box := false) -> Dictionary:
	if offline:
		return _fail(&"offline")
	var econ := GameData.economy()
	var boxes: Dictionary = econ.get("boxes", {})
	if not boxes.has(String(kind)):
		return _fail(&"unknown_box")
	var id: StringName
	var rarity: String
	if first_box and not state.get("first_box_given", false):
		state["first_box_given"] = true
		id = StringName(econ.get("firstBox", "gyoza"))
		rarity = GameData.squishy(id).get("rarity", "C")
	else:
		var box: Dictionary = boxes[String(kind)]
		rarity = _roll_rarity(box["odds"])
		var pity := int(state.get("pity", 0))
		if pity >= int(econ.get("rareGuaranteeAfter", 9)) and rarity in ["C", "U"]:
			rarity = "R"
		state["pity"] = pity + 1 if rarity in ["C", "U"] else 0
		var pool: Array[StringName] = []
		for q: Dictionary in GameData.squishies():
			if q["rarity"] == rarity and (not box.get("pickFamily", false) or StringName(q["family"]) == family):
				pool.append(StringName(q["id"]))
		if pool.is_empty():
			return _fail(&"unknown_box")
		id = pool[rng.randi_range(0, pool.size() - 1)]
	var sparkly := rng.randf() < float(econ.get("sparklyChance", 0.02))
	var is_new := _give(id, sparkly)
	state["boxes_opened"] = int(state.get("boxes_opened", 0)) + 1
	_changed()
	return {"ok": true, "squishy": id, "rarity": rarity, "sparkly": sparkly, "is_new": is_new,
		"entry": (_collection()[String(id)] as Dictionary).duplicate(), "pity": int(state.get("pity", 0)),
		"boxes_opened": int(state["boxes_opened"])}


func level_up(id: StringName) -> Dictionary:
	if offline:
		return _fail(&"offline")
	var entry := _entry(id)
	if entry.is_empty():
		return _fail(&"not_owned")
	var econ := GameData.economy()
	var level := int(entry["level"])
	if level >= int(econ.get("maxSquishyLevel", 5)):
		return _fail(&"max_level")
	var need := spares_needed(id, level)
	if int(entry["spares"]) < need:
		return _fail(&"no_spares")
	entry["spares"] = int(entry["spares"]) - need
	entry["level"] = level + 1
	if entry["level"] >= int(econ.get("maxSquishyLevel", 5)):
		entry["sparkly"] = true
	_changed()
	return {"ok": true, "entry": entry.duplicate()}


func swap_spare(id: StringName) -> Dictionary:
	if offline:
		return _fail(&"offline")
	var entry := _entry(id)
	if entry.is_empty():
		return _fail(&"not_owned")
	if int(entry["spares"]) < 1:
		return _fail(&"no_spares")
	entry["spares"] = int(entry["spares"]) - 1
	var rarity := String(GameData.squishy(id).get("rarity", "C"))
	state["stars"] = int(state.get("stars", 0)) + int(GameData.economy()["starsPerSpare"].get(rarity, 0))
	_changed()
	return {"ok": true, "entry": entry.duplicate(), "stars": int(state["stars"])}


## Spares needed to go from `level` to level + 1 (0 past the top).
static func spares_needed(id: StringName, level: int) -> int:
	var table: Array = GameData.economy()["spareLevels"].get(String(GameData.squishy(id).get("rarity", "C")), [])
	return int(table[level - 1]) if level >= 1 and level <= table.size() else 0


func _roll_rarity(odds: Dictionary) -> String:
	var x := rng.randf() * 100.0
	for r: String in ["L", "E", "R", "U", "C"]:
		var p := float(odds.get(r, 0))
		if x < p:
			return r
		x -= p
	return "C"


## Add one copy. Returns true if it is new (moves in); a copy you have goes onto the Spare Shelf.
func _give(id: StringName, sparkly: bool) -> bool:
	var col := _collection()
	var key := String(id)
	var is_new := not col.has(key)
	if is_new:
		col[key] = {"level": 1, "spares": 0, "sparkly": sparkly}
	else:
		var e: Dictionary = col[key]
		e["spares"] = int(e["spares"]) + 1
		if sparkly:
			e["sparkly"] = true
	return is_new


func _collection() -> Dictionary:
	if not state.get("collection") is Dictionary:
		state["collection"] = {}
	return state["collection"]


func _entry(id: StringName) -> Dictionary:
	return _collection().get(String(id), {})


func _changed() -> void:
	if on_change.is_valid():
		on_change.call()


func _fail(error: StringName) -> Dictionary:
	return {"ok": false, "error": error}
