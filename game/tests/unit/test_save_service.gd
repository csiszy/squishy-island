extends GutTest
## The save file: fresh start, round trip, backups, version upgrades, never overwriting a newer town.

var storage: MemoryStorage
var save: SaveService


func before_each() -> void:
	storage = MemoryStorage.new()
	save = _new_save()


func _new_save(version := SaveService.CURRENT_VERSION, migrations: Dictionary[int, Callable] = {}) -> SaveService:
	var s: SaveService = autofree(SaveService.new())
	s.storage = storage
	s.current_version = version
	if not migrations.is_empty():
		s.migrations = migrations
	return s


func _envelope(version: int, data: Dictionary) -> String:
	return JSON.stringify({"version": version, "revision": 4, "saved_at": 0, "data": data})


func test_first_launch_starts_a_fresh_town() -> void:
	assert_eq(save.load_game(), SaveService.Status.FRESH)
	assert_false(save.has_section(&"town"))
	assert_true(save.can_write())


func test_saved_town_comes_back_the_same() -> void:
	save.load_game()
	save.section(&"town")["houses_fixed"] = 3
	save.section(&"wallet")["coins"] = 1240
	assert_true(save.save_now())

	var again := _new_save()
	assert_eq(again.load_game(), SaveService.Status.LOADED)
	assert_eq(int(again.section(&"town")["houses_fixed"]), 3)
	assert_eq(int(again.section(&"wallet")["coins"]), 1240)
	assert_eq(again.revision, 1)


func test_each_save_keeps_the_previous_one_as_backup() -> void:
	save.load_game()
	save.section(&"town")["n"] = 1
	save.save_now()
	save.section(&"town")["n"] = 2
	save.save_now()
	assert_true(storage.exists(SaveService.BACKUP))
	assert_false(storage.exists(SaveService.TEMP))
	var backup: Dictionary = JSON.parse_string(storage.read_text(SaveService.BACKUP))
	assert_eq(int(backup["data"]["town"]["n"]), 1)


func test_broken_main_file_falls_back_to_the_backup() -> void:
	storage.files[SaveService.FILE] = "{ this is not json"
	storage.files[SaveService.BACKUP] = _envelope(SaveService.CURRENT_VERSION, {"town": {"n": 7}})
	assert_eq(save.load_game(), SaveService.Status.FROM_BACKUP)
	assert_eq(int(save.section(&"town")["n"]), 7)
	assert_true(storage.exists("save.unreadable.json"), "a copy of the broken file is kept for support")


func test_both_files_broken_starts_fresh_but_keeps_a_copy() -> void:
	storage.files[SaveService.FILE] = "garbage"
	storage.files[SaveService.BACKUP] = "[1, 2]"
	assert_eq(save.load_game(), SaveService.Status.FRESH)
	assert_true(storage.exists("save.unreadable.json"))


func test_a_crash_mid_write_never_loses_the_town() -> void:
	# The temp file was written but the swap never happened: the old main file must still load.
	storage.files[SaveService.FILE] = _envelope(SaveService.CURRENT_VERSION, {"town": {"n": 5}})
	storage.files[SaveService.TEMP] = "{ half writ"
	assert_eq(save.load_game(), SaveService.Status.LOADED)
	assert_eq(int(save.section(&"town")["n"]), 5)


func test_a_town_from_a_newer_game_is_never_overwritten() -> void:
	var newer := _envelope(SaveService.CURRENT_VERSION + 1, {"town": {"n": 9}})
	storage.files[SaveService.FILE] = newer
	assert_eq(save.load_game(), SaveService.Status.TOO_NEW)
	assert_false(save.can_write())
	save.mark_dirty()
	assert_false(save.save_now())
	assert_eq(storage.files[SaveService.FILE], newer)


func test_old_saves_are_upgraded_step_by_step_and_the_original_is_kept() -> void:
	var to_v2 := func(d: Dictionary) -> Dictionary:
		d["wallet"] = {"coins": int(d["town"].get("coins", 0))}
		(d["town"] as Dictionary).erase("coins")
		return d
	var to_v3 := func(d: Dictionary) -> Dictionary:
		d["wallet"]["stars"] = 0
		return d
	var original := _envelope(1, {"town": {"coins": 500}})
	storage.files[SaveService.FILE] = original
	var s := _new_save(3, {1: to_v2, 2: to_v3})
	assert_eq(s.load_game(), SaveService.Status.LOADED)
	assert_eq(int(s.section(&"wallet")["coins"]), 500)
	assert_eq(int(s.section(&"wallet")["stars"]), 0)
	assert_false((s.section(&"town") as Dictionary).has("coins"))
	assert_eq(storage.files["save.before_v2.json"], original)
	s._process(s.autosave_delay + 0.1)
	var written: Dictionary = JSON.parse_string(storage.read_text(SaveService.FILE))
	assert_eq(int(written["version"]), 3, "the upgraded town is written back")


func test_a_missing_upgrade_step_refuses_to_touch_the_town() -> void:
	var original := _envelope(1, {"town": {"n": 1}})
	storage.files[SaveService.FILE] = original
	var s := _new_save(3, {1: func(d: Dictionary) -> Dictionary: return d})
	assert_eq(s.load_game(), SaveService.Status.CANNOT_UPGRADE)
	assert_push_error("no migration from version 2 to 3")
	assert_false(s.save_now())
	assert_eq(storage.files[SaveService.FILE], original)


func test_every_save_version_has_an_upgrade_step() -> void:
	var known := SaveMigrations.all()
	if SaveService.CURRENT_VERSION == 1:
		pass_test("version 1 is the first format: nothing to upgrade yet")
	for v in range(1, SaveService.CURRENT_VERSION):
		assert_true(known.has(v), "migration from version %d to %d" % [v, v + 1])


func test_changes_are_written_after_a_short_wait() -> void:
	save.load_game()
	save.section(&"town")["n"] = 1
	save.mark_dirty()
	save._process(save.autosave_delay * 0.5)
	assert_false(storage.exists(SaveService.FILE), "not yet")
	save._process(save.autosave_delay * 0.6)
	assert_true(storage.exists(SaveService.FILE))


func test_a_full_phone_keeps_trying() -> void:
	save.load_game()
	storage.fail_writes = true
	save.mark_dirty()
	assert_false(save.save_now())
	storage.fail_writes = false
	save._process(save.autosave_delay + 0.1)
	assert_true(storage.exists(SaveService.FILE))


func test_wipe_removes_every_save_file() -> void:
	save.load_game()
	save.section(&"town")["n"] = 1
	save.save_now()
	save.save_now()
	save.wipe()
	assert_false(storage.exists(SaveService.FILE))
	assert_false(storage.exists(SaveService.BACKUP))
	assert_false(save.has_section(&"town"))


func test_real_files_round_trip() -> void:
	var dir := "user://test_save_%d/" % Time.get_ticks_usec()
	var s: SaveService = autofree(SaveService.new())
	s.storage = FileStorage.new(dir)
	s.load_game()
	s.section(&"town")["n"] = 42
	assert_true(s.save_now())
	assert_true(s.save_now())
	var again: SaveService = autofree(SaveService.new())
	again.storage = FileStorage.new(dir)
	assert_eq(again.load_game(), SaveService.Status.LOADED)
	assert_eq(int(again.section(&"town")["n"]), 42)
	again.wipe()
	DirAccess.remove_absolute(dir)
