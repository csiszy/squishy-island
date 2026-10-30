class_name Minigame
extends Node2D
## THE CONTRACT, version 1 (build.html, "The minigame contract"). Every minigame's main scene has a script that
## extends this. The minigame host is the only thing that talks to a minigame, and only through these few
## functions and two signals. A minigame never sees coins, saves, ads, the server or other minigames: it plays,
## then reports a MinigameResult.
##
## Drawing: the game draws in its own logical space (the manifest's "size", 360 x 640 for the prototypes, phone
## portrait); the host scales and centres it. Input arrives as normal Godot input events (_unhandled_input).
##
## The host calls, in this order: setup(ctx) once, start(level) for every run (again for "Play again"), and
## pause()/resume() around its pause panel. A run ends when the game emits `finished` (or the host calls stop()).

## Contract version this file describes. A manifest's "api" must be this number.
const API := 1

## The run is over. Emit exactly once per start().
signal finished(result: MinigameResult)
## The score went up (the host may show it). Scores never go down within a run.
signal score_changed(score: int)

## Everything the game may use (sounds, buzz, its own save box, ...). Set by setup().
var ctx: MinigameContext

## The part of the game's space the player can see: always the whole manifest "size", plus whatever extra the
## phone shows above and below it (tall phones) or at the sides (tablets). Paint backgrounds over all of it, so
## there are never empty stripes; keep buttons and important things inside the "size". Set by set_view().
var view_rect := Rect2()


## Called once, before the first start(). Keep a reference to ctx; show a still first frame if you like.
func setup(context: MinigameContext) -> void:
	ctx = context


## The visible part of the game's space changed (screen size). Read it as view_rect.
func set_view(rect: Rect2) -> void:
	view_rect = rect
	queue_redraw()


## Begin a run. level: the level to play for "levels" games, 0 for endless ones.
func start(_level := 0) -> void:
	pass


## The host's pause panel opened (or the app went to the background). Stop time.
func pause() -> void:
	pass


func resume() -> void:
	pass


## The player left the run early: end it now (emit `finished` with what was reached, no "keep going?").
func stop() -> void:
	pass


## May this run be continued after an ad? (Asked by the game itself through ctx.request_revive().)
func can_revive() -> bool:
	return false


## Continue the run after the player watched the "keep going" ad.
func revive() -> void:
	pass


## Move the game on by `delta` seconds. The engine calls it every frame; tests call it directly to fast-forward
## (with processing switched off), so all of a game's time should pass through here.
func advance(_delta: float) -> void:
	pass


func _process(delta: float) -> void:
	advance(delta)
