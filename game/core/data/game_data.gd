class_name GameData
extends RefCounted
## The game's numbers and lists, read once from data/ (exported from the design book by tools/export_data).
## Later the server can replace any file's contents (remote config) with GameData.override().
##
##     GameData.economy()["boxes"]["mystery"]["price"]   -> 200
##     GameData.squishy(&"bao")["rarity"]                 -> "C"
##     GameData.building(&"dumpling")["levels"][1]        -> {level 2, coins 100, ...}

const DIR := "res://data/"

static var _cache: Dictionary = {}
static var _overrides: Dictionary = {}
static var _squishy_index: Dictionary = {}
static var _building_index: Dictionary = {}
## building id -> {"id", "folder"} of the minigame played there (filled at start-up by the app shell, which asks
## the minigame host; core itself never looks inside minigames/).
static var minigames: Dictionary = {}


## The whole contents of data/<file_name> (or its override).
static func file(file_name: String) -> Dictionary:
	if _overrides.has(file_name):
		return _overrides[file_name]
	if not _cache.has(file_name):
		var json := JSON.new()
		var path := DIR + file_name
		if not FileAccess.file_exists(path) or json.parse(FileAccess.get_file_as_string(path)) != OK or not json.data is Dictionary:
			push_error("GameData: cannot read %s (run tools/export_data)" % path)
			_cache[file_name] = {}
		else:
			_cache[file_name] = json.data
	return _cache[file_name]


## Replace a file's contents (the server's remote config; tests). Pass {} to go back to the file.
static func override(file_name: String, contents: Dictionary) -> void:
	if contents.is_empty():
		_overrides.erase(file_name)
	else:
		_overrides[file_name] = contents
	_squishy_index.clear()
	_building_index.clear()


static func clear_overrides() -> void:
	_overrides.clear()
	_squishy_index.clear()
	_building_index.clear()


static func economy() -> Dictionary:
	return file("economy.json")


## The 48 box squishies (not the Gem Shop exclusives), in family order.
static func squishies() -> Array:
	return file("squishies.json").get("squishies", [])


static func squishy(id: StringName) -> Dictionary:
	if _squishy_index.is_empty():
		for q: Dictionary in squishies():
			_squishy_index[StringName(q["id"])] = q
	return _squishy_index.get(id, {})


## The ids of one family's six squishies (family = its house id, e.g. &"dumpling").
static func family(house: StringName) -> Array[StringName]:
	var out: Array[StringName] = []
	for q: Dictionary in squishies():
		if StringName(q["family"]) == house:
			out.append(StringName(q["id"]))
	return out


static func buildings() -> Array:
	return file("buildings.json").get("buildings", [])


static func building(id: StringName) -> Dictionary:
	if _building_index.is_empty():
		for b: Dictionary in buildings():
			_building_index[StringName(b["id"])] = b
	return _building_index.get(id, {})


static func houses() -> Array[StringName]:
	var out: Array[StringName] = []
	for b: Dictionary in buildings():
		if b["type"] == "house":
			out.append(StringName(b["id"]))
	return out


## The level entry {level, coins, ...} of a building, or {} past its last level.
static func level_info(id: StringName, level: int) -> Dictionary:
	for lv: Dictionary in building(id).get("levels", []):
		if int(lv["level"]) == level:
			return lv
	return {}


static func max_level(id: StringName) -> int:
	var top := 0
	for lv: Dictionary in building(id).get("levels", []):
		top = maxi(top, int(lv["level"]))
	return top


## The minigame played at a building (&"" if none yet).
static func minigame_for(building_id: StringName) -> StringName:
	return StringName((minigames.get(building_id, {}) as Dictionary).get("id", ""))
