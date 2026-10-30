class_name QuestsService
extends Node
## Daily quests and the Gem Challenge (autoload: Quests; guide.html "Daily visits"). The server makes and checks
## them (Server.api.quests / quest_claim; minigame runs count through submit_run's report); this service keeps the
## latest quest board, tells the server which games the player has built, and pays out what is collected (coins
## onto the phone, Gems from the server's answer).

## The quest board changed (new day, progress, something collected).
signal changed

## The last quests() answer ({} until known).
var board: Dictionary = {}


func _ready() -> void:
	(get_node("/root/Server") as ServerService).switched.connect(func() -> void:
		board = {}
		refresh())


## The phone's date ("2026-10-30"): quests change at the phone's own midnight.
static func today() -> String:
	return Time.get_date_string_from_system()


## The minigames the player can play: the buildings that are built and have a game. [{"id", "kind"}]
static func built_games() -> Array:
	var out: Array = []
	for building: Variant in GameData.minigames:
		var info: Dictionary = GameData.minigames[building]
		if Town.level(StringName(building)) > 0:
			out.append({"id": String(info.get("id", "")), "kind": String(info.get("kind", "endless"))})
	out.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return String(a["id"]) < String(b["id"]))
	return out


## What a minigame run tells the server for quests (added to submit_run).
static func run_report(score: int, metric: int, won: bool, level: int, stars: int, prev_stars: int, newest: bool) -> Dictionary:
	return {"day": today(), "games": built_games(), "score": score, "metric": metric, "won": won, "level": level,
		"stars": stars, "prev_stars": prev_stars, "newest": newest}


func refresh() -> Dictionary:
	var answer: Dictionary = await Server.api.quests(today(), built_games())
	if answer.get("ok", false):
		board = answer
		changed.emit()
	return answer


## Collect a quest's coins, the Gem Challenge's or the streak's Gems.
func claim(id: String) -> Dictionary:
	var answer: Dictionary = await Server.api.quest_claim(today(), id)
	if answer.get("ok", false):
		if answer.has("coins"):
			Economy.earn(int(answer["coins"]), &"quest")
		if answer.has("total_gems"):
			Economy.set_from_server(int(answer.get("stars", Economy.stars())), int(answer["total_gems"]))
		await refresh()
	return answer


## Something on the board is ready to collect (the quest button shows a dot).
func has_reward() -> bool:
	for q: Dictionary in board.get("quests", []):
		if int(q.get("progress", 0)) >= int(q.get("target", 1)) and not q.get("claimed", false):
			return true
	var c: Variant = board.get("challenge")
	if c is Dictionary and c.get("done", false) and not c.get("claimed", false):
		return true
	var s: Dictionary = board.get("streak", {})
	return int(s.get("days", 0)) >= int(s.get("needed", 5)) and not s.get("claimed", false)
