class_name SaveMigrations
extends RefCounted
## Every change to the save format, oldest first.
##
## When SaveService.CURRENT_VERSION goes from n to n+1, add an entry n here with a function
## that turns version-n data into version-(n+1) data, and a test in tests/unit/test_save_migrations.gd
## that loads a real version-n save and checks the result. Never edit an old migration.


static func all() -> Dictionary[int, Callable]:
	return {
		# 1: _v1_to_v2,
	}
