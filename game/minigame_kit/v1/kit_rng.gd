class_name KitRng
extends RefCounted
## The prototypes' tiny seeded random numbers (SQV.rng in prototypes/engine.js, a "mulberry32"), number for
## number, so level N of a puzzle game is the same level as in the design book's prototype, for everyone.
##     var r := KitRng.new(n * 4099 + 23); r.next()  -> 0.0 .. 1.0

var _a := 1


func _init(seed_value: int) -> void:
	_a = seed_value & 0xFFFFFFFF
	if _a == 0:
		_a = 1


## The next number, from 0 (included) to 1 (not included).
func next() -> float:
	_a = (_a + 0x6D2B79F5) & 0xFFFFFFFF
	var t := _imul(_a ^ (_a >> 15), 1 | _a)
	t = ((t + _imul(t ^ (t >> 7), 61 | t)) & 0xFFFFFFFF) ^ t
	return float((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0


## A whole number from 0 to n - 1.
func below(n: int) -> int:
	return int(next() * n)


## 32-bit multiply, like JavaScript's Math.imul (as unsigned).
static func _imul(x: int, y: int) -> int:
	x &= 0xFFFFFFFF
	y &= 0xFFFFFFFF
	var lo := (x & 0xFFFF) * y
	var hi := ((x >> 16) * y) & 0xFFFF
	return (lo + (hi << 16)) & 0xFFFFFFFF
