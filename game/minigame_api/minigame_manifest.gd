class_name MinigameManifest
extends RefCounted
## A minigame's manifest.json, read and checked (contract v1). The game is found by its folder; the manifest
## says what it is, which building it belongs to, how a run turns into coins and which helpers it has.
##
## {
##   "id": "sky_bounce", "api": 1, "version": "1.0.0",
##   "title": "sky_bounce.title", "where": "sky_bounce.where",      <- keys in the game's strings_en.csv
##   "building": "playground", "kind": "endless", "scene": "sky_bounce.tscn", "music": "sky",
##   "size": [360, 640], "backdrop": "#8CCBFF",
##   "how_to": ["sky_bounce.how.1", ...], "score_name": "sky_bounce.score_name",
##   "metric_line": "sky_bounce.metric_line",                       <- e.g. "{n} coins collected"
##   "coins": {"from": "metric" | "score", "divide": 1, "milestones": [600, 1200, 2000], "unit": "sky_bounce.unit",
##             "rule": "sky_bounce.coin_rule", "rarity_bonus": {"R": 0.1}},
##   "goal": "score" | "metric" | "levels" | "songs",                <- which number counts for the building
##                                                                      (levels beaten / songs with a star;
##                                                                      metric_total: every run's metric added up)
##   toys ("kind": "toy", the Lab): no score to beat and no coins ({"from": "none"}); they run until the
##   player leaves.
##   "songs": {"list": "charts.json", "stars_each": 3},               <- song games ("kind": "songs") only: the
##             track list (a JSON file in the folder: {"tracks": [{"title", "tags", "bpm", "len"}, ...]});
##             track N opens at (N - 1) x stars_each stars. Their coins: {"from": "song", "per_minute": 40}
##             = per_minute x the song's minutes x accuracy (Result.metric, in %).
##   "revive": {"allowed": true, "gift": "sky_bounce.revive_gift"},
##   "perks": [{"family": "sky", "effect": "fall_slower", "amount": 0.25}],
##   "enabled": true
## }

const KINDS := ["endless", "levels", "songs", "toy"]

var data: Dictionary = {}
var folder := ""
## Problems found by check(); empty = fine.
var problems: PackedStringArray = []
var _songs: Array = []


static func from_file(path: String) -> MinigameManifest:
	var m := MinigameManifest.new()
	m.folder = path.get_base_dir()
	var text := FileAccess.get_file_as_string(path)
	var json := JSON.new()
	if text == "" or json.parse(text) != OK or not json.data is Dictionary:
		m.problems.append("%s: not readable JSON" % path)
		return m
	m.data = json.data
	m.check()
	return m


func check() -> PackedStringArray:
	problems.clear()
	for key: String in ["id", "api", "version", "title", "building", "kind", "scene", "coins", "goal"]:
		if not data.has(key):
			problems.append("missing \"%s\"" % key)
	if int(data.get("api", 0)) != Minigame.API:
		problems.append("built for contract version %s, this game has %d" % [data.get("api"), Minigame.API])
	if not String(data.get("kind", "")) in KINDS:
		problems.append("kind must be one of %s" % [KINDS])
	if folder != "" and String(data.get("id", "")) != folder.get_file():
		problems.append("id must be the folder name (%s)" % folder.get_file())
	# ResourceLoader, not FileAccess: in a phone build a scene is stored converted (".tscn.remap"), not as itself
	if folder != "" and not ResourceLoader.exists(scene_path()):
		problems.append("scene %s not found" % data.get("scene"))
	var coins: Variant = data.get("coins")
	if coins is Dictionary and not String((coins as Dictionary).get("from", "")) in ["score", "metric", "song", "none"]:
		problems.append("coins.from must be score, metric, song or none")
	if not String(data.get("goal", "")) in ["score", "metric", "metric_total", "levels", "songs"]:
		problems.append("goal must be score, metric, metric_total, levels or songs")
	if data.get("kind") == "songs" and folder != "" and songs().is_empty():
		problems.append("a song game needs \"songs\": {\"list\": file} with at least one track")
	return problems


## A song game's tracks: [{"title", "tags", "bpm", "len", ...}] (read from the folder once).
func songs() -> Array:
	if _songs.is_empty() and data.get("songs") is Dictionary:
		var path := folder.path_join(String((data["songs"] as Dictionary).get("list", "")))
		var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path)) if FileAccess.file_exists(path) else null
		if parsed is Dictionary and (parsed as Dictionary).get("tracks") is Array:
			_songs = (parsed as Dictionary)["tracks"]
	return _songs


func is_ok() -> bool:
	return problems.is_empty()


func id() -> StringName:
	return StringName(data.get("id", ""))


func building() -> StringName:
	return StringName(data.get("building", ""))


func enabled() -> bool:
	return bool(data.get("enabled", true))


func scene_path() -> String:
	return folder.path_join(String(data.get("scene", "")))


func strings_path() -> String:
	return folder.path_join("strings_en.csv")


func coins() -> Dictionary:
	return data.get("coins", {})


func size() -> Vector2:
	var s: Array = data.get("size", [360, 640])
	return Vector2(float(s[0]), float(s[1]))
