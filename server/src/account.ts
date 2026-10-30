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
var clock = { now: function (): number { return Date.now(); } };

function readOne(nk: nkruntime.Nakama, collection: string, key: string, userId: string): nkruntime.StorageObject | null {
  var found = nk.storageRead([{ collection: collection, key: key, userId: userId }]);
  return found.length > 0 ? found[0] : null;
}

function writeOne(nk: nkruntime.Nakama, collection: string, key: string, userId: string, value: { [k: string]: any }): void {
  // read 1: the owner may read it; write 0: only the server writes
  nk.storageWrite([{ collection: collection, key: key, userId: userId, value: value, permissionRead: userId === SYSTEM_USER ? 0 : 1, permissionWrite: 0 }]);
}

function deleteOne(nk: nkruntime.Nakama, collection: string, key: string, userId: string): void {
  nk.storageDelete([{ collection: collection, key: key, userId: userId }]);
}

function randomCode(length: number, random: () => number): string {
  var s = "";
  for (var i = 0; i < length; i++) {
    s += CODE_LETTERS.charAt(Math.floor(random() * CODE_LETTERS.length) % CODE_LETTERS.length);
  }
  return s;
}

function randomDigits(length: number, random: () => number): string {
  var s = "";
  for (var i = 0; i < length; i++) {
    s += String(Math.floor(random() * 10) % 10);
  }
  return s;
}

function cleanEmail(email: string): string {
  return String(email || "").replace(/^\s+|\s+$/g, "").toLowerCase();
}

function looksLikeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// "anna.k@example.com" -> "a•••@example.com" (what the phone may show)
function maskEmail(email: string): string {
  var at = email.indexOf("@");
  return at <= 0 ? "" : email.charAt(0) + "•••" + email.substring(at);
}

// ---------------------------------------------------------------- the town in the cloud

// The phone's whole save (its sections, as JSON text) and how many times it was written (the newest wins).
function saveTown(nk: nkruntime.Nakama, userId: string, town: string, revision: number): Answer {
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

function loadTown(nk: nkruntime.Nakama, userId: string): Answer {
  var found = readOne(nk, "island", "town", userId);
  if (!found) {
    return { ok: true, town: null, revision: 0, saved_at: 0 };
  }
  return { ok: true, town: found.value.town, revision: found.value.revision || 0, saved_at: found.value.saved_at || 0 };
}

// A short description of a town (for "Which town?"): squishies owned, the Steamhouse's level, when saved.
function townSummary(nk: nkruntime.Nakama, userId: string): { [k: string]: any } {
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
    } catch (e) {
      steamhouse = 0;
    }
  }
  return { squishies: squishies, steamhouse: steamhouse, saved_at: town ? town.value.saved_at || 0 : 0 };
}

// ---------------------------------------------------------------- status

function accountStatus(nk: nkruntime.Nakama, userId: string): Answer {
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
function moveDevice(nk: nkruntime.Nakama, fromUser: string, deviceId: string, toUser: string): Answer {
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

function transferCreate(nk: nkruntime.Nakama, userId: string, random: () => number): Answer {
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
function transferUse(nk: nkruntime.Nakama, userId: string, deviceId: string, codeText: string, pin: string, confirm: boolean): Answer {
  var code = String(codeText || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  var found = code.length === 8 ? readOne(nk, "transfer", code, SYSTEM_USER) : null;
  if (!found || found.value.until < clock.now()) {
    return fail("bad_code");
  }
  if (found.value.pin !== String(pin || "")) {
    var tries = (found.value.tries || 0) + 1;
    if (tries >= CODE_TRIES) {
      deleteOne(nk, "transfer", code, SYSTEM_USER);
    } else {
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
function sendEmail(nk: nkruntime.Nakama, logger: nkruntime.Logger, to: string, code: string): void {
  logger.info("EMAIL to %s: Your Squishy Island code is %s (it works for %d minutes).", to, code, CODE_MINUTES);
}

function canSend(nk: nkruntime.Nakama, userId: string): boolean {
  var found = readOne(nk, "island", "sends", userId);
  var now = clock.now();
  var times: number[] = found ? (found.value.times || []) : [];
  var recent: number[] = [];
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
function emailStart(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string, emailText: string, purpose: string, random: () => number, dev: boolean): Answer {
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
  var answer: Answer = { ok: true, email: maskEmail(email) };
  if (dev) {
    answer.dev_code = code;
  }
  return answer;
}

function emailConfirm(nk: nkruntime.Nakama, userId: string, deviceId: string, codeText: string, confirm: boolean): Answer {
  var pending = readOne(nk, "island", "code", userId);
  if (!pending || pending.value.until < clock.now()) {
    return fail("bad_code");
  }
  if (pending.value.code !== String(codeText || "").replace(/\s/g, "")) {
    var tries = (pending.value.tries || 0) + 1;
    if (tries >= CODE_TRIES) {
      deleteOne(nk, "island", "code", userId);
    } else {
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

function scheduleDeletion(nk: nkruntime.Nakama, userId: string): number {
  var after = clock.now() + GRACE_DAYS * DAY_MS;
  writeOne(nk, "island", "deletion", userId, { after: after });
  writeOne(nk, "deletions", userId, SYSTEM_USER, { after: after });
  return after;
}

function cancelDeletion(nk: nkruntime.Nakama, userId: string): void {
  if (readOne(nk, "island", "deletion", userId)) {
    deleteOne(nk, "island", "deletion", userId);
    deleteOne(nk, "deletions", userId, SYSTEM_USER);
  }
}

// The phone forgets this account (it starts a new town); the account is deleted after GRACE_DAYS unless someone
// logs back in to it (email or transfer code) before then.
function deleteRequest(nk: nkruntime.Nakama, userId: string): Answer {
  return { ok: true, after: scheduleDeletion(nk, userId) };
}

// Deletes every account whose time is up (with its storage, email and codes). Run regularly on the live server.
function purgeDeleted(nk: nkruntime.Nakama, logger: nkruntime.Logger): Answer {
  var gone = 0;
  var cursor: string | undefined = undefined;
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
      } catch (e) {
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
