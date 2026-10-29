class_name SaveService
extends Node
## The player's town on the phone (autoload: Save).
##
## Everything a feature wants to keep goes into its own named section:
##     var town := Save.section(&"town")
##     town["houses_fixed"] = 3
##     Save.mark_dirty()
## The file is written a moment later (and right away when the app goes to the background).
##
## Safety rules:
## - The file has a version number. When the format changes, bump CURRENT_VERSION and add
##   a migration (old data in, new data out) to MIGRATIONS, plus a test. An old town is
##   always upgraded, never thrown away. A copy of the old file is kept before upgrading.
## - Writing goes to a temporary file first, then swaps it in, keeping the previous file as
##   a backup. A crash mid-write can never leave a broken save.
## - A save made by a newer version of the game is never overwritten by an older one.

signal loaded
signal written

const FILE := "save.json"
const BACKUP := "save.backup.json"
const TEMP := "save.tmp.json"

## The save format version this build writes.
const CURRENT_VERSION := 1

enum Status { NOT_LOADED, FRESH, LOADED, FROM_BACKUP, TOO_NEW, CANNOT_UPGRADE }

## Where the files go. Set before the node enters the tree to use a fake.
var storage: Storage
## The version this instance writes (tests set a higher one to try migrations).
var current_version := CURRENT_VERSION
## Version n -> function that takes version-n data and returns version-(n+1) data.
var migrations: Dictionary[int, Callable] = {}
## Seconds to wait after mark_dirty() before writing (several changes become one write).
var autosave_delay := 1.0

var status := Status.NOT_LOADED
## How many times this save has been written (helps cloud sync pick the newest later).
var revision := 0

var _sections: Dictionary = {}
var _dirty := false
var _dirty_for := 0.0


func _init() -> void:
	migrations = SaveMigrations.all()


func _ready() -> void:
	if storage == null:
		storage = FileStorage.new()
	load_game()


func _process(delta: float) -> void:
	if not _dirty:
		return
	_dirty_for += delta
	if _dirty_for >= autosave_delay:
		save_now()


func _notification(what: int) -> void:
	if what in [NOTIFICATION_APPLICATION_PAUSED, NOTIFICATION_WM_CLOSE_REQUEST, NOTIFICATION_PREDELETE]:
		if _dirty and storage != null:
			save_now()


## The named section, created empty if it is not there yet. Change it in place, then mark_dirty().
func section(section_name: StringName) -> Dictionary:
	var key := String(section_name)
	if not _sections.has(key) or not _sections[key] is Dictionary:
		_sections[key] = {}
	return _sections[key]


func has_section(section_name: StringName) -> bool:
	return _sections.has(String(section_name))


## Ask for the save to be written soon.
func mark_dirty() -> void:
	if not _dirty:
		_dirty_for = 0.0
	_dirty = true


## True if the game may write the save (false when the file came from a newer game version).
func can_write() -> bool:
	return status in [Status.FRESH, Status.LOADED, Status.FROM_BACKUP]


## Write the save right now. Returns true if it reached storage.
func save_now() -> bool:
	_dirty = false
	if not can_write():
		return false
	revision += 1
	var envelope := {
		"version": current_version,
		"revision": revision,
		"saved_at": int(Time.get_unix_time_from_system()),
		"data": _sections,
	}
	if not storage.write_text(TEMP, JSON.stringify(envelope)):
		push_warning("Save: could not write the save file; will try again")
		_dirty = true
		_dirty_for = 0.0
		return false
	if storage.exists(FILE):
		storage.rename(FILE, BACKUP)
	if not storage.rename(TEMP, FILE):
		push_warning("Save: could not swap in the new save file")
		_dirty = true
		return false
	written.emit()
	return true


## Read the save from storage (main file, then the backup). Starts a fresh town if neither works.
func load_game() -> Status:
	_dirty = false
	for file_name: String in [FILE, BACKUP]:
		var text := storage.read_text(file_name)
		var envelope := _parse(text)
		if envelope.is_empty():
			if not text.is_empty():
				push_warning("Save: %s is unreadable; keeping a copy and trying the next file" % file_name)
				storage.write_text("save.unreadable.json", text)
			continue
		var version := int(envelope["version"])
		if version > current_version:
			push_warning("Save: this town was saved by a newer version of the game; not touching it")
			return _finish_load({}, Status.TOO_NEW)
		var data: Dictionary = envelope["data"]
		if version < current_version:
			storage.write_text("save.before_v%d.json" % (version + 1), text)
			var upgraded := migrate(data, version)
			if upgraded.is_empty() and not data.is_empty():
				return _finish_load({}, Status.CANNOT_UPGRADE)
			data = upgraded
			_dirty = true
		revision = int(envelope.get("revision", 0))
		return _finish_load(data, Status.LOADED if file_name == FILE else Status.FROM_BACKUP)
	revision = 0
	return _finish_load({}, Status.FRESH)


func _finish_load(data: Dictionary, new_status: Status) -> Status:
	_sections = data
	status = new_status
	if not can_write():
		_dirty = false
	loaded.emit()
	return status


## Run every migration from from_version up to current_version. Returns {} if one is missing.
func migrate(data: Dictionary, from_version: int) -> Dictionary:
	var out := data.duplicate(true)
	for v in range(from_version, current_version):
		if not migrations.has(v):
			push_error("Save: no migration from version %d to %d" % [v, v + 1])
			return {}
		out = migrations[v].call(out)
	return out


## Throw the town away and start fresh (account deletion). Removes every save file.
func wipe() -> void:
	for file_name: String in [FILE, BACKUP, TEMP]:
		storage.remove(file_name)
	_sections = {}
	revision = 0
	_dirty = false
	status = Status.FRESH


func _parse(text: String) -> Dictionary:
	if text.is_empty():
		return {}
	var json := JSON.new()
	if json.parse(text) != OK:
		return {}
	var v: Variant = json.data
	if not v is Dictionary:
		return {}
	var d: Dictionary = v
	if not (d.get("version") is float or d.get("version") is int) or not d.get("data") is Dictionary:
		return {}
	return d
