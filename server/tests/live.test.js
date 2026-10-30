// Talks to a running server over the network, like the game does (game/core/server/nakama_game_server.gd).
// Start the server first (docker compose up -d), then: npm run test:live   (another address: SERVER=http://ip:7350)
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

const SERVER = process.env.SERVER || 'http://127.0.0.1:7350';
const KEY = process.env.SERVER_KEY || 'squishy-island-dev';

async function login(deviceId) {
  const r = await fetch(`${SERVER}/v2/account/authenticate/device?create=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(KEY + ':').toString('base64') },
    body: JSON.stringify({ id: deviceId }),
  });
  assert.equal(r.status, 200, await r.clone().text());
  return (await r.json()).token;
}

async function rpc(token, id, payload = {}) {
  const r = await fetch(`${SERVER}/v2/rpc/${id}?unwrap=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(payload),
  });
  assert.equal(r.status, 200, await r.clone().text());
  return r.json();
}

test('a phone logs in as a guest and plays', async () => {
  const device = 'test-' + crypto.randomUUID();
  const token = await login(device);
  assert.equal((await rpc(token, 'hello')).server, 'squishy-island');
  const state = await rpc(token, 'load_state');
  assert.deepEqual(Object.keys(state.collection), ['bao']);
  const box = await rpc(token, 'open_box', { kind: 'mystery', first_box: true });
  assert.equal(box.squishy, 'gyoza');
  const run = await rpc(token, 'submit_run', { game: 'sky_bounce', seconds: 30, coins: 999, kind: 'endless' });
  assert.deepEqual([run.coins, run.capped], [60, true]);
  // the same phone logging in again finds its squishies
  const again = await login(device);
  assert.deepEqual(Object.keys((await rpc(again, 'load_state')).collection).sort(), ['bao', 'gyoza']);
});

test('without logging in, nothing works', async () => {
  const r = await fetch(`${SERVER}/v2/rpc/load_state?unwrap=true`, { method: 'POST', body: '{}' });
  assert.equal(r.status, 401);
});

test('a wrong server key is refused', async () => {
  const r = await fetch(`${SERVER}/v2/account/authenticate/device?create=true`, {
    method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from('wrong:').toString('base64') }, body: JSON.stringify({ id: 'x-' + crypto.randomUUID() }),
  });
  assert.equal(r.status, 401);
});

test('moving a town to a new phone with a transfer code', async () => {
  const oldPhone = 'test-' + crypto.randomUUID();
  const newPhone = 'test-' + crypto.randomUUID();
  const a = await login(oldPhone);
  await rpc(a, 'load_state');
  await rpc(a, 'open_box', { kind: 'mystery', first_box: true });
  await rpc(a, 'save_town', { town: JSON.stringify({ town: { levels: { dumpling: 3 } } }), revision: 5 });
  const made = await rpc(a, 'transfer_create');
  const b = await login(newPhone);
  await rpc(b, 'load_state');
  const look = await rpc(b, 'transfer_use', { code: made.code, pin: made.pin, device_id: newPhone });
  assert.equal(look.saved.squishies, 2);
  assert.equal((await rpc(b, 'transfer_use', { code: made.code, pin: made.pin, device_id: newPhone, confirm: true })).ok, true);
  // the new phone logs in again and finds the saved town
  const again = await login(newPhone);
  assert.deepEqual(Object.keys((await rpc(again, 'load_state')).collection).sort(), ['bao', 'gyoza']);
  assert.equal((await rpc(again, 'load_town')).revision, 5);
});

test('an email code on a test server', async () => {
  const phone = 'test-' + crypto.randomUUID();
  const t = await login(phone);
  const email = `p${Date.now()}@example.com`;
  const start = await rpc(t, 'email_start', { email, purpose: 'link' });
  assert.match(start.dev_code, /^\d{6}$/, 'the laptop server shows the code (SQUISHY_DEV)');
  assert.equal((await rpc(t, 'email_confirm', { code: start.dev_code })).linked, true);
});

test('daily quests and a run that counts for them', async () => {
  const t = await login('test-' + crypto.randomUUID());
  await rpc(t, 'load_state');
  const day = new Date().toISOString().slice(0, 10);
  const games = [{ id: 'sky_bounce', kind: 'endless' }];
  const q = await rpc(t, 'quests', { day, games });
  assert.equal(q.ok, true, JSON.stringify(q));
  assert.equal(q.challenge.game, 'sky_bounce');
  const run = await rpc(t, 'submit_run', { game: 'sky_bounce', seconds: 60, coins: 20, kind: 'endless', day, games, score: 50 });
  assert.deepEqual([run.coins, run.first_today], [40, true]);
  assert.ok(run.quests_done.includes('challenge'), 'a new player\'s first challenge is small');
  assert.equal((await rpc(t, 'quest_claim', { day, id: 'challenge' })).gems, 3);
});

test('the visitor of the week: say hi once a day', async () => {
  const token = await login('test-' + crypto.randomUUID());
  const day = new Date().toISOString().slice(0, 10);
  const v = await rpc(token, 'visitor', { day });
  assert.equal(v.ok, true);
  assert.ok(v.squishy && v.needed >= 1, JSON.stringify(v));
  const hi = await rpc(token, 'visitor_hi', { day });
  assert.deepEqual([hi.ok, hi.days, hi.today_done], [true, 1, true]);
  assert.equal((await rpc(token, 'visitor_hi', { day })).error, 'already_today');
});
