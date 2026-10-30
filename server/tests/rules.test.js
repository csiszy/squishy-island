// The server's rules, run without Nakama: build/index.js is loaded the way Nakama loads it (one script with global
// functions) next to a pretend Nakama (storage in memory). Run: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// a pretend Nakama: storage with versions, like the real one (a write with an old version fails)
function fakeNakama() {
  const store = {};
  let n = 0;
  return {
    store,
    storageRead(keys) {
      return keys.map(k => store[`${k.userId}/${k.collection}/${k.key}`]).filter(Boolean).map(o => JSON.parse(JSON.stringify(o)));
    },
    storageWrite(objects) {
      return objects.map(o => {
        const id = `${o.userId}/${o.collection}/${o.key}`;
        const cur = store[id];
        if (o.version === '*' ? cur : (o.version && (!cur || cur.version !== o.version))) {
          throw new Error('version check failed');
        }
        store[id] = { collection: o.collection, key: o.key, userId: o.userId, value: JSON.parse(JSON.stringify(o.value)), version: String(++n) };
        return { version: store[id].version };
      });
    },
  };
}

function load(seed = 1) {
  const ctx = vm.createContext({ console });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'build', 'index.js'), 'utf8'), ctx);
  // the same random numbers every time
  let s = seed;
  ctx.__random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  vm.runInContext('Math.random = __random;', ctx);
  const rpcs = {};
  const logger = { info() {}, warn() {}, error() {} };
  const nk = fakeNakama();
  ctx.InitModule({}, logger, nk, { registerRpc: (id, fn) => { rpcs[id] = fn; } });
  const call = (user, id, payload = {}) => JSON.parse(rpcs[id]({ userId: user }, logger, nk, JSON.stringify(payload)));
  return { ctx, rpcs, nk, call };
}

test('a new player gets the starter squishy, once', () => {
  const { call } = load();
  const a = call('u1', 'load_state');
  assert.equal(a.ok, true);
  assert.deepEqual(Object.keys(a.collection), ['bao']);
  const b = call('u1', 'load_state');
  assert.deepEqual(b.collection, a.collection);
  assert.equal(call('u2', 'load_state').collection.bao.level, 1, 'every player has their own state');
});

test('the tutorial box is always the same squishy, only once', () => {
  const { call } = load();
  const a = call('u1', 'open_box', { kind: 'mystery', first_box: true });
  assert.equal(a.squishy, 'gyoza');
  assert.equal(a.is_new, true);
  const b = call('u1', 'open_box', { kind: 'mystery', first_box: true });
  assert.equal(b.ok, true);
  assert.ok(b.boxes_opened === 2);
});

test('box odds and the Rare guarantee', () => {
  const { ctx, call } = load(7);
  const counts = { C: 0, U: 0, R: 0, E: 0, L: 0 };
  let streak = 0, longest = 0;
  for (let i = 0; i < 4000; i++) {
    const r = call('u1', 'open_box', { kind: 'mystery' });
    assert.equal(r.ok, true);
    counts[r.rarity]++;
    streak = r.rarity === 'C' || r.rarity === 'U' ? streak + 1 : 0;
    longest = Math.max(longest, streak);
  }
  assert.ok(longest <= 9, `never more than 9 Common/Uncommon boxes in a row (was ${longest})`);
  assert.ok(counts.C / 4000 > 0.4 && counts.C / 4000 < 0.6, `about 55% Common, minus the guarantee (${counts.C})`);
  assert.ok(counts.L > 10, 'Legendaries happen');
  const golden = call('u2', 'open_box', { kind: 'golden' });
  assert.notEqual(golden.rarity, 'C');
});

test('Family Boxes only roll that family', () => {
  const { ctx, call } = load(3);
  const ocean = new Set(ctx.SQUISHIES.filter(s => s.family === 'ocean').map(s => s.id));
  for (let i = 0; i < 200; i++) {
    const r = call('u1', 'open_box', { kind: 'family', family: 'ocean' });
    assert.ok(ocean.has(r.squishy), r.squishy);
  }
  assert.equal(call('u1', 'open_box', { kind: 'nothing' }).error, 'unknown_box');
});

test('spares level a squishy up and swap for Stars', () => {
  const { call, nk } = load(5);
  call('u1', 'load_state');
  // give bao two spares by hand
  const key = 'u1/island/state';
  nk.store[key].value.collection.bao.spares = 3;
  const up = call('u1', 'level_up', { id: 'bao' });
  assert.equal(up.ok, true);
  assert.equal(up.entry.level, 2);
  assert.equal(up.entry.spares, 2, 'a Common needs 1 spare for level 2');
  const swap = call('u1', 'swap_spare', { id: 'bao' });
  assert.equal(swap.stars, 5, 'a Common spare is worth 5 Stars');
  assert.equal(call('u1', 'level_up', { id: 'bao' }).error, 'no_spares', 'level 3 needs 2 spares, it has 1');
});

test('you cannot level up what you do not own, or without spares', () => {
  const { call } = load();
  call('u1', 'load_state');
  assert.equal(call('u1', 'level_up', { id: 'whale' }).error, 'not_owned');
  assert.equal(call('u1', 'level_up', { id: 'bao' }).error, 'no_spares');
  assert.equal(call('u1', 'swap_spare', { id: 'bao' }).error, 'no_spares');
});

test('impossible coin amounts are refused', () => {
  const { call } = load();
  const ok = call('u1', 'submit_run', { game: 'sky_bounce', seconds: 120, coins: 70, kind: 'endless' });
  assert.deepEqual([ok.coins, ok.capped], [70, false]);
  const greedy = call('u1', 'submit_run', { game: 'sky_bounce', seconds: 30, coins: 5000, kind: 'endless' });
  assert.deepEqual([greedy.coins, greedy.capped], [60, true], 'a short run counts as a minute: at most 60');
  const level = call('u1', 'submit_run', { game: 'bucket_brigade', seconds: 20, coins: 150, kind: 'levels' });
  assert.equal(level.coins, 150, 'a big level\'s first clear is always allowed');
  assert.equal(call('u1', 'submit_run', { game: '', seconds: 1, coins: 1 }).error, 'bad_run');
  assert.equal(call('u1', 'submit_run', { game: 'x', seconds: -1, coins: 1 }).error, 'bad_run');
});

test('two taps at once never lose a box', () => {
  const { call, nk } = load(9);
  call('u1', 'load_state');
  // someone else saves between our read and our write: the server reads again and redoes it
  const realWrite = nk.storageWrite.bind(nk);
  let sneaky = true;
  nk.storageWrite = (objects) => {
    if (sneaky) {
      sneaky = false;
      const cur = nk.store['u1/island/state'];
      realWrite([{ ...cur, value: { ...cur.value, boxes_opened: cur.value.boxes_opened + 1 }, version: cur.version }]);
    }
    return realWrite(objects);
  };
  const r = call('u1', 'open_box', { kind: 'mystery' });
  assert.equal(r.ok, true);
  assert.equal(nk.store['u1/island/state'].value.boxes_opened, 2, 'both boxes counted');
});

test('no account, no state', () => {
  const { rpcs } = load();
  const r = JSON.parse(rpcs.load_state({ userId: '' }, { info() {} }, {}, ''));
  assert.equal(r.error, 'no_account');
});
