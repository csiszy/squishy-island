# minigame_kit v1: optional helpers for minigames

Frozen: only bug fixes. New helpers go into `minigame_kit/v2/`, so a game that works today keeps working.
Games may use this folder and `minigame_api/`, nothing else.

| File | What it gives a game |
|---|---|
| `kit_game.gd` | `KitGame`: the prototypes' shared engine in Godot (run state, "keep going?" once, touch/mouse/keys in the game's own 360 x 640 space, floating text, bursts, shake, and the drawing helpers `rr`, `circle`, `text`, `sprite`, `heart`, `hearts`, `coin`, `bar`, `star`, ...) |
| `kit_tone.gd` | `KitTone`: the prototypes' synthesised blips and noise bursts as sounds |
| `harness.gd` | Play a game alone with a pretend host (each game's `harness.tscn`) |
