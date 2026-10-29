/* =====================================================================
   SQUISHVILLE SOUND + SETTINGS  ·  art/sound.js
   One small file shared by the design pages and every playable prototype.
   - SQS.settings      the player's settings (saved in this browser)
   - SQS.set({...})    change settings (the Settings page uses this)
   - SQS.play(name)    play a sound effect (list: SQS.SFX_LIST)
   - SQS.music(name)   start a background music track (list: SQS.TRACKS), SQS.music(null) stops
   - SQS.buzz(ms)      vibrate (only if vibration is on)
   - SQS.tier()        graphics tier actually in use: 'low' | 'medium' | 'high'
   Every sound is made live with the Web Audio API (no sound files), so the
   prototypes stay single files. The real game should use recorded/produced
   versions of the same sounds (see sound.html).
   ===================================================================== */
(function () {
'use strict';
if (window.SQS) return;
const SQS = window.SQS = {};
const KEY = 'sqv-settings';
const DEF = {
  sfx: true, sfxVol: .8, music: true, musicVol: .5, vibration: true,
  quality: 'auto', fps: 60, motion: 'full', battery: false,
  gemConfirm: true, hints: true, lefty: false, textSize: 'normal', colour: false, lang: 'en',
  notif: false, playLimit: 0, trading: true, purchases: 'gate', adsOff: false
};
SQS.DEFAULTS = DEF;
const load = () => { let v = {}; try { v = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {} return Object.assign({}, DEF, v); };
let S = SQS.settings = load();
const subs = [];
SQS.onChange = f => subs.push(f);
SQS.set = patch => { Object.assign(S, patch); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} apply(); subs.forEach(f => { try { f(S); } catch (e) {} }); };
SQS.reset = () => { try { localStorage.removeItem(KEY); } catch (e) {} Object.keys(S).forEach(k => delete S[k]); Object.assign(S, DEF); apply(); subs.forEach(f => f(S)); };
window.addEventListener('storage', e => { if (e.key === KEY) { const n = load(); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, n); apply(); subs.forEach(f => f(S)); } });

/* ---------------- graphics tier ----------------
   'auto' picks a tier from the device the first time (cores, memory, screen),
   then remembers it. Battery saver always means 'low' at 30 fps. */
SQS.detect = () => {
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4, dpr = window.devicePixelRatio || 1;
  const px = (screen.width || 400) * (screen.height || 800) * dpr * dpr;
  let pts = 0; pts += cores >= 8 ? 2 : cores >= 6 ? 1 : 0; pts += mem >= 6 ? 2 : mem >= 4 ? 1 : 0; if (px > 6e6 && cores < 6) pts--;
  const tier = pts >= 3 ? 'high' : pts >= 1 ? 'medium' : 'low';
  return { tier, cores, mem: navigator.deviceMemory ? mem + ' GB' : 'unknown', dpr };
};
SQS.tier = () => {
  if (S.battery) return 'low';
  if (S.quality !== 'auto') return S.quality;
  let t = null; try { t = localStorage.getItem('sqv-detected'); } catch (e) {}
  if (!t) { t = SQS.detect().tier; try { localStorage.setItem('sqv-detected', t); } catch (e) {} }
  return t;
};
SQS.fps = () => S.battery ? 30 : S.fps;
SQS.reduced = () => S.motion === 'reduced' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && S.motion !== 'full-forced');
SQS.buzz = ms => { if (!S.vibration) return; try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

/* ---------------- audio graph ---------------- */
let ac = null, master = null, sfxBus = null, musBus = null, nbuf = null, verb = null;
const foreign = [];   // games with their own AudioContext route through these
const vol = bus => bus === 'music' ? (S.music ? S.musicVol : 0) : (S.sfx ? S.sfxVol : 0);
SQS.vol = vol;
function graph(c) {
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
  const m = c.createGain(); m.gain.value = .9; m.connect(comp); comp.connect(c.destination);
  const sb = c.createGain(), mb = c.createGain(); sb.connect(m); mb.connect(m);
  const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  // a small soft room so bells and plucks sound round
  const v = c.createConvolver(), L = Math.floor(c.sampleRate * 1.2), ir = c.createBuffer(2, L, c.sampleRate);
  for (let k = 0; k < 2; k++) { const x = ir.getChannelData(k); for (let i = 0; i < L; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 3); }
  v.buffer = ir; const vg = c.createGain(); vg.gain.value = .18; v.connect(vg); vg.connect(m);
  return { ac: c, master: m, sfxBus: sb, musBus: mb, nbuf: nb, verb: v };
}
function ctx() {
  if (!ac) {
    try { ({ ac, master, sfxBus, musBus, nbuf, verb } = graph(new (window.AudioContext || window.webkitAudioContext)())); apply(); }
    catch (e) { ac = null; }
  }
  if (ac && ac.state === 'suspended' && !(window.OfflineAudioContext && ac instanceof OfflineAudioContext)) { try { ac.resume(); } catch (e) {} }
  return ac;
}
/* render a sound effect or one full loop of a song to an AudioBuffer (for exporting to the real game) */
function offline(seconds, fn, sr = 44100) {
  const saved = { ac, master, sfxBus, musBus, nbuf, verb };
  const g = graph(new OfflineAudioContext(2, Math.ceil(seconds * sr), sr));
  ({ ac, master, sfxBus, musBus, nbuf, verb } = g); sfxBus.gain.value = .8; musBus.gain.value = .55;
  try { fn(ac); } finally { const p = ac.startRendering(); ({ ac, master, sfxBus, musBus, nbuf, verb } = saved); return p; }
}
SQS.renderFX = (name, seconds = 2.4) => offline(seconds, c => FX[name][1](c.currentTime + .01, .5));
SQS.renderTrack = id => { const T = TRACKS[id], spb = 60 / T.bpm / 2, steps = 16 * 8, len = steps * spb;
  return offline(len + 2.5, () => { const st = startTrack(id, true); for (let i = 0; i < steps; i++) st.play(i, .05 + i * spb); }).then(buf => ({ buf, loopEnd: .05 + len })); };
SQS.wav = buf => { // 16-bit PCM WAV
  const ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, str) => { for (let i = 0; i < str.length; i++) out.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const data = [...Array(ch)].map((_, k) => buf.getChannelData(k)); let o = 44;
  for (let i = 0; i < n; i++) for (let k = 0; k < ch; k++) { const v = Math.max(-1, Math.min(1, data[k][i])); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7FFF, true); o += 2; }
  return new Blob([out], { type: 'audio/wav' });
};
SQS.ctx = ctx;
function apply() {
  if (ac) { sfxBus.gain.setTargetAtTime(vol('sfx'), ac.currentTime, .03); musBus.gain.setTargetAtTime(vol('music') * .55 * duck, ac.currentTime, .15); }
  foreign.forEach(f => { f.sfx.gain.value = vol('sfx'); f.music.gain.value = vol('music'); });
}
/* for games that make their own AudioContext: SQS.out(theirContext, 'sfx' | 'music') */
SQS.out = (c, bus = 'sfx') => {
  if (c === ac) return bus === 'music' ? musBus : sfxBus;
  let f = foreign.find(x => x.c === c);
  if (!f) { f = { c, sfx: c.createGain(), music: c.createGain() }; f.sfx.connect(c.destination); f.music.connect(c.destination); foreign.push(f); apply(); }
  return f[bus];
};
// browsers only allow sound after the first tap or key press
const unlock = () => { ctx(); if (wantTrack && !cur && S.music) startTrack(wantTrack); };
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });

/* ---------------- building blocks ---------------- */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function tone(f, d, o = {}) {
  if (!ac) return; const t = (o.t || ac.currentTime), type = o.type || 'sine', v = o.v ?? .15, out = o.bus === 'music' ? (o.out || musBus) : sfxBus;
  const osc = ac.createOscillator(), g = ac.createGain(); osc.type = type; osc.frequency.setValueAtTime(f, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, f * o.slide), t + d * (o.slideT || 1));
  if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.5; lg.gain.value = f * .012; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + .1); }
  const a = o.a ?? .005; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + a);
  if (o.hold) g.gain.setValueAtTime(v, t + o.hold);
  g.gain.exponentialRampToValueAtTime(.0001, t + d);
  let node = g; if (o.lp) { const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; g.connect(lp); node = lp; }
  osc.connect(g); node.connect(out); if (o.wet) { const wg = ac.createGain(); wg.gain.value = o.wet; node.connect(wg); wg.connect(verb); }
  osc.start(t); osc.stop(t + d + .05);
}
function noise(d, o = {}) {
  if (!ac) return; const t = o.t || ac.currentTime, out = o.bus === 'music' ? (o.out || musBus) : sfxBus;
  const n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = nbuf;
  f.type = o.ft || 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.f || 2000, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + d);
  const v = o.v ?? .12; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + (o.a ?? .004)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  n.connect(f); f.connect(g); g.connect(out); n.start(t, Math.random() * .5, d + .05);
}
const bell = (m, t, v = .1, d = .9) => { tone(mtof(m), d, { t, v, wet: .6 }); tone(mtof(m) * 2.76, d * .45, { t, v: v * .35, wet: .6 }); };
const pluck = (m, t, v = .12, d = .35, out) => { tone(mtof(m), d, { t, v, type: 'triangle', bus: out ? 'music' : 'sfx', out, wet: .3 }); tone(mtof(m) * 2, d * .5, { t, v: v * .25, bus: out ? 'music' : 'sfx', out }); };
const arp = (ms, gap, f, t0) => ms.forEach((m, i) => f(m, t0 + i * gap));

/* ---------------- the sound effects ----------------
   name: [description for sound.html, function(t)] */
const FX = {
  tap: ['Any button or bubble tapped: a soft "pop"', t => { tone(880, .07, { t, v: .12, slide: 1.5 }); noise(.02, { t, f: 3000, v: .03 }); }],
  back: ['Close / back: the pop in reverse', t => tone(900, .09, { t, v: .1, slide: .6 })],
  open: ['A panel or card slides open: a bubbly "bloop"', t => tone(330, .12, { t, v: .14, slide: 2.2, slideT: .8 })],
  toggleOn: ['A setting switched on: two notes up', t => { bell(84, t, .07, .25); bell(91, t + .07, .07, .3); }],
  toggleOff: ['A setting switched off: two notes down', t => { bell(91, t, .06, .25); bell(84, t + .07, .06, .3); }],
  coin: ['One coin picked up', t => { tone(1319, .08, { t, v: .09, type: 'square', lp: 4000 }); tone(1976, .22, { t: t + .07, v: .09, type: 'square', lp: 4000 }); }],
  tick: ['Results counter ticking up (pitch rises as it counts)', (t, p = 0) => tone(900 + p * 900, .035, { t, v: .07, type: 'triangle' })],
  countDone: ['Counter reached its number: bright "ding"', t => { bell(88, t, .1, 1.1); bell(95, t + .02, .07, 1.1); }],
  coinsCount: ['Coins counter: tiny coin clinks while counting', (t, p = 0) => tone(1600 + p * 600, .05, { t, v: .05, type: 'square', lp: 5000 })],
  jar: ['Coins drop into the coin jar', t => { [0, .05, .09, .14, .2].forEach((d, i) => tone(1800 + i * 180, .06, { t: t + d, v: .05, type: 'square', lp: 5000 })); }],
  newBest: ['New best score stamp: a happy fanfare', t => { arp([72, 76, 79, 84], .08, (m, tt) => pluck(m, tt, .12, .5), t); bell(88, t + .34, .1, 1.4); }],
  buy: ['Something bought with coins: "ka-ching!"', t => { noise(.06, { t, f: 2500, q: .8, v: .1 }); tone(2093, .5, { t: t + .05, v: .08, type: 'square', lp: 6000 }); tone(2637, .6, { t: t + .1, v: .07, type: 'square', lp: 6000 }); }],
  gemBuy: ['Something bought with Gems: a sparkly rising chime', t => { arp([79, 83, 86, 91, 95], .06, (m, tt) => bell(m, tt, .08, .9), t); noise(.6, { t: t + .1, ft: 'highpass', f: 7000, v: .03, a: .2 }); }],
  gemAsk: ['"Are you sure?" pop-up for Gems', t => { bell(81, t, .08, .5); bell(78, t + .12, .08, .6); }],
  nope: ['Can’t do that (not enough coins, locked): a soft "uh-uh"', t => { tone(300, .12, { t, v: .1, type: 'triangle' }); tone(260, .18, { t: t + .13, v: .1, type: 'triangle' }); }],
  boxShake: ['Mystery Box wiggles on the conveyor: rattle', t => { for (let i = 0; i < 6; i++) noise(.05, { t: t + i * .075, f: 900 + (i % 2) * 500, q: 3, v: .14 }); }],
  boxPop: ['Box bursts open: "pop!" plus a whoosh', t => { tone(160, .18, { t, v: .25, slide: .5 }); noise(.35, { t, f: 600, f2: 6000, q: .7, v: .12 }); }],
  revealC: ['Reveal: Common (2 friendly notes)', t => { pluck(72, t, .13); pluck(79, t + .1, .13, .5); }],
  revealU: ['Reveal: Uncommon (3 notes)', t => arp([72, 76, 79], .09, (m, tt) => pluck(m, tt, .13, .5), t)],
  revealR: ['Reveal: Rare (bells arpeggio)', t => arp([72, 76, 79, 84], .08, (m, tt) => bell(m, tt, .1, 1), t)],
  revealE: ['Reveal: Epic (arpeggio + shimmer)', t => { arp([69, 72, 76, 81, 84, 88], .07, (m, tt) => bell(m, tt, .1, 1.1), t); noise(1, { t: t + .2, ft: 'highpass', f: 6000, v: .04, a: .3 }); }],
  revealL: ['Reveal: Legendary (full fanfare)', t => { [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79, 84]].forEach((ch, i) => ch.forEach(m => tone(mtof(m), i === 3 ? 1.6 : .3, { t: t + i * .16, v: .06, type: 'sawtooth', lp: 2600, wet: .5, hold: i === 3 ? .8 : 0 }))); arp([84, 88, 91, 96], .07, (m, tt) => bell(m, tt, .08, 1.2), t + .5); noise(1.4, { t: t + .5, ft: 'highpass', f: 6500, v: .05, a: .3 }); }],
  spare: ['Duplicate goes to the Spare Shelf: "boop-boop"', t => { tone(523, .1, { t, v: .1, type: 'triangle' }); tone(659, .14, { t: t + .1, v: .1, type: 'triangle' }); }],
  sparkly: ['A Sparkly pull: glitter on top of the reveal', t => { for (let i = 0; i < 10; i++) bell(88 + Math.floor(Math.random() * 12), t + i * .05, .04, .6); }],
  build: ['Renovating a house: 3 hammer knocks…', t => { [0, .18, .36].forEach(d => { tone(140, .09, { t: t + d, v: .22, slide: .6 }); noise(.05, { t: t + d, f: 1800, q: 2, v: .1 }); }); }],
  tada: ['…and the "ta-da!" when it is done', t => { [60, 64, 67, 72].forEach(m => tone(mtof(m), 1, { t, v: .05, type: 'sawtooth', lp: 3000, wet: .5, hold: .25 })); bell(84, t, .08, 1.2); }],
  unlock: ['Something new unlocked: magic chime up', t => arp([76, 79, 83, 88], .07, (m, tt) => bell(m, tt, .09, .8), t)],
  quest: ['Quest finished: "ding-dong"', t => { bell(84, t, .1, .8); bell(79, t + .2, .1, 1); }],
  star: ['A star earned', t => { bell(91, t, .09, .7); noise(.3, { t, ft: 'highpass', f: 8000, v: .03 }); }],
  heart: ['A heart lost in a minigame', t => { tone(520, .14, { t, v: .1, type: 'triangle' }); tone(390, .22, { t: t + .12, v: .1, type: 'triangle' }); }],
  squish: ['Squishing a squishy: a soft squelch', t => noise(.22, { t, f: 700, f2: 260, q: 4, v: .25, a: .015 })],
  boing: ['Squishy bounces back: "boing"', t => { tone(180, .35, { t, v: .16, slide: 2.4, slideT: .25 }); }],
  whoosh: ['Camera flies to a building', t => noise(.4, { t, f: 400, f2: 3000, q: .6, v: .07, a: .15 })],
  wind: ['Story: the Big Grumble Wind', t => { noise(2.6, { t, ft: 'lowpass', f: 300, f2: 1400, q: 1, v: .25, a: .8 }); noise(2.2, { t: t + .6, ft: 'bandpass', f: 900, f2: 500, q: 6, v: .08, a: .6 }); }],
  thunder: ['Story: a far-away rumble (never scary-loud)', t => { noise(1.8, { t, ft: 'lowpass', f: 180, f2: 60, q: .7, v: .5, a: .03 }); }],
  sparkle: ['Magic sparkle (story, Gem Challenge done)', t => { for (let i = 0; i < 7; i++) bell(86 + (i * 5) % 12, t + i * .06, .05, .7); }],
  adStart: ['An ad the player chose is about to play', t => { bell(79, t, .06, .4); bell(84, t + .1, .06, .5); }],
  hello: ['Bao says hi (tutorial guide speaking)', t => { tone(500, .1, { t, v: .12, slide: 1.6, vib: 1 }); tone(760, .14, { t: t + .1, v: .1, slide: .8 }); }]
};
SQS.SFX_LIST = Object.entries(FX).map(([k, v]) => ({ id: k, what: v[0] }));
const last = {};
SQS.play = (name, p) => {
  if (!S.sfx || !FX[name]) return; const c = ctx(); if (!c) return;
  const now = performance.now(); if (name !== 'tick' && name !== 'coinsCount' && last[name] && now - last[name] < 40) return; last[name] = now;
  try { FX[name][1](c.currentTime + .01, p); } catch (e) {}
};
SQS.tone = (f, d, o) => { if (S.sfx && ctx()) tone(f, d, o); };
SQS.noise = (d, o) => { if (S.sfx && ctx()) noise(d, o); };

/* ---------------- background music ----------------
   Every track is a little looping song made from a chord loop, a bass line,
   a melody written from the chords (AABA form, so it is hummable) and soft drums. */
const TRACKS = {
  city:    { name: 'Squishy Island Sunshine', where: 'City map (home screen)', bpm: 96, root: 60, mode: 'maj', prog: [1, 6, 4, 5], lead: 'pluck', pad: true, drums: 'soft', seed: 11 },
  shop:    { name: 'Factory Bounce', where: 'Squishy Factory & Gem Shop', bpm: 112, root: 65, mode: 'maj', prog: [1, 4, 2, 5], lead: 'bell', drums: 'soft', swing: .18, seed: 4 },
  market:  { name: 'Swap Meet Shuffle', where: 'Swap Meet Market', bpm: 104, root: 62, mode: 'maj', prog: [1, 5, 6, 4], lead: 'pluck', drums: 'soft', swing: .2, seed: 23 },
  story:   { name: 'Once Upon a Squish', where: 'Opening story', bpm: 74, root: 57, mode: 'min', prog: [1, 6, 3, 7], lead: 'bell', pad: true, drums: 'none', seed: 7 },
  house:   { name: 'Cosy Corner', where: 'Inside a house (decorating)', bpm: 84, root: 64, mode: 'maj', prog: [1, 3, 4, 4], lead: 'bell', pad: true, drums: 'none', seed: 31 },
  lab:     { name: 'Bubble Lab', where: 'Squishy Testing Facility', bpm: 80, root: 62, mode: 'pent', prog: [1, 4, 1, 5], lead: 'bell', pad: true, drums: 'none', sparse: true, seed: 9 },
  bistro:  { name: 'Hot Bun Hustle', where: 'Bistro Rush', bpm: 124, root: 62, mode: 'maj', prog: [1, 4, 5, 4], lead: 'pluck', drums: 'busy', seed: 3 },
  sky:     { name: 'Up Up and Away', where: 'Sky Bounce', bpm: 128, root: 67, mode: 'maj', prog: [1, 5, 6, 4], lead: 'flute', drums: 'soft', seed: 17 },
  detective: { name: 'Lost Sock Mystery', where: 'Lost & Found', bpm: 100, root: 64, mode: 'min', prog: [1, 4, 6, 5], lead: 'pluck', drums: 'soft', swing: .22, seed: 5 },
  salon:   { name: 'Fluff & Puff', where: 'Style Studio', bpm: 106, root: 70, mode: 'maj', prog: [1, 6, 2, 5], lead: 'bell', drums: 'soft', swing: .15, seed: 29 },
  fire:    { name: 'Splash Splash Hooray', where: 'Bucket Brigade', bpm: 112, root: 60, mode: 'maj', prog: [1, 4, 1, 5], lead: 'flute', drums: 'soft', seed: 13 },
  post:    { name: 'Special Delivery', where: 'Sort-a-Lot', bpm: 118, root: 69, mode: 'maj', prog: [1, 5, 4, 5], lead: 'pluck', drums: 'busy', seed: 21 },
  garden:  { name: 'Sprout Song', where: 'Grow Grow Garden', bpm: 92, root: 65, mode: 'maj', prog: [1, 4, 6, 5], lead: 'flute', pad: true, drums: 'soft', seed: 2 },
  arcade:  { name: 'Brick Party', where: 'Squish Breaker', bpm: 126, root: 64, mode: 'min', prog: [1, 6, 7, 5], lead: 'chip', drums: 'arcade', seed: 19 }
};
SQS.TRACKS = TRACKS;
const SCALES = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10], pent: [0, 2, 4, 7, 9, 12, 14] };
function rng(seed) { let a = seed >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function compose(T) {
  const r = rng(T.seed), sc = SCALES[T.mode === 'pent' ? 'maj' : T.mode];
  const deg = (d, oct = 0) => T.root + sc[((d - 1) % 7 + 7) % 7] + 12 * (oct + Math.floor((d - 1) / 7));
  const chords = T.prog.map(d => [deg(d), deg(d + 2), deg(d + 4)]);
  const RHY = [[1, 0, 1, 0, 1, 0, 1, 0], [1, 0, 1, 1, 1, 0, 0, 0], [1, 1, 1, 0, 1, 0, 1, 0], [1, 0, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0, 1, 1, 1, 0], [1, 0, 0, 0, 1, 0, 1, 1]];
  const sparse = [[1, 0, 0, 0, 1, 0, 0, 0], [1, 0, 0, 0, 0, 0, 1, 0], [0, 0, 1, 0, 1, 0, 0, 0]];
  const pool = T.sparse ? sparse : RHY;
  const allowed = T.mode === 'pent' ? [0, 2, 4, 7, 9] : sc;
  const near = (m, bar) => { // nearest chord tone (strong beats) or scale tone
    const ch = chords[bar % 4]; let best = m, bd = 99; for (let o = -1; o <= 2; o++) ch.forEach(c => { const x = c + 12 * o; if (Math.abs(x - m) < bd) { bd = Math.abs(x - m); best = x; } }); return best; };
  const inScale = m => { const pc = ((m - T.root) % 12 + 12) % 12; if (allowed.includes(pc)) return m; return m + 1; };
  function phrase(start, endOnRoot) {
    const bars = []; let m = start;
    for (let b = 0; b < 4; b++) {
      const rh = pool[Math.floor(r() * pool.length)], notes = [];
      for (let s = 0; s < 8; s++) {
        if (!rh[s]) { notes.push(null); continue; }
        m += [-2, -1, -1, 0, 1, 1, 2, 3, -3][Math.floor(r() * 9)];
        m = Math.max(T.root + 7, Math.min(T.root + 24, m));
        let n = s % 4 === 0 ? near(m, b) : inScale(m);
        if (b === 3 && s >= 4) n = endOnRoot ? near(T.root + 12, 0) : near(m, 3);
        notes.push(n); m = n;
      }
      if (b === 3) { const lastOn = notes.map((x, i) => x != null ? i : -1).filter(i => i >= 0).pop(); notes.forEach((x, i) => { if (i > lastOn) notes[i] = null; }); }
      bars.push(notes);
    }
    return bars;
  }
  const A = phrase(T.root + 12, true), B = phrase(T.root + 16, false);
  return { chords, mel: [...A, ...A, ...B, ...A] };
}
let cur = null, wantTrack = null, duck = 1;
function startTrack(id, offlineMode) {
  const c = offlineMode ? ac : ctx(); if (!c || !TRACKS[id]) return;
  const T = TRACKS[id], song = T.song || (T.song = compose(T));
  const out = c.createGain(); out.gain.setValueAtTime(.0001, c.currentTime); out.gain.linearRampToValueAtTime(1, c.currentTime + 1.5); out.connect(musBus);
  const st = { id, out, step: 0, next: c.currentTime + .1, timer: null };
  const spb = 60 / T.bpm / 2; // seconds per eighth
  const play = st.play = (step, t) => {
    const bar = Math.floor(step / 8) % 16, s = step % 8, ch = song.chords[bar % 4];
    const sw = (s % 2 === 1 && T.swing) ? spb * T.swing : 0; t += sw;
    const o = { bus: 'music', out };
    // bass
    if (s === 0 || s === 4 || (T.drums === 'busy' && s === 6)) tone(mtof(ch[0] - 24 + (s === 4 && T.drums !== 'none' ? 7 : 0)), spb * 3, { ...o, t, v: .2, type: 'triangle', lp: 900 });
    // chords: pad (whole bar) or off-beat plucks
    if (T.pad && s === 0) ch.forEach(m => tone(mtof(m - 12), spb * 8.5, { ...o, t, v: .028, type: 'sawtooth', lp: 1100, a: .5, hold: spb * 6 }));
    if (!T.pad && (s === 2 || s === 6)) ch.forEach(m => tone(mtof(m), spb * 1.2, { ...o, t, v: .03, type: 'triangle', lp: 2400 }));
    // melody
    const n = song.mel[bar][s];
    if (n != null) {
      if (T.lead === 'bell') { tone(mtof(n), spb * 5, { ...o, t, v: .06, wet: .5 }); tone(mtof(n) * 2.76, spb * 2, { ...o, t, v: .015 }); }
      else if (T.lead === 'flute') tone(mtof(n), spb * 1.8, { ...o, t, v: .05, a: .04, vib: 1, hold: spb, wet: .4 });
      else if (T.lead === 'chip') tone(mtof(n), spb * 1.1, { ...o, t, v: .035, type: 'square', lp: 3000, hold: spb * .6 });
      else pluck(n, t, .07, spb * 3, out);
    }
    // drums
    if (T.drums === 'soft' || T.drums === 'busy' || T.drums === 'arcade') {
      if (s === 0 || (T.drums !== 'soft' && s === 4)) tone(110, .16, { ...o, t, v: .22, slide: .45 });
      if (s === 4 || (T.drums === 'soft' && s === 0 && bar % 2)) noise(.09, { ...o, t, f: T.drums === 'arcade' ? 1800 : 1400, q: .8, v: .05 });
      if (s % 2 === 1 || T.drums === 'busy') noise(.03, { ...o, t, ft: 'highpass', f: 7000, v: T.drums === 'arcade' ? .03 : .02 });
    }
  };
  const loop = () => {
    while (st.next < c.currentTime + .3) { play(st.step, st.next); st.step++; st.next += spb; }
  };
  if (offlineMode) { out.gain.cancelScheduledValues(0); out.gain.value = 1; return st; }
  st.timer = setInterval(loop, 60); loop(); cur = st;
}
function stopTrack(ms = 600) {
  if (!cur || !ac) { cur = null; return; } const st = cur; cur = null;
  st.out.gain.cancelScheduledValues(ac.currentTime); st.out.gain.setTargetAtTime(.0001, ac.currentTime, ms / 3000);
  setTimeout(() => { clearInterval(st.timer); try { st.out.disconnect(); } catch (e) {} }, ms + 400);
}
SQS.music = id => {
  wantTrack = id || null;
  if (cur && cur.id === id) return;
  stopTrack();
  if (id && ac && ac.state !== 'closed' && S.music) startTrack(id);
};
SQS.onChange(() => { if (!S.music && cur) stopTrack(300); else if (S.music && wantTrack && !cur && ac) startTrack(wantTrack); });
SQS.musicNow = () => cur ? cur.id : null;
SQS.duck = on => { duck = on ? .35 : 1; apply(); };
})();
