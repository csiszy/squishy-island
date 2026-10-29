/* ===================== SORT-A-LOT (Squishy Post Office) =====================
   Endless: letters ride the conveyor belt. Swipe each one into the mail bag
   with the same stamp. The belt speeds up and more bags open the longer you go. */
(() => {
const { D, W, H } = SQV, INK = D.INK;
const BAGS = [{ col: '#E2B676', sq: 'bao' }, { col: '#FF8FB8', sq: 'marshmallow' }, { col: '#8CCBFF', sq: 'jelly' }, { col: '#7ED3B2', sq: 'sprout' }, { col: '#FFB833', sq: 'toast' }, { col: '#B48CFF', sq: 'moon' }];
const BELT_Y = 236;
let S;
function bagsNow() { const n = Math.min(6, 2 + Math.floor(S.level / 2)); const pat = S.level >= 9; return Array.from({ length: n }, (_, i) => { const b = BAGS[pat ? i % 4 : i]; const w = (W - 20) / n; return { ...b, pat: pat && i >= 4 ? 'dots' : 'plain', x: 10 + w * (i + .5), w: w - 6, i }; }); }
const game = {
  id: 'sort-a-lot', title: 'Sort-a-Lot', where: 'at the Squishy Post Office',
  how: ['Letters ride along the belt. Each has a coloured stamp.', 'Swipe (or drag) a letter down into the mail bag with the same colour.', 'Wrong bag, or a letter falls off the end of the belt: you lose a heart. 3 hearts and it is over.', 'Sort in a row to build your streak multiplier.', 'The belt speeds up and more bags open, forever. Later, stamps get spots too!'],
  keys: 'PC: drag letters with the mouse, or press 1–6 to send the front letter to that bag', scoreName: 'points',
  coins: { rule: 'points ÷ 55', base: G => G.score / 55 },
  overLine: () => `${S.sorted} letters sorted`,
  revive(G) { S.hearts = 1; S.streak = 0; S.letters = S.letters.filter(l => l.x < W * .5 || l.fly); },
  init(G) { S = { letters: [], hearts: 3, sorted: 0, streak: 0, level: 0, spawn: .4, drag: null, belt: 0, flash: [] }; },
  update(dt, G) {
    S.level = Math.floor(S.sorted / 7);
    const speed = Math.min(175, 46 + S.level * 9), interval = Math.max(.55, 2.1 - S.level * .12), bags = bagsNow();
    S.belt = (S.belt + speed * dt) % 30;
    S.spawn -= dt; if (S.spawn <= 0) { const b = bags[Math.floor(Math.random() * bags.length)]; S.letters.push({ x: -30, y: BELT_Y - 22, bag: b.i, col: b.col, pat: b.pat, r: (Math.random() - .5) * .2, fly: null }); S.spawn = interval * (.75 + Math.random() * .5); }
    S.letters.forEach(l => {
      if (l.fly) { l.fly.t += dt * 4; const f = l.fly, u = Math.min(1, f.t); l.x = f.x0 + (f.x1 - f.x0) * u; l.y = f.y0 + (f.y1 - f.y0) * u - Math.sin(u * Math.PI) * 40; if (u >= 1) l.dead = true; return; }
      if (S.drag && S.drag.l === l) return;
      if (l.y < BELT_Y - 22) l.y = Math.min(BELT_Y - 22, l.y + dt * 300);
      l.x += speed * dt;
      if (l.x > W + 30) { l.dead = true; miss(G, 'Missed!'); }
    });
    S.letters = S.letters.filter(l => !l.dead); S.flash.forEach(f => f.t -= dt); S.flash = S.flash.filter(f => f.t > 0);
  },
  draw(c, G) {
    const t = G.t, bags = bagsNow();
    c.fillStyle = '#FFF7D6'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#FFF2C2' : '#FFF7D6'; c.fillRect(0, 52 + i * 60, W, 60); }
    D.rr(c, 70, 76, 220, 56, 14, '#FFFFFF'); D.text(c, 'Swipe each letter into', 180, 94, 13, '#3BA7A0', 'center', 'body'); D.text(c, 'the bag with the same stamp', 180, 114, 13, '#3BA7A0', 'center', 'body');
    // belt
    D.rr(c, -10, BELT_Y - 4, W + 20, 30, 8, '#5A5170'); for (let i = -1; i < 14; i++) { const x = i * 30 + S.belt; D.circle(c, x, BELT_Y + 11, 7, '#9A8FAA', INK, 2); }
    c.fillStyle = 'rgba(229,72,77,.18)'; c.fillRect(W - 24, BELT_Y - 60, 24, 90); D.text(c, '!', W - 12, BELT_Y - 40, 16, '#E5484D', 'center', 'display');
    // bags
    bags.forEach(b => {
      const x = b.x, w = Math.min(70, b.w), top = 466, hot = S.drag && Math.abs(S.drag.x - x) < b.w / 2 && S.drag.y > 380, fl = S.flash.find(f => f.i === b.i);
      c.save(); if (hot) { c.translate(x, 600); c.scale(1.08, 1.08); c.translate(-x, -600); }
      c.beginPath(); c.moveTo(x - w / 2, 630); c.quadraticCurveTo(x - w / 2 - 6, top + 30, x - w * .3, top); c.lineTo(x + w * .3, top); c.quadraticCurveTo(x + w / 2 + 6, top + 30, x + w / 2, 630); c.closePath(); c.fillStyle = b.col; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
      c.lineWidth = 2; c.strokeStyle = 'rgba(58,42,74,.5)'; c.beginPath(); c.moveTo(x - w * .3, top + 6); c.quadraticCurveTo(x, top - 8, x + w * .3, top + 6); c.stroke();
      D.rr(c, x - 19, top + 14, 38, 40, 8, '#FFFFFF', INK, 2); stamp(c, x, top + 34, b.col, b.pat, 1.3); D.sprite(c, b.sq, x, 616, Math.min(56, w * .9));
      D.text(c, String(b.i + 1), x, 640 - 8, 10, 'rgba(58,42,74,.45)', 'center', 'body');
      if (fl) { c.globalAlpha = fl.t * 2; D.circle(c, x, top + 60, 40, fl.ok ? '#4FCFA0' : '#FF6F7D', null, 0); c.globalAlpha = 1; }
      c.restore();
    });
    // letters
    S.letters.forEach(l => letter(c, l.x, l.y, l.col, l.pat, l.r + (S.drag && S.drag.l === l ? Math.sin(t * 20) * .05 : 0), S.drag && S.drag.l === l ? 1.25 : 1));
    if (S.drag) { c.setLineDash([6, 6]); c.strokeStyle = 'rgba(58,42,74,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(S.drag.x, S.drag.y + 20); c.lineTo(S.drag.x, 460); c.stroke(); c.setLineDash([]); }
    // hud
    D.hud(c, '#3BA7A0', { t: '★ ' + G.score.toLocaleString('en-US'), w: 116 }); D.hearts(c, W - 66, 26, S.hearts);
    D.rr(c, 134, 12, 84, 28, 14, '#FFFFFF'); D.text(c, `streak ×${mult()}`, 176, 27, 13, INK, 'center', 'body');
    D.text(c, `Sorted ${S.sorted}`, W / 2, 448, 13, '#3BA7A0', 'center', 'body');
  },
  down(x, y, id) { const l = [...S.letters].reverse().find(l => !l.fly && Math.abs(l.x - x) < 34 && Math.abs(l.y - y) < 30); if (l) S.drag = { l, x, y, sx: x, sy: y, hist: [[x, y, performance.now()]] }; },
  move(x, y) { if (!S.drag) return; const d = S.drag; d.x = x; d.y = y; d.l.x = x; d.l.y = y - 10; d.hist.push([x, y, performance.now()]); if (d.hist.length > 6) d.hist.shift(); },
  up(x, y) {
    const G = SQV.G, d = S.drag; if (!d) return; S.drag = null;
    const bags = bagsNow(), [hx, hy, ht] = d.hist[0], dtm = Math.max(16, performance.now() - ht), vx = (x - hx) / dtm, vy = (y - hy) / dtm;
    let tx = x; if (y < 430 && vy > .25) tx = x + vx / vy * (540 - y);   // a quick swipe flies toward where it is heading
    else if (y < 400) return;                                            // let go too high: letter goes back to the belt
    const b = bags.reduce((best, q) => Math.abs(q.x - tx) < Math.abs(best.x - tx) ? q : best, bags[0]);
    sendTo(G, d.l, b);
  },
  key(code, down) { if (!down) return; const m = /^Digit([1-6])$/.exec(code); if (!m) return false; const b = bagsNow()[+m[1] - 1]; if (!b) return; const l = S.letters.filter(l => !l.fly && l.x > 0).sort((a, b) => b.x - a.x)[0]; if (l) sendTo(SQV.G, l, b); }
};
const mult = () => Math.min(5, 1 + Math.floor(S.streak / 5));
function sendTo(G, l, b) {
  l.fly = { t: 0, x0: l.x, y0: l.y, x1: b.x, y1: 500 };
  const ok = l.bag === b.i || (l.col === b.col && l.pat === b.pat);
  S.flash.push({ i: b.i, t: .5, ok });
  if (ok) { S.sorted++; S.streak++; const pts = 10 * mult(); G.score += pts; G.float(b.x, 440, '+' + pts, '#FFD54A', 18); G.sfx(700 + Math.min(12, S.streak) * 40, .07, 'triangle', .07, 1.3); }
  else miss(G, 'Wrong bag!', b.x);
}
function miss(G, txt, x = W - 40) { S.hearts--; S.streak = 0; G.shake(.25); G.buzz(70); G.float(x, 420, txt, '#FF6F7D', 16); G.sfx(200, .25, 'square', .05, .6); if (S.hearts <= 0) G.end(); }
function letter(c, x, y, col, pat, r, s) {
  c.save(); c.translate(x, y); c.rotate(r); c.scale(s, s);
  D.rr(c, -27, -18, 54, 36, 4, '#FFFFFF', '#9A8FAA', 2.5); c.lineWidth = 2; c.strokeStyle = '#9A8FAA'; c.beginPath(); c.moveTo(-27, -18); c.lineTo(0, 2); c.lineTo(27, -18); c.stroke();
  stamp(c, 15, -6, col, pat, .9); c.restore();
}
function stamp(c, x, y, col, pat, s) {
  c.save(); c.translate(x, y); c.scale(s, s); D.rr(c, -8, -9, 16, 18, 2, col, INK, 2);
  if (pat === 'dots') { c.fillStyle = '#FFFFFF'; [[-3, -4], [3, 0], [-3, 4]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 2, 0, 7); c.fill(); }); }
  c.restore();
}
SQV.G = SQV.run(game); SQV.state = () => S;
})();
