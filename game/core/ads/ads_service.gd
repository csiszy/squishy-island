class_name AdsService
extends Node
## Rewarded ads (autoload: Ads). Kids' rules (Google Play Families): rewarded only, always opted into by the
## player, closable after 5 seconds, child-directed, no advertising ID. A grown-up can switch them off in
## Settings ("rewarded_ads"); then nothing is ever offered.

var provider: AdProvider
var settings: SettingsService


func _ready() -> void:
	if settings == null:
		settings = get_node("/root/Settings") as SettingsService
	if provider == null:
		provider = FakeAdProvider.new()


## May the game offer an ad right now?
func can_offer() -> bool:
	return bool(settings.get_value(&"rewarded_ads")) and provider.is_ready()


## Show a rewarded ad the player asked for. true = watched to the end. Always `await` it.
func show_rewarded(placement: StringName) -> bool:
	if not can_offer():
		return false
	var watched: Variant = await provider.show_rewarded(placement)
	return watched == true
