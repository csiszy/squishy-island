// Daily quests, the Gem Challenge, first run double, the Gem streak, and changing them live (guide.html "Daily visits").
const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./helpers');

const GAMES = [
  { id: 'sky_bounce', kind: 'endless' }, { id: 'bistro_rush', kind: 'endless' }, { id: 'grow_grow_garden', kind: 'endless' },
  { id: 'squish_breaker', kind: 'levels' }, { id: 'squeak_beat', kind: 'songs' }, { id: 'squish_lab', kind: 'toy' },
];
const DAY = '2026-10-30';
const dayAfter = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);

function setup(games = GAMES) {
  const t = load(5);
  const user = t.nk.login('phone');
  t.call(user, 'load_state');
  const quests = (day = DAY, g = games) => t.call(user, 'quests', { day, games: g });
  const run = (game, extra = {}, day = DAY) => t.call(user, 'submit_run', { game, seconds: 60, coins: 20, kind: (GAMES.find(x => x.id === game) || {}).kind || 'endless', day, games, ...extra });
  const claim = (id, day = DAY) => t.call(user, 'quest_claim', { day, id });
  return { ...t, user, quests, run, claim };
}

test('three quests a day: two coin quests and the Gem Challenge, only with built games', () => {
  const { quests } = setup();
  const q = quests();
  assert.equal(q.ok, true);
  assert.equal(q.quests.length, 2);
  assert.ok(q.quests.every(x => x.reward === 40 && x.progress === 0));
  assert.ok(q.challenge && GAMES.some(g => g.id === q.challenge.game && g.kind !== 'toy'), 'the challenge is one of my games, never a toy');
  assert.ok(q.tomorrow, 'a teaser for tomorrow');
  assert.deepEqual(quests(), q, 'the same all day');
  const only = setup([{ id: 'sky_bounce', kind: 'endless' }]).quests();
  for (const x of only.quests) assert.ok(['any', 'sky_bounce', ''].includes(x.game), `${x.id} uses a game I have (${x.game})`);
});

test('the Gem Challenge is never the same game two days running', () => {
  const { quests, later } = setup();
  let last = '';
  let teaser = '';
  for (let i = 0; i < 40; i++, later(1)) {
    const q = quests(dayAfter(DAY, i));
    assert.notEqual(q.challenge.game, last, `day ${i}`);
    if (teaser) assert.equal(q.challenge.game, teaser, 'yesterday\'s teaser was right');
    last = q.challenge.game;
    teaser = q.tomorrow;
  }
});

test('playing moves quests on; collecting pays once; the first run of the day pays double', () => {
  const t = setup();
  // make today's quests predictable: ask for them with a pool of my own (live config)
  t.nk.files['live/live-config.json'] = JSON.stringify({ questPool: [
    { id: 'play_any', kind: 'runs', game: 'any', target: 2, weight: 1, text: 'quest.play_any' },
    { id: 'flowers', kind: 'metric', game: 'grow_grow_garden', target: 30, weight: 1, text: 'quest.flowers' }] });
  const q = t.quests();
  assert.deepEqual(q.quests.map(x => x.id).sort(), ['flowers', 'play_any']);
  assert.equal(q.first_run_left, true);
  const first = t.run('grow_grow_garden', { metric: 18 });
  assert.deepEqual([first.coins, first.first_today], [40, true], 'first run of the day: 20 x 2');
  const second = t.run('grow_grow_garden', { metric: 15 });
  assert.deepEqual([second.coins, second.first_today], [20, false]);
  assert.deepEqual(second.quests_done.sort(), ['flowers', 'play_any']);
  assert.equal(t.claim('play_any').coins, 40);
  assert.equal(t.claim('play_any').error, 'claimed');
  assert.equal(t.claim('nothing').error, 'no_quest');
});

test('Gem Challenge (endless): 90% of your own best; +3 Gems; 5 days in a week = +15', () => {
  const t = setup([{ id: 'sky_bounce', kind: 'endless' }]);
  t.quests();
  t.run('sky_bounce', { score: 1000 });   // the best so far: 1000
  let day = '2026-11-02';   // a Monday
  t.later(3);
  for (let i = 0; i < 5; i++, day = dayAfter(day, 1), t.later(1)) {
    const q = t.quests(day);
    assert.equal(q.challenge.game, 'sky_bounce');
    assert.equal(q.challenge.target, 900, 'a stretch from your own best');
    assert.equal(t.claim('challenge', day).error, 'not_done');
    t.run('sky_bounce', { score: 850 }, day);
    assert.equal(t.quests(day).challenge.done, false);
    const r = t.run('sky_bounce', { score: 905 }, day);
    assert.ok(r.quests_done.includes('challenge'));
    const c = t.claim('challenge', day);
    assert.equal(c.gems, 3);
    if (i < 4) assert.equal(t.claim('streak', day).error, 'not_done');
  }
  t.later(-1);
  const s = t.claim('streak', dayAfter(day, -1));
  assert.equal(s.gems, 15);
  assert.equal(s.total_gems, 5 * 3 + 15);
  assert.equal(t.claim('streak', dayAfter(day, -1)).error, 'claimed', 'once a week');
});

test('Gem Challenge for level games and Squeak Beat', () => {
  const lv = setup([{ id: 'squish_breaker', kind: 'levels' }]);
  assert.equal(lv.quests().challenge.goal, 'levels3');
  lv.run('squish_breaker', { won: true, level: 4, stars: 3, prev_stars: 2 });
  assert.equal(lv.quests().challenge.done, false, 'one level raised to 3 stars: one of two');
  lv.run('squish_breaker', { won: true, level: 2, stars: 3, prev_stars: 1 });
  assert.equal(lv.quests().challenge.done, true);
  const lv2 = setup([{ id: 'squish_breaker', kind: 'levels' }]);
  lv2.quests();
  lv2.run('squish_breaker', { won: true, level: 9, stars: 3, prev_stars: 0 });
  assert.equal(lv2.quests().challenge.done, true, 'a new level with 3 stars does it at once');
  const song = setup([{ id: 'squeak_beat', kind: 'songs' }]);
  song.quests();
  song.run('squeak_beat', { won: true, level: 1, stars: 2, newest: false });
  assert.equal(song.quests().challenge.done, false);
  song.run('squeak_beat', { won: true, level: 3, stars: 2, newest: true });
  assert.equal(song.quests().challenge.done, true, '2 stars on the newest track');
});

test('opening a box counts for the box quest', () => {
  const t = setup();
  t.nk.files['live/live-config.json'] = JSON.stringify({ questPool: [{ id: 'box', kind: 'boxes', target: 1, weight: 1, text: 'quest.box' }], coinQuests: 1 });
  t.quests();
  t.call(t.user, 'open_box', { kind: 'mystery' });
  assert.equal(t.claim('box').coins, 40);
});

test('the live config: exact quests for a date, other numbers, the challenge off', () => {
  const t = setup();
  t.nk.files['live/live-config.json'] = JSON.stringify({
    coinQuestReward: 60,
    schedule: { '2026-12-24': { quests: [{ id: 'xmas', kind: 'runs', game: 'any', target: 5, text: 'Play 5 games on Christmas Eve', reward: 100 }], challenge: 'bistro_rush' } }
  });
  const xmas = t.quests('2026-12-24');
  // (the phone's date may only be a day away from the server's: move the server's clock)
  assert.ok(xmas.ok);
  t.later(55);
  const eve = t.quests('2026-12-24');
  assert.deepEqual(eve.quests.map(q => [q.id, q.reward, q.text]), [['xmas', 100, 'Play 5 games on Christmas Eve']]);
  assert.equal(eve.challenge.game, 'bistro_rush');
  const normal = t.quests('2026-12-25');
  assert.ok(normal.quests.every(q => q.reward === 60), 'the new reward for every quest');
  t.nk.files['live/live-config.json'] = JSON.stringify({ ...JSON.parse(t.nk.files['live/live-config.json']), challengeEnabled: false });
  assert.equal(t.quests('2026-12-26').challenge, null, 'Gem Challenge switched off');
});

test('a phone with a wrong date gets the server\'s day', () => {
  const t = setup();
  assert.equal(t.quests('2030-01-01').day, '2026-10-30');
});

test('a broken live-config.json changes nothing (and never stops the game)', () => {
  const t = setup();
  t.nk.files['live/live-config.json'] = '{ "coinQuestReward": 99, oops }';
  const q = t.quests();
  assert.ok(q.ok);
  assert.ok(q.quests.every(x => x.reward === 40));
});
