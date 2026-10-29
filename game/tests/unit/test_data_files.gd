extends GutTest
## The files exported from the design book (data/) fit together: counts, odds, ids and words.


func _json(file_name: String) -> Dictionary:
	var v: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/" + file_name))
	assert_true(v is Dictionary, "%s is valid JSON" % file_name)
	return v if v is Dictionary else {}


func _assert_words(key: Variant, where: String) -> void:
	assert_true(key is String and TranslationServer.translate(StringName(key)) != StringName(key), "words for %s (%s)" % [key, where])


func test_48_squishies_in_8_families_of_six() -> void:
	var list: Array = _json("squishies.json")["squishies"]
	assert_eq(list.size(), 48)
	var per_family := {}
	var per_rarity := {}
	for q: Dictionary in list:
		per_family[q["family"]] = int(per_family.get(q["family"], 0)) + 1
		per_rarity[q["rarity"]] = int(per_rarity.get(q["rarity"], 0)) + 1
		for field: String in ["name", "bio", "where"]:
			_assert_words(q[field], q["id"])
	assert_eq(per_family.size(), 8)
	for f: String in per_family:
		assert_eq(per_family[f], 6, f)
	assert_eq(per_rarity, {"C": 16, "U": 8, "R": 8, "E": 8, "L": 8})


func test_gem_shop_exclusives_are_never_in_boxes() -> void:
	var data := _json("squishies.json")
	var ids: Array = (data["squishies"] as Array).map(func(q: Dictionary) -> String: return q["id"])
	for x: Dictionary in data["exclusives"]:
		assert_false(ids.has(x["id"]), "%s must stay out of the box pool" % x["id"])
		assert_false(x["tradable"])


func test_box_odds_add_up_to_100() -> void:
	var boxes: Dictionary = _json("economy.json")["boxes"]
	for id: String in boxes:
		var total := 0.0
		for r: String in boxes[id]["odds"]:
			total += float(boxes[id]["odds"][r])
		assert_almost_eq(total, 100.0, 0.0001, id)
	assert_eq(float(boxes["golden"]["odds"]["C"]), 0.0, "no Commons in Golden Boxes")


func test_every_building_has_levels_and_words() -> void:
	var list: Array = _json("buildings.json")["buildings"]
	assert_eq(list.size(), 21)
	for b: Dictionary in list:
		_assert_words(b["name"], b["id"])
		var levels: Array = b["levels"]
		if b.get("single", false):
			assert_eq(levels.size(), 1, b["id"])
			continue
		assert_eq(levels.size(), 10 if b["type"] == "house" else 11, b["id"])
		for lv: Dictionary in levels:
			if int(lv["level"]) >= 1:
				_assert_words(lv.get("title"), "%s level %d" % [b["id"], lv["level"]])
		if b["type"] == "civic":
			assert_true(b["goal"]["stat"] is String, "%s has a goal" % b["id"])


func test_houses_cost_100_to_2500_before_the_family_multiplier() -> void:
	for b: Dictionary in _json("buildings.json")["buildings"]:
		if b["id"] == "dumpling":
			assert_eq(int(b["levels"][1]["coins"]), 100)
			assert_eq(int(b["levels"][9]["coins"]), 2500)
			assert_eq(int(b["levels"][9]["squishies"]), 5)


func test_the_map_and_the_unlock_list_only_name_real_buildings() -> void:
	var ids: Array = (_json("buildings.json")["buildings"] as Array).map(func(b: Dictionary) -> String: return b["id"])
	var on_map: Array = (_json("city.json")["buildings"] as Array).map(func(b: Dictionary) -> String: return b["id"])
	assert_eq(on_map.size(), ids.size())
	for id: String in ids:
		assert_has(on_map, id)
	var unlocked := []
	for u: Dictionary in _json("economy.json")["unlocks"]:
		unlocked.append_array(u.get("houses", []))
		unlocked.append_array(u.get("buildings", []))
	for id: String in unlocked:
		assert_has(ids, id, "unlock list names %s" % id)
	for id: String in ids:
		assert_has(unlocked, id, "%s unlocks somewhere" % id)


func test_decor_has_words_and_four_designs() -> void:
	for b: Dictionary in _json("buildings.json")["buildings"]:
		for d: Dictionary in b.get("decor", []):
			_assert_words(d["name"], "%s decor" % b["id"])
			assert_eq((d["prices"] as Dictionary).size(), 4)
