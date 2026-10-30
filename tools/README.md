# Tools

Everything that turns the design book into game files, and the checks that keep the game honest.
The design book (`docs/design-book/`) is the source; `game/data`, `game/audio` and `game/art` are generated from it.
Never edit generated files by hand: change the book, then run the export again.

## Setup (once)

```bash
cd tools && npm ci && npx playwright install chromium
```

Needs Node 18+ and Python 3. three.js comes from `tools/node_modules` (pinned to the book's version 0.149.0),
so the exports never need the internet.

## Exports: design book → game

| Command | Reads | Writes | CI |
|---|---|---|---|
| `node tools/export_data/export_data.js` | `art/*.js` (squishies, buildings, level costs), building pages (level captions, decor), `art/economy.js`, the CITY block in `index.html`, `art/sound.js`, `docs/strings_ui_en.csv` | `game/data/*.json`, `game/data/strings_en.csv` | `--check` fails if out of date |
| `node tools/export_audio/export_audio.js` | `assets/audio/` | `game/audio/` | `--check` fails if out of date |
| `node tools/export_art/export_art.js [ids…]` | every building's `model()`, every squishy, the island (`art/city3d.js` + the CITY block), each squishy's spot by its house (`idle3`), rooms and decor (`interior`, all 4 designs), the Factory boxes, fun-building icons | `game/art/models/{buildings,squishies,island,life,rooms,boxes}/`, `game/art/sprites/{squishies,badges}/`, `game/art/life.json`, `game/art/art_index.json` | – |
| `node tools/render_squeak_beat.js [n \| charts \| notes]` (needs ffmpeg) | the Squeak Beat prototype `docs/design-book/play/squeak-beat.html` (its own band, rendered offline) | `game/minigames/squeak_beat/charts.json`, `songs/track_NN.ogg`, `notes/<voice>_<pitch>[_hold].ogg` (all 30 songs take about 25 minutes) | – |

The data export also checks that the book agrees with itself (box odds add up to 100, decor design prices,
Gem prices) and stops with a list of problems if it does not.

Art: about 30 seconds for all ~580 files. The export is repeatable (same book → same files). In Godot,
`game/addons/squishy_art_import` gives every model the toon look (`game/art/shaders/`), the outline and its idle
animations (`game/art/runtime/idle_motion.gd`). Hand-made replacements go in `game/art/overrides/`.

To see what a model looks like in Godot (needs a display; on Linux use `xvfb-run`):

```bash
xvfb-run godot --path game --rendering-driver opengl3 --resolution 520x440 -s res://tests/visual/snap.gd -- res://art/models/buildings/dumpling/building_dumpling_L10.glb /tmp/dumpling.png
```

## Checks

```bash
python3 tools/check_boundaries.py          # the walls between minigames, features and core (also in CI)
python3 -m unittest discover -s tools/tests
game/run_tests.sh                          # every Godot test (needs Godot 4.6 as "godot", or GODOT=/path)
```

## Older helpers

`render_sprites.py` (portraits for the HTML prototypes), `render_audio.js` + `process_audio.py` (re-render the
sound pack from `art/sound.js`), `fuzz_prototypes.py`, `collection_sim.py`: see `CLAUDE.md`.
