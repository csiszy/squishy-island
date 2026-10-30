extends Node
## The game's message board (autoload: Events).
##
## Features never call each other directly. One feature announces something here
## ("a box was opened") and any other feature that cares listens. Add a new signal
## here when a new kind of announcement is needed, with typed arguments and a line
## saying who sends it.

## A box was opened (the server's answer, see GameServer.open_box). Sent by Collection.
signal box_opened(answer: Dictionary)

## A squishy you did not have moved into its house. Sent by Collection.
signal squishy_moved_in(id: StringName)

## A building was fixed up / built to a new level. Sent by Town.
signal building_upgraded(id: StringName, level: int)

## Buildings that just became unlocked (each announced once). Sent by Town.
signal buildings_unlocked(ids: Array[StringName])

## A house's decor changed (bought or switched design). Sent by Town.
signal decor_changed(house: StringName)

## A minigame run ended and was paid (quests and the Gem Challenge listen later).
signal minigame_played(game: StringName, score: int, coins: int)

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
