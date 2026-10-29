class_name Vibrator
extends RefCounted
## Makes the phone buzz. This base class is the real version; FakeVibrator records buzzes for tests.


func vibrate(duration_ms: int, amplitude: float) -> void:
	Input.vibrate_handheld(duration_ms, amplitude)
