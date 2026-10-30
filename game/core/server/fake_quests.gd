class_name FakeQuests
extends RefCounted
## The daily quests and the Gem Challenge as the pretend server plays them: the same rules as the real server's
## server/src/quests.ts (guide.html "Daily visits" and "Gems"), with the book's numbers (data/economy.json: daily,
## gemsEarned, questPool). The real server can also take a live config; the pretend one always uses the book's.
## Works on the pretend server's state dictionary (keys "daily", "week", "bests", "gems").


static func _cfg() -> Dictionary:
	var econ := GameData.economy()
	var daily: Dictionary = econ.get("daily", {})
	var gems: Dictionary = econ.get("gemsEarned", {})
	return {"coin_quests": int(daily.get("coinQuests", 2)), "reward": int(daily.get("coinQuestReward", 40)),
		"first_run": float(daily.get("firstRunMultiplier", 2)), "of_best": float(daily.get("challengeOfBest", 0.9)),
		"challenge_gems": int(gems.get("dailyChallenge", 3)), "streak_days": int(gems.get("weeklyStreakDays", 5)),
		"streak_gems": int(gems.get("weeklyStreak", 15)), "pool": econ.get("questPool", [])}


static func day_number(day: String) -> int:
	var p := day.split("-")
	if p.size() != 3:
		return 0
	return floori(Time.get_unix_time_from_datetime_dict({"year": int(p[0]), "month": int(p[1]), "day": int(p[2])}) / 86400.0)


static func day_text(n: int) -> String:
	return Time.get_date_string_from_unix_time(n * 86400)


## Monday-based week number (1970-01-05 was a Monday).
static func week_of(day: String) -> int:
	return floori((day_number(day) - 4) / 7.0)


static func _rng(text: String) -> RandomNumberGenerator:
	var r := RandomNumberGenerator.new()
	r.seed = hash(text)
	return r


static func _playable(games: Array) -> Array:
	return games.filter(func(g: Dictionary) -> bool: return String(g.get("kind", "")) != "toy" and String(g.get("id", "")) != "")


static func _has(games: Array, id: String) -> bool:
	return games.any(func(g: Dictionary) -> bool: return String(g.get("id", "")) == id)


static func challenge_game(day: String, games: Array, avoid: String) -> String:
	var list := _playable(games)
	if list.is_empty():
		return ""
	var i := _rng("challenge/" + day).randi_range(0, list.size() - 1)
	if list.size() > 1 and String(list[i]["id"]) == avoid:
		i = (i + 1) % list.size()
	return String(list[i]["id"])


static func _challenge(state: Dictionary, game: String, games: Array, cfg: Dictionary) -> Variant:
	if game == "":
		return null
	var kind := "endless"
	for g: Dictionary in games:
		if String(g["id"]) == game:
			kind = String(g.get("kind", "endless"))
	if kind == "levels":
		return {"game": game, "goal": "levels3", "target": 2, "progress": 0, "done": false, "claimed": false}
	if kind == "songs":
		return {"game": game, "goal": "song3", "target": 1, "progress": 0, "done": false, "claimed": false}
	var best := int((state.get("bests", {}) as Dictionary).get(game, 0))
	return {"game": game, "goal": "score", "target": maxi(1, floori(best * float(cfg["of_best"]))), "progress": 0, "done": false, "claimed": false}


static func _quest(entry: Dictionary, games: Array, r: RandomNumberGenerator, reward: int) -> Dictionary:
	var game := String(entry.get("game", "any"))
	if entry.get("kind") == "boxes":
		game = ""
	elif game == "pick":
		var list := _playable(games)
		if list.is_empty():
			return {}
		game = String(list[r.randi_range(0, list.size() - 1)]["id"])
	elif game != "any" and not _has(games, game):
		return {}
	return {"id": String(entry.get("id", "")), "kind": String(entry.get("kind", "runs")), "game": game,
		"target": maxi(1, int(entry.get("target", 1))), "text": String(entry.get("text", "")),
		"reward": int(entry.get("reward", reward)), "progress": 0, "claimed": false}


## Today's quests (made the first time they are asked for that day).
static func today(state: Dictionary, day: String, games: Array) -> Dictionary:
	var d: Dictionary = state.get("daily", {})
	if d.get("day", "") == day:
		return d
	var cfg := _cfg()
	var r := _rng("quests/" + day)
	var pool: Array = (cfg["pool"] as Array).duplicate()
	var quests: Array = []
	while quests.size() < int(cfg["coin_quests"]) and not pool.is_empty():
		var total := 0.0
		for e: Dictionary in pool:
			total += maxf(0.0, float(e.get("weight", 1)))
		var x := r.randf() * total
		var at := 0
		for i in pool.size():
			x -= maxf(0.0, float(pool[i].get("weight", 1)))
			if x < 0.0:
				at = i
				break
		var q := _quest(pool[at], games, r, int(cfg["reward"]))
		pool.remove_at(at)
		if not q.is_empty():
			quests.append(q)
	var yesterday := ""
	if d.get("day", "") == day_text(day_number(day) - 1) and d.get("challenge") is Dictionary:
		yesterday = String(d["challenge"]["game"])
	d = {"day": day, "quests": quests, "challenge": _challenge(state, challenge_game(day, games, yesterday), games, cfg), "first_run": false}
	state["daily"] = d
	return d


static func answer(state: Dictionary, day: String, games: Array) -> Dictionary:
	var cfg := _cfg()
	var d := today(state, day, games)
	var week: Dictionary = state.get("week", {})
	var this_week := int(week.get("week", -1)) == week_of(day)
	var c: Variant = d["challenge"]
	return {"ok": true, "day": day, "quests": (d["quests"] as Array).duplicate(true), "challenge": (c as Dictionary).duplicate() if c is Dictionary else null,
		"first_run_left": not d["first_run"], "tomorrow": challenge_game(day_text(day_number(day) + 1), games, String(c["game"]) if c is Dictionary else ""),
		"streak": {"days": (week.get("days", []) as Array).size() if this_week else 0, "needed": cfg["streak_days"], "gems": cfg["streak_gems"], "claimed": this_week and bool(week.get("claimed", false))},
		"rewards": {"quest": cfg["reward"], "challenge": cfg["challenge_gems"]}}


## A finished run: bests, today's quests, the first run's double coins. Changes `answer` (the coins answer).
static func after_run(state: Dictionary, kind: StringName, report: Dictionary, answer_in: Dictionary) -> void:
	var game := String(report.get("game", ""))
	today(state, String(report["day"]), report.get("games", []))
	if kind == &"endless":
		var bests: Dictionary = state.get("bests", {})
		bests[game] = maxi(int(bests.get(game, 0)), int(report.get("score", 0)))
		state["bests"] = bests
	var d: Dictionary = state["daily"]
	if not d["first_run"] and int(answer_in["coins"]) > 0:
		d["first_run"] = true
		answer_in["first_today"] = true
		answer_in["coins"] = int(answer_in["coins"]) * int(_cfg()["first_run"])
	var done: Array = []
	for q: Dictionary in d["quests"]:
		var was: bool = int(q["progress"]) >= int(q["target"])
		if q["kind"] == "runs" and (q["game"] == "any" or q["game"] == game):
			q["progress"] = mini(int(q["target"]), int(q["progress"]) + 1)
		elif q["kind"] == "metric" and q["game"] == game:
			q["progress"] = mini(int(q["target"]), int(q["progress"]) + maxi(0, int(report.get("metric", 0))))
		if not was and int(q["progress"]) >= int(q["target"]):
			done.append(q["id"])
	var c: Variant = d["challenge"]
	if c is Dictionary and not c["done"] and c["game"] == game:
		var won: bool = report.get("won", false)
		var stars := int(report.get("stars", 0))
		var prev := int(report.get("prev_stars", 0))
		if c["goal"] == "score":
			c["progress"] = maxi(int(c["progress"]), int(report.get("score", 0)))
			c["done"] = int(c["progress"]) >= int(c["target"])
		elif c["goal"] == "levels3" and won and stars >= 3 and prev < 3:
			c["progress"] = int(c["target"]) if prev == 0 else int(c["progress"]) + 1
			c["done"] = int(c["progress"]) >= int(c["target"])
		elif c["goal"] == "song3" and won and (stars >= 3 or (stars >= 2 and report.get("newest", false))):
			c["progress"] = 1
			c["done"] = true
		if c["done"]:
			done.append("challenge")
	answer_in["quests_done"] = done


static func after_box(state: Dictionary) -> void:
	var d: Dictionary = state.get("daily", {})
	for q: Dictionary in d.get("quests", []):
		if q["kind"] == "boxes":
			q["progress"] = mini(int(q["target"]), int(q["progress"]) + 1)


static func claim(state: Dictionary, day: String, id: String) -> Dictionary:
	var cfg := _cfg()
	var d: Dictionary = state.get("daily", {})
	if d.get("day", "") != day:
		return {"ok": false, "error": &"not_today"}
	if id == "challenge":
		var c: Variant = d.get("challenge")
		if not c is Dictionary or not c["done"]:
			return {"ok": false, "error": &"not_done"}
		if c["claimed"]:
			return {"ok": false, "error": &"claimed"}
		c["claimed"] = true
		state["gems"] = int(state.get("gems", 0)) + int(cfg["challenge_gems"])
		var week: Dictionary = state.get("week", {})
		if int(week.get("week", -1)) != week_of(day):
			week = {"week": week_of(day), "days": [], "claimed": false}
		if not day in week["days"]:
			(week["days"] as Array).append(day)
		state["week"] = week
		return {"ok": true, "gems": cfg["challenge_gems"], "total_gems": state["gems"], "stars": int(state.get("stars", 0)), "streak_days": (week["days"] as Array).size()}
	if id == "streak":
		var w: Dictionary = state.get("week", {})
		if int(w.get("week", -1)) != week_of(day) or (w.get("days", []) as Array).size() < int(cfg["streak_days"]):
			return {"ok": false, "error": &"not_done"}
		if w.get("claimed", false):
			return {"ok": false, "error": &"claimed"}
		w["claimed"] = true
		state["gems"] = int(state.get("gems", 0)) + int(cfg["streak_gems"])
		return {"ok": true, "gems": cfg["streak_gems"], "total_gems": state["gems"], "stars": int(state.get("stars", 0))}
	for q: Dictionary in d.get("quests", []):
		if q["id"] == id:
			if int(q["progress"]) < int(q["target"]):
				return {"ok": false, "error": &"not_done"}
			if q["claimed"]:
				return {"ok": false, "error": &"claimed"}
			q["claimed"] = true
			return {"ok": true, "coins": int(q["reward"])}
	return {"ok": false, "error": &"no_quest"}
