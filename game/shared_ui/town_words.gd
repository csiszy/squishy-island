class_name TownWords
extends RefCounted
## Kind sentences about the town that several screens need (map card, house screen, ...).


## What a house still needs for its next level ("" if it can be fixed up now).
static func renovate_note(check: Dictionary, economy: EconomyService) -> String:
	match check["reason"]:
		&"squishies":
			return Text.t(&"house.needs_squishies", {"n": check["squishies_needed"], "have": check["squishies_have"]})
		&"coins":
			return Text.t(&"map.need_coins", {"n": Ui.number(check["coins"] - economy.coins())})
	return ""


## "Unlocks when the Dumpling Steamhouse reaches level 3" / "... when you have 8 squishies".
static func unlock_text(id: StringName) -> String:
	for u: Dictionary in GameData.economy().get("unlocks", []):
		var ids: Array = (u.get("houses", []) as Array) + (u.get("buildings", []) as Array)
		if not String(id) in ids:
			continue
		var when: Variant = u.get("when")
		if when is Dictionary and (when as Dictionary).has("house"):
			var h := StringName((when as Dictionary)["house"])
			return Text.t(&"map.unlock_house_level", {"house": Text.t(StringName(GameData.building(h).get("name", ""))), "n": int((when as Dictionary)["level"])})
		if when is Dictionary and (when as Dictionary).has("owned"):
			return Text.t(&"map.unlock_owned", {"n": int((when as Dictionary)["owned"])})
	return ""
