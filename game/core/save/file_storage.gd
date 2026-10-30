class_name FileStorage
extends Storage
## Real storage: files in the game's private folder on the phone (user://).

var root: String


func _init(root_dir: String = "user://") -> void:
	root = root_dir if root_dir.ends_with("/") else root_dir + "/"
	DirAccess.make_dir_recursive_absolute(root)


func read_text(file_name: String) -> String:
	if not exists(file_name):
		return ""
	return FileAccess.get_file_as_string(root + file_name)


func exists(file_name: String) -> bool:
	return FileAccess.file_exists(root + file_name)


func write_text(file_name: String, text: String) -> bool:
	var f := FileAccess.open(root + file_name, FileAccess.WRITE)
	if f == null:
		push_warning("FileStorage: cannot write %s (%s)" % [file_name, error_string(FileAccess.get_open_error())])
		return false
	f.store_string(text)
	var ok := f.get_error() == OK
	f.close()
	return ok


func rename(from_name: String, to_name: String) -> bool:
	if exists(to_name):
		DirAccess.remove_absolute(root + to_name)
	return DirAccess.rename_absolute(root + from_name, root + to_name) == OK


func remove(file_name: String) -> bool:
	if not exists(file_name):
		return true
	return DirAccess.remove_absolute(root + file_name) == OK
