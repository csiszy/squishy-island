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
    initializer.registerRpc("purge_deleted", rpcPurgeDeleted);
    logger.info("Squishy Island server ready: %d squishies, %d box kinds", SQUISHIES.length, Object.keys(ECONOMY.boxes).length);
}
