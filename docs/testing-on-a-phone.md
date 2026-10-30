# Testing the game on an Android phone

Every change pushed to GitHub builds the game automatically (GitHub → **Actions** tab → the latest **CI** run).
Each run makes two files:

| File | What it is for |
|---|---|
| `squishy-island-apk` (an `.apk`) | **Install it straight onto a phone** to try the game. Use this one now. |
| `squishy-island-aab` (an `.aab`) | The format Google Play wants. Used later for the internal testing track. |

They are kept for 14 days.

## Install the .apk (about 2 minutes)

1. On the phone, sign in to GitHub in the browser and open the repository's **Releases** → **Test build (newest)**
   (always the latest build), then tap **squishy-island.apk**. It downloads as a plain `.apk`.
   (Also possible: the `squishy-island-apk` download on a CI run page, which arrives as a `.zip`: tap it in the
   **Files** app and choose **Extract** first; or copy the file over by email, Google Drive or a USB cable.)
2. Android asks for permission to install apps from that place (Chrome, Files, Drive…): allow it. This is normal for
   test builds that don't come from the Play Store. You can switch the permission off again afterwards.
3. Tap **Install**. If Play Protect warns that it doesn't know the app, choose **Install anyway**: it is our own test
   build, signed with a test key.
4. Open **Squishy Island** from the app list.

Later test builds install **over** the old one and keep your town (they share one test key). If Android ever says the
app "conflicts with an existing package", uninstall the old one first (this deletes the test town).

## What to try (Step 3: all ten minigames)

- Every building's game now works: open them from the map or the pink **Games** button. New since last time:
  **Grow Grow Garden** (Greenhouse), **Style Studio** (Salon), **Bucket Brigade** (Fire Station, levels),
  **Squish Breaker** (Arcade, levels), **Lost & Found** (Police, match-3 levels), **Squeak Beat** (Squeak Stage,
  30 songs) and the **Squish Lab** (a toy, no coins).
- Level games: the level picker on the start card, stars, Next level / Try again.
- **Squeak Beat**: sound on! Do taps feel in time with the music? (The game learns your phone's delay from your
  taps; tell us if the first song feels off and later ones better.) Track 2 opens at 3 stars.
- **Squish Lab**: pull, poke, throw and drop your squishy; more tools open as the Lab building levels up (build it
  with coins first). Is it smooth on your phone, or does it stutter?

## What to try (Step 2: the minigames)

- Tap **Bounce Park**, **Squish Bistro** or the **Post Office** on the map, then **Play**, or use the pink
  **Games** button (bottom left of the map) to see every game in one place.
- The start card: how to play, how coins work, your best score, and which squishy plays (**Change** once you own
  more than one).
- During a game: the pause button at the top (or the phone's back button): sound / music switches, keep playing,
  or **Finish here** (you still get your coins).
- When you lose: **Keep going?** offers a pretend ad once (8 seconds, closable after 5 = no reward).
- The results card: numbers count up, coins go into the jar, "New best score!", and what the building needs next.
- Good scores unlock building upgrades (with the new confetti!).
- Please note: are the controls comfortable on a real screen? Too hard, too easy? How many coins per minute feel
  right?

## What to try (Step 1)

- The map: drag, pinch to zoom, the − / + / ⛶ buttons, tap buildings and bubbles.
- **DEV** button (top middle, test builds only): adds coins, because minigames (which earn coins) come in Step 2.
  It can also start a fresh town.
- Fix up the Dumpling Steamhouse (map card or inside the house), buy decor in the room, open boxes in the Factory,
  the collection book (📖 button) and the Spare Shelf.

Please note how it **feels**: is it smooth or jerky on the map, does anything look wrong, too small to tap, too slow?
A cheap or older phone is the most useful test.

## Later: Google Play internal testing

Once the Play Console account, the app's package name and the upload key exist (see `docs/decisions.md` §14),
builds can go to Google Play's internal testing track. Testers then install from the Play Store app like any other
app and get updates automatically.
