class_name DeviceInfo
extends RefCounted
## What the game needs to know about the phone it runs on.
##
## This base class is the real version (asks Godot / the OS). FakeDevice is the test version.


## Total memory in GB, as the phone reports it (usually a little under the advertised size).
func memory_gb() -> float:
	var info := OS.get_memory_info()
	return float(info.get("physical", 0)) / (1024.0 * 1024.0 * 1024.0)


func cpu_cores() -> int:
	return OS.get_processor_count()


## The phone's "reduce motion" / "remove animations" accessibility setting.
## Godot cannot read it on Android yet; the Android plugin (Step 6) will fill this in.
func prefers_reduced_motion() -> bool:
	return false


## The phone's large-text accessibility setting (Android plugin, Step 6).
func prefers_large_text() -> bool:
	return false


func can_vibrate() -> bool:
	return OS.has_feature("mobile")


## The phone model, e.g. "Pixel 8", used to look up its graphics tier in a list (Step 6).
func model_name() -> String:
	return OS.get_model_name()
