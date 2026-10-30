# CLAUDE.md: read this first

You are working on **Squishy Island** (Google Play title: *Squishy Island: Collect & Play*), a cosy squishy-collecting
mobile game for kids aged 5–11. The whole game was designed before any engine code was written; the design lives in
this repository. Your job is to build the real game from it.

## Where the knowledge is

| What | Where |
|---|---|
| Every decision, with the reasons (short) | `docs/decisions.md` (**start here**) |
| The full spec: a website with every building, minigame, rule, number, the 3D art, sounds | `docs/design-book/` (open `index.html`; serve it, see below) |
| How to build the real game: engine, architecture, folder structure, minigame contract, roadmap | `docs/design-book/build.html` |
| Store rules, EU/country rules, documents needed | `docs/design-book/legal.html` |
| Playable minigame prototypes (one HTML file each) | `docs/design-book/play/` (built from `prototypes/`) |
| Sound pack (owned outright) | `assets/audio/` |
| Helper scripts | `tools/` |

The design book is published as a claude.ai artifact too, but **the files in this repo are the source of truth**.

## Ground rules

1. **The design book is the spec.** If you change a rule, number or behaviour, update the matching design-book page
   and `docs/decisions.md` in the same change. If the book and the code disagree, ask.
2. **Minigames are sealed.** Each minigame lives in its own folder and talks to the rest of the game only through the
   versioned minigame contract (`minigame_api`). A minigame must never import anything outside its folder,
   `minigame_api/` or `minigame_kit/vN/`. Changing one minigame must never require touching another file.
3. **Data, not code, for numbers.** Prices, odds, coin rules, level costs, quest targets live in data files
   (generated from the design book) and can be overridden by the server.
4. **Kids' app rules (Google Play Families) are non-negotiable:** rewarded ads only, opted into, closable after 5 s;
   no advertising ID, no location, no third-party analytics; no free text or chat; no manipulative or guilt-based
   design (no sad squishies, no countdowns, no "buy now"); every purchase and outbound link behind the grown-up gate;
   Gems never buy random items and never convert to coins.
5. **English only for now**, but every player-facing string goes into the string table from day one.
6. Every outside service (billing, ads, server, haptics) sits behind an interface with a fake implementation,
   so the game runs and is tested on a computer without a phone, store or internet.
7. Keep changes small, tested, and explained in plain language (the owner is not a programmer).

## Tech stack (decided, see build.html)

Godot 4.6 + typed GDScript · Nakama + PostgreSQL on an EU server (Docker) · Google Play Billing Library 8+ ·
AdMob (child-directed) · GUT tests + headless Godot in GitHub Actions · art/data/sound exported from the design book.

## Status and next step

Design is complete (October 2026). **Steps 0, 1 and 2 of the roadmap are done**: the Godot project, CI, core services
with fakes, export tools and toon look (Step 0); the town (Step 1): city map, houses, the Factory, the collection book
and the Spare Shelf; the minigames (Step 2): the contract (`game/minigame_api/`), the kit (`game/minigame_kit/v1/`),
the host (start card, pause, keep going with a pretend ad, results, payout checked by the pretend server), the
template and Sky Bounce, Bistro Rush and Sort-a-Lot. **Next: Step 3** (the other seven minigames, one at a time).
Open decisions for the owner: end of `docs/decisions.md` §14, §15 and §17.

How the game is laid out: `game/core/` services are autoloads (`Events`, `Save`, `Settings`, `Text`, `Audio`,
`Haptics`, `Server`, `Economy`, `Collection`, `Town`, `Nav`); each outside-world part sits behind a small base class with a fake (`Storage`/`MemoryStorage`,
`DeviceInfo`/`FakeDevice`, `AudioOutput`/`FakeAudioOutput`, `Vibrator`/`FakeVibrator`). Player-facing words:
`Text.t(&"key")`, keys in `game/data/strings_en.csv` (generated; hand-written UI words go in `docs/strings_ui_en.csv`).
Models: `ArtLibrary.building(id, level)`, `ArtLibrary.squishy(id)`, `ArtLibrary.portrait(id)`, `.life(id)`, `.island()`.
Screens live in `game/features/<name>/` and are opened with `Nav.go(&"house", {"id": &"dumpling"})`; only
`game/app/main.gd` knows which scene each name is. Shared widgets: `game/shared_ui/` (theme, pop-ups, wallet, viewer).
Minigames: one sealed folder each in `game/minigames/` (copy `_template/`, see its README); a game extends `KitGame`
(the prototypes' engine in Godot) and only uses its folder, `minigame_api/` and `minigame_kit/v1/`; its words are in its
own `strings_en.csv`; `tests/unit/test_minigame_contract.gd` plays every game with its `bot.gd`.
Numbers and rules: `GameData` (from `game/data/`). The server's decisions go through `Server.api` (always `await`).
To look at the running game without a phone: `xvfb-run godot --path game --rendering-driver opengl3 --resolution 540x960
-s res://tests/visual/shoot.gd -- out.png go:factory` (steps listed in that file). Debug builds have a DEV button.

## Useful commands

```bash
# view the design book (needs internet for fonts and three.js from a CDN)
cd docs/design-book && python3 -m http.server 8000      # then open http://localhost:8000

# rebuild the minigame prototypes after editing prototypes/engine.js or prototypes/games/*.js
python3 prototypes/build.py            # all games
python3 prototypes/build.py sky-bounce # one game
python3 prototypes/docs.py             # refresh the minigame sections of the building pages

# the game (Godot 4.6.3 on the PATH as "godot")
game/run_tests.sh                      # every GUT test, headless
godot --path game                      # run it on a computer
python3 tools/check_boundaries.py      # the walls between minigames / features / core

# design book -> game (setup once: cd tools && npm ci && npx playwright install chromium; see tools/README.md)
node tools/export_data/export_data.js  # numbers + words -> game/data (CI runs it with --check)
node tools/export_audio/export_audio.js
node tools/export_art/export_art.js    # glTF models + portraits -> game/art

# checks / tools (need: pip install playwright && playwright install chromium)
python3 tools/fuzz_prototypes.py       # random-input smoke test of every prototype
python3 tools/render_sprites.py        # re-render squishy portraits into prototypes/sprites.json
node tools/render_audio.js && python3 tools/process_audio.py   # re-render the sound pack (serve the book on :8765 first)
python3 tools/collection_sim.py        # collection pacing simulation
```

## Design-book code map (for edits to the spec site)

- `art/kit.js`: page loader, squishy 2D drawing kit, rarity table, level-cost helpers (`SQ.COSTS`), hero/level mounts.
- `art/economy.js`: every box, collection, Gem, ad and unlock number (`SQ.ECONOMY`), read by the Factory page and the data export.
- `_tools/export.html`, `_tools/export_art.html`: pages the export tools drive (not shown to anyone).
- `art/kit3d.js`, `art/kit3d-build.js`: three.js toolkit: squishy "inflater", toon materials, outline, buildings.
- `art/<building>.js`: one per building: 3D model per level, the family's squishies (houses), room, phone mock-up.
- `art/city3d.js` + the `CITY` block in `index.html`: the island map (layout, roads, decorations), story and tour.
- `art/sound.js`: every sound effect, every song, saved settings (also inlined into each prototype).
- `art/ui.js`: grown-up gate and pop-ups.
- `prototypes/engine.js`: the shared prototype engine (host side: menus, keep-going ad, results count-up, payout);
  `prototypes/games/*.js`: one file per minigame; `prototypes/template.html`: the page shell.
