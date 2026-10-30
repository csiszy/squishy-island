class_name MemoryStorage
extends Storage
## Fake storage for tests: files live in a dictionary and vanish afterwards.
## Set fail_writes to pretend the phone's storage is full.

var files: Dictionary[String, String] = {}
var fail_writes := false
var write_count := 0


func read_text(file_name: String) -> String:
	return files.get(file_name, "")


func exists(file_name: String) -> bool:
	return files.has(file_name)


func write_text(file_name: String, text: String) -> bool:
	if fail_writes:
		return false
	files[file_name] = text
	write_count += 1
	return true


func rename(from_name: String, to_name: String) -> bool:
	if not files.has(from_name):
		return false
	files[to_name] = files[from_name]
	files.erase(from_name)
	return true


func remove(file_name: String) -> bool:
	files.erase(file_name)
	return true
