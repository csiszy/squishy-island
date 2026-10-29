extends Node
## The game's message board (autoload: Events).
##
## Features never call each other directly. One feature announces something here
## ("a box was opened") and any other feature that cares listens. Add a new signal
## here when a new kind of announcement is needed, with typed arguments and a line
## saying who sends it.

## The game is going to the background (home button, incoming call). Sent by Events itself.
signal app_paused

## The game came back to the foreground. Sent by Events itself.
signal app_resumed


func _notification(what: int) -> void:
	match what:
		NOTIFICATION_APPLICATION_PAUSED, NOTIFICATION_APPLICATION_FOCUS_OUT:
			app_paused.emit()
		NOTIFICATION_APPLICATION_RESUMED, NOTIFICATION_APPLICATION_FOCUS_IN:
			app_resumed.emit()
