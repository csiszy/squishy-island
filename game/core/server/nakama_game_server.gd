class_name NakamaGameServer
extends GameServer
## The real game server (Nakama, see server/ and server/README.md), over the internet or the home Wi-Fi.
## The phone logs in as a guest with its own random device id (made by the game, not the phone's hardware id) and
## then asks the server's RPCs (server/src/main.ts), which follow the same rules as FakeGameServer.
## Nakama's plain web API is enough for this (HTTPRequest), so no extra plugin is needed.
##
## When the server can't be reached every answer is {"ok": false, "error": "offline"}, like the pretend server's
## offline mode: the game then says it needs the internet for that (minigames still pay out).

## How long to wait for an answer (seconds).
const TIMEOUT := 8.0

## e.g. "http://192.168.1.20:7350" (your laptop) or "https://island.example.eu" (the live server)
var address := ""
var server_key := ""
var device_id := ""
## A node to hang the web requests on (they must be in the scene tree).
var host: Node

var _token := ""
var _token_until := 0.0


func _init(server_address: String, key: String, device: String, request_host: Node) -> void:
	address = server_address.trim_suffix("/")
	server_key = key
	device_id = device
	host = request_host


## Is this a Squishy Island server, and can we reach it? {"ok", "error"?}
func hello() -> Dictionary:
	return await _rpc(&"hello", {})


func load_state() -> Dictionary:
	return await _rpc(&"load_state", {})


func open_box(kind: StringName, family: StringName = &"", first_box := false) -> Dictionary:
	return await _rpc(&"open_box", {"kind": kind, "family": family, "first_box": first_box})


func level_up(id: StringName) -> Dictionary:
	return await _rpc(&"level_up", {"id": id})


func swap_spare(id: StringName) -> Dictionary:
	return await _rpc(&"swap_spare", {"id": id})


func submit_run(game: StringName, seconds: float, coins: int, kind: StringName = &"endless") -> Dictionary:
	return await _rpc(&"submit_run", {"game": game, "seconds": seconds, "coins": coins, "kind": kind})


func is_remote() -> bool:
	return true


func save_town(town: String, revision: int) -> Dictionary:
	return await _rpc(&"save_town", {"town": town, "revision": revision})


func load_town() -> Dictionary:
	return await _rpc(&"load_town", {})


func account_status() -> Dictionary:
	return await _rpc(&"account_status", {})


func transfer_create() -> Dictionary:
	return await _rpc(&"transfer_create", {})


func transfer_use(code: String, pin: String, confirm: bool) -> Dictionary:
	var answer := await _rpc(&"transfer_use", {"code": code, "pin": pin, "device_id": device_id, "confirm": confirm})
	if confirm and answer.get("ok", false):
		_token = ""   # this phone now logs in to the saved town
	return answer


func email_start(email: String, purpose: StringName) -> Dictionary:
	return await _rpc(&"email_start", {"email": email, "purpose": purpose})


func email_confirm(code: String, confirm: bool) -> Dictionary:
	var answer := await _rpc(&"email_confirm", {"code": code, "device_id": device_id, "confirm": confirm})
	if confirm and answer.get("ok", false) and not answer.get("linked", false):
		_token = ""
	return answer


func delete_request() -> Dictionary:
	return await _rpc(&"delete_request", {})


func _rpc(id: StringName, payload: Dictionary) -> Dictionary:
	for attempt in 2:
		if not await _login():
			return {"ok": false, "error": &"offline"}
		var r := await _post("/v2/rpc/%s?unwrap=true" % id, JSON.stringify(payload), ["Authorization: Bearer " + _token])
		if r["code"] == 401 and attempt == 0:
			# the login ran out: log in again and ask once more
			_token = ""
			continue
		if r["code"] != 200:
			return {"ok": false, "error": &"offline"}
		var data: Variant = JSON.parse_string(r["body"])
		if not data is Dictionary:
			return {"ok": false, "error": &"bad_answer"}
		return _tidy(data)
	return {"ok": false, "error": &"offline"}


## Log in as this phone's guest (the account is made the first time).
func _login() -> bool:
	if _token != "" and Time.get_unix_time_from_system() < _token_until - 60.0:
		return true
	var basic := "Basic " + Marshalls.utf8_to_base64(server_key + ":")
	var r := await _post("/v2/account/authenticate/device?create=true", JSON.stringify({"id": device_id}), ["Authorization: " + basic])
	if r["code"] != 200:
		return false
	var data: Variant = JSON.parse_string(r["body"])
	if not data is Dictionary or not (data as Dictionary).has("token"):
		return false
	_token = String(data["token"])
	_token_until = _expiry(_token)
	return true


## When a login token runs out (it says so inside: the middle part of the token is JSON with "exp").
static func _expiry(token: String) -> float:
	var parts := token.split(".")
	if parts.size() < 2:
		return 0.0
	var middle := parts[1].replace("-", "+").replace("_", "/")
	while middle.length() % 4 != 0:
		middle += "="
	var claims: Variant = JSON.parse_string(Marshalls.base64_to_utf8(middle))
	return float((claims as Dictionary).get("exp", 0)) if claims is Dictionary else 0.0


## {"code": HTTP status (0 = no answer), "body": text}
func _post(path: String, body: String, headers: PackedStringArray) -> Dictionary:
	if host == null or not host.is_inside_tree() or address == "":
		return {"code": 0, "body": ""}
	var req := HTTPRequest.new()
	req.timeout = TIMEOUT
	host.add_child(req)
	headers.append("Content-Type: application/json")
	if req.request(address + path, headers, HTTPClient.METHOD_POST, body) != OK:
		req.queue_free()
		return {"code": 0, "body": ""}
	var res: Array = await req.request_completed
	req.queue_free()
	if int(res[0]) != HTTPRequest.RESULT_SUCCESS:
		return {"code": 0, "body": ""}
	return {"code": int(res[1]), "body": (res[3] as PackedByteArray).get_string_from_utf8()}


## JSON has only one kind of number: give whole numbers back as ints (levels, spares, coins...) and errors and
## squishy ids as StringNames, like the pretend server's answers.
static func _tidy(v: Variant) -> Variant:
	if v is Dictionary:
		var out := {}
		for k: Variant in (v as Dictionary):
			var x: Variant = _tidy((v as Dictionary)[k])
			if k in ["error", "squishy"] and x is String:
				x = StringName(x)
			out[k] = x
		return out
	if v is Array:
		var arr := []
		for x: Variant in (v as Array):
			arr.append(_tidy(x))
		return arr
	if v is float and is_equal_approx(v, roundf(v)) and absf(v) < 1e15:
		return int(v)
	return v
