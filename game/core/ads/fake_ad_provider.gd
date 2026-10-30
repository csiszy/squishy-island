class_name FakeAdProvider
extends AdProvider
## A pretend ad. In the game a pretend-ad panel is shown (the app shell plugs it in as `presenter`); in tests it
## simply answers `answer`. Like a real ad it lasts a few seconds and can be closed after 5 (no reward then).

const LENGTH := 8

## (seconds: int, closable_after: int) -> bool, may await. Empty = answer straight away.
var presenter: Callable
## What a test wants the "player" to do: true = watch to the end.
var answer := true
## How many ads were asked for (tests).
var shown := 0


func is_ready() -> bool:
	return true


func show_rewarded(_placement: StringName) -> bool:
	shown += 1
	if presenter.is_valid():
		var closable := int(GameData.economy().get("ads", {}).get("closableAfterSeconds", 5))
		var watched: Variant = await presenter.call(LENGTH, closable)
		return watched == true
	return answer
