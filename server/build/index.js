"use strict";
// Made by tools/make_data.js from game/data (do not edit by hand).
var ECONOMY = { "boxes": { "mystery": { "price": 200, "odds": { "C": 55, "U": 25, "R": 13, "E": 6, "L": 1 }, "factoryLevel": 1 }, "family": { "price": 500, "odds": { "C": 55, "U": 25, "R": 13, "E": 6, "L": 1 }, "factoryLevel": 3, "pickFamily": true }, "golden": { "price": 1000, "odds": { "C": 0, "U": 50, "R": 30, "E": 16, "L": 4 }, "factoryLevel": 6 }, "ad": { "price": 0, "odds": { "C": 55, "U": 25, "R": 13, "E": 6, "L": 1 }, "factoryLevel": 1, "perDay": 3 } }, "rareGuaranteeAfter": 9, "sparklyChance": 0.02, "firstBox": "gyoza", "spareLevels": { "C": [1, 2, 3, 4], "U": [1, 2, 3, 4], "R": [1, 1, 2, 2], "E": [1, 1, 2, 2], "L": [1, 1, 1, 1] }, "maxSquishyLevel": 5, "starsPerSpare": { "C": 5, "U": 15, "R": 40, "E": 100, "L": 300 }, "gemShop": { "legendary": 300, "exclusive": 500 }, "gemsEarned": { "dailyChallenge": 3, "weeklyStreak": 15, "weeklyStreakDays": 5, "achievementMin": 10, "achievementMax": 25 }, "gemPacks": [{ "id": "gems_100", "gems": 100 }, { "id": "gems_300", "gems": 300 }, { "id": "gems_500", "gems": 500 }, { "id": "gems_1000", "gems": 1000 }], "gemPricePer100Eur": 0.99, "cozy": { "pointsPerStep": 5, "coinBonusPerStep": 0.05 }, "daily": { "coinQuests": 2, "coinQuestReward": 40, "firstRunMultiplier": 2, "challengeOfBest": 0.9, "visitorDays": 4 }, "minigames": { "coinsPerMinuteTarget": 35, "milestoneBonus": [10, 25, 50], "levelFirstClear": 30, "levelReplay": 10, "perStar": 15, "everyTenthLevelMultiplier": 2, "serverMaxCoinsPerMinute": 60 }, "ads": { "closableAfterSeconds": 5, "keepGoingPerRun": 1, "freeBoxesPerDay": 3 }, "unlocks": [{ "when": "start", "houses": ["dumpling", "kitchen", "pets", "sweets", "fruit", "ocean", "sky", "forest"], "buildings": ["playground", "restaurant", "post", "factory", "gemmine", "market", "salon", "police", "fire", "testlab", "arcade", "bandstand", "greenhouse"], "built": ["playground", "restaurant", "post", "factory", "gemmine"], "gift": "bao" }] };
var SQUISHIES = [{ "id": "bao", "family": "dumpling", "rarity": "C" }, { "id": "gyoza", "family": "dumpling", "rarity": "C" }, { "id": "xlb", "family": "dumpling", "rarity": "U" }, { "id": "hargow", "family": "dumpling", "rarity": "R" }, { "id": "peachbun", "family": "dumpling", "rarity": "E" }, { "id": "goldumpling", "family": "dumpling", "rarity": "L" }, { "id": "toast", "family": "kitchen", "rarity": "C" }, { "id": "egg", "family": "kitchen", "rarity": "C" }, { "id": "banana", "family": "kitchen", "rarity": "U" }, { "id": "butter", "family": "kitchen", "rarity": "R" }, { "id": "croissant", "family": "kitchen", "rarity": "E" }, { "id": "pancake", "family": "kitchen", "rarity": "L" }, { "id": "kitty", "family": "pets", "rarity": "C" }, { "id": "puppy", "family": "pets", "rarity": "C" }, { "id": "bunny", "family": "pets", "rarity": "U" }, { "id": "hamster", "family": "pets", "rarity": "R" }, { "id": "corgi", "family": "pets", "rarity": "E" }, { "id": "luckycat", "family": "pets", "rarity": "L" }, { "id": "marshmallow", "family": "sweets", "rarity": "C" }, { "id": "macaron", "family": "sweets", "rarity": "C" }, { "id": "donut", "family": "sweets", "rarity": "U" }, { "id": "icecream", "family": "sweets", "rarity": "R" }, { "id": "shortcake", "family": "sweets", "rarity": "E" }, { "id": "gummy", "family": "sweets", "rarity": "L" }, { "id": "strawberry", "family": "fruit", "rarity": "C" }, { "id": "peach", "family": "fruit", "rarity": "C" }, { "id": "avocado", "family": "fruit", "rarity": "U" }, { "id": "watermelon", "family": "fruit", "rarity": "R" }, { "id": "dragonfruit", "family": "fruit", "rarity": "E" }, { "id": "goldapple", "family": "fruit", "rarity": "L" }, { "id": "jelly", "family": "ocean", "rarity": "C" }, { "id": "puffer", "family": "ocean", "rarity": "C" }, { "id": "axolotl", "family": "ocean", "rarity": "U" }, { "id": "octopus", "family": "ocean", "rarity": "R" }, { "id": "whale", "family": "ocean", "rarity": "E" }, { "id": "turtle", "family": "ocean", "rarity": "L" }, { "id": "puff", "family": "sky", "rarity": "C" }, { "id": "raindrop", "family": "sky", "rarity": "C" }, { "id": "sunny", "family": "sky", "rarity": "U" }, { "id": "star", "family": "sky", "rarity": "R" }, { "id": "moon", "family": "sky", "rarity": "E" }, { "id": "rainbow", "family": "sky", "rarity": "L" }, { "id": "sprout", "family": "forest", "rarity": "C" }, { "id": "acorn", "family": "forest", "rarity": "C" }, { "id": "mossball", "family": "forest", "rarity": "U" }, { "id": "shroomy", "family": "forest", "rarity": "R" }, { "id": "fluffle", "family": "forest", "rarity": "E" }, { "id": "mossdragon", "family": "forest", "rarity": "L" }];
// What the server decides (build.html "What lives where"): box rolls, the Spare Shelf, Squish Stars and the coins
// check. The same rules as the game's pretend server (game/core/server/fake_game_server.gd), which the game uses
// offline and in its tests:
// - box odds per box kind (data: economy.boxes), Family Boxes only roll that family, Golden Boxes have no Commons;
// - Rare guarantee: after 9 boxes in a row with nothing Rare or better, the next one is Rare or better;
// - 1 box in 50 is Sparkly; a squishy you already have goes onto the Spare Shelf;
// - spares level a squishy up (C/U 1/2/3/4, R/E 1/1/2/2, L 1/1/1/1; level 5 = Sparkly) or swap for Stars;
// - a minigame run may pay at most about 60 coins a minute (a level's fixed reward is always allowed).
// Every function takes the player's state and changes it; every answer has "ok" and, when not ok, "error".
function squishyInfo(id) {
    for (var i = 0; i < SQUISHIES.length; i++) {
        if (SQUISHIES[i].id === id) {
            return SQUISHIES[i];
        }
    }
    return null;
}
function fail(error) {
    return { ok: false, error: error };
}
function copyEntry(e) {
    return { level: e.level, spares: e.spares, sparkly: e.sparkly };
}
function copyCollection(col) {
    var out = {};
    for (var id in col) {
        if (col.hasOwnProperty(id)) {
            out[id] = copyEntry(col[id]);
        }
    }
    return out;
}
// Add one copy. Returns true if it is new (moves in); a copy you have goes onto the Spare Shelf.
function give(state, id, sparkly) {
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
function loadState(state) {
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
function rollRarity(odds, random) {
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
function openBox(state, kind, family, firstBox, random) {
    var box = ECONOMY.boxes[kind];
    if (!box) {
        return fail("unknown_box");
    }
    var id;
    var rarity;
    if (firstBox && !state.first_box_given) {
        state.first_box_given = true;
        id = ECONOMY.firstBox || "gyoza";
        var first = squishyInfo(id);
        rarity = first ? first.rarity : "C";
    }
    else {
        rarity = rollRarity(box.odds, random);
        var pity = state.pity || 0;
        if (pity >= (ECONOMY.rareGuaranteeAfter || 9) && (rarity === "C" || rarity === "U")) {
            rarity = "R";
        }
        state.pity = rarity === "C" || rarity === "U" ? pity + 1 : 0;
        var pool = [];
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
    return { ok: true, squishy: id, rarity: rarity, sparkly: sparkly, is_new: isNew, entry: copyEntry(state.collection[id]), pity: state.pity || 0, boxes_opened: state.boxes_opened };
}
// Spares needed to go from `level` to level + 1 (0 past the top).
function sparesNeeded(id, level) {
    var info = squishyInfo(id);
    var table = ECONOMY.spareLevels[info ? info.rarity : "C"] || [];
    return level >= 1 && level <= table.length ? table[level - 1] : 0;
}
function levelUp(state, id) {
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
function swapSpare(state, id) {
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
// a short run that reaches a milestone bonus is still paid in full.
function submitRun(state, game, seconds, coins, kind) {
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
    return { ok: true, coins: Math.min(coins, most), capped: coins > most };
}
// Squishy Island's server module for Nakama. Nakama runs this file and calls InitModule once at start; the game
// calls the RPCs below over the internet (game/core/server/nakama_game_server.gd). Each player's state lives in
// Nakama's storage (collection "island", key "state"), only the server may write it.
// The RPC names and answers are the GameServer interface in the game (game/core/server/game_server.gd).
var STATE_COLLECTION = "island";
var STATE_KEY = "state";
// Read the player's state, let `change` work on it, save it if it changed. Two answers at once for the same player
// (two taps) never overwrite each other: the save only works if nobody saved in between, otherwise it tries again.
function withState(nk, userId, change) {
    for (var attempt = 0; attempt < 5; attempt++) {
        var found = nk.storageRead([{ collection: STATE_COLLECTION, key: STATE_KEY, userId: userId }]);
        var state = found.length > 0 ? found[0].value : { collection: {}, stars: 0, gems: 0, pity: 0, boxes_opened: 0 };
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
        }
        catch (e) {
            // someone saved first: read again and redo
        }
    }
    return fail("busy");
}
function parse(payload) {
    if (!payload) {
        return {};
    }
    try {
        var v = JSON.parse(payload);
        return v && typeof v === "object" ? v : {};
    }
    catch (e) {
        return {};
    }
}
function needUser(ctx) {
    return ctx.userId ? ctx.userId : null;
}
function rpcLoadState(ctx, logger, nk, payload) {
    var user = needUser(ctx);
    if (!user) {
        return JSON.stringify(fail("no_account"));
    }
    return JSON.stringify(withState(nk, user, function (s) { return loadState(s); }));
}
function rpcOpenBox(ctx, logger, nk, payload) {
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
function rpcLevelUp(ctx, logger, nk, payload) {
    var user = needUser(ctx);
    if (!user) {
        return JSON.stringify(fail("no_account"));
    }
    var p = parse(payload);
    return JSON.stringify(withState(nk, user, function (s) { return levelUp(s, String(p.id || "")); }));
}
function rpcSwapSpare(ctx, logger, nk, payload) {
    var user = needUser(ctx);
    if (!user) {
        return JSON.stringify(fail("no_account"));
    }
    var p = parse(payload);
    return JSON.stringify(withState(nk, user, function (s) { return swapSpare(s, String(p.id || "")); }));
}
function rpcSubmitRun(ctx, logger, nk, payload) {
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
function rpcHello(ctx, logger, nk, payload) {
    return JSON.stringify({ ok: true, server: "squishy-island", squishies: SQUISHIES.length });
}
function InitModule(ctx, logger, nk, initializer) {
    initializer.registerRpc("hello", rpcHello);
    initializer.registerRpc("load_state", rpcLoadState);
    initializer.registerRpc("open_box", rpcOpenBox);
    initializer.registerRpc("level_up", rpcLevelUp);
    initializer.registerRpc("swap_spare", rpcSwapSpare);
    initializer.registerRpc("submit_run", rpcSubmitRun);
    logger.info("Squishy Island server ready: %d squishies, %d box kinds", SQUISHIES.length, Object.keys(ECONOMY.boxes).length);
}
