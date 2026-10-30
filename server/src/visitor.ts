// The Visitor of the week (guide.html "Daily visits"): every Monday a squishy from out of town camps in the park,
// preferring one the player doesn't own yet (Common to Epic). Saying hi (and giving it a treat) on 4 different days
// of that week makes it move in for free. Missed: it waves goodbye at the end of the week; next week someone else
// visits (a squishy you still don't have comes back another week). A visitor that arrives too late in the week for
// 4 visits (a new player starting on a Friday) stays until the end of the next week.
//
// Live config (server/live/live-config.json): "visitorEnabled" (false = nobody visits), "visitorDays" (days needed),
// "visitors": { "2026-11-02": "mochi" } (the Monday of a week -> who visits everyone that week).

interface Visitor { week: number; last_week: number; id: string; days: string[]; moved_in: boolean }

var VISITOR_RARITIES = ["C", "U", "R", "E"];

function visitorConfig(nk: nkruntime.Nakama | null): { enabled: boolean; days: number; visitors: { [monday: string]: string } } {
  var live = readLiveFile(nk);
  var days = Math.floor(Number(live.visitorDays));
  return {
    enabled: live.visitorEnabled !== false,
    days: days >= 1 ? days : ((ECONOMY.daily || {}).visitorDays || 4),
    visitors: live.visitors && typeof live.visitors === "object" ? live.visitors : {}
  };
}

// The Monday of a day's week ("2026-11-02").
function mondayOf(day: string): string {
  return dayText(weekOf(day) * 7 + 4);
}

// Who visits this player this week: the live schedule's squishy, else a random one they don't own (Common to
// Epic; never last week's visitor if there is another choice). Everyone owned already: any Common to Epic.
function pickVisitor(state: PlayerState, userId: string, day: string, cfg: { visitors: { [monday: string]: string } }, last: string): string {
  var fixed = cfg.visitors[mondayOf(day)];
  if (fixed && squishyInfo(fixed)) {
    return fixed;
  }
  var unowned: string[] = [];
  var all: string[] = [];
  for (var i = 0; i < SQUISHIES.length; i++) {
    var q = SQUISHIES[i];
    if (VISITOR_RARITIES.indexOf(q.rarity) >= 0) {
      all.push(q.id);
      if (!state.collection[q.id] && q.id !== last) {
        unowned.push(q.id);
      }
    }
  }
  var list = unowned.length > 0 ? unowned : all;
  return list[Math.floor(seededRandom(userId + "/visitor/" + weekOf(day))() * list.length) % list.length];
}

// This week's visitor (chosen the first time it is asked for in the week, then the same all week).
function thisWeeksVisitor(state: PlayerState, userId: string, day: string, cfg: { visitors: { [monday: string]: string }; days: number }): Visitor {
  var v = state.visitor;
  var week = weekOf(day);
  if (!v || week < v.week || week > (v.last_week || v.week)) {
    var daysLeft = 7 - (dayNumber(day) - 4 - week * 7);   // today to Sunday
    v = { week: week, last_week: daysLeft < cfg.days ? week + 1 : week, id: pickVisitor(state, userId, day, cfg, v ? v.id : ""), days: [], moved_in: false };
    state.visitor = v;
  }
  return v;
}

function visitorAnswer(v: Visitor, day: string, needed: number): Answer {
  var info = squishyInfo(v.id);
  // until: the last day it is in the park (a Sunday)
  return {
    ok: true, squishy: v.id, rarity: info ? info.rarity : "C", days: v.days.length, needed: needed,
    today_done: v.days.indexOf(day) >= 0, moved_in: v.moved_in, until: dayText((v.last_week || v.week) * 7 + 10)
  };
}

// Answer: {"ok", "squishy" ("" = nobody visits this week), "rarity", "days", "needed", "today_done", "moved_in", "until"}.
function getVisitor(nk: nkruntime.Nakama | null, state: PlayerState, userId: string, dayAsked: string): Answer {
  var cfg = visitorConfig(nk);
  if (!cfg.enabled) {
    return { ok: true, squishy: "" };
  }
  var day = checkDay(dayAsked);
  return visitorAnswer(thisWeeksVisitor(state, userId, day, cfg), day, cfg.days);
}

// Say hi and give a treat (once a day). On the last day needed it moves in: the answer also has "entry" and "is_new"
// (a squishy you got meanwhile goes onto the Spare Shelf, like a box's).
function visitorHi(nk: nkruntime.Nakama | null, state: PlayerState, userId: string, dayAsked: string): Answer {
  var cfg = visitorConfig(nk);
  if (!cfg.enabled) {
    return fail("no_visitor");
  }
  var day = checkDay(dayAsked);
  var v = thisWeeksVisitor(state, userId, day, cfg);
  if (v.moved_in) {
    return fail("moved_in");
  }
  if (v.days.indexOf(day) >= 0) {
    return fail("already_today");
  }
  v.days.push(day);
  var answer = visitorAnswer(v, day, cfg.days);
  if (v.days.length >= cfg.days) {
    v.moved_in = true;
    answer.moved_in = true;
    answer.is_new = give(state, v.id, false);
    answer.entry = copyEntry(state.collection[v.id]);
  }
  return answer;
}
