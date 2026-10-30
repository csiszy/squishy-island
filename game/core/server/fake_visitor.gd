class_name FakeVisitor
extends RefCounted
## The Visitor of the week as the pretend server plays it: the same rules as the real server's server/src/visitor.ts
## (guide.html "Daily visits"): a squishy the player doesn't own (Common to Epic) camps in the park all week; saying
## hi on economy.daily.visitorDays (4) different days makes it move in for free; one that arrives too late in the
## week for that stays until the end of the next week. Works on the pretend server's
## state dictionary (keys "visitor", "collection").

const RARITIES := ["C", "U", "R", "E"]


static func _needed() -> int:
	return int((GameData.economy().get("daily", {}) as Dictionary).get("visitorDays", 4))


static func _pick(state: Dictionary, day: String, last: String) -> String:
	var owned: Dictionary = state.get("collection", {})
	var unowned: Array = []
	var all: Array = []
	for q: Dictionary in GameData.squishies():
		if String(q["rarity"]) in RARITIES:
			all.append(String(q["id"]))
			if not owned.has(String(q["id"])) and String(q["id"]) != last:
				unowned.append(String(q["id"]))
	var list := unowned if not unowned.is_empty() else all
	var r := RandomNumberGenerator.new()
	r.seed = hash("visitor/%d" % FakeQuests.week_of(day))
	return String(list[r.randi_range(0, list.size() - 1)])


## This week's visitor (chosen on the week's first ask).
static func this_week(state: Dictionary, day: String) -> Dictionary:
	var v: Dictionary = state.get("visitor", {})
	var week := FakeQuests.week_of(day)
	if v.is_empty() or week < int(v["week"]) or week > int(v.get("last_week", v["week"])):
		var days_left := 7 - (FakeQuests.day_number(day) - 4 - week * 7)
		v = {"week": week, "last_week": week + 1 if days_left < _needed() else week, "id": _pick(state, day, String(v.get("id", ""))),
			"days": [], "moved_in": false}
		state["visitor"] = v
	return v


static func answer(state: Dictionary, day: String) -> Dictionary:
	var v := this_week(state, day)
	var id := StringName(v["id"])
	return {"ok": true, "squishy": id, "rarity": String(GameData.squishy(id).get("rarity", "C")), "days": (v["days"] as Array).size(),
		"needed": _needed(), "today_done": day in v["days"], "moved_in": bool(v["moved_in"]),
		"until": FakeQuests.day_text(int(v.get("last_week", v["week"])) * 7 + 10)}


## give: the pretend server's _give(id, sparkly) -> is_new.
static func hi(state: Dictionary, day: String, give: Callable) -> Dictionary:
	var v := this_week(state, day)
	if v["moved_in"]:
		return {"ok": false, "error": &"moved_in"}
	if day in v["days"]:
		return {"ok": false, "error": &"already_today"}
	(v["days"] as Array).append(day)
	var out := answer(state, day)
	if (v["days"] as Array).size() >= _needed():
		v["moved_in"] = true
		out["moved_in"] = true
		out["is_new"] = give.call(StringName(v["id"]), false)
		out["entry"] = (state["collection"][String(v["id"])] as Dictionary).duplicate()
	return out
