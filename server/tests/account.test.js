// Accounts (account.html): cloud save, transfer code + PIN, email + 6-digit code, deleting after 30 days.
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./helpers');

function twoPhones(env = {}) {
  const t = load(3, env);
  const a = t.nk.login('phone-a');
  const b = t.nk.login('phone-b');
  t.call(a, 'load_state');
  t.call(b, 'load_state');
  return { ...t, a, b };
}

test('the town is saved to the cloud and comes back', () => {
  const { call, a } = twoPhones();
  assert.equal(call(a, 'load_town').town, null, 'nothing saved yet');
  const town = JSON.stringify({ town: { levels: { dumpling: 4 } }, economy: { coins: 1234 } });
  assert.equal(call(a, 'save_town', { town, revision: 7 }).ok, true);
  const back = call(a, 'load_town');
  assert.deepEqual([back.town, back.revision], [town, 7]);
  assert.equal(call(a, 'save_town', { town: 'x'.repeat(600 * 1024), revision: 8 }).error, 'too_big');
  assert.equal(call(a, 'save_town', { town: '', revision: 8 }).error, 'bad_town');
});

test('a transfer code + PIN moves the town to a new phone, once', () => {
  const { call, nk, a, b } = twoPhones();
  call(a, 'save_town', { town: JSON.stringify({ version: 1, revision: 3, data: { town: { levels: { dumpling: 9 } } } }), revision: 3 });
  call(a, 'open_box', { kind: 'mystery' });
  const made = call(a, 'transfer_create');
  assert.match(made.code, /^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
  assert.match(made.pin, /^\d{4}$/);
  // the new phone looks first: "Which town?"
  const look = call(b, 'transfer_use', { code: made.code.toLowerCase(), pin: made.pin, device_id: 'phone-b' });
  assert.deepEqual([look.saved.squishies, look.saved.steamhouse, look.phone.squishies], [2, 9, 1]);
  assert.equal(nk.login('phone-b'), b, 'only looked: the phone is still its own town');
  const moved = call(b, 'transfer_use', { code: made.code, pin: made.pin, device_id: 'phone-b', confirm: true });
  assert.equal(moved.ok, true);
  assert.equal(nk.login('phone-b'), a, 'the new phone now logs in to the saved town');
  assert.ok(call(b, 'account_status').deletion_after > 0, 'the phone\'s own guest town is kept 30 days, then deleted');
  assert.equal(call(b, 'transfer_use', { code: made.code, pin: made.pin, device_id: 'phone-b' }).error, 'bad_code', 'a code works once');
});

test('wrong PINs: five tries, then the code is gone; codes run out after a day', () => {
  const { call, a, b, later } = twoPhones();
  const made = call(a, 'transfer_create');
  for (let i = 0; i < 4; i++) assert.equal(call(b, 'transfer_use', { code: made.code, pin: '0000' === made.pin ? '1111' : '0000', device_id: 'phone-b' }).error, 'bad_pin');
  call(b, 'transfer_use', { code: made.code, pin: '0000' === made.pin ? '1111' : '0000', device_id: 'phone-b' });
  assert.equal(call(b, 'transfer_use', { code: made.code, pin: made.pin, device_id: 'phone-b' }).error, 'bad_code');
  const fresh = call(a, 'transfer_create');
  later(1.1);
  assert.equal(call(b, 'transfer_use', { code: fresh.code, pin: fresh.pin, device_id: 'phone-b' }).error, 'bad_code', 'valid for 24 hours');
  assert.equal(call(b, 'transfer_use', { code: 'AAAA-AAAA', pin: '1234', device_id: 'phone-c' }).error, 'bad_code');
});

test('a phone can only move its own login', () => {
  const { call, a, b } = twoPhones();
  const made = call(a, 'transfer_create');
  assert.equal(call(b, 'transfer_use', { code: made.code, pin: made.pin, device_id: 'phone-a', confirm: true }).error, 'not_this_phone');
});

test('saving the town with an email and a 6-digit code, then bringing it back on a new phone', () => {
  const { call, nk, logs, a, b } = twoPhones({ SQUISHY_DEV: '1' });
  assert.equal(call(a, 'email_start', { email: 'not an email', purpose: 'link' }).error, 'bad_email');
  const start = call(a, 'email_start', { email: ' Parent@Example.com ', purpose: 'link' });
  assert.equal(start.email, 'p•••@example.com', 'the phone only shows a hint of the email');
  assert.match(start.dev_code, /^\d{6}$/, 'a test server shows the code');
  assert.ok(logs.some(l => String(l[0]).startsWith('EMAIL to') && l.includes('parent@example.com')), '"sent" to the server log');
  assert.equal(call(a, 'email_confirm', { code: '000000' === start.dev_code ? '111111' : '000000' }).error, 'bad_code');
  assert.equal(call(a, 'email_confirm', { code: start.dev_code }).linked, true);
  const status = call(a, 'account_status');
  assert.deepEqual([status.linked, status.email], [true, 'p•••@example.com']);
  // another town can't take the same email
  assert.equal(call(b, 'email_start', { email: 'parent@example.com', purpose: 'link' }).error, 'email_taken');
  // the new phone: "I already have a town"
  const login = call(b, 'email_start', { email: 'PARENT@example.com', purpose: 'login' });
  const look = call(b, 'email_confirm', { code: login.dev_code, device_id: 'phone-b' });
  assert.equal(look.saved.squishies, 1);
  assert.equal(call(b, 'email_confirm', { code: login.dev_code, device_id: 'phone-b', confirm: true }).ok, true);
  assert.equal(nk.login('phone-b'), a);
});

test('an email with no town gives nothing away, and codes are not shown on the live server', () => {
  const { call, logs, b } = twoPhones();
  const r = call(b, 'email_start', { email: 'nobody@example.com', purpose: 'login' });
  assert.deepEqual([r.ok, r.email], [true, 'n•••@example.com']);
  assert.equal(logs.filter(l => String(l[0]).startsWith('EMAIL')).length, 0, 'nothing sent');
  const link = call(b, 'email_start', { email: 'someone@example.com', purpose: 'link' });
  assert.equal(link.dev_code, undefined, 'no SQUISHY_DEV: the code only goes by email');
});

test('at most 5 emails an hour', () => {
  const { call, a, later } = twoPhones();
  for (let i = 0; i < 5; i++) assert.equal(call(a, 'email_start', { email: 'p@example.com', purpose: 'link' }).ok, true);
  assert.equal(call(a, 'email_start', { email: 'p@example.com', purpose: 'link' }).error, 'too_many');
  later(0.05);
  assert.equal(call(a, 'email_start', { email: 'p@example.com', purpose: 'link' }).ok, true, 'an hour later it works again');
});

test('deleting: gone after 30 days, unless someone logs back in first', () => {
  const t = twoPhones({ SQUISHY_DEV: '1' });
  const { call, nk, a, b, later, rpcs } = t;
  const purge = () => JSON.parse(rpcs.purge_deleted({ userId: '' }, { info() {}, warn() {} }, nk, ''));
  // a saves with an email, then asks to be deleted
  const start = call(a, 'email_start', { email: 'p@example.com', purpose: 'link' });
  call(a, 'email_confirm', { code: start.dev_code });
  assert.ok(call(a, 'delete_request').after > 0);
  later(10);
  assert.equal(purge().deleted, 0, 'not yet');
  // 10 days later the grown-up changes their mind: logging in with the email brings it back
  const login = call(b, 'email_start', { email: 'p@example.com', purpose: 'login' });
  call(b, 'email_confirm', { code: login.dev_code, device_id: 'phone-b', confirm: true });
  assert.equal(call(a, 'account_status').deletion_after, 0, 'cancelled');
  later(31);
  assert.equal(purge().deleted, 1, 'only phone b\'s old guest town is deleted');
  assert.ok(nk.accounts[a], 'the saved town is still there');
  assert.equal(nk.accounts[b], undefined);
  // and a, deleted for real this time
  call(a, 'delete_request');
  later(31);
  assert.equal(purge().deleted, 1);
  assert.equal(nk.accounts[a], undefined);
  assert.equal(call(nk.login('phone-c'), 'email_start', { email: 'p@example.com', purpose: 'link' }).ok, true, 'the email is free again');
  assert.equal(JSON.parse(rpcs.purge_deleted({ userId: 'someone' }, {}, nk, '')).error, 'not_allowed', 'players can\'t run the purge');
});
