class_name ServerService
extends Node
## The connection to the game server (autoload: Server). Use Server.api (a GameServer); always `await` its calls.
##
## Which server the game talks to:
## - the pretend server on the phone (FakeGameServer, memory in the save file under "pretend_server"): tests, and
##   test builds until a real server is chosen;
## - a real Nakama server (NakamaGameServer, server/): in test builds you can point the game at a server on your
##   own computer from the DEV menu ("http://192.168.1.20:7350"); store builds will use the live server.
## The choice and this phone's guest id are kept in their own little file, so starting a fresh town keeps them.

const FILE := "server.json"
## The key the game sends to log in (server/nakama.yml socket.server_key). Not a secret: it is inside the app.
const DEV_KEY := "squishy-island-dev"

## Emitted when the game switched servers (the town is then loaded again from the new one).
signal switched

var api: GameServer
## Set before the node enters the tree to use a pretend file system (tests).
var storage: Storage

var _config := {}


func _ready() -> void:
	if storage == null:
		storage = FileStorage.new()
	_load_config()
	if api == null:
		api = _make(address())


## "" = the pretend server on this phone; otherwise the real server's address.
func address() -> String:
	return String(_config.get("address", ""))


## This phone's guest id for the real server (random, made once; not the phone's own hardware id).
func device_id() -> String:
	if String(_config.get("device_id", "")) == "":
		var c := Crypto.new()
		_config["device_id"] = "island-" + c.generate_random_bytes(16).hex_encode()
		_save_config()
	return String(_config["device_id"])


## Switch servers ("" = the pretend one). With check, first ask the new server if it is there (a Squishy Island
## server answering at that address) and keep the old one if not. Returns {"ok", "error"?}.
func use(new_address: String, check := true) -> Dictionary:
	new_address = new_address.strip_edges()
	if new_address != "" and not new_address.begins_with("http"):
		new_address = "http://" + new_address
	if new_address != "" and new_address.count(":") < 2:
		new_address += ":7350"
	var next := _make(new_address)
	if check and next is NakamaGameServer:
		var answer: Dictionary = await (next as NakamaGameServer).hello()
		if not answer.get("ok", false):
			return {"ok": false, "error": answer.get("error", &"offline")}
	_config["address"] = new_address
	_save_config()
	api = next
	switched.emit()
	return {"ok": true}


## Forget this phone's guest login and make a new one (after deleting the account: the phone starts over).
func new_guest() -> void:
	_config.erase("device_id")
	_save_config()
	api = _make(address())


## A new pretend server for a fresh town (the old pretend memory is gone with the save).
func reset_pretend() -> void:
	if api is FakeGameServer:
		var save := get_node("/root/Save") as SaveService
		api = FakeGameServer.new(save.section(&"pretend_server"), save.mark_dirty)


func _make(addr: String) -> GameServer:
	if addr != "":
		return NakamaGameServer.new(addr, DEV_KEY, device_id(), self)
	var save := get_node_or_null("/root/Save") as SaveService
	if save == null:
		return FakeGameServer.new()
	return FakeGameServer.new(save.section(&"pretend_server"), save.mark_dirty)


func _load_config() -> void:
	_config = {}
	if storage.exists(FILE):
		var parsed: Variant = JSON.parse_string(storage.read_text(FILE))
		if parsed is Dictionary:
			_config = parsed


func _save_config() -> void:
	storage.write_text(FILE, JSON.stringify(_config))
