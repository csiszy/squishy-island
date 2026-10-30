# Squishy Island's game server

The server decides what must not be cheated: box rolls, the Spare Shelf, Squish Stars and Gems, and it checks the
coins from minigames (build.html, "What lives where"). It is [Nakama](https://heroiclabs.com/nakama/) (free, open
source) with a PostgreSQL database, both in Docker, plus our own rules in `src/` (TypeScript).

The game works without it too: test builds start with a **pretend server** inside the phone. You switch a test
build over to a real server in the DEV menu.

## Run it on your own laptop (for testing)

You need **Docker Desktop** (free for personal use): https://www.docker.com/products/docker-desktop/ — install it,
start it once and leave it running (the whale icon). Works on Windows, Mac and Linux.

1. Get this repository onto the laptop: on GitHub, **Code → Download ZIP** (branch `claude/modest-sagan-ov4oyd`),
   and unzip it. (Or `git clone` it.)
2. Open the `server` folder and start it:
   - **Windows:** double-click `start-server.bat`
   - **Mac / Linux:** run `./start-server.sh` in a terminal
   The first start downloads Nakama and PostgreSQL (about 150 MB) and takes a minute or two. It then shows the
   laptop's address, something like `192.168.1.20`.
3. On the phone (test build, same Wi-Fi as the laptop): tap **DEV → More… → Server…**, type the address and tap
   **Connect**. "Connected!" means the phone now plays with your laptop's server.
4. To stop the server: `stop-server.bat` / `./stop-server.sh`. Everything it saved stays for the next start.

If the phone says "Not found":
- the phone and laptop must be on the **same Wi-Fi** (not the phone's mobile data, not a guest network);
- **Windows** may ask whether Docker may use the network the first time: allow it (private networks);
- the address changes now and then (your router hands them out): check it again with the start script.

**Looking inside:** http://localhost:7351 on the laptop (user `admin`, password `squishy-local`) shows every
account and its saved state (Storage → collection `island`).

**Starting over:** `docker compose down -v` deletes the server's database (every account and save).

The phone keeps its coins and town on the phone; squishies, Stars and boxes live on the server. Switching back to
the pretend server (DEV → More… → Server… → Use the pretend one) brings back the phone's own pretend collection.

## Changing things live (quests, rewards, special days)

Open `server/live/live-config.json` in any text editor (Notepad is fine), change it, save. The server reads it
every time it makes a day's quests, so changes apply from the next day's quests (today's are already made), with
no restart and no app update. Only what you write in the file changes; everything else follows the design book.
Keys starting with `_` are notes and examples, which the server ignores: to use an example, copy it without the `_`.

- **Numbers**: `coinQuestReward` (coins per quest, 40), `coinQuests` (how many a day, 2), `firstRunMultiplier`
  (the day's first game, 2 = double), `challengeEnabled` (true/false), `challengeGems` (3), `challengeOfBest`
  (0.9 = 90% of the player's best), `streakDays` (5) and `streakGems` (15).
- **A special day**: under `"schedule"`, a date (`"2026-12-24"`) with its own `"quests"` (they replace that day's
  coin quests) and/or `"challenge"` (that day's Gem Challenge game, if the player has built it).
- **The quest list** (`questPool`): the quests the server picks from each day. Each one has an `id` (any short
  name), a `kind` (`runs` = play a game n times, `metric` = reach a total of a game's own count such as flowers or
  letters, `boxes` = open n boxes), a `game` (a game's id like `sky_bounce`, `any`, or `pick` = one the server picks
  from the player's games), a `target` (n), a `weight` (how often it comes up), a `reward` (optional: coins) and a
  `text`. Write the text in plain English with `{n}` for the target and `{game}` for the game's name; for example
  `"Play {game} {n} times"`. (The book's own quests use word keys like `quest.play_any`, for translations later.)

Game ids: `sky_bounce`, `bistro_rush`, `sort_a_lot`, `grow_grow_garden`, `style_studio`, `bucket_brigade`,
`squish_breaker`, `lost_and_found`, `squeak_beat`, `squish_lab`. A quest only appears for players who have built
its game. If the file has a mistake (a missing comma), the server ignores it and keeps the book's numbers, so a
typo never stops the game; the server log then says what is wrong.

## The live server (later, when the game goes out)

The same Docker setup runs on a small EU server (about €5–10 a month, e.g. Hetzner in Germany or Finland), with
three changes: a secret `server_key` and console password (not the ones in `nakama.yml`), HTTPS in front of it
(a web address like `island.example.eu`), and nightly off-site backups of the database. Store builds will then use
that address; nobody types anything. This is set up when going live.

## For programmers

- `src/rules.ts`: the rules (the same as the game's pretend server, `game/core/server/fake_game_server.gd`).
- `src/main.ts`: the RPCs the game calls (`game/core/server/nakama_game_server.gd`) and the saved state.
- `tools/make_data.js`: copies the game's numbers from `game/data` (made from the design book).
- `build/index.js`: what Nakama runs, compiled by `npm run build` and kept in the repository so the server
  needs nothing but Docker (CI checks it is up to date).
- Tests: `npm ci && npm test` (rules, no Nakama needed); with the server running, `npm run test:live` (over the
  network) and `SQUISHY_SERVER=http://127.0.0.1:7350 game/run_tests.sh` (the game's own code against it).
