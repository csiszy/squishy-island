/* ===================== SQUEAK BEAT (Squeak Stage) =====================
   Piano Tiles style game with real songs. Your squishies slide down four columns.
   Tap the lowest squishy (or anywhere in its column) any time while it is on screen:
   it only has to be its turn (no other squishy below it). A squishy that slides off the
   bottom is a miss. Long squishies trail a stripe: keep holding until the stripe ends.
   Every tap plays the next note of the tune, so you are the one playing the melody.
   Each track is one complete song (about 1–1.5 minutes). There are 30 tracks, each a
   bit harder than the last. Track N opens when you have collected (N-1) × 3 stars
   in total, and every locked track shows exactly how many stars it needs.
   All music is made live in the browser (no audio files). */
(() => {
const { D, W, H } = SQV, INK = D.INK;
const NL = 4, LW = 84, LX0 = 12, HIT_Y = 546, TOP_Y = 60;
const laneX = l => LX0 + LW * l + LW / 2;
const LANE_COL = ['#FF6FA3', '#FFC93C', '#5ACB7A', '#4A9BFF'];
const LANE_KEYS = [['KeyD', 'Digit1', 'ArrowLeft'], ['KeyF', 'Digit2', 'ArrowDown'], ['KeyJ', 'Digit3', 'ArrowUp'], ['KeyK', 'Digit4', 'ArrowRight']];
const BANDS = [
  { name: 'Dumpling Gang', sq: ['bao', 'gyoza', 'xlb', 'peachbun'], tone: 'rubber' },
  { name: 'Sugar Squad', sq: ['marshmallow', 'macaron', 'donut', 'icecream'], tone: 'bell' },
  { name: 'Sea Squish', sq: ['jelly', 'puffer', 'octopus', 'whale'], tone: 'flute' },
  { name: 'Pet Pals', sq: ['kitty', 'puppy', 'bunny', 'hamster'], tone: 'chip' }
];
const NAMES = ['Bao Bounce', 'Marshmallow Dreams', 'Jelly Jam', 'Puppy Parade', 'Donut Disco', 'Bubble Tea Boogie', 'Moonlight Mochi', 'Sunny Side Up', 'Octopus Groove', 'Cupcake Cha-Cha',
  'Kitty Conga', 'Rainbow Rush', 'Sprout Swing', 'Gyoza Get-Down', 'Whale Song Wiggle', 'Sugar Rush', 'Pancake Polka', 'Starry Squeeze', 'Bunny Hop Hop', 'Peach Fuzz Funk',
  'Coral Calypso', 'Thunder Fluff', 'Golden Dumpling', 'Midnight Macaron', 'Hamster Hustle', 'Axolotl Anthem', 'Puffer Panic', 'Mossdragon March', 'Lucky Cat Shuffle', 'Grand Squishy Finale'];
const NT = NAMES.length, STYLES = ['pop', 'disco', 'swing', 'chill', 'march'];
const STYLE_BG = { pop: ['#2E2452', '#5A3A8C'], disco: ['#3A1F5C', '#8C2F7A'], swing: ['#1F3550', '#3F6E8C'], chill: ['#22403F', '#4A7A6E'], march: ['#4A2A1F', '#8C5A2F'] };
const MAJ = { I: { root: 0, t: [0, 4, 7] }, ii: { root: 2, t: [-10, -7, -3] }, iii: { root: 4, t: [-8, -5, -1] }, IV: { root: 5, t: [-7, -3, 0] }, V: { root: 7, t: [-5, -1, 2] }, vi: { root: 9, t: [-3, 0, 4] } };
const MIN = { i: { root: 0, t: [0, 3, 7] }, iv: { root: 5, t: [-7, -4, 0] }, v: { root: 7, t: [-5, -2, 2] }, III: { root: 3, t: [-9, -5, -2] }, VI: { root: 8, t: [-4, 0, 3] }, VII: { root: 10, t: [-2, 2, 5] } };
const PJ = { A: [['I', 'V', 'vi', 'IV'], ['I', 'vi', 'IV', 'V'], ['I', 'IV', 'vi', 'V']], B: [['IV', 'V', 'iii', 'vi'], ['IV', 'I', 'V', 'vi'], ['ii', 'V', 'I', 'vi'], ['vi', 'IV', 'I', 'V']] };
const PM = { A: [['i', 'VI', 'III', 'VII'], ['i', 'iv', 'VII', 'III']], B: [['VI', 'VII', 'i', 'i'], ['iv', 'v', 'VI', 'VII'], ['VI', 'III', 'VII', 'i']] };
const SCALE = { maj: [0, 2, 4, 7, 9, 12, 14, 16, 19], min: [0, 3, 5, 7, 10, 12, 15, 17, 19] };
const C4 = 261.63;
let S, ac = null, FX = null;
const hz = s => C4 * Math.pow(2, (s + (S ? S.key : 0)) / 12);
const now = G => S.ac ? S.ac.currentTime - S.t0 : G.t - .35;

/* ---------- saved progress ---------- */
const PKEY = 'squishyisland-squeak-beat-tracks';
function loadP() { try { const v = JSON.parse(localStorage.getItem(PKEY)); if (v && v.stars) return v; } catch (e) {} return { stars: {}, best: {} }; }
function saveP(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }
const cleared = p => Object.values(p.stars).filter(s => s > 0).length;
const totalStars = p => Object.values(p.stars).reduce((a, b) => a + b, 0);
const needStars = i => i * 3;                        // track i+1 needs i × 3 stars (track 1: 0, track 2: 3, track 3: 6…)
const unlocked = (p, i) => totalStars(p) >= needStars(i);
const openCount = p => { let n = 0; while (n < NT && unlocked(p, n)) n++; return n; };

/* ---------- making a track (seeded: track N is the same song for everybody) ---------- */
const TRACKS = [];
function track(i) {
  if (TRACKS[i]) return TRACKS[i];
  const R = SQV.rng(9001 + i * 131), d = i / (NT - 1), pick = a => a[Math.floor(R() * a.length)];
  const nm = NAMES[i].toLowerCase(), has = (...w) => w.some(x => nm.includes(x));
  const style = has('disco', 'funk', 'boogie') ? 'disco' : has('swing', 'shuffle', 'conga', 'calypso') ? 'swing' : has('march', 'polka', 'parade', 'finale') ? 'march' : has('dream', 'moon', 'midnight', 'whale', 'starry') ? 'chill' : STYLES[i % 5];
  const band = has('bao', 'gyoza', 'dumpling', 'mochi') ? BANDS[0] : has('marshmallow', 'donut', 'cupcake', 'sugar', 'macaron', 'pancake', 'peach', 'bubble tea') ? BANDS[1] : has('jelly', 'octopus', 'whale', 'coral', 'axolotl', 'puffer') ? BANDS[2] : has('puppy', 'kitty', 'bunny', 'hamster', 'cat') ? BANDS[3] : BANDS[i % 4];
  const minor = has('midnight', 'moon', 'thunder', 'panic', 'mossdragon') || (i % 3 === 1 && !has('sunny', 'rainbow', 'sugar')), CH = minor ? MIN : MAJ, scale = SCALE[minor ? 'min' : 'maj'];
  const bpm = Math.round(86 + d * 74 + (R() - .5) * 6), spb = 60 / bpm, key = [0, 2, -3, 5, -1, 3][i % 6];
  const swing = style === 'swing' ? spb * .16 : 0;
  const progA = pick((minor ? PM : PJ).A), progB = pick((minor ? PM : PJ).B);
  const plan = d < .3 ? ['intro', 'A', 'B', 'A', 'B', 'outro'] : ['intro', 'A', 'B', 'A', 'B', 'C', 'B', 'outro'];
  const LEN = { intro: 2, A: 8, B: 8, C: 4, outro: 2 };
  const bars = []; plan.forEach((sec, k) => { for (let b = 0; b < LEN[sec]; b++) { const prog = sec === 'B' || sec === 'C' ? progB : progA; const name = sec === 'outro' ? Object.keys(CH)[0] : prog[b % 4]; bars.push({ sec, k, b, last: b === LEN[sec] - 1, chord: CH[name] }); } });
  const barT = b => b * 4 * spb;
  const quarters = d < .2, dens = .5 + d * .42, holdRate = i < 2 ? 0 : Math.min(.55, .2 + d * .4), chordRate = i < 4 ? 0 : Math.min(.3, .05 + d * .3);
  // motifs: a 2-bar rhythm (16 eighth-note slots) + a melody shape (scale steps)
  function motif(extra) {
    let r = [], tries = 0; const need = quarters ? 5 : Math.round(7 + d * 4);
    do { r = []; for (let s = 0; s < 16; s++) { const on = s % 2 === 0; if (quarters && !on) continue; let p = (on ? dens : dens * .62) + extra; if (s % 8 === 0) p = 1; if (s >= 14) p *= .45; if (R() < p) r.push(s); } } while (r.length < need && ++tries < 30);
    let idx = 2 + Math.floor(R() * 3); const steps = r.map(() => { idx = Math.max(0, Math.min(8, idx + [-2, -1, -1, 1, 1, 2, 0][Math.floor(R() * 7)])); return idx; });
    return { r, steps };
  }
  const MOT = { A: motif(0), B: motif(.08) };
  const snap = (idx, chord) => { const pcs = chord.t.map(x => ((x % 12) + 12) % 12); let best = idx, bd = 99; for (let j = 0; j < scale.length; j++) { if (!pcs.includes(scale[j] % 12)) continue; const dd = Math.abs(j - idx); if (dd < bd) { bd = dd; best = j; } } return best; };
  const notes = [];
  for (let b = 0; b < bars.length; b++) {
    const B = bars[b]; if (B.sec === 'intro') continue;
    if (B.sec === 'outro') { if (B.b === 0) notes.push({ t: barT(b), semi: 12, endAt: barT(b) + spb * 3, final: true }); continue; }
    if (B.sec === 'C') { notes.push({ t: barT(b), semi: scale[snap(4, B.chord)], endAt: barT(b) + spb * 2.5 }); continue; }
    if (B.b % 2) continue;   // a motif covers 2 bars
    const M = MOT[B.sec], lastPair = B.b === 6;
    M.r.forEach((s, j) => {
      if (lastPair && s > 8) return;
      const bb = b + (s >= 8 ? 1 : 0), chord = bars[bb].chord, strong = s % 4 === 0;
      let idx = M.steps[j]; if (strong) idx = snap(idx, chord);
      if (lastPair && s === 8) idx = snap(idx < 4 ? 0 : 5, bars[bb].chord);
      const t = barT(b) + s * spb / 2 + (s % 2 ? swing : 0);
      notes.push({ t, semi: scale[idx], strong, chord, sec: B.sec, cad: lastPair && s === 8 });
    });
    if (lastPair && !M.r.includes(8)) notes.push({ t: barT(b) + 4 * spb, semi: scale[snap(5, bars[b + 1].chord)], strong: true, chord: bars[b + 1].chord, cad: true });
  }
  notes.sort((a, b) => a.t - b.t);
  // tiles: lanes follow the pitch (low notes left, high notes right)
  const lo = Math.min(...notes.map(n => n.semi)), hi = Math.max(...notes.map(n => n.semi));
  const tiles = []; let prev = null;
  notes.forEach((n, j) => {
    const next = notes[j + 1], gap = n.endAt ? n.endAt - n.t : (next ? next.t : barT(bars.length)) - n.t;
    let lane = Math.min(3, Math.floor((n.semi - lo) / (hi - lo + 1) * 4));
    // like Piano Tiles: two squishies in a row never use the same column
    if (prev && lane === prev.lane) lane = n.semi > prev.semi ? Math.min(3, lane + 1) : n.semi < prev.semi ? Math.max(0, lane - 1) : (lane < 2 ? lane + 1 : lane - 1);
    if (prev && lane === prev.lane) lane = (lane + 1 + Math.floor(R() * 3)) % 4;
    if (prev && prev.pair != null && lane === prev.pair) lane = [0, 1, 2, 3].find(l => l !== prev.lane && l !== prev.pair && Math.abs(l - lane) <= 2) ?? lane;
    let hold = 0;
    if (n.endAt && i >= 1) hold = n.endAt - n.t;
    else if (gap >= spb * 1.5 && (n.cad && i >= 1 || R() < holdRate)) hold = Math.max(spb, gap - spb * .5);
    const tile = { t: n.t, semi: n.semi, lane, hold, sq: band.sq[lane] }; tiles.push(tile); prev = tile;
    if (!hold && n.strong && n.chord && R() < chordRate && (d > .6 || gap >= spb)) {
      const pcs = n.chord.t.map(x => ((x % 12) + 12) % 12); let h2 = n.semi - 1; while (!pcs.includes(((h2 % 12) + 12) % 12) && h2 > n.semi - 9) h2--;
      const l2 = lane >= 2 ? lane - 2 : lane + 2; tiles.push({ t: n.t, semi: h2, lane: l2, hold: 0, sq: band.sq[l2], pair: true }); tile.pair = l2;
    }
  });
  tiles.forEach(tl => { tl.end = tl.t + tl.hold; });
  // the best possible score (all PERFECT, never miss), for stars and coins
  let max = 0, c = 0; tiles.forEach(tl => { c++; const m = mult(c); max += 300 * m; if (tl.hold) { max += Math.floor(tl.hold / (spb / 4)) * 20 * m + 50 * m; } });
  const len = barT(bars.length) + .4, accMax = tiles.length + tiles.filter(t => t.hold).length;
  return (TRACKS[i] = { i, name: NAMES[i], d, bpm, spb, key, minor, style, band, swing, bars, barT, tiles, max, accMax, len, travel: 1.7 - d * .78, diff: d < .2 ? 'Easy' : d < .45 ? 'Medium' : d < .75 ? 'Hard' : 'Expert' });
}
const nxtLocked = i => i + 1 < NT && !unlocked(loadP(), i + 1);
const mult = c => Math.min(2, 1 + Math.floor(c / 20) * .25);
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/* ---------- audio set-up (once per audio context) ---------- */
function studio() {
  if (FX && FX.ac === ac) return FX;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .18;
  const master = ac.createGain(); master.gain.value = .72; comp.connect(master); master.connect(SQS.out(ac));
  const len = Math.floor(ac.sampleRate * 2.2), ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4); }
  const rev = ac.createConvolver(); rev.buffer = ir; const revOut = ac.createGain(); revOut.gain.value = .5; rev.connect(revOut); revOut.connect(comp);
  const dly = ac.createDelay(1.5), fb = ac.createGain(), dlf = ac.createBiquadFilter(); fb.gain.value = .33; dlf.type = 'lowpass'; dlf.frequency.value = 2400; dly.connect(dlf); dlf.connect(fb); fb.connect(dly); dlf.connect(comp);
  const nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  FX = { ac, comp, rev, dly, noise: nb }; return FX;
}
function newMix() {
  const F = studio(), mix = ac.createGain(), duck = ac.createGain(), rv = ac.createGain(), dl = ac.createGain();
  mix.gain.value = 1; duck.connect(mix); mix.connect(F.comp); rv.gain.value = 1; rv.connect(F.rev); dl.gain.value = 1; dl.connect(F.dly);
  return { mix, duck, rv, dl, all: [mix, rv, dl] };
}
function fadeOut() { if (!S || !S.ac || !S.m) return; const t = S.ac.currentTime; S.m.all.forEach(g => { try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + .6); } catch (e) {} }); }

/* ---------- instruments (time = seconds on the song clock) ---------- */
const T = time => S.t0 + time;
function env(g, t, a, peak, d) { g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
function send(node, { dry = 1, rev = 0, dly = 0, duck = false } = {}) {
  const m = S.m;
  if (dry) { const g = ac.createGain(); g.gain.value = dry; node.connect(g); g.connect(duck ? m.duck : m.mix); }
  if (rev) { const g = ac.createGain(); g.gain.value = rev; node.connect(g); g.connect(m.rv); }
  if (dly) { const g = ac.createGain(); g.gain.value = dly; node.connect(g); g.connect(m.dl); }
}
function noiseSrc(t, d) { const n = ac.createBufferSource(); n.buffer = FX.noise; n.start(t, Math.random() * .5, d + .05); return n; }
function kick(time, v = 1) {
  const t = T(time), o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(52, t + .1);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.7 * v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .36);
  o.connect(g); send(g); o.start(t); o.stop(t + .4);
  const c = ac.createOscillator(), cg = ac.createGain(); c.type = 'square'; c.frequency.value = 2200; env(cg, t, .001, .07 * v, .014); c.connect(cg); send(cg); c.start(t); c.stop(t + .03);
  const d = S.m.duck.gain; d.setValueAtTime(.35, t); d.linearRampToValueAtTime(1, t + .2);   // pump the bass and pads
}
function snare(time, v = 1) {
  const t = T(time), n = noiseSrc(t, .2), f = ac.createBiquadFilter(), g = ac.createGain();
  f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = .5; env(g, t, .002, .62 * v, .17); n.connect(f); f.connect(g); send(g, { rev: .35 });
  const n2 = noiseSrc(t, .1), f2 = ac.createBiquadFilter(), g2 = ac.createGain(); f2.type = 'highpass'; f2.frequency.value = 6000; env(g2, t, .001, .25 * v, .08); n2.connect(f2); f2.connect(g2); send(g2);
  const o = ac.createOscillator(), og = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(150, t + .08); env(og, t, .002, .28 * v, .09); o.connect(og); send(og); o.start(t); o.stop(t + .15);
}
function clap(time, v = 1) {
  const t = T(time), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.2; f.connect(g); send(g, { rev: .5 });
  g.gain.setValueAtTime(.0001, t); [0, .011, .022].forEach(k => { g.gain.setValueAtTime(.32 * v, t + k); g.gain.exponentialRampToValueAtTime(.04, t + k + .009); }); g.gain.setValueAtTime(.26 * v, t + .033); g.gain.exponentialRampToValueAtTime(.0001, t + .2);
  const n = noiseSrc(t, .22); n.connect(f);
}
function hat(time, v = 1, open = false) {
  const t = T(time), n = noiseSrc(t, open ? .3 : .06), f = ac.createBiquadFilter(), g = ac.createGain();
  f.type = 'highpass'; f.frequency.value = 7000; env(g, t, .001, .24 * v, open ? .24 : .04); n.connect(f); f.connect(g); send(g, { rev: open ? .15 : 0 });
}
function riser(time, d) {
  const t = T(time), n = noiseSrc(t, d), f = ac.createBiquadFilter(), g = ac.createGain();
  f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(7000, t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + d * .95); g.gain.linearRampToValueAtTime(.0001, t + d + .02); n.connect(f); f.connect(g); send(g, { rev: .4 });
}
function bass(time, semi, d, v = 1) {
  const t = T(time), f0 = 65.41 * Math.pow(2, (semi + S.key) / 12), o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
  o.type = 'sawtooth'; o.frequency.value = f0; o2.type = 'sine'; o2.frequency.value = f0;
  f.type = 'lowpass'; f.Q.value = 6; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(320, t + Math.min(d, .25));
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.14 * v, t + .006); g.gain.setValueAtTime(.14 * v, t + d * .8); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(f); o2.connect(f); f.connect(g); send(g, { duck: true }); o.start(t); o2.start(t); o.stop(t + d + .05); o2.stop(t + d + .05);
}
function pad(time, chord, d, v = 1) {
  const t = T(time), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.frequency.value = 2600; f.Q.value = .5; f.connect(g);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.05 * v, t + Math.min(.35, d * .3)); g.gain.setValueAtTime(.05 * v, t + d * .85); g.gain.linearRampToValueAtTime(.0001, t + d);
  send(g, { duck: true, rev: .6 });
  chord.t.forEach(s => [-8, 8].forEach(det => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(s); o.detune.value = det; o.connect(f); o.start(t); o.stop(t + d + .05); }));
}
function bell(time, semi, v = 1) {
  const t = T(time), o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
  o.type = 'triangle'; o.frequency.value = hz(semi); o2.type = 'sine'; o2.frequency.value = hz(semi) * 4.01;
  env(g, t, .003, .1 * v, .34); env(g2, t, .002, .03 * v, .1); o.connect(g); o2.connect(g2); g2.connect(g);
  send(g, { rev: .3, dly: .35 }); o.start(t); o2.start(t); o.stop(t + .4); o2.stop(t + .4);
}
function squeak(time, semi, v = 1) {   // the player's note: a cute rubbery squeak, tuned to the song
  const t = T(time), f0 = hz(semi), o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(f0 * .86, t); o.frequency.exponentialRampToValueAtTime(f0, t + .035); o.frequency.exponentialRampToValueAtTime(f0 * 1.04, t + .22);
  o2.type = 'triangle'; o2.frequency.setValueAtTime(f0 * 2, t);
  env(g, t, .006, .2 * v, .26); env(g2, t, .004, .05 * v, .1); o.connect(g); o2.connect(g2); g2.connect(g);
  send(g, { rev: .25, dly: .18 }); o.start(t); o2.start(t); o.stop(t + .35); o2.stop(t + .35);
}
function bonk(time) { const t = T(time), o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(110, t + .08); env(g, t, .002, .07, .08); o.connect(g); send(g); o.start(t); o.stop(t + .12); }
function epiano(time, chord, d, v = 1) {
  const t = T(time), g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.06 * v, t + .01); g.gain.exponentialRampToValueAtTime(.022 * v, t + Math.min(d, .5)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  const trem = ac.createOscillator(), tg = ac.createGain(); trem.frequency.value = 5; tg.gain.value = .012 * v; trem.connect(tg); tg.connect(g.gain); trem.start(t); trem.stop(t + d + .05);
  send(g, { duck: true, rev: .4 });
  chord.t.forEach(s => { const o = ac.createOscillator(), o2 = ac.createOscillator(), g2 = ac.createGain(); o.type = 'sine'; o.frequency.value = hz(s + 12); o2.type = 'sine'; o2.frequency.value = hz(s + 12) * 2; g2.gain.value = .3; o.connect(g); o2.connect(g2); g2.connect(g); o.start(t); o2.start(t); o.stop(t + d + .05); o2.stop(t + d + .05); });
}
function organ(time, chord, d, v = 1) {
  const t = T(time), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.frequency.value = 1800; f.connect(g);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.035 * v, t + .03); g.gain.setValueAtTime(.035 * v, t + d * .9); g.gain.linearRampToValueAtTime(.0001, t + d);
  send(g, { duck: true, rev: .5 });
  chord.t.forEach(s => ['square', 'sine'].forEach((ty, k) => { const o = ac.createOscillator(); o.type = ty; o.frequency.value = hz(s) * (k ? 2 : 1); o.connect(f); o.start(t); o.stop(t + d + .05); }));
}
function crash(time) { const t = T(time), n = noiseSrc(t, 1.6), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'highpass'; f.frequency.value = 5000; env(g, t, .002, .18, 1.5); n.connect(f); f.connect(g); send(g, { rev: .4 }); }
// the melody: each band has its own voice. Returns a handle so held notes can be stopped.
function voice(time, semi, tone, hold = 0, v = 1) {
  const t = T(time), f0 = hz(semi), o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain(), f = ac.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = tone === 'chip' ? 3200 : 6000; f.connect(g);
  if (tone === 'chip') { o.type = 'square'; o2.type = 'square'; o2.frequency.value = f0 * 2.004; g2.gain.value = .15; }
  else if (tone === 'bell') { o.type = 'triangle'; o2.type = 'sine'; o2.frequency.value = f0 * 4.01; g2.gain.value = .35; }
  else if (tone === 'flute') { o.type = 'sine'; o2.type = 'triangle'; o2.frequency.value = f0 * 2; g2.gain.value = .12; }
  else { o.type = 'sine'; o2.type = 'triangle'; o2.frequency.value = f0 * 2; g2.gain.value = .25; }
  o.frequency.setValueAtTime(tone === 'rubber' ? f0 * .86 : f0, t); o.frequency.exponentialRampToValueAtTime(f0, t + .04);
  const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.5; vg.gain.value = hold ? f0 * .006 : 0; vib.connect(vg); vg.connect(o.frequency);
  const peak = (tone === 'chip' ? .09 : .2) * v, att = tone === 'flute' ? .03 : .006;
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(peak, t + att);
  let end;
  if (hold) { g.gain.exponentialRampToValueAtTime(peak * .7, t + .15); end = t + hold + .4; }
  else { const dec = tone === 'bell' ? .55 : tone === 'chip' ? .16 : .3; g.gain.exponentialRampToValueAtTime(.0001, t + att + dec); end = t + att + dec + .05; }
  o.connect(f); o2.connect(g2); g2.connect(f); send(g, { rev: .25, dly: .15 }); [o, o2, vib].forEach(x => { x.start(t); x.stop(end); });
  return { stop(at) { const s = Math.max(ac.currentTime, at); try { g.gain.cancelScheduledValues(s); g.gain.setValueAtTime(g.gain.value || peak * .7, s); g.gain.exponentialRampToValueAtTime(.0001, s + .12); [o, o2, vib].forEach(x => x.stop(s + .15)); } catch (e) {} } };
}

/* ---------- the backing band (scheduled one bar at a time, ~2 s ahead) ---------- */
function scheduleBar(b) {
  const K = S.trk, B = K.bars[b], spb = K.spb, t0 = K.barT(b), ch = B.chord, st = K.style, sec = B.sec, sw = K.swing;
  const beat = k => t0 + k * spb, off = k => t0 + k * spb + spb / 2 + sw;
  if (sec === 'intro') { kick(beat(0), .8); for (let k = 0; k < 4; k++) { hat(beat(k), .4); hat(off(k), .7); } if (B.b === 1) [0, .25, .5, .75].forEach((x, i) => snare(beat(3) + spb * x, .25 + i * .15)); pad(t0, ch, spb * 4, .7); return; }
  if (sec === 'outro') { if (B.b === 0) { kick(t0, 1); crash(t0); pad(t0, ch, spb * 7, 1.2); bass(t0, ch.root, spb * 6, .9); } return; }
  if (sec === 'C') { if (B.b === 0 || B.b === 2) pad(t0, ch, spb * 8, 1.3); for (let k = 0; k < 4; k++) hat(off(k), .5); bass(t0, ch.root, spb * 3.6, .7); [0, 1, 2, 1].forEach((n, k) => bell(beat(k), ch.t[n] + 12, .6)); if (B.last) { riser(t0, spb * 4); [0, .25, .5, .75].forEach((x, i) => { snare(beat(2) + spb * x, .2 + i * .1); snare(beat(3) + spb * x, .4 + i * .12); }); } return; }
  const chorus = sec === 'B';
  if (B.b === 0 && chorus) crash(t0);
  // drums
  for (let k = 0; k < 4; k++) {
    if (st === 'pop') { if (chorus || k % 2 === 0) kick(beat(k), k === 0 ? 1 : .85); if (!chorus && k === 2) kick(off(k), .55); if (k % 2) { snare(beat(k), .9); if (chorus) clap(beat(k), .8); } hat(beat(k), .5); hat(off(k), .9, chorus && k % 2 === 1); }
    if (st === 'disco') { kick(beat(k), k === 0 ? 1 : .9); hat(off(k), 1, true); hat(beat(k), .35); if (k % 2) { snare(beat(k), .7); clap(beat(k), .9); } }
    if (st === 'swing') { if (k % 2 === 0) kick(beat(k), .7); if (k % 2) snare(beat(k), .45); hat(beat(k), .6); if (k % 2 || chorus) hat(off(k), .4); }
    if (st === 'chill') { if (k === 0) kick(beat(k), .9); if (k === 1) kick(off(k), .6); if (k === 2) snare(beat(k), .8); hat(beat(k), .35); hat(off(k), .3); }
    if (st === 'march') { kick(beat(k), k === 0 ? .9 : .6); if (k % 2) snare(beat(k), .7); if (k === 3) [.5, .75].forEach(x => snare(beat(k) + spb * x, .35)); if (chorus && k % 2) clap(beat(k), .7); }
  }
  if (B.last && K.bars[b + 1] && K.bars[b + 1].sec === 'B' && !chorus) [0, .25, .5, .75].forEach((x, i) => snare(beat(3) + spb * x, .3 + i * .15));
  // bass
  const r = ch.root;
  if (st === 'pop' || st === 'disco') for (let k = 0; k < 4; k++) { bass(beat(k), r, spb * .42); bass(off(k), r + (st === 'disco' || k % 2 ? 12 : 0), spb * .4, .85); }
  if (st === 'swing') [0, K.minor ? 3 : 4, 7, K.minor ? 10 : 9].forEach((x, k) => bass(beat(k), r + x, spb * .9, .9));
  if (st === 'chill') { bass(beat(0), r, spb * 2.6, .9); bass(off(2), r + 7, spb * 1.2, .7); }
  if (st === 'march') for (let k = 0; k < 4; k++) bass(beat(k), r + (k % 2 ? 7 : 0), spb * .7, .9);
  // chords
  if (st === 'pop') pad(t0, ch, spb * 4, chorus ? 1.15 : .8);
  if (st === 'disco') for (let k = 0; k < 4; k++) pad(off(k), ch, spb * .3, .9);
  if (st === 'swing') [1, 3].forEach(k => epiano(beat(k), ch, spb * .7, 1));
  if (st === 'chill') epiano(t0, ch, spb * 3.9, 1.1);
  if (st === 'march') organ(t0, ch, spb * 4, chorus ? 1.1 : .8);
  // bells sparkle in the chorus
  if (chorus && st !== 'march') { const arp = [ch.t[0] + 12, ch.t[1] + 12, ch.t[2] + 12, ch.t[1] + 12]; for (let k = 0; k < 4; k++) { bell(beat(k), arp[(k * 2) % 4], .45); bell(off(k), arp[(k * 2 + 1) % 4], .35); } }
}

/* ---------- playing ---------- */
const G = () => SQV.G;
function press(lane) {
  const t = now(G()); S.down[lane]++; S.flash[lane] = 1;
  // it's a squishy's turn when no other squishy is below it (two side by side share the turn)
  let nextT = Infinity; S.tiles.forEach(tl => { if (!tl.hit && !tl.miss && tl.t < nextT) nextT = tl.t; });
  const cand = nextT - t <= S.trk.travel * 1.08 ? S.tiles.find(tl => tl.lane === lane && !tl.hit && !tl.miss && Math.abs(tl.t - nextT) < .001) : null;
  if (!cand) { mistake(lane, 'oops'); if (S.ac && S.m) bonk(t + .005); return; }
  const e = Math.abs(cand.t - t), onBeat = e < .09, [txt, pts, col] = onBeat ? ['PERFECT', 300, '#FFD54A'] : ['NICE', 200, '#7ED3B2'];
  cand.hit = true; cand.hitAt = t; S.acc += 1; S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo); S.count[txt]++;
  const m = mult(S.combo); G().score += Math.round(pts * m); S.judge[lane] = { txt, col, life: .45 };
  if (S.ac && S.m) cand.snd = voice(t + .005, cand.semi, S.trk.band.tone, cand.hold ? Math.max(.1, cand.end - t) : 0, onBeat ? 1 : .9);
  if (cand.hold) { cand.holding = true; S.hold[lane] = cand; cand.tick = t + S.trk.spb / 4; }
  if (onBeat) G().burst(laneX(lane), HIT_Y, LANE_COL[lane], 7, 130);
  S.squish[lane] = 1;
}
function release(lane) {
  S.down[lane] = Math.max(0, S.down[lane] - 1); if (S.down[lane]) return;
  const h = S.hold[lane]; if (!h) return; const t = now(G());
  if (t < h.end - .12) { S.acc += Math.max(0, Math.min(1, (t - h.hitAt) / Math.max(.1, h.end - h.hitAt))); h.broken = true; h.holding = false; S.hold[lane] = null; if (h.snd) h.snd.stop(T(t)); mistake(lane, 'let go!'); }
  else endHold(lane, h, t);
}
function endHold(lane, h, t) { S.acc += 1; h.holding = false; h.done = true; S.hold[lane] = null; const m = mult(S.combo); G().score += Math.round(50 * m); if (h.snd) h.snd.stop(T(Math.min(t, h.end + .05))); G().burst(laneX(lane), HIT_Y - 20, '#FFFFFF', 6, 90); S.judge[lane] = { txt: 'HOLD!', col: '#FFD54A', life: .45 }; }
// 3 hearts: a miss, a wrong tap or letting go of a long squishy too early each cost one
function mistake(lane, txt) { S.hearts = Math.max(0, S.hearts - 1); S.combo = 0; S.judge[lane] = { txt, col: '#FF8FB8', life: .5 }; S.hurt = 1; G().shake(.2); G().buzz(60); }
function finish(win) { result(win); G().end(); }
function result(win) {
  if (S.over) return; S.over = true; fadeOut(); Object.values(S.hold).forEach(h => h && h.snd && h.snd.stop(S.ac ? S.ac.currentTime : 0));
  const K = S.trk, sc = G().score, ratio = Math.min(1, S.acc / K.accMax), stars = win ? (ratio >= .95 ? 3 : ratio >= .85 ? 2 : 1) : 0;
  const P = loadP(), before = openCount(P), prev = P.stars[K.i] || 0; if (stars > prev) P.stars[K.i] = stars; P.best[K.i] = Math.max(P.best[K.i] || 0, sc); saveP(P);
  const played = Math.min(K.len, Math.max(0, now(G())));
  S.res = { win, stars, prev, ratio, played, newOpen: openCount(P) > before ? NAMES.slice(before, openCount(P)).join(', ') : null, coins: Math.round(40 * (K.len / 60) * ratio) };   // ratio already shrinks if the song stopped early
}
const game = {
  id: 'squeak-beat', music: false, title: 'Squeak Beat', where: 'on the Squeak Stage', levels: true,
  how: ['Your squishies slide down four columns. Tap the lowest one (or anywhere in its column) any time, as soon as it is its turn: no other squishy below it.', 'You have 3 hearts. A squishy sliding off the bottom, a tap on the wrong column, or letting go of a long squishy too early each cost one. Lose all 3 and the show stops. Tapping right on the line scores a PERFECT bonus.', 'Long squishies trail a stripe: tap and keep holding until the stripe is gone.', 'Every tap plays the next note of the song, so you play the tune!', 'Stars open new tracks: track N needs (N−1) × 3 stars in total.'],
  keys: 'Sound on! · PC: D F J K (or 1 2 3 4, or arrow keys)',
  coins: { menu: 'Coins: about 40 per minute of music, times your accuracy (squishies tapped ÷ all squishies). Replays pay too. Stars: finish = ★, 85% = ★★, 95% = ★★★.', custom: () => ({ total: S.res.coins, html: `<div class="pay"><p class="pay-big"><i class="ci" aria-hidden="true"></i>+${S.res.coins} coins</p><p class="pay-sm">${mmss(S.trk.len)} song × ${Math.round(S.res.ratio * 100)}% accuracy</p></div>` }) },
  menu(Gm, rw) {
    const P = loadP(), have = totalStars(P), open = openCount(P), first = [...Array(open).keys()].find(i => (P.stars[i] || 0) < 3) ?? open - 1;
    const row = i => { const K = track(i), st = P.stars[i] || 0; return unlocked(P, i) ? `<button type="button" class="trk${i === first ? ' cur' : ''}" data-go="${i}"><span class="tn">${i + 1}. ${K.name}</span><span class="tm">${K.diff} · ${K.band.name} · ${K.bpm} BPM · ${mmss(K.len)}</span>${SQV.starRow(st)}</button>` : `<button type="button" class="trk lock" disabled><span class="tn">🔒 ${i + 1}. ${K.name}</span><span class="tm">${K.diff} · needs <b>${needStars(i)}★</b> (you have ${have}★)</span></button>`; };
    const list = []; for (let i = 0; i < NT; i++) list.push(row(i));
    return `<p class="eyebrow">Squishy Island minigame</p><h1>${game.title}</h1><p class="sub">${game.where}</p><details class="how"${have === 0 ? ' open' : ''}><summary>How to play</summary><ul>${game.how.map(h => `<li>${h}</li>`).join('')}</ul>${rw}</details><p class="best">Stars: <b>${have}</b> / ${NT * 3} · tracks open: <b>${open}</b> / ${NT}</p><button class="go" type="button" data-go="${first}">Play: ${NAMES[first]}</button><div class="trks">${list.join('')}</div><p class="keys">${game.keys}</p>`;
  },
  over(Gm, pay) {
    const r = S.res, K = S.trk, P = loadP(), nxt = K.i + 1 < NT && unlocked(P, K.i + 1) ? K.i + 1 : null;
    return `<p class="eyebrow">Track ${K.i + 1} · ${K.name}</p><h1>${r.win ? 'Encore!' : 'Show stopped'}</h1>${r.win ? SQV.starRow(r.stars, true) : ''}<p class="sub"><b data-count="${G().score}">${G().score.toLocaleString('en-US')}</b> points · ${Math.round(r.ratio * 100)}% accuracy · best combo ${S.bestCombo}<br>Perfect ${S.count.PERFECT} · Nice ${S.count.NICE} · Missed ${S.count.miss}</p>${r.win && r.stars > r.prev && r.prev ? '<p class="nb">New best stars!</p>' : ''}${r.newOpen ? `<p class="nb">New track open: ${r.newOpen}!</p>` : !r.win || nxtLocked(K.i) ? `<p class="best">${K.i + 1 < NT ? `${NAMES[K.i + 1]} needs ${needStars(K.i + 1)}★ (you have ${totalStars(loadP())}★)` : ''}</p>` : ''}${pay}<div class="btnrow">${r.win && nxt != null ? `<button class="go" type="button" data-go="${nxt}">Next track</button>` : `<button class="go" type="button" data-go="${K.i}">${r.win ? 'Play again' : 'Try again'}</button>`}</div><div class="btnrow">${r.win && nxt != null ? `<button class="ghost" type="button" data-go="${K.i}">Play again</button>` : ''}<button class="ghost" type="button" data-act="menu">All tracks</button></div>`;
  },
  act(a) { if (a === 'menu') G().menu(); },
  canRevive: () => S.dead && !S.over,
  pause() { if (S.ac && S.ac.state === 'running') S.ac.suspend(); },
  resume() { if (S.ac && S.ac.state === 'suspended') S.ac.resume(); },
  revive() { const t = now(G()); S.hearts = 1; S.dead = false; S.tiles.forEach(tl => { if (!tl.hit && !tl.miss && tl.t < t + 1.2) { tl.hit = true; tl.skip = true; } }); },   // a short safe gap after the ad
  beforeOver() { if (S.dead && !S.over) { if (S.ac && S.ac.state === 'suspended') S.ac.resume(); result(false); } },
  reviveTitle: () => 'Out of hearts', reviveLine: () => `${S.trk.name}: ${Math.round(Math.max(0, now(G())) / S.trk.len * 100)}% of the song played.`, reviveGift: 'and finish the song with 1 heart',
  init(Gm) {
    if (S && S.m) fadeOut();
    const P = loadP(); let i = Gm.arg != null ? +Gm.arg : 0; if (!(i >= 0 && i < NT) || !unlocked(P, i)) i = 0;
    const K = track(i);
    S = { trk: K, key: K.key, tiles: K.tiles.map(t => ({ ...t })), nb: 0, hearts: 3, dead: false, hurt: 0, combo: 0, bestCombo: 0, down: [0, 0, 0, 0], flash: [0, 0, 0, 0], squish: [0, 0, 0, 0], judge: {}, hold: {}, ptr: {}, count: { PERFECT: 0, NICE: 0, miss: 0 }, acc: 0, ac: null, t0: 0, started: false, over: false, m: null, res: null };
  },
  update(dt, Gm) {
    if (!S.started) { S.started = true; try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); S.ac = ac; S.t0 = ac.currentTime + .35; S.m = newMix(); } catch (e) { S.ac = null; } }
    const t = now(Gm), K = S.trk;
    if (S.ac && S.m) while (S.nb < K.bars.length && K.barT(S.nb) < t + 2.2) scheduleBar(S.nb++);
    S.tiles.forEach(tl => { if (!tl.hit && !tl.miss && t - tl.t > .25) { tl.miss = true; S.count.miss++; mistake(tl.lane, 'miss'); } });
    Object.entries(S.hold).forEach(([lane, h]) => { if (!h) return; while (h.tick <= Math.min(t, h.end)) { Gm.score += Math.round(20 * mult(S.combo)); h.tick += K.spb / 4; } if (t >= h.end) endHold(+lane, h, t); });
    for (let l = 0; l < NL; l++) { S.flash[l] = Math.max(0, S.flash[l] - dt * 5); S.squish[l] = Math.max(0, S.squish[l] - dt * 4); const j = S.judge[l]; if (j) { j.life -= dt; if (j.life <= 0) delete S.judge[l]; } }
    S.hurt = Math.max(0, S.hurt - dt * 2.5);
    if (S.hearts <= 0 && !S.dead) { S.dead = true; Gm.end(); } else if (!S.dead && t > K.len) finish(true);
  },
  draw(c, Gm) {
    const K = S.trk, t = now(Gm), tv = K.travel, bg = c.createLinearGradient(0, 0, 0, H), cols = STYLE_BG[K.style];
    bg.addColorStop(0, cols[0]); bg.addColorStop(1, cols[1]); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 22; i++) { c.globalAlpha = .25 + .45 * Math.abs(Math.sin(Gm.t * 1.3 + i)); c.fillStyle = '#FFF3B0'; c.fillRect((i * 83) % W, 60 + (i * 137) % 460, 2, 2); } c.globalAlpha = 1;
    const ph = ((t % K.spb) + K.spb) % K.spb / K.spb; c.globalAlpha = .12 * (1 - ph); c.fillStyle = '#FFFFFF'; c.fillRect(0, 52, W, H - 52); c.globalAlpha = 1;
    // lanes
    for (let l = 0; l < NL; l++) { c.globalAlpha = .13 + S.flash[l] * .22 + (S.hold[l] ? .12 : 0); D.rr(c, LX0 + l * LW + 3, 58, LW - 6, 572, 16, LANE_COL[l], null, 0); c.globalAlpha = 1; }
    c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(8, HIT_Y - 2, W - 16, 4);
    const yAt = time => TOP_Y + (HIT_Y - TOP_Y) * (1 - (time - t) / tv);
    let nextT = Infinity; S.tiles.forEach(tl => { if (!tl.hit && !tl.miss && tl.t < nextT) nextT = tl.t; });
    // hold stripes first, then the squishies on top
    S.tiles.forEach(tl => { if (!tl.hold || tl.miss || tl.broken || tl.done) return; const y1 = tl.holding ? Math.min(HIT_Y, yAt(tl.t)) : yAt(tl.t), y2 = Math.max(TOP_Y - 40, yAt(tl.end)); if (y1 < TOP_Y - 40 || y2 > H) return; const x = laneX(tl.lane); c.globalAlpha = .75; D.rr(c, x - 15, y2, 30, Math.max(8, y1 - y2), 15, LANE_COL[tl.lane], '#FFFFFF', 3); c.globalAlpha = 1; c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x - 3, y2 + 10, 6, Math.max(0, y1 - y2 - 20)); D.star(c, x, y2 + 4, 9, 4, '#FFF3B0', INK, 1.5); });
    S.tiles.forEach(tl => {
      if ((tl.hit && !tl.holding) || tl.broken) return;
      const y = tl.holding ? Math.min(HIT_Y, yAt(tl.t)) : yAt(tl.t); if (y < TOP_Y - 70 || y > H + 40) return;
      const x = laneX(tl.lane), next = Math.abs(tl.t - nextT) < .001, sq = tl.holding ? .78 + .05 * Math.sin(Gm.t * 20) : 1;
      c.globalAlpha = tl.miss ? .35 : 1;
      if (next && !tl.miss) { c.save(); c.globalAlpha = .55 + .35 * Math.sin(Gm.t * 10); D.rr(c, x - 38, y - 64, 76, 66, 18, null, '#FFFFFF', 4); c.restore(); }
      D.rr(c, x - 34, y - 60, 68, 58, 16, LANE_COL[tl.lane], '#FFFFFF', 3);
      D.sprite(c, tl.sq, x, y - 2, 60, { sx: 2 - sq, sy: sq });
      c.globalAlpha = 1;
    });
    // pads under the line
    for (let l = 0; l < NL; l++) { const x = laneX(l), p = S.flash[l]; D.rr(c, x - 36, 562, 72, 56, 16, p ? '#FFFFFF' : 'rgba(255,255,255,.18)', 'rgba(255,255,255,.6)', 2); D.text(c, ['D', 'F', 'J', 'K'][l], x, 590, 16, p ? LANE_COL[l] : 'rgba(255,255,255,.75)', 'center', 'display'); const j = S.judge[l]; if (j) D.text(c, j.txt, x, HIT_Y - 76, j.txt.length > 6 ? 12 : 15, j.col, 'center', 'display', INK, 4); }
    if (S.combo >= 10) D.text(c, `${S.combo} combo`, W / 2, 112, 20, '#FFD54A', 'center', 'display', INK, 5);
    // intro countdown
    const beatsIn = t / K.spb; if (beatsIn < 8) { const n = 8 - Math.floor(Math.max(0, beatsIn)); D.text(c, n > 4 ? K.name : n === 0 ? 'Go!' : String(n), W / 2, 300, n > 4 ? 26 : 54, '#FFFFFF', 'center', 'display', INK, 6); if (n > 4) D.text(c, `${K.band.name} · ${K.diff}`, W / 2, 334, 13, '#FFF3B0', 'center', 'body'); }
    // hud
    c.fillStyle = '#7C4DDB'; c.fillRect(0, 0, W, 52); D.rr(c, 10, 12, 100, 28, 14, '#FFFFFF'); D.text(c, Gm.score.toLocaleString('en-US'), 60, 27, 14, INK, 'center', 'body');
    D.hearts(c, 136, 26, S.hearts); if (S.hurt) { c.globalAlpha = S.hurt * .35; c.fillStyle = '#FF5E6C'; c.fillRect(0, 52, W, H - 52); c.globalAlpha = 1; }
    D.text(c, 'song', 254, 21, 10, '#FFFFFF', 'center', 'body'); D.bar(c, 232, 28, 118, 14, Math.max(0, t) / K.len, '#FFD54A');
  },
  down(x, y, id) { const lane = Math.max(0, Math.min(3, Math.floor((x - LX0) / LW))); S.ptr[id] = lane; press(lane); },
  up(x, y, id) { const lane = S.ptr[id]; if (lane == null) return; delete S.ptr[id]; release(lane); },
  key(code, down, e) { const lane = LANE_KEYS.findIndex(k => k.includes(code)); if (lane < 0) return false; if (e.repeat) return; if (down) press(lane); else release(lane); }
};
/* ---------- export for the real game (tools/render_squeak_beat.js): this exact band, rendered offline ---------- */
async function offline(seconds, fill, rate = 44100) {
  const keep = [ac, FX, S], keepOut = SQS.out, off = new OfflineAudioContext(2, Math.ceil(seconds * rate), rate);
  ac = off; FX = null; SQS.out = c => c.destination;
  try { fill(); } finally { [ac, FX, S] = keep; SQS.out = keepOut; }   // everything is scheduled now: the live game gets its state back while it renders
  return off.startRendering();
}
// track i's backing band (everything but the melody); song time 0 is `lead` seconds into the file
const renderBacking = (i, lead = .4) => { const K = track(i); return offline(K.len + lead + 2.5, () => { S = { trk: K, key: K.key, t0: lead }; S.m = newMix(); for (let b = 0; b < K.bars.length; b++) scheduleBar(b); }); };
// one melody note: a band voice at an absolute pitch (semitones from C4), short or held (stopped by the game)
const renderNote = (tone, semi, hold = 0) => offline(hold ? hold + 1.6 : 1.4, () => { S = { key: 0, t0: .01 }; S.m = newMix(); voice(0, semi, tone, hold); });
SQV.G = SQV.run(game); SQV.state = () => S; SQV.api = { track, press, release, game, NT, renderBacking, renderNote };
})();
