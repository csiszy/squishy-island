/* ===================== SQUISH LAB (Squishy Testing Facility) =====================
   A toy, not a game: no score, no coins. Pick one of your squishies and squish it.
   Each squishy is a real soft body: a ring of points that keeps its area (volume),
   remembers its shape and springs back. Its outline is traced from the squishy's own
   picture, and the picture is stretched over the moving shape, so what you see is
   the squishy itself bending, flattening and bulging.
   Three materials: slow-rise foam (sinks in, rises back slowly), wobbly jelly
   (keeps its volume, wobbles) and bouncy rubber (springy, bounces).
   Tools: Hand (grab, stretch, throw, poke), Press (hydraulic), Roller, Squeeze,
   Ball (drop a heavy rubber ball) and Drop (lift and let go). */
(() => {
const { D, W, H } = SQV, INK = D.INK;
const FLOOR = 512, N = 40, HSTEP = 1 / 600, GRAV = 1800, PR = 2;
const MAT = {
  // edge/bend/area/shape = how hard each rule pulls per physics step
  // memory foam: its 'relaxed shape' gives in when squished (yield) and only creeps back at `recover` px/s, so it rises back slowly
  // mu = grip on the table and the press (static friction); rest = bounciness
  foam:  { name: 'Slow-rise foam', edge: .3,  bend: .04, area: .07, shape: .012, rise: 1e9, memory: true, yield: .01, recover: 30, damp: 8,   rest: .04, fric: .55, mu: 1.1, minPress: .16, squish: 'soft' },
  jelly: { name: 'Wobbly jelly',   edge: .35, bend: .02, area: .55, shape: .010, rise: 1e9, damp: 1.2, rest: .2,  fric: .2,  mu: .6,  minPress: .33, squish: 'wet' },
  bouncy:{ name: 'Bouncy rubber',  edge: .7,  bend: .12, area: .35, shape: .03,  rise: 1e9, damp: 2.5, rest: .55, fric: .35, mu: .8,  minPress: .28, squish: 'boing' }
};
const SHELF = [
  ['bao', 'Bao Bun', 'foam'], ['marshmallow', 'Marshmallow', 'foam'], ['toast', 'Toast', 'foam'], ['peach', 'Peach', 'foam'], ['donut', 'Donut', 'foam'], ['shroomy', 'Shroomy', 'foam'],
  ['jelly', 'Jelly', 'jelly'], ['axolotl', 'Axolotl', 'jelly'], ['whale', 'Whale', 'jelly'], ['gummy', 'Gummy Bear', 'jelly'],
  ['kitty', 'Kitty', 'bouncy'], ['puppy', 'Puppy', 'bouncy'], ['bunny', 'Bunny', 'bouncy'], ['sunny', 'Sunny', 'bouncy'], ['mossball', 'Moss Ball', 'bouncy'], ['egg', 'Egg', 'bouncy']
];
const TOOLS = [{ k: 'hand', lbl: 'Hand' }, { k: 'press', lbl: 'Press' }, { k: 'roller', lbl: 'Roller' }, { k: 'squeeze', lbl: 'Squeeze' }, { k: 'ball', lbl: 'Ball' }, { k: 'drop', lbl: 'Drop' }];
const TX = i => 32 + i * 59.2, TY = 586;
let S, acc = 0;

/* ---------- tracing the squishy's outline from its picture ---------- */
const SHAPES = {};
function shapeOf(id) {
  if (SHAPES[id]) return SHAPES[id];
  const img = SQV.IMG[id]; if (!img || !img.complete || !img.naturalWidth) return null;
  const sz = img.naturalWidth, cv = document.createElement('canvas'); cv.width = cv.height = sz; const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
  const a = cx.getImageData(0, 0, sz, sz).data, al = (x, y) => (x < 0 || y < 0 || x >= sz || y >= sz) ? 0 : a[(Math.floor(y) * sz + Math.floor(x)) * 4 + 3];
  let mx = 0, my = 0, n = 0; for (let y = 0; y < sz; y += 2) for (let x = 0; x < sz; x += 2) if (al(x, y) > 128) { mx += x; my += y; n++; }
  mx /= n; my /= n;
  const rad = []; for (let i = 0; i < N; i++) { const th = -Math.PI / 2 + i / N * Math.PI * 2, dx = Math.cos(th), dy = Math.sin(th); let r = 0; for (let s = 0; s < sz; s += .5) if (al(mx + dx * s, my + dy * s) > 70) r = s; rad.push(r + 1.5); }
  // soften spikes a little so thin bits (ears, stems) don't make needles
  const sm = rad.map((r, i) => { const p = rad[(i + N - 1) % N], q = rad[(i + 1) % N]; return Math.min(r, Math.max(p, q) * 1.35, (p + q) / 2 * 1.6); });
  // make the outline left-right symmetric (never smaller than the picture, so nothing gets cut off): a lopsided base would make it roll away
  const sy = sm.map((r, i) => Math.max(r, sm[(N - i) % N]));
  const pts = sy.map((r, i) => { const th = -Math.PI / 2 + i / N * Math.PI * 2; return [mx + Math.cos(th) * r, my + Math.sin(th) * r]; });
  // real squishies sit on a flat bottom, so they stand steady instead of rolling away
  const yb = Math.max(...pts.map(p => p[1])), yt = Math.min(...pts.map(p => p[1])), cut = yb - (yb - yt) * .09; pts.forEach(p => { if (p[1] > cut) p[1] = yb - (yb - p[1]) * .15; });
  const ys = pts.map(p => p[1]), xs = pts.map(p => p[0]);
  const rc = [pts.reduce((a, p) => a + p[0], 0) / N, pts.reduce((a, p) => a + p[1], 0) / N];   // ring centre (the body's true middle)
  return (SHAPES[id] = { img, mx: rc[0], my: rc[1], pts, h: Math.max(...ys) - Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) });
}

/* ---------- the soft body ---------- */
function makeBody(id, mat) {
  const sh = shapeOf(id); if (!sh) return null;
  const sc = 150 / Math.max(sh.h, sh.w * .85), q = sh.pts.map(([x, y]) => [(x - sh.mx) * sc, (y - sh.my) * sc]);
  const by = Math.max(...q.map(p => p[1])), cx0 = W / 2, cy0 = FLOOR - by - 160;
  const B = { id, M: MAT[mat], mat, sh, sc, q, x: q.map(p => [cx0 + p[0], cy0 + p[1]]), v: q.map(() => [0, 0]), o: q.map(() => [0, 0]), L: [], L2: [], A0: 0, h0: Math.max(...q.map(p => p[1])) - Math.min(...q.map(p => p[1])), w0: Math.max(...q.map(p => p[0])) - Math.min(...q.map(p => p[0])), touch: q.map(() => 0) };
  for (let i = 0; i < N; i++) { const j = (i + 1) % N, k = (i + 2) % N; B.L.push(dist(q[i], q[j])); B.L2.push(dist(q[i], q[k])); }
  B.A0 = area(q); B.qm = q.map(p => [p[0], p[1]]); B.Lm = B.L.slice(); B.L2m = B.L2.slice(); B.Am = B.A0;
  return B;
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function area(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
function centroid(p) { let x = 0, y = 0; p.forEach(a => { x += a[0]; y += a[1]; }); return [x / p.length, y / p.length]; }
function inside(p, x, y) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const a = p[i], b = p[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }

function step(h) {
  const B = S.body; if (!B) return; const M = B.M, X = B.x, V = B.v;
  // tools move first
  toolsMove(h);
  S.contact = false; S.anchor = S.grabs.length > 0 && S.grabs.every(g => !g.whole && !g.free);
  if (S.anchor) { S.grabs.forEach(g => { if (Math.hypot(g.x - g.sx, g.y - g.sy) > S.body.w0 * .85) { g.free = true; S.sfx.push(['pop', 1]); } }); }
  for (let i = 0; i < N; i++) { V[i][1] += GRAV * h; B.o[i][0] = X[i][0]; B.o[i][1] = X[i][1]; X[i][0] += V[i][0] * h; X[i][1] += V[i][1] * h; B.touch[i] = 0; }
  // grabbing hands pull their points toward the finger
  S.grabs.forEach(g => g.pts.forEach(([i, w, ox, oy]) => { const tx = g.x + ox, ty = g.y + oy; X[i][0] += (tx - X[i][0]) * .22 * w; X[i][1] += (ty - X[i][1]) * .22 * w; }));
  const RX = S.rx; for (let i = 0; i < N; i++) { RX[i][0] = 0; RX[i][1] = 0; }
  // edges (stretchy skin) + bending: collected first, applied together with the shape memory below
  for (let i = 0; i < N; i++) { link(X, RX, i, (i + 1) % N, B.Lm[i], M.edge); link(X, RX, i, (i + 2) % N, B.L2m[i], M.bend); }
  // area: keeps the volume, so a squished squishy bulges out at the sides
  const A = area(X), C = A - B.Am; let gs = 0; const gr = [];
  for (let i = 0; i < N; i++) { const p = X[(i + N - 1) % N], n = X[(i + 1) % N], g = [(n[1] - p[1]) / 2, (p[0] - n[0]) / 2]; gr.push(g); gs += g[0] * g[0] + g[1] * g[1]; }
  if (gs > 1e-6) { const l = -C / gs * M.area; for (let i = 0; i < N; i++) { RX[i][0] += l * gr[i][0]; RX[i][1] += l * gr[i][1]; } }
  // shape memory: pull toward the best-fitting rotated rest shape
  const c = centroid(X); let sxx = 0, sxy = 0; for (let i = 0; i < N; i++) { const px = X[i][0] - c[0], py = X[i][1] - c[1], qx = B.qm[i][0], qy = B.qm[i][1]; sxx += qx * px + qy * py; sxy += qx * py - qy * px; }
  // squishies are a little bottom-heavy: when on the table they slowly roll back upright
  let ang = Math.atan2(sxy, sxx); if (S.grounded && !S.grabs.length) ang *= 1 - (M.up ?? .012);
  const ca = Math.cos(ang), sa = Math.sin(ang), k = M.shape * (S.grabs.length ? .5 : 1);
  const lim = M.rise * h;
  for (let i = 0; i < N; i++) { const gx = c[0] + ca * B.qm[i][0] - sa * B.qm[i][1], gy = c[1] + sa * B.qm[i][0] + ca * B.qm[i][1]; let dx = RX[i][0] + (gx - X[i][0]) * k, dy = RX[i][1] + (gy - X[i][1]) * k; const m = Math.hypot(dx, dy); if (m > lim) { dx *= lim / m; dy *= lim / m; } X[i][0] += dx; X[i][1] += dy; RX[i][0] = dx; RX[i][1] = dy; }
  // collisions
  for (let i = 0; i < N; i++) collide(i);
  ballsStep(h);
  // velocities from movement, with friction, bounce and internal damping
  // slow-rise foam: it may only spring back so fast (see vmax below), so it sinks in and rises back slowly
  const creep = false;
  let vx = 0, vy = 0; for (let i = 0; i < N; i++) { V[i][0] = (X[i][0] - B.o[i][0] - (creep ? RX[i][0] : 0)) / h; V[i][1] = (X[i][1] - B.o[i][1] - (creep ? RX[i][1] : 0)) / h; vx += V[i][0]; vy += V[i][1]; }
  vx /= N; vy /= N; let L = 0, I = 0; for (let i = 0; i < N; i++) { const rx = X[i][0] - c[0], ry = X[i][1] - c[1]; L += rx * (V[i][1] - vy) - ry * (V[i][0] - vx); I += rx * rx + ry * ry; } let w = I > 0 ? L / I : 0;
  S.grounded = B.touch.some(t => t === 1);
  if (S.grounded && !S.grabs.length) { const w2 = w * Math.exp(-22 * h), vx2 = vx * Math.exp(-9 * h); for (let i = 0; i < N; i++) { const rx = X[i][0] - c[0], ry = X[i][1] - c[1]; V[i][0] += (vx2 - vx) - (w2 - w) * ry; V[i][1] += (w2 - w) * rx; } w = w2; vx = vx2; }   // rolling resistance
  const keep = Math.exp(-M.damp * h), air = Math.exp(-.15 * h);
  for (let i = 0; i < N; i++) {
    const rx = X[i][0] - c[0], ry = X[i][1] - c[1], rvx = vx - w * ry, rvy = vy + w * rx;
    let ix = (V[i][0] - rvx) * keep, iy = (V[i][1] - rvy) * keep; if (M.vmax) { const m = Math.hypot(ix, iy); if (m > M.vmax) { ix *= M.vmax / m; iy *= M.vmax / m; } }
    V[i][0] = (rvx + ix) * air; V[i][1] = (rvy + iy) * air;
    const t = B.touch[i];
    const fr = Math.exp(-M.fric * 40 * h);
    if (t === 1) V[i][0] *= fr;
    if (t === 2) V[i][1] *= fr;
    if (t === 3) V[i][0] *= fr;
  }
  if (M.memory) memory(B, X, h);
  // bounce: the whole squishy bounces as one (so it doesn't start spinning), with a short cool-down
  S.bcd = Math.max(0, (S.bcd || 0) - h);
  if (S.grounded && S.vyIn > 160 && !S.bcd && !S.grabs.length) { let my = 0; for (let i = 0; i < N; i++) my += V[i][1]; my /= N; const dv = -M.rest * S.vyIn - Math.min(0, my); if (dv < 0) for (let i = 0; i < N; i++) V[i][1] += dv; S.bcd = .18; if (M.rest > .3) S.sfx.push(['boing', Math.min(1, S.vyIn / 1200)]); }
  let vin = 0; for (let i = 0; i < N; i++) vin += V[i][1]; S.vyIn = vin / N;
}
// Coulomb friction for position-based physics: small sideways slips are cancelled (static), bigger ones are slowed (kinetic)
function fric(p, o, axis, dn, mu) { const d = p[axis] - o[axis]; if (Math.abs(d) < mu * dn) p[axis] = o[axis]; else p[axis] -= Math.sign(d) * mu * .6 * dn; }
function memory(B, X, h) {
  const M = B.M, c = centroid(X); let sxx = 0, sxy = 0; for (let i = 0; i < N; i++) { const px = X[i][0] - c[0], py = X[i][1] - c[1]; sxx += B.q[i][0] * px + B.q[i][1] * py; sxy += B.q[i][0] * py - B.q[i][1] * px; }
  const an = Math.atan2(sxy, sxx), ca = Math.cos(an), sa = Math.sin(an), st = M.recover * h; let mx = 0, my = 0;
  for (let i = 0; i < N; i++) {
    const px = X[i][0] - c[0], py = X[i][1] - c[1], lx = ca * px + sa * py, ly = -sa * px + ca * py, m = B.qm[i];
    m[0] += (lx - m[0]) * M.yield; m[1] += (ly - m[1]) * M.yield;                                   // gives in to the squeeze
    const dx = B.q[i][0] - m[0], dy = B.q[i][1] - m[1], d = Math.hypot(dx, dy); if (d > st) { m[0] += dx / d * st; m[1] += dy / d * st; } else { m[0] = B.q[i][0]; m[1] = B.q[i][1]; }   // creeps back
    mx += m[0]; my += m[1];
  }
  mx /= N; my /= N; B.qm.forEach(m => { m[0] -= mx; m[1] -= my; });
  for (let i = 0; i < N; i++) { B.Lm[i] = dist(B.qm[i], B.qm[(i + 1) % N]); B.L2m[i] = dist(B.qm[i], B.qm[(i + 2) % N]); } B.Am = area(B.qm);
}
function link(X, RX, i, j, L0, k) { const a = X[i], b = X[j], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-6, e = (d - L0) / d * .5 * k; RX[i][0] += dx * e; RX[i][1] += dy * e; RX[j][0] -= dx * e; RX[j][1] -= dy * e; }
function collide(i) {
  const B = S.body, p = B.x[i], o = B.o[i];
  if (p[1] > FLOOR - PR) { const dn = p[1] - (FLOOR - PR); p[1] = FLOOR - PR; B.touch[i] = 1; fric(p, o, 0, dn, B.M.mu); }
  if (S.anchor && S.feet.has(i)) { p[0] = o[0]; p[1] = Math.max(p[1], o[1]); }
  if (p[0] < 6 + PR) { p[0] = 6 + PR; B.touch[i] = 2; }
  if (p[0] > W - 6 - PR) { p[0] = W - 6 - PR; B.touch[i] = 2; }
  if (p[1] < -500) p[1] = -500;
  if (S.press.y > -60 && p[1] < S.press.y + PR) { const dn = S.press.y + PR - p[1]; p[1] = S.press.y + PR; B.touch[i] = 3; fric(p, o, 0, dn, B.M.mu); S.contact = true; }
  if (S.sq.gap < 999) { const l = W / 2 - S.sq.gap / 2, r = W / 2 + S.sq.gap / 2; if (p[0] < l + PR) { p[0] = l + PR; B.touch[i] = 2; } if (p[0] > r - PR) { p[0] = r - PR; B.touch[i] = 2; } }
  const R = S.roller; if (R.on) { const dx = p[0] - R.x, dy = p[1] - R.y, d = Math.hypot(dx, dy); if (d < R.r + PR) { const s = (R.r + PR) / (d || 1); p[0] = R.x + dx * s; p[1] = R.y + dy * s; } }
}
/* ---------- tools ---------- */
function toolsMove(h) {
  const B = S.body, P = S.press;
  // hydraulic press: comes down while you hold, stops at a kid-safe minimum gap
  const minY = FLOOR - B.h0 * B.M.minPress;
  const top = Math.min(...B.x.map(p => p[1]));
  if (S.tool === 'press' && S.holding) { const blocked = P.y >= minY; if (!blocked) P.y = Math.min(minY, P.y + (P.y < top - 4 ? 700 : 130) * h); P.moving = !blocked; }
  else { P.y = Math.max(-70, P.y - 260 * h); P.moving = P.y > -70; }
  // squeezer paddles
  const Q = S.sq, minGap = B.w0 * (B.mat === 'jelly' ? .45 : .32);
  if (S.tool === 'squeeze' && S.holding) Q.gap = Math.max(minGap, (Q.gap > 900 ? W - 12 : Q.gap) - 150 * h);
  else if (Q.gap < 999) { Q.gap += 240 * h; if (Q.gap > W - 12) Q.gap = 9999; }
  // rolling pin chases your finger at a limited speed
  const R = S.roller; if (R.on) { const dx = R.tx - R.x, dy = Math.min(FLOOR - R.r - 14, R.ty) - R.y, d = Math.hypot(dx, dy), mx = 700 * h; if (d > mx) { R.x += dx / d * mx; R.y += dy / d * mx; } else { R.x += dx; R.y += dy; } R.spin += dx * .05; }
}
function ballsStep(h) {
  const X = S.body.x;
  S.balls.forEach(b => {
    if (b.vin == null) b.vin = 0; b.vy += GRAV * h; b.vin = b.vy; b.ox = b.x; b.oy = b.y; b.x += b.vx * h; b.y += b.vy * h;
    // ball vs squishy points: the ball is 6x heavier than a point cloud slice
    for (let i = 0; i < N; i++) { const p = X[i], dx = p[0] - b.x, dy = p[1] - b.y, d = Math.hypot(dx, dy); if (d < b.r + PR && d > 0) { const pen = b.r + PR - d, nx = dx / d, ny = dy / d; p[0] += nx * pen * .8; p[1] += ny * pen * .8; b.x -= nx * pen * .2; b.y -= ny * pen * .2; } }
    // and the ball can't sink into the middle of the squishy
    if (inside(X, b.x, b.y)) { const c = centroid(X), dx = b.x - c[0], dy = b.y - c[1], d = Math.hypot(dx, dy) || 1; b.x += dx / d * 2; b.y += dy / d * 2 - 1; }
    if (b.y > FLOOR - b.r) { b.y = FLOOR - b.r; }
    if (b.x < 6 + b.r) b.x = 6 + b.r; if (b.x > W - 6 - b.r) b.x = W - 6 - b.r;
    if (S.press.y > -60 && b.y < S.press.y + b.r) b.y = S.press.y + b.r;
    const vin = b.vin; b.vx = (b.x - b.ox) / h; b.vy = (b.y - b.oy) / h;
    if (b.y >= FLOOR - b.r - .01) { if (vin > 140) { b.vy = -vin * .55; if (vin > 300) S.sfx.push(['boing', Math.min(1, vin / 1400)]); } b.vx *= Math.exp(-1.5 * h); }
    if ((b.x <= 6 + b.r + .01 && b.vx < 0) || (b.x >= W - 6 - b.r - .01 && b.vx > 0)) b.vx *= -.6;
    b.vin = b.vy;
    b.spin += b.vx * h / b.r;
  });
}
/* ---------- sound (squelches made from filtered noise) ---------- */
let ac = null, nbuf = null;
function audio() { if (ac) return ac; try { ac = new (window.AudioContext || window.webkitAudioContext)(); const n = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; nbuf = n; } catch (e) { ac = null; } return ac; }
function squelch(v, kind) {
  if (!audio() || ac.state !== 'running') return; const t = ac.currentTime, n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = nbuf;
  f.type = 'bandpass'; f.Q.value = kind === 'wet' ? 6 : 2.5; const f0 = (kind === 'wet' ? 500 : 320) * (.8 + Math.random() * .5); f.frequency.setValueAtTime(f0 * 1.8, t); f.frequency.exponentialRampToValueAtTime(f0 * .6, t + .18);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.35 * v, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + .22); n.connect(f); f.connect(g); g.connect(SQS.out(ac)); n.start(t, Math.random() * .5, .3);
}
function boing(v) { if (!audio() || ac.state !== 'running') return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(420, t + .06); o.frequency.exponentialRampToValueAtTime(260, t + .25); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.18 * v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .3); o.connect(g); g.connect(SQS.out(ac)); o.start(t); o.stop(t + .32); }
function hiss(on) { if (!audio()) return; if (on && !S.hiss) { const n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = nbuf; n.loop = true; f.type = 'highpass'; f.frequency.value = 3000; g.gain.value = .025; n.connect(f); f.connect(g); g.connect(SQS.out(ac)); n.start(); S.hiss = { n, g }; } if (!on && S.hiss) { try { S.hiss.g.gain.setTargetAtTime(0, ac.currentTime, .05); S.hiss.n.stop(ac.currentTime + .3); } catch (e) {} S.hiss = null; } }

/* ---------- the 3D look (three.js). The physics stays flat (2D); only the picture is 3D ----------
   Each squishy becomes a puffy pillow-shaped mesh: the 2D soft-body outline is the rim, the inside
   is filled with rings that bulge out toward the camera, and the squishy's own picture is
   stretched over it. When it gets squished flatter, it puffs out thicker, like a real squishy.
   If three.js can't load (offline), the lab falls back to the flat 2D drawing. */
const U = 40, RG = 7;                                     // 40 physics px = 1 unit in 3D; rings in the pillow mesh
const WX = x => (x - W / 2) / U, WY = y => (FLOOR - y) / U;
let R3 = null;
function canvasTex(T, w, h, paint) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; paint(cv.getContext('2d')); const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; }
function setup3D() {
  if (R3 !== null) return R3; const T = window.THREE, cv2 = document.querySelector('#app canvas'); if (!T || !cv2) return (R3 = false);
  try {
    const tq = window.SQS ? SQS.tier() : "high", ren = new T.WebGLRenderer({ antialias: tq !== "low" }); ren.setPixelRatio(Math.min(tq === "low" ? 1 : 2, window.devicePixelRatio || 1)); ren.shadowMap.enabled = tq !== "low"; ren.shadowMap.type = T.PCFSoftShadowMap; ren.outputEncoding = T.sRGBEncoding;
    const el = ren.domElement; el.style.position = 'absolute'; el.style.pointerEvents = 'none'; cv2.parentNode.insertBefore(el, cv2);
    const sc = new T.Scene(); sc.background = new T.Color('#CFE0F3'); sc.fog = new T.Fog('#DCEAF8', 34, 70);
    const cam = new T.PerspectiveCamera(38, W / H, .1, 120); cam.position.set(0, 13.5, 20.5); cam.lookAt(0, 4.1, 0);
    sc.add(new T.HemisphereLight('#FFFFFF', '#8A9AB4', .6));
    const sun = new T.DirectionalLight('#FFF6E8', .62); sun.position.set(-6, 14, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 14, bottom: -4, near: 1, far: 50 }); sun.shadow.bias = -.0006; sc.add(sun);
    const std = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .6 }, o));
    const box = (w, h, d, m) => { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.castShadow = b.receiveShadow = true; return b; };
    const cyl = (r, h, m, seg = 20) => { const c = new T.Mesh(new T.CylinderGeometry(r, r, h, seg), m); c.castShadow = c.receiveShadow = true; return c; };
    // lab room: tiled wall, floor
    const tile = canvasTex(T, 256, 256, x => { x.fillStyle = '#EAF3FD'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#C3D5EC'; x.lineWidth = 5; for (let i = 0; i <= 256; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); } });
    tile.wrapS = tile.wrapT = T.RepeatWrapping; tile.repeat.set(10, 7);
    const wall = new T.Mesh(new T.PlaneGeometry(44, 30), std('#FFFFFF', { map: tile })); wall.position.set(0, 11, -5.5); wall.receiveShadow = true; sc.add(wall);
    const floor = new T.Mesh(new T.PlaneGeometry(70, 50), std('#C2CFE0')); floor.rotation.x = -Math.PI / 2; floor.position.y = -3.2; floor.receiveShadow = true; sc.add(floor);
    for (let k = 1; k <= 4; k++) { const y = WY(FLOOR - k * 100), lab = canvasTex(T, 128, 64, x => { x.fillStyle = '#5A78A0'; x.font = '900 40px Nunito, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(k + 'm', 64, 34); }); const m = new T.Mesh(new T.PlaneGeometry(.9, .45), new T.MeshBasicMaterial({ map: lab, transparent: true })); m.position.set(-5.3, y + .35, -5.4); sc.add(m); const b = box(1.3, .08, .05, std('#8EA4C2')); b.position.set(-5.3, y, -5.45); sc.add(b); }
    // test table with a hazard stripe along the front
    const stripe = canvasTex(T, 256, 32, x => { x.fillStyle = '#3A3A48'; x.fillRect(0, 0, 256, 32); x.fillStyle = '#FFD54A'; for (let i = -32; i < 288; i += 32) { x.beginPath(); x.moveTo(i, 32); x.lineTo(i + 16, 32); x.lineTo(i + 32, 0); x.lineTo(i + 16, 0); x.fill(); } }); stripe.wrapS = T.RepeatWrapping; stripe.repeat.set(5, 1);
    const top = std('#8FA6C8', { roughness: .4 }), side = std('#6E84A8');
    const table = new T.Mesh(new T.BoxGeometry(10.6, .8, 6.6), [side, side, top, side, std('#FFFFFF', { map: stripe }), side]); table.position.set(0, -.4, 0); table.receiveShadow = table.castShadow = true; sc.add(table);
    [[-4.6, 2.6], [4.6, 2.6], [-4.6, -2.6], [4.6, -2.6]].forEach(([x, z]) => { const l = cyl(.18, 2.4, std('#8EA4C2')); l.position.set(x, -2, z); sc.add(l); });
    // hydraulic press: a heavy plate on two shiny pistons
    const metal = std('#5B6B85', { roughness: .35, metalness: .35 }), chrome = std('#D6DEE9', { roughness: .2, metalness: .7 });
    const pstripe = canvasTex(T, 256, 32, x => { x.fillStyle = '#5B6B85'; x.fillRect(0, 0, 256, 32); x.fillStyle = '#FFD54A'; for (let i = -32; i < 288; i += 28) { x.beginPath(); x.moveTo(i, 32); x.lineTo(i + 12, 32); x.lineTo(i + 26, 0); x.lineTo(i + 14, 0); x.fill(); } }); pstripe.wrapS = T.RepeatWrapping; pstripe.repeat.set(3, 1);
    const press = new T.Group(), plate = new T.Mesh(new T.BoxGeometry(8.8, 1, 2), [metal, metal, metal, metal, std('#FFFFFF', { map: pstripe, roughness: .4 }), metal]); plate.castShadow = true; press.add(plate);
    const rods = [-3.1, 3.1].map(x => { const r = cyl(.2, 1, chrome); r.position.x = x; press.add(r); const s = cyl(.38, 4, metal); s.position.set(x, 0, 0); press.add(s); return [r, s]; });
    sc.add(press);
    // rolling pin (a cylinder: its round end is what the physics sees)
    const wood = std('#E9C994', { roughness: .7 }), roller = new T.Group(), pin = cyl(24 / U, 3.8, wood, 28); pin.rotation.x = Math.PI / 2; roller.add(pin);
    [-1, 1].forEach(k => { const h = cyl(.13, 1.1, std('#B9824F'), 12); h.rotation.x = Math.PI / 2; h.position.z = k * 2.45; roller.add(h); const kn = new T.Mesh(new T.SphereGeometry(.2, 12, 8), std('#B9824F')); kn.position.z = k * 3.05; roller.add(kn); });
    sc.add(roller);
    // squeeze paddles on arms
    const yel = std('#FFC93C', { roughness: .45 }), paddles = [-1, 1].map(k => { const g = new T.Group(), p = box(.5, 4.7, 2.2, yel); p.position.y = 2.35; g.add(p); const arm = cyl(.18, 8, chrome); arm.rotation.z = Math.PI / 2; arm.position.set(k * 4.2, 2.5, 0); g.add(arm); sc.add(g); return g; });
    // rubber balls
    const ballTex = canvasTex(T, 128, 64, x => { x.fillStyle = '#FF6F7D'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#FFFFFF'; x.fillRect(0, 26, 128, 12); x.fillRect(58, 0, 12, 64); });
    const balls = [0, 1, 2, 3].map(() => { const b = new T.Mesh(new T.SphereGeometry(22 / U, 24, 16), std('#FFFFFF', { map: ballTex, roughness: .35, transparent: true })); b.castShadow = true; sc.add(b); return b; });
    R3 = { T, ren, el, cv2, sc, cam, press, plate, rods, roller, paddles, balls, ray: new T.Raycaster(), tex: {}, body: null, size: '' };
  } catch (e) { console.warn('3D off:', e); R3 = false; }
  return R3;
}
function bodyMesh(B) {
  const T = R3.T, sh = B.sh, img = sh.img, sz = img.naturalWidth;
  let tex = R3.tex[B.id]; if (!tex) { tex = new T.Texture(img); tex.encoding = T.sRGBEncoding; tex.anisotropy = 4; tex.needsUpdate = true; R3.tex[B.id] = tex; }
  const per = 1 + RG * N, pos = new Float32Array(per * 2 * 3), uv = new Float32Array(per * 2 * 2), idx = [], s0 = [sh.mx, sh.my];
  for (let s = 0; s < 2; s++) {
    const o = s * per, V = (k, i) => o + 1 + (k - 1) * N + ((i % N) + N) % N;
    uv[o * 2] = s0[0] / sz; uv[o * 2 + 1] = 1 - s0[1] / sz;
    for (let k = 1; k <= RG; k++) for (let i = 0; i < N; i++) { const v = V(k, i), f = k / RG, p = sh.pts[i]; uv[v * 2] = (s0[0] + (p[0] - s0[0]) * f) / sz; uv[v * 2 + 1] = 1 - (s0[1] + (p[1] - s0[1]) * f) / sz; }
    const tri = (a, b, c) => s ? idx.push(a, c, b) : idx.push(a, b, c);
    for (let i = 0; i < N; i++) { tri(o, V(1, i), V(1, i + 1)); for (let k = 1; k < RG; k++) { tri(V(k, i), V(k + 1, i), V(k + 1, i + 1)); tri(V(k, i), V(k + 1, i + 1), V(k, i + 1)); } }
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const mat = new T.MeshStandardMaterial({ map: tex, roughness: .5, alphaTest: .45, emissive: '#FFFFFF', emissiveMap: tex, emissiveIntensity: .45 });
  const m = new T.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: tex, alphaTest: .45 });
  m.userData.B = B; m.frustumCulled = false; return m;
}
function render3D() {
  const r = R3, B = S && S.body; if (!r) return;
  // keep the 3D canvas exactly under the 2D one (the 2D one carries the buttons and meters)
  const st = r.cv2.style, key = st.left + st.top + st.width + st.height;
  if (key !== r.size) { r.size = key; Object.assign(r.el.style, { left: st.left, top: st.top, width: st.width, height: st.height, borderRadius: st.borderRadius }); r.ren.setSize(parseFloat(st.width) || W, parseFloat(st.height) || H, false); }
  if (!S) { r.ren.render(r.sc, r.cam); return; }
  // press: plate bottom sits where the physics says
  const P = S.press, py = WY(P.y), show = P.y > -69; r.press.visible = show;
  if (show) { r.plate.position.set(0, py + .5, 0); const topY = 15; r.rods.forEach(([rod, sleeve]) => { const len = Math.max(.1, topY - (py + 1)); rod.scale.y = len; rod.position.y = py + 1 + len / 2; sleeve.position.y = topY - 1.5; }); }
  const gap = S.sq.gap; r.paddles.forEach((g, k) => { g.visible = gap < 999; if (gap < 999) g.position.set((k ? 1 : -1) * (gap / 2 / U + .25), 0, 0); });
  const R = S.roller; r.roller.visible = R.on; if (R.on) { r.roller.position.set(WX(R.x), WY(R.y), 0); r.roller.rotation.z = -R.spin; }
  r.balls.forEach((m, i) => { const b = S.balls[i]; m.visible = !!b; if (b) { m.position.set(WX(b.x), WY(b.y), 0); m.rotation.z = -b.spin; m.material.opacity = Math.min(1, b.life); } });
  if (B) {
    if (!r.body || r.body.userData.B !== B) { if (r.body) { r.sc.remove(r.body); r.body.geometry.dispose(); } r.body = bodyMesh(B); r.sc.add(r.body); }
    const pos = r.body.geometry.attributes.position.array, X = B.x, c = centroid(X), per = 1 + RG * N;
    const ys = X.map(p => p[1]), hh = Math.max(...ys) - Math.min(...ys), A = Math.abs(area(X));
    const th = .42 * Math.min(B.w0, B.h0) / 2 / U * Math.max(.8, Math.min(2, Math.sqrt(Math.abs(B.A0) / Math.max(A, 1)) * (1 + .55 * Math.max(0, 1 - hh / B.h0))));
    for (let s = 0; s < 2; s++) {
      const o = s * per, sg = s ? -1 : 1; pos[o * 3] = WX(c[0]); pos[o * 3 + 1] = WY(c[1]); pos[o * 3 + 2] = sg * th;
      for (let k = 1; k <= RG; k++) { const f = k / RG, z = sg * th * Math.pow(Math.max(0, 1 - f * f), .55); for (let i = 0; i < N; i++) { const v = (o + 1 + (k - 1) * N + i) * 3; pos[v] = WX(c[0] + (X[i][0] - c[0]) * f); pos[v + 1] = WY(c[1] + (X[i][1] - c[1]) * f); pos[v + 2] = z; } }
    }
    r.body.geometry.attributes.position.needsUpdate = true; r.body.geometry.computeVertexNormals();
  }
  r.ren.render(r.sc, r.cam);
}
// finger position on screen → point on the physics plane (and back)
function toPhys(x, y) { if (!R3) return [x, y]; const T = R3.T; R3.ray.setFromCamera(new T.Vector2(x / W * 2 - 1, -(y / H * 2 - 1)), R3.cam); const o = R3.ray.ray.origin, d = R3.ray.ray.direction, t = -o.z / d.z; return [(o.x + d.x * t) * U + W / 2, FLOOR - (o.y + d.y * t) * U]; }
function toScreen(px, py) { if (!R3) return [px, py]; const v = new R3.T.Vector3(WX(px), WY(py), 0).project(R3.cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }

/* ---------- game object (a toy: no score, no end) ---------- */
const game = {
  id: 'squish-lab', title: 'Squish Lab', where: 'at the Squishy Testing Facility',
  how: ['Pick any of your squishies and test how squishy it is. No coins, no timer: just squish!', 'Hand: grab the edge to stretch it (two fingers stretch both ways), grab the middle to pick it up and throw it, tap to poke a dent.', 'Press, Roller and Squeeze: hold or drag to flatten it. Ball: tap to drop a heavy rubber ball. Drop: lift it high and let go.', 'Foam squishies rise back slowly, jelly ones wobble, rubber ones bounce. Squishies never break, they always spring back.'],
  keys: 'PC: mouse to squish · 1-6 pick a tool · Space = drop · S = swap squishy',
  menu: (G) => `<p class="eyebrow">Squishy Island toy</p><h1>Squish Lab</h1><p class="sub">at the Squishy Testing Facility</p><ul>${game.how.map(h => `<li>${h}</li>`).join('')}</ul><p class="rw">No coins here: it's just for fun.</p><button class="go" type="button">Start squishing</button><p class="keys">${game.keys}</p>`,
  act(a) { if (a.startsWith('pick:')) { const [, id, mat] = a.split(':'); load(id, mat); } SQV.G.__ui.innerHTML = ''; },
  init(G) {
    S = { grounded: false, tool: 'hand', holding: false, grabs: [], press: { y: -70, moving: false }, sq: { gap: 9999 }, roller: { on: false, x: 0, y: 0, tx: 0, ty: 0, r: 24, spin: 0 }, balls: [], pre: new Array(N).fill(0), rx: Array.from({ length: N }, () => [0, 0]), grabbed: new Set(), feet: new Set(), anchor: false, contact: false, sfx: [], meter: 0, best: 0, body: null, pick: SHELF[0], ptrs: {}, tip: 4, hiss: null, lastSq: 0 };
    load(SHELF[0][0], SHELF[0][2]);
  },
  update(dt, G) {
    if (!S.body) { load(S.pick[0], S.pick[2]); if (!S.body) return; }
    acc += Math.min(dt, .05); let n = 0; while (acc >= HSTEP && n < 40) { step(HSTEP); acc -= HSTEP; n++; }
    S.tip = Math.max(0, S.tip - dt);
    // squish-o-meter: how far the squishy is from its relaxed shape
    const B = S.body, ys = B.x.map(p => p[1]), xs = B.x.map(p => p[0]), hh = Math.max(...ys) - Math.min(...ys), ww = Math.max(...xs) - Math.min(...xs);
    const def = Math.max(1 - hh / B.h0, ww / B.w0 - 1, hh / B.h0 - 1, 1 - area(B.x) / B.A0);
    S.meter += (Math.max(0, Math.min(1, def * 1.4)) - S.meter) * Math.min(1, dt * 10); S.best = Math.max(S.best, S.meter);
    // sounds from impacts and fast squishing
    const ch = Math.abs(def - (S.lastDef ?? def)) / Math.max(dt, .001); S.lastDef = def; S.lastSq -= dt;
    if (ch > 1.6 && S.lastSq <= 0) { if (B.M.squish === 'boing' && def < S.prevDef) boing(Math.min(1, ch / 6)); else squelch(Math.min(1, ch / 5), B.M.squish); S.lastSq = .12; if (ch > 4) G.buzz(15); }
    S.prevDef = def;
    S.sfx.forEach(([k, v]) => { if (k === 'boing') boing(v); if (k === 'pop') { squelch(1, 'wet'); G.buzz(25); } }); S.sfx = [];
    const hissOn = S.press.moving && S.tool === 'press' && S.holding; hiss(hissOn);
    S.balls.forEach(b => b.life -= dt); S.balls = S.balls.filter(b => b.life > 0);
  },
  draw(c, G) {
    const t = G.t, B = S.body;
    if (setup3D()) { render3D(); drawUI(c, G); return; }
    // lab room (flat 2D fallback)
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#E8F4FF'); bg.addColorStop(1, '#D8E6F5'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(90,120,160,.10)'; c.lineWidth = 1; for (let x = 0; x < W; x += 24) { c.beginPath(); c.moveTo(x, 52); c.lineTo(x, FLOOR); c.stroke(); } for (let y = 64; y < FLOOR; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    // height marks (for drop tests)
    c.fillStyle = 'rgba(90,120,160,.35)'; for (let y = FLOOR - 100, k = 1; y > 80; y -= 100, k++) { c.fillRect(0, y, 10, 2); D.text(c, `${k}m`, 22, y, 9, 'rgba(90,120,160,.6)', 'center', 'body'); }
    // squeezer paddles
    if (S.sq.gap < 999) { const l = W / 2 - S.sq.gap / 2, r = W / 2 + S.sq.gap / 2; D.rr(c, l - 22, FLOOR - 190, 22, 186, 8, '#FFC93C'); D.rr(c, r, FLOOR - 190, 22, 186, 8, '#FFC93C'); c.fillStyle = '#9AA8BC'; c.fillRect(0, FLOOR - 104, l - 22, 10); c.fillRect(r + 22, FLOOR - 104, W - r - 22, 10); }
    // table
    D.rr(c, -6, FLOOR, W + 12, 30, 0, '#B8C6D8', INK, 2.5); c.fillStyle = '#FFD54A'; for (let x = -20; x < W; x += 30) { c.beginPath(); c.moveTo(x, FLOOR + 30); c.lineTo(x + 14, FLOOR + 30); c.lineTo(x + 26, FLOOR + 4); c.lineTo(x + 12, FLOOR + 4); c.closePath(); c.fill(); }
    if (B) {
      // soft shadow
      const xs = B.x.map(p => p[0]), ys = B.x.map(p => p[1]), lo = Math.max(...ys), hgt = FLOOR - lo;
      c.save(); c.globalAlpha = Math.max(.05, .22 - hgt / 1400); c.fillStyle = '#2B2141'; c.beginPath(); c.ellipse((Math.min(...xs) + Math.max(...xs)) / 2, FLOOR - 1, (Math.max(...xs) - Math.min(...xs)) / 2 * Math.max(.4, 1 - hgt / 700), 7, 0, 0, Math.PI * 2); c.fill(); c.restore();
      drawBody(c, B);
    }
    // balls
    S.balls.forEach(b => { c.save(); c.globalAlpha = Math.min(1, b.life); c.translate(b.x, b.y); c.rotate(b.spin); D.circle(c, 0, 0, b.r, '#FF6F7D', INK, 2.5); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, b.r, -.3, .3); c.lineTo(0, 0); c.fill(); c.beginPath(); c.arc(0, 0, b.r, Math.PI - .3, Math.PI + .3); c.lineTo(0, 0); c.fill(); D.circle(c, 0, 0, b.r, null, INK, 2.5); c.restore(); c.save(); c.globalAlpha = .6; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(b.x - 7, b.y - 8, 6, 4, -.5, 0, 7); c.fill(); c.restore(); });
    // hydraulic press
    const P = S.press; if (P.y > -69) { c.fillStyle = '#9AA8BC'; c.fillRect(60, 52, 14, P.y - 40); c.fillRect(W - 74, 52, 14, P.y - 40); c.fillStyle = '#C9D3E2'; c.fillRect(56, 52, 22, Math.max(0, Math.min(90, P.y - 52))); c.fillRect(W - 78, 52, 22, Math.max(0, Math.min(90, P.y - 52))); D.rr(c, 20, P.y - 42, W - 40, 42, 8, '#5B6B85', INK, 2.5); c.fillStyle = '#FFD54A'; for (let x = 30; x < W - 40; x += 28) { c.beginPath(); c.moveTo(x, P.y - 34); c.lineTo(x + 12, P.y - 34); c.lineTo(x + 4, P.y - 8); c.lineTo(x - 8, P.y - 8); c.closePath(); c.fill(); } D.text(c, 'HYDRAULIC PRESS', W / 2, P.y - 21, 12, '#FFFFFF', 'center', 'display', INK, 3); }
    // rolling pin
    const R = S.roller; if (R.on) { c.save(); c.translate(R.x, R.y); D.rr(c, -78, -7, 26, 14, 7, '#C98A55', INK, 2); D.rr(c, 52, -7, 26, 14, 7, '#C98A55', INK, 2); c.rotate(R.spin); D.circle(c, 0, 0, R.r, '#F2D7A8', INK, 2.5); c.strokeStyle = 'rgba(160,110,60,.5)'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, R.r - 6 - k * 5, k, k + 2); c.stroke(); } c.restore(); }
    drawUI(c, G);
  },
  down(x, y, id) {
    audio(); if (ac && ac.state === 'suspended') ac.resume();
    if (y < 52 && x > W - 100) { openShelf(); return; }
    if (y > 548) { const i = TOOLS.findIndex((o, k) => Math.hypot(TX(k) - x, TY - 6 - y) < 28); if (i >= 0) pickTool(TOOLS[i].k); return; }
    [x, y] = toPhys(x, y);
    S.ptrs[id] = { x, y, t: performance.now(), sx: x, sy: y };
    const B = S.body; if (!B) return;
    if (S.tool === 'hand') {
      if (!inside(B.x, x, y)) { let best = 99, bi = -1; B.x.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < best) { best = d; bi = i; } }); if (best > 26) return; }
      const c = centroid(B.x), edge = Math.min(...B.x.map(p => Math.hypot(p[0] - x, p[1] - y)));
      const pts = []; if (edge < 30) B.x.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < 52) pts.push([i, 1 - d / 60, p[0] - x, p[1] - y]); });
      else B.x.forEach((p, i) => pts.push([i, .5, p[0] - x, p[1] - y]));
      S.grabs.push({ id, x, y, sx: x, sy: y, pts, whole: edge >= 30 });
      if (edge < 30) { const near = new Set(pts.filter(q => q[1] > .3).map(q => q[0])); S.feet = new Set(); B.x.forEach((q, i) => { if (q[1] > FLOOR - PR - 3 && !near.has(i) && Math.hypot(q[0] - x, q[1] - y) > 60) S.feet.add(i); }); }
    }
    if (S.tool === 'press' || S.tool === 'squeeze') S.holding = true;
    if (S.tool === 'roller') { const R = S.roller; R.on = true; R.tx = x; R.ty = y; if (!R.placed) { R.x = x; R.y = Math.min(y, Math.min(...B.x.map(p => p[1])) - R.r - 8); R.placed = true; } }
    if (S.tool === 'ball' && S.balls.length < 4) { S.balls.push({ x: Math.max(30, Math.min(W - 30, x)), y: 110, vx: 0, vy: 0, r: 22, spin: 0, life: 9 }); }
  },
  move(x, y, id) { const p = S.ptrs[id]; if (!p) return; [x, y] = toPhys(x, y); p.x = x; p.y = y; S.grabs.forEach(g => { if (g.id === id) { g.x = x; g.y = y; } }); if (S.tool === 'roller') { S.roller.tx = x; S.roller.ty = y; } },
  up(x, y, id) {
    [x, y] = toPhys(x, y); const p = S.ptrs[id]; delete S.ptrs[id]; const g = S.grabs.find(g => g.id === id); S.grabs = S.grabs.filter(g => g.id !== id);
    if (p && g && Math.hypot(x - p.sx, y - p.sy) < 7 && performance.now() - p.t < 260) poke(x, y);
    if (!Object.keys(S.ptrs).length) { S.holding = false; S.roller.on = false; S.roller.placed = false; }
  },
  key(code, down) { if (!down) { if (code === 'Space') { S.holding = false; } return; } const m = /^Digit([1-6])$/.exec(code); if (m) { pickTool(TOOLS[+m[1] - 1].k); return; } if (code === 'Space') { if (S.tool === 'press' || S.tool === 'squeeze') S.holding = true; else drop(); return; } if (code === 'KeyS') { openShelf(); return; } return false; }
};
function drawUI(c, G) {
  const B = S.body;
  // hands
  S.grabs.forEach(g => { const [x, y] = toScreen(g.x, g.y); D.circle(c, x, y, 13, 'rgba(255,255,255,.75)', INK, 2.5); D.circle(c, x, y, 4, '#FF6FA3', null, 0); });
  // HUD
    c.fillStyle = '#4A7BD0'; c.fillRect(0, 0, W, 52);
    D.rr(c, 10, 10, 168, 32, 16, '#FFFFFF'); D.text(c, 'squish-o-meter', 52, 26, 9, '#6E6688', 'center', 'body'); D.bar(c, 92, 18, 80, 16, S.meter, S.meter > .7 ? '#FF6FA3' : S.meter > .4 ? '#FFC93C' : '#4FCFA0'); D.text(c, Math.round(S.meter * 100) + '%', 132, 26, 10, INK, 'center', 'body');
    D.text(c, `best ${Math.round(S.best * 100)}%`, 214, 26, 11, '#FFFFFF', 'center', 'body');
    D.rr(c, W - 98, 7, 90, 38, 19, '#FFFFFF'); D.sprite(c, S.pick[0], W - 78, 42, 34); D.text(c, 'swap', W - 40, 26, 12, INK, 'center', 'body');
    // material tag
    if (B) { D.rr(c, 10, 60, 190, 26, 13, 'rgba(255,255,255,.85)', null, 0); D.text(c, `${S.pick[1]} · ${B.M.name}`, 105, 73, 11, '#4A7BD0', 'center', 'body'); }
    if (S.tip > 0) { c.globalAlpha = Math.min(1, S.tip); tipText().split('|').forEach((l, k) => D.text(c, l, W / 2, 104 + k * 17, 12.5, '#4A7BD0', 'center', 'body')); c.globalAlpha = 1; }
    // toolbar
    D.rr(c, 6, 546, W - 12, 88, 18, '#FFFFFF');
    TOOLS.forEach((o, i) => { const x = TX(i), on = S.tool === o.k; D.circle(c, x, TY - 6, 23, on ? '#FFF3B0' : '#F2F6FC', on ? INK : '#C9D3E2', on ? 3 : 2); toolIcon(c, o.k, x, TY - 6); D.text(c, o.lbl, x, TY + 28, 10.5, on ? INK : '#6E7C92', 'center', 'body'); });

}
function tipText() { return { hand: 'Pull an edge to stretch · grab the middle to throw|tap to poke a dent', press: 'Hold anywhere to press down|let go to lift the press', roller: 'Drag the rolling pin over your squishy', squeeze: 'Hold anywhere to squeeze from both sides', ball: 'Tap to drop a heavy rubber ball', drop: 'Up it goes… and SPLAT!' }[S.tool]; }
function pickTool(k) { if (k === 'drop') { drop(); S.tip = 2; S.toolNote = 'drop'; return; } S.tool = k; S.tip = 3; S.holding = false; S.roller.on = false; SQV.G.sfx(640, .05, 'sine', .05); }
function drop() { const B = S.body; if (!B) return; const c = centroid(B.x), top = Math.min(...B.x.map(p => p[1])), dy = 130 - top; B.x.forEach((p, i) => { p[1] += dy; p[0] += (W / 2 - c[0]); B.v[i][0] = 0; B.v[i][1] = 0; }); S.grabs = []; }
function poke(x, y) { const B = S.body, c = centroid(B.x); B.x.forEach(p => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < 46) { const k = (1 - d / 46) * 20, dx = c[0] - p[0], dy = c[1] - p[1], l = Math.hypot(dx, dy) || 1; p[0] += dx / l * k; p[1] += dy / l * k; } }); squelch(.6, B.M.squish); SQV.G.buzz(12); }
function load(id, mat) { const b = makeBody(id, mat); if (!b) return; S.body = b; S.pick = SHELF.find(s => s[0] === id) || [id, id, mat]; S.best = 0; S.pre = new Array(N).fill(0); S.grabs = []; S.balls = []; }
function openShelf() {
  const G = SQV.G; G.__ui = G.__ui || document.querySelector('.ui');
  G.card(`<p class="eyebrow">Your squishies</p><h1 style="font-size:1.8em">Pick one to test</h1><div class="shelf">${SHELF.map(([id, name, mat]) => `<button type="button" class="sh" data-act="pick:${id}:${mat}"><img src="${SPR[id]}" alt=""><b>${name}</b><span>${MAT[mat].name}</span></button>`).join('')}</div><div class="btnrow"><button class="ghost" type="button" data-act="close">Close</button></div>`);
}
/* the squishy's own picture, stretched over the soft body one triangle at a time */
function drawBody(c, B) {
  const sh = B.sh, img = sh.img, X = B.x, ctr = centroid(X), src = sh.pts, s0 = [sh.mx, sh.my];
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N, a = X[i], b = X[j];
    // grow each triangle a hair so no seams show
    const ex = (p) => { const dx = p[0] - ctr[0], dy = p[1] - ctr[1], l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * .9, p[1] + dy / l * .9]; };
    const A = ex(a), Bp = ex(b), m = affine(s0, src[i], src[j], ctr, a, b); if (!m) continue;
    c.save(); c.beginPath(); c.moveTo(ctr[0], ctr[1]); c.lineTo(A[0], A[1]); c.lineTo(Bp[0], Bp[1]); c.closePath(); c.clip();
    c.transform(m[0], m[1], m[2], m[3], m[4], m[5]); c.drawImage(img, 0, 0); c.restore();
  }
}
function affine(s0, s1, s2, d0, d1, d2) {
  const x1 = s1[0] - s0[0], y1 = s1[1] - s0[1], x2 = s2[0] - s0[0], y2 = s2[1] - s0[1], det = x1 * y2 - x2 * y1; if (Math.abs(det) < 1e-6) return null;
  const u1 = d1[0] - d0[0], v1 = d1[1] - d0[1], u2 = d2[0] - d0[0], v2 = d2[1] - d0[1];
  const a = (u1 * y2 - u2 * y1) / det, cc = (u2 * x1 - u1 * x2) / det, b = (v1 * y2 - v2 * y1) / det, d = (v2 * x1 - v1 * x2) / det;
  return [a, b, cc, d, d0[0] - a * s0[0] - cc * s0[1], d0[1] - b * s0[0] - d * s0[1]];
}
function toolIcon(c, k, x, y) {
  c.save(); c.translate(x, y); c.lineWidth = 2.2; c.strokeStyle = INK; c.lineJoin = 'round';
  if (k === 'hand') { c.fillStyle = '#FFD9B8'; c.beginPath(); c.moveTo(-8, 10); c.lineTo(-10, -2); c.quadraticCurveTo(-11, -6, -7, -5); c.lineTo(-6, -11); c.quadraticCurveTo(-5, -14, -2, -12); c.lineTo(0, -14); c.quadraticCurveTo(3, -15, 4, -12); c.lineTo(6, -11); c.quadraticCurveTo(9, -11, 9, -7); c.lineTo(9, 4); c.quadraticCurveTo(8, 11, 2, 12); c.closePath(); c.fill(); c.stroke(); }
  if (k === 'press') { D.rr(c, -13, -12, 26, 8, 2, '#5B6B85', INK, 2); c.fillStyle = '#9AA8BC'; c.fillRect(-11, -16, 4, 4); c.fillRect(7, -16, 4, 4); c.beginPath(); c.ellipse(0, 8, 12, 4, 0, 0, 7); c.fillStyle = '#FF8FB8'; c.fill(); c.stroke(); }
  if (k === 'roller') { D.rr(c, -15, -3, 6, 6, 3, '#C98A55', INK, 1.6); D.rr(c, 9, -3, 6, 6, 3, '#C98A55', INK, 1.6); D.rr(c, -10, -6, 20, 12, 6, '#F2D7A8', INK, 2); }
  if (k === 'squeeze') { D.rr(c, -15, -10, 6, 20, 2, '#FFC93C', INK, 1.8); D.rr(c, 9, -10, 6, 20, 2, '#FFC93C', INK, 1.8); c.beginPath(); c.ellipse(0, 0, 8, 10, 0, 0, 7); c.fillStyle = '#8CCBFF'; c.fill(); c.stroke(); }
  if (k === 'ball') { D.circle(c, 0, 0, 10, '#FF6F7D', INK, 2); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, 10, -.4, .4); c.lineTo(0, 0); c.fill(); }
  if (k === 'drop') { c.lineWidth = 2.6; c.beginPath(); c.moveTo(0, -13); c.lineTo(0, 6); c.stroke(); c.beginPath(); c.moveTo(-6, 0); c.lineTo(0, 7); c.lineTo(6, 0); c.stroke(); c.beginPath(); c.ellipse(0, 11, 10, 3, 0, 0, 7); c.fillStyle = '#FF8FB8'; c.fill(); c.stroke(); }
  c.restore();
}
SQV.G = SQV.run(game); SQV.G.__ui = document.querySelector('.ui'); SQV.state = () => S; SQV.api = { step, poke, drop, game, load, MAT, shapeOf, toScreen, toPhys };
})();
