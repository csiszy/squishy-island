/* ===================== LOST & FOUND (Squish Police Station) =====================
   Level-based match-3. The station's lost-property box tipped over! Swap two
   neighbouring items to make lines of 3 or more of the same kind.
   Each level has a goal (collect items, find all the paw-print clues, pop the
   bubble wrap) and a limited number of moves. Beat it to earn 1–3 stars and
   unlock the next level. Levels never run out: they keep getting trickier.
   Specials: 4 in a row = Siren (clears its line), L or T shape = Bubble Bomb
   (clears around it), 5 in a row = Gold Badge (swap it with anything to clear
   every item of that kind). Swap two specials together for a mega combo. */
(() => {
const { D, W, H } = SQV, INK = D.INK;
const COLS = 7, ROWS = 8, T = 46, X0 = (W - COLS * T) / 2, Y0 = 150;
const ITEMS = [
  { n: 'balloon', col: '#FF5E6C', dk: '#C93445' }, { n: 'mitten', col: '#5BA8FF', dk: '#2F6FC2' }, { n: 'candy', col: '#FF8FD0', dk: '#C9579C' },
  { n: 'key', col: '#FFC93C', dk: '#C98A12' }, { n: 'clover', col: '#5ACB7A', dk: '#2F8F4E' }, { n: 'bow', col: '#A57CFF', dk: '#6E48C9' }
];
const MASKS = [   // board shapes ('.' = hole)
  null,
  ['.#####.', '#######', '#######', '#######', '#######', '#######', '#######', '.#####.'],
  ['#######', '#######', '##...##', '#######', '#######', '##...##', '#######', '#######'],
  ['###.###', '###.###', '#######', '#######', '#######', '#######', '###.###', '###.###'],
  ['.#####.', '..###..', '#######', '#######', '#######', '#######', '..###..', '.#####.'],
  ['#######', '.#####.', '#######', '#.###.#', '#.###.#', '#######', '.#####.', '#######']
];
const L = SQV.levels('lost-and-found');
let S, uid = 0;
const key = (r, c) => r * COLS + c;
const inB = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const live = (r, c) => inB(r, c) && !S.cells[r][c].hole;
const cx = c => X0 + c * T + T / 2, cy = r => Y0 + r * T + T / 2;

/* ---------- level recipe (same for every player: seeded by the level number) ---------- */
function recipe(n) {
  const R = SQV.rng(n * 7919 + 17), d = Math.min(1, (n - 1) / 45);
  const types = n <= 3 ? 5 : n < 10 ? (n % 3 === 0 ? 6 : 5) : (n % 5 === 0 ? 5 : 6);
  const TUT = ['collect', 'collect', 'prints', 'collect', 'wraps', 'prints', 'mix', 'wraps'];
  const kind = n <= TUT.length ? TUT[n - 1] : ['collect', 'prints', 'wraps', 'mix'][(n - 1) % 4];
  const mask = n <= 4 ? null : MASKS[1 + Math.floor(R() * (MASKS.length - 1))];
  const lvl = { n, types, kind, mask, moves: 0, collect: [], prints: 0, printLayers: 1, wraps: 0, wrapLayers: 1, seed: n * 31 + 7, big: n % 10 === 0 };
  const pickTypes = k => { const a = [...Array(types).keys()]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, k); };
  const amt = base => Math.round(base + d * base * .9 + R() * 3);
  if (kind === 'collect') { const k = n >= 7 && R() < .5 ? 3 : 2; lvl.collect = pickTypes(k).map(t => ({ t, need: amt(k === 3 ? 10 : 14) })); lvl.moves = 20 + (k === 3 ? 2 : 0) - Math.round(d * 3); }
  if (kind === 'prints') { lvl.printLayers = n >= 14 && R() < .6 ? 2 : 1; lvl.prints = n <= 3 ? 6 : Math.round((8 + d * 12) * (lvl.printLayers === 2 ? .65 : 1)); lvl.moves = 28 + (lvl.printLayers === 2 ? 4 : 0) - Math.round(d * 2); }
  if (kind === 'wraps') { lvl.wraps = Math.round(6 + d * 10); lvl.wrapLayers = n >= 12 && R() < .6 ? 2 : 1; lvl.moves = 24 + (lvl.wrapLayers === 2 ? 5 : 0) - Math.round(d * 2); }
  if (kind === 'mix') { lvl.prints = Math.round(6 + d * 9); lvl.collect = pickTypes(1).map(t => ({ t, need: amt(10) })); lvl.moves = 26 - Math.round(d * 2); }
  if (lvl.big) lvl.moves += 3;
  lvl.star2 = lvl.moves * 300; lvl.star3 = lvl.moves * 430;   // score needed for 2 and 3 stars (beating the goal = 1 star)
  return lvl;
}

/* ---------- board ---------- */
function newTile(t, r, c, fromY) { return { id: ++uid, t, sp: null, wrap: 0, x: cx(c), y: fromY ?? cy(r), vy: 0, die: 0, born: 1, spark: 0 }; }
function randType() { return Math.floor(S.R() * S.lvl.types); }
function build(lvl) {
  S.cells = []; for (let r = 0; r < ROWS; r++) { S.cells.push([]); for (let c = 0; c < COLS; c++) S.cells[r].push({ hole: !!(lvl.mask && lvl.mask[r][c] === '.'), print: 0 }); }
  const spots = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!S.cells[r][c].hole) spots.push([r, c]);
  const shuffled = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(S.R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  if (lvl.prints) { // paw prints in a lower patch so you have to dig
    const order = spots.slice().sort((a, b) => (b[0] - a[0]) * 10 + (S.R() - .5) * 26); order.slice(0, lvl.prints).forEach(([r, c]) => S.cells[r][c].print = lvl.printLayers);
  }
  for (let tries = 0; tries < 60; tries++) {
    S.grid = []; for (let r = 0; r < ROWS; r++) { S.grid.push([]); for (let c = 0; c < COLS; c++) {
      if (S.cells[r][c].hole) { S.grid[r].push(null); continue; }
      let t, k = 0; do { t = randType(); k++; } while (k < 30 && ((c >= 2 && S.grid[r][c - 1]?.t === t && S.grid[r][c - 2]?.t === t) || (r >= 2 && S.grid[r - 1][c]?.t === t && S.grid[r - 2][c]?.t === t)));
      S.grid[r].push(newTile(t, r, c, cy(r) - 400 - (ROWS - r) * 30));
    } }
    if (findMoves().length) break;
  }
  if (lvl.wraps) shuffled(spots).filter(([r]) => r >= 1).slice(0, lvl.wraps).forEach(([r, c]) => S.grid[r][c].wrap = lvl.wrapLayers);
  S.goal = { collect: lvl.collect.map(g => ({ ...g, got: 0 })), prints: countPrints(), wraps: countWraps() };
}
const countPrints = () => S.cells.flat().reduce((a, c) => a + c.print, 0);
const countWraps = () => S.grid.flat().reduce((a, t) => a + (t ? t.wrap : 0), 0);
function goalLeft() {
  let left = 0; S.goal.collect.forEach(g => left += Math.max(0, g.need - g.got));
  return left + countPrints() + countWraps();
}

/* ---------- matching ---------- */
function runs() {
  const out = [], tt = (r, c) => { const x = live(r, c) && S.grid[r][c]; return x && x.sp !== 'badge' && !x.die ? x.t : -1; };
  for (let r = 0; r < ROWS; r++) { let c = 0; while (c < COLS) { const t = tt(r, c); let e = c + 1; while (t >= 0 && e < COLS && tt(r, e) === t) e++; if (t >= 0 && e - c >= 3) out.push({ dir: 'h', t, cells: Array.from({ length: e - c }, (_, i) => [r, c + i]) }); c = e; } }
  for (let c = 0; c < COLS; c++) { let r = 0; while (r < ROWS) { const t = tt(r, c); let e = r + 1; while (t >= 0 && e < ROWS && tt(e, c) === t) e++; if (t >= 0 && e - r >= 3) out.push({ dir: 'v', t, cells: Array.from({ length: e - r }, (_, i) => [r + i, c]) }); r = e; } }
  return out;
}
function groups(rs) {   // runs that share a cell form one group (L and T shapes)
  const gs = []; rs.forEach(run => { const ks = new Set(run.cells.map(([r, c]) => key(r, c))); const hit = gs.filter(g => g.runs.some(o => o.cells.some(([r, c]) => ks.has(key(r, c))))); const g = { runs: [run] }; hit.forEach(h => { g.runs.push(...h.runs); gs.splice(gs.indexOf(h), 1); }); gs.push(g); });
  return gs;
}
function findMoves() {
  const mv = [], ok = (r, c) => live(r, c) && S.grid[r][c] && !S.grid[r][c].wrap;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) [[0, 1], [1, 0]].forEach(([dr, dc]) => {
    const r2 = r + dr, c2 = c + dc; if (!ok(r, c) || !ok(r2, c2)) return;
    const a = S.grid[r][c], b = S.grid[r2][c2];
    if (a.sp === 'badge' || b.sp === 'badge' || (a.sp && b.sp)) { mv.push([[r, c], [r2, c2]]); return; }
    S.grid[r][c] = b; S.grid[r2][c2] = a; const any = runs().length > 0; S.grid[r][c] = a; S.grid[r2][c2] = b;
    if (any) mv.push([[r, c], [r2, c2]]);
  });
  return mv;
}

/* ---------- clearing (with chain reactions) ---------- */
function blast(sp, r, c, add) {
  if (sp === 'h') for (let k = 0; k < COLS; k++) add(r, k);
  if (sp === 'v') for (let k = 0; k < ROWS; k++) add(k, c);
  if (sp === 'bomb') for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) add(r + a, c + b);
  if (sp === 'badge') { const present = S.grid.flat().filter(t => t && t.sp !== 'badge').map(t => t.t); const t = present[Math.floor(S.R() * present.length)]; for (let a = 0; a < ROWS; a++) for (let b = 0; b < COLS; b++) if (S.grid[a][b] && S.grid[a][b].t === t) add(a, b); }
}
function clearCells(start, make = []) {
  const set = new Map(), queue = [], keep = new Set(make.map(m => key(m.r, m.c)));
  const add = (r, c) => { if (!live(r, c)) return; const k = key(r, c); if (set.has(k)) return; set.set(k, [r, c]); queue.push([r, c]); };
  start.forEach(([r, c]) => add(r, c));
  while (queue.length) { const [r, c] = queue.shift(), t = S.grid[r][c]; if (t && t.sp && !keep.has(key(r, c)) && !t.wrap) { S.fxBlast.push({ sp: t.sp, r, c, life: .35 }); blast(t.sp, r, c, add); } }
  let n = 0;
  set.forEach(([r, c], k) => {
    const cell = S.cells[r][c], t = S.grid[r][c];
    if (cell.print) { cell.print--; S.pts(60); G().burst(cx(c), cy(r), '#B48CFF', 5, 90); }
    if (!t) return;
    if (t.wrap) { t.wrap--; S.pts(50); t.spark = 1; G().sfx(1300, .05, 'square', .04, 1.3); return; }
    const m = make.find(m => m.r === r && m.c === c);
    if (m) { t.sp = m.sp; if (m.sp === 'badge') t.t = -1; t.spark = 1; return; }
    t.die = .001; n++; S.pts(30 * S.chain);
    const g = S.goal.collect.find(g => g.t === t.t); if (g && g.got < g.need) { g.got++; S.flyers.push({ t: t.t, x: t.x, y: t.y, tx: g.x || W / 2, ty: 92, life: 0 }); }
  });
  make.forEach(m => { const t = S.grid[m.r][m.c]; if (t && !set.has(key(m.r, m.c))) { t.sp = m.sp; if (m.sp === 'badge') t.t = -1; t.spark = 1; } });
  return set.size;
}
function step(prefer) {   // one cascade step: returns true if something was cleared
  const rs = runs(); if (!rs.length) return false;
  const make = [];
  groups(rs).forEach(g => {
    const cells = new Map(); g.runs.forEach(run => run.cells.forEach(([r, c]) => cells.set(key(r, c), [r, c])));
    const long = Math.max(...g.runs.map(r => r.cells.length)), cross = g.runs.some(a => a.dir === 'h') && g.runs.some(a => a.dir === 'v');
    const sp = long >= 5 ? 'badge' : cross ? 'bomb' : long === 4 ? g.runs.find(r => r.cells.length === 4).dir : null;
    if (!sp) return;
    let at = (prefer || []).find(([r, c]) => cells.has(key(r, c)));
    if (!at && cross) { const hs = g.runs.filter(a => a.dir === 'h'), vs = g.runs.filter(a => a.dir === 'v'); hs.some(h => h.cells.some(([r, c]) => vs.some(v => v.cells.some(([r2, c2]) => r2 === r && c2 === c) && (at = [r, c])))); }
    if (!at) { const run = g.runs.reduce((a, b) => b.cells.length > a.cells.length ? b : a); at = run.cells[Math.floor(run.cells.length / 2)]; }
    if (S.grid[at[0]][at[1]].wrap) return;
    make.push({ r: at[0], c: at[1], sp });
    S.made++;
  });
  const all = []; rs.forEach(run => run.cells.forEach(rc => all.push(rc)));
  clearCells(all, make);
  if (S.chain > 1) G().float(W / 2, Y0 + ROWS * T / 2, S.chain >= 4 ? 'Amazing!' : S.chain >= 3 ? 'Super!' : 'Nice!', '#FFD54A', 22);
  G().sfx(520 + S.chain * 90, .09, 'triangle', .08, 1.4);
  S.chain++;
  return true;
}
function combo(a, b, ra, rb) {   // swapping a badge or two specials
  const [r, c] = rb; let cells = [];
  const ta = S.grid[ra[0]][ra[1]], tb = S.grid[r][c];
  if (ta.sp === 'badge' && tb.sp === 'badge') { for (let i = 0; i < ROWS; i++) for (let j = 0; j < COLS; j++) cells.push([i, j]); G().float(W / 2, 300, 'BOARD WIPE!', '#FFD54A', 26); }
  else if (ta.sp === 'badge' || tb.sp === 'badge') {
    const other = ta.sp === 'badge' ? tb : ta, bp = ta.sp === 'badge' ? ra : rb, t = other.t; cells.push(bp); S.grid[bp[0]][bp[1]].sp = null;
    for (let i = 0; i < ROWS; i++) for (let j = 0; j < COLS; j++) { const x = S.grid[i][j]; if (x && x.t === t && x.sp !== 'badge') { if (other.sp && !x.wrap) x.sp = other.sp === 'bomb' ? 'bomb' : (S.R() < .5 ? 'h' : 'v'); cells.push([i, j]); } }
  } else {
    const s = [ta.sp, tb.sp].sort().join('+'); ta.sp = null; tb.sp = null; cells.push(ra, rb);
    const box = (rad, rows, cols) => { for (let i = -rad; i <= rad; i++) { if (rows) for (let k = 0; k < COLS; k++) cells.push([r + i, k]); if (cols) for (let k = 0; k < ROWS; k++) cells.push([k, c + i]); } };
    if (s === 'bomb+bomb') for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) cells.push([r + i, c + j]);
    else if (s.includes('bomb')) box(1, true, true);
    else box(0, true, true);
    S.fxBlast.push({ sp: 'big', r, c, life: .5 });
  }
  S.chain = 2; clearCells(cells.filter(([i, j]) => live(i, j))); G().shake(.2); G().sfx(300, .3, 'sawtooth', .07, 2.2); G().buzz(40);
}
function gravity() {
  for (let c = 0; c < COLS; c++) {
    const spots = []; for (let r = 0; r < ROWS; r++) if (!S.cells[r][c].hole) spots.push(r);
    const tiles = spots.map(r => S.grid[r][c]).filter(t => t && !t.die);
    const empty = spots.length - tiles.length;
    spots.forEach(r => S.grid[r][c] = null);
    tiles.forEach((t, i) => S.grid[spots[empty + i]][c] = t);
    for (let i = 0; i < empty; i++) { const r = spots[i]; S.grid[r][c] = newTile(randType(), r, c, Y0 - (empty - i) * T - 10); }
  }
}
function shuffle() {
  const tiles = S.grid.flat().filter(t => t && !t.wrap && !t.sp); let guard = 0;
  do { const ts = tiles.map(t => t.t); for (let i = ts.length - 1; i > 0; i--) { const j = Math.floor(S.R() * (i + 1)); [ts[i], ts[j]] = [ts[j], ts[i]]; } tiles.forEach((t, i) => t.t = ts[i]); guard++; } while (guard < 50 && (runs().length || !findMoves().length));
  G().float(W / 2, 330, 'Shuffle!', '#FFFFFF', 22);
}

/* ---------- game object ---------- */
const G = () => SQV.G;
const game = {
  id: 'lost-and-found', title: 'Lost & Found', where: 'at the Squish Police Station', levels: true,
  how: ['Swap two neighbouring items to line up 3 or more of the same kind.', 'Reach the goal at the top before your moves run out: collect items, find paw-print clues, or pop bubble wrap.', '4 in a row = Siren · L or T = Bubble Bomb · 5 in a row = Gold Badge. Swap two specials together for a mega combo!', 'Win for 1 star, score high for 2 or 3. Every win unlocks a new level, forever.'],
  keys: 'Swipe or tap two items · PC: click, or arrow keys + Space', scoreName: 'points',
  coins: { menu: 'Coins: 30 + 15 per ★ the first time you beat a level (big levels ×2) · replays pay 10 + 15 per new ★', custom: () => SQV.levelPay(L, S.res) },
  menu: (G, rw) => SQV.levelMenu(game, L, rw),
  over: (G, pay) => SQV.levelOver(S.res, pay),
  act(a) { if (a === 'menu') G().menu(); },
  canRevive: () => S.res && !S.res.win && S.res.title !== 'Restarted',
  revive() { S.res = null; S.moves += 5; S.phase = 'idle'; S.idleT = 0; },
  reviveTitle: () => 'Out of moves', reviveLine: () => `Only ${goalLeft()} left to find!`, reviveGift: 'and get 5 more moves',
  init(Gm) {
    const n = Math.max(1, Math.min(L.top, +Gm.arg || L.top)), lvl = recipe(n);
    S = { lvl, R: SQV.rng(lvl.seed), moves: lvl.moves, phase: 'idle', wait: 0, chain: 1, sel: null, drag: null, cur: [ROWS - 1, 3], made: 0, fxBlast: [], flyers: [], idleT: 0, hint: null, banner: 1.6, res: null, bonusLeft: 0, swap: null };
    S.pts = p => { Gm.score += p; };
    build(lvl);
  },
  update(dt, Gm) {
    S.banner = Math.max(0, S.banner - dt);
    // tile motion
    let moving = false;
    S.grid.forEach((row, r) => row.forEach((t, c) => {
      if (!t) return; t.spark = Math.max(0, t.spark - dt * 2.5); t.born = Math.max(0, t.born - dt * 4);
      if (t.die) { t.die += dt * 5.5; moving = true; return; }
      const tx = cx(c), ty = cy(r);
      if (Math.abs(t.x - tx) > .5) { t.x += (tx - t.x) * Math.min(1, dt * 18); moving = true; } else t.x = tx;
      if (t.y < ty - .5) { t.vy += 2600 * dt; t.y = Math.min(ty, t.y + t.vy * dt); moving = true; if (t.y >= ty) { t.vy = 0; t.land = 1; } }
      else if (t.y > ty + .5) { t.y += (ty - t.y) * Math.min(1, dt * 18); moving = true; } else { t.y = ty; t.vy = 0; }
      if (t.land) t.land = Math.max(0, t.land - dt * 5);
    }));
    S.fxBlast.forEach(b => b.life -= dt); S.fxBlast = S.fxBlast.filter(b => b.life > 0);
    S.flyers.forEach(f => f.life += dt * 2.2); S.flyers = S.flyers.filter(f => f.life < 1);
    if (S.wait > 0) { S.wait -= dt; return; }
    if (S.phase === 'swap') { if (!moving) { const sw = S.swap; S.swap = null; afterSwap(sw); } return; }
    if (S.phase === 'back') { if (!moving) S.phase = 'idle'; return; }
    if (S.phase === 'resolve') {
      const dying = S.grid.flat().some(t => t && t.die && t.die < 1); if (dying) return;
      if (S.grid.flat().some(t => t && t.die)) { gravity(); return; }
      if (moving) return;
      if (step(S.prefer)) { S.prefer = null; S.wait = .05; return; }
      S.chain = 1; S.phase = 'idle'; checkEnd(); return;
    }
    if (S.phase === 'bonus') {
      if (S.bonusLeft > 0) { S.bonusT -= dt; if (S.bonusT <= 0) { S.bonusLeft--; S.moves--; Gm.score += 300; const spot = S.grid.flat().filter(Boolean)[Math.floor(Math.random() * 40)]; if (spot) { Gm.float(spot.x, spot.y, '+300', '#FFD54A', 16); Gm.burst(spot.x, spot.y, '#FFD54A', 6, 100); } Gm.sfx(800 + (10 - S.bonusLeft % 10) * 60, .06, 'triangle', .06); S.bonusT = .12; } }
      else { S.phase = 'done'; S.wait = .5; }
      return;
    }
    if (S.phase === 'done') { finish(true); return; }
    if (S.phase === 'idle') { S.idleT += dt; if (S.idleT > 6 && !S.hint) { const mv = findMoves(); S.hint = mv.length ? mv[Math.floor(Math.random() * mv.length)] : null; } }
  },
  draw(c, Gm) {
    const t = Gm.t, lvl = S.lvl;
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#E3EDFF'); bg.addColorStop(1, '#D9F2DF'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    // goal panel
    D.rr(c, 10, 60, W - 20, 78, 18, '#FFFFFF');
    D.rr(c, 18, 68, 70, 62, 14, '#2F5BD3', null, 0); D.text(c, 'moves', 53, 82, 11, '#CFE0FF', 'center', 'body'); D.text(c, String(S.moves), 53, 108, 28, '#FFFFFF', 'center', 'display');
    const goals = []; S.goal.collect.forEach(g => goals.push({ draw: (x, y) => item(c, g.t, x, y, .62), left: Math.max(0, g.need - g.got), g }));
    if (S.goal.prints) goals.push({ draw: (x, y) => paw(c, x, y, .8, '#8E6CE0'), left: countPrints() });
    if (S.goal.wraps) goals.push({ draw: (x, y) => { D.rr(c, x - 14, y - 14, 28, 28, 8, 'rgba(190,225,255,.9)', '#6FA8DC', 2); [[-6, -6], [6, -6], [-6, 6], [6, 6]].forEach(([a, b]) => D.circle(c, x + a, y + b, 3.5, '#FFFFFF', '#9CC7EE', 1.2)); }, left: countWraps() });
    const gw = (W - 120) / Math.max(1, goals.length);
    goals.forEach((g, i) => { const x = 104 + gw * (i + .5), y = 92; if (g.g) g.g.x = x; g.draw(x, y); if (g.left) D.text(c, String(g.left), x, y + 30, 15, INK, 'center', 'display'); else { D.circle(c, x + 14, y + 12, 9, '#4FCFA0', INK, 2); c.lineWidth = 2.5; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.moveTo(x + 9, y + 12); c.lineTo(x + 13, y + 16); c.lineTo(x + 19, y + 8); c.stroke(); } });
    // board
    for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) { const cell = S.cells[r][k]; if (cell.hole) continue; const x = X0 + k * T, y = Y0 + r * T; c.fillStyle = (r + k) % 2 ? 'rgba(255,255,255,.82)' : 'rgba(240,245,255,.92)'; c.fillRect(x, y, T, T); if (cell.print) paw(c, x + T / 2, y + T / 2, 1.05, cell.print > 1 ? '#6E48C9' : '#B9A2F0', .9); }
    c.lineWidth = 2.5; c.strokeStyle = INK; for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) { if (S.cells[r][k].hole) continue; const x = X0 + k * T, y = Y0 + r * T; [[0, -1, x, y, x + T, y], [0, 1, x, y + T, x + T, y + T], [-1, 0, x, y, x, y + T], [1, 0, x + T, y, x + T, y + T]].forEach(([dc, dr, a, b, e, f]) => { if (!live(r + dr, k + dc)) { c.beginPath(); c.moveTo(a, b); c.lineTo(e, f); c.stroke(); } }); }
    // hint wiggle
    const hintIds = S.hint && S.phase === 'idle' ? S.hint.map(([r, k]) => S.grid[r][k] && S.grid[r][k].id) : [];
    c.save(); c.beginPath(); c.rect(X0 - 4, Y0 - 2, COLS * T + 8, ROWS * T + 4); c.clip();
    S.grid.forEach((row, r) => row.forEach((tl, k) => {
      if (!tl) return; let s = 1 - (tl.die ? Math.min(1, tl.die) : 0) + tl.spark * .15 - tl.born * .3; if (s <= .02) return;
      const sel = S.sel && S.sel[0] === r && S.sel[1] === k, wig = hintIds.includes(tl.id) ? Math.sin(t * 14) * .12 : 0, land = (tl.land || 0) * .12;
      if (sel) D.rr(c, X0 + k * T + 2, Y0 + r * T + 2, T - 4, T - 4, 10, '#FFF3B0', '#FFC93C', 3);
      c.save(); c.translate(tl.x, tl.y); c.rotate(wig); c.scale(s * (1 + land), s * (1 - land)); tile(c, tl, t); c.restore();
    }));
    c.restore();
    // keyboard cursor
    if (S.kb) { const [r, k] = S.cur; D.rr(c, X0 + k * T + 1, Y0 + r * T + 1, T - 2, T - 2, 10, null, '#2F5BD3', 3); }
    S.fxBlast.forEach(b => { c.globalAlpha = Math.min(1, b.life * 3); c.fillStyle = '#FFFFFF'; const x = cx(b.c), y = cy(b.r);
      if (b.sp === 'h') c.fillRect(X0, y - 8, COLS * T, 16); else if (b.sp === 'v') c.fillRect(x - 8, Y0, 16, ROWS * T); else { c.beginPath(); c.arc(x, y, (b.sp === 'big' ? 120 : 70) * (1 - b.life), 0, 7); c.fill(); } c.globalAlpha = 1; });
    S.flyers.forEach(f => { const u = f.life, e = u * u; item(c, f.t, f.x + (f.tx - f.x) * e, f.y + (f.ty - f.y) * e - Math.sin(u * Math.PI) * 40, .6); });
    // score + stars bar
    const sx = 20, sw = W - 40, by = Y0 + ROWS * T + 18, max = lvl.star3 * 1.12;
    D.bar(c, sx, by, sw, 16, Gm.score / max, '#FFC93C');
    [{ v: 0, done: !goalLeft() }, { v: lvl.star2 }, { v: lvl.star3 }].forEach((st, i) => { if (!i) return; const x = sx + sw * st.v / max; D.star(c, x, by + 8, 11, 5, Gm.score >= st.v ? '#FFC93C' : '#E3DEEF', INK, 2); });
    D.text(c, Gm.score.toLocaleString('en-US') + ' pts', sx, by + 32, 12, '#5E5679', 'left', 'body');
    // officer
    D.sprite(c, 'puppy', 40, 634, 58, { sy: 1 + Math.sin(t * 3) * .03 }); D.rr(c, 76, 572, W - 88, 46, 16, '#FFFFFF', INK, 2);
    D.text(c, tipText(), 76 + (W - 88) / 2, 595, 12, '#2F5BD3', 'center', 'body');
    // hud
    D.hud(c, '#2F5BD3', { t: `Level ${lvl.n}`, w: 100 }); D.rr(c, W - 118, 12, 108, 28, 14, '#FFFFFF'); D.text(c, '↺ restart', W - 64, 27, 13, INK, 'center', 'body');
    if (lvl.big) D.text(c, 'BIG LEVEL · ×2 coins', 180, 27, 11, '#FFF3B0', 'center', 'body');
    if (S.banner > 0) { c.globalAlpha = Math.min(1, S.banner * 2); D.rr(c, 40, 300, W - 80, 80, 20, '#FFFFFF'); D.text(c, `Level ${lvl.n}`, W / 2, 326, 24, '#2F5BD3', 'center', 'display'); D.text(c, goalText(), W / 2, 356, 13, INK, 'center', 'body'); c.globalAlpha = 1; }
  },
  down(x, y) {
    if (y < 52 && x > W - 120) { if (S.phase === 'idle') { S.res = { n: S.lvl.n, win: false, title: 'Restarted', line: 'No coins for a restart.' }; G().end(); } return; }
    S.kb = false; const k = Math.floor((x - X0) / T), r = Math.floor((y - Y0) / T); if (!live(r, k) || !S.grid[r][k]) return;
    S.drag = { r, k, x, y, used: false };
  },
  move(x, y) { const d = S.drag; if (!d || d.used) return; const dx = x - d.x, dy = y - d.y; if (Math.hypot(dx, dy) < 16) return; d.used = true; const [dr, dc] = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0]; S.sel = null; trySwap([d.r, d.k], [d.r + dr, d.k + dc]); },
  up() { const d = S.drag; S.drag = null; if (!d || d.used) return; tapCell(d.r, d.k); },
  key(code, down) {
    if (!down) return; const dir = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], KeyW: [-1, 0], KeyS: [1, 0], KeyA: [0, -1], KeyD: [0, 1] }[code];
    if (dir) { S.kb = true; if (S.sel) { const s = S.sel; S.sel = null; trySwap(s, [s[0] + dir[0], s[1] + dir[1]]); } else { const r = Math.max(0, Math.min(ROWS - 1, S.cur[0] + dir[0])), k = Math.max(0, Math.min(COLS - 1, S.cur[1] + dir[1])); S.cur = [r, k]; } return; }
    if (code === 'Space' || code === 'Enter') { S.kb = true; tapCell(...S.cur); return; }
    return false;
  }
};
function tapCell(r, k) {
  if (S.phase !== 'idle') return;
  if (S.sel) { const [a, b] = S.sel; if (a === r && b === k) { S.sel = null; return; } if (Math.abs(a - r) + Math.abs(b - k) === 1) { S.sel = null; trySwap([a, b], [r, k]); return; } }
  if (live(r, k) && S.grid[r][k]) { S.sel = [r, k]; S.cur = [r, k]; G().sfx(700, .04, 'sine', .05); }
}
function trySwap(a, b) {
  if (S.phase !== 'idle' || !live(...b) || !live(...a)) return;
  const ta = S.grid[a[0]][a[1]], tb = S.grid[b[0]][b[1]]; if (!ta || !tb) return;
  if (ta.wrap || tb.wrap) { ta.spark = tb.spark = .6; G().sfx(200, .1, 'square', .04); G().float(tb.x, tb.y - 20, 'Wrapped!', '#6FA8DC', 13); return; }
  S.hint = null; S.idleT = 0;
  S.grid[a[0]][a[1]] = tb; S.grid[b[0]][b[1]] = ta; S.swap = { a, b }; S.phase = 'swap'; G().sfx(600, .05, 'sine', .05, 1.3);
}
function afterSwap({ a, b }) {
  const ta = S.grid[b[0]][b[1]], tb = S.grid[a[0]][a[1]];   // ta moved to b
  if (ta.sp === 'badge' || tb.sp === 'badge' || (ta.sp && tb.sp)) { S.moves--; combo(tb, ta, a, b); S.phase = 'resolve'; S.wait = .12; return; }
  if (!runs().length) { S.grid[a[0]][a[1]] = ta; S.grid[b[0]][b[1]] = tb; S.phase = 'back'; G().sfx(240, .12, 'triangle', .05); return; }
  S.moves--; S.chain = 1; S.prefer = [b, a]; S.phase = 'resolve';
}
function checkEnd() {
  if (!goalLeft()) { S.phase = 'bonus'; S.bonusLeft = S.moves; S.bonusT = .4; G().float(W / 2, 330, 'Case closed!', '#FFD54A', 26); G().sfx(880, .3, 'triangle', .09, 1.5); return; }
  if (S.moves <= 0) { finish(false); return; }
  if (!findMoves().length) shuffle();
}
function finish(win) {
  const sc = G().score, st = win ? (sc >= S.lvl.star3 ? 3 : sc >= S.lvl.star2 ? 2 : 1) : 0;
  S.res = { n: S.lvl.n, win, stars: st, line: win ? `${sc.toLocaleString('en-US')} points · ${S.made} specials made` : `${goalLeft()} left to find. So close!` };
  S.phase = 'over'; G().end();
}
function goalText() { const k = S.lvl.kind; return k === 'collect' ? 'Collect the items shown at the top' : k === 'prints' ? 'Find every paw-print clue: match on top of them' : k === 'wraps' ? 'Pop all the bubble wrap (match the wrapped items)' : 'Collect the items AND find the paw prints'; }
function tipText() { if (S.phase === 'bonus') return 'Spare moves turn into bonus points!'; if (S.moves <= 3 && goalLeft()) return `Only ${S.moves} move${S.moves === 1 ? '' : 's'} left!`; return S.made ? 'Swap two specials for a mega combo!' : goalText(); }

/* ---------- drawing ---------- */
function tile(c, tl, t) {
  if (tl.sp === 'badge') { badge(c, t); }
  else {
    item(c, tl.t, 0, 0, 1);
    if (tl.sp === 'h' || tl.sp === 'v') { c.save(); if (tl.sp === 'v') c.rotate(Math.PI / 2); c.globalAlpha = .9; c.fillStyle = '#FFFFFF'; c.fillRect(-20, -4, 40, 3); c.fillRect(-20, 3, 40, 3); c.globalAlpha = 1; c.restore(); D.circle(c, 13, -13, 6, Math.sin(t * 12) > 0 ? '#FF5E6C' : '#5BA8FF', INK, 1.8); }
    if (tl.sp === 'bomb') { c.save(); c.globalAlpha = .55 + .2 * Math.sin(t * 6); c.lineWidth = 3; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, 20, 0, 7); c.stroke(); c.globalAlpha = 1; c.lineWidth = 1.8; c.strokeStyle = INK; c.beginPath(); c.arc(0, 0, 21.5, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(-9, -11, 5, 3, -.6, 0, 7); c.fill(); c.restore(); }
  }
  if (tl.wrap) { c.save(); c.globalAlpha = tl.wrap > 1 ? .85 : .7; D.rr(c, -21, -21, 42, 42, 10, tl.wrap > 1 ? 'rgba(150,200,245,.75)' : 'rgba(200,232,255,.7)', '#6FA8DC', 2.5); c.globalAlpha = 1; [[-10, -10], [10, -10], [-10, 10], [10, 10], [0, 0]].forEach(([a, b]) => { D.circle(c, a, b, 4.5, 'rgba(255,255,255,.9)', '#9CC7EE', 1.2); }); c.restore(); }
}
function item(c, k, x, y, s) {
  const it = ITEMS[k]; if (!it) return; c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineWidth = 2.4; c.strokeStyle = INK;
  if (it.n === 'balloon') { c.beginPath(); c.moveTo(0, 12); c.quadraticCurveTo(-2, 17, 2, 20); c.stroke(); c.beginPath(); c.ellipse(0, -3, 14, 16, 0, 0, 7); c.fillStyle = it.col; c.fill(); c.stroke(); c.beginPath(); c.moveTo(-3, 12); c.lineTo(3, 12); c.lineTo(0, 15); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(-6, -9, 3.5, 5.5, -.4, 0, 7); c.fill(); }
  if (it.n === 'mitten') { c.beginPath(); c.moveTo(-10, 16); c.lineTo(-11, -4); c.quadraticCurveTo(-12, -18, 1, -18); c.quadraticCurveTo(12, -18, 11, -4); c.lineTo(11, 0); c.quadraticCurveTo(18, -6, 19, 1); c.quadraticCurveTo(19, 8, 11, 10); c.lineTo(11, 16); c.closePath(); c.fillStyle = it.col; c.fill(); c.stroke(); D.rr(c, -12, 10, 25, 9, 4, '#FFFFFF', INK, 2); c.fillStyle = '#FFFFFF'; [[-4, -8], [4, -4], [-3, 2]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 1.8, 0, 7); c.fill(); }); }
  if (it.n === 'candy') { c.fillStyle = it.dk; [[-1, 1]].forEach(() => { c.beginPath(); c.moveTo(-11, 0); c.lineTo(-20, -8); c.lineTo(-20, 8); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(11, 0); c.lineTo(20, -8); c.lineTo(20, 8); c.closePath(); c.fill(); c.stroke(); }); D.circle(c, 0, 0, 12.5, it.col, INK, 2.4); c.lineWidth = 2.6; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, 7, .3, 2.4); c.stroke(); c.beginPath(); c.arc(0, 0, 7, 3.4, 5.5); c.stroke(); }
  if (it.n === 'key') { D.circle(c, -7, -6, 10, it.col, INK, 2.4); D.circle(c, -7, -6, 3.6, '#FFFFFF', INK, 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(14, 14); c.lineTo(10, 18); c.lineTo(7, 15); c.lineTo(5, 17); c.lineTo(2, 14); c.lineTo(4, 12); c.lineTo(-4, 4); c.closePath(); c.fillStyle = it.col; c.fill(); c.stroke(); }
  if (it.n === 'clover') { c.fillStyle = it.col; [0, 1, 2, 3].forEach(i => { c.save(); c.rotate(i * Math.PI / 2 + Math.PI / 4); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-11, -6, -10, -19, 0, -14); c.bezierCurveTo(10, -19, 11, -6, 0, 0); c.fill(); c.stroke(); c.restore(); }); D.circle(c, 0, 0, 3, '#FFFFFF', INK, 1.5); }
  if (it.n === 'bow') { c.fillStyle = it.col; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-18, -18, -19, -2); c.quadraticCurveTo(-18, 14, 0, 0); c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(18, -18, 19, -2); c.quadraticCurveTo(18, 14, 0, 0); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-3, 3); c.lineTo(-8, 17); c.lineTo(-2, 14); c.moveTo(3, 3); c.lineTo(8, 17); c.lineTo(2, 14); c.stroke(); D.circle(c, 0, 0, 5, it.dk, INK, 2); }
  c.restore();
}
function badge(c, t) { c.save(); c.rotate(Math.sin(t * 3) * .08); D.star(c, 0, 0, 20, 12, '#FFC93C', INK, 2.5); D.circle(c, 0, 0, 7, '#FFF3B0', INK, 2); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; D.circle(c, Math.cos(a) * 20, Math.sin(a) * 20, 2.6, '#FFF3B0', INK, 1.5); } c.globalAlpha = .6 + .4 * Math.sin(t * 8); D.star(c, 12, -14, 4, 1.6, '#FFFFFF', null); c.restore(); }
function paw(c, x, y, s, col, a = 1) { c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.ellipse(0, 4, 8, 6.5, 0, 0, 7); c.fill(); [[-8, -4], [-3, -9], [3, -9], [8, -4]].forEach(([a2, b]) => { c.beginPath(); c.ellipse(a2, b, 3, 3.6, 0, 0, 7); c.fill(); }); c.restore(); }

SQV.G = SQV.run(game); SQV.state = () => S; SQV.api = { recipe, findMoves, trySwap, runs, game, goalLeft };
})();
