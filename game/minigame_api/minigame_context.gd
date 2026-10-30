class_name MinigameContext
extends RefCounted
## The ONLY things a minigame may use (contract v1). The host fills it in; the kit's harness fills it with
## pretend versions, so a game runs alone on a computer. Every function here is safe to call even when the
## host left it empty (it then does nothing, or gives a sensible default).

## This game's id (its folder name).
var game_id := &""
## Squishies the player brought, first one = the one who plays (ids; pictures through portrait()).
var squad: Array[StringName] = []
## Helper effects the squad switches on (manifest "perks"): effect id -> amount, e.g. {"fall_slower": 0.25}.
var perks: Dictionary = {}
## The player's best score in this game so far (0 if none).
var best := 0
## Settings the game may follow: "graphics" (low|medium|high), "reduced_motion", "left_handed", "vibration".
var settings: Dictionary = {}
## This game's own little save box (only this game can see it). Change values with store_set().
var store: Dictionary = {}

## Filled in by the host.
var play_sound: Callable        # (stream: AudioStream, loudness: float, pitch: float) -> void
var play_named: Callable        # (id: StringName, pitch: float) -> void
var vibrate: Callable           # (ms: int) -> void
var ask_revive: Callable        # () -> bool, may await (the host shows "keep going?" and the ad)
var get_portrait: Callable      # (id: StringName) -> Texture2D
var get_font: Callable          # (kind: StringName) -> Font  ("display" or "body")
var translate: Callable         # (key: StringName, args: Dictionary) -> String
var save_store: Callable        # (store: Dictionary) -> void


## A sound the game made itself (the kit's tones, or a file in its own folder).
func play(stream: AudioStream, loudness := 1.0, pitch := 1.0) -> void:
	if play_sound.is_valid() and stream != null:
		play_sound.call(stream, loudness, pitch)


## One of the game's shared sound effects by id (coin, heart, tick, ...; the sound pack).
func sfx(id: StringName, pitch := 1.0) -> void:
	if play_named.is_valid():
		play_named.call(id, pitch)


## A short vibration (skipped when the player switched vibration off).
func buzz(ms: int) -> void:
	if vibrate.is_valid():
		vibrate.call(ms)


## A random number maker. The same seed always gives the same numbers (so level N is the same for everyone).
func rng(seed_value: int) -> RandomNumberGenerator:
	var r := RandomNumberGenerator.new()
	r.seed = seed_value
	return r


## Ask the host to offer "Keep going?" (a short ad the player chooses). true = the player watched it: call
## revive yourself. false = no (or ads are off): end the run. Always `await` it.
func request_revive() -> bool:
	if not ask_revive.is_valid():
		return false
	var answer: Variant = await ask_revive.call()
	return answer == true


## A squishy's picture (or null in the harness).
func portrait(id: StringName) -> Texture2D:
	return get_portrait.call(id) if get_portrait.is_valid() else null


## The game's fonts: &"display" (big rounded titles) or &"body" (bold numbers and labels).
func font(kind: StringName) -> Font:
	var f: Variant = get_font.call(kind) if get_font.is_valid() else null
	return f if f is Font else ThemeDB.fallback_font


## Player-facing words from the game's own strings_en.csv (keys start with the game id), {name} filled from args.
func t(key: StringName, args: Dictionary = {}) -> String:
	if translate.is_valid():
		return translate.call(key, args)
	return String(key).format(args) if not args.is_empty() else String(key)


func store_set(key: String, value: Variant) -> void:
	store[key] = value
	if save_store.is_valid():
		save_store.call(store)


func perk(effect: StringName, otherwise := 0.0) -> float:
	return float(perks.get(effect, otherwise))


func reduced_motion() -> bool:
	return bool(settings.get("reduced_motion", false))


func graphics() -> StringName:
	return StringName(settings.get("graphics", &"high"))
