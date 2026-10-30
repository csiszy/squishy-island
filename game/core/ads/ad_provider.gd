class_name AdProvider
extends RefCounted
## Where rewarded ads come from. This is the interface: FakeAdProvider pretends (now, and in tests); the real
## child-directed AdMob one comes in Step 5. Only rewarded ads exist in this game, always chosen by the player.


func is_ready() -> bool:
	return false


## Show one rewarded ad. true = watched to the end (give the reward); false = closed early or failed.
func show_rewarded(_placement: StringName) -> bool:
	return false
