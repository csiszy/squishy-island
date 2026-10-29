extends GutTest
## Settings page: memory under 3 GB = Low, 3-5 GB = Medium, 6 GB or more = High; under 6 cores caps at Medium.


func test_memory_picks_the_tier() -> void:
	assert_eq(GraphicsTier.from_hardware(1.9, 8), GraphicsTier.LOW, "2 GB phone")
	assert_eq(GraphicsTier.from_hardware(2.8, 8), GraphicsTier.MEDIUM, "3 GB phone (reports a bit less)")
	assert_eq(GraphicsTier.from_hardware(3.7, 8), GraphicsTier.MEDIUM, "4 GB phone")
	assert_eq(GraphicsTier.from_hardware(4.0, 8), GraphicsTier.MEDIUM, "exactly 4")
	assert_eq(GraphicsTier.from_hardware(5.5, 8), GraphicsTier.HIGH, "6 GB phone")
	assert_eq(GraphicsTier.from_hardware(11.2, 8), GraphicsTier.HIGH, "12 GB phone")


func test_few_cores_cap_at_medium() -> void:
	assert_eq(GraphicsTier.from_hardware(8.0, 4), GraphicsTier.MEDIUM)
	assert_eq(GraphicsTier.from_hardware(8.0, 6), GraphicsTier.HIGH)
	assert_eq(GraphicsTier.from_hardware(1.9, 4), GraphicsTier.LOW)


func test_unknown_memory_is_low() -> void:
	assert_eq(GraphicsTier.from_hardware(0.0, 8), GraphicsTier.LOW)
