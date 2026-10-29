class_name GraphicsTier
extends RefCounted
## Picks Low / Medium / High for an unknown phone (Settings page, "Picking the right quality automatically").
##
## Memory under 3 GB = Low, 3-5 GB = Medium, 6 GB or more = High; fewer than 6 CPU cores caps it at Medium.
## The 3-second frame-time check and the known-phone list come in Step 6.

const LOW := &"low"
const MEDIUM := &"medium"
const HIGH := &"high"
const ALL: Array[StringName] = [LOW, MEDIUM, HIGH]


static func from_hardware(memory_gb: float, cores: int) -> StringName:
	# Phones report a bit less than the size on the box (a "6 GB" phone says about 5.5),
	# so round up before comparing.
	var gb := ceili(memory_gb - 0.05)
	var tier := LOW if gb < 3 else (MEDIUM if gb < 6 else HIGH)
	if cores < 6 and tier == HIGH:
		tier = MEDIUM
	return tier


static func from_device(device: DeviceInfo) -> StringName:
	return from_hardware(device.memory_gb(), device.cpu_cores())
