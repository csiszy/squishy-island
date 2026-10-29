# Squishy Island: decision log

Everything decided while designing the game (October 2026), in one place.
The **design book** (`docs/design-book/`, also published as a claude.ai artifact) is the full spec;
this file is the short version plus the reasons, so nobody has to re-read the whole design conversation.
When a decision changes, update the design book page **and** this file in the same change.

---

## 1. The game in one paragraph

**Squishy Island** (Google Play title: *Squishy Island: Collect & Play*) is a cosy collecting game for kids aged
about 5–11. Players collect squishies, fix up a run-down little island town one house at a time, and play short
minigames in its fun buildings to earn coins. The home screen is a cartoon 3D map of the island seen from above
(drag, pinch, tap). English only at launch. Android (Google Play) first.

- Old working name *Squishville* was dropped: it is a Squishmallows (Jazwares) toy line. Names starting with
  "Squish-" (Squishtown, Squishland, Squish Island) were rejected as too close to Squishmallows or to existing
  brands (SqwishLand, Squishyland). "Squishy" is a generic word: safe to use, hard to own. **To do:** trademark
  search (EU, HU, US) by a lawyer; consider registering name + logo.

## 2. Core loop and economy  → `guide.html`

- Loop: play a minigame → earn coins → buy boxes / fix houses / decor → city comes alive → bonuses help you play better.
- **Every minigame pays about 35 coins per minute** of good play (the main balancing rule). Each game's coin
  rule is in the guide's economy table; milestone bonus +10 / +25 / +50 (only the highest counts).
- Level games (Lost & Found, Bucket Brigade, Squish Breaker): first clear 30 + 15 per star (every 10th level ×2),
  replays 10 + 15 per new star, nothing for a loss.
- Squeak Beat: about 40 coins per minute of song × accuracy.
- Squish Lab pays nothing on purpose (it is a toy).
- Mystery Box **200**, Family Box **500** (choose the family), Golden Box **1,000** (no Commons).
- Odds (Mystery/Family): Common 55 · Uncommon 25 · Rare 13 · Epic 6 · Legendary 1 (%). Golden: 0/50/30/16/4.
- **Rare guarantee:** 10th box without Rare+ is always Rare+. Odds are shown before every box.
- 8 families × 6 squishies = **48 squishies** (2 C, 1 U, 1 R, 1 E, 1 L each). New 6-squishy families can be added
  over time (seasonal) to reach 70+.
- Houses: levels 1–10 (100 coins at L2 … 2,500 at L10, more for later houses); some levels need family squishies.
  Fun buildings: levels 0–10, upgrades need a best score (or levels beaten), then coins.

## 3. Currencies

| Currency | From | Buys |
|---|---|---|
| Coins | minigames | boxes, houses, buildings, decor |
| Squish Stars | swapping spares | Star Shop (missing Common/Uncommon, special decor) |
| **Squish Gems** (premium) | daily Gem Challenge (3), weekly streak (+15 for 5 days), achievements; or real money in the Gem Mine | Gem Shop: any Legendary 300, two exclusives 500 (Prism Mochi, Starlight Bun) |

- About 30 Gems/week for a regular player → a Legendary every 2–3 months without paying.
- **Gems never buy anything random, never convert to/from coins**, exclusives can't be traded.
- "Ask before spending Gems" pop-up on by default; turning it off needs the grown-up gate.

## 4. Collection pacing  → `guide.html#collection`

- **Every box wins:** a new squishy moves in; a duplicate goes onto the **Spare Shelf**, where the player chooses:
  level up that squishy, trade it at the Market, or swap it for Squish Stars.
- Squishy levels 1–5; spares per level: C/U 1/2/3/4, R/E 1/1/2/2, L 1/1/1/1. Level 5 = **Sparkly**.
  1 box in 50 is Sparkly anyway.
- Simulated (30 min/day, half the coins on boxes, 3 free ad boxes): 50% of the collection in about a week,
  90% in about 3 months, all 48 in about 11 months, everything Sparkly in about 3 years.
- Only **spares** can be traded; the squishy living in your house never leaves.

## 5. Daily visits  → `guide.html#daily`

- No punishment for staying away (squishies never get sad, sick or leave). Snack time and the sticker calendar were **dropped**.
- **Daily quests:** 2 coin quests (+40 each) and the **Gem Challenge**: a random unlocked minigame, goal = 90% of
  the player's own best (level games: next level with 3 stars). Tomorrow's game is teased. First run of the day pays double.
- **Visitor of the week:** a squishy you don't own camps in the park; visit on 4 different days and it moves in for free.

## 6. Minigames  → each fun building's page, prototypes in `docs/design-book/play/`

| Building | Game | Kind |
|---|---|---|
| Squish Bistro | Bistro Rush | endless, 3 hearts |
| Bounce Park | Sky Bounce | endless jumper |
| Squish Patrol Station | Lost & Found | match-3 levels |
| Fluff & Puff Salon | Style Studio | endless, 3 hearts |
| Splash Squad Station | Bucket Brigade | colour-sort levels |
| Squishy Post Office | Sort-a-Lot | endless, 3 hearts |
| Squeak Stage | Squeak Beat | piano-tiles songs, 30 tracks, 3 hearts; track N needs (N−1)×3 stars; ★★ at 85%, ★★★ at 95% accuracy |
| Sprout Club Greenhouse | Grow Grow Garden | endless, 3 hearts |
| Squish Arcade | Squish Breaker | balls-vs-bricks levels, unlock one after another |
| Squishy Testing Facility | Squish Lab | toy: 2D soft-body physics, 3D look, no coins |

- Once per run: "Keep going?" → watch an ad to continue (each game says what you get).
- Results screens count every number up in 0.5 s with ticks and a ding; a tap skips to the end.
- **Minigames must stay completely independent** (see the build plan: sealed folders + one contract).

## 7. Ads  → `guide.html#ads`, `legal.html`

- Rewarded only, always opted into: (1) keep going once per run, (2) **free Mystery Box, one per ad, max 3/day**.
- No banners, no interstitials, nothing at app start, nothing in the Lab, Market or Gem Mine.
- **Every ad closable after 5 seconds** (Google Families rule); closing early = no reward.
- AdMob (Families self-certified), child-directed, non-personalised, content rating G. A grown-up can switch ads off.

## 8. Gem Mine (real-money store)  → `gemmine.html`

- A single-level building (small mountain with crystals), also opened from the 💎 button on the map's left strip.
- Packs: 100 / 300 / 500 / 1,000 Gems, **same price per Gem** (placeholder €0.99 per 100), no "best value", no timers.
- Flow: grown-up gate (every time) → spending limit / purchases switch → first-time withdrawal notice →
  Google Play sheet → server verifies → Gems added (count-up).
- Google Play Billing (Library 8+), consumable products `gems_100`, `gems_300`, `gems_500`, `gems_1000`;
  the server grants Gems, idempotent by order ID; refunds take Gems back.

## 9. Accounts and saving  → `account.html`

- Guest account created silently on first launch; cloud save from day one.
- "Save my town": the **parent** links an email (6-digit code, no password) or Apple/Google sign-in, behind the grown-up gate.
  Thank-you gift is decoration only (Safety Cloud weathervane), never currency.
- Prompts at moments that matter (first house L3, first Epic/Legendary, day 3, after every purchase), max one a day,
  stops after 5 "Later"s. Transfer code for families without email. In-app account deletion (30-day grace) + web page.
- Names come from word lists (no free text anywhere), no chat, no photos, no location, no advertising ID.

## 10. Settings  → `settings.html`

Sound effects + volume, music + volume, vibration; graphics Auto/Low/Medium/High (auto-detected from memory,
cores and a 3-second benchmark, lowers itself if slow), 30/60 fps, battery saver, reduced animations;
ask before spending Gems, hints, left-handed, colour helpers, text size.
Grown-ups area (gate = a sum written in words): purchases on/off, monthly limit, rewarded ads, trading,
play-time reminder, notifications (off by default, max 1/day, never at night), privacy & deletion.
**No language setting at launch** (English only); all text lives in one string table so languages can be added later.

## 11. First launch  → `start.html`

Loading (graphics check, guest account) → **opening story** (7 scenes on the real map, narrated, Skip from the
first second) → pick a name (word wheels) → **first tour starts by itself, even after Skip**: drag, zoom,
free first box (always Gyoza), one Sky Bounce run, fix the Steamhouse (100 coins), quest board, the **i** button.
The **i** button (top-left of the map) replays any of 10 help topics at any time.

## 12. Sound and music  → `sound.html`, `assets/audio/`

38 effects and 14 music loops, all **generated by code written for this project (owned outright, no licence needed)**,
rendered to `assets/audio/` (WAV effects, seamless Ogg loops). Outside sounds only if CC0, Pixabay licence or CC BY
with credit; never "NC" licences or the YouTube Audio Library.

## 13. Legal / store  → `legal.html`

- Declare the target audience as **children only** (5–8, 9–12): full Google Play Families policy applies.
- New personal developer account: closed test with **12 testers for 14 days** before production.
  A personal account shows your full address once you sell anything; consider publishing through a company.
- Target Android 16 (API 36); Play Billing Library 8+.
- EU: GDPR (Hungary: consent age 16), CPC virtual-currency principles (real price next to Gems, buy exact amounts),
  no "buy now" aimed at children, 14-day withdrawal notice, Digital Fairness Act proposal due mid-Nov 2026 (watch).
- Countries: exclude **Brazil** (new loot-box ban, unclear for free boxes), **South Korea, China** at launch;
  US later (COPPA). Belgium and Australia are fine (no paid random items).
- Documents needed: privacy policy (+ kid version), terms (incl. Gem terms), deletion page, Data safety form,
  ratings questionnaire, records of processing, DPIA, processor agreements, retention policy, purchase info,
  box odds, trader details, credits, breach procedure. A lawyer reviews everything before launch.

## 14. How it gets built  → `build.html`

- **Godot 4.6** (typed GDScript), Mobile renderer with Compatibility fallback. (Replaces the earlier Unity idea:
  free, everything is text, command-line builds and tests.)
- **Nakama** + PostgreSQL on a small EU server (Docker). Server decides Gems, purchases, box rolls, trades, quests;
  coins are earned on the phone and sanity-checked by the server.
- 3D models, sprites, data and sounds are **exported from the design book**; hand-made art can replace any file
  with the same name later.
- **Minigames are sealed folders** with a `manifest.json`, talking to the game only through `minigame_api` v1;
  a boundary check, contract tests (bots) and a per-game server off-switch keep them independent.
- Roadmap: 8 steps, about 7 months to public release (Step 0: repo, CI, core services, export tools).
