/* =====================================================================
   SQUISHVILLE ART KIT  ·  art/kit.js
   Shared drawing helpers + the code that fills every page with pictures.
   You rarely need to edit this file.
   - To change a building or a squishy family, edit  art/<id>.js
   - To change the words on a page, edit  <id>.html
   ===================================================================== */
(function () {
'use strict';
const SQ = window.SQ = {};
const KIT_SRC = (document.currentScript && document.currentScript.src) || 'art/kit.js';
const DIR = KIT_SRC.replace(/kit\.js(\?.*)?$/, '');

SQ.HOUSES = ['dumpling', 'kitchen', 'pets', 'sweets', 'fruit', 'ocean', 'sky', 'forest'];
SQ.CIVIC = ['restaurant', 'playground', 'police', 'salon', 'fire', 'post', 'bandstand', 'greenhouse', 'arcade', 'testlab', 'factory', 'market', 'gemmine'];
SQ.MODULES = SQ.HOUSES.concat(SQ.CIVIC);
SQ.B = {};   // buildings by id
SQ.SQ = {};  // squishies by id
SQ.reg = function (id, d) {
  d.id = id; SQ.B[id] = d;
  (d.squishies || []).forEach((q, i) => { q.family = id; q.i = i; SQ.SQ[q.id] = q; });
};

/* ---------- colour ---------- */
function hex(c) { c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); const v = parseInt(c, 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
function mix(a, b, t) { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
const dk = (c, t = .42) => mix(c, '#3b2440', t), lt = (c, t = .45) => mix(c, '#ffffff', t);
SQ.mix = mix; SQ.dk = dk; SQ.lt = lt;

/* ---------- rarity rules (also used by the Factory + Market pages) ---------- */
SQ.RARITY = {
  C: { name: 'Common', color: '#8E9BB0', odds: 55, value: 1 },
  U: { name: 'Uncommon', color: '#2FB673', odds: 25, value: 3 },
  R: { name: 'Rare', color: '#3B82F6', odds: 13, value: 8 },
  E: { name: 'Epic', color: '#9B5CF6', odds: 6, value: 20 },
  L: { name: 'Legendary', color: '#F59E0B', odds: 1, value: 60 }
};

/* ---------- drawing primitives ---------- */
const K = SQ.K = {};
const n = v => Math.round(v * 10) / 10;
K.n = n; K.dk = dk; K.lt = lt; K.mix = mix;
K.P = (d, f, sw = 2.2, s) => `<path d="${d}" fill="${f}" stroke="${s || dk(f)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
K.E = (cx, cy, rx, ry, f, sw = 2.2, s) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${f}" stroke="${s || dk(f)}" stroke-width="${sw}"/>`;
K.C = (cx, cy, r, f, sw, s) => K.E(cx, cy, r, r, f, sw, s);
K.R = (x, y, w, h, f, rx = 0, sw = 2.2, s) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${rx}" fill="${f}" stroke="${s || dk(f)}" stroke-width="${sw}"/>`;
K.F = (d, f, op = 1) => `<path d="${d}" fill="${f}"${op < 1 ? ` opacity="${op}"` : ''}/>`;
K.L = (d, c, w = 2) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
K.sh = (cx, cy, rx, ry, rot = -25) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="#fff" opacity=".5" transform="rotate(${rot} ${n(cx)} ${n(cy)})"/>`;
K.blobs = (arr, f, sw = 2.2, s) => { const st = s || dk(f); return arr.map(([x, y, r]) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${st}" stroke="${st}" stroke-width="${sw * 2}"/>`).join('') + arr.map(([x, y, r]) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${f}"/>`).join(''); };
K.T = (x, y, t, size = 12, fill = '#2B2141', extra = '') => `<text x="${x}" y="${y}" font-family="'Bagel Fat One',system-ui,sans-serif" font-size="${size}" fill="${fill}" text-anchor="middle" ${extra}>${t}</text>`;
K.Tb = (x, y, t, size = 10, fill = '#2B2141', anchor = 'middle') => `<text x="${x}" y="${y}" font-family="Nunito,system-ui,sans-serif" font-weight="900" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${t}</text>`;
let uid = 0; K.uid = () => 'q' + (++uid);
K.item = n => `<g data-item="${n}">`; K.itemEnd = () => '</g>';
K.star = (cx, cy, R, r, f, sw = 2, s) => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; p += (i ? 'L' : 'M') + n(cx + rr * Math.cos(a)) + ' ' + n(cy + rr * Math.sin(a)); } return K.P(p + 'Z', f, sw, s); };
K.bumpy = (cx, cy, r, bumps, amp) => { let p = ''; const N = bumps * 2; for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, rr = r + (i % 2 ? amp : -amp * .3); const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a); p += (i ? 'L' : 'M') + n(x) + ' ' + n(y); } return p + 'Z'; };

let fc = 0, sc = 0;
/* kawaii face: eyes, blush, mouth.  o.eyes: 'happy'|'sleep'  o.mouth: 'o'|'w'|'open'|'none' */
K.face = function (x, y, s = 1, o = {}) {
  const ink = o.ink || '#3A2740', d = ((fc++) * .77 % 4).toFixed(2), ex = (o.gap || 8) * s, er = 3.1 * s, sw = n(1.9 * s);
  let eyes;
  if (o.eyes === 'happy') eyes = [-1, 1].map(k => `<path d="M${n(x + k * ex - 3.4 * s)} ${n(y + 1.2 * s)} q${n(3.4 * s)} ${n(-5 * s)} ${n(6.8 * s)} 0" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>`).join('');
  else if (o.eyes === 'sleep') eyes = [-1, 1].map(k => `<path d="M${n(x + k * ex - 3.4 * s)} ${n(y - .5 * s)} q${n(3.4 * s)} ${n(3.6 * s)} ${n(6.8 * s)} 0" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>`).join('');
  else eyes = `<g class="eyes" style="animation-delay:-${d}s">` + [-1, 1].map(k => `<circle cx="${n(x + k * ex)}" cy="${n(y)}" r="${n(er)}" fill="${ink}"/><circle cx="${n(x + k * ex + 1.1 * s)}" cy="${n(y - 1.2 * s)}" r="${n(1.1 * s)}" fill="#fff"/>`).join('') + `</g>`;
  const bl = o.blush === false ? '' : [-1, 1].map(k => `<ellipse cx="${n(x + k * (ex + 5.5 * s))}" cy="${n(y + 4.6 * s)}" rx="${n(3.6 * s)}" ry="${n(2.2 * s)}" fill="${o.bc || '#FF6F9C'}" opacity=".45"/>`).join('');
  const my = y + (o.my || 4) * s; let m = '';
  switch (o.mouth) {
    case 'o': m = `<ellipse cx="${n(x)}" cy="${n(my + s)}" rx="${n(1.9 * s)}" ry="${n(2.3 * s)}" fill="#8A2E4A"/>`; break;
    case 'w': m = `<path d="M${n(x - 4 * s)} ${n(my)} q${n(2 * s)} ${n(2.8 * s)} ${n(4 * s)} 0 q${n(2 * s)} ${n(2.8 * s)} ${n(4 * s)} 0" fill="none" stroke="${ink}" stroke-width="${n(1.4 * s)}" stroke-linecap="round"/>`; break;
    case 'open': m = `<path d="M${n(x - 3.6 * s)} ${n(my - .4 * s)} q${n(3.6 * s)} ${n(6 * s)} ${n(7.2 * s)} 0Z" fill="#8A2E4A" stroke="${ink}" stroke-width="${n(1 * s)}" stroke-linejoin="round"/>`; break;
    case 'none': break;
    default: m = `<path d="M${n(x - 3 * s)} ${n(my)} q${n(3 * s)} ${n(3.4 * s)} ${n(6 * s)} 0" fill="none" stroke="${ink}" stroke-width="${n(1.5 * s)}" stroke-linecap="round"/>`;
  }
  return eyes + bl + m;
};
K.spark = (x, y, s = 1, c = '#FFD54A') => `<g transform="translate(${n(x)} ${n(y)}) scale(${s})"><path class="a-twinkle" style="animation-delay:-${((sc++) * .53 % 2.2).toFixed(2)}s" d="M0 -7 Q1.2 -1.2 7 0 Q1.2 1.2 0 7 Q-1.2 1.2 -7 0 Q-1.2 -1.2 0 -7Z" fill="${c}" stroke="#fff" stroke-width=".8"/></g>`;
K.smoke = (x, y, c = '#FFFFFF') => [0, 1, 2].map(i => `<circle class="a-smoke" style="animation-delay:-${i}s" cx="${x}" cy="${y}" r="6" fill="${c}" opacity=".85"/>`).join('');
K.zz = (x, y) => [0, 1].map(i => `<text class="a-z" style="animation-delay:-${i * 1.5}s" x="${x}" y="${y}" font-family="Nunito,sans-serif" font-weight="900" font-size="${8 - i * 2}" fill="#7C6FB0">z</text>`).join('');

/* ---------- props ---------- */
K.tree = (x, y, s = 1, c = '#69C46A') => `<g transform="translate(${x} ${y}) scale(${s})">${K.R(-4, -24, 8, 24, '#A0714A', 2, 2)}${K.blobs([[0, -42, 18], [-13, -30, 12], [13, -30, 12], [0, -26, 12]], c)}${K.sh(-6, -50, 6, 3)}</g>`;
K.pine = (x, y, s = 1, c = '#4FAF72') => `<g transform="translate(${x} ${y}) scale(${s})">${K.R(-3, -10, 6, 10, '#A0714A', 1, 1.6)}${K.P('M-16 -10 L0 -34 L16 -10Z', c, 2)}${K.P('M-12 -26 L0 -48 L12 -26Z', c, 2)}</g>`;
K.bush = (x, y, r = 9, c = '#6CC56B') => K.blobs([[x - r * .6, y - r * .6, r * .7], [x + r * .6, y - r * .6, r * .7], [x, y - r, r * .8]], c, 1.8);
K.flower = (x, y, c = '#FF7AA8') => `${K.L(`M${x} ${y} V${y - 8}`, '#4E9B4E', 1.4)}${[0, 72, 144, 216, 288].map(a => `<circle cx="${n(x + 3 * Math.cos(a * Math.PI / 180))}" cy="${n(y - 10 + 3 * Math.sin(a * Math.PI / 180))}" r="2.4" fill="${c}"/>`).join('')}<circle cx="${x}" cy="${y - 10}" r="1.8" fill="#FFE27A"/>`;
K.flowers = (x, y, w, cols = ['#FF7AA8', '#FFD54A', '#B48CFF', '#FF8A5C']) => { let s = ''; for (let i = 0; i * 7 <= w; i++) s += K.flower(x + i * 7, y + (i % 2), cols[i % cols.length]); return s; };
K.fence = (x1, x2, y, c = '#FFFFFF') => { let s = K.R(x1, y - 11, x2 - x1, 3, c, 1, 1.1) + K.R(x1, y - 5, x2 - x1, 3, c, 1, 1.1); for (let x = x1 + 2; x < x2 - 3; x += 7) s += K.P(`M${x} ${y} V${y - 14} l2.5 -3 l2.5 3 V${y}Z`, c, 1.1); return s; };
K.mailbox = (x, y, c = '#FF6F7D') => `${K.R(x - 1.5, y - 16, 3, 16, '#8A6A4E', 1, 1.2)}${K.P(`M${x - 7} ${y - 16} V${y - 24} Q${x - 7} ${y - 29} ${x} ${y - 29} Q${x + 7} ${y - 29} ${x + 7} ${y - 24} V${y - 16}Z`, c, 1.6)}${K.R(x + 6, y - 31, 1.6, 9, '#FFD54A', 0, .8)}${K.R(x + 6, y - 31, 5, 3.5, '#FFD54A', 0, .8)}`;
K.lamp = (x, y, on) => `${K.R(x - 1.5, y - 36, 3, 36, '#5A5170', 1, 1.2)}${K.R(x - 4, y - 3, 8, 3, '#5A5170', 1, 1)}${on ? `<circle class="a-glow" cx="${x}" cy="${y - 38}" r="10" fill="#FFE58A" opacity=".45"/>` : ''}${K.E(x, y - 38, 4.5, 5, on ? '#FFE58A' : '#E8E4EF', 1.4, '#5A5170')}${K.P(`M${x - 6} ${y - 42} L${x} ${y - 47} L${x + 6} ${y - 42}Z`, '#5A5170', 1)}`;
K.bench = (x, y, c = '#C98A55') => `${K.R(x - 14, y - 15, 28, 4, c, 1, 1.2)}${K.R(x - 14, y - 9, 28, 4, c, 1, 1.2)}${K.L(`M${x - 11} ${y - 5} V${y} M${x + 11} ${y - 5} V${y}`, '#5A5170', 2)}`;
K.weed = (x, y) => K.L(`M${x} ${y} q-2 -6 -5 -9 M${x} ${y} q0 -8 1 -11 M${x} ${y} q3 -5 6 -7`, '#7C8B4A', 1.6);
K.tire = (x, y) => `${K.E(x, y - 5, 9, 5, '#3E3A44', 1.5, '#26232b')}${K.E(x, y - 5, 4, 2, '#A39A8C', 1, '#26232b')}`;
K.cone = (x, y) => `${K.P(`M${x - 5} ${y} L${x - 1.5} ${y - 14} H${x + 1.5} L${x + 5} ${y}Z`, '#FF8A3D', 1.2)}<rect x="${x - 3.4}" y="${y - 8}" width="6.8" height="2.4" fill="#fff"/>${K.R(x - 7, y - 2, 14, 2.5, '#FF8A3D', 1, 1)}`;
K.ladder = (x, y, h = 60) => `<g transform="rotate(14 ${x} ${y})">${K.L(`M${x - 6} ${y} V${y - h} M${x + 6} ${y} V${y - h}`, '#B98B5C', 2.6)}${Array.from({ length: Math.floor(h / 10) }, (_, i) => K.L(`M${x - 6} ${y - 6 - i * 10} H${x + 6}`, '#B98B5C', 2)).join('')}</g>`;
K.bucket = (x, y, c) => `${K.P(`M${x - 6} ${y - 11} L${x - 5} ${y} H${x + 5} L${x + 6} ${y - 11}Z`, '#C9CFD8', 1.4)}${K.E(x, y - 11, 6, 2, c, 1)}${K.L(`M${x - 6} ${y - 11} Q${x} ${y - 20} ${x + 6} ${y - 11}`, '#7d8590', 1)}${K.L(`M${x - 4} ${y - 10} v5`, c, 2)}`;
K.planks = (x, y) => `${K.R(x - 14, y - 4, 28, 4, '#C49A6C', 1, 1.2)}${K.R(x - 12, y - 8, 26, 4, '#B38A5C', 1, 1.2)}<g transform="rotate(-18 ${x} ${y})">${K.R(x - 10, y - 12, 24, 3.5, '#C49A6C', 1, 1.2)}</g>`;
K.web = (x, y) => K.L(`M${x} ${y} l16 0 M${x} ${y} l0 16 M${x} ${y} l12 12 M${x + 6} ${y} q2 4 0 6 q4 2 6 0 M${x + 12} ${y} q3 7 0 12 q7 3 12 0`, '#FFFFFF', .8);
K.sunbed = (x, y, w = 34, c = '#6CC8EA') => { const a = x - w / 2, b = x + w / 2, d = `M${a} ${y - 8} H${n(a + w * .7)} L${b} ${y - 17}`; return `${K.L(`M${a + 4} ${y} l2 -7 M${b - 6} ${y} l-2 -7`, '#9B7451', 2)}<path d="${d}" fill="none" stroke="${dk(c, .3)}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="4.6" stroke-dasharray="3 4"/>`; };
K.mower = () => `${K.L('M58 60 L86 74', '#5A5170', 4)}${K.R(78, 68, 36, 18, '#FF5E6C', 7, 2)}${K.R(84, 63, 20, 7, '#FFD54A', 3, 1.5)}${K.C(84, 88, 6, '#4A4458', 2)}${K.C(108, 88, 6, '#4A4458', 2)}`;
K.bowl = (cx, cy, rx, liq = '#F6C25E', c = '#FFFFFF', deco = '#E55B5B') => { const ry = rx * .3; return {
  back: `${K.E(cx, cy, rx, ry, mix(c, '#d8cfe0', .5), 2, dk(c))}${K.E(cx, cy + 1, rx - 3, ry - 1.5, liq, 1.2)}`,
  front: `${K.P(`M${cx - rx} ${cy} Q${cx - rx + 1} ${n(cy + rx * .85)} ${cx} ${n(cy + rx * .85)} Q${cx + rx - 1} ${n(cy + rx * .85)} ${cx + rx} ${cy} Q${cx} ${n(cy + ry * 1.6)} ${cx - rx} ${cy}Z`, c, 2)}${K.L(`M${n(cx - rx * .7)} ${n(cy + rx * .42)} Q${cx} ${n(cy + rx * .6)} ${n(cx + rx * .7)} ${n(cy + rx * .42)}`, deco, 2)}` }; };
K.puddle = (cx, cy, rx, c = '#9ED8F5') => K.E(cx, cy, rx, rx * .26, c, 1.4);
K.towel = (cx, cy, w, c1, c2) => `${K.R(cx - w / 2, cy - 4, w, 7, c1, 3, 1.4)}<rect x="${n(cx - w / 2 + w * .2)}" y="${cy - 3.4}" width="${n(w * .14)}" height="5.8" fill="${c2}"/><rect x="${n(cx - w / 2 + w * .6)}" y="${cy - 3.4}" width="${n(w * .14)}" height="5.8" fill="${c2}"/>`;
K.letter = (x = 76, y = 54, r = -12) => `<g transform="rotate(${r} ${x} ${y})">${K.R(x - 13, y - 9, 26, 18, '#FFFFFF', 2, 1.8, '#9A8FAA')}${K.L(`M${x - 13} ${y - 9} L${x} ${y + 2} L${x + 13} ${y - 9}`, '#9A8FAA', 1.6)}${K.C(x, y + 1, 2.5, '#FF6F9C', .8)}</g>`;
K.medal = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.C(0, 0, 9, '#FFD54A', 2, '#C98A12')}${K.star(0, 0, 6, 2.6, '#FFF3B0', 1, '#C98A12')}</g>`;
K.tag = (x, y, num) => `<g>${K.C(x, y, 11, '#FF6FA3', 2.5, '#2B2141')}<text x="${x}" y="${y + 4.5}" font-family="Nunito,system-ui,sans-serif" font-weight="900" font-size="13" fill="#fff" text-anchor="middle">${num}</text></g>`;
K.flag = (x, y, c = '#FF6FA3', h = 26) => `${K.L(`M${x} ${y} V${y - h}`, '#5A5170', 1.6)}<g transform="translate(${x} ${y - h})"><path class="a-flag" d="M0 0 h14 l-4 4.5 l4 4.5 h-14z" fill="${c}" stroke="${dk(c)}" stroke-width="1"/></g>`;
K.lantern = (x, y, c = '#EF4E4A', glow) => `${K.L(`M${x} ${y - 11} V${y - 7}`, '#6b4a3a', 1.2)}${glow ? `<circle class="a-glow" cx="${x}" cy="${y}" r="11" fill="#FFE58A" opacity=".4"/>` : ''}${K.R(x - 3, y - 8, 6, 2.5, '#FFC94D', 1, 1)}${K.E(x, y, 5.5, 7, c, 1.4)}${K.R(x - 3, y + 6, 6, 2.5, '#FFC94D', 1, 1)}`;
K.lights = (x1, y1, cx, cy, x2, y2, count = 8, cols = ['#FF6F9C', '#FFD54A', '#6FD3FF', '#8BE07A']) => {
  let s = K.L(`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`, '#5b4a5a', 1);
  for (let i = 1; i < count; i++) { const t = i / count, mt = 1 - t, x = mt * mt * x1 + 2 * mt * t * cx + t * t * x2, y = mt * mt * y1 + 2 * mt * t * cy + t * t * y2; s += `<circle class="a-glow" style="animation-delay:-${(i * .3).toFixed(1)}s" cx="${n(x)}" cy="${n(y + 2.5)}" r="2.6" fill="${cols[i % cols.length]}"/>`; }
  return s;
};
K.pot = (x, y, c = '#D9824F', plant = '#6CC56B') => `${K.bush(x, y - 7, 6, plant)}${K.P(`M${x - 6} ${y - 8} H${x + 6} L${x + 4.5} ${y} H${x - 4.5}Z`, c, 1.4)}`;
K.awning = (x, y, w, h, cols) => { const k = Math.max(3, Math.round(w / 10)), sw = w / k; let s = ''; for (let i = 0; i < k; i++) { const xx = x + i * sw; s += `<path d="M${n(xx)} ${y} H${n(xx + sw)} V${y + h} Q${n(xx + sw / 2)} ${y + h + 5} ${n(xx)} ${y + h}Z" fill="${cols[i % 2]}" stroke="${dk(cols[0])}" stroke-width="1.2" stroke-linejoin="round"/>`; } return s; };

/* place a squishy at ground point (x,y) at scale s with an idle animation.
   o.back / o.front: extra svg drawn behind / in front.  o.inner: svg drawn in the
   squishy's own 100x100 space (moves with it).  o.clip: [x,y,w,h] window clip.  o.mood: face options */
K.place = function (id, x, y, s = .3, a = 'bob', o = {}) {
  const q = SQ.SQ[id]; if (!q) return '';
  let g = `<g data-keep="1" transform="translate(${n(x - 50 * s)} ${n(y - 90 * s)}) scale(${s})"><g class="a-${a}" style="animation-delay:-${(q.i * .61 + (x % 7) * .21).toFixed(2)}s">${o.innerBack || ''}${q.art(K, o.mood || {})}${o.inner || ''}</g></g>`;
  if (o.clip) { const [cx, cy, cw, ch] = o.clip, id2 = K.uid(); g = `<clipPath id="${id2}"><rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="3"/></clipPath><g clip-path="url(#${id2})">${g}</g>`; }
  return (o.back || '') + g + (o.front || '');
};
SQ.sqSvg = (id, mood) => { const q = SQ.SQ[id]; if (!q) return ''; return `<svg viewBox="0 0 100 100" class="sq-art" role="img" aria-label="${q.name}"><ellipse cx="50" cy="91" rx="27" ry="4.5" fill="#2B2141" opacity=".12"/><g class="a-squish" style="animation-delay:-${(q.i * .37).toFixed(2)}s">${q.art(K, mood || {})}</g></svg>`; };

/* ---------- building context: everything that changes with level ---------- */
function mkctx(d, L, civ) {
  const Lw = civ ? (L >= 8 ? 9 : 6) : L;
  const c = { L, Lw, civ, d };
  c.c = (col, need = 4) => L >= need ? col : mix(col, '#A39A8C', Math.min(.75, .32 + (need - L) * .14));
  c.win = (x, y, w, h, o = {}) => {
    const r = o.r, fr = o.frame || '#FFF8EC';
    const sh = (f, sw, st) => r ? K.E(x + w / 2, y + h / 2, w / 2, h / 2, f, sw, st) : K.R(x, y, w, h, f, o.rx ?? 3, sw, st);
    let s;
    if (Lw <= 2) {
      s = sh('#4B4152', 2.6, mix(fr, '#7d6f62', .6));
      s += `<g transform="rotate(-14 ${x + w / 2} ${y + h / 2})">${K.R(x - 3, y + h * .26, w + 6, h * .2, '#B08A5E', 1, 1.4)}</g><g transform="rotate(11 ${x + w / 2} ${y + h / 2})">${K.R(x - 3, y + h * .58, w + 6, h * .2, '#A07A50', 1, 1.4)}</g>`;
      return s;
    }
    const glass = Lw <= 4 ? '#C9D6DA' : (Lw >= 9 ? '#FFE4A0' : '#BFE6F7');
    s = sh(glass, 2.6, dk(c.c(fr, 5), .3));
    if (Lw <= 4) s += K.L(`M${n(x + w * .3)} ${y + 2} l${n(w * .15)} ${n(h * .3)} l${n(-w * .1)} ${n(h * .2)} l${n(w * .2)} ${n(h * .3)}`, '#7d8a90', 1.2);
    else {
      const cu = o.cur || d.cur || '#FF9EC0';
      if (!r) s += `<path d="M${x + 1.5} ${y + 1.5} h${n(w * .32)} q${n(-w * .12)} ${n(h * .5)} ${n(-w * .32)} ${n(h * .75)}Z" fill="${cu}"/><path d="M${x + w - 1.5} ${y + 1.5} h${n(-w * .32)} q${n(w * .12)} ${n(h * .5)} ${n(w * .32)} ${n(h * .75)}Z" fill="${cu}"/>`;
      else s += K.L(`M${x + w / 2} ${y + 2} V${y + h - 2} M${x + 2} ${y + h / 2} H${x + w - 2}`, fr, 1.6);
      s += K.sh(x + w * .7, y + h * .3, Math.max(1.5, w * .07), h * .16, 20);
    }
    if (!r && !o.noSill) s += K.R(x - 3, y + h, w + 6, 4, c.c(fr, 5), 1.5, 1.2);
    if (Lw >= 7 && !civ && !r && !o.noBox) s += K.R(x, y + h + 4, w, 5, '#B5764A', 1, 1.1) + [.2, .5, .8].map((t, i) => `<circle cx="${n(x + w * t)}" cy="${y + h + 3}" r="2.4" fill="${['#FF7AA8', '#FFD54A', '#B48CFF'][i]}"/>`).join('');
    return s;
  };
  c.door = (x, y, w, h, col, o = {}) => {
    const arch = o.arch !== false;
    const p = arch ? `M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h}Z` : `M${x} ${y + h} V${y} H${x + w} V${y + h}Z`;
    if (Lw <= 5) {
      const old = '#9C8B78';
      return K.P(p, '#3E3446', 2) + `<g transform="rotate(${Lw <= 2 ? 5 : 2} ${x} ${y + h})">${K.P(p, old, 2)}${K.L(`M${n(x + w * .33)} ${y + 6} V${y + h} M${n(x + w * .66)} ${y + 6} V${y + h}`, dk(old, .25), 1.2)}</g>`;
    }
    let s = K.P(p, col, 2.2);
    s += K.C(x + w * .5, y + (arch ? w * .5 : h * .25), Math.min(w * .2, 6), '#BFE6F7', 1.4);
    s += K.C(x + w * .8, y + h * .58, 1.8, '#FFD54A', 1);
    s += K.R(x - 3, y + h - 1, w + 6, 4, '#E9A23B', 1, 1);
    if (Lw >= 9 && !o.noLamp) s += `<circle class="a-glow" cx="${x + w + 7}" cy="${n(y + h * .35)}" r="7" fill="#FFE58A" opacity=".45"/>` + K.C(x + w + 7, y + h * .35, 2.8, '#FFE58A', 1.2, '#7a6040');
    return s;
  };
  c.crack = (x, y, s = 1) => L > 3 ? '' : K.L(`M${x} ${y} l${4 * s} ${6 * s} l${-3 * s} ${5 * s} l${5 * s} ${7 * s} M${x + 4 * s} ${y + 6 * s} l${6 * s} ${-2 * s}`, '#6E6370', 1.4);
  return c;
}

/* ---------- yards ---------- */
function yardBack(d, L, civ) {
  let s = `<rect x="-2" y="196" width="244" height="26" fill="${L <= 2 && !civ ? '#B8C78F' : '#9ED67E'}"/>`;
  if (!civ) {
    if (L <= 2) s += `<ellipse cx="70" cy="204" rx="26" ry="4" fill="#C9B48C"/><ellipse cx="176" cy="206" rx="20" ry="3" fill="#C9B48C"/>`;
    if (L >= 7) s += K.fence(-2, 54, 199, d.fence || '#FFFFFF') + K.fence(186, 242, 199, d.fence || '#FFFFFF');
  } else if (L >= 8) s += K.fence(-2, 40, 199, d.fence || '#FFFFFF') + K.fence(200, 242, 199, d.fence || '#FFFFFF');
  return s;
}
function yardFront(d, L, civ, g) {
  let s = '';
  if (!civ) {
    const dx = d.doorX || 120;
    if (L === 1) s += `<g transform="rotate(-10 30 200)">${K.fence(4, 34, 201, '#B3ADA4')}</g>` + K.weed(16, 202) + K.weed(46, 203) + K.weed(198, 202) + K.weed(230, 203) + K.tire(214, 205) + (d.web ? K.web(d.web[0], d.web[1]) : '');
    if (L === 2) s += K.planks(212, 204) + K.cone(30, 204) + K.weed(46, 203);
    if (L >= 2 && L <= 3) s += K.ladder(d.ladder || 186, 202, 64);
    if (L >= 3 && L <= 4) s += K.bucket(d.bucket || 48, 204, d.paint || '#FF6FA3');
    if (L === 5) s += K.pot(dx + 24, 202);
    if (L >= 6 && d.mail !== false) s += K.mailbox(d.mail || 204, 204, d.trim || '#FF6F7D');
    if (L >= 7) (d.fl || [60, 68, 172, 180]).forEach((x, i) => s += K.flower(x, 203, ['#FF7AA8', '#FFD54A', '#B48CFF', '#FF8A5C'][i % 4]));
    if (L >= 7) s += `<ellipse cx="${dx}" cy="207" rx="7" ry="2.2" fill="#ECE5DA" stroke="#C9BFB0"/><ellipse cx="${dx - 2}" cy="213" rx="7" ry="2.2" fill="#ECE5DA" stroke="#C9BFB0"/><ellipse cx="${dx + 1}" cy="219" rx="7" ry="2.2" fill="#ECE5DA" stroke="#C9BFB0"/>`;
    if (L >= 8) s += K.bush((d.bx || [54, 186])[0], 204, 7) + K.bush((d.bx || [54, 186])[1], 204, 7);
    if (L >= 9 && d.smoke) s += K.smoke(d.smoke[0], d.smoke[1]);
    if (L >= 10) s += (d.star ? K.medal(d.star[0], d.star[1]) : '') + K.spark(14, 120) + K.spark(226, 96, .8) + K.spark(52, 30, .7) + K.spark(194, 34, .9) + K.spark(232, 160, .6);
  } else {
    const pw = g ? g.doorW : 28;
    if (L >= 2 && L < 3 && !d.noPots) s += K.pot(56, 202) + K.pot(184, 202);
    if (L >= 3 && !d.noPots) s += K.pot(120 - pw / 2 - 8, 202, '#D9824F', '#7BCB6C') + K.pot(120 + pw / 2 + 8, 202, '#D9824F', '#7BCB6C');
    if (L >= 4 && d.bench !== false) s += K.bench(d.bench || 22, 204);
    if (L >= 6) s += K.lamp(6, 204, L >= 8) + K.lamp(234, 204, L >= 8);
    if (L >= 8) s += K.flowers(12, 205, 28) + K.flowers(196, 205, 28);
    if (L >= 10) s += K.spark(18, 110) + K.spark(222, 90, .8) + K.spark(40, 30, .7) + K.spark(200, 26, .9);
  }
  return s;
}

/* ---------- empty lot (fun buildings, level 0) ---------- */
function lot(d) {
  return `<rect x="-2" y="196" width="244" height="26" fill="#9ED67E"/>
  <path d="M26 202 L50 172 H190 L214 202Z" fill="#D9BE93" stroke="#B89A6E" stroke-width="2" stroke-dasharray="6 5"/>
  ${K.E(80, 186, 14, 5, '#C9A97A', 1.4)}${K.E(160, 190, 10, 4, '#C9A97A', 1.4)}
  ${K.cone(42, 204)}${K.cone(198, 204)}${K.planks(170, 196)}
  ${K.R(116, 132, 8, 70, '#A7794E', 2, 2)}${K.R(78, 100, 84, 46, '#FFF4DC', 8, 2.6, '#A7794E')}
  ${d.icon ? d.icon(K, 98, 123, .9) : ''}${K.T(135, 121, 'BUILD', 10, '#A7794E')}${K.T(135, 135, 'ME!', 11, '#FF6FA3')}`;
}

/* ---------- generic fun-building body (kiosk at Lv1–2, then grows) ---------- */
function roofShape(style, x, top, w, col) {
  switch (style) {
    case 'gable': return K.P(`M${x - 10} ${top} L120 ${top - 40} L${x + w + 10} ${top}Z`, col, 2.4);
    case 'dome': return K.P(`M${x + 6} ${top} Q120 ${top - 70} ${x + w - 6} ${top}Z`, col, 2.4);
    case 'mansard': return K.P(`M${x - 6} ${top} L${x + 16} ${top - 28} H${x + w - 16} L${x + w + 6} ${top}Z`, col, 2.4);
    default: return '';
  }
}
function civicBody(K, c, d) {
  const L = c.L, wall = d.wall, roof = d.roof, trim = d.trim || '#FFFFFF', awn = d.awn || [roof, '#FFFFFF'];
  let s = '';
  if (L <= 2) {
    s += K.L('M82 152 V112 M158 152 V112', '#8A6A4E', 3);
    s += K.R(76, 150, 88, 50, wall, 5) + K.R(72, 146, 96, 8, trim, 3, 1.6);
    s += K.awning(70, 104, 100, 16, awn);
    s += K.R(100, 160, 40, 30, '#FFFFFF', 6, 1.6) + (d.icon ? d.icon(K, 120, 175, .75) : '');
    if (L === 2) s += K.P('M40 202 L48 170 H66 L74 202', '#8A6A4E', 1.6) + K.R(46, 172, 24, 18, '#3D4B45', 2, 1.4) + K.L('M51 178 h12 M51 183 h9', '#FFFFFF', 1.2) + K.pot(186, 202);
    return s;
  }
  const w = L >= 5 ? 164 : 132, x = 120 - w / 2, fl = L >= 6 ? 2 : 1, fh = 58, top = 200 - fl * fh;
  const doorW = d.garage ? 60 : 28, g = { x, w, top, fh, fl, doorW };
  s += d.behind ? d.behind(K, L, g) : '';
  s += roofShape(d.roofStyle, x, top, w, roof);
  s += K.R(x, top, w, fl * fh, wall, 3);
  if (fl === 2) s += K.R(x - 3, 200 - fh - 4, w + 6, 6, trim, 2, 1.6);
  s += K.R(x - 5, top - 5, w + 10, 8, trim, 3, 1.8);
  if (d.garage) {
    const gx = 120 - doorW / 2;
    s += K.R(gx, 152, doorW, 48, d.door || '#F4F1F8', 4, 2.2) + [0, 1, 2, 3, 4].map(i => K.L(`M${gx + 3} ${160 + i * 8} H${gx + doorW - 3}`, '#C8C0D6', 1.4)).join('') + K.R(gx + 6, 158, doorW - 12, 8, '#BFE6F7', 2, 1.2);
  } else s += c.door(120 - 14, 156, 28, 44, d.door || roof, { arch: d.archDoor === true });
  const gw = L >= 5 ? 40 : 28, gy = 158;
  s += c.win(x + 10, gy, gw, 28, { noBox: 1 }) + c.win(x + w - 10 - gw, gy, gw, 28, { noBox: 1 });
  if (L >= 4) s += K.awning(x + 6, gy - 12, gw + 8, 9, awn) + K.awning(x + w - 14 - gw, gy - 12, gw + 8, 9, awn);
  if (fl === 2) [.2, .5, .8].forEach(t => { s += c.win(x + w * t - 12, top + 14, 24, 22, { noBox: 1 }); });
  const sy = top - 30;
  s += K.R(84, sy, 72, 22, '#FFFFFF', 7, 2.2, dk(roof)) + (d.icon ? d.icon(K, 98, sy + 11, .55) : '') + K.Tb(128, sy + 15, d.sign || '', 9.5, dk(roof, .2));
  if (L >= 8) s += [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle class="a-glow" style="animation-delay:-${i * .25}s" cx="${88 + i * 9.1}" cy="${sy - 1}" r="1.8" fill="#FFE27A"/>`).join('');
  if (L >= 9) s += K.lights(x - 2, top + 4, 120, top + 18, x + w + 2, top + 4, 12);
  if (L >= 10) s += K.flag(x + 2, top - 5, '#FF6FA3') + K.flag(x + w - 2, top - 5, '#FFD54A') + K.medal(158, sy + 2, .8);
  s += d.extra ? d.extra(K, L, g) : '';
  c.g = g;
  return s;
}

/* ---------- full building (240 x 220 box, ground at y≈200) ---------- */
SQ.building = function (id, L, o = {}) {
  const d = SQ.B[id]; if (!d) return '';
  const civ = d.type !== 'house';
  if (civ && L === 0) return lot(d);
  const c = mkctx(d, L, civ);
  let s = yardBack(d, L, civ);
  const body = d.body ? d.body(K, c) : civicBody(K, c, d);
  let on = '', off = '';
  if (o.life) {
    if (!civ) { const cnt = o.owned == null ? 6 : o.owned; d.squishies.slice(0, cnt).forEach(q => { if (!q.idle) return; const v = q.idle(K, L); if (q.on) on += v; else off += v; }); }
    else if (d.life) off += d.life(K, L);
  }
  s += `<g class="${d.float && L >= 6 ? 'a-drift' : ''}">${body}${on}</g>`;
  s += yardFront(d, L, civ, c.g) + off;
  return s;
};
SQ.svg = (id, L, o = {}) => `<svg viewBox="0 0 240 220" class="bld" role="img" aria-label="${(SQ.B[id] || {}).name || id} level ${L}">${SQ.building(id, L, o)}</svg>`;

/* ---------- interior room base (600 x 340) ---------- */
K.room = function (o) {
  const id = K.uid(), w1 = o.wall, w2 = o.wall2 || dk(o.wall, .12);
  const P = {
    stripes: `<rect width="40" height="40" fill="${w1}"/><rect width="20" height="40" fill="${w2}"/>`,
    dots: `<rect width="36" height="36" fill="${w1}"/><circle cx="9" cy="9" r="4" fill="${w2}"/><circle cx="27" cy="27" r="4" fill="${w2}"/>`,
    check: `<rect width="40" height="40" fill="${w1}"/><rect width="20" height="20" fill="${w2}"/><rect x="20" y="20" width="20" height="20" fill="${w2}"/>`,
    waves: `<rect width="48" height="30" fill="${w1}"/><path d="M0 18 Q12 8 24 18 T48 18" fill="none" stroke="${w2}" stroke-width="4"/>`,
    stars: `<rect width="60" height="60" fill="${w1}"/><path d="M15 8 l2 5 5 1 -4 3 1 5 -4 -3 -4 3 1 -5 -4 -3 5 -1z" fill="${w2}"/><circle cx="44" cy="40" r="2.5" fill="${w2}"/>`,
    weave: `<rect width="24" height="24" fill="${w1}"/><path d="M0 6 H12 M12 18 H24 M6 12 V24 M18 0 V12" stroke="${w2}" stroke-width="5"/>`,
    leaves: `<rect width="44" height="44" fill="${w1}"/><ellipse cx="12" cy="12" rx="7" ry="3.5" fill="${w2}" transform="rotate(-35 12 12)"/><ellipse cx="34" cy="32" rx="7" ry="3.5" fill="${w2}" transform="rotate(30 34 32)"/>`,
    paws: `<rect width="50" height="50" fill="${w1}"/><g fill="${w2}"><ellipse cx="14" cy="16" rx="5" ry="4"/><circle cx="8" cy="9" r="2"/><circle cx="13" cy="7" r="2"/><circle cx="19" cy="9" r="2"/><ellipse cx="38" cy="40" rx="5" ry="4"/><circle cx="32" cy="33" r="2"/><circle cx="37" cy="31" r="2"/><circle cx="43" cy="33" r="2"/></g>`,
    logs: `<rect width="60" height="26" fill="${w1}"/><path d="M0 25 H60" stroke="${w2}" stroke-width="3"/><circle cx="44" cy="12" r="3" fill="none" stroke="${w2}" stroke-width="1.5"/>`
  };
  const F = {
    wood: `<rect width="80" height="20" fill="${o.floor}"/><path d="M0 19.5 H80 M40 0 V20" stroke="${dk(o.floor, .2)}" stroke-width="1.5"/>`,
    check: `<rect width="40" height="40" fill="${o.floor}"/><rect width="20" height="20" fill="${o.floor2 || '#fff'}"/><rect x="20" y="20" width="20" height="20" fill="${o.floor2 || '#fff'}"/>`,
    tatami: `<rect width="90" height="45" fill="${o.floor}"/><rect x="1" y="1" width="88" height="43" fill="none" stroke="${dk(o.floor, .25)}" stroke-width="2"/>`,
    plain: `<rect width="40" height="40" fill="${o.floor}"/><circle cx="10" cy="12" r="1.5" fill="${dk(o.floor, .12)}"/><circle cx="30" cy="30" r="1.5" fill="${dk(o.floor, .12)}"/>`
  };
  return `<defs><pattern id="${id}w" width="${o.pat === 'waves' ? 48 : o.pat === 'stars' ? 60 : o.pat === 'paws' ? 50 : o.pat === 'logs' ? 60 : o.pat === 'leaves' ? 44 : o.pat === 'weave' ? 24 : o.pat === 'dots' ? 36 : 40}" height="${o.pat === 'waves' ? 30 : o.pat === 'stars' ? 60 : o.pat === 'paws' ? 50 : o.pat === 'logs' ? 26 : o.pat === 'leaves' ? 44 : o.pat === 'weave' ? 24 : o.pat === 'dots' ? 36 : 40}" patternUnits="userSpaceOnUse">${P[o.pat] || P.stripes}</pattern>
  <pattern id="${id}f" width="${o.fl === 'tatami' ? 90 : o.fl === 'wood' ? 80 : 40}" height="${o.fl === 'tatami' ? 45 : o.fl === 'wood' ? 20 : 40}" patternUnits="userSpaceOnUse">${F[o.fl] || F.wood}</pattern>
  <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B2141" stop-opacity=".18"/><stop offset=".35" stop-color="#2B2141" stop-opacity="0"/></linearGradient></defs>
  <rect width="600" height="252" fill="url(#${id}w)"/><rect width="600" height="252" fill="url(#${id}g)"/>
  <path d="M0 252 H600 V340 H0Z" fill="url(#${id}f)"/><rect x="0" y="244" width="600" height="10" fill="${o.base || '#FFFFFF'}" stroke="${dk(o.base || '#FFFFFF', .25)}" stroke-width="1.5"/>`;
};

/* ---------- phone frame for minigame mockups (inner area 236 x 452) ---------- */
SQ.phone = (inner) => { const id = K.uid(); return `<svg viewBox="0 0 260 480" class="phone-svg" role="img" aria-label="Minigame screen mockup"><rect x="2" y="2" width="256" height="476" rx="34" fill="#2B2141"/><clipPath id="${id}"><rect x="12" y="14" width="236" height="452" rx="24"/></clipPath><rect x="12" y="14" width="236" height="452" rx="24" fill="#FFFFFF"/><g clip-path="url(#${id})"><g transform="translate(12 14)">${inner}</g></g><rect x="100" y="21" width="60" height="9" rx="4.5" fill="#2B2141"/></svg>`; };

/* ---------- upgrade requirements (one formula for all buildings) ---------- */
const HC = [0, 0, 100, 200, 350, 500, 750, 1000, 1400, 1900, 2500], HQ = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5];
const CC = [0, 300, 150, 250, 400, 600, 850, 1150, 1500, 2000, 2600], CT = [0, 0, 1, 2, 4, 6, 9, 13, 18, 24, 32];
SQ.req = function (d, L) {
  const m = d.mult || 1, coins = v => (Math.round(v * m / 10) * 10).toLocaleString('en-US');
  if (d.type === 'house') { if (L === 1) return 'How you find it'; return `${coins(HC[L])} coins${HQ[L] ? ` · ${HQ[L]} family squish${HQ[L] > 1 ? 'ies' : 'y'}` : ''}`; }
  if (L === 1) return `Build for ${coins(CC[1])} coins`;
  return `${(d.goal || 'Best score #').replace('#', Math.max(1, Math.round(CT[L] * (d.unit || 100))).toLocaleString('en-US'))} · ${coins(CC[L])} coins`;
};

/* ---------- page mounting (3D) ---------- */
function lightbox(html, cap) {
  let lb = document.getElementById('sq-lightbox');
  if (!lb) { lb = document.createElement('div'); lb.id = 'sq-lightbox'; lb.innerHTML = '<div class="lb-card"><button class="lb-x" type="button" aria-label="Close">×</button><div class="lb-art"></div><p class="lb-cap"></p></div>'; document.body.appendChild(lb); lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-x')) lb.hidden = true; }); document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.hidden = true; }); }
  lb.querySelector('.lb-art').innerHTML = html; lb.querySelector('.lb-cap').innerHTML = cap; lb.hidden = false;
}
SQ.lightbox = lightbox;
const snapBuilding = (id, L, life, o = {}) => { const D = SQ.three, obj = D.building(id, L, { life }); return D.ready().then(() => { D.fixClips(obj); return D.snap(obj, Object.assign({ w: 520, h: 440, t: 1.2, pad: .74, pitch: .5, yaw: .45 }, o)); }); };
SQ.snapBuilding = snapBuilding;
async function mountLevels(el) {
  const id = el.dataset.levels, d = SQ.B[id]; if (!d) return;
  const lis = [...el.querySelectorAll(':scope > li')];
  const sheet = document.createElement('div'); sheet.className = 'sheet';
  const figs = lis.map((li, i) => {
    const L = i + 1, f = document.createElement('button'); f.type = 'button'; f.className = 'lvl';
    f.innerHTML = `<span class="lvl-art"><img alt="${d.name} level ${L}" width="520" height="440"></span><span class="lvl-n">Lv ${L}</span><span class="lvl-t">${li.innerHTML}</span><span class="lvl-req">${SQ.req(d, L)}</span>`;
    f.addEventListener('click', async () => { lightbox('<p style="padding:40px;text-align:center">Building it…</p>', ''); const url = await snapBuilding(id, L, true, { w: 960, h: 760 }); lightbox(`<img src="${url}" alt="" style="display:block;width:100%">`, `<b>Level ${L}</b> · ${li.innerHTML}<br><small>${SQ.req(d, L)}</small>`); });
    sheet.appendChild(f); return f;
  });
  el.replaceWith(sheet);
  for (let i = 0; i < figs.length; i++) { figs[i].querySelector('img').src = await snapBuilding(id, i + 1, false); await new Promise(r => setTimeout(r, 0)); }
}
function mountFamily(el) {
  const d = SQ.B[el.dataset.family]; if (!d) return;
  el.classList.add('sq-grid');
  const all = Object.values(SQ.SQ);
  el.innerHTML = d.squishies.map(q => {
    const r = SQ.RARITY[q.r], same = d.squishies.filter(x => x.r === q.r).length, everywhere = all.filter(x => x.r === q.r).length || 1;
    const fam = r.odds / same, box = r.odds / everywhere;
    return `<article class="sq-card" style="--rc:${r.color}"><div class="sq-pic"><img src="${SQ.three.sprite(q.id)}" alt="${q.name}" width="220" height="220"></div><div class="sq-body"><div class="sq-head"><h3>${q.name}</h3><span class="rar">${r.name}</span></div><p>${q.bio}</p><p class="sq-where"><b>Around the house:</b> ${q.where}</p><p class="sq-odds">Mystery Box ${box < 1 ? box.toFixed(2) : box.toFixed(1)}% · Family Box ${fam < 1 ? fam.toFixed(1) : Math.round(fam)}% · Trade value ${r.value}</p></div></article>`;
  }).join('');
}
function mountHero(el) {
  const id = el.dataset.hero, d = SQ.B[id]; if (!d) return;
  const civ = d.type !== 'house'; let L = +(el.dataset.level || 10);
  el.innerHTML = d.single ? `<div class="hero-stage"></div><div class="lvl-ctl"><b hidden></b><input type="range" hidden><span class="hint">One level only · drag the picture to turn it</span></div>`   // single-level buildings (Gem Mine): no level slider
    : `<div class="hero-stage"></div><div class="lvl-ctl"><label for="lv-${id}">Level <b></b></label><input type="range" id="lv-${id}" min="${civ ? 0 : 1}" max="10" value="${L}"><span class="hint">Drag the picture to turn it</span></div>`;
  const stage = el.querySelector('.hero-stage'), b = el.querySelector('b'), r = el.querySelector('input');
  const v = new SQ.three.Viewer(stage, { yaw: .5, pitch: .5, pad: .7, pitchMin: .15, pitchMax: 1.1 });
  const draw = () => { b.textContent = L === 0 ? '0 (empty plot)' : L; const obj = SQ.three.building(id, L, { life: true }); SQ.three.ready().then(() => { SQ.three.fixClips(obj); v.set(obj); }); };
  r.addEventListener('input', () => { L = +r.value; draw(); }); draw();
}
function mountRoom(el) {
  const d = SQ.B[el.dataset.room]; if (!d || !d.interior) return;
  const stage = document.createElement('div'); stage.className = 'room-stage'; el.appendChild(stage);
  const v = new SQ.three.Viewer(stage, { yaw: .12, pitch: .16, pad: .62, yawLim: .55, pitchMin: .02, pitchMax: .55 });
  const choice = {}; let busy = null;
  const build = () => { const obj = SQ.three.room3(d.id, choice); SQ.three.ready().then(() => v.set(obj)); };
  build();
  document.querySelectorAll(`[data-decor-room="${d.id}"] button[data-style]`).forEach(b => b.addEventListener('click', () => {
    const row = b.closest('[data-decor-room]'); row.querySelectorAll('button[data-style]').forEach(x => x.setAttribute('aria-pressed', x === b));
    choice[row.dataset.item] = b.dataset.style; clearTimeout(busy); busy = setTimeout(build, 60);
  }));
}
/* minigame mockups stay 2D phone screens, but every squishy in them is the 3D model */
function mountMock(el) {
  const d = SQ.B[el.dataset.mock]; if (!d || !d.mock) return;
  const orig = K.place;
  K.place = (id, x, y, s = .3, a = 'bob', o = {}) => { const url = SQ.three.sprite(id); return `<g transform="translate(${(x - 50 * s).toFixed(1)} ${(y - 92 * s).toFixed(1)}) scale(${s})"><g class="a-${a === 'mow' ? 'bob' : a}">${o.innerBack || ''}<image href="${url}" x="2" y="6" width="96" height="96"/>${o.inner || ''}</g></g>`; };
  try { el.innerHTML = SQ.phone(d.mock(K)); } finally { K.place = orig; }
}
function mountAll(root = document) {
  root.querySelectorAll('[data-family]').forEach(mountFamily);
  root.querySelectorAll('[data-hero]').forEach(mountHero);
  root.querySelectorAll('[data-room]').forEach(mountRoom);
  root.querySelectorAll('[data-mock]').forEach(mountMock);
  root.querySelectorAll('[data-sq]').forEach(el => { el.innerHTML = `<img src="${SQ.three.sprite(el.dataset.sq)}" alt="" style="display:block;width:100%">`; });
  root.querySelectorAll('[data-thumb]').forEach(async el => { el.innerHTML = `<img alt="" style="display:block;width:100%;aspect-ratio:520/440">`; el.querySelector('img').src = await snapBuilding(el.dataset.thumb, +(el.dataset.level || 10), el.dataset.life === '1'); });
  root.querySelectorAll('[data-levels]').forEach(mountLevels);
}
SQ.mountAll = mountAll;
/* ---------- decor designs: every decor item can be bought in 4 designs ----------
   Classic is the item as drawn; the other designs re-colour it with a theme palette
   (dark -> light). Starlight also adds twinkles. Prices: base price x mult. */
SQ.DECOR_STYLES = [
  { id: 'classic', name: 'Classic', mult: 1, dots: null },
  { id: 'candy', name: 'Candy Pop', mult: 1.2, pal: ['#B8407F', '#FF7AA8', '#FFB3CE', '#FFE3EE', '#FFFFFF'] },
  { id: 'mint', name: 'Mint Breeze', mult: 1.2, pal: ['#23786E', '#3FBF94', '#93E2C1', '#DDF8EC', '#FFFFFF'] },
  { id: 'star', name: 'Starlight', mult: 1.6, pal: ['#2E2A5A', '#4B4FA8', '#8C7CF0', '#FFD54A', '#FFF3B0'], sparkle: true }
];
function lum(h) { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255); return .2126 * r + .7152 * g + .0722 * b; }
function full(c) { if (!c || c[0] !== '#') return null; if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return c.length === 7 ? c.toUpperCase() : null; }
function palAt(pal, t) { t = Math.max(0, Math.min(1, t)) * (pal.length - 1); const i = Math.min(pal.length - 2, Math.floor(t)); return SQ.mix(pal[i], pal[i + 1], t - i); }
SQ.restyle = function (itemsSvg, choice) {
  if (!choice || !Object.values(choice).some(v => v && v !== 'classic')) return itemsSvg;
  const host = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); host.setAttribute('viewBox', '0 0 600 340');
  host.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px;height:340px;visibility:hidden'; host.innerHTML = itemsSvg; document.body.appendChild(host);
  host.querySelectorAll('[data-item]').forEach(g => {
    const st = SQ.DECOR_STYLES.find(x => x.id === choice[g.dataset.item]); if (!st || !st.pal) return;
    const els = [g, ...g.querySelectorAll('*')].filter(e => !e.closest('[data-keep]'));
    els.forEach(e => ['fill', 'stroke'].forEach(a => { const c = full(e.getAttribute(a)); if (!c) return; const L = lum(c); if (L < .16) return; e.setAttribute(a, palAt(st.pal, (L - .16) / .84)); }));
    if (st.sparkle) { let b; try { b = g.getBBox(); } catch (err) { b = null; } if (b && b.width) [[b.x + b.width * .1, b.y + 4], [b.x + b.width * .92, b.y + b.height * .3], [b.x + b.width * .5, b.y - 6]].forEach(([x, y]) => g.insertAdjacentHTML('beforeend', `<path d="M${x} ${y - 7} Q${x + 1.2} ${y - 1.2} ${x + 7} ${y} Q${x + 1.2} ${y + 1.2} ${x} ${y + 7} Q${x - 1.2} ${y + 1.2} ${x - 7} ${y} Q${x - 1.2} ${y - 1.2} ${x} ${y - 7}Z" fill="#FFD54A"/>`)); }
  });
  const out = host.innerHTML; host.remove(); return out;
};


/* ---------- map bubble icon: what a building does, at a glance ----------
   civic buildings: their own icon.  family houses: a little house in the family colour
   with the family emblem squishy on it (set with badge: { sq, color } in the art file). */
SQ.badgeHTML = function (id) {
  const d = SQ.B[id]; if (!d) return '';
  const col = (d.badge && d.badge.color) || d.roof || '#FF6FA3';
  if (d.type === 'house') {
    const sq = d.badge && d.badge.sq, img = sq && SQ.three ? `<img class="bb-emb" src="${SQ.three.sprite(sq, null, 160)}" alt="">` : '';
    return `<svg class="bb-house" viewBox="0 0 40 40" aria-hidden="true"><path d="M5 19 L20 6 L35 19 Z" fill="${col}" stroke="#3A2A4A" stroke-width="2.2" stroke-linejoin="round"/><rect x="9" y="18" width="22" height="16" rx="2.5" fill="#FFF8EC" stroke="#3A2A4A" stroke-width="2.2"/><rect x="26.5" y="7.5" width="4" height="7" rx="1" fill="${col}" stroke="#3A2A4A" stroke-width="1.8"/></svg>${img}`;
  }
  return `<svg class="bb-icon" viewBox="-16 -16 32 32" aria-hidden="true">${d.icon ? d.icon(K, 0, 0, 1.05) : ''}</svg>`;
};

/* load the 3D kit and every art file, then fill the page */
function load(src) { return new Promise(res => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { console.warn('Missing file: ' + src); res(); }; document.head.appendChild(s); }); }
SQ.boot = async function (cb) {
  if (!window.THREE) await load('https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js');
  await load(DIR + 'kit3d.js'); await load(DIR + 'kit3d-build.js');
  await Promise.all(SQ.MODULES.map(m => load(DIR + m + '.js')));
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
  mountAll(); if (cb) cb();
};
})();
