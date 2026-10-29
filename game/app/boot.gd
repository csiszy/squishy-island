extends Control
## First screen: shows the title while the services start, then (from Step 1) opens the city map.
## For now it is a placeholder that proves the project, string table and sound pack work.

@onready var _title: Label = %Title
@onready var _subtitle: Label = %Subtitle


func _ready() -> void:
	_title.text = Text.t(&"app.title")
	_subtitle.text = Text.t(&"app.subtitle")
	Engine.max_fps = Settings.frame_rate()
	Audio.music(&"city")
