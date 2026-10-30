// Squishy Island's server module for Nakama. Nakama runs this file and calls InitModule once at start; the game
// calls the RPCs below over the internet (game/core/server/nakama_game_server.gd). Each player's state lives in
// Nakama's storage (collection "island", key "state"), only the server may write it.
// The RPC names and answers are the GameServer interface in the game (game/core/server/game_server.gd).

var STATE_COLLECTION = "island";
var STATE_KEY = "state";

// Read the player's state, let `change` work on it, save it if it changed. Two answers at once for the same player
// (two taps) never overwrite each other: the save only works if nobody saved in between, otherwise it tries again.
function withState(nk: nkruntime.Nakama, userId: string, change: (state: PlayerState) => Answer): Answer {
  for (var attempt = 0; attempt < 5; attempt++) {
    var found = nk.storageRead([{ collection: STATE_COLLECTION, key: STATE_KEY, userId: userId }]);
    var state: PlayerState = found.length > 0 ? (found[0].value as PlayerState) : ({ collection: {}, stars: 0, gems: 0, pity: 0, boxes_opened: 0 } as PlayerState);
    if (!state.collection) {
      state.collection = {};
    }
    var before = JSON.stringify(state);
    var answer = change(state);
    if (JSON.stringify(state) === before) {
      return answer;
    }
    try {
      nk.storageWrite([{
        collection: STATE_COLLECTION, key: STATE_KEY, userId: userId, value: state,
        // "*" = only if it doesn't exist yet; otherwise only if nobody changed it since we read it
        version: found.length > 0 ? found[0].version : "*",
        permissionRead: 1, permissionWrite: 0
      }]);
      return answer;
    } catch (e) {
      // someone saved first: read again and redo
    }
  }
  return fail("busy");
}

function parse(payload: string): { [key: string]: any } {
  if (!payload) {
    return {};
  }
  try {
    var v = JSON.parse(payload);
    return v && typeof v === "object" ? v : {};
  } catch (e) {
    return {};
  }
}

function needUser(ctx: nkruntime.Context): string | null {
  return ctx.userId ? ctx.userId : null;
}

function rpcLoadState(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  var user = needUser(ctx);
  if (!user) {
    return JSON.stringify(fail("no_account"));
  }
  return JSON.stringify(withState(nk, user, function (s) { return loadState(s); }));
}

function rpcOpenBox(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  var user = needUser(ctx);
  if (!user) {
    return JSON.stringify(fail("no_account"));
  }
  var p = parse(payload);
  return JSON.stringify(withState(nk, user, function (s) {
    loadState(s);
    return openBox(s, String(p.kind || ""), String(p.family || ""), p.first_box === true, Math.random);
  }));
}

function rpcLevelUp(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  var user = needUser(ctx);
  if (!user) {
    return JSON.stringify(fail("no_account"));
  }
  var p = parse(payload);
  return JSON.stringify(withState(nk, user, function (s) { return levelUp(s, String(p.id || "")); }));
}

function rpcSwapSpare(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  var user = needUser(ctx);
  if (!user) {
    return JSON.stringify(fail("no_account"));
  }
  var p = parse(payload);
  return JSON.stringify(withState(nk, user, function (s) { return swapSpare(s, String(p.id || "")); }));
}

function rpcSubmitRun(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  var user = needUser(ctx);
  if (!user) {
    return JSON.stringify(fail("no_account"));
  }
  var p = parse(payload);
  return JSON.stringify(withState(nk, user, function (s) {
    return submitRun(s, String(p.game || ""), Number(p.seconds), Math.floor(Number(p.coins)), String(p.kind || "endless"));
  }));
}

// The game checks this first, to see it reached the right server (and which version of the rules it runs).
function rpcHello(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
  return JSON.stringify({ ok: true, server: "squishy-island", squishies: SQUISHIES.length });
}

function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
  initializer.registerRpc("hello", rpcHello);
  initializer.registerRpc("load_state", rpcLoadState);
  initializer.registerRpc("open_box", rpcOpenBox);
  initializer.registerRpc("level_up", rpcLevelUp);
  initializer.registerRpc("swap_spare", rpcSwapSpare);
  initializer.registerRpc("submit_run", rpcSubmitRun);
  logger.info("Squishy Island server ready: %d squishies, %d box kinds", SQUISHIES.length, Object.keys(ECONOMY.boxes).length);
}
