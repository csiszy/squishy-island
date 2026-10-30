class_name AudioOutput
extends RefCounted
## What actually makes sound. This is the interface: GodotAudioOutput plays real files,
## FakeAudioOutput just remembers what it was asked to do (for tests).
## Volumes are linear (0 = silent, 1 = full).


## Load every sound effect up front so the first tap has no delay.
func preload_sfx(_ids: Array[StringName]) -> void:
	pass


func play_sfx(_id: StringName, _volume: float, _pitch: float) -> void:
	pass


## A sound that is not in the pack (a minigame's own blips), on the sound-effects bus.
func play_stream(_stream: AudioStream, _volume: float, _pitch: float) -> void:
	pass


## Start a music loop, fading in over `fade` seconds (and fading out whatever was playing).
func play_music(_id: StringName, _fade: float) -> void:
	pass


func stop_music(_fade: float) -> void:
	pass


## Volume of a whole bus (&"sfx" or &"music"), changing smoothly over `fade` seconds.
func set_bus_volume(_bus: StringName, _volume: float, _fade: float) -> void:
	pass


## Stop everything at once (the game is closing).
func shutdown() -> void:
	pass
