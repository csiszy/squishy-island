extends RefCounted
## A robot stylist that plays like a quick child: one tap every 0.9 s, fixing what differs from the Wants card,
## then Done!, and one time in four it misses a detail and taps Done! a step early.

const REACTION := 0.9

var _wait := 0.0
var _rng := RandomNumberGenerator.new()


func act(game: Minigame, delta: float) -> void:
	_wait -= delta
	if _wait > 0.0:
		return
	_wait = REACTION
	var g: Dictionary = game.get(&"g")
	if not (g["res"] as Dictionary).is_empty() or g["in"] < 1.0:
		return
	var have: Dictionary = g["have"]
	var want: Dictionary = g["want"]
	var wrong := 0
	for k: String in ["style", "fringe", "fin", "col", "acc"]:
		if have[k] != want[k]:
			wrong += 1
	if wrong == 1 and _rng.randf() < 0.25:
		game.call(&"use", "done")
		return
	for pair: Array in [["style", "comb"], ["fringe", "fringe"], ["fin", "spray"]]:
		if have[pair[0]] != want[pair[0]]:
			game.call(&"use", pair[1])
			return
	if have["col"] != want["col"]:
		game.call(&"use", "col", want["col"])
	elif have["acc"] != want["acc"]:
		game.call(&"use", "acc", want["acc"])
	else:
		game.call(&"use", "done")
