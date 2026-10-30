# minigame_api: the minigame contract (version 1)

The only door between the game and a minigame (`docs/design-book/build.html`, "The minigame contract").

| File | What it is |
|---|---|
| `minigame.gd` | `Minigame`: what every minigame's main script extends (setup, start, pause, resume, stop, revive, advance; signals `finished`, `score_changed`) |
| `minigame_context.gd` | `MinigameContext`: the only things a game may use (sounds, buzz, random numbers, its own save box, fonts, squishy pictures, words, "keep going?") |
| `minigame_result.gd` | `MinigameResult`: what a run gives back (score, metric, won, level, stars, seconds played) |
| `minigame_manifest.gd` | `MinigameManifest`: reads and checks a game's `manifest.json` |

Rules: this folder knows nothing about the rest of the game (the boundary check enforces it). Changing anything
here means a new version (`api` 2) and every game saying which version it was built for; v1 games keep working.
