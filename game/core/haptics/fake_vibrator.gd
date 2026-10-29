class_name FakeVibrator
extends Vibrator
## Pretend vibration motor: remembers every buzz as [duration_ms, amplitude].

var buzzes: Array[Array] = []


func vibrate(duration_ms: int, amplitude: float) -> void:
	buzzes.append([duration_ms, amplitude])


func durations() -> Array[int]:
	var out: Array[int] = []
	for b: Array in buzzes:
		out.append(b[0])
	return out
