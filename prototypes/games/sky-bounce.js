/* ===================== SKY BOUNCE (Bounce Park) =====================
   Endless jumper: bounce from cloud to cloud and climb as high as you can.
   It gets harder the higher you go: bigger gaps, moving leaves, crumbly clouds. */
(() => {
const { D, W, H } = SQV, INK = D.INK;
let S;
function lerpC(a, b, t) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }
const SKY = [[0, '#DFF3FF', '#8CCBFF'], [2500, '#FFE3EE', '#FFB3CE'], [6000, '#FFD9A8', '#B9A6FF'], [11000, '#5B4BA8', '#2E2452']];
function skyAt(h) { for (let i = SKY.length - 1; i >= 0; i--) if (h >= SKY[i][0]) { const n = SKY[i + 1]; if (!n) return [SKY[i][1], SKY[i][2]]; const t = Math.min(1, (h - SKY[i][0]) / (n[0] - SKY[i][0])); return [lerpC(SKY[i][1], n[1], t), lerpC(SKY[i][2], n[2], t)]; } return [SKY[0][1], SKY[0][2]]; }

function addPlat(y) {
  const h = -y, diff = Math.min(1, h / 12000);
  const r = Math.random(), w = 70 - diff * 18;
  // never further sideways than a bounce can steer (the screen wraps, so measure both ways round)
  const reach = Math.max(40, reachX(Math.abs(y - S.lastY)) - w / 2); let px = 30 + Math.random() * (W - 60), dx = px - S.lastX;
  dx -= Math.round(dx / (W + 40)) * (W + 40); if (Math.abs(dx) > reach) px = Math.max(30, Math.min(W - 30, S.lastX + Math.sign(dx) * reach * (.5 + Math.random() * .5)));
  S.lastX = px; S.lastY = y;
  let type = 'cloud';
  if (h > 600 && r < .12 + diff * .2) type = 'crumble';
  else if (h > 300 && r < .32 + diff * .3) type = 'leaf';
  const p = { x: px, y, w, type, vx: type === 'leaf' ? (Math.random() < .5 ? -1 : 1) * (40 + diff * 90) * (h > 1200 ? 1 : 0) : 0, dead: 0, spring: false };
  if (type !== 'crumble' && Math.random() < .08) p.spring = true;
  S.plats.push(p);
  if (Math.random() < .55) S.items.push({ k: 'coin', x: p.x + (Math.random() - .5) * 40, y: y - 40 - Math.random() * 30 });
  else if (h > 800 && Math.random() < .035) S.items.push({ k: 'balloon', x: p.x, y: y - 60 });
}
function gapAt(h) { return 62 + Math.min(95, h / 110); }
// the next cloud up: bigger gaps higher up, but never more than a normal bounce (rises about 192) comfortably reaches
const MAX_GAP = 150, nextGap = h => Math.min(MAX_GAP, gapAt(h) * (.7 + Math.random() * .5));
const reachX = gap => 330 * (760 + Math.sqrt(Math.max(0, 760 * 760 - 3000 * gap))) / 1500 * .75;

const game = {
  id: 'sky-bounce', title: 'Sky Bounce', where: 'at Bounce Park',
  how: ['Your squishy bounces by itself every time it lands.', 'Steer left and right to land on the next cloud.', 'Phone: hold or slide your finger left / right. PC: arrow keys or A / D.', 'Springs and balloons send you flying. Crumbly clouds break after one bounce.', 'It goes forever: the higher you climb, the trickier the sky.'],
  keys: 'PC: ← → or A / D · Enter to start', scoreName: 'metres high',
  coins: { rule: 'keep every coin you grab', from: 'coins grabbed', base: () => S.coins, tiers: [600, 1200, 2000], unit: 'm high' },
  overLine: () => `${S.coins} coins collected`,
  revive(G) { S.x = W / 2; S.y = S.camY + H - 140; S.vy = -900; S.float = 1.8; G.float(W / 2, H / 2, 'Up you go!', '#FFD54A', 26); },
  reviveGift: 'and float back up with a balloon',
  init(G) {
    S = { x: W / 2, y: -40, vy: -700, plats: [], items: [], camY: -H + 120, top: 0, coins: 0, steer: 0, target: null, keys: { l: false, r: false }, float: 0, squash: 0, face: 1, lastX: W / 2, lastY: 0 };
    S.plats.push({ x: W / 2, y: 0, w: 120, type: 'cloud', vx: 0, dead: 0, spring: false });
    let y = 0; while (y > -H * 1.6) { y -= nextGap(-y); addPlat(y); }
  },
  update(dt, G) {
    // steering
    let ax = 0; if (S.keys.l) ax -= 1; if (S.keys.r) ax += 1;
    if (S.target != null) { const d = S.target - S.x; ax = Math.max(-1, Math.min(1, d / 40)); }
    S.x += ax * 330 * dt; if (ax) S.face = ax > 0 ? 1 : -1;
    if (S.x < -20) S.x += W + 40; if (S.x > W + 20) S.x -= W + 40;
    // physics
    if (S.float > 0) { S.float -= dt; S.vy = -520; } else S.vy += 1500 * dt;
    const prevY = S.y; S.y += S.vy * dt; S.squash = Math.max(0, S.squash - dt * 4);
    if (S.vy > 0) for (const p of S.plats) {
      if (p.dead) continue;
      if (prevY <= p.y - 2 && S.y >= p.y - 2 && Math.abs(S.x - p.x) < p.w / 2 + 14) {
        S.y = p.y - 2; S.squash = 1;
        if (p.spring && Math.abs(S.x - p.x) < 22) { S.vy = -1180; G.sfx(500, .25, 'sine', .1, 3); G.burst(S.x, p.y, '#FF6F7D', 8); }
        else { S.vy = -760; G.sfx(420 + Math.random() * 80, .09, 'sine', .08, 1.6); }
        if (p.type === 'crumble') { p.dead = .01; G.noise(.12, .07, 1200); }
        break;
      }
    }
    S.plats.forEach(p => { if (p.vx) { p.x += p.vx * dt; if (p.x < p.w / 2 || p.x > W - p.w / 2) p.vx *= -1; } if (p.dead) p.dead += dt; });
    // items
    S.items.forEach(it => { if (it.got) return; if (Math.hypot(it.x - S.x, it.y - (S.y - 26)) < 30) { it.got = true; if (it.k === 'coin') { S.coins++; G.sfx(1400, .07, 'square', .05, 1.4); G.float(it.x, it.y - S.camY - 10, '+1', '#FFD54A', 15); } else { S.float = 2.4; G.sfx(700, .4, 'sine', .1, 2); } } });
    // camera + score
    S.top = Math.max(S.top, -S.y); const want = S.y - H * .42; if (want < S.camY) S.camY += (want - S.camY) * Math.min(1, dt * 8);
    G.score = Math.floor(S.top / 10);
    // spawn ahead / clean behind
    let highest = Math.min(...S.plats.map(p => p.y)); while (highest > S.camY - 200) { highest -= nextGap(-highest); addPlat(highest); }
    S.plats = S.plats.filter(p => p.y < S.camY + H + 60 && p.dead < 1); S.items = S.items.filter(i => !i.got && i.y < S.camY + H + 60);
    if (S.y > S.camY + H + 40) G.end();
  },
  draw(c, G) {
    const h = S.top, [a, b] = skyAt(h), gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, b); gr.addColorStop(1, a); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    if (h > 8000) { c.fillStyle = '#FFF3B0'; for (let i = 0; i < 40; i++) { const sx = (i * 97) % W, sy = ((i * 173 - S.camY * .2) % H + H) % H; c.globalAlpha = Math.min(1, (h - 8000) / 3000) * (.4 + .6 * Math.abs(Math.sin(G.t * 2 + i))); c.fillRect(sx, sy, 2.5, 2.5); } c.globalAlpha = 1; }
    // far clouds (parallax)
    for (let i = 0; i < 6; i++) { const y = ((i * 140 - S.camY * .3) % (H + 120) + H + 120) % (H + 120) - 60, x = (i * 131) % W; c.globalAlpha = .5; cloud(c, x, y, 34, '#FFFFFF', null); c.globalAlpha = 1; }
    const oy = -S.camY;
    if (S.camY > -H) { c.fillStyle = '#9ED67E'; c.fillRect(0, oy + 10, W, 400); }
    S.plats.forEach(p => {
      const y = p.y + oy; if (y < -30 || y > H + 30) return;
      c.save(); if (p.dead) { c.globalAlpha = Math.max(0, 1 - p.dead * 2); c.translate(0, p.dead * 120); }
      if (p.type === 'leaf') { c.beginPath(); c.ellipse(p.x, y + 4, p.w / 2, 9, 0, 0, Math.PI * 2); c.fillStyle = '#7ED36A'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); c.lineWidth = 1.5; c.strokeStyle = '#4E9B4E'; c.beginPath(); c.moveTo(p.x - p.w / 2 + 8, y + 4); c.lineTo(p.x + p.w / 2 - 8, y + 4); c.stroke(); }
      else cloud(c, p.x, y + 6, p.w / 2, p.type === 'crumble' ? '#E3DEEF' : '#FFFFFF', p.type === 'crumble');
      if (p.spring) { c.lineWidth = 2.5; c.strokeStyle = '#9A8FAA'; c.beginPath(); c.moveTo(p.x - 6, y - 2); c.lineTo(p.x + 6, y - 6); c.lineTo(p.x - 6, y - 10); c.lineTo(p.x + 6, y - 14); c.stroke(); D.rr(c, p.x - 12, y - 20, 24, 7, 3.5, '#FF6F7D'); }
      c.restore();
    });
    S.items.forEach(it => { const y = it.y + oy + Math.sin(G.t * 3 + it.x) * 3; if (it.k === 'coin') D.coin(c, it.x, y, 8); else { c.lineWidth = 1.5; c.strokeStyle = '#9A8FAA'; c.beginPath(); c.moveTo(it.x, y + 16); c.quadraticCurveTo(it.x - 6, y + 28, it.x, y + 38); c.stroke(); c.beginPath(); c.ellipse(it.x, y, 13, 16, 0, 0, Math.PI * 2); c.fillStyle = '#FF6FA3'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); } });
    // player
    const px = S.x, py = S.y + oy, sq = S.squash;
    if (S.float > 0) { c.lineWidth = 1.5; c.strokeStyle = '#9A8FAA'; c.beginPath(); c.moveTo(px, py - 52); c.lineTo(px + 4, py - 80); c.stroke(); c.beginPath(); c.ellipse(px + 4, py - 96, 14, 18, 0, 0, Math.PI * 2); c.fillStyle = '#FF6FA3'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
    D.sprite(c, 'marshmallow', px, py, 64, { sx: 1 + sq * .22 - (S.vy < -300 ? .08 : 0), sy: 1 - sq * .22 + (S.vy < -300 ? .1 : 0), flip: S.face < 0 });
    if (S.target != null) { c.globalAlpha = .35; D.circle(c, S.target, H - 30, 14, '#FFFFFF', INK, 2); c.globalAlpha = 1; }
    // hud
    D.rr(c, 10, 12, 132, 30, 15, '#FFFFFF'); D.text(c, `${G.score.toLocaleString('en-US')} m`, 76, 28, 16, INK, 'center', 'body');
    D.rr(c, W - 92, 12, 82, 30, 15, '#FFFFFF'); D.coin(c, W - 74, 27, 8); D.text(c, String(S.coins), W - 46, 28, 15, INK, 'center', 'body');
    if (G.best && S.top / 10 < G.best) { const by = -G.best * 10 + oy; if (by > 50 && by < H) { c.setLineDash([8, 6]); c.strokeStyle = '#FF6FA3'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, by); c.lineTo(W, by); c.stroke(); c.setLineDash([]); D.text(c, 'your best', W - 50, by - 10, 11, '#FF6FA3', 'center', 'body'); } }
  },
  down(x) { S.target = x; }, move(x, y, id, pressed) { if (pressed && S.target != null) S.target = x; }, up() { S.target = null; },
  key(code, down) { if (code === 'ArrowLeft' || code === 'KeyA') S.keys.l = down; else if (code === 'ArrowRight' || code === 'KeyD') S.keys.r = down; else return false; }
};
function cloud(c, x, y, r, col, cracked) {
  const pts = [[-.6, .1, .55], [-.2, -.25, .7], [.3, -.2, .65], [.68, .1, .5], [0, .2, .6]];
  c.beginPath(); pts.forEach(([a, b, s]) => { c.moveTo(x + a * r + s * r * .6, y + b * r * .6); c.arc(x + a * r, y + b * r * .6, s * r * .6, 0, Math.PI * 2); });
  if (col) { c.fillStyle = col; c.fill(); }
  if (cracked !== null) { c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke(); c.fillStyle = col; pts.forEach(([a, b, s]) => { c.beginPath(); c.arc(x + a * r, y + b * r * .6, s * r * .6 - 1.4, 0, Math.PI * 2); c.fill(); }); }
  if (cracked) { c.lineWidth = 2; c.strokeStyle = '#9A8FAA'; c.beginPath(); c.moveTo(x - 6, y - 8); c.lineTo(x, y); c.lineTo(x - 4, y + 6); c.moveTo(x + 10, y - 6); c.lineTo(x + 6, y + 2); c.stroke(); }
}
SQV.G = SQV.run(game); SQV.state = () => S;
})();
