// The Visitor of the week (guide.html "Daily visits"): a squishy you don't own camps in the park all week; say hi on
// 4 different days and it moves in for free.
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./helpers');

const MONDAY = '2026-11-02';
const dayAfter = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);

function setup() {
  const t = load(3);
  t.later(3);   // the clock starts on Friday 30 October: move to Monday 2 November
  const user = t.nk.login('phone');
  t.call(user, 'load_state');
  const visitor = (day = MONDAY) => t.call(user, 'visitor', { day });
  const hi = (day = MONDAY) => t.call(user, 'visitor_hi', { day });
  return { ...t, user, visitor, hi };
}

test('a squishy I don\'t own visits, Common to Epic, the same one all week', () => {
  const t = setup();
  const v = t.visitor();
  assert.equal(v.ok, true);
  assert.ok(['C', 'U', 'R', 'E'].includes(v.rarity), v.rarity);
  const mine = t.call(t.user, 'load_state').collection;
  assert.ok(!(v.squishy in mine), 'one I don\'t have yet');
  assert.deepEqual([v.days, v.needed, v.today_done, v.moved_in, v.until], [0, 4, false, false, '2026-11-08']);
  t.later(3);
  assert.equal(t.visitor(dayAfter(MONDAY, 3)).squishy, v.squishy, 'still there on Thursday');
});

test('hi on 4 different days: it moves in for free; once a day only', () => {
  const t = setup();
  const who = t.visitor().squishy;
  const first = t.hi();
  assert.deepEqual([first.ok, first.days, first.today_done, first.moved_in], [true, 1, true, false]);
  assert.equal(t.hi().error, 'already_today', 'one hi a day');
  let last;
  for (const n of [2, 4, 6]) {
    t.later(2);
    last = t.hi(dayAfter(MONDAY, n));
  }
  assert.deepEqual([last.days, last.moved_in, last.is_new], [4, true, true]);
  assert.deepEqual(last.entry, { level: 1, spares: 0, sparkly: false });
  assert.ok(who in t.call(t.user, 'load_state').collection, 'it lives on the island now');
  assert.equal(t.hi(dayAfter(MONDAY, 6)).error, 'moved_in');
  const after = t.visitor(dayAfter(MONDAY, 6));
  assert.deepEqual([after.squishy, after.moved_in], [who, true]);
});

test('missed: next week someone else visits, and the visits start again', () => {
  const t = setup();
  const who = t.visitor().squishy;
  t.hi();
  t.later(7);
  const next = t.visitor(dayAfter(MONDAY, 7));
  assert.notEqual(next.squishy, who, 'a new visitor');
  assert.deepEqual([next.days, next.moved_in], [0, false]);
});

test('the phone can\'t pretend it is another day', () => {
  const t = setup();
  t.hi(MONDAY);
  // a date far away is taken as the server's own day (Monday): already said hi today
  assert.equal(t.hi('2027-01-01').error, 'already_today');
});

test('live config: who visits in a given week, how many days, or no visitor at all', () => {
  const t = setup();
  t.nk.files['live/live-config.json'] = JSON.stringify({ visitors: { [MONDAY]: 'gyoza' }, visitorDays: 2 });
  const v = t.visitor();
  assert.deepEqual([v.squishy, v.needed], ['gyoza', 2]);
  t.hi();
  t.later(1);
  const moved = t.hi(dayAfter(MONDAY, 1));
  assert.equal(moved.moved_in, true);
  t.nk.files['live/live-config.json'] = JSON.stringify({ visitorEnabled: false });
  assert.equal(t.visitor(dayAfter(MONDAY, 1)).squishy, '');
  assert.equal(t.hi(dayAfter(MONDAY, 1)).error, 'no_visitor');
});

test('a visitor that arrives on a Friday stays through next week, so 4 visits are possible', () => {
  const t = setup();
  t.later(-3);   // back to Friday 30 October
  const v = t.visitor('2026-10-30');
  assert.equal(v.until, '2026-11-08');
  for (let n = 0; n < 4; n++) {
    const hi = t.hi(dayAfter('2026-10-30', n));
    assert.equal(hi.ok, true, JSON.stringify(hi));
    assert.equal(hi.squishy, v.squishy, 'the same visitor after the weekend');
    if (n < 3) t.later(1);
  }
  assert.equal(t.visitor('2026-11-02').moved_in, true);
});
