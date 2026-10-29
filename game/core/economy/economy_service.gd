class_name EconomyService
extends Node
## The wallet (autoload: Economy): coins, Squish Stars and Squish Gems.
## Coins are earned and spent on the phone (the server checks them later). Stars and Gems belong to the
## server; this is the phone's copy, updated from server answers with set_from_server().
## Gems never buy random things and never turn into coins: there is deliberately no way to do that here.

signal changed

## Set before the node enters the tree to use a fake.
var save: SaveService

var _wallet: Dictionary = {}


func _ready() -> void:
	if save == null:
		save = get_node("/root/Save") as SaveService
	reload()
	save.loaded.connect(reload)


func reload() -> void:
	_wallet = save.section(&"wallet")
	for k: String in ["coins", "stars", "gems"]:
		_wallet[k] = int(_wallet.get(k, 0))
	changed.emit()


func coins() -> int:
	return int(_wallet["coins"])


func stars() -> int:
	return int(_wallet["stars"])


func gems() -> int:
	return int(_wallet["gems"])


func can_afford(amount: int) -> bool:
	return amount >= 0 and coins() >= amount


## Take coins out of the jar. Returns false (and takes nothing) if there are not enough.
func spend(amount: int, _reason: StringName) -> bool:
	if amount < 0 or not can_afford(amount):
		return false
	if amount > 0:
		_wallet["coins"] = coins() - amount
		_saved()
	return true


## Put coins into the jar (minigame payouts, quests, refunds).
func earn(amount: int, _reason: StringName) -> void:
	if amount <= 0:
		return
	_wallet["coins"] = coins() + amount
	_saved()


## Stars and Gems as the server says they are.
func set_from_server(stars_now: int, gems_now: int) -> void:
	if stars_now == stars() and gems_now == gems():
		return
	_wallet["stars"] = maxi(0, stars_now)
	_wallet["gems"] = maxi(0, gems_now)
	_saved()


func _saved() -> void:
	save.mark_dirty()
	changed.emit()
