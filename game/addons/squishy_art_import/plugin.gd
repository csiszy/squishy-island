@tool
extends EditorPlugin
## Registers the art import step (art_import.gd) while the Godot editor is open (also when CI imports headless).

var _import: EditorScenePostImportPlugin


func _enter_tree() -> void:
	_import = preload("res://addons/squishy_art_import/art_import.gd").new()
	add_scene_post_import_plugin(_import)


func _exit_tree() -> void:
	remove_scene_post_import_plugin(_import)
	_import = null
