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
