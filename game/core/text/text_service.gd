class_name TextService
extends Node
## Every word the player sees (autoload: Text).
##
##     Text.t(&"ui.back_to_town")                       -> "Back to town"
##     Text.t(&"ui.coins_earned", {"n": 35})            -> "+35 coins"
##
## The words live in data/strings_en.csv (one row per key, one column per language), which
## Godot turns into a translation. Never write player-facing words straight into code or scenes:
## add a key to the string table instead, so adding a language later is only translation.
## UI nodes can also use the key as their text; Godot swaps in the words automatically.

var _missing: Dictionary[StringName, bool] = {}


## The words for `key`, with {name} placeholders filled from `args`.
## A missing key shows the key itself (so it is easy to spot) and warns once.
func t(key: StringName, args: Dictionary = {}) -> String:
	var s := String(TranslationServer.translate(key))
	if s == String(key):
		if not _missing.has(key):
			_missing[key] = true
			push_warning("Text: no words for %s in the string table" % key)
		return s
	return s.format(args) if not args.is_empty() else s


func has(key: StringName) -> bool:
	return String(TranslationServer.translate(key)) != String(key)


## Keys asked for that were not in the string table (tests check this stays empty).
func missing_keys() -> Array[StringName]:
	return _missing.keys()
