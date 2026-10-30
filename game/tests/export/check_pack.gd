extends SceneTree
## Checks a phone build's game files from the computer (CI runs it after building the .apk):
##     godot --headless --path game --export-pack "Android APK" build/check.pck
##     godot --headless --main-pack game/build/check.pck -s "$PWD/game/tests/export/check_pack.gd"
## In a phone build files are stored differently than in the project (scenes become ".tscn.remap", scripts are
## compiled, only resources and the listed extra files go in), so "works on the computer" is not enough.
## Exits with 1 and lists the problems if anything is missing.

var problems: PackedStringArray = []


func _init() -> void:
	await process_frame   # the game's services (autoloads) are up from the first frame
	# every screen the app can open
	var screens: Dictionary = (load("res://app/main.gd") as GDScript).get_script_constant_map().get("SCREENS", {})
	for id: StringName in screens:
		if not ResourceLoader.exists(screens[id]):
			problems.append("screen %s missing (%s)" % [id, screens[id]])
	# every data file
	for f: String in ["economy.json", "buildings.json", "squishies.json", "city.json", "audio.json", "rarity.json", "decor_styles.json"]:
		if not FileAccess.file_exists("res://data/" + f):
			problems.append("data/%s missing" % f)
	# every minigame folder: manifest, scene, words
	var catalog: GDScript = load("res://features/minigame_host/minigame_catalog.gd")
	var found: Dictionary = catalog.call(&"by_building")
	for folder in DirAccess.get_directories_at("res://minigames"):
		if folder.begins_with("_"):
			continue
		var manifest_path := "res://minigames/%s/manifest.json" % folder
		if not FileAccess.file_exists(manifest_path):
			problems.append("%s: manifest.json not in the build" % folder)
			continue
		var m: Object = (load("res://minigame_api/minigame_manifest.gd") as GDScript).call(&"from_file", manifest_path)
		if not m.call(&"is_ok"):
			problems.append("%s: %s" % [folder, m.get(&"problems")])
			continue
		if not found.has(m.call(&"building")):
			problems.append("%s: not offered at its building" % folder)
		var scene := load(m.call(&"scene_path")) as PackedScene
		var node: Node = scene.instantiate() if scene != null else null
		if node == null or not node.has_method(&"advance"):
			problems.append("%s: its scene does not load as a minigame" % folder)
		if node != null:
			node.free()
		if not ResourceLoader.exists("res://minigames/%s/strings_en.en.translation" % folder):
			problems.append("%s: its words are not in the build" % folder)
	if found.is_empty():
		problems.append("no minigames found at all")
	if problems.is_empty():
		print("phone build check: OK (%d screens, %d minigames)" % [screens.size(), found.size()])
		quit(0)
	else:
		for p in problems:
			printerr("phone build check: " + p)
		quit(1)
