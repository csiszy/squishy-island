class_name MinigameCatalog
extends RefCounted
## Finds every minigame: each folder in res://minigames/ with a manifest.json (folders starting with "_", like
## the template, are skipped). Adding, removing or replacing a game never means editing anything outside its
## folder (build.html, "The minigame contract").

const DIR := "res://minigames"


## Every readable manifest (broken ones are reported and left out).
static func scan(dir := DIR) -> Array[MinigameManifest]:
	var out: Array[MinigameManifest] = []
	for folder in DirAccess.get_directories_at(dir):
		if folder.begins_with("_") or folder.begins_with("."):
			continue
		var path := dir.path_join(folder).path_join("manifest.json")
		if not FileAccess.file_exists(path):
			continue
		var m := MinigameManifest.from_file(path)
		if m.is_ok():
			out.append(m)
		else:
			push_warning("Minigame %s left out: %s" % [folder, ", ".join(m.problems)])
	return out


## building id -> the enabled game for it: {"id", "folder"} (what GameData.minigame_for() answers).
static func by_building(dir := DIR) -> Dictionary:
	var out := {}
	for m in scan(dir):
		if m.enabled():
			out[m.building()] = {"id": m.id(), "folder": m.folder}
	return out


static func find(game_id: StringName, dir := DIR) -> MinigameManifest:
	var path := dir.path_join(String(game_id)).path_join("manifest.json")
	if not FileAccess.file_exists(path):
		return null
	var m := MinigameManifest.from_file(path)
	return m if m.is_ok() else null
