class_name FakeDevice
extends DeviceInfo
## A pretend phone for tests: set the fields to whatever the test needs.

var memory := 4.0
var cores := 8
var reduced_motion := false
var large_text := false
var vibrator := true
var model := "Test Phone"


func memory_gb() -> float:
	return memory


func cpu_cores() -> int:
	return cores


func prefers_reduced_motion() -> bool:
	return reduced_motion


func prefers_large_text() -> bool:
	return large_text


func can_vibrate() -> bool:
	return vibrator


func model_name() -> String:
	return model
