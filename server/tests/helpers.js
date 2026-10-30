// Shared by the server tests: build/index.js loaded the way Nakama loads it, next to a pretend Nakama (storage with
// versions, accounts with their ways in), so the rules can be tested without running Nakama.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

function fakeNakama() {
  const store = {};
  const accounts = {};   // userId -> {devices: Set, custom: Set}
  let n = 0;
  const files = {};      // the module folder's files (live-config.json)
  const nk = {
    store, accounts, files,
    fileRead(p) { if (!(p in files)) throw new Error('no such file'); return files[p]; },
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
    storageDelete(keys) { keys.forEach(k => { delete store[`${k.userId}/${k.collection}/${k.key}`]; }); },
    storageList(userId, collection) {
      return { objects: Object.values(store).filter(o => o.userId === userId && o.collection === collection).map(o => JSON.parse(JSON.stringify(o))) };
    },
    // accounts: a phone logs in with its device id; each account keeps at least one way in
    login(deviceId) {
      for (const [id, a] of Object.entries(accounts)) if (a.devices.has(deviceId)) return id;
      const id = 'user-' + (Object.keys(accounts).length + 1);
      accounts[id] = { devices: new Set([deviceId]), custom: new Set() };
      return id;
    },
    accountGetId(userId) {
      const a = accounts[userId];
      if (!a) throw new Error('no such account');
      return { user: { id: userId }, devices: [...a.devices].map(id => ({ id })) };
    },
    linkDevice(userId, deviceId) {
      for (const a of Object.values(accounts)) if (a.devices.has(deviceId)) throw new Error('device in use');
      accounts[userId].devices.add(deviceId);
    },
    unlinkDevice(userId, deviceId) {
      const a = accounts[userId];
      if (a.devices.size + a.custom.size <= 1) throw new Error('cannot unlink the last way in');
      a.devices.delete(deviceId);
    },
    linkCustom(userId, customId) { accounts[userId].custom.add(customId); },
    accountDeleteId(userId) {
      delete accounts[userId];
      for (const k of Object.keys(store)) if (k.startsWith(userId + '/')) delete store[k];
    },
    sha256Hash(s) { return crypto.createHash('sha256').update(s).digest('hex'); },
  };
  return nk;
}

function load(seed = 1, env = {}) {
  const ctx = vm.createContext({ console });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'build', 'index.js'), 'utf8'), ctx);
  let s = seed;
  ctx.__random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  vm.runInContext('Math.random = __random;', ctx);
  let now = Date.UTC(2026, 9, 30);
  ctx.__now = () => now;
  vm.runInContext('clock.now = __now;', ctx);
  const rpcs = {};
  const logs = [];
  const logger = { info: (...a) => logs.push(a), warn() {}, error() {} };
  const nk = fakeNakama();
  ctx.InitModule({}, logger, nk, { registerRpc: (id, fn) => { rpcs[id] = fn; } });
  const call = (user, id, payload = {}) => JSON.parse(rpcs[id]({ userId: user, env }, logger, nk, JSON.stringify(payload)));
  const later = days => { now += days * 24 * 3600 * 1000; };
  return { ctx, rpcs, nk, call, logs, later };
}

module.exports = { load, fakeNakama };
