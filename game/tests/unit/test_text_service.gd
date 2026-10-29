extends GutTest
## The string table: words come from data/strings_en.csv, placeholders are filled, missing keys show.

var text: TextService


func before_each() -> void:
	text = autofree(TextService.new())


func test_words_come_from_the_string_table() -> void:
	assert_eq(text.t(&"app.title"), "Squishy Island")
	assert_eq(text.t(&"squishy.bao.name"), "Bao Bun")


func test_placeholders_are_filled() -> void:
	assert_eq(text.t(&"ui.coins_earned", {"n": 35}), "+35 coins")


func test_a_missing_key_shows_itself() -> void:
	assert_false(text.has(&"no.such.key"))
	assert_eq(text.t(&"no.such.key"), "no.such.key")
	assert_has(text.missing_keys(), &"no.such.key")
