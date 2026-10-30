class_name MinigameResult
extends RefCounted
## What a minigame gives back when a run ends (contract v1). The host turns it into coins using the manifest's
## coin rule, so the game never needs to know about coins.

## The run's main number (points, metres high, ...). Never negative.
var score := 0
## A second number the manifest can use for coins or a building goal (coins grabbed, letters sorted, ...).
var metric := 0
## For level games: was the level beaten?
var won := false
## For level games: which level was played (0 for endless games).
var level := 0
## For level games: 0-3 stars.
var stars := 0
## How long the run lasted (the server checks coins per minute against this).
var seconds_played := 0.0


static func make(score_value: int, metric_value: int, seconds: float) -> MinigameResult:
	var r := MinigameResult.new()
	r.score = score_value
	r.metric = metric_value
	r.seconds_played = seconds
	return r


## Does it make sense? (The contract test checks every result with this.)
func is_valid() -> bool:
	return score >= 0 and metric >= 0 and stars >= 0 and stars <= 3 and level >= 0 and seconds_played >= 0.0


func to_dict() -> Dictionary:
	return {"score": score, "metric": metric, "won": won, "level": level, "stars": stars, "seconds_played": seconds_played}
