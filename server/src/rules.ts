// What the server decides (build.html "What lives where"): box rolls, the Spare Shelf, Squish Stars and the coins
// check. The same rules as the game's pretend server (game/core/server/fake_game_server.gd), which the game uses
// offline and in its tests:
// - box odds per box kind (data: economy.boxes), Family Boxes only roll that family, Golden Boxes have no Commons;
// - Rare guarantee: after 9 boxes in a row with nothing Rare or better, the next one is Rare or better;
// - 1 box in 50 is Sparkly; a squishy you already have goes onto the Spare Shelf;
// - spares level a squishy up (C/U 1/2/3/4, R/E 1/1/2/2, L 1/1/1/1; level 5 = Sparkly) or swap for Stars;
// - a minigame run may pay at most about 60 coins a minute (a level's fixed reward is always allowed).
// Every function takes the player's state and changes it; every answer has "ok" and, when not ok, "error".

interface Entry { level: number; spares: number; sparkly: boolean }
interface PlayerState {
  started?: boolean;
  collection: { [id: string]: Entry };
  stars: number;
  gems: number;
  pity: number;
  boxes_opened: number;
  first_box_given?: boolean;
  runs?: { [game: string]: number };
  // best score per endless game (for the Gem Challenge's goal)
  bests?: { [game: string]: number };
  // today's quests (quests.ts) and this week's Gem Challenge days
  daily?: any;
  week?: { week: number; days: string[]; claimed: boolean };
}
interface Answer { ok: boolean; error?: string; [key: string]: any }

function squishyInfo(id: string): SquishyInfo | null {
  for (var i = 0; i < SQUISHIES.length; i++) {
    if (SQUISHIES[i].id === id) {
      return SQUISHIES[i];
    }
  }
  return null;
}

function fail(error: string): Answer {
  return { ok: false, error: error };
}

function copyEntry(e: Entry): Entry {
  return { level: e.level, spares: e.spares, sparkly: e.sparkly };
}

function copyCollection(col: { [id: string]: Entry }): { [id: string]: Entry } {
  var out: { [id: string]: Entry } = {};
  for (var id in col) {
    if (col.hasOwnProperty(id)) {
      out[id] = copyEntry(col[id]);
    }
  }
  return out;
}

// Add one copy. Returns true if it is new (moves in); a copy you have goes onto the Spare Shelf.
function give(state: PlayerState, id: string, sparkly: boolean): boolean {
  var e = state.collection[id];
  if (!e) {
    state.collection[id] = { level: 1, spares: 0, sparkly: sparkly };
    return true;
  }
  e.spares += 1;
  if (sparkly) {
    e.sparkly = true;
  }
  return false;
}

// Everything the server knows about the player. The first time, the free starter squishy too.
function loadState(state: PlayerState): Answer {
  if (!state.started) {
    state.started = true;
    state.collection = {};
    state.stars = 0;
    state.gems = 0;
    state.pity = 0;
    state.boxes_opened = 0;
    for (var i = 0; i < ECONOMY.unlocks.length; i++) {
      var u = ECONOMY.unlocks[i];
      if (u.when === "start" && u.gift) {
        give(state, u.gift, false);
      }
    }
  }
  return { ok: true, collection: copyCollection(state.collection), stars: state.stars, gems: state.gems, pity: state.pity, boxes_opened: state.boxes_opened };
}

function rollRarity(odds: { [r: string]: number }, random: () => number): string {
  var x = random() * 100;
  var order = ["L", "E", "R", "U", "C"];
  for (var i = 0; i < order.length; i++) {
    var p = odds[order[i]] || 0;
    if (x < p) {
      return order[i];
    }
    x -= p;
  }
  return "C";
}

function openBox(state: PlayerState, kind: string, family: string, firstBox: boolean, random: () => number): Answer {
  var box = ECONOMY.boxes[kind];
  if (!box) {
    return fail("unknown_box");
  }
  var id: string;
  var rarity: string;
  if (firstBox && !state.first_box_given) {
    state.first_box_given = true;
    id = ECONOMY.firstBox || "gyoza";
    var first = squishyInfo(id);
    rarity = first ? first.rarity : "C";
  } else {
    rarity = rollRarity(box.odds, random);
    var pity = state.pity || 0;
    if (pity >= (ECONOMY.rareGuaranteeAfter || 9) && (rarity === "C" || rarity === "U")) {
      rarity = "R";
    }
    state.pity = rarity === "C" || rarity === "U" ? pity + 1 : 0;
    var pool: string[] = [];
    for (var i = 0; i < SQUISHIES.length; i++) {
      var q = SQUISHIES[i];
      if (q.rarity === rarity && (!box.pickFamily || q.family === family)) {
        pool.push(q.id);
      }
    }
    if (pool.length === 0) {
      return fail("unknown_box");
    }
    id = pool[Math.floor(random() * pool.length) % pool.length];
  }
  var sparkly = random() < (ECONOMY.sparklyChance || 0.02);
  var isNew = give(state, id, sparkly);
  state.boxes_opened = (state.boxes_opened || 0) + 1;
  questsAfterBox(state);
  return { ok: true, squishy: id, rarity: rarity, sparkly: sparkly, is_new: isNew, entry: copyEntry(state.collection[id]), pity: state.pity || 0, boxes_opened: state.boxes_opened };
}

// Spares needed to go from `level` to level + 1 (0 past the top).
function sparesNeeded(id: string, level: number): number {
  var info = squishyInfo(id);
  var table = ECONOMY.spareLevels[info ? info.rarity : "C"] || [];
  return level >= 1 && level <= table.length ? table[level - 1] : 0;
}

function levelUp(state: PlayerState, id: string): Answer {
  var entry = state.collection[id];
  if (!entry) {
    return fail("not_owned");
  }
  var top = ECONOMY.maxSquishyLevel || 5;
  if (entry.level >= top) {
    return fail("max_level");
  }
  var need = sparesNeeded(id, entry.level);
  if (entry.spares < need) {
    return fail("no_spares");
  }
  entry.spares -= need;
  entry.level += 1;
  if (entry.level >= top) {
    entry.sparkly = true;
  }
  return { ok: true, entry: copyEntry(entry) };
}

function swapSpare(state: PlayerState, id: string): Answer {
  var entry = state.collection[id];
  if (!entry) {
    return fail("not_owned");
  }
  if (entry.spares < 1) {
    return fail("no_spares");
  }
  entry.spares -= 1;
  var info = squishyInfo(id);
  state.stars = (state.stars || 0) + (ECONOMY.starsPerSpare[info ? info.rarity : "C"] || 0);
  return { ok: true, entry: copyEntry(entry), stars: state.stars };
}

// Coins per minute are capped (economy.minigames.serverMaxCoinsPerMinute); a run counts as at least one minute, so
// a short run that reaches a milestone bonus is still paid in full. With a report (score, stars...) the run also
// moves today's quests on, and the day's first run pays double (firstRunMultiplier): "coins" is what may be paid.
function submitRun(state: PlayerState, game: string, seconds: number, coins: number, kind: string, report?: RunReport, multiplier?: number): Answer {
  if (!game || !(seconds >= 0) || !(coins >= 0)) {
    return fail("bad_run");
  }
  var rules = ECONOMY.minigames || {};
  var perMinute = rules.serverMaxCoinsPerMinute || 60;
  var most = Math.ceil(perMinute * Math.max(1, seconds / 60));
  if (kind === "levels") {
    // one level never pays more than a first clear with 3 stars on a big level
    most = Math.max(most, ((rules.levelFirstClear || 30) + 3 * (rules.perStar || 15)) * (rules.everyTenthLevelMultiplier || 2));
  }
  state.runs = state.runs || {};
  state.runs[game] = (state.runs[game] || 0) + 1;
  var paid = Math.min(coins, most);
  var answer: Answer = { ok: true, coins: paid, capped: coins > most, first_today: false, quests_done: [] };
  if (report) {
    if (kind === "endless") {
      state.bests = state.bests || {};
      state.bests[game] = Math.max(state.bests[game] || 0, Math.floor(report.score || 0));
    }
    var d = state.daily;
    if (d && !d.first_run && paid > 0) {
      d.first_run = true;
      answer.first_today = true;
      answer.coins = paid * Math.max(1, multiplier || 1);
    }
    answer.quests_done = questsAfterRun(state, report);
  }
  return answer;
}
