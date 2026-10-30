"use strict";
// Made by tools/make_data.js from game/data (do not edit by hand).
var ECONOMY = { "boxes": { "mystery": { "price": 200, "odds": { "C": 55, "U": 25, "R": 13, "E": 6, "L": 1 }, "factoryLevel": 1 }, "family": { "price": 500, "odds": { "C": 55, "U": 25, "R": 13, "E": 6, "L": 1 }, "factoryLevel": 3, "pickFamily": true }, "golden": { "price": 1000, "odds": { "C": 0, "U": 50, "R": 30, "E": 16, "L": 4 }, "factoryLevel": 6 }, "ad": { "price": 0, "odds": { "C": 55, "U": 25, "R": 13, "E": 6, "L": 1 }, "factoryLevel": 1, "perDay": 3 } }, "rareGuaranteeAfter": 9, "sparklyChance": 0.02, "firstBox": "gyoza", "spareLevels": { "C": [1, 2, 3, 4], "U": [1, 2, 3, 4], "R": [1, 1, 2, 2], "E": [1, 1, 2, 2], "L": [1, 1, 1, 1] }, "maxSquishyLevel": 5, "starsPerSpare": { "C": 5, "U": 15, "R": 40, "E": 100, "L": 300 }, "gemShop": { "legendary": 300, "exclusive": 500 }, "gemsEarned": { "dailyChallenge": 3, "weeklyStreak": 15, "weeklyStreakDays": 5, "achievementMin": 10, "achievementMax": 25 }, "gemPacks": [{ "id": "gems_100", "gems": 100 }, { "id": "gems_300", "gems": 300 }, { "id": "gems_500", "gems": 500 }, { "id": "gems_1000", "gems": 1000 }], "gemPricePer100Eur": 0.99, "cozy": { "pointsPerStep": 5, "coinBonusPerStep": 0.05 }, "daily": { "coinQuests": 2, "coinQuestReward": 40, "firstRunMultiplier": 2, "challengeOfBest": 0.9, "visitorDays": 4 }, "questPool": [{ "id": "play_any", "kind": "runs", "game": "any", "target": 3, "weight": 3, "text": "quest.play_any" }, { "id": "play_game", "kind": "runs", "game": "pick", "target": 2, "weight": 4, "text": "quest.play_game" }, { "id": "flowers", "kind": "metric", "game": "grow_grow_garden", "target": 30, "weight": 2, "text": "quest.flowers" }, { "id": "orders", "kind": "metric", "game": "bistro_rush", "target": 15, "weight": 2, "text": "quest.orders" }, { "id": "letters", "kind": "metric", "game": "sort_a_lot", "target": 30, "weight": 2, "text": "quest.letters" }, { "id": "sky_coins", "kind": "metric", "game": "sky_bounce", "target": 20, "weight": 2, "text": "quest.sky_coins" }, { "id": "guests", "kind": "metric", "game": "style_studio", "target": 5, "weight": 2, "text": "quest.guests" }, { "id": "squishes", "kind": "metric", "game": "squish_lab", "target": 10, "weight": 1, "text": "quest.squishes" }, { "id": "box", "kind": "boxes", "target": 1, "weight": 2, "text": "quest.box" }], "minigames": { "coinsPerMinuteTarget": 35, "milestoneBonus": [10, 25, 50], "levelFirstClear": 30, "levelReplay": 10, "perStar": 15, "everyTenthLevelMultiplier": 2, "serverMaxCoinsPerMinute": 60 }, "ads": { "closableAfterSeconds": 5, "keepGoingPerRun": 1, "freeBoxesPerDay": 3 }, "unlocks": [{ "when": "start", "houses": ["dumpling", "kitchen", "pets", "sweets", "fruit", "ocean", "sky", "forest"], "buildings": ["playground", "restaurant", "post", "factory", "gemmine", "market", "salon", "police", "fire", "testlab", "arcade", "bandstand", "greenhouse"], "built": ["playground", "restaurant", "post", "factory", "gemmine"], "gift": "bao" }] };
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
    questsAfterBox(state);
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
// a short run that reaches a milestone bonus is still paid in full. With a report (score, stars...) the run also
// moves today's quests on, and the day's first run pays double (firstRunMultiplier): "coins" is what may be paid.
function submitRun(state, game, seconds, coins, kind, report, multiplier) {
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
    var answer = { ok: true, coins: paid, capped: coins > most, first_today: false, quests_done: [] };
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
// Accounts (account.html "Accounts & saving"): every phone starts as a guest; the town is saved to the server;
// a grown-up can "save my town" with an email (a 6-digit code, no password) or move it to a new phone with a
// transfer code + PIN; an account can be deleted (gone after 30 days; logging back in before then cancels it).
//
// Moving a town to a phone = moving that phone's login (its device id) onto the town's account. The phone's own
// guest town is kept for 30 days, just in case, then deleted.
var SYSTEM_USER = "00000000-0000-0000-0000-000000000000";
var DAY_MS = 24 * 60 * 60 * 1000;
var GRACE_DAYS = 30;
var TOWN_MAX_BYTES = 512 * 1024;
var CODE_MINUTES = 15;
var CODE_TRIES = 5;
var EMAIL_SENDS_PER_HOUR = 5;
// no 0/O, 1/I: easy to read out and type
var CODE_LETTERS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
// The clock (tests move it on).
var clock = { now: function () { return Date.now(); } };
function readOne(nk, collection, key, userId) {
    var found = nk.storageRead([{ collection: collection, key: key, userId: userId }]);
    return found.length > 0 ? found[0] : null;
}
function writeOne(nk, collection, key, userId, value) {
    // read 1: the owner may read it; write 0: only the server writes
    nk.storageWrite([{ collection: collection, key: key, userId: userId, value: value, permissionRead: userId === SYSTEM_USER ? 0 : 1, permissionWrite: 0 }]);
}
function deleteOne(nk, collection, key, userId) {
    nk.storageDelete([{ collection: collection, key: key, userId: userId }]);
}
function randomCode(length, random) {
    var s = "";
    for (var i = 0; i < length; i++) {
        s += CODE_LETTERS.charAt(Math.floor(random() * CODE_LETTERS.length) % CODE_LETTERS.length);
    }
    return s;
}
function randomDigits(length, random) {
    var s = "";
    for (var i = 0; i < length; i++) {
        s += String(Math.floor(random() * 10) % 10);
    }
    return s;
}
function cleanEmail(email) {
    return String(email || "").replace(/^\s+|\s+$/g, "").toLowerCase();
}
function looksLikeEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
// "anna.k@example.com" -> "a•••@example.com" (what the phone may show)
function maskEmail(email) {
    var at = email.indexOf("@");
    return at <= 0 ? "" : email.charAt(0) + "•••" + email.substring(at);
}
// ---------------------------------------------------------------- the town in the cloud
// The phone's whole save (its sections, as JSON text) and how many times it was written (the newest wins).
function saveTown(nk, userId, town, revision) {
    if (typeof town !== "string" || town.length === 0) {
        return fail("bad_town");
    }
    if (town.length > TOWN_MAX_BYTES) {
        return fail("too_big");
    }
    var at = clock.now();
    writeOne(nk, "island", "town", userId, { town: town, revision: Math.max(0, Math.floor(revision) || 0), saved_at: at });
    return { ok: true, saved_at: at };
}
function loadTown(nk, userId) {
    var found = readOne(nk, "island", "town", userId);
    if (!found) {
        return { ok: true, town: null, revision: 0, saved_at: 0 };
    }
    return { ok: true, town: found.value.town, revision: found.value.revision || 0, saved_at: found.value.saved_at || 0 };
}
// A short description of a town (for "Which town?"): squishies owned, the Steamhouse's level, when saved.
function townSummary(nk, userId) {
    var state = readOne(nk, "island", "state", userId);
    var town = readOne(nk, "island", "town", userId);
    var squishies = state && state.value.collection ? Object.keys(state.value.collection).length : 0;
    var steamhouse = 0;
    if (town) {
        try {
            // the phone's save: {"version", "revision", "data": {section: ...}}
            var parsed = JSON.parse(town.value.town);
            var sections = parsed && parsed.data ? parsed.data : parsed;
            steamhouse = sections && sections.town && sections.town.levels ? Number(sections.town.levels.dumpling || 0) : 0;
        }
        catch (e) {
            steamhouse = 0;
        }
    }
    return { squishies: squishies, steamhouse: steamhouse, saved_at: town ? town.value.saved_at || 0 : 0 };
}
// ---------------------------------------------------------------- status
function accountStatus(nk, userId) {
    var info = readOne(nk, "island", "account", userId);
    var deletion = readOne(nk, "island", "deletion", userId);
    return {
        ok: true,
        linked: !!(info && info.value.email),
        email: info && info.value.email ? maskEmail(info.value.email) : "",
        deletion_after: deletion ? deletion.value.after : 0,
        town: townSummary(nk, userId)
    };
}
// ---------------------------------------------------------------- moving a phone's login onto another account
// The phone that called (deviceId, logged in as `fromUser`) now logs in to `toUser`. The phone's own guest account
// keeps its town for GRACE_DAYS (then it is deleted); `toUser`'s own deletion, if it asked for one, is cancelled.
function moveDevice(nk, fromUser, deviceId, toUser) {
    if (fromUser === toUser) {
        return { ok: true, same: true };
    }
    var devices = nk.accountGetId(fromUser).devices || [];
    var owns = false;
    for (var i = 0; i < devices.length; i++) {
        if (devices[i].id === deviceId) {
            owns = true;
        }
    }
    if (!owns) {
        return fail("not_this_phone");
    }
    // an account must always keep one way in: give the guest a spare (unused) one before taking the phone away
    nk.linkCustom(fromUser, "kept-" + fromUser);
    nk.unlinkDevice(fromUser, deviceId);
    nk.linkDevice(toUser, deviceId);
    scheduleDeletion(nk, fromUser);
    cancelDeletion(nk, toUser);
    return { ok: true };
}
// ---------------------------------------------------------------- transfer code + PIN (no email needed)
function transferCreate(nk, userId, random) {
    var code = "";
    for (var attempt = 0; attempt < 10; attempt++) {
        code = randomCode(8, random);
        if (!readOne(nk, "transfer", code, SYSTEM_USER)) {
            break;
        }
    }
    var pin = randomDigits(4, random);
    var until = clock.now() + DAY_MS;
    // one code at a time: a new one replaces the old one
    var old = readOne(nk, "island", "transfer", userId);
    if (old) {
        deleteOne(nk, "transfer", old.value.code, SYSTEM_USER);
    }
    writeOne(nk, "transfer", code, SYSTEM_USER, { user: userId, pin: pin, until: until, tries: 0 });
    writeOne(nk, "island", "transfer", userId, { code: code, until: until });
    return { ok: true, code: code.substring(0, 4) + "-" + code.substring(4), pin: pin, until: until };
}
// Find the town a code belongs to (and check the PIN). With confirm, move this phone onto it.
function transferUse(nk, userId, deviceId, codeText, pin, confirm) {
    var code = String(codeText || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
    var found = code.length === 8 ? readOne(nk, "transfer", code, SYSTEM_USER) : null;
    if (!found || found.value.until < clock.now()) {
        return fail("bad_code");
    }
    if (found.value.pin !== String(pin || "")) {
        var tries = (found.value.tries || 0) + 1;
        if (tries >= CODE_TRIES) {
            deleteOne(nk, "transfer", code, SYSTEM_USER);
        }
        else {
            writeOne(nk, "transfer", code, SYSTEM_USER, { user: found.value.user, pin: found.value.pin, until: found.value.until, tries: tries });
        }
        return fail("bad_pin");
    }
    var target = found.value.user;
    if (target === userId) {
        return fail("same_town");
    }
    if (!confirm) {
        return { ok: true, saved: townSummary(nk, target), phone: townSummary(nk, userId) };
    }
    var moved = moveDevice(nk, userId, deviceId, target);
    if (!moved.ok) {
        return moved;
    }
    // a code works once
    deleteOne(nk, "transfer", code, SYSTEM_USER);
    deleteOne(nk, "island", "transfer", target);
    return { ok: true };
}
// ---------------------------------------------------------------- email + 6-digit code
// Until the live server has a real email service, "emails" are written to the server's log (and, on a test server,
// shown on the phone too), so the whole flow can be tried on a laptop.
function sendEmail(nk, logger, to, code) {
    logger.info("EMAIL to %s: Your Squishy Island code is %s (it works for %d minutes).", to, code, CODE_MINUTES);
}
function canSend(nk, userId) {
    var found = readOne(nk, "island", "sends", userId);
    var now = clock.now();
    var times = found ? (found.value.times || []) : [];
    var recent = [];
    for (var i = 0; i < times.length; i++) {
        if (now - times[i] < 60 * 60 * 1000) {
            recent.push(times[i]);
        }
    }
    if (recent.length >= EMAIL_SENDS_PER_HOUR) {
        return false;
    }
    recent.push(now);
    writeOne(nk, "island", "sends", userId, { times: recent });
    return true;
}
// purpose "link": save this town with the email. purpose "login": bring back the town saved with that email.
function emailStart(nk, logger, userId, emailText, purpose, random, dev) {
    var email = cleanEmail(emailText);
    if (!looksLikeEmail(email)) {
        return fail("bad_email");
    }
    var hash = nk.sha256Hash(email);
    var owner = readOne(nk, "emails", hash, SYSTEM_USER);
    if (purpose === "link" && owner && owner.value.user !== userId) {
        return fail("email_taken");
    }
    if (purpose === "login" && !owner) {
        // say the same as when it works, so nobody can find out which emails have a town; just send nothing
        return { ok: true, email: maskEmail(email) };
    }
    if (!canSend(nk, userId)) {
        return fail("too_many");
    }
    var code = randomDigits(6, random);
    writeOne(nk, "island", "code", userId, { email: email, hash: hash, code: code, purpose: purpose, until: clock.now() + CODE_MINUTES * 60 * 1000, tries: 0 });
    sendEmail(nk, logger, email, code);
    var answer = { ok: true, email: maskEmail(email) };
    if (dev) {
        answer.dev_code = code;
    }
    return answer;
}
function emailConfirm(nk, userId, deviceId, codeText, confirm) {
    var pending = readOne(nk, "island", "code", userId);
    if (!pending || pending.value.until < clock.now()) {
        return fail("bad_code");
    }
    if (pending.value.code !== String(codeText || "").replace(/\s/g, "")) {
        var tries = (pending.value.tries || 0) + 1;
        if (tries >= CODE_TRIES) {
            deleteOne(nk, "island", "code", userId);
        }
        else {
            var v = pending.value;
            writeOne(nk, "island", "code", userId, { email: v.email, hash: v.hash, code: v.code, purpose: v.purpose, until: v.until, tries: tries });
        }
        return fail("bad_code");
    }
    var email = pending.value.email;
    var hash = pending.value.hash;
    if (pending.value.purpose === "link") {
        var owner = readOne(nk, "emails", hash, SYSTEM_USER);
        if (owner && owner.value.user !== userId) {
            return fail("email_taken");
        }
        writeOne(nk, "emails", hash, SYSTEM_USER, { user: userId });
        writeOne(nk, "island", "account", userId, { email: email, linked_at: clock.now() });
        deleteOne(nk, "island", "code", userId);
        return { ok: true, linked: true, email: maskEmail(email) };
    }
    // login: the town saved with this email
    var saved = readOne(nk, "emails", hash, SYSTEM_USER);
    if (!saved) {
        return fail("bad_code");
    }
    var target = saved.value.user;
    if (target === userId) {
        deleteOne(nk, "island", "code", userId);
        return { ok: true, same: true };
    }
    if (!confirm) {
        return { ok: true, saved: townSummary(nk, target), phone: townSummary(nk, userId) };
    }
    var moved = moveDevice(nk, userId, deviceId, target);
    if (moved.ok) {
        deleteOne(nk, "island", "code", userId);
    }
    return moved;
}
// ---------------------------------------------------------------- deleting
function scheduleDeletion(nk, userId) {
    var after = clock.now() + GRACE_DAYS * DAY_MS;
    writeOne(nk, "island", "deletion", userId, { after: after });
    writeOne(nk, "deletions", userId, SYSTEM_USER, { after: after });
    return after;
}
function cancelDeletion(nk, userId) {
    if (readOne(nk, "island", "deletion", userId)) {
        deleteOne(nk, "island", "deletion", userId);
        deleteOne(nk, "deletions", userId, SYSTEM_USER);
    }
}
// The phone forgets this account (it starts a new town); the account is deleted after GRACE_DAYS unless someone
// logs back in to it (email or transfer code) before then.
function deleteRequest(nk, userId) {
    return { ok: true, after: scheduleDeletion(nk, userId) };
}
// Deletes every account whose time is up (with its storage, email and codes). Run regularly on the live server.
function purgeDeleted(nk, logger) {
    var gone = 0;
    var cursor = undefined;
    var now = clock.now();
    do {
        var page = nk.storageList(SYSTEM_USER, "deletions", 100, cursor);
        var objects = page.objects || [];
        for (var i = 0; i < objects.length; i++) {
            var o = objects[i];
            if (o.value.after > now) {
                continue;
            }
            var userId = o.key;
            var info = readOne(nk, "island", "account", userId);
            if (info && info.value.email) {
                deleteOne(nk, "emails", nk.sha256Hash(info.value.email), SYSTEM_USER);
            }
            var transfer = readOne(nk, "island", "transfer", userId);
            if (transfer) {
                deleteOne(nk, "transfer", transfer.value.code, SYSTEM_USER);
            }
            try {
                nk.accountDeleteId(userId, false);
            }
            catch (e) {
                logger.warn("could not delete account %s: %s", userId, String(e));
                continue;
            }
            deleteOne(nk, "deletions", userId, SYSTEM_USER);
            gone += 1;
        }
        cursor = page.cursor;
    } while (cursor);
    logger.info("purge: %d accounts deleted", gone);
    return { ok: true, deleted: gone };
}
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
// ---------------------------------------------------------------- dates (days are "YYYY-MM-DD", the phone's own date)
function dayNumber(day) {
    var p = day.split("-");
    return Math.floor(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2])) / 86400000);
}
function dayText(n) {
    var d = new Date(n * 86400000);
    var pad = function (x) { return x < 10 ? "0" + x : String(x); };
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
}
// The phone says which day it is (its own time zone); it may not be more than a day away from the server's.
function checkDay(day) {
    var today = Math.floor(clock.now() / 86400000);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "") || Math.abs(dayNumber(day) - today) > 1) {
        return dayText(today);
    }
    return day;
}
// Monday-based week number (days since the epoch's Monday / 7): the same for every day of one week.
function weekOf(day) {
    return Math.floor((dayNumber(day) - 4) / 7); // 1970-01-01 was a Thursday; 1970-01-05 a Monday
}
// ---------------------------------------------------------------- random numbers from a text (the same every time)
function seededRandom(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    var a = h || 1;
    return function () {
        a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
// server/live-config.json (next to this module in the container). Missing or broken: nothing is changed (a broken
// file is reported in the server's log, so a typo never stops the game).
function readLiveFile(nk) {
    if (!nk) {
        return {};
    }
    var text = "";
    try {
        text = nk.fileRead(LIVE_FILE);
    }
    catch (e) {
        return {};
    }
    try {
        var v = JSON.parse(text);
        return v && typeof v === "object" ? v : {};
    }
    catch (e) {
        liveConfigProblem = "live-config.json is not valid JSON: " + String(e);
        return {};
    }
}
var LIVE_FILE = "live/live-config.json";
var liveConfigProblem = "";
function liveConfig(nk) {
    var daily = ECONOMY.daily || {};
    var gems = ECONOMY.gemsEarned || {};
    var c = {
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
function playable(games) {
    var out = [];
    for (var i = 0; i < games.length; i++) {
        if (games[i] && games[i].id && games[i].kind !== "toy") {
            out.push(games[i]);
        }
    }
    return out;
}
function hasGame(games, id) {
    for (var i = 0; i < games.length; i++) {
        if (games[i].id === id) {
            return true;
        }
    }
    return false;
}
// The Gem Challenge's game for a day: one of the player's games (not toys), never `avoid` (the day before's game).
function challengeGame(userId, day, games, cfg, avoid) {
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
function challengeFor(state, game, games, cfg) {
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
function questFrom(entry, games, random, reward) {
    if (!entry || !entry.id) {
        return null;
    }
    var game = String(entry.game || "any");
    if (entry.kind === "boxes") {
        game = "";
    }
    else if (game === "pick") {
        var list = playable(games);
        if (list.length === 0) {
            return null;
        }
        game = list[Math.floor(random() * list.length) % list.length].id;
    }
    else if (game !== "any" && !hasGame(games, game)) {
        return null; // a game the player hasn't built yet
    }
    return {
        id: String(entry.id), kind: String(entry.kind || "runs"), game: game, target: Math.max(1, Math.floor(Number(entry.target) || 1)),
        text: String(entry.text || ""), reward: Math.max(0, Math.floor(Number(entry.reward !== undefined ? entry.reward : reward))),
        progress: 0, claimed: false
    };
}
function makeDay(state, userId, day, games, cfg) {
    var random = seededRandom(userId + "/quests/" + day);
    var quests = [];
    var scheduled = cfg.schedule[day] && cfg.schedule[day].quests;
    if (scheduled && scheduled.length) {
        for (var i = 0; i < scheduled.length; i++) {
            var q = questFrom(scheduled[i], games, random, cfg.coinQuestReward);
            if (q) {
                quests.push(q);
            }
        }
    }
    else {
        // weighted picks from the pool, no quest twice
        var pool = [];
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
    var before = state.daily;
    var yesterday = before && before.day === dayText(dayNumber(day) - 1) && before.challenge ? before.challenge.game : "";
    return { day: day, quests: quests, challenge: challengeFor(state, challengeGame(userId, day, games, cfg, yesterday), games, cfg), first_run: false };
}
function todays(state, userId, day, games, cfg) {
    var d = state.daily;
    if (!d || d.day !== day) {
        d = makeDay(state, userId, day, games, cfg);
        state.daily = d;
    }
    return d;
}
function questsAnswer(state, userId, d, games, cfg) {
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
function getQuests(nk, state, userId, dayAsked, games) {
    var cfg = liveConfig(nk);
    var day = checkDay(dayAsked);
    var d = todays(state, userId, day, games || [], cfg);
    return questsAnswer(state, userId, d, games || [], cfg);
}
// A finished run moves today's quests on. Returns the ids of quests (and "challenge") that just got done.
function questsAfterRun(state, run) {
    var d = state.daily;
    var done = [];
    if (!d) {
        return done;
    }
    for (var i = 0; i < d.quests.length; i++) {
        var q = d.quests[i];
        var was = q.progress >= q.target;
        if (q.kind === "runs" && (q.game === "any" || q.game === run.game)) {
            q.progress = Math.min(q.target, q.progress + 1);
        }
        else if (q.kind === "metric" && q.game === run.game) {
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
        }
        else if (c.goal === "levels3" && run.won && run.stars >= 3 && run.prev_stars < 3) {
            // a new level won with ★★★ does it at once; otherwise two levels raised to ★★★
            c.progress = run.prev_stars === 0 ? c.target : c.progress + 1;
            c.done = c.progress >= c.target;
        }
        else if (c.goal === "song3" && run.won && (run.stars >= 3 || (run.stars >= 2 && run.newest))) {
            c.progress = 1;
            c.done = true;
        }
        if (c.done) {
            done.push("challenge");
        }
    }
    return done;
}
function questsAfterBox(state) {
    var d = state.daily;
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
function claimQuest(nk, state, dayAsked, id) {
    var cfg = liveConfig(nk);
    var d = state.daily;
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
// The Visitor of the week (guide.html "Daily visits"): every Monday a squishy from out of town camps in the park,
// preferring one the player doesn't own yet (Common to Epic). Saying hi (and giving it a treat) on 4 different days
// of that week makes it move in for free. Missed: it waves goodbye at the end of the week; next week someone else
// visits (a squishy you still don't have comes back another week). A visitor that arrives too late in the week for
// 4 visits (a new player starting on a Friday) stays until the end of the next week.
//
// Live config (server/live/live-config.json): "visitorEnabled" (false = nobody visits), "visitorDays" (days needed),
// "visitors": { "2026-11-02": "mochi" } (the Monday of a week -> who visits everyone that week).
var VISITOR_RARITIES = ["C", "U", "R", "E"];
function visitorConfig(nk) {
    var live = readLiveFile(nk);
    var days = Math.floor(Number(live.visitorDays));
    return {
        enabled: live.visitorEnabled !== false,
        days: days >= 1 ? days : ((ECONOMY.daily || {}).visitorDays || 4),
        visitors: live.visitors && typeof live.visitors === "object" ? live.visitors : {}
    };
}
// The Monday of a day's week ("2026-11-02").
function mondayOf(day) {
    return dayText(weekOf(day) * 7 + 4);
}
// Who visits this player this week: the live schedule's squishy, else a random one they don't own (Common to
// Epic; never last week's visitor if there is another choice). Everyone owned already: any Common to Epic.
function pickVisitor(state, userId, day, cfg, last) {
    var fixed = cfg.visitors[mondayOf(day)];
    if (fixed && squishyInfo(fixed)) {
        return fixed;
    }
    var unowned = [];
    var all = [];
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
function thisWeeksVisitor(state, userId, day, cfg) {
    var v = state.visitor;
    var week = weekOf(day);
    if (!v || week < v.week || week > (v.last_week || v.week)) {
        var daysLeft = 7 - (dayNumber(day) - 4 - week * 7); // today to Sunday
        v = { week: week, last_week: daysLeft < cfg.days ? week + 1 : week, id: pickVisitor(state, userId, day, cfg, v ? v.id : ""), days: [], moved_in: false };
        state.visitor = v;
    }
    return v;
}
function visitorAnswer(v, day, needed) {
    var info = squishyInfo(v.id);
    // until: the last day it is in the park (a Sunday)
    return {
        ok: true, squishy: v.id, rarity: info ? info.rarity : "C", days: v.days.length, needed: needed,
        today_done: v.days.indexOf(day) >= 0, moved_in: v.moved_in, until: dayText((v.last_week || v.week) * 7 + 10)
    };
}
// Answer: {"ok", "squishy" ("" = nobody visits this week), "rarity", "days", "needed", "today_done", "moved_in", "until"}.
function getVisitor(nk, state, userId, dayAsked) {
    var cfg = visitorConfig(nk);
    if (!cfg.enabled) {
        return { ok: true, squishy: "" };
    }
    var day = checkDay(dayAsked);
    return visitorAnswer(thisWeeksVisitor(state, userId, day, cfg), day, cfg.days);
}
// Say hi and give a treat (once a day). On the last day needed it moves in: the answer also has "entry" and "is_new"
// (a squishy you got meanwhile goes onto the Spare Shelf, like a box's).
function visitorHi(nk, state, userId, dayAsked) {
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
        var report = undefined;
        var multiplier = 1;
        if (p.day) {
            // the day's quests count this run (they are made now if the quest board wasn't opened yet today)
            var cfg = liveConfig(nk);
            todays(s, user, checkDay(String(p.day)), (p.games || []), cfg);
            multiplier = cfg.firstRunMultiplier;
            report = {
                game: String(p.game || ""), score: Number(p.score) || 0, metric: Number(p.metric) || 0, won: p.won === true,
                level: Number(p.level) || 0, stars: Number(p.stars) || 0, prev_stars: Number(p.prev_stars) || 0, newest: p.newest === true
            };
        }
        return submitRun(s, String(p.game || ""), Number(p.seconds), Math.floor(Number(p.coins)), String(p.kind || "endless"), report, multiplier);
    }));
}
function isDev(ctx) {
    return !!ctx.env && ctx.env["SQUISHY_DEV"] === "1";
}
// Runs fn for the logged-in player (user id and payload), or answers "no_account".
function asPlayer(ctx, payload, fn) {
    if (!ctx.userId) {
        return JSON.stringify(fail("no_account"));
    }
    return JSON.stringify(fn(ctx.userId, parse(payload)));
}
// (Nakama needs every RPC to be a plain function declared at the top, so each one is written out.)
function rpcSaveTown(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) { return saveTown(nk, user, p.town, Number(p.revision)); });
}
function rpcLoadTown(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) { return loadTown(nk, user); });
}
function rpcAccountStatus(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) { return accountStatus(nk, user); });
}
function rpcTransferCreate(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) { return transferCreate(nk, user, Math.random); });
}
function rpcTransferUse(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) { return transferUse(nk, user, String(p.device_id || ""), String(p.code || ""), String(p.pin || ""), p.confirm === true); });
}
function rpcEmailStart(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) { return emailStart(nk, logger, user, String(p.email || ""), p.purpose === "login" ? "login" : "link", Math.random, isDev(ctx)); });
}
function rpcEmailConfirm(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) { return emailConfirm(nk, user, String(p.device_id || ""), String(p.code || ""), p.confirm === true); });
}
function rpcQuests(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) {
        return withState(nk, user, function (s) { return getQuests(nk, s, user, String(p.day || ""), (p.games || [])); });
    });
}
function rpcQuestClaim(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) {
        return withState(nk, user, function (s) { return claimQuest(nk, s, String(p.day || ""), String(p.id || "")); });
    });
}
function rpcVisitor(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) {
        return withState(nk, user, function (s) { loadState(s); return getVisitor(nk, s, user, String(p.day || "")); });
    });
}
function rpcVisitorHi(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) {
        return withState(nk, user, function (s) { loadState(s); return visitorHi(nk, s, user, String(p.day || "")); });
    });
}
function rpcDeleteRequest(ctx, logger, nk, payload) {
    return asPlayer(ctx, payload, function (user, p) { return deleteRequest(nk, user); });
}
// Server-to-server only (no player: called with the server's http key, e.g. by a nightly job on the live server).
function rpcPurgeDeleted(ctx, logger, nk, payload) {
    if (ctx.userId) {
        return JSON.stringify(fail("not_allowed"));
    }
    return JSON.stringify(purgeDeleted(nk, logger));
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
    initializer.registerRpc("save_town", rpcSaveTown);
    initializer.registerRpc("load_town", rpcLoadTown);
    initializer.registerRpc("account_status", rpcAccountStatus);
    initializer.registerRpc("transfer_create", rpcTransferCreate);
    initializer.registerRpc("transfer_use", rpcTransferUse);
    initializer.registerRpc("email_start", rpcEmailStart);
    initializer.registerRpc("email_confirm", rpcEmailConfirm);
    initializer.registerRpc("delete_request", rpcDeleteRequest);
    initializer.registerRpc("quests", rpcQuests);
    initializer.registerRpc("quest_claim", rpcQuestClaim);
    initializer.registerRpc("visitor", rpcVisitor);
    initializer.registerRpc("visitor_hi", rpcVisitorHi);
    initializer.registerRpc("purge_deleted", rpcPurgeDeleted);
    logger.info("Squishy Island server ready: %d squishies, %d box kinds", SQUISHIES.length, Object.keys(ECONOMY.boxes).length);
}
