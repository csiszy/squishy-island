/* ===================== SQUISH BREAKER (Squish Arcade) =====================
   Level-based "balls versus bricks". Your squishies are the balls: you get exactly
   one ball for every squishy you own. Aim, let go, and they all fly out in a stream,
   bouncing off walls and bricks. Each hit takes 1 off a brick's number.
   When every squishy is back, all bricks move down one row. Clear every brick to win;
   if a brick reaches the floor, you lose. Levels open one after another: beat a level
   and the next one opens, whatever your collection. Each level is built for a
   "recommended" number of squishies; with fewer you need great aim, with more it gets
   easier, so collecting still pays off. */
(() => {
const { D, W, H } = SQV, INK = D.INK;
const COLS = 7, CELL = 48, X0 = (W - COLS * CELL) / 2, TOP = 66, ROWH = 44, FLOOR_ROW = 10, LY = 566, BR = 8, SPEED = 760;
const BALL_SQ = ['bao', 'kitty', 'jelly', 'marshmallow', 'puppy', 'peach', 'toast', 'bunny', 'whale', 'donut', 'sunny', 'acorn', 'octopus', 'macaron', 'hamster', 'shroomy'];
const L = SQV.levels('squish-breaker');
const OWN_KEY = 'squishyisland-owned-squishies';
const owned = () => { try { const v = +localStorage.getItem(OWN_KEY); return v > 0 ? Math.min(48, v) : 8; } catch (e) { return 8; } };
const setOwned = n => { try { localStorage.setItem(OWN_KEY, String(Math.max(1, Math.min(48, n)))); } catch (e) {} };
// how many squishies a level is built for (48 is every squishy in the game). Not a lock: just how tough the bricks are.
const need = n => Math.min(48, 5 + Math.floor((n - 1) * .6));
const TOUGH = 1;   // overall brick toughness
let S;

/* ---------- level recipe (seeded) ---------- */
function recipe(n) {
  const R = SQV.rng(n * 6151 + 3), req = need(n), d = Math.min(1, (n - 1) / 60);
  const rows = Math.min(12, 5 + Math.floor(n / 5)), grid = [];
  for (let r = 0; r < rows; r++) {
    const cnt = Math.max(2, Math.min(COLS, Math.round(2 + R() * 3 + d * .3)));
    const cols = [...Array(COLS).keys()].sort(() => R() - .5).slice(0, cnt);
    cols.forEach(c => {
      // bricks get tougher further down the list and on later levels; numbers scale with the balls you are expected to have
      const hp = Math.max(1, Math.round(req * TOUGH * (.72 + d * .08 + r / rows * .25) * (.6 + R() * .8)));
      grid.push({ r: r - rows + 2, c, hp, max: hp, bomb: n >= 4 && R() < .06, flash: 0 });
    });
  }
  return { n, req, rows, grid, par: rows + 2, big: n % 10 === 0 };
}
const brickXY = b => [X0 + b.c * CELL + 3, TOP + b.r * ROWH + 3, CELL - 6, ROWH - 6];

/* ---------- game ---------- */
const G = () => SQV.G;
const game = {
  id: 'squish-breaker', title: 'Squish Breaker', where: 'at the Squish Arcade', levels: true,
  how: ['Your squishies are the balls: one ball for every squishy you own.', 'Drag to aim (a dotted line shows the path), let go to fire them all.', 'Every hit takes 1 off a brick. When all squishies are back, the bricks move down a row.', 'Clear every brick to win. If a brick reaches the floor, try again. Beat a level to open the next one; more squishies make every level easier.'],
  keys: 'Drag to aim, let go to shoot · PC: mouse, or ← → to aim and Space to shoot · F = fast forward',
  coins: { menu: 'Coins: 30 + 15 per ★ the first time you beat a level (big levels ×2) · replays pay 10 + 15 per new ★', custom: () => SQV.levelPay(L, S.res) },
  menu(Gm, rw) {
    const top = L.top, own = owned(), from = Math.max(1, top - 9), btns = [];
    for (let n = from; n <= top + 3; n++) btns.push(n <= top ? `<button type="button" class="lv${n === top ? ' cur' : ''}${n % 10 === 0 ? ' boss' : ''}" data-go="${n}">${n}${SQV.starRow(L.stars(n))}</button>` : `<button type="button" class="lv lock" disabled title="Beat level ${n - 1} first">${n}<small>🔒</small></button>`);
    return `<p class="eyebrow">Squishy Island minigame</p><h1>${game.title}</h1><p class="sub">${game.where}</p><details class="how"${top === 1 ? ' open' : ''}><summary>How to play</summary><ul>${game.how.map(h => `<li>${h}</li>`).join('')}</ul>${rw}</details>
      <div class="own"><span>Your squishies: <b>${own}</b></span><button type="button" class="ghost sm" data-act="own-">−</button><button type="button" class="ghost sm" data-act="own+">+</button></div>
      <p class="keys" style="margin-top:0">Prototype only: change how many squishies you own (= how many balls you get). The real game uses your collection.</p>
      <button class="go" type="button" data-go="${top}">Play level ${top}</button><p class="best">Level ${top} is built for ${need(top)} squishies · you have ${own}</p>
      <div class="lvgrid">${btns.join('')}</div><p class="keys">${game.keys}</p>`;
  },
  over: (Gm, pay) => SQV.levelOver(S.res, pay),
  act(a) { if (a === 'own+') { setOwned(owned() + 1); G().menu(); } if (a === 'own-') { setOwned(owned() - 1); G().menu(); } if (a === 'menu') G().menu(); },
  canRevive: () => S.res && !S.res.win && S.res.title !== 'Restarted',
  revive() { S.res = null; S.bricks.forEach(b => b.r -= 3); S.phase = 'aim'; },
  reviveTitle: () => 'The bricks reached the floor', reviveLine: () => `${S.bricks.filter(b => b.hp > 0).length} bricks left.`, reviveGift: 'and push every brick back up 3 rows',
  init(Gm) {
    const n = Math.max(1, Math.min(L.top, +Gm.arg || L.top));
    const lv = recipe(n);
    S = { lv, bricks: lv.grid.map(b => ({ ...b })), balls: [], nBalls: owned(), lx: W / 2, nextX: null, phase: 'aim', aim: null, toShoot: 0, shootT: 0, turns: 0, fast: 1, shotT: 0, desc: 0, banner: 1.6, res: null, kbAng: -Math.PI / 2, sqi: 0, back: 0 };
  },
  update(dt, Gm) {
    S.banner = Math.max(0, S.banner - dt); S.bricks.forEach(b => b.flash = Math.max(0, b.flash - dt * 5));
    if (S.phase === 'shoot') {
      const sdt = dt * S.fast; S.shotT += dt; if (S.shotT > 7) S.fast = Math.max(S.fast, 2.5);
      if (S.toShoot > 0) { S.shootT -= sdt; while (S.toShoot > 0 && S.shootT <= 0) { const a = S.ang; S.balls.push({ x: S.lx, y: LY - BR, vx: Math.cos(a) * SPEED, vy: Math.sin(a) * SPEED, sq: BALL_SQ[S.sqi++ % BALL_SQ.length], live: true, rot: 0 }); S.toShoot--; S.shootT += .07; } }
      S.balls.forEach(b => moveBall(b, sdt));
      S.balls.forEach(b => { if (!b.live && b.homing) { b.x += (S.nextX - b.x) * Math.min(1, sdt * 10); if (Math.abs(b.x - S.nextX) < 1) b.homing = false; } });
      if (!S.toShoot && S.balls.every(b => !b.live && !b.homing)) endTurn();
    }
    if (S.phase === 'descend') { S.desc -= dt * 3; if (S.desc <= 0) { S.phase = 'aim'; checkEnd(); } }
  },
  draw(c, Gm) {
    const t = Gm.t;
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2A2350'); bg.addColorStop(1, '#4A2F6E'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { c.globalAlpha = .2 + .4 * Math.abs(Math.sin(t + i * 1.7)); c.fillStyle = '#FFE9A8'; c.fillRect((i * 97) % W, 70 + (i * 61) % 480, 2, 2); } c.globalAlpha = 1;
    // play field frame + danger line
    D.rr(c, X0 - 4, TOP - 6, COLS * CELL + 8, LY - TOP + 12, 14, 'rgba(255,255,255,.05)', 'rgba(255,255,255,.25)', 2);
    const dy = TOP + (FLOOR_ROW - 1) * ROWH + ROWH; c.setLineDash([8, 6]); c.strokeStyle = 'rgba(255,111,125,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(X0, dy); c.lineTo(X0 + COLS * CELL, dy); c.stroke(); c.setLineDash([]);
    // bricks
    const off = S.phase === 'descend' ? -S.desc * ROWH : 0;
    c.save(); c.beginPath(); c.rect(X0 - 4, TOP - 4, COLS * CELL + 8, LY - TOP + 8); c.clip();
    S.bricks.forEach(b => { if (b.hp <= 0) return; const [x, y, w, h] = brickXY(b), yy = y + off; if (yy + h < TOP - 2) return; const f = Math.min(1, b.hp / Math.max(1, S.lv.req * 2)), col = b.bomb ? '#FF8A3D' : hpCol(f);
      c.save(); if (b.flash) { c.translate(x + w / 2, yy + h / 2); c.scale(1 + b.flash * .08, 1 - b.flash * .06); c.translate(-x - w / 2, -yy - h / 2); }
      D.rr(c, x, yy, w, h, 9, col, INK, 2.5); c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x + 5, yy + 4, w - 10, 4);
      if (b.bomb) { D.circle(c, x + w / 2, yy + h / 2 - 2, 9, '#3A2A4A', null, 0); c.strokeStyle = '#FFD54A'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + w / 2 + 5, yy + h / 2 - 9); c.lineTo(x + w / 2 + 9, yy + h / 2 - 14); c.stroke(); D.text(c, String(b.hp), x + w / 2, yy + h / 2 - 1, 10, '#FFFFFF', 'center', 'body'); }
      else D.text(c, String(b.hp), x + w / 2, yy + h / 2 + 1, b.hp > 99 ? 13 : 16, '#FFFFFF', 'center', 'display', INK, 3);
      if (b.flash) { c.globalAlpha = b.flash * .6; D.rr(c, x, yy, w, h, 9, '#FFFFFF', null, 0); c.globalAlpha = 1; } c.restore(); });
    c.restore();
    // aim guide
    if (S.phase === 'aim' && S.aim) { const pts = trace(S.lx, LY - BR, S.ang); c.setLineDash([2, 9]); c.lineCap = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => c.lineTo(p[0], p[1])); c.stroke(); c.setLineDash([]); }
    // floor + launcher
    c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(X0, LY + 2, COLS * CELL, 3);
    S.balls.forEach(b => { if (b.live || b.homing) { D.circle(c, b.x, b.y, BR + 3, 'rgba(255,255,255,.22)', null, 0); D.sprite(c, b.sq, b.x, b.y, 28, { rot: b.rot, anchor: .6 }); } });
    if (S.phase !== 'shoot' || S.toShoot > 0) { D.sprite(c, BALL_SQ[S.sqi % BALL_SQ.length], S.lx, LY + 6, 30, { sy: 1 + Math.sin(t * 6) * .05 }); }
    D.text(c, `×${S.phase === 'shoot' ? S.toShoot : S.nBalls}`, Math.min(W - 26, S.lx + 30), LY - 8, 13, '#FFFFFF', 'center', 'display', INK, 3);
    // bottom bar
    D.rr(c, 10, 590, W - 20, 42, 16, 'rgba(255,255,255,.12)', null, 0);
    D.text(c, `turn ${S.turns + 1}`, 60, 611, 13, '#FFFFFF', 'center', 'body'); D.text(c, `bricks ${S.bricks.filter(b => b.hp > 0).length}`, 160, 611, 13, '#FFFFFF', 'center', 'body');
    if (S.phase === 'shoot') { D.rr(c, W - 96, 596, 80, 30, 15, S.fast > 1 ? '#FFD54A' : '#FFFFFF'); D.text(c, S.fast > 1 ? '⏩ fast' : '⏩ speed', W - 56, 611, 12, INK, 'center', 'body'); }
    else { D.text(c, `★★★ in ${S.lv.par} turns`, W - 70, 611, 12, '#FFE9A8', 'center', 'body'); }
    // hud
    D.hud(c, '#FF7A45', { t: `Level ${S.lv.n}`, w: 96 }, { t: `🧸 ${S.nBalls} squishies`, w: 128 });
    if (S.lv.big) D.text(c, 'BIG ×2', 150, 27, 11, '#FFF3B0', 'center', 'body');
    if (S.banner > 0) { c.globalAlpha = Math.min(1, S.banner * 2); D.rr(c, 40, 280, W - 80, 76, 20, '#FFFFFF'); D.text(c, `Level ${S.lv.n}`, W / 2, 304, 24, '#FF7A45', 'center', 'display'); D.text(c, `${S.lv.rows} rows · built for ${S.lv.req} squishies (you have ${S.nBalls})`, W / 2, 334, 12, INK, 'center', 'body'); c.globalAlpha = 1; }
  },
  down(x, y) {
    if (S.phase === 'shoot') { if (y > 590 && x > W - 100) S.fast = S.fast > 1 ? 1 : 2.5; return; }
    if (S.phase !== 'aim') return; S.aim = { x, y }; setAng(x, y);
  },
  move(x, y) { if (S.aim && S.phase === 'aim') { S.aim = { x, y }; setAng(x, y); } },
  up(x, y) { if (!S.aim || S.phase !== 'aim') return; S.aim = null; if (y < LY - 12) shoot(); },
  key(code, down) {
    if (!down) return;
    if (code === 'KeyF' && S.phase === 'shoot') { S.fast = S.fast > 1 ? 1 : 2.5; return; }
    if (S.phase !== 'aim') return code === 'ArrowLeft' || code === 'ArrowRight' || code === 'Space' ? undefined : false;
    if (code === 'ArrowLeft' || code === 'ArrowRight') { S.kbAng = Math.max(-Math.PI + .16, Math.min(-.16, S.kbAng + (code === 'ArrowLeft' ? -.04 : .04))); S.ang = S.kbAng; S.aim = { kb: true }; return; }
    if (code === 'Space') { S.aim = null; S.ang = S.ang ?? S.kbAng; shoot(); return; }
    return false;
  }
};
function setAng(x, y) { let a = Math.atan2(y - (LY - BR), x - S.lx); if (a > -.16 && a < Math.PI / 2) a = -.16; if (a >= Math.PI / 2 || a < -Math.PI + .16) a = -Math.PI + .16; S.ang = a; S.kbAng = a; }
function shoot() { if (S.ang == null) return; S.phase = 'shoot'; S.toShoot = S.nBalls; S.shootT = 0; S.balls = []; S.nextX = null; S.fast = 1; S.shotT = 0; G().sfx(520, .12, 'triangle', .07, 1.6); }
function endTurn() {
  S.turns++; S.lx = S.nextX ?? S.lx; S.balls = [];
  if (!S.bricks.some(b => b.hp > 0)) return finish(true);
  S.bricks.forEach(b => b.r++); S.phase = 'descend'; S.desc = 1; G().sfx(240, .15, 'sine', .05, .8);
}
function checkEnd() { if (S.bricks.some(b => b.hp > 0 && b.r >= FLOOR_ROW)) finish(false); }
function finish(win) {
  const st = win ? (S.turns <= S.lv.par ? 3 : S.turns <= S.lv.par + 3 ? 2 : 1) : 0;
  S.res = { n: S.lv.n, win, stars: st, title: 'The bricks reached the floor', line: win ? `${S.turns} turns · ${S.nBalls} squishies` : `${S.bricks.filter(b => b.hp > 0).length} bricks left. Try a different angle!` };
  S.phase = 'over'; G().end();
}
function hit(b) {
  b.hp--; b.flash = 1; if (b.hp > 0) { if (Math.random() < .5) G().sfx(500 + Math.random() * 300, .03, 'square', .025); return; }
  const [x, y, w, h] = brickXY(b); G().burst(x + w / 2, y + h / 2, b.bomb ? '#FF8A3D' : hpCol(.5), 10, 120); G().sfx(880, .08, 'triangle', .06, 1.4);
  if (b.bomb) { G().shake(.2); G().buzz(30); S.bricks.forEach(o => { if (o.hp > 0 && Math.abs(o.r - b.r) <= 1 && Math.abs(o.c - b.c) <= 1) { o.hp = Math.max(0, o.hp - 5); o.flash = 1; if (o.hp === 0) hit({ ...o, hp: 1 }); } }); }
}
function moveBall(b, dt) {
  if (!b.live) return; let rem = SPEED * dt;
  while (rem > 0 && b.live) {
    const s = Math.min(rem, 5); rem -= s; const sp = Math.hypot(b.vx, b.vy); b.x += b.vx / sp * s; b.y += b.vy / sp * s; b.rot += s * .02;
    if (b.x < X0 + BR) { b.x = X0 + BR; b.vx = Math.abs(b.vx); } if (b.x > X0 + COLS * CELL - BR) { b.x = X0 + COLS * CELL - BR; b.vx = -Math.abs(b.vx); }
    if (b.y < TOP + BR - 4) { b.y = TOP + BR - 4; b.vy = Math.abs(b.vy); }
    for (const k of S.bricks) {
      if (k.hp <= 0) continue; const [x, y, w, h] = brickXY(k); if (b.x < x - BR || b.x > x + w + BR || b.y < y - BR || b.y > y + h + BR) continue;
      const cx = Math.max(x, Math.min(b.x, x + w)), cy = Math.max(y, Math.min(b.y, y + h)); let nx = b.x - cx, ny = b.y - cy, d = Math.hypot(nx, ny);
      if (d >= BR) continue;
      if (d < 1e-6) { nx = -b.vx; ny = -b.vy; d = Math.hypot(nx, ny); }
      nx /= d; ny /= d; b.x = cx + nx * BR; b.y = cy + ny * BR; const dot = b.vx * nx + b.vy * ny; if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
      hit(k); break;
    }
    if (Math.abs(b.vy) < SPEED * .12) { b.vy = (b.vy < 0 ? -1 : 1) * SPEED * .12; const m = Math.hypot(b.vx, b.vy); b.vx *= SPEED / m; b.vy *= SPEED / m; }
    if (b.y > LY - BR && b.vy > 0) { b.y = LY - BR; b.live = false; if (S.nextX == null) S.nextX = Math.max(X0 + 16, Math.min(X0 + COLS * CELL - 16, b.x)); else b.homing = true; }
  }
}
function trace(x, y, a) {   // dotted aim line: to the first wall or brick, then one bounce
  const pts = [[x, y]]; let vx = Math.cos(a), vy = Math.sin(a), len = 0, bounces = 0;
  while (len < 900 && bounces < 2) {
    x += vx * 4; y += vy * 4; len += 4;
    if (x < X0 + BR || x > X0 + COLS * CELL - BR) { vx = -vx; bounces++; pts.push([x, y]); }
    if (y < TOP + BR - 4) { vy = -vy; bounces++; pts.push([x, y]); }
    if (S.bricks.some(k => { if (k.hp <= 0) return false; const [bx, by, w, h] = brickXY(k); return x > bx - BR && x < bx + w + BR && y > by - BR && y < by + h + BR; })) { pts.push([x, y]); break; }
    if (y > LY) break;
  }
  pts.push([x, y]); return pts;
}
function hpCol(f) { const a = [[255, 213, 74], [255, 111, 163], [165, 124, 255], [74, 155, 255]], i = Math.min(2, Math.floor(f * 3)), u = f * 3 - i, A = a[i], B = a[i + 1]; return `rgb(${A.map((v, k) => Math.round(v + (B[k] - v) * Math.min(1, u))).join(',')})`; }
SQV.G = SQV.run(game); SQV.state = () => S; SQV.api = { recipe, need, game, shoot, setAng };
})();
