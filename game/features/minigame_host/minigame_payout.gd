class_name MinigamePayout
extends RefCounted
## How a run turns into coins (guide.html "Coins" and each building page's "Rewards"; numbers in
## data/economy.json "minigames" and the game's manifest). The game itself never knows about coins.
##
## Endless games: base = the manifest's number (score or metric) ÷ "divide", rounded down, plus a milestone bonus
## (+10 / +25 / +50, only the highest milestone reached; milestones count the score unless "milestones_on" says
## "metric"). Helpers (Cozy points of the player's squishy's family,
## a rarer squishy in games that say so) add a percentage of the base coins.
## Level games: first clear 30 + 15 per star (every 10th level ×2); a replay 10 + 15 per new star; a lost level 0.


## {"base", "bonus", "tier", "next_at", "next_add", "helper", "total", "value"}
static func endless(rule: Dictionary, result: MinigameResult, helper_boost := 0.0) -> Dictionary:
	var rules: Dictionary = GameData.economy().get("minigames", {})
	var table: Array = rules.get("milestoneBonus", [10, 25, 50])
	var value := result.metric if rule.get("from", "score") == "metric" else result.score
	var divide := maxf(1.0, float(rule.get("divide", 1)))
	var base := floori(value / divide)
	var milestones: Array = rule.get("milestones", [])
	# milestones count the score, or the metric when the rule says "milestones_on": "metric" (flowers harvested)
	var reached := result.metric if rule.get("milestones_on", "score") == "metric" else result.score
	var tier := -1
	for i in milestones.size():
		if reached >= int(milestones[i]):
			tier = i
	var bonus: int = int(table[tier]) if tier >= 0 and tier < table.size() else 0
	var next_at := -1
	var next_add := 0
	if tier + 1 < milestones.size():
		next_at = int(milestones[tier + 1])
		next_add = int(table[tier + 1]) if tier + 1 < table.size() else 0
	var helper := floori(base * maxf(0.0, helper_boost))
	return {"base": base, "bonus": bonus, "tier": tier, "next_at": next_at, "next_add": next_add, "helper": helper,
		"total": base + bonus + helper, "value": value}


## {"total", "first", "big", "new_stars"}. prev_stars: the best stars on this level before (0 = never beaten).
static func level(result: MinigameResult, prev_stars: int) -> Dictionary:
	var rules: Dictionary = GameData.economy().get("minigames", {})
	if not result.won:
		return {"total": 0, "first": false, "big": false, "new_stars": 0}
	var first := prev_stars <= 0
	var big := result.level > 0 and result.level % 10 == 0
	var per_star := int(rules.get("perStar", 15))
	var new_stars := maxi(0, result.stars - prev_stars)
	var total := 0
	if first:
		total = (int(rules.get("levelFirstClear", 30)) + per_star * result.stars) * (int(rules.get("everyTenthLevelMultiplier", 2)) if big else 1)
	else:
		total = int(rules.get("levelReplay", 10)) + per_star * new_stars
	return {"total": total, "first": first, "big": big, "new_stars": new_stars}


## Extra share of base coins from the squishy who played: its family's Cozy bonus plus the game's rarity bonus.
static func helper_boost(rule: Dictionary, rarity: String, cozy_bonus: float) -> float:
	var by_rarity: Dictionary = rule.get("rarity_bonus", {})
	return maxf(0.0, cozy_bonus) + float(by_rarity.get(rarity, 0.0))


## The helpers a squishy switches on in a game (manifest "perks"): effect -> amount.
## A perk names a "family" (house id) or a list of "rarity" letters.
static func perks_for(perks: Array, family: String, rarity: String) -> Dictionary:
	var out := {}
	for p: Dictionary in perks:
		var fits := false
		if p.has("family"):
			fits = String(p["family"]) == family
		elif p.has("rarity"):
			fits = rarity in (p["rarity"] as Array)
		if fits:
			out[StringName(p.get("effect", ""))] = float(p.get("amount", 1.0))
	return out
