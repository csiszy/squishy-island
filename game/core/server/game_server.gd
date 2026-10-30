class_name GameServer
extends RefCounted
## Everything the game server decides (build.html, "What lives where"): box rolls, the Spare Shelf, Stars and
## Gems. This is the interface. FakeGameServer plays the server on the phone (now, and in tests); the Nakama
## version comes in Step 4. Callers always `await` these, because the real server answers over the internet.
##
## Every answer is a Dictionary with "ok" (bool); when ok is false, "error" says why (a key of ERRORS).
## Collection entries look like {"level": 1..5, "spares": int, "sparkly": bool}.

const ERRORS := [&"offline", &"unknown_box", &"unknown_squishy", &"not_owned", &"no_spares", &"max_level", &"bad_run"]


## Everything the server knows about this player: {"ok", "collection": {id: entry}, "stars", "gems", "pity",
## "boxes_opened"}. The first time, the server also gives the free starter squishy.
func load_state() -> Dictionary:
	return {"ok": false, "error": &"offline"}


## Roll one box. kind: mystery | family | golden. family: the house id for a Family Box.
## first_box: the tutorial's free first box (always the same squishy).
## Answer: {"ok", "squishy", "rarity", "sparkly", "is_new", "entry", "pity", "boxes_opened"}.
func open_box(_kind: StringName, _family: StringName = &"", _first_box := false) -> Dictionary:
	return {"ok": false, "error": &"offline"}


## Use spares to level a squishy up (level 5 = Sparkly). Answer: {"ok", "entry"}.
func level_up(_id: StringName) -> Dictionary:
	return {"ok": false, "error": &"offline"}


## Swap one spare for Squish Stars. Answer: {"ok", "entry", "stars"}.
func swap_spare(_id: StringName) -> Dictionary:
	return {"ok": false, "error": &"offline"}


## Report a finished minigame run and the coins the phone worked out for it. The server keeps an impossible amount
## from being paid (more than about 60 coins per minute of play, build.html "What lives where"; a level game's
## fixed reward for one level is always allowed). kind: the manifest's kind (endless, levels, ...).
## Answer: {"ok", "coins" (what may be paid), "capped" (bool)}.
func submit_run(_game: StringName, _seconds: float, _coins: int, _kind: StringName = &"endless") -> Dictionary:
	return {"ok": false, "error": &"offline"}
