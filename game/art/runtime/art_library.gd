class_name ArtLibrary
extends RefCounted
## Where to find every model and picture. A hand-made file with the same name in art/overrides/ always wins,
## so art from an artist can replace the exported art one file at a time without changing any code.
##     ArtLibrary.building(&"dumpling", 7)   -> the Dumpling Steamhouse at level 7 (PackedScene)
##     ArtLibrary.squishy(&"bao")            -> Bao Bun, 1 unit tall, standing at the origin, facing +z
##     ArtLibrary.portrait(&"bao")           -> Bao Bun's 256 px picture (Texture2D)

const OVERRIDES := "res://art/overrides/"


static func building_path(id: StringName, level: int) -> String:
	return _pick("res://art/models/buildings/%s/building_%s_L%02d.glb" % [id, id, level])


static func squishy_path(id: StringName) -> String:
	return _pick("res://art/models/squishies/squishy_%s.glb" % id)


static func portrait_path(id: StringName) -> String:
	return _pick("res://art/sprites/squishies/%s.png" % id)


static func building(id: StringName, level: int) -> PackedScene:
	return _load(building_path(id, level)) as PackedScene


static func squishy(id: StringName) -> PackedScene:
	return _load(squishy_path(id)) as PackedScene


static func portrait(id: StringName) -> Texture2D:
	return _load(portrait_path(id)) as Texture2D


static func _pick(path: String, overrides := OVERRIDES) -> String:
	var hand_made := overrides + path.get_file()
	return hand_made if ResourceLoader.exists(hand_made) else path


static func _load(path: String) -> Resource:
	if not ResourceLoader.exists(path):
		push_warning("Art: missing %s (run tools/export_art)" % path)
		return null
	return load(path)
