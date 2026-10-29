/* ===================== BUCKET BRIGADE (Fire Station No. 1) =====================
   Level-based colour-sorting puzzle. The coloured water for the Splash Parade got
   all mixed up! Tap a bucket, then tap another to pour. You can only pour onto the
   same colour or into an empty bucket, and only while there is room.
   Sort every colour into its own bucket to win. Fewer moves = more stars.
   Levels never run out: more colours, then smoky (hidden) layers, then taller
   buckets. Every level is checked by a solver, so it can always be solved. */
(() => {
const { D, W, H } = SQV, INK = D.INK;
const COLORS = [
  { c: '#FF5E6C', s: 'dot' }, { c: '#FF9F43', s: 'tri' }, { c: '#FFD23F', s: 'star' }, { c: '#5ACB7A', s: 'leaf' }, { c: '#3CC8C8', s: 'diamond' },
  { c: '#4A8BFF', s: 'square' }, { c: '#A57CFF', s: 'heart' }, { c: '#FF7AC8', s: 'ring' }, { c: '#8B5E3C', s: 'plus' }, { c: '#F2F2F7', s: 'moon' }
];
const L = SQV.levels('bucket-brigade');
let S;

/* ---------- solver (makes sure every level can be beaten, and sets the star target) ---------- */
function solve(tubes, cap, R, limit = 60000) {
  const seen = new Set(), path = []; let nodes = 0;
  const keyOf = ts => ts.map(t => t.join(',')).sort().join('|');
  const done = ts => ts.every(t => !t.length || (t.length === cap && t.every(x => x === t[0])));
  function moves(ts) {
    const out = [];
    for (let a = 0; a < ts.length; a++) {
      const A = ts[a]; if (!A.length) continue; const c = A[A.length - 1]; let run = 1; while (run < A.length && A[A.length - 1 - run] === c) run++;
      if (run === A.length && run === cap) continue; let emptyTried = false;
      for (let b = 0; b < ts.length; b++) {
        if (a === b) continue; const B = ts[b]; if (B.length >= cap) continue;
        if (B.length) { if (B[B.length - 1] !== c) continue; } else { if (run === A.length || emptyTried) continue; emptyTried = true; }
        const n = Math.min(run, cap - B.length);
        out.push({ a, b, n, s: (B.length ? 2 : 0) + (B.length + n === cap ? 3 : 0) + (n === run ? 1 : 0) + R() * .8 });
      }
    }
    return out.sort((x, y) => y.s - x.s);
  }
  function dfs(ts) {
    if (done(ts)) return true; if (++nodes > limit) return false;
    const k = keyOf(ts); if (seen.has(k)) return false; seen.add(k);
    for (const m of moves(ts)) { const A = ts[m.a], B = ts[m.b]; for (let i = 0; i < m.n; i++) B.push(A.pop()); path.push([m.a, m.b]); if (dfs(ts)) return true; path.pop(); for (let i = 0; i < m.n; i++) A.push(B.pop()); }
    return false;
  }
  return dfs(tubes.map(t => t.slice())) ? path.slice() : null;
}

/* ---------- level recipe ---------- */
function recipe(n) {
  const R = SQV.rng(n * 4099 + 23);
  const k = Math.min(10, 3 + Math.floor((n - 1) / 2));
  const cap = n >= 18 && n % 3 === 0 ? 5 : 4;
  const hide = n < 8 ? 0 : Math.min(.6, .15 + (n - 8) * .015);
  let tubes = null, sol = null;
  for (let tries = 0; tries < 40 && !sol; tries++) {
    const units = []; for (let c = 0; c < k; c++) for (let i = 0; i < cap; i++) units.push(c);
    for (let i = units.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [units[i], units[j]] = [units[j], units[i]]; }
    tubes = []; for (let t = 0; t < k; t++) tubes.push(units.slice(t * cap, t * cap + cap));
    if (tubes.some(t => t.every(x => x === t[0]))) continue;
    tubes.push([], []);
    sol = solve(tubes, cap, R);
  }
  let par = sol.length; for (let i = 0; i < 3; i++) { const s2 = solve(tubes, cap, R); if (s2 && s2.length < par) par = s2.length; }
  const hidden = tubes.map(t => t.map((_, i) => i < t.length - 1 && R() < hide));
  return { n, k, cap, tubes, hidden, par, hide, big: n % 10 === 0 };
}

/* ---------- layout ---------- */
function layout() {
  const nT = S.tubes.length, perRow = nT <= 6 ? nT : Math.ceil(nT / 2), rows = Math.ceil(nT / perRow);
  const bw = Math.min(52, (W - 30) / perRow - 12), lh = S.cap === 5 ? 21 : 25, bh = lh * S.cap + 18;
  const gap = (W - perRow * bw) / (perRow + 1), top = rows === 1 ? 250 : 174, rowGap = bh + 64;
  S.pos = S.tubes.map((_, i) => { const r = Math.floor(i / perRow), inRow = Math.min(perRow, nT - r * perRow), g2 = (W - inRow * bw) / (inRow + 1), c = i - r * perRow; return { x: g2 + c * (bw + g2), y: top + r * rowGap, w: bw, h: bh, lh }; });
}
const topRun = t => { if (!t.length) return 0; const c = t[t.length - 1].c; let r = 1; while (r < t.length && t[t.length - 1 - r].c === c && !t[t.length - 1 - r].h) r++; return r; };
const isDone = t => !t.length || (t.length === S.cap && t.every(x => x.c === t[0].c && !x.h));
const solved = () => S.tubes.every(isDone);
function canPour(a, b) {
  if (a === b) return false; const A = S.tubes[a], B = S.tubes[b]; if (!A.length || B.length >= S.cap) return false;
  return !B.length || B[B.length - 1].c === A[A.length - 1].c;
}

/* ---------- game ---------- */
const G = () => SQV.G;
const game = {
  id: 'bucket-brigade', title: 'Bucket Brigade', where: 'at Fire Station No. 1', levels: true,
  how: ['The coloured water for the Splash Parade got mixed up! Sort each colour into its own bucket.', 'Tap a bucket, then tap another to pour. You can only pour onto the same colour, or into an empty bucket.', 'Smoky layers (?) show their colour when you uncover them.', 'Solve it in few moves for 3 stars (undo is free, but undone moves still count). Every win unlocks a new level, forever.'],
  keys: 'Tap a bucket, then another · PC: click, or ← → and Space · U = undo',
  coins: { menu: 'Coins: 30 + 15 per ★ the first time you beat a level (big levels ×2) · replays pay 10 + 15 per new ★', custom: () => SQV.levelPay(L, S.res) },
  menu: (Gm, rw) => SQV.levelMenu(game, L, rw),
  over: (Gm, pay) => SQV.levelOver(S.res, pay),
  act(a) { if (a === 'menu') G().menu(); },
  init(Gm) {
    const n = Math.max(1, Math.min(L.top, +Gm.arg || L.top)), lv = recipe(n);
    let id = 0; S = { lv, cap: lv.cap, seen: new Set(), tubes: lv.tubes.map((t, i) => t.map((c, j) => ({ c, h: lv.hidden[i][j], id: ++id }))), sel: -1, cur: 0, moves: 0, undo: [], extra: false, anim: null, banner: 1.8, doneT: 0, bounce: [], res: null, kb: false, btn: [] };
    layout();
  },
  update(dt, Gm) {
    S.banner = Math.max(0, S.banner - dt);
    if (S.anim) { S.anim.t += dt / .55; if (S.anim.t >= .55 && !S.anim.applied) applyPour(); if (S.anim.t >= 1) { S.anim = null; if (solved()) { S.doneT = .01; Gm.sfx(880, .3, 'triangle', .09, 1.5); } } }
    if (S.doneT) { S.doneT += dt; if (S.doneT > 1.3) finish(); }
    S.bounce = S.bounce.map(b => Math.max(0, b - dt * 1.5));
  },
  draw(c, Gm) {
    const t = Gm.t, lv = S.lv;
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#CDEBFF'); bg.addColorStop(1, '#FFE6DA'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    // floor + info panel
    c.fillStyle = 'rgba(217,58,43,.08)'; c.fillRect(0, 520, W, 120);
    D.rr(c, 10, 60, W - 20, 62, 18, '#FFFFFF');
    D.rr(c, 18, 68, 76, 46, 14, '#D93A2B', null, 0); D.text(c, 'moves', 56, 80, 10, '#FFE0DA', 'center', 'body'); D.text(c, String(S.moves), 56, 100, 22, '#FFFFFF', 'center', 'display');
    const st = starsFor(S.moves); D.text(c, 'Stars if you finish now', 210, 78, 11, '#7C7494', 'center', 'body');
    [0, 1, 2].forEach(i => D.star(c, 178 + i * 32, 101, 12, 5.5, i < st ? '#FFC93C' : '#E3DEEF', INK, 2));
    D.text(c, `★★★ in ${S.lv.par + (S.lv.hide ? 2 : 0)} moves or fewer${S.extra ? ' · extra bucket: max ★★' : ''}`, W / 2, 140, 11, '#5E5679', 'center', 'body');
    // buckets
    const order = S.tubes.map((_, i) => i); if (S.anim) { order.splice(order.indexOf(S.anim.a), 1); order.push(S.anim.a); }
    order.forEach(i => {
      const tube = S.tubes[i], p = S.pos[i]; let x = p.x, y = p.y, rot = 0;
      if (S.sel === i && !S.anim) y -= 16;
      if (S.anim && S.anim.a === i) { const a = S.anim, q = S.pos[a.b], u = a.t < .3 ? a.t / .3 : a.t > .8 ? (1 - a.t) / .2 : 1, e = u * u * (3 - 2 * u), side = q.x + q.w / 2 < W / 2 ? 1 : -1; x += (q.x + side * p.w * .6 - p.x) * e; y += (q.y - 56 - p.y) * e; rot = -side * 1.15 * e; }
      bucket(c, tube, x, y, p, rot, i, t);
      if (S.anim && S.anim.a === i && S.anim.t > .3 && S.anim.t < .8) { const q = S.pos[S.anim.b], sx = q.x + q.w / 2, col = COLORS[S.anim.col].c; c.lineWidth = 6; c.strokeStyle = col; c.lineCap = 'round'; c.beginPath(); const side = q.x + q.w / 2 < W / 2 ? 1 : -1; c.moveTo(sx + side * 5, q.y - 34); c.lineTo(sx, q.y + q.h - S.tubes[S.anim.b].length * q.lh - 8); c.stroke(); }
      if (S.kb && S.cur === i) D.rr(c, p.x - 6, p.y - 22, p.w + 12, p.h + 30, 14, null, '#D93A2B', 3);
    });
    // buttons
    S.btn = [{ k: 'undo', x: 70, lbl: 'Undo', on: S.undo.length > 0 }, { k: 'restart', x: 180, lbl: 'Restart', on: S.moves > 0 }, { k: 'extra', x: 290, lbl: S.extra ? 'Used' : '+ Bucket', on: !S.extra }];
    S.btn.forEach(b => { D.rr(c, b.x - 48, 532, 96, 40, 20, b.on ? '#FFFFFF' : '#F2EFFA', b.on ? INK : '#CFC8E3', 2.5); D.text(c, b.lbl, b.x, 552, 14, b.on ? INK : '#B0A8C8', 'center', 'body'); });
    D.sprite(c, 'raindrop', 34, 636, 50, { sy: 1 + Math.sin(t * 3) * .04 });
    D.text(c, tip(), W / 2 + 18, 606, 12, '#9A3A2F', 'center', 'body');
    // hud
    D.hud(c, '#D93A2B', { t: `Level ${lv.n}`, w: 100 }, { t: `${lv.k} colours`, w: 104 });
    if (lv.big) D.text(c, 'BIG LEVEL · ×2 coins', 178, 27, 11, '#FFF3B0', 'center', 'body');
    if (S.banner > 0) { c.globalAlpha = Math.min(1, S.banner * 2); D.rr(c, 40, 410, W - 80, 70, 20, '#FFFFFF'); D.text(c, `Level ${lv.n}`, W / 2, 432, 22, '#D93A2B', 'center', 'display'); D.text(c, lv.hide ? 'Watch out for smoky layers!' : lv.cap === 5 ? 'Tall buckets: 5 layers each' : 'One colour per bucket', W / 2, 460, 12, INK, 'center', 'body'); c.globalAlpha = 1; }
    if (S.doneT) { c.globalAlpha = Math.min(1, S.doneT * 3); D.text(c, 'All sorted!', W / 2, 220, 34, '#FFC93C', 'center', 'display', INK, 6); c.globalAlpha = 1; }
  },
  down(x, y) {
    if (S.anim || S.doneT) return; S.kb = false;
    if (y > 528 && y < 576) { const b = S.btn.find(b => Math.abs(b.x - x) < 50); if (b) button(b.k); return; }
    const i = S.pos.findIndex(p => x > p.x - 8 && x < p.x + p.w + 8 && y > p.y - 30 && y < p.y + p.h + 10); if (i >= 0) pick(i); else S.sel = -1;
  },
  key(code, down) {
    if (!down || S.anim || S.doneT) return;
    if (code === 'ArrowLeft' || code === 'KeyA') { S.kb = true; S.cur = (S.cur + S.tubes.length - 1) % S.tubes.length; return; }
    if (code === 'ArrowRight' || code === 'KeyD') { S.kb = true; S.cur = (S.cur + 1) % S.tubes.length; return; }
    if (code === 'ArrowUp' || code === 'ArrowDown') { S.kb = true; const per = S.tubes.length <= 6 ? S.tubes.length : Math.ceil(S.tubes.length / 2); S.cur = (S.cur + per) % (Math.ceil(S.tubes.length / per) * per); if (S.cur >= S.tubes.length) S.cur = S.tubes.length - 1; return; }
    if (code === 'Space' || code === 'Enter') { S.kb = true; pick(S.cur); return; }
    if (code === 'KeyU' || code === 'Backspace') { button('undo'); return; }
    if (code === 'KeyR') { button('restart'); return; }
    return false;
  }
};
function pick(i) {
  const pickable = k => S.tubes[k].length && !isDone(S.tubes[k]);
  if (S.sel < 0) { if (!pickable(i)) { S.bounce[i] = 1; return G().sfx(260, .06, 'triangle', .04); } S.sel = i; G().sfx(620, .05, 'sine', .05); return; }
  if (S.sel === i) { S.sel = -1; return; }
  if (!canPour(S.sel, i)) { S.bounce[i] = 1; G().sfx(200, .1, 'square', .04); S.sel = pickable(i) ? i : -1; return; }
  const a = S.sel, A = S.tubes[a], B = S.tubes[i], n = Math.min(topRun(A), S.cap - B.length);
  S.anim = { a, b: i, n, col: A[A.length - 1].c, t: 0, applied: false }; S.sel = -1; G().sfx(420, .35, 'sine', .05, 1.6);
}
function applyPour() {
  const a = S.anim; a.applied = true; const A = S.tubes[a.a], B = S.tubes[a.b];
  S.undo.push(S.tubes.map(t => t.map(x => ({ ...x })))); if (S.undo.length > 60) S.undo.shift();
  for (let i = 0; i < a.n; i++) B.push(A.pop());
  if (A.length && A[A.length - 1].h) { A[A.length - 1].h = false; S.seen.add(A[A.length - 1].id); G().float(S.pos[a.a].x + S.pos[a.a].w / 2, S.pos[a.a].y - 10, 'poof!', '#9A8FAA', 13); }
  S.moves++; S.bounce[a.b] = .6;
  if (isDone(B) && B.length) { const p = S.pos[a.b]; G().burst(p.x + p.w / 2, p.y, COLORS[B[0].c].c, 14, 120); G().sfx(1050, .15, 'triangle', .08, 1.4); G().buzz(30); }
}
function button(k) {
  if (k === 'undo' && S.undo.length) { S.tubes = S.undo.pop(); S.tubes.forEach(t => t.forEach(u => { if (S.seen.has(u.id)) u.h = false; })); S.sel = -1; G().sfx(500, .08, 'sine', .05, .7); }   // undo is free, but the move you undid still counts
  if (k === 'restart' && S.moves) { S.res = { n: S.lv.n, win: false, title: 'Restarted', line: 'No coins for a restart.' }; G().end(); }
  if (k === 'extra' && !S.extra) { S.extra = true; S.tubes.push([]); layout(); G().sfx(760, .12, 'triangle', .07, 1.3); }
}
function starsFor(m) { const par = S.lv.par + (S.lv.hide ? 2 : 0), st = m <= par ? 3 : m <= par + Math.max(3, Math.round(par * .3)) ? 2 : 1; return S.extra ? Math.min(2, st) : st; }
function finish() { const st = starsFor(S.moves); S.res = { n: S.lv.n, win: true, stars: st, line: `${S.moves} moves · target ${S.lv.par + (S.lv.hide ? 2 : 0)}` }; S.doneT = 0; G().score = st; G().end(); }
function tip() { if (S.sel >= 0) return 'Now tap where to pour'; if (S.moves === 0) return 'Tap a bucket to pick it up'; const full = S.tubes.filter(t => t.length && isDone(t)).length; return `${full} of ${S.lv.k} colours sorted`; }

/* ---------- drawing ---------- */
function bucket(c, tube, x, y, p, rot, i, t) {
  const w = p.w, h = p.h, b = S.bounce[i] || 0; c.save(); c.translate(x + w / 2, y + h); c.rotate(rot); c.scale(1 + b * .06 * Math.sin(t * 30), 1 - b * .05 * Math.sin(t * 30)); c.translate(-w / 2, -h);
  const done = tube.length && isDone(tube);
  // handle
  c.lineWidth = 3; c.strokeStyle = '#9A8FAA'; c.beginPath(); c.arc(w / 2, 6, w * .42, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
  // glass body
  const shape = () => { c.beginPath(); c.moveTo(0, 6); c.lineTo(w, 6); c.lineTo(w - 3, h - 10); c.quadraticCurveTo(w - 4, h, w / 2, h); c.quadraticCurveTo(4, h, 3, h - 10); c.closePath(); };
  shape(); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
  c.save(); shape(); c.clip();
  tube.forEach((u, j) => { const ly = h - (j + 1) * p.lh - 4; if (u.h) { c.fillStyle = '#B8B2C8'; c.fillRect(0, ly, w, p.lh + 1); D.text(c, '?', w / 2, ly + p.lh / 2, 14, '#FFFFFF', 'center', 'display'); } else { c.fillStyle = COLORS[u.c].c; c.fillRect(0, ly, w, p.lh + 1); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, ly, w, 3); sym(c, COLORS[u.c].s, w / 2, ly + p.lh / 2 + 1, u.c === 9 ? '#9A8FAA' : 'rgba(255,255,255,.9)'); } });
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(5, 10, 5, h - 24);
  c.restore();
  shape(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
  D.rr(c, -3, 0, w + 6, 11, 5, done ? '#FFC93C' : '#D93A2B', INK, 2.5);
  c.restore();
  if (done && !S.anim) { D.sprite(c, 'raindrop', x + w / 2, y - 2 + Math.abs(Math.sin(t * 4 + i)) * -5, 30); }
}
function sym(c, s, x, y, col) {
  c.save(); c.translate(x, y); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 2;
  if (s === 'dot') { c.beginPath(); c.arc(0, 0, 3.5, 0, 7); c.fill(); }
  if (s === 'tri') { c.beginPath(); c.moveTo(0, -4.5); c.lineTo(4.5, 3.5); c.lineTo(-4.5, 3.5); c.closePath(); c.fill(); }
  if (s === 'star') D.star(c, 0, 0, 5.5, 2.4, col, null);
  if (s === 'leaf') { c.beginPath(); c.ellipse(0, 0, 5, 2.6, -.6, 0, 7); c.fill(); }
  if (s === 'diamond') { c.beginPath(); c.moveTo(0, -5); c.lineTo(4, 0); c.lineTo(0, 5); c.lineTo(-4, 0); c.closePath(); c.fill(); }
  if (s === 'square') c.fillRect(-3.5, -3.5, 7, 7);
  if (s === 'heart') { c.beginPath(); c.moveTo(0, 4); c.bezierCurveTo(-6, 0, -4, -6, 0, -2.5); c.bezierCurveTo(4, -6, 6, 0, 0, 4); c.fill(); }
  if (s === 'ring') { c.beginPath(); c.arc(0, 0, 3.5, 0, 7); c.stroke(); }
  if (s === 'plus') { c.fillRect(-4, -1.2, 8, 2.4); c.fillRect(-1.2, -4, 2.4, 8); }
  if (s === 'moon') { c.beginPath(); c.arc(0, 0, 4.5, .6, Math.PI * 1.6); c.arc(2, -1, 3.4, Math.PI * 1.6, .6, true); c.fill(); }
  c.restore();
}
SQV.G = SQV.run(game); SQV.state = () => S; SQV.api = { recipe, solve, game, pick, canPour };
})();
