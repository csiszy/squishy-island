/* ===================== BISTRO RUSH (Squish Bistro) =====================
   Endless: customers keep coming, faster and hungrier. Cook what they show in
   their bubble and serve it before their patience runs out. 3 hearts. */
(() => {
const { D, W, H } = SQV, INK = D.INK;
const FOODS = {
  noodles: { cook: 1.3, draw(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); D.rr(c, -14, -2, 28, 14, 7, '#FFFFFF', '#9A8FAA', 2); c.lineWidth = 3; c.strokeStyle = '#F6B93B'; c.beginPath(); for (let i = 0; i < 3; i++) { c.moveTo(-10 + i * 7, -2); c.quadraticCurveTo(-7 + i * 7, -10, -4 + i * 7, -2); } c.stroke(); c.lineWidth = 2; c.strokeStyle = '#8A6A4E'; c.beginPath(); c.moveTo(6, -14); c.lineTo(12, -1); c.moveTo(10, -14); c.lineTo(15, -2); c.stroke(); c.restore(); } },
  cake: { cook: 1.7, draw(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.moveTo(-13, 11); c.lineTo(-13, -1); c.lineTo(13, -7); c.lineTo(13, 11); c.closePath(); c.fillStyle = '#FFF1D6'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#D9B78A'; c.stroke(); c.lineWidth = 3; c.strokeStyle = '#FF8FB8'; c.beginPath(); c.moveTo(-13, 4); c.lineTo(13, 1); c.stroke(); D.circle(c, 6, -11, 4.5, '#EF3E5C', '#B02E40', 1.5); c.restore(); } },
  juice: { cook: .8, draw(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.moveTo(-9, -11); c.lineTo(9, -11); c.lineTo(7, 12); c.lineTo(-7, 12); c.closePath(); c.fillStyle = '#FFB833'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#C98A12'; c.stroke(); c.lineWidth = 2.4; c.strokeStyle = '#FF6FA3'; c.beginPath(); c.moveTo(2, -11); c.lineTo(8, -19); c.stroke(); D.circle(c, -7, -11, 3.6, '#7ED36A', '#4E9B4E', 1.2); c.restore(); } },
  cookie: { cook: 1.0, draw(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); D.circle(c, 0, 0, 12, '#E0A060', '#A86A3A', 2); [[-4, -3], [4, 2], [-1, 5], [5, -5], [-6, 4]].forEach(([a, b]) => D.circle(c, a, b, 1.8, '#7A4A2A', null, 0)); c.restore(); } },
  dumpling: { cook: 2.1, draw(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.moveTo(-13, 7); c.quadraticCurveTo(0, -20, 13, 7); c.quadraticCurveTo(0, 12, -13, 7); c.fillStyle = '#FBF6EC'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#C9BFB0'; c.stroke(); c.beginPath(); c.moveTo(-5, -4); c.lineTo(-3, 0); c.moveTo(0, -6); c.lineTo(0, -1); c.moveTo(5, -4); c.lineTo(3, 0); c.stroke(); c.restore(); } }
};
const GUESTS = ['kitty', 'puff', 'puppy', 'bunny', 'toast', 'macaron', 'peach', 'jelly', 'egg', 'hamster', 'donut', 'avocado', 'whale', 'axolotl', 'acorn', 'raindrop'];
const SEATS = [62, 180, 298], PANS = [70, 160, 250], TRAYY = 578;
let S;
const tray = () => { const list = S.fifth ? ['noodles', 'cake', 'juice', 'cookie', 'dumpling'] : ['noodles', 'cake', 'juice', 'cookie']; const gap = W / (list.length + .2); return list.map((f, i) => ({ f, x: gap * (i + .6), y: TRAYY })); };

const game = {
  id: 'bistro-rush', title: 'Bistro Rush', where: 'at the Squish Bistro',
  how: ['Hungry squishies sit at the counter and show what they want.', 'Tap a food at the bottom to cook it in a free pan.', 'When it is ready, tap the dish, then tap the squishy who ordered it (or drag it to them).', 'Serve before their patience bar runs out. Lose 3 customers and the shift is over.', 'It never ends: guests come faster and order more the longer you last.'],
  keys: 'PC: click to cook and serve · Enter to start', scoreName: 'points',
  coins: { rule: 'points ÷ 420', base: G => G.score / 420, tiers: [15000, 30000, 50000] },
  overLine: G => `${S.served} orders served`,
  revive(G) { S.hearts = 1; S.seats.forEach(c => { if (c && !c.leave) c.p = 1; }); },
  init(G) { S = { seats: [null, null, null], pans: [null, null, null], hearts: 3, sel: null, drag: null, spawn: 1.2, served: 0, combo: 0, level: 1, chefBounce: 0, d: 0, fifth: false }; },
  update(dt, G) {
    // one smooth difficulty number: grows with time and with orders served, and eases toward a hard-but-fair ceiling
    S.d = G.t / 55 + S.served / 22; S.level = 1 + Math.floor(S.d * 2);
    if (!S.fifth && S.d >= 1.6) { S.fifth = true; G.float(W / 2, 500, 'New dish: dumplings!', '#FFD54A', 18); G.sfx(990, .15, 'triangle', .08, 1.3); }
    const patience = 7.5 + 8 * Math.exp(-S.d / 2.6), interval = 1.45 + 2.1 * Math.exp(-S.d / 2.4);
    S.spawn -= dt;
    if (S.spawn <= 0) {
      const free = S.seats.map((s, i) => s ? -1 : i).filter(i => i >= 0);
      if (free.length) {
        const i = free[Math.floor(Math.random() * free.length)], foods = tray().map(t => t.f), n = Math.random() < Math.min(.6, .12 + S.d * .1) ? 2 : 1;
        const order = []; while (order.length < n) order.push(foods[Math.floor(Math.random() * foods.length)]);
        S.seats[i] = { who: GUESTS[Math.floor(Math.random() * GUESTS.length)], order, got: order.map(() => false), p: 1, max: patience * (n === 2 ? 1.35 : 1), in: 0, leave: 0, mood: 0 };
        G.sfx(880, .06, 'sine', .06);
      }
      S.spawn = interval * (.75 + Math.random() * .5);
    }
    S.seats.forEach((c, i) => {
      if (!c) return; c.in = Math.min(1, c.in + dt * 3);
      if (c.leave) { c.leave += dt * 2.2; if (c.leave > 1) S.seats[i] = null; return; }
      c.p -= dt / c.max;
      if (c.p <= 0) { c.leave = .01; c.mood = -1; S.hearts--; S.combo = 0; G.shake(.25); G.buzz(80); G.sfx(220, .25, 'sawtooth', .07, .6); G.float(SEATS[i], 150, 'Too slow!', '#FF6F7D', 18); if (S.hearts <= 0) G.end(); }
    });
    S.pans.forEach(p => { if (p && p.t < 1) { p.t += dt / FOODS[p.f].cook; if (p.t >= 1) { p.t = 1; G.sfx(1180, .08, 'triangle', .07); } } });
    S.chefBounce = Math.max(0, S.chefBounce - dt * 3);
  },
  draw(c, G) {
    const t = G.t;
    c.fillStyle = '#FFF1E0'; c.fillRect(0, 0, W, H);
    // window + street
    D.rr(c, 14, 70, W - 28, 112, 14, '#BFE6F7', '#C9A97A', 4); c.fillStyle = '#9ED67E'; c.fillRect(17, 150, W - 34, 29); c.strokeStyle = '#C9A97A'; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2, 70); c.lineTo(W / 2, 182); c.stroke();
    // seats + customers
    S.seats.forEach((s, i) => {
      const x = SEATS[i];
      D.rr(c, x - 22, 262, 44, 10, 5, '#E5484D'); c.fillStyle = '#8A6A4E'; c.fillRect(x - 3, 272, 6, 26);
      if (!s) return;
      const slide = s.leave ? s.leave * 260 * (i === 0 ? -1 : 1) : (1 - s.in) * 220 * (i === 0 ? -1 : 1), y = 262 + Math.sin(t * 3 + i) * 2;
      c.save(); c.globalAlpha = s.leave ? Math.max(0, 1 - s.leave) : 1;
      D.sprite(c, s.who, x + slide, y, 92, { sy: 1 - Math.abs(Math.sin(t * 4 + i)) * .04 });
      if (!s.leave && s.in >= 1) {
        // order bubble
        const n = s.order.length, bw = n * 44 + 16, bx = x - bw / 2, by = 92;
        D.rr(c, bx, by, bw, 50, 14, '#FFFFFF'); c.beginPath(); c.moveTo(x - 7, by + 49); c.lineTo(x, by + 60); c.lineTo(x + 7, by + 49); c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#FFFFFF'; c.fillRect(x - 5.5, by + 46, 11, 4);
        s.order.forEach((f, k) => { const fx = bx + 30 + k * 44; c.globalAlpha = s.got[k] ? .35 : 1; FOODS[f].draw(c, fx, by + 26, 1.1); c.globalAlpha = 1; if (s.got[k]) { c.lineWidth = 4; c.strokeStyle = '#4FCFA0'; c.beginPath(); c.moveTo(fx - 9, by + 26); c.lineTo(fx - 2, by + 33); c.lineTo(fx + 11, by + 16); c.stroke(); } });
        D.bar(c, x - 36, 160, 72, 11, s.p);
        if (S.sel && S.sel.ready && s.order.some((f, k) => f === S.pans[S.sel.i]?.f && !s.got[k])) { c.lineWidth = 3; c.strokeStyle = '#FFD54A'; c.setLineDash([6, 5]); c.lineDashOffset = -t * 30; D.rr(c, x - 50, 186, 100, 78, 18, null, '#FFC94D', 3); c.setLineDash([]); }
      }
      c.restore();
    });
    // counter
    D.rr(c, -6, 296, W + 12, 22, 4, '#C98A55'); c.fillStyle = '#E5484D'; c.fillRect(0, 318, W, 46); for (let i = 0; i < 13; i++) { c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(i * 30, 318, 15, 46); }
    c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 364); c.lineTo(W, 364); c.stroke();
    // kitchen
    c.fillStyle = '#FFF8EC'; c.fillRect(0, 365, W, H - 365); for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#FFEFE0' : '#FFF8EC'; c.fillRect(i * 52, 365 + j * 40, 52, 40); }
    D.rr(c, 22, 398, 268, 68, 16, '#E8E4EF', '#9A8FAA', 3); D.text(c, 'PANS', 156, 412, 10, '#7C7494', 'center', 'body');
    S.pans.forEach((p, i) => {
      const x = PANS[i], y = 442; D.circle(c, x, y, 25, '#4A4458', INK, 2.5); c.fillStyle = '#4A4458'; c.fillRect(x + 22, y - 3, 18, 6); D.circle(c, x, y, 19, '#5E5672', null, 0);
      if (!p) return;
      if (p.t < 1) { c.globalAlpha = .55; FOODS[p.f].draw(c, x, y, 1); c.globalAlpha = 1; c.lineWidth = 5; c.strokeStyle = '#FFC94D'; c.beginPath(); c.arc(x, y, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.t); c.stroke(); for (let k = 0; k < 2; k++) { c.globalAlpha = .5; D.circle(c, x - 6 + k * 12, y - 30 - ((t * 30 + k * 12) % 18), 5, '#FFFFFF', null, 0); c.globalAlpha = 1; } }
      else { const sel = S.sel && S.sel.i === i, b = Math.sin(t * 6 + i) * 2; if (sel) D.circle(c, x, y, 31, null, '#FFD54A', 5); FOODS[p.f].draw(c, x, y - 4 + b, 1.35); D.text(c, 'READY', x, y + 34, 10, '#2FB673', 'center', 'body'); }
    });
    // chef
    D.shadow(c, 322, 470, 26); D.sprite(c, 'bao', 322, 470, 74, { sy: 1 + S.chefBounce * .12 }); c.save(); c.translate(322, 404 - S.chefBounce * 6); D.rr(c, -15, -2, 30, 13, 4, '#FFFFFF', '#9A8FAA', 2); D.circle(c, -9, -6, 8, '#FFFFFF', '#9A8FAA', 2); D.circle(c, 0, -10, 9, '#FFFFFF', '#9A8FAA', 2); D.circle(c, 9, -6, 8, '#FFFFFF', '#9A8FAA', 2); c.fillStyle = '#FFFFFF'; c.fillRect(-13, -6, 26, 8); c.restore();
    // tray
    D.rr(c, 10, 516, W - 20, 116, 22, '#FFFFFF'); D.text(c, 'TAP TO COOK', W / 2, 532, 10, '#7C7494', 'center', 'body');
    tray().forEach(o => { const busy = !S.pans.some(p => !p); D.circle(c, o.x, o.y, 30, busy ? '#F2EFFA' : '#FFF6D6', busy ? '#CFC8E3' : '#F59E0B', 3); c.globalAlpha = busy ? .45 : 1; FOODS[o.f].draw(c, o.x, o.y + 2, 1.35); c.globalAlpha = 1; });
    if (S.drag) FOODS[S.pans[S.drag.i].f].draw(c, S.drag.x, S.drag.y, 1.6);
    // hud
    D.hud(c, '#E5484D', { t: '★ ' + G.score.toLocaleString('en-US'), w: 116 }); D.hearts(c, W - 66, 26, S.hearts);
    if (S.combo >= 5) D.text(c, `combo ×${Math.min(5, 1 + Math.floor(S.combo / 5))}`, W / 2, 27, 15, '#FFF3B0', 'center', 'display', INK, 3);
    for (let i = 0; i < 14; i++) { c.beginPath(); c.moveTo(i * 26, 52); c.lineTo(i * 26 + 26, 52); c.lineTo(i * 26 + 26, 62); c.quadraticCurveTo(i * 26 + 13, 70, i * 26, 62); c.closePath(); c.fillStyle = i % 2 ? '#FFFFFF' : '#E5484D'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#B83238'; c.stroke(); }
  },
  down(x, y) {
    const G = SQV.G;
    // tray -> cook
    const hitTray = tray().find(o => Math.hypot(o.x - x, o.y - y) < 34);
    if (hitTray) { const i = S.pans.findIndex(p => !p); if (i < 0) { G.sfx(180, .1, 'square', .04); return; } S.pans[i] = { f: hitTray.f, t: 0 }; S.chefBounce = 1; G.sfx(520, .07, 'triangle', .07); return; }
    // ready pan -> select / start drag
    const pi = PANS.findIndex(px => Math.hypot(px - x, 442 - y) < 32);
    if (pi >= 0 && S.pans[pi] && S.pans[pi].t >= 1) { S.sel = { i: pi, ready: true }; S.drag = { i: pi, x, y, moved: false }; G.sfx(760, .05, 'sine', .06); return; }
    // customer
    const ci = seatAt(x, y); if (ci >= 0 && S.sel) serve(ci);
  },
  move(x, y) { if (S.drag) { S.drag.x = x; S.drag.y = y; if (y < 380) S.drag.moved = true; } },
  up(x, y) { if (!S.drag) return; const d = S.drag; S.drag = null; if (d.moved) { const ci = seatAt(x, y); if (ci >= 0) serve(ci); } }
};
function seatAt(x, y) { if (y > 300 || y < 80) return -1; return SEATS.findIndex(sx => Math.abs(sx - x) < 58); }
function serve(ci) {
  const G = SQV.G, s = S.seats[ci], p = S.pans[S.sel.i]; if (!s || s.leave || !p) return;
  const k = s.order.findIndex((f, j) => f === p.f && !s.got[j]);
  if (k < 0) { G.float(SEATS[ci], 200, 'Not this!', '#FFFFFF', 16); G.sfx(200, .12, 'square', .05); S.sel = null; return; }
  s.got[k] = true; S.pans[S.sel.i] = null; S.sel = null; G.sfx(990, .08, 'sine', .08, 1.3);
  if (s.got.every(Boolean)) {
    S.served++; S.combo++; const mult = Math.min(5, 1 + Math.floor(S.combo / 5)), pts = (100 * s.order.length + (s.p > .5 ? 50 : 0)) * mult; G.score += pts;
    G.float(SEATS[ci], 200, '+' + pts, '#FFD54A', 22); G.burst(SEATS[ci], 210, '#FF8FB8', 12); s.leave = .01; s.mood = 1; G.sfx(1320, .12, 'triangle', .08, 1.5);
  }
}
SQV.G = SQV.run(game); SQV.state = () => S;
})();
