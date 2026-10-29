/* ===================== GROW GROW GARDEN (Sprout Club Greenhouse) =====================
   Endless: seeds pop up in the beds on their own, on a timer that keeps getting
   quicker. Give each plant what its bubble asks for (water or sun) until it blooms,
   then harvest it. Shoo away snails. You can't slow the garden down: plants keep
   coming, get thirstier, and snails get bolder forever. 3 wilted plants and it closes. */
(() => {
const { D, W, H } = SQV, INK = D.INK;
const BEDS = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) BEDS.push({ x: 26 + c * 106, y: 74 + r * 118, w: 96, h: 108 });
const TOOLS = [{ k: 'water', x: 70, lbl: 'Water' }, { k: 'sun', x: 180, lbl: 'Sun' }, { k: 'basket', x: 290, lbl: 'Harvest' }];
const FLOWERS = ['#FF7AA8', '#FFD54A', '#B48CFF', '#FF8A5C', '#8CCBFF'];
let S;
const patience = () => Math.max(3.8, 11 - S.level * .5), growT = () => Math.max(1.1, 2.6 - S.level * .09);
// a new seed sprouts every few seconds by itself; the gap shrinks smoothly with time and harvests
const sproutGap = G => 1.25 + 2.6 * Math.exp(-(G.t / 70 + S.harvest / 16));
const game = {
  id: 'grow-grow-garden', title: 'Grow Grow Garden', where: 'at the Sprout Club Greenhouse',
  how: ['Seeds sprout in the beds all by themselves, faster and faster. You can’t stop them!', 'Each plant shows what it needs: a water drop or a sun. Pick that tool and tap the plant.', 'Three good feeds and it blooms. Pick the basket and harvest it!', 'Tap snails to send them home before they nibble your plants.', 'If a need waits too long, the plant wilts. 3 wilted plants and it is over.'],
  keys: 'PC: 1-3 pick a tool · click plants and snails · Enter to start', scoreName: 'points',
  coins: { rule: 'points ÷ 200', base: G => G.score / 200, metric: () => S.harvest, tiers: [20, 40, 70], unit: 'flowers harvested' },
  overLine: () => `${S.harvest} flowers harvested`, overTitle: () => 'The garden is resting',
  revive(G) { S.hearts = 1; S.beds.forEach(p => { if (p && !p.dead) p.wait = 0; }); S.snails = []; },
  init(G) { S = { beds: BEDS.map(() => null), tool: 'water', hearts: 3, harvest: 0, level: 0, snails: [], snailT: 9, hint: null, sproutT: .4, nextBed: -1, first: 3 }; },
  update(dt, G) {
    S.level = Math.floor(S.harvest / 5);
    // auto-sprouting: pick the next bed ahead of time so it can wiggle before the seed pops up
    if (S.nextBed < 0 || S.beds[S.nextBed]) { const empty = S.beds.map((p, i) => p ? -1 : i).filter(i => i >= 0); S.nextBed = empty.length ? empty[Math.floor(Math.random() * empty.length)] : -1; }
    S.sproutT -= dt;
    if (S.sproutT <= 0 && S.nextBed >= 0) {
      S.beds[S.nextBed] = { stage: 0, g: 0, growing: true, need: null, wait: 0, col: FLOWERS[Math.floor(Math.random() * FLOWERS.length)], gold: S.level >= 2 && Math.random() < .1, bounce: 1 };
      G.sfx(500, .08, 'sine', .05, 1.6); S.nextBed = -1; S.sproutT = S.first > 0 ? (S.first--, 1.1) : sproutGap(G) * (.8 + Math.random() * .4);
    }
    S.beds.forEach((p, i) => {
      if (!p) return;
      if (p.dead) { p.dead += dt; if (p.dead > 1.2) S.beds[i] = null; return; }
      p.bounce = Math.max(0, p.bounce - dt * 3);
      if (p.growing) { p.g += dt / growT(); if (p.g >= 1) { p.growing = false; p.stage++; p.g = 0; p.wait = 0; p.need = p.stage >= 4 ? 'harvest' : (Math.random() < .5 ? 'water' : 'sun'); p.bounce = 1; if (p.stage >= 4) G.sfx(1200, .15, 'triangle', .07, 1.3); } return; }
      p.wait += dt; const lim = patience() * (p.need === 'harvest' ? 1.5 : 1);
      if (p.wait > lim) { p.dead = .01; S.hearts--; G.shake(.25); G.buzz(80); G.float(BEDS[i].x + 48, BEDS[i].y + 30, 'Wilted!', '#FF6F7D', 16); G.sfx(200, .35, 'sawtooth', .06, .6); if (S.hearts <= 0) G.end(); }
    });
    // snails
    S.snailT -= dt;
    if (S.snailT <= 0) { const targets = S.beds.map((p, i) => p && !p.dead ? i : -1).filter(i => i >= 0); if (targets.length) { const ti = targets[Math.floor(Math.random() * targets.length)], b = BEDS[ti], left = Math.random() < .5; S.snails.push({ x: left ? -20 : W + 20, y: b.y + b.h - 10, ti, sp: 14 + S.level * 2.2, dir: left ? 1 : -1, eat: 0, home: false }); } S.snailT = Math.max(2.2, 9 - S.level * .5) * (.7 + Math.random() * .6); }
    S.snails.forEach(s => {
      const b = BEDS[s.ti], tx = b.x + b.w / 2, ty = b.y + b.h - 18;
      if (s.home) { s.x += s.dir * -120 * dt; s.y -= 10 * dt; return; }
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy); if (d > 4) { s.x += dx / d * s.sp * dt; s.y += dy / d * s.sp * dt; s.dir = dx > 0 ? 1 : -1; }
      else { s.eat += dt; if (s.eat > .8) { const p = S.beds[s.ti]; if (p && !p.dead) { p.stage--; p.growing = false; p.g = 0; p.wait = 0; p.need = Math.random() < .5 ? 'water' : 'sun'; if (p.stage <= 0) { p.dead = .01; S.hearts--; G.shake(.2); if (S.hearts <= 0) G.end(); } G.float(tx, ty - 50, 'Munch!', '#FF6F7D', 15); G.sfx(260, .15, 'square', .04, .7); } s.home = true; } }
    });
    S.snails = S.snails.filter(s => s.x > -60 && s.x < W + 60);
    if (S.hint) { S.hint.t -= dt; if (S.hint.t <= 0) S.hint = null; }
  },
  draw(c, G) {
    const t = G.t;
    c.fillStyle = '#E9FFF6'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(59,167,160,.15)'; c.lineWidth = 2; for (let x = 0; x < W; x += 40) { c.beginPath(); c.moveTo(x, 52); c.lineTo(x, 430); c.stroke(); }
    BEDS.forEach((b, i) => {
      const p = S.beds[i]; D.rr(c, b.x, b.y, b.w, b.h, 14, '#B5764A'); D.rr(c, b.x + 6, b.y + 6, b.w - 12, b.h - 12, 10, '#8E5E34', null, 0);
      const cx = b.x + b.w / 2, gy = b.y + b.h - 18;
      if (!p) { if (i === S.nextBed && S.sproutT < 1) { const w = Math.sin(t * 30) * 2 * (1 - S.sproutT); c.beginPath(); c.ellipse(cx + w, gy + 2, 14, 7, 0, Math.PI, 0); c.fillStyle = '#B5764A'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); } return; }
      c.save(); if (p.dead) { c.globalAlpha = Math.max(0, 1 - p.dead); }
      const wilt = p.need && !p.growing ? Math.min(1, p.wait / (patience() * (p.need === 'harvest' ? 1.5 : 1))) : 0, lean = (wilt > .6 ? (wilt - .6) * .9 : 0) + (p.dead ? .9 : 0);
      plant(c, cx, gy, p, t, lean, wilt);
      c.restore();
      if (p.dead) return;
      if (p.growing) D.bar(c, b.x + 14, b.y + b.h - 13, b.w - 28, 8, p.g, '#7ED3B2');
      else if (p.need) { const bx = b.x + b.w - 20, by = b.y + 20 + Math.sin(t * 4 + i) * 2; D.circle(c, bx, by, 15, '#FFFFFF', wilt > .65 ? '#E5484D' : INK, wilt > .65 ? 3 : 2.5); needIcon(c, p.need, bx, by, .8); c.lineWidth = 3; c.strokeStyle = wilt > .65 ? '#E5484D' : '#FFC94D'; c.beginPath(); c.arc(bx, by, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - wilt)); c.stroke(); }
    });
    S.snails.forEach(s => { c.save(); c.translate(s.x, s.y); c.scale(s.dir, 1); c.beginPath(); c.ellipse(0, 4, 14, 5, 0, 0, Math.PI * 2); c.fillStyle = '#B9D98A'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); D.circle(c, -3, -3, 8, '#C98A55', INK, 2); c.lineWidth = 1.6; c.beginPath(); c.arc(-3, -3, 4, 0, 5); c.stroke(); c.beginPath(); c.moveTo(9, 1); c.lineTo(13, -8); c.moveTo(11, 2); c.lineTo(17, -5); c.stroke(); c.restore(); });
    // tools
    D.rr(c, 8, 440, W - 16, 192, 20, '#FFFFFF'); D.text(c, 'TOOLS', 30, 460, 11, '#3BA7A0', 'left', 'body');
    TOOLS.forEach((o, i) => { const on = S.tool === o.k; D.circle(c, o.x, 516, 36, on ? '#FFF3B0' : '#F6F3FF', on ? INK : '#CFC8E3', on ? 3.5 : 2.5); needIcon(c, o.k, o.x, 516, 1.25); D.text(c, `${o.lbl}`, o.x, 566, 12, on ? INK : '#7C7494', 'center', 'body'); D.text(c, String(i + 1), o.x + 44, 486, 11, '#B0A8C8', 'center', 'body'); });
    D.sprite(c, 'sprout', 36, 624, 40, { sy: 1 + Math.sin(t * 3) * .04 }); D.text(c, S.hint ? S.hint.txt : tip(), W / 2 + 14, 604, 13, S.hint ? '#E5484D' : '#5E5679', 'center', 'body');
    // hud
    D.hud(c, '#3BA7A0', { t: '★ ' + G.score.toLocaleString('en-US'), w: 116 }); D.hearts(c, W - 66, 26, S.hearts);
    D.rr(c, 134, 12, 92, 28, 14, '#FFFFFF'); D.text(c, `Harvest ${S.harvest}`, 180, 27, 13, INK, 'center', 'body');
  },
  down(x, y) {
    const G = SQV.G;
    if (y > 470) { const o = TOOLS.find(o => Math.hypot(o.x - x, 516 - y) < 44); if (o) { S.tool = o.k; G.sfx(640, .05, 'sine', .05); } return; }
    const sn = S.snails.find(s => !s.home && Math.hypot(s.x - x, s.y - y) < 26); if (sn) { sn.home = true; G.score += 20; G.float(sn.x, sn.y - 20, '+20', '#FFD54A', 15); G.sfx(900, .08, 'triangle', .06, 1.5); return; }
    const i = BEDS.findIndex(b => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h); if (i < 0) return;
    const p = S.beds[i], b = BEDS[i];
    if (!p) return hint('Seeds sprout here by themselves');
    if (p.dead || p.growing) return;
    if (p.need !== (S.tool === 'basket' ? 'harvest' : S.tool)) return hint(p.need === 'harvest' ? 'Ready! Pick the basket' : `It needs ${p.need === 'water' ? 'water' : 'sun'}`);
    if (p.need === 'harvest') { S.harvest++; const pts = (p.gold ? 300 : 100) + Math.round(Math.max(0, 1 - p.wait / patience()) * 50); G.score += pts; G.float(b.x + 48, b.y + 20, '+' + pts, '#FFD54A', 20); G.burst(b.x + 48, b.y + 40, p.gold ? '#FFD54A' : p.col, 14); G.sfx(1100, .12, 'triangle', .08, 1.4); S.beds[i] = null; return; }
    const fed = p.need; p.need = null; p.growing = true; p.g = 0; p.bounce = 1; G.score += 10; G.burst(b.x + 48, b.y + 50, fed === 'water' ? '#8FD3FF' : '#FFD54A', 6, 80); G.sfx(S.tool === 'water' ? 380 : 760, .12, 'sine', .06, 1.5);
  },
  key(code, down) { if (!down) return; const m = /^Digit([1-3])$/.exec(code); if (!m) return false; S.tool = TOOLS[+m[1] - 1].k; }
};
function tip() { const n = S.beds.filter(Boolean).length; if (!n) return 'Seeds are on their way…'; return S.tool === 'basket' ? 'Tap blooming flowers to harvest' : `Tap plants that ask for ${S.tool}`; }
function hint(txt) { S.hint = { txt, t: 1.2 }; SQV.G.sfx(220, .08, 'square', .04); }
function needIcon(c, k, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = 2; c.strokeStyle = INK;
  if (k === 'water') { c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(11, 2, 0, 10); c.quadraticCurveTo(-11, 2, 0, -12); c.fillStyle = '#8FD3FF'; c.fill(); c.stroke(); }
  if (k === 'sun') { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); c.strokeStyle = '#F59E0B'; c.lineWidth = 2.6; c.stroke(); } D.circle(c, 0, 0, 8, '#FFD54A', INK, 2); }
  if (k === 'harvest' || k === 'basket') { c.beginPath(); c.moveTo(-12, -2); c.lineTo(12, -2); c.lineTo(8, 10); c.lineTo(-8, 10); c.closePath(); c.fillStyle = '#C98A55'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(-8, -2); c.quadraticCurveTo(0, -16, 8, -2); c.stroke(); }
  if (k === 'seed') { c.beginPath(); c.moveTo(-9, -8); c.lineTo(9, -8); c.lineTo(10, 11); c.lineTo(-10, 11); c.closePath(); c.fillStyle = '#E0B07A'; c.fill(); c.stroke(); D.circle(c, -3, 2, 2, '#8E5E34', null, 0); D.circle(c, 3, 5, 2, '#8E5E34', null, 0); D.circle(c, 2, -2, 2, '#8E5E34', null, 0); }
  c.restore();
}
function plant(c, x, y, p, t, lean, wilt) {
  const st = p.growing ? p.stage + p.g * .9 : p.stage, h = 8 + st * 15, b = p.bounce * Math.sin(t * 20) * .06;
  c.save(); c.translate(x, y); c.scale(1.35, 1.35); c.rotate(lean * (Math.sin(x) > 0 ? 1 : -1) + b);
  if (st < .6) { D.circle(c, 0, 0, 4, '#E0B07A', INK, 1.6); c.restore(); return; }
  const stem = wilt > .6 ? '#9AA36A' : '#4E9B4E', leaf = wilt > .6 ? '#C6C98A' : '#7ED36A';
  c.lineWidth = 3.5; c.strokeStyle = stem; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-3, -h / 2, 0, -h); c.stroke();
  [[-1, .45], [1, .65]].slice(0, st >= 2 ? 2 : 1).forEach(([k, f]) => { c.save(); c.translate(0, -h * f); c.rotate(k * .7); c.beginPath(); c.ellipse(k * 10, 0, 11, 5, 0, 0, Math.PI * 2); c.fillStyle = leaf; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); c.restore(); });
  if (st >= 3 && st < 4) D.circle(c, 0, -h - 4, 7, '#7ED36A', INK, 2);
  if (p.stage >= 4) { const col = p.gold ? '#FFD54A' : p.col; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t; D.circle(c, Math.cos(a) * 9, -h - 6 + Math.sin(a) * 9, 7, col, INK, 2); } D.circle(c, 0, -h - 6, 6, '#FFE27A', INK, 2); if (p.gold) { D.star(c, 16, -h - 20, 6, 2.5, '#FFF3B0', INK, 1.5); } }
  c.restore();
}
SQV.G = SQV.run(game); SQV.state = () => S;
})();
