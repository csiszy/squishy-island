class_name BuildingCardModel
extends RefCounted
## What the card shows when a building on the map is tapped, and which buttons it has. Plain logic (tested).
## {"title", "kind", "level_text", "note", "actions": [{"id", "text", "enabled"}]}
## Action ids: open_house, open_factory, build, upgrade, play, gem_store, market.

const SHOPS := [&"factory", &"market", &"gemmine"]


static func for_building(id: StringName, town: TownService, collection: CollectionService, economy: EconomyService) -> Dictionary:
	var info := GameData.building(id)
	var house: bool = info.get("type") == "house"
	var level := town.level(id)
	var locked := not town.is_unlocked(id)
	var out := {"title": Text.t(StringName(info.get("name", ""))), "kind": kind_text(id), "level_text": "", "note": "", "actions": []}
	var actions: Array = out["actions"]
	if info.get("single", false):
		actions.append({"id": &"gem_store", "text": Text.t(&"map.gem_store"), "enabled": true})
		return out
	out["level_text"] = Text.t(&"map.empty_plot") if level == 0 and not house else Text.t(&"map.level", {"n": maxi(1, level)})
	if locked:
		out["level_text"] = Text.t(&"map.locked")
		out["note"] = TownWords.unlock_text(id)
		return out
	if house:
		actions.append({"id": &"open_house", "text": Text.t(&"map.open_house"), "enabled": true})
		var hc := town.upgrade_check(id)
		if hc["reason"] == &"max":
			out["note"] = Text.t(&"map.max_level")
			return out
		actions.append({"id": &"upgrade", "text": Text.t(&"map.fix_up", {"coins": Ui.number(hc["coins"])}), "enabled": hc["can"]})
		out["note"] = TownWords.renovate_note(hc, economy)
		return out
	var check := town.upgrade_check(id)
	if level == 0:
		actions.append({"id": &"build", "text": Text.t(&"map.build", {"coins": Ui.number(check["coins"])}), "enabled": check["can"]})
		if check["reason"] == &"coins":
			out["note"] = Text.t(&"map.need_coins", {"n": Ui.number(check["coins"] - economy.coins())})
		return out
	match id:
		&"factory":
			actions.append({"id": &"open_factory", "text": Text.t(&"map.open"), "enabled": true})
		&"market":
			actions.append({"id": &"market", "text": Text.t(&"map.open"), "enabled": true})
		_:
			actions.append({"id": &"play", "text": Text.t(&"map.play"), "enabled": true})
	if check["reason"] == &"max":
		out["note"] = Text.t(&"map.max_level")
		return out
	actions.append({"id": &"upgrade", "text": Text.t(&"map.upgrade", {"coins": Ui.number(check["coins"])}), "enabled": check["can"]})
	if check["reason"] == &"goal":
		var goal := Text.t(StringName(info.get("goal", {}).get("text", "")), {"n": Ui.number(check["target"])})
		out["note"] = Text.t(&"map.need_goal", {"goal": goal})
	elif check["reason"] == &"coins":
		out["note"] = Text.t(&"map.need_coins", {"n": Ui.number(check["coins"] - economy.coins())})
	return out


static func kind_text(id: StringName) -> String:
	var info := GameData.building(id)
	if info.get("type") == "house":
		return Text.t(&"map.kind_house", {"family": Text.t(StringName(info.get("family", "")))})
	match id:
		&"factory":
			return Text.t(&"map.kind_factory")
		&"market":
			return Text.t(&"map.kind_market")
		&"gemmine":
			return Text.t(&"map.kind_gemmine")
	return Text.t(&"map.kind_fun")
