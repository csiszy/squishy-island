class_name NavService
extends Node
## Moving between screens (autoload: Nav). A feature asks to go somewhere by name; the app shell (app/main.gd)
## knows which scene each name is, so features never load each other's scenes.
##     Nav.go(&"house", {"id": &"dumpling"})
##     Nav.back()
## Screen names: city, house, factory, collection (more come with later steps).

signal go_requested(screen: StringName, args: Dictionary)
signal back_requested

## The screen on top right now (set by the app shell).
var current: StringName = &""


func go(screen: StringName, args: Dictionary = {}) -> void:
	go_requested.emit(screen, args)


func back() -> void:
	back_requested.emit()
