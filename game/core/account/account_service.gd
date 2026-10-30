class_name AccountService
extends Node
## The player's account (autoload: Account; account.html "Accounts & saving").
##
## - Cloud save: with a real server, the town is sent to it a few seconds after it changes (Save writes it on the
##   phone first, so offline play loses nothing), and when the game starts a newer town on the server (saved by
##   another phone) replaces the phone's copy. The pretend server keeps everything on the phone anyway.
## - Moving a town onto this phone (transfer code or email): the server moves the phone's login, then the saved
##   town is loaded here.
## - Deleting the account: the server deletes it after 30 days; the phone starts a brand new town right away.
## The screens are in features/account/; this service holds no pictures or words.

## The town on this phone was replaced (another phone's newer save, a town moved here, a deleted account): screens
## should start again from the map.
signal town_replaced
## account_status() changed (saved with an email or not).
signal status_changed

## Seconds after the last change before the town goes to the server.
const UPLOAD_DELAY := 4.0

var save: SaveService
var server_service: ServerService
## The last account_status() answer ({} until known).
var status: Dictionary = {}

var _upload_in := -1.0
var _uploading := false


func _ready() -> void:
	if save == null:
		save = get_node("/root/Save") as SaveService
	if server_service == null:
		server_service = get_node("/root/Server") as ServerService
	save.written.connect(_on_written)
	server_service.switched.connect(func() -> void:
		status = {}
		await pull_town()
		await refresh_status())
	_start.call_deferred()


func _start() -> void:
	await pull_town()
	await refresh_status()


func _api() -> GameServer:
	return server_service.api


## Saved with an email (Save my town)?
func is_linked() -> bool:
	return bool(status.get("linked", false))


func refresh_status() -> Dictionary:
	var answer: Dictionary = await _api().account_status()
	if answer.get("ok", false):
		status = answer
		status_changed.emit()
	return answer


# ---------------------------------------------------------------- cloud save

func _on_written() -> void:
	if _api().is_remote():
		_upload_in = UPLOAD_DELAY


func _process(delta: float) -> void:
	if _upload_in < 0.0:
		return
	_upload_in -= delta
	if _upload_in < 0.0:
		upload_town()


## Send the phone's town to the server now (also when the app goes to the background).
func upload_town() -> Dictionary:
	_upload_in = -1.0
	if not _api().is_remote() or _uploading:
		return {"ok": false, "error": &"offline"}
	_uploading = true
	var answer: Dictionary = await _api().save_town(save.export_text(), save.revision)
	_uploading = false
	if not answer.get("ok", false):
		_upload_in = UPLOAD_DELAY * 4.0   # try again a little later (no internet just now)
	return answer


## If the server has a newer town than the phone (saved by another phone), load it. With always: load the server's
## town whatever its age (a town moved onto this phone). Returns true if the phone's town was replaced.
func pull_town(always := false) -> bool:
	if not _api().is_remote():
		return false
	var answer: Dictionary = await _api().load_town()
	var text: Variant = answer.get("town")
	if not answer.get("ok", false) or not text is String:
		return false
	if not always and save.status != SaveService.Status.FRESH and int(answer.get("revision", 0)) <= save.revision:
		return false
	if not save.import_text(text):
		return false
	town_replaced.emit()
	return true


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_CLOSE_REQUEST:
		if _upload_in >= 0.0:
			upload_town()


# ---------------------------------------------------------------- moving a town here, deleting

## After transfer_use / email_confirm with confirm: this phone now plays the saved town.
func took_saved_town() -> void:
	status = {}
	var collection := get_node_or_null("/root/Collection") as CollectionService
	if collection != null:
		await collection.sync()
	if not await pull_town(true):
		town_replaced.emit()
	await refresh_status()


## Delete the account (the server keeps it 30 days in case the grown-up changes their mind), then start a new town
## on this phone with a new guest login.
func delete_account() -> Dictionary:
	var answer: Dictionary = await _api().delete_request()
	if not answer.get("ok", false):
		return answer
	_upload_in = -1.0
	save.wipe()
	save.load_game()
	server_service.new_guest()
	var collection := get_node_or_null("/root/Collection") as CollectionService
	if collection != null:
		collection.server = server_service.api
		await collection.sync()
	status = {}
	town_replaced.emit()
	await refresh_status()
	return answer
