class_name TownService
extends Node
## The island (autoload: Town): every building's level, what is unlocked, progress toward fun-building
## goals, and the decor in each house.
##
##     Town.level(&"dumpling")              -> 1 .. 10 (houses), 0 .. 10 (fun buildings; 0 = empty plot)
##     Town.upgrade_check(&"dumpling")      -> {"can": true, "next": 2, "coins": 100, ...} or why not
##     Town.upgrade(&"dumpling")            -> the same, after paying and fixing it up
##     Town.buy_decor(&"dumpling", 6, &"classic")
## Rules: guide.html (#progression: the open island, house and fun-building rules) and data/economy.json
## (unlocks: everything is open from day one; "built" says which fun buildings start at level 1; cozy).

signal changed

## Set before the node enters the tree to use fakes.
var save: SaveService
var economy: EconomyService
var collection: CollectionService

var _data: Dictionary = {}
var _announced: Dictionary = {}


func _ready() -> void:
	if save == null:
		save = get_node("/root/Save") as SaveService
	if economy == null:
		economy = get_node("/root/Economy") as EconomyService
	if collection == null:
		collection = get_node("/root/Collection") as CollectionService
	reload()
	save.loaded.connect(reload)
	Events.box_opened.connect(_on_box_opened)
	collection.changed.connect(check_unlocks)


func reload() -> void:
	_data = save.section(&"town")
	for k: String in ["levels", "progress", "decor"]:
		if not _data.get(k) is Dictionary:
			_data[k] = {}
	if not _data.get("announced") is Array:
		_data["announced"] = []
	_announced.clear()
	for id: Variant in _data["announced"]:
		_announced[StringName(str(id))] = true
	changed.emit()


func is_house(id: StringName) -> bool:
	return GameData.building(id).get("type", "") == "house"


func level(id: StringName) -> int:
	var levels: Dictionary = _data["levels"]
	if levels.has(String(id)):
		return int(levels[String(id)])
	if is_house(id) or GameData.building(id).get("single", false) or id in _start_buildings():
		return 1
	return 0


func is_unlocked(id: StringName) -> bool:
	for u: Dictionary in GameData.economy().get("unlocks", []):
		if not (id in _ids(u.get("houses", [])) or id in _ids(u.get("buildings", []))):
			continue
		if _met(u.get("when")):
			return true
	return false


## What stands between this building and its next level.
## {"can", "reason" (locked | max | coins | squishies | goal), "next", "coins", "squishies_needed",
##  "squishies_have", "stat", "target", "progress"}
func upgrade_check(id: StringName) -> Dictionary:
	var now := level(id)
	var next := GameData.level_info(id, now + 1)
	var out := {"can": false, "reason": &"", "next": now + 1, "coins": int(next.get("coins", 0)),
		"squishies_needed": int(next.get("squishies", 0)), "squishies_have": collection.family_count(id) if is_house(id) else 0,
		"stat": StringName(GameData.building(id).get("goal", {}).get("stat", "")), "target": int(next.get("target", 0)),
		"progress": progress(id)}
	if not is_unlocked(id):
		out["reason"] = &"locked"
	elif next.is_empty():
		out["reason"] = &"max"
	elif out["squishies_have"] < out["squishies_needed"]:
		out["reason"] = &"squishies"
	elif out["progress"] < out["target"]:
		out["reason"] = &"goal"
	elif not economy.can_afford(out["coins"]):
		out["reason"] = &"coins"
	else:
		out["can"] = true
	return out


## Pay and fix up / build the next level. Returns upgrade_check()'s answer (with "can" false if it did not happen).
func upgrade(id: StringName) -> Dictionary:
	var check := upgrade_check(id)
	if not check["can"] or not economy.spend(check["coins"], &"building"):
		check["can"] = false
		return check
	(_data["levels"] as Dictionary)[String(id)] = int(check["next"])
	_saved()
	Events.building_upgraded.emit(id, int(check["next"]))
	check_unlocks()
	return check


## Progress toward a fun building's goal (best score, levels beaten, boxes opened, ...).
func progress(id: StringName) -> int:
	return int((_data["progress"] as Dictionary).get(String(id), 0))


## For counting goals (boxes opened, trades, squishes): add n.
func add_progress(id: StringName, n := 1) -> void:
	(_data["progress"] as Dictionary)[String(id)] = progress(id) + n
	_saved()


## For best-of goals (best score, best height, levels beaten): keep the higher.
func offer_progress(id: StringName, value: int) -> void:
	if value > progress(id):
		(_data["progress"] as Dictionary)[String(id)] = value
		_saved()


## ---- decor ----

## {item number: {"owned": [design ids], "style": design in use}} for a house.
func decor(house: StringName) -> Dictionary:
	var all: Dictionary = _data["decor"]
	if not all.get(String(house)) is Dictionary:
		all[String(house)] = {}
	return all[String(house)]


func decor_items(house: StringName) -> Array:
	return GameData.building(house).get("decor", [])


func decor_price(house: StringName, item: int, style: StringName) -> int:
	for d: Dictionary in decor_items(house):
		if int(d["item"]) == item:
			return int((d["prices"] as Dictionary).get(String(style), -1))
	return -1


func owns_decor(house: StringName, item: int, style: StringName) -> bool:
	var e: Dictionary = decor(house).get(str(item), {})
	return StringName(style) in _ids(e.get("owned", []))


## The design in use for an item, or &"" if none is owned.
func decor_style(house: StringName, item: int) -> StringName:
	return StringName((decor(house).get(str(item), {}) as Dictionary).get("style", ""))


## Buy a design of a decor item and put it in the room. {"ok", "reason" (unknown | owned | coins | locked)}
func buy_decor(house: StringName, item: int, style: StringName) -> Dictionary:
	var price := decor_price(house, item, style)
	if price < 0:
		return {"ok": false, "reason": &"unknown"}
	if not is_unlocked(house):
		return {"ok": false, "reason": &"locked"}
	if owns_decor(house, item, style):
		return {"ok": false, "reason": &"owned"}
	if not economy.spend(price, &"decor"):
		return {"ok": false, "reason": &"coins"}
	var e: Dictionary = decor(house).get(str(item), {"owned": []})
	(e["owned"] as Array).append(String(style))
	e["style"] = String(style)
	decor(house)[str(item)] = e
	_saved()
	Events.decor_changed.emit(house)
	return {"ok": true, "price": price}


## Switch to a design you already own.
func use_decor(house: StringName, item: int, style: StringName) -> bool:
	if not owns_decor(house, item, style):
		return false
	(decor(house)[str(item)] as Dictionary)["style"] = String(style)
	_saved()
	Events.decor_changed.emit(house)
	return true


## Cozy points of a house: every decor item owned (in any design) counts once.
func cozy(house: StringName) -> int:
	var total := 0
	for d: Dictionary in decor_items(house):
		if decor_style(house, int(d["item"])) != &"":
			total += int(d["cozy"])
	return total


## Extra minigame coins for this family's squishies: +5% per 5 Cozy.
func cozy_bonus(house: StringName) -> float:
	var c: Dictionary = GameData.economy().get("cozy", {})
	return floori(cozy(house) / float(c.get("pointsPerStep", 5))) * float(c.get("coinBonusPerStep", 0.05))


## Announce buildings that became unlocked since last time (Events.buildings_unlocked), once each.
func check_unlocks() -> Array[StringName]:
	var fresh: Array[StringName] = []
	for b: Dictionary in GameData.buildings():
		var id := StringName(b["id"])
		if not _announced.has(id) and is_unlocked(id):
			_announced[id] = true
			(_data["announced"] as Array).append(String(id))
			fresh.append(id)
	if not fresh.is_empty():
		_saved()
		Events.buildings_unlocked.emit(fresh)
	return fresh


func _on_box_opened(_answer: Dictionary) -> void:
	add_progress(&"factory", 1)


func _met(when: Variant) -> bool:
	if when is String:
		return when == "start"
	if when is Dictionary:
		var w: Dictionary = when
		if w.has("house"):
			return level(StringName(w["house"])) >= int(w.get("level", 1))
		if w.has("owned"):
			return collection.owned_count() >= int(w["owned"])
	return false


## Fun buildings that stand ready (level 1) on day one; every other plot starts empty (level 0).
func _start_buildings() -> Array[StringName]:
	for u: Dictionary in GameData.economy().get("unlocks", []):
		if u.get("when") is String and u["when"] == "start":
			return _ids(u.get("built", u.get("buildings", [])))
	return []


func _ids(list: Variant) -> Array[StringName]:
	var out: Array[StringName] = []
	if list is Array:
		for x: Variant in list:
			out.append(StringName(str(x)))
	return out


func _saved() -> void:
	save.mark_dirty()
	changed.emit()
