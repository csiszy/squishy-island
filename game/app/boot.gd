extends Control
## First screen: the title while the services start, then the app shell (app/main.tscn) with the city map.
## Later steps add the graphics check, the guest account and the opening story here (start.html).

const NEXT := "res://app/main.tscn"

@onready var _title: Label = %Title
@onready var _subtitle: Label = %Subtitle


func _ready() -> void:
	theme = UiTheme.get_theme()
	_title.text = Text.t(&"app.title")
	_title.theme_type_variation = "Title"
	_subtitle.text = Text.t(&"app.subtitle")
	_subtitle.theme_type_variation = "Heading"
	Engine.max_fps = Settings.frame_rate()
	Audio.music(&"city")
	await get_tree().process_frame
	await get_tree().process_frame
	get_tree().change_scene_to_file(NEXT)
