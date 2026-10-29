class_name ServerService
extends Node
## The connection to the game server (autoload: Server). Use Server.api (a GameServer); always `await` its calls.
## Until Step 4 this is the pretend server, which keeps its memory in the save file under "pretend_server".

var api: GameServer


func _ready() -> void:
	if api == null:
		var save := get_node("/root/Save") as SaveService
		api = FakeGameServer.new(save.section(&"pretend_server"), save.mark_dirty)
