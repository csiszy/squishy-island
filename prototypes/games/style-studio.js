/* ===================== STYLE STUDIO (Fluff & Puff Salon) =====================
   Endless: guests keep coming with a picture of the hairdo they want.
   Copy it fast: style, colour, accessory, fringe and finish. Each guest waits a little
   less than the last. 3 unhappy guests and the salon closes. */
(() => {
const { D, W, H } = SQV, INK = D.INK;
const GUESTS = ['bunny', 'kitty', 'puppy', 'hamster', 'marshmallow', 'peach', 'toast', 'macaron', 'bao', 'egg'];
const STYLES = ['curly', 'spiky', 'bob'], COLS = ['#B48CFF', '#FF8FB8', '#8CCBFF', '#FFD54A', '#7ED3B2'], ACCS = ['none', 'bow', 'flower', 'star'];
const FRINGES = ['none', 'straight', 'swoop'], FINISH = ['plain', 'shiny', 'glitter'], KEYS = ['style', 'col', 'acc', 'fringe', 'fin'];
const NAMES = { style: 'style', col: 'colour', acc: 'accessory', fringe: 'fringe', fin: 'spray' };
let S;
const rnd = a => a[Math.floor(Math.random() * a.length)];
const randLook = () => ({ style: rnd(STYLES), col: rnd(COLS), acc: rnd(ACCS), fringe: rnd(FRINGES), fin: rnd(FINISH) });
function nextGuest() {
  const want = randLook(); let have; do { have = randLook(); } while (KEYS.filter(k => have[k] === want[k]).length > 1);
  S.g = { who: rnd(GUESTS), want, have, p: 1, max: Math.max(8, 24 - S.level * .8), in: 0, out: 0, res: null, pop: 0 };
}
const match = g => Math.round(KEYS.filter(k => g.have[k] === g.want[k]).length / KEYS.length * 100);
function TOOLS() { return [
  { k: 'comb', x: 56, y: 488, lbl: 'Comb' }, { k: 'fringe', x: 132, y: 488, lbl: 'Fringe' }, { k: 'spray', x: 208, y: 488, lbl: 'Spray' }, { k: 'done', x: 300, y: 488, lbl: 'Done!' },
  ...COLS.map((col, i) => ({ k: 'col', v: col, x: 44 + i * 68, y: 552 })),
  ...ACCS.map((a, i) => ({ k: 'acc', v: a, x: 54 + i * 84, y: 606 }))
]; }
const game = {
  id: 'style-studio', title: 'Style Studio', where: 'at the Fluff & Puff Salon',
  how: ['Each guest shows the hairdo they want on the Wants card. Look closely: 5 things must match.', 'Comb changes the style (curly, spiky, smooth), Fringe changes the bangs, Spray changes the finish (plain, shiny, glitter).', 'Tap a colour drop to dye it, and an accessory to pop it on.', 'There is no match meter: you only see how close you got when you tap Done! (or time runs out).', 'Under 80% (fewer than 4 of 5 right) makes a guest unhappy. 3 unhappy guests and it is over. Guests get less patient forever.'],
  keys: 'PC: click tools · 1-3 comb/fringe/spray · Enter = Done', scoreName: 'points',
  coins: { rule: 'points ÷ 250', base: G => G.score / 250, tiers: [5000, 15000, 30000] },
  overLine: () => `${S.done} guests styled · ${S.perfect} perfect`, overTitle: () => 'Salon closed!',
  revive(G) { S.hearts = 1; },
  init(G) { S = { hearts: 3, level: 0, done: 0, perfect: 0, combo: 0, anim: 0, last: '' }; nextGuest(); },
  update(dt, G) {
    const g = S.g; g.in = Math.min(1, g.in + dt * 2.5); g.pop = Math.max(0, g.pop - dt * 4); S.anim = Math.max(0, S.anim - dt * 3);
    if (g.res) { g.out += dt * 1.1; if (g.out > 1) { if (S.hearts <= 0) return G.end(); S.level++; nextGuest(); } return; }
    if (g.in >= 1) { g.p -= dt / g.max; if (g.p <= 0) finish(G, true); }
  },
  draw(c, G) {
    const g = S.g, t = G.t;
    c.fillStyle = '#FFE3EF'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#FFD6E6' : '#FFE3EF'; c.fillRect(i * 32, 52, 16, 400); }
    // mirror
    c.beginPath(); c.ellipse(118, 256, 100, 150, 0, 0, Math.PI * 2); c.fillStyle = '#F6FBFF'; c.fill(); c.lineWidth = 10; c.strokeStyle = '#FFD06B'; c.stroke(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.save(); c.globalAlpha = .6; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(70, 170, 10, 40, .3, 0, Math.PI * 2); c.fill(); c.restore();
    // chair + guest
    const slide = (1 - g.in) * -260 + (g.res ? -g.out * 300 : 0);
    D.rr(c, 50 + slide, 372, 140, 18, 9, '#C7509A'); c.fillStyle = '#9A8FAA'; c.fillRect(112 + slide, 390, 16, 30); D.rr(c, 84 + slide, 414, 72, 10, 5, '#9A8FAA');
    const gx = 120 + slide, gy = 376, sz = 128, bounce = g.pop * 8 + (g.res && g.res.ok ? Math.abs(Math.sin(t * 10)) * 10 : 0);
    D.sprite(c, g.who, gx, gy - bounce, sz, { sx: 1 + S.anim * .04, sy: 1 - S.anim * .04 });
    hair(c, gx, gy - sz * .78 - bounce, g.have, 1.1, t);
    if (g.res) { c.globalAlpha = Math.max(0, Math.min(1, (1 - g.out) * 2.5)); D.text(c, g.res.ok ? `${g.res.m}%!` : `${g.res.m}%…`, 118, 150, 32, g.res.ok ? '#FFD54A' : '#FF6F7D', 'center', 'display', INK, 6); if (g.res.miss.length) { D.rr(c, 20, 176, 196, 24, 12, 'rgba(255,255,255,.95)', null, 0); D.text(c, g.res.miss.length > 3 ? `missed ${g.res.miss.length} of 5 things` : 'missed: ' + g.res.miss.join(', '), 118, 188, 11, '#C7509A', 'center', 'body'); } c.globalAlpha = 1; }
    // wants card
    D.rr(c, 234, 64, 116, 168, 16, '#FFFFFF'); D.text(c, 'WANTS', 292, 82, 12, '#C7509A', 'center', 'body');
    D.sprite(c, g.who, 292, 210, 76); hair(c, 292, 210 - 76 * .78, g.want, .66, t);
    D.bar(c, 244, 240, 96, 12, g.res ? 0 : g.p);
    D.text(c, 'patience', 292, 262, 11, '#7C7494', 'center', 'body');
    // match is a secret until Done!
    D.rr(c, 234, 278, 116, 70, 16, '#FFFFFF'); D.text(c, 'MATCH', 292, 296, 11, '#7C7494', 'center', 'body');
    if (g.res) D.text(c, g.res.m + '%', 292, 325, 26, g.res.m === 100 ? '#2FB673' : '#C7509A', 'center', 'display'); else D.text(c, '?', 292, 325, 28, '#CFC8E3', 'center', 'display');
    if (S.combo >= 2) D.text(c, `perfect ×${S.combo}`, 292, 366, 14, '#C7509A', 'center', 'display', '#FFFFFF', 4);
    // tool tray
    D.rr(c, 8, 446, W - 16, 188, 20, '#FFFFFF');
    TOOLS().forEach(o => {
      if (o.k === 'col') { const on = g.have.col === o.v; c.beginPath(); c.moveTo(o.x, o.y - 20); c.quadraticCurveTo(o.x + 17, o.y + 2, o.x, o.y + 16); c.quadraticCurveTo(o.x - 17, o.y + 2, o.x, o.y - 20); c.fillStyle = o.v; c.fill(); c.lineWidth = on ? 4 : 2.5; c.strokeStyle = INK; c.stroke(); return; }
      if (o.k === 'acc') { const on = g.have.acc === o.v; D.rr(c, o.x - 34, o.y - 20, 68, 40, 14, on ? '#FFF3B0' : '#F6F3FF', on ? INK : '#CFC8E3', on ? 3 : 2); if (o.v === 'none') D.text(c, 'none', o.x, o.y + 1, 13, '#7C7494', 'center', 'body'); else accIcon(c, o.v, o.x, o.y, 1.15); return; }
      const done = o.k === 'done'; D.circle(c, o.x, o.y - 6, done ? 30 : 27, done ? '#C7509A' : '#F6F3FF', INK, 2.5);
      if (done) D.text(c, 'Done!', o.x, o.y - 6, 15, '#FFFFFF', 'center', 'display'); else toolIcon(c, o.k, o.x, o.y - 6);
      if (!done) D.text(c, o.lbl, o.x, o.y + 30, 11, '#7C7494', 'center', 'body');
    });
    // hud
    D.hud(c, '#C7509A', { t: '★ ' + G.score.toLocaleString('en-US'), w: 116 }); D.hearts(c, W - 66, 26, S.hearts);
    D.rr(c, 134, 12, 84, 28, 14, '#FFFFFF'); D.text(c, 'Guest ' + (S.done + 1), 176, 27, 13, INK, 'center', 'body');
  },
  down(x, y) {
    const G = SQV.G, g = S.g; if (g.res || g.in < 1) return;
    const o = TOOLS().find(o => o.k === 'col' ? Math.hypot(o.x - x, o.y - y) < 24 : o.k === 'acc' ? Math.abs(o.x - x) < 36 && Math.abs(o.y - y) < 22 : Math.hypot(o.x - x, o.y - 6 - y) < 36); if (!o) return;
    act(G, o.k, o.v);
  },
  key(code, down) { if (!down) return; const G = SQV.G; if (S.g.res || S.g.in < 1) return; const k = { Digit1: 'comb', Digit2: 'fringe', Digit3: 'spray', Enter: 'done' }[code]; if (!k) return false; act(G, k); }
};
function act(G, k, v) {
  const h = S.g.have; S.anim = 1; S.g.pop = 1;
  if (k === 'fringe') { h.fringe = FRINGES[(FRINGES.indexOf(h.fringe) + 1) % 3]; G.sfx(1500, .04, 'square', .04); G.noise(.04, .05, 5000); }
  if (k === 'spray') { h.fin = FINISH[(FINISH.indexOf(h.fin) + 1) % 3]; G.noise(.3, .06, 2500); if (h.fin === 'glitter') G.burst(120, 170, '#FFF3B0', 10, 80); }
  if (k === 'comb') { h.style = STYLES[(STYLES.indexOf(h.style) + 1) % 3]; G.sfx(700, .08, 'triangle', .06, 1.4); }
  if (k === 'col') { h.col = v; G.sfx(500, .1, 'sine', .07, 1.8); G.burst(120, 180, v, 8, 90); }
  if (k === 'acc') { h.acc = v; G.sfx(1100, .07, 'sine', .07); }
  if (k === 'done') finish(G, false);
}
function finish(G, timeout) {
  const g = S.g, m = match(g), ok = m >= 80; g.res = { m, ok, miss: KEYS.filter(k => g.have[k] !== g.want[k]).map(k => NAMES[k]) }; g.out = 0; S.done++;
  if (m === 100) { S.perfect++; S.combo++; } else S.combo = 0;
  const pts = ok ? m * 10 + (m === 100 ? 100 * S.combo : 0) + Math.round(g.p * 300) : m * 2; G.score += pts;
  if (pts) G.float(120, 120, '+' + pts, '#FFD54A', 22);
  if (ok) { G.burst(120, 200, '#FF8FB8', 16); G.sfx(1050, .12, 'triangle', .08, 1.4); } else { S.hearts--; G.shake(.25); G.buzz(80); G.sfx(220, .3, 'sawtooth', .06, .6); }
}
function hair(c, x, y, h, s, t) {
  const f = s, col = h.col; c.save(); c.translate(x, y); c.scale(f, f); c.lineWidth = 2.5 / f; c.strokeStyle = INK; c.fillStyle = col; c.lineJoin = 'round';
  if (h.style === 'curly') { const pts = [[-34, 8, 15], [-22, -10, 17], [0, -18, 19], [22, -10, 17], [34, 8, 15], [-12, -2, 15], [12, -2, 15]]; c.beginPath(); pts.forEach(([a, b, r]) => { c.moveTo(a + r, b); c.arc(a, b, r, 0, Math.PI * 2); }); c.fill(); c.stroke(); pts.forEach(([a, b, r]) => { c.beginPath(); c.arc(a, b, r - 1.3, 0, Math.PI * 2); c.fill(); }); }
  if (h.style === 'spiky') { c.beginPath(); c.moveTo(-40, 14); const n = 7; for (let i = 0; i <= n; i++) { const a = -40 + i * 80 / n; c.lineTo(a, i % 2 ? -34 + Math.sin(t * 3 + i) : 2); } c.lineTo(40, 14); c.quadraticCurveTo(0, 22, -40, 14); c.closePath(); c.fill(); c.stroke(); }
  if (h.style === 'bob') { c.beginPath(); c.moveTo(-42, 22); c.quadraticCurveTo(-46, -30, 0, -30); c.quadraticCurveTo(46, -30, 42, 22); c.quadraticCurveTo(30, 8, 18, 12); c.quadraticCurveTo(0, 2, -18, 12); c.quadraticCurveTo(-30, 8, -42, 22); c.closePath(); c.fill(); c.stroke(); }
  // fringe (bangs) hangs over the forehead
  c.fillStyle = col;
  if (h.fringe === 'straight') { c.beginPath(); c.moveTo(-26, 8); c.lineTo(26, 8); c.lineTo(26, 22); for (let i = 0; i <= 4; i++) { const a = 26 - i * 13; c.quadraticCurveTo(a - 3, 30, a - 6.5, 22); c.quadraticCurveTo(a - 10, 30, a - 13, 22); } c.closePath(); c.fill(); c.stroke(); }
  if (h.fringe === 'swoop') { c.beginPath(); c.moveTo(-28, 6); c.quadraticCurveTo(0, 2, 30, 8); c.quadraticCurveTo(30, 30, 18, 34); c.quadraticCurveTo(8, 20, -28, 18); c.closePath(); c.fill(); c.stroke(); }
  // finish
  if (h.fin === 'shiny') { c.save(); c.globalAlpha = .85; c.strokeStyle = '#FFFFFF'; c.lineCap = 'round'; c.lineWidth = 5; c.beginPath(); c.arc(-4, 2, 24, Math.PI * 1.08, Math.PI * 1.42); c.stroke(); c.lineWidth = 3.5; c.beginPath(); c.arc(4, 2, 22, Math.PI * 1.58, Math.PI * 1.75); c.stroke(); c.restore(); }
  if (h.fin === 'glitter') [[-24, -6], [-6, -20], [14, -12], [28, 2], [-14, 6], [6, 0]].forEach(([a, b], i) => { const tw = .7 + .35 * Math.sin(t * 5 + i * 1.7); D.star(c, a, b, 5.5 * tw, 2.2 * tw, '#FFFFFF', INK, 1.2 / f); });
  c.restore();
  if (h.acc !== 'none') accIcon(c, h.acc, x + 22 * f, y - 18 * f, f * 1.1);
}
function accIcon(c, a, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = 2; c.strokeStyle = INK;
  if (a === 'bow') { c.fillStyle = '#FF6FA3'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-13, -8); c.lineTo(-13, 8); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, 0); c.lineTo(13, -8); c.lineTo(13, 8); c.closePath(); c.fill(); c.stroke(); D.circle(c, 0, 0, 4, '#FF6FA3', INK, 2); }
  if (a === 'flower') { for (let i = 0; i < 5; i++) { const an = i / 5 * Math.PI * 2; D.circle(c, Math.cos(an) * 7, Math.sin(an) * 7, 5.5, '#FFFFFF', INK, 1.6); } D.circle(c, 0, 0, 4.5, '#FFD54A', INK, 1.6); }
  if (a === 'star') D.star(c, 0, 0, 12, 5.5, '#FFD54A', INK, 2);
  c.restore();
}
function toolIcon(c, k, x, y) {
  c.save(); c.translate(x, y); c.lineWidth = 3; c.strokeStyle = '#7C7494'; c.lineCap = 'round';
  if (k === 'cut') { c.beginPath(); c.moveTo(-8, -9); c.lineTo(8, 9); c.moveTo(8, -9); c.lineTo(-8, 9); c.stroke(); D.circle(c, -9, 10, 4.5, '#FFFFFF', '#C7509A', 2.4); D.circle(c, 9, 10, 4.5, '#FFFFFF', '#C7509A', 2.4); }
  if (k === 'dry') { D.rr(c, -12, -9, 18, 12, 6, '#FF8FB8', INK, 2); D.rr(c, -2, 2, 7, 11, 3, '#FF8FB8', INK, 2); c.strokeStyle = '#8CCBFF'; c.beginPath(); c.moveTo(9, -6); c.lineTo(14, -6); c.moveTo(9, -1); c.lineTo(16, -1); c.stroke(); }
  if (k === 'fringe') { c.lineWidth = 2.5; c.strokeStyle = INK; c.fillStyle = '#B48CFF'; c.beginPath(); c.moveTo(-12, -10); c.lineTo(12, -10); c.lineTo(12, 2); c.quadraticCurveTo(9, 9, 6, 2); c.quadraticCurveTo(3, 9, 0, 2); c.quadraticCurveTo(-3, 9, -6, 2); c.quadraticCurveTo(-9, 9, -12, 2); c.closePath(); c.fill(); c.stroke(); }
  if (k === 'spray') { D.rr(c, -7, -6, 14, 18, 4, '#8CCBFF', INK, 2); D.rr(c, -4, -11, 8, 6, 2, '#FFFFFF', INK, 2); c.fillStyle = '#C7509A'; [[10, -12], [14, -6], [11, -1]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 1.8, 0, 7); c.fill(); }); }
  if (k === 'comb') { D.rr(c, -12, -8, 24, 7, 3, '#FFD06B', INK, 2); c.strokeStyle = '#C98A12'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 6; i++) { c.moveTo(-10 + i * 4, -1); c.lineTo(-10 + i * 4, 8); } c.stroke(); }
  c.restore();
}
SQV.G = SQV.run(game); SQV.state = () => S;
})();
