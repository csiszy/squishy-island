class_name Storage
extends RefCounted
## Where small text files (save game, settings) are kept.
##
## This is the interface: FileStorage writes real files on the phone,
## MemoryStorage keeps them in memory for tests.


## Returns the file's text, or an empty string if it does not exist.
func read_text(_file_name: String) -> String:
	return ""


## Returns true if the file exists.
func exists(_file_name: String) -> bool:
	return false


## Writes the whole file. Returns true on success.
func write_text(_file_name: String, _text: String) -> bool:
	return false


## Renames a file, replacing the target if it exists. Returns true on success.
func rename(_from_name: String, _to_name: String) -> bool:
	return false


## Deletes a file. Returns true if it is gone afterwards.
func remove(_file_name: String) -> bool:
	return true
