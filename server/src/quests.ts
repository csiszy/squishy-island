// Daily quests and the Gem Challenge (guide.html "Daily visits" and "Gems"):
// - 3 a day: 2 easy coin quests (+40 coins each) from the quest pool (data: economy.questPool), only with games the
//   player has built, and the Gem Challenge (+3 Gems): one game a day (never the same two days running), the goal
//   set from the player's own best (endless games: 90% of their best score; Squeak Beat: ★★★ on any track or ★★ on
//   the newest; level games: win the next new level with ★★★ or raise any two levels to ★★★). Unlimited tries.
// - The first minigame run of each day pays double coins.
// - Gem streak: the Gem Challenge done on 5 days of the same week (any 5) gives +15 Gems once that week.
// - Missing a day only means missing that day's quests: nothing is ever taken away.
//
// Everything can be changed without an app update: the server reads server/live-config.json (README.md, "Changing
// things live") every time it makes a day's quests; it can replace the quest pool, the numbers, and set the exact
// quests or Gem Challenge game for a given date.

interface Quest { id: string; kind: string; game: string; target: number; text: string; reward: number; progress: number; claimed: boolean }
interface Challenge { game: string; goal: string; target: number; progress: number; done: boolean; claimed: boolean }
interface Daily { day: string; quests: Quest[]; challenge: Challenge | null; first_run: boolean }
interface GameInfo { id: string; kind: string }

// ---------------------------------------------------------------- dates (days are "YYYY-MM-DD", the phone's own date)

function dayNumber(day: string): number {
  var p = day.split("-");
  return Math.floor(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2])) / 86400000);
}

function dayText(n: number): string {
  var d = new Date(n * 86400000);
  var pad = function (x: number): string { return x < 10 ? "0" + x : String(x); };
  return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
}

// The phone says which day it is (its own time zone); it may not be more than a day away from the server's.
function checkDay(day: string): string {
  var today = Math.floor(clock.now() / 86400000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "") || Math.abs(dayNumber(day) - today) > 1) {
    return dayText(today);
  }
  return day;
}

// Monday-based week number (days since the epoch's Monday / 7): the same for every day of one week.
function weekOf(day: string): number {
  return Math.floor((dayNumber(day) - 4) / 7);   // 1970-01-01 was a Thursday; 1970-01-05 a Monday
}

// ---------------------------------------------------------------- random numbers from a text (the same every time)

function seededRandom(text: string): () => number {
  var h = 2166136261;
  for (var i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  var a = h || 1;
  return function (): number {
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- the live config (with the book's numbers as defaults)

interface LiveConfig {
  coinQuests: number;
  coinQuestReward: number;
  firstRunMultiplier: number;
  challengeOfBest: number;
  challengeGems: number;
  streakDays: number;
  streakGems: number;
  challengeEnabled: boolean;
  questPool: any[];
  schedule: { [day: string]: { quests?: any[]; challenge?: string } };
  [key: string]: any;
}

// server/live-config.json (next to this module in the container). Missing or broken: nothing is changed (a broken
// file is reported in the server's log, so a typo never stops the game).
function readLiveFile(nk: nkruntime.Nakama | null): { [key: string]: any } {
  if (!nk) {
    return {};
  }
  var text = "";
  try {
    text = nk.fileRead(LIVE_FILE);
  } catch (e) {
    return {};
  }
  try {
    var v = JSON.parse(text);
    return v && typeof v === "object" ? v : {};
  } catch (e) {
    liveConfigProblem = "live-config.json is not valid JSON: " + String(e);
    return {};
  }
}

var LIVE_FILE = "live/live-config.json";
var liveConfigProblem = "";

function liveConfig(nk: nkruntime.Nakama | null): LiveConfig {
  var daily = ECONOMY.daily || {};
  var gems = ECONOMY.gemsEarned || {};
  var c: LiveConfig = {
    coinQuests: daily.coinQuests || 2,
    coinQuestReward: daily.coinQuestReward || 40,
    firstRunMultiplier: daily.firstRunMultiplier || 2,
    challengeOfBest: daily.challengeOfBest || 0.9,
    challengeGems: gems.dailyChallenge || 3,
    streakDays: gems.weeklyStreakDays || 5,
    streakGems: gems.weeklyStreak || 15,
    challengeEnabled: true,
    questPool: ECONOMY.questPool || [],
    schedule: {}
  };
  var live = readLiveFile(nk);
  for (var k in live) {
    if (live.hasOwnProperty(k) && c.hasOwnProperty(k) && live[k] !== null && live[k] !== undefined) {
      c[k] = live[k];
    }
  }
  return c;
}

// ---------------------------------------------------------------- making a day's quests

function playable(games: GameInfo[]): GameInfo[] {
  var out: GameInfo[] = [];
  for (var i = 0; i < games.length; i++) {
    if (games[i] && games[i].id && games[i].kind !== "toy") {
      out.push(games[i]);
    }
  }
  return out;
}

function hasGame(games: GameInfo[], id: string): boolean {
  for (var i = 0; i < games.length; i++) {
    if (games[i].id === id) {
      return true;
    }
  }
  return false;
}

// The Gem Challenge's game for a day: one of the player's games (not toys), never `avoid` (the day before's game).
function challengeGame(userId: string, day: string, games: GameInfo[], cfg: LiveConfig, avoid: string): string {
  var fixed = cfg.schedule[day] && cfg.schedule[day].challenge;
  if (fixed && hasGame(games, fixed)) {
    return fixed;
  }
  var list = playable(games);
  if (list.length === 0) {
    return "";
  }
  var i = Math.floor(seededRandom(userId + "/challenge/" + day)() * list.length) % list.length;
  if (list.length > 1 && list[i].id === avoid) {
    i = (i + 1) % list.length;
  }
  return list[i].id;
}

function challengeFor(state: PlayerState, game: string, games: GameInfo[], cfg: LiveConfig): Challenge | null {
  if (!game || !cfg.challengeEnabled) {
    return null;
  }
  var kind = "endless";
  for (var i = 0; i < games.length; i++) {
    if (games[i].id === game) {
      kind = games[i].kind;
    }
  }
  var bests = state.bests || {};
  if (kind === "levels") {
    return { game: game, goal: "levels3", target: 2, progress: 0, done: false, claimed: false };
  }
  if (kind === "songs") {
    return { game: game, goal: "song3", target: 1, progress: 0, done: false, claimed: false };
  }
  // a new player's goal is small (just play), an expert's is big: always a stretch, never impossible
  return { game: game, goal: "score", target: Math.max(1, Math.floor((bests[game] || 0) * cfg.challengeOfBest)), progress: 0, done: false, claimed: false };
}

function questFrom(entry: any, games: GameInfo[], random: () => number, reward: number): Quest | null {
  if (!entry || !entry.id) {
    return null;
  }
  var game = String(entry.game || "any");
  if (entry.kind === "boxes") {
    game = "";
  } else if (game === "pick") {
    var list = playable(games);
    if (list.length === 0) {
      return null;
    }
    game = list[Math.floor(random() * list.length) % list.length].id;
  } else if (game !== "any" && !hasGame(games, game)) {
    return null;   // a game the player hasn't built yet
  }
  return {
    id: String(entry.id), kind: String(entry.kind || "runs"), game: game, target: Math.max(1, Math.floor(Number(entry.target) || 1)),
    text: String(entry.text || ""), reward: Math.max(0, Math.floor(Number(entry.reward !== undefined ? entry.reward : reward))),
    progress: 0, claimed: false
  };
}

function makeDay(state: PlayerState, userId: string, day: string, games: GameInfo[], cfg: LiveConfig): Daily {
  var random = seededRandom(userId + "/quests/" + day);
  var quests: Quest[] = [];
  var scheduled = cfg.schedule[day] && cfg.schedule[day].quests;
  if (scheduled && scheduled.length) {
    for (var i = 0; i < scheduled.length; i++) {
      var q = questFrom(scheduled[i], games, random, cfg.coinQuestReward);
      if (q) {
        quests.push(q);
      }
    }
  } else {
    // weighted picks from the pool, no quest twice
    var pool: any[] = [];
    for (var j = 0; j < cfg.questPool.length; j++) {
      pool.push(cfg.questPool[j]);
    }
    while (quests.length < cfg.coinQuests && pool.length > 0) {
      var total = 0;
      for (var k = 0; k < pool.length; k++) {
        total += Math.max(0, Number(pool[k].weight) || 1);
      }
      var x = random() * total;
      var at = 0;
      for (var m = 0; m < pool.length; m++) {
        x -= Math.max(0, Number(pool[m].weight) || 1);
        if (x < 0) {
          at = m;
          break;
        }
      }
      var picked = questFrom(pool[at], games, random, cfg.coinQuestReward);
      pool.splice(at, 1);
      if (picked) {
        quests.push(picked);
      }
    }
  }
  var before = state.daily as Daily;
  var yesterday = before && before.day === dayText(dayNumber(day) - 1) && before.challenge ? before.challenge.game : "";
  return { day: day, quests: quests, challenge: challengeFor(state, challengeGame(userId, day, games, cfg, yesterday), games, cfg), first_run: false };
}

function todays(state: PlayerState, userId: string, day: string, games: GameInfo[], cfg: LiveConfig): Daily {
  var d = state.daily as Daily;
  if (!d || d.day !== day) {
    d = makeDay(state, userId, day, games, cfg);
    state.daily = d;
  }
  return d;
}

function questsAnswer(state: PlayerState, userId: string, d: Daily, games: GameInfo[], cfg: LiveConfig): Answer {
  var week = state.week || { week: -1, days: [], claimed: false };
  var thisWeek = week.week === weekOf(d.day);
  return {
    ok: true, day: d.day, quests: d.quests, challenge: d.challenge, first_run_left: !d.first_run,
    tomorrow: challengeGame(userId, dayText(dayNumber(d.day) + 1), games, cfg, d.challenge ? d.challenge.game : ""),
    streak: { days: thisWeek ? week.days.length : 0, needed: cfg.streakDays, gems: cfg.streakGems, claimed: thisWeek && week.claimed },
    rewards: { quest: cfg.coinQuestReward, challenge: cfg.challengeGems }
  };
}

// The day's quests (made the first time they are asked for that day).
function getQuests(nk: nkruntime.Nakama | null, state: PlayerState, userId: string, dayAsked: string, games: GameInfo[]): Answer {
  var cfg = liveConfig(nk);
  var day = checkDay(dayAsked);
  var d = todays(state, userId, day, games || [], cfg);
  return questsAnswer(state, userId, d, games || [], cfg);
}

// ---------------------------------------------------------------- progress (from minigame runs and boxes)

interface RunReport { game: string; score: number; metric: number; won: boolean; level: number; stars: number; prev_stars: number; newest: boolean }

// A finished run moves today's quests on. Returns the ids of quests (and "challenge") that just got done.
function questsAfterRun(state: PlayerState, run: RunReport): string[] {
  var d = state.daily as Daily;
  var done: string[] = [];
  if (!d) {
    return done;
  }
  for (var i = 0; i < d.quests.length; i++) {
    var q = d.quests[i];
    var was = q.progress >= q.target;
    if (q.kind === "runs" && (q.game === "any" || q.game === run.game)) {
      q.progress = Math.min(q.target, q.progress + 1);
    } else if (q.kind === "metric" && q.game === run.game) {
      q.progress = Math.min(q.target, q.progress + Math.max(0, Math.floor(run.metric || 0)));
    }
    if (!was && q.progress >= q.target) {
      done.push(q.id);
    }
  }
  var c = d.challenge;
  if (c && !c.done && c.game === run.game) {
    if (c.goal === "score") {
      c.progress = Math.max(c.progress, Math.floor(run.score || 0));
      c.done = c.progress >= c.target;
    } else if (c.goal === "levels3" && run.won && run.stars >= 3 && run.prev_stars < 3) {
      // a new level won with ★★★ does it at once; otherwise two levels raised to ★★★
      c.progress = run.prev_stars === 0 ? c.target : c.progress + 1;
      c.done = c.progress >= c.target;
    } else if (c.goal === "song3" && run.won && (run.stars >= 3 || (run.stars >= 2 && run.newest))) {
      c.progress = 1;
      c.done = true;
    }
    if (c.done) {
      done.push("challenge");
    }
  }
  return done;
}

function questsAfterBox(state: PlayerState): void {
  var d = state.daily as Daily;
  if (!d) {
    return;
  }
  for (var i = 0; i < d.quests.length; i++) {
    if (d.quests[i].kind === "boxes") {
      d.quests[i].progress = Math.min(d.quests[i].target, d.quests[i].progress + 1);
    }
  }
}

// ---------------------------------------------------------------- collecting rewards

// id: a quest's id (coins: the phone adds them), "challenge" (Gems) or "streak" (Gems).
function claimQuest(nk: nkruntime.Nakama | null, state: PlayerState, dayAsked: string, id: string): Answer {
  var cfg = liveConfig(nk);
  var d = state.daily as Daily;
  var day = checkDay(dayAsked);
  if (!d || d.day !== day) {
    return fail("not_today");
  }
  if (id === "challenge") {
    var c = d.challenge;
    if (!c || !c.done) {
      return fail("not_done");
    }
    if (c.claimed) {
      return fail("claimed");
    }
    c.claimed = true;
    state.gems = (state.gems || 0) + cfg.challengeGems;
    var week = state.week && state.week.week === weekOf(day) ? state.week : { week: weekOf(day), days: [], claimed: false };
    if (week.days.indexOf(day) < 0) {
      week.days.push(day);
    }
    state.week = week;
    return { ok: true, gems: cfg.challengeGems, total_gems: state.gems, stars: state.stars, streak_days: week.days.length };
  }
  if (id === "streak") {
    var w = state.week;
    if (!w || w.week !== weekOf(day) || w.days.length < cfg.streakDays) {
      return fail("not_done");
    }
    if (w.claimed) {
      return fail("claimed");
    }
    w.claimed = true;
    state.gems = (state.gems || 0) + cfg.streakGems;
    return { ok: true, gems: cfg.streakGems, total_gems: state.gems, stars: state.stars };
  }
  for (var i = 0; i < d.quests.length; i++) {
    var q = d.quests[i];
    if (q.id === id) {
      if (q.progress < q.target) {
        return fail("not_done");
      }
      if (q.claimed) {
        return fail("claimed");
      }
      q.claimed = true;
      return { ok: true, coins: q.reward };
    }
  }
  return fail("no_quest");
}
