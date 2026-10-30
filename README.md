# Squishy Island

A cosy squishy-collecting mobile game for kids aged 5–11: collect squishies, fix up a little island town,
play minigames. Android (Google Play) first.

**Status:** design complete; Step 0 (foundations) and Step 1 (the town: map, houses, Factory, collection) done; Step 2 (minigames) next. See `docs/decisions.md` for every decision
and `docs/design-book/` for the full design.

## Look at the design

```bash
cd docs/design-book
python3 -m http.server 8000
```

Then open <http://localhost:8000> in a browser. The playable minigame prototypes are in `docs/design-book/play/`
(they also work by double-clicking the HTML file).

## Repository layout

```
CLAUDE.md            instructions + context for Claude Code
docs/decisions.md    every design decision, short, with reasons
docs/design-book/    the full design: a website (spec, 3D art, sounds, prototypes)
prototypes/          source of the minigame prototypes (build with python3 prototypes/build.py)
assets/audio/        sound effects (WAV) and music loops (Ogg), owned outright
tools/               export tools (book -> game data, sound, 3D art), boundary check, helpers (see tools/README.md)
game/                the Godot 4.6 project (run game/run_tests.sh for the tests)
.github/workflows/   CI: checks, tests, Android App Bundle
server/              the Nakama game server (coming in Step 4)
```
