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
## report (optional; quests and the Gem Challenge need it): {"day", "games", "score", "metric", "won", "level",
## "stars", "prev_stars", "newest"}. With a report the day's first run pays double (firstRunMultiplier).
## Answer: {"ok", "coins" (what may be paid), "capped" (bool), "first_today" (bool), "quests_done": [ids]}.
func submit_run(_game: StringName, _seconds: float, _coins: int, _kind: StringName = &"endless", _report: Dictionary = {}) -> Dictionary:
	return {"ok": false, "error": &"offline"}


# ---------------------------------------------------------------- accounts (account.html; Step 4b)

## True for a real server (the town is saved to it: cloud save); false for the pretend one inside the phone.
func is_remote() -> bool:
	return false


## Keep the phone's town (Save.export_text()) on the server. Answer: {"ok", "saved_at"}.
func save_town(_town: String, _revision: int) -> Dictionary:
	return {"ok": false, "error": &"offline"}


## The town kept on the server. Answer: {"ok", "town" (text or null), "revision", "saved_at"}.
func load_town() -> Dictionary:
	return {"ok": false, "error": &"offline"}


## Answer: {"ok", "linked" (saved with an email), "email" ("p•••@example.com"), "deletion_after" (unix ms, 0 = no),
## "town": {"squishies", "steamhouse", "saved_at"}}.
func account_status() -> Dictionary:
	return {"ok": false, "error": &"offline"}


## A one-time code + PIN to move this town to a new phone, valid 24 hours. Answer: {"ok", "code", "pin", "until"}.
func transfer_create() -> Dictionary:
	return {"ok": false, "error": &"offline"}


## A code + PIN typed on a new phone. Without confirm: {"ok", "saved": town summary, "phone": this phone's town}
## (for "Which town?"); with confirm: this phone now plays the saved town (log in again, load everything).
## Errors: bad_code, bad_pin, same_town.
func transfer_use(_code: String, _pin: String, _confirm: bool) -> Dictionary:
	return {"ok": false, "error": &"offline"}


## Send a 6-digit code to an email. purpose: &"link" (save this town with it) or &"login" (bring back the town saved
## with it). Answer: {"ok", "email" (masked), "dev_code" (test servers only)}. Errors: bad_email, email_taken, too_many.
func email_start(_email: String, _purpose: StringName) -> Dictionary:
	return {"ok": false, "error": &"offline"}


## The code from the email. Linking: {"ok", "linked", "email"}. Login: like transfer_use (preview, then confirm).
func email_confirm(_code: String, _confirm: bool) -> Dictionary:
	return {"ok": false, "error": &"offline"}


## Delete this account (in 30 days; logging back in before then cancels it). Answer: {"ok", "after"}.
func delete_request() -> Dictionary:
	return {"ok": false, "error": &"offline"}


# ---------------------------------------------------------------- daily quests and the Gem Challenge (Step 4c)

## Today's quests (made the first time they are asked for that day). day: the phone's date "YYYY-MM-DD"; games: the
## minigames the player has built [{"id", "kind"}]. Answer: {"ok", "day", "quests": [{"id", "kind", "game",
## "target", "text", "reward", "progress", "claimed"}], "challenge": {"game", "goal" (score | levels3 | song3),
## "target", "progress", "done", "claimed"} or null, "first_run_left", "tomorrow" (a game id), "streak": {"days",
## "needed", "gems", "claimed"}, "rewards": {"quest", "challenge"}}.
func quests(_day: String, _games: Array) -> Dictionary:
	return {"ok": false, "error": &"offline"}


## Collect a reward. id: a quest's id (answer {"coins"}: the phone adds them), "challenge" or "streak" (answer
## {"gems", "total_gems", "stars"}). Errors: not_done, claimed, not_today, no_quest.
func quest_claim(_day: String, _id: String) -> Dictionary:
	return {"ok": false, "error": &"offline"}


# ---------------------------------------------------------------- the Visitor of the week (Step 4c)

## This week's visitor in the park (chosen on the week's first ask, then the same all week). day: the phone's date.
## Answer: {"ok", "squishy" (&"" = nobody visits this week), "rarity", "days" (said hi on), "needed", "today_done",
## "moved_in", "until" (the Sunday it leaves, "YYYY-MM-DD")}.
func visitor(_day: String) -> Dictionary:
	return {"ok": false, "error": &"offline"}


## Say hi and give a treat (once a day). Same answer as visitor(); when it moves in, also "entry" and "is_new".
## Errors: already_today, moved_in, no_visitor.
func visitor_hi(_day: String) -> Dictionary:
	return {"ok": false, "error": &"offline"}
