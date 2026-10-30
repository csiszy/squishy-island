# Making a new minigame

1. Copy this folder to `game/minigames/<new_id>/` (lower case, underscores).
2. In `manifest.json`: set `"id"` to the folder name, the `"building"` it belongs to, the coin rule, the goal,
   helpers (`perks`) and `"enabled": true`. Rename the keys in `strings_en.csv` to start with the new id.
3. Write the gameplay in the game script (it extends `KitGame` from `minigame_kit/v1`; see that file's notes for
   how prototype code maps onto it). Draw in the 360 x 640 space; the host scales it to the phone.
4. Teach `bot.gd` to play (the contract test plays every game with its bot for two minutes).
5. Open `harness.tscn` in Godot and press F6 to play it alone. Run `game/run_tests.sh`.

A game may only use its own folder, `minigame_api/` and `minigame_kit/v1/` (`tools/check_boundaries.py`).
It never sees coins, saves, ads or the server: it reports a `MinigameResult` and the host does the rest.
The game appears on its building's card in town automatically.
