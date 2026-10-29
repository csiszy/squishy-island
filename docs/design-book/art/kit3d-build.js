/* =====================================================================
   SQUISHVILLE 3D BUILDING KIT  ·  art/kit3d-build.js
   Shared 3D parts (windows, doors, fences, trees, lamps...), the level
   rules that every building follows (broken -> golden), and the generic
   "fun building" that grows from a kiosk to a two-storey building.
   Each art/<id>.js file uses these parts in its model() function.
   Units: 1 unit ≈ 1 metre. A plot is 26 x 22 units, ground at y = 0,
   the building's front faces +z (towards the camera).
   ===================================================================== */
(function () {
'use strict';
const T = THREE, D = SQ.three, K = SQ.K, mix = SQ.mix, dk = SQ.dk;
const { box, cube, cyl, cone, ball, torus, lathe, slab, at, G } = D;
const PI = Math.PI;

/* ---------- small parts ---------- */
D.tree = (x, z, s = 1, c = '#69C46A') => at(G(at(cyl(.35 * s, .45 * s, 2.6 * s, '#A0714A', 10), 0, 1.3 * s, 0), at(ball(1.9 * s, c), 0, 3.6 * s, 0), at(ball(1.3 * s, c), -1.1 * s, 3 * s, .5 * s), at(ball(1.25 * s, mix(c, '#ffffff', .1)), 1.1 * s, 3.1 * s, -.3 * s)), x, 0, z);
D.pine = (x, z, s = 1, c = '#4FAF72') => at(G(at(cyl(.3 * s, .35 * s, 1.4 * s, '#A0714A', 8), 0, .7 * s, 0), at(cone(1.7 * s, 2.6 * s, c, 10), 0, 2.4 * s, 0), at(cone(1.25 * s, 2.2 * s, c, 10), 0, 3.6 * s, 0), at(cone(.8 * s, 1.7 * s, c, 10), 0, 4.6 * s, 0)), x, 0, z);
D.bush = (x, z, r = .9, c = '#6CC56B') => at(G(at(ball(r, c), 0, r * .8, 0), at(ball(r * .75, c), -r * .75, r * .6, .1), at(ball(r * .75, c), r * .75, r * .6, -.1)), x, 0, z);
D.flower = (x, z, c = '#FF7AA8', h = .7) => at(G(at(cyl(.04, .04, h, '#4E9B4E', 5), 0, h / 2, 0), at(ball(.2, c, 1, .7, 1, 8), 0, h, 0), at(ball(.09, '#FFE27A', 1, 1, 1, 6), 0, h + .1, 0)), x, 0, z);
D.flowerBed = (x, z, w = 2.4, cols = ['#FF7AA8', '#FFD54A', '#B48CFF', '#FF8A5C']) => { const g = G(at(box(w + .3, .3, 1, '#8E6A4A', .1), 0, .15, 0)); for (let i = 0; i < 6; i++) g.add(D.flower(-w / 2 + .2 + i * (w - .4) / 5, (i % 2 ? .2 : -.2), cols[i % cols.length], .55 + (i % 3) * .1)); return at(g, x, 0, z); };
D.weed = (x, z) => at(G([-.4, 0, .4].map((a, i) => at(cone(.08, .7 + i * .15, '#7C8B4A', 5), a * .3, .35, 0, 0, 0, a))), x, 0, z);
D.fence = (x1, z1, x2, z2, c = '#FFFFFF', h = 1.1) => {
  const len = Math.hypot(x2 - x1, z2 - z1), g = G(at(cube(len, .12, .1, c), 0, h * .7, 0), at(cube(len, .12, .1, c), 0, h * .3, 0));
  for (let x = -len / 2 + .2; x <= len / 2; x += .55) g.add(at(G(at(cube(.2, h, .08, c), 0, h / 2, 0), at(cube(.14, .14, .08, c), 0, h, 0, 0, 0, PI / 4)), x, 0, .06));
  return at(g, (x1 + x2) / 2, 0, (z1 + z2) / 2, 0, -Math.atan2(z2 - z1, x2 - x1), 0);
};
D.mailbox = (x, z, c = '#FF6F7D', ry = 0) => at(G(at(cyl(.08, .08, 1.3, '#8A6A4E', 6), 0, .65, 0), at(box(.7, .55, .9, c, .2), 0, 1.5, 0), at(cyl(.35, .35, .9, c, 14, false), 0, 1.75, 0, PI / 2, 0, 0), at(cube(.05, .55, .05, '#FFD54A'), .4, 1.9, .2), at(cube(.05, .2, .3, '#FFD54A'), .4, 2.1, .32)), x, 0, z, 0, ry, 0);
D.lamp = (x, z, on) => { const bulb = at(ball(.32, on ? '#FFE58A' : '#E8E4EF'), 0, 3.15, 0); if (on) { bulb.material = D.mat('#FFE58A', { e: '#FFD54A', ei: .9 }); D.anim(bulb, 'glow'); } return at(G(at(cyl(.1, .14, 3, '#5A5170', 8), 0, 1.5, 0), at(cyl(.28, .3, .2, '#5A5170', 10), 0, .1, 0), bulb, at(cone(.45, .4, '#5A5170', 10), 0, 3.55, 0)), x, 0, z); };
D.bench = (x, z, ry = 0, c = '#C98A55') => at(G(at(box(2, .14, .6, c, .05), 0, .55, 0), at(box(2, .5, .1, c, .04), 0, .9, -.28), [-.8, .8].map(xx => at(cube(.1, .55, .5, '#5A5170'), xx, .27, 0))), x, 0, z, 0, ry, 0);
D.pot = (x, z, c = '#D9824F', plant = '#6CC56B') => at(G(at(cyl(.4, .3, .55, c, 12), 0, .27, 0), at(ball(.45, plant), 0, .75, 0), at(ball(.32, plant), .25, .95, 0)), x, 0, z);
D.cone3 = (x, z) => at(G(at(cone(.35, .9, '#FF8A3D', 12), 0, .5, 0), at(cyl(.24, .28, .14, '#FFFFFF', 12), 0, .55, 0), at(box(.9, .1, .9, '#FF8A3D', .03), 0, .05, 0)), x, 0, z);
D.tire = (x, z) => at(torus(.5, .22, '#3E3A44', PI * 2, 8, 18), x, .22, z, PI / 2, 0, 0);
D.planks = (x, z) => at(G(at(box(2.2, .18, .4, '#C49A6C', .05), 0, .1, 0), at(box(2, .18, .4, '#B38A5C', .05), .1, .28, .1, 0, .2, 0), at(box(2.1, .18, .4, '#C49A6C', .05), 0, .3, -.3, 0, -.15, .2)), x, 0, z);
D.ladder = (x, z, h = 6, ry = 0) => { const g = G(at(cube(.12, h, .12, '#B98B5C'), -.4, h / 2, 0), at(cube(.12, h, .12, '#B98B5C'), .4, h / 2, 0)); for (let y = .6; y < h; y += .8) g.add(at(cube(.8, .08, .08, '#B98B5C'), 0, y, 0)); return at(G(at(g, 0, 0, 0, -.22, 0, 0)), x, 0, z, 0, ry, 0); };
D.bucket = (x, z, c) => at(G(at(cyl(.36, .3, .6, '#C9CFD8', 12), 0, .3, 0), at(cyl(.32, .32, .04, c, 12), 0, .6, 0), at(torus(.34, .03, '#7D8590', PI, 4, 10), 0, .6, 0)), x, 0, z);
D.stone = (x, z, s = 1) => at(ball(.5 * s, '#ECE5DA', 1.2, .25, 1), x, .05, z);
D.lantern = (x, y, z, c = '#EF4E4A', glow) => { const b = at(ball(.4, c, .85, 1.05, .85, 12), 0, 0, 0); if (glow) { b.material = D.mat(c, { e: c, ei: .5 }); D.anim(b, 'glow'); } return at(G(at(cyl(.02, .02, .5, '#6b4a3a', 4), 0, .6, 0), at(cyl(.22, .22, .1, '#FFC94D', 10), 0, .42, 0), b, at(cyl(.22, .22, .1, '#FFC94D', 10), 0, -.42, 0)), x, y, z); };
D.flag3 = (x, y, z, c = '#FF6FA3', h = 2) => { const f = at(G(at(cube(.9, .55, .04, c), .45, 0, 0)), 0, h - .3, 0); D.anim(f, 'flag'); return at(G(at(cyl(.04, .04, h, '#5A5170', 6), 0, h / 2, 0), f), x, y, z); };
D.medal = (x, y, z, s = 1) => { const g = at(G(at(cyl(.7 * s, .7 * s, .2 * s, D.mat('#FFD54A', { m: .45, r: .3 }), 24), 0, 0, 0, PI / 2, 0, 0), at(D.slab(starPts(.45 * s, .2 * s), .26 * s, D.mat('#FFF3B0', { m: .3, r: .3 }), .03), 0, 0, .05)), x, y, z); D.anim(g, 'spin', { sp: 1.1 }); return g; };
function starPts(R, r) { const p = []; for (let i = 0; i < 10; i++) { const a = PI / 2 + i * PI / 5, rr = i % 2 ? r : R; p.push([rr * Math.cos(a), rr * Math.sin(a)]); } return p; }
D.starPts = starPts;
D.sparkle = (x, y, z, s = 1, c = '#FFD54A') => { const m = at(D.mesh(new T.OctahedronGeometry(.28 * s), D.mat(c, { e: c, ei: .7 }), false), x, y, z); m.scale.set(1, 1.5, .4); D.anim(m, 'twinkle'); return m; };
D.puffs = (x, y, z, c = '#FFFFFF') => G([0, 1, 2].map(i => D.anim(at(ball(.55, D.mat(c, { op: .85 })), x, y, z), 'smoke', { ph: i })));
D.lights3 = (pts, cols = ['#FF6F9C', '#FFD54A', '#6FD3FF', '#8BE07A']) => {
  const v = pts.map(p => new T.Vector3(...p)), curve = new T.CatmullRomCurve3(v);
  const g = G(D.mesh(new T.TubeGeometry(curve, 40, .03, 4, false), D.mat('#5b4a5a'), false));
  const n = Math.max(6, Math.round(curve.getLength() / .9));
  for (let i = 1; i < n; i++) { const p = curve.getPoint(i / n), c = cols[i % cols.length], b = at(ball(.13, D.mat(c, { e: c, ei: .8 }), 1, 1.3, 1, 8), p.x, p.y - .15, p.z); D.anim(b, 'twinkle', { ph: i * .7 }); g.add(b); }
  return g;
};
D.awning3 = (w, depth, cols, slope = .45) => { const g = G(), n = Math.max(3, Math.round(w / .9)), sw = w / n; for (let i = 0; i < n; i++) { g.add(at(cube(sw, .08, depth, cols[i % 2]), -w / 2 + sw * (i + .5), 0, depth / 2)); g.add(at(cyl(sw / 2, sw / 2, .08, cols[i % 2], 10), -w / 2 + sw * (i + .5), 0, depth, 0, 0, 0)); } return at(G(at(g, 0, 0, 0, slope, 0, 0)), 0, 0, 0); };
D.sunbed = (x, z, c = '#6CC8EA', ry = 0) => at(G(at(box(1.2, .14, 2.4, c, .05), 0, .55, .2), at(box(1.2, .14, 1, c, .05), 0, .9, -1.1, -.6, 0, 0), [-.5, .5].map(xx => [[-.8], [.9]].map(([zz]) => at(cube(.08, .55, .08, '#9B7451'), xx, .27, zz))), at(cube(.3, .15, 2.4, '#FFFFFF'), 0, .63, .2)), x, 0, z, 0, ry, 0);
D.mower = () => G(at(box(1.2, .55, .8, '#FF5E6C', .2), 1.1, .45, 0), at(box(.6, .2, .5, '#FFD54A', .08), 1.1, .8, 0), [[.7, .4], [1.5, .4], [.7, -.4], [1.5, -.4]].map(([x, z]) => at(cyl(.18, .18, .1, '#4A4458', 10), x, .18, z, PI / 2, 0, 0)), at(cyl(.04, .04, 1.4, '#5A5170', 6), .55, .9, 0, 0, 0, -.9));
D.letter3 = () => G(at(box(.7, .5, .06, '#FFFFFF', .02), 0, 0, 0), at(cube(.15, .15, .02, '#FF6F9C'), 0, -.02, .04));
D.bowl3 = (r = 2, liquid = '#F6C25E', c = '#FFFFFF') => G(lathe([[0, 0], [r * .6, .05], [r * .9, .35], [r, .85], [r * .98, .95], [r * .9, .9]], c, 28), at(D.disc(r * .9, liquid), 0, .7, 0, -PI / 2, 0, 0), at(torus(r * .55, .07, '#E55B5B', PI * 2, 4, 30), 0, .4, 0, PI / 2, 0, 0));
D.puddle = (r = 1.6, c = '#9ED8F5') => at(G(at(D.disc(r, D.mat(c, { r: .2 })), 0, .06, 0, -PI / 2, 0, 0)), 0, 0, 0);
D.towel = (w = 2.6, c1 = '#FF6F7D', c2 = '#FFFFFF') => G(at(box(w * .55, .08, w, c1, .03), 0, .05, 0), at(cube(w * .56, .09, w * .14, c2), 0, .05, -w * .2), at(cube(w * .56, .09, w * .14, c2), 0, .05, w * .2));

/* ---------- level-aware context ---------- */
function ctx(d, L, civ) {
  const Lw = civ ? (L >= 8 ? 9 : 6) : L;
  const c = { L, Lw, civ, d };
  c.c = (col, need = 4) => L >= need ? col : mix(col, '#A39A8C', Math.min(.75, .32 + (need - L) * .14));
  /* window centred at (x,y,z), facing ry. o.r = round */
  c.win = (x, y, z, w, h, o = {}) => {
    const g = G(), fr = c.c(o.frame || '#FFF8EC', 5);
    if (o.r) { g.add(at(torus(w / 2, .16, fr, PI * 2, 8, 28), 0, 0, .05)); }
    else g.add(at(box(w + .4, h + .4, .25, fr, .08), 0, 0, 0));
    const glassCol = Lw <= 2 ? '#4B4152' : Lw <= 4 ? '#C9D6DA' : Lw >= 9 ? '#FFE4A0' : '#BFE6F7';
    const gm = Lw >= 9 ? D.mat('#FFE4A0', { e: '#FFC94D', ei: .55, r: .25 }) : D.mat(glassCol, { r: .2 });
    const glass = o.r ? at(cyl(w / 2 - .08, w / 2 - .08, .1, gm, 24), 0, 0, .08, PI / 2, 0, 0) : at(cube(w, h, .1, gm), 0, 0, .1);
    if (Lw >= 9) D.anim(glass, 'glow', { ph: x }); g.add(glass);
    if (Lw <= 2) { g.add(at(box(w + .8, h * .22, .14, '#B08A5E', .03), 0, h * .16, .28, 0, 0, -.25)); g.add(at(box(w + .8, h * .22, .14, '#A07A50', .03), 0, -h * .18, .3, 0, 0, .2)); }
    else if (Lw <= 4) g.add(at(G(D.tube([[-w * .2, h * .4, 0], [0, h * .1, 0], [-w * .1, -h * .1, 0], [w * .15, -h * .4, 0]], .03, '#7D8A90')), 0, 0, .17));
    else {
      const cu = o.cur || d.cur || '#FF9EC0';
      if (!o.r) { g.add(at(slab([[0, 0], [w * .34, 0], [0, -h * .8]], .06, cu, 0), -w / 2 + .02, h / 2 - .02, .18)); g.add(at(slab([[0, 0], [-w * .34, 0], [0, -h * .8]], .06, cu, 0), w / 2 - .02, h / 2 - .02, .18)); g.add(at(cube(.08, h, .08, fr), 0, 0, .18)); }
      else { g.add(at(cube(.08, w - .1, .08, fr), 0, 0, .16)); g.add(at(cube(w - .1, .08, .08, fr), 0, 0, .16)); }
    }
    if (!o.r && !o.noSill) g.add(at(box(w + .8, .22, .6, fr, .06), 0, -h / 2 - .2, .25));
    if (Lw >= 7 && !civ && !o.r && !o.noBox) { g.add(at(box(w, .45, .5, '#B5764A', .08), 0, -h / 2 - .5, .45)); ['#FF7AA8', '#FFD54A', '#B48CFF'].forEach((col, i) => g.add(at(ball(.17, col, 1, 1, 1, 8), -w / 3 + i * w / 3, -h / 2 - .2, .5))); }
    return at(g, x, y, z, 0, o.ry || 0, 0);
  };
  /* door: bottom-centre at (x, y0, z) */
  c.door = (x, y0, z, w, h, col, o = {}) => {
    const g = G(), arch = o.arch !== false;
    const pts = []; if (arch) { pts.push([-w / 2, 0], [w / 2, 0], [w / 2, h - w / 2]); for (let i = 1; i < 12; i++) { const a = i / 12 * PI; pts.push([w / 2 * Math.cos(a), h - w / 2 + w / 2 * Math.sin(a)]); } pts.push([-w / 2, h - w / 2]); } else pts.push([-w / 2, 0], [w / 2, 0], [w / 2, h], [-w / 2, h]);
    if (Lw <= 5) {
      g.add(at(slab(pts, .1, '#3E3446', 0), 0, 0, 0));
      const old = at(G(at(slab(pts, .2, '#9C8B78', .04), 0, 0, 0), at(cube(.06, h * .9, .05, '#7A6B5C'), -w * .17, h * .45, .12), at(cube(.06, h * .9, .05, '#7A6B5C'), w * .17, h * .45, .12)), -w / 2, 0, .12, 0, Lw <= 2 ? -.5 : -.25, Lw <= 2 ? .06 : .02);
      old.children.forEach(ch => ch.position.x += w / 2); g.add(old);
    } else {
      g.add(at(slab(pts.map(p => [p[0] * 1.18, p[1] * 1.06]), .18, c.c(o.frame || '#FFFFFF', 6), .04), 0, 0, 0));
      g.add(at(slab(pts, .25, col, .06), 0, 0, .1));
      g.add(at(ball(.12, D.mat('#FFD54A', { m: .4, r: .3 })), w * .3, h * .45, .3));
      g.add(at(cyl(Math.min(.35, w * .18), Math.min(.35, w * .18), .1, D.mat('#BFE6F7', { r: .2 }), 16), 0, arch ? h - w / 2 : h * .78, .25, PI / 2, 0, 0));
      g.add(at(box(w + .5, .1, 1, '#E9A23B', .03), 0, .05, .7));
      if (Lw >= 9 && !o.noLamp) { const b = at(ball(.22, D.mat('#FFE58A', { e: '#FFD54A', ei: .9 })), w / 2 + .55, h * .7, .35); D.anim(b, 'glow'); g.add(b, at(cube(.08, .4, .25, '#7A6040'), w / 2 + .55, h * .7 - .3, .2)); }
    }
    return at(g, x, y0, z, 0, o.ry || 0, 0);
  };
  c.crack = (x, y, z, ry = 0) => L > 3 ? new T.Group() : at(G(D.tube([[0, 0, 0], [.35, -.5, 0], [.1, -.9, 0], [.5, -1.5, 0]], .05, '#6E6370')), x, y, z, 0, ry, 0);
  return c;
}
D.ctx = ctx;

/* ---------- plot base + yards ---------- */
function plotBase(d, L, civ) {
  const grass = !civ && L <= 2 ? '#B8C78F' : '#9ED67E', g = G(at(box(26, .8, 22, grass, .3), 0, -.4, 0), at(box(26.6, .5, 22.6, '#C9A97A', .2), 0, -.72, 0));
  if (!civ && L <= 2) { g.add(at(D.disc(3, '#C9B48C'), -6, .02, 6, -PI / 2, 0, 0), at(D.disc(2.2, '#C9B48C'), 6.5, .02, 7.5, -PI / 2, 0, 0)); }
  return g;
}
function houseYard(d, L) {
  const g = G(), dx = d.doorX3 || 0, front = d.front3 || 5;
  if (L === 1) { g.add(at(G(D.fence(-12.5, 9, -8.5, 9, '#B3ADA4')), 0, 0, 0, 0, 0, .12), D.weed(-11, 7), D.weed(-8.5, 10), D.weed(9, 9.5), D.weed(11.5, 6), D.tire(8.5, 8.5), D.weed(-4, 9)); }
  if (L === 2) g.add(D.planks(9.5, 9), D.cone3(-9.5, 9.5), D.weed(-8, 7));
  if (L >= 2 && L <= 3) g.add(D.ladder(...(d.ladder3 || [7.6, 2]), 7, -.3));
  if (L >= 3 && L <= 4) g.add(D.bucket(-8.5, 8.5, d.paint || '#FF6FA3'));
  if (L === 5) g.add(D.pot(dx + 2.6, front + 1.2));
  if (L >= 6 && d.mail3 !== false) g.add(D.mailbox(...(d.mail3 || [10, 8.5]), d.trim || '#FF6F7D'));
  if (L >= 7) {
    const fc = d.fence || '#FFFFFF';
    g.add(D.fence(-12.6, -10.6, 12.6, -10.6, fc), D.fence(-12.6, -10.6, -12.6, 10.4, fc), D.fence(12.6, -10.6, 12.6, 10.4, fc), D.fence(-12.6, 10.4, -3, 10.4, fc), D.fence(3, 10.4, 12.6, 10.4, fc));
    for (let i = 0; i < 4; i++) g.add(D.stone(dx + (i % 2 ? .3 : -.3), front + 1.6 + i * 1.3));
    g.add(D.flowerBed(-5.5, front + 1.5, 3), D.flowerBed(5.5, front + 1.5, 3));
  }
  if (L >= 8) g.add(D.bush(-(d.bx3 || 7.4), front + .2, .9), D.bush(d.bx3 || 7.4, front + .2, .9));
  if (L >= 9 && d.smoke3) g.add(D.puffs(...d.smoke3));
  if (L >= 10) { if (d.star3) g.add(D.medal(...d.star3)); [[-10, 9, -4], [10, 11, -2], [-6, 16, 2], [7, 15, 3], [0, 19, 0]].forEach(p => g.add(D.sparkle(...p, 1.4))); }
  return g;
}
function civicYard(d, L, gm) {
  const g = G(), pw = gm ? gm.doorW : 2.4;
  if (L >= 3 && !d.noPots) g.add(D.pot(-pw / 2 - .9, 6.4), D.pot(pw / 2 + .9, 6.4));
  if (L >= 4 && d.bench !== false) g.add(D.bench(-10, 7.5, .3));
  if (L >= 6) g.add(D.lamp(-12, 9.5, L >= 8), D.lamp(12, 9.5, L >= 8));
  if (L >= 8) g.add(D.fence(-12.6, -10.6, 12.6, -10.6, d.fence || '#FFFFFF'), D.flowerBed(-8, 9.6, 3.5), D.flowerBed(8, 9.6, 3.5));
  if (L >= 10) [[-10, 9, -4], [10, 11, -2], [-6, 15, 2], [7, 14, 3]].forEach(p => g.add(D.sparkle(...p, 1.4)));
  return g;
}

/* ---------- empty plot (fun buildings, level 0) ---------- */
function lot(d) {
  const g = G(at(D.disc(9, '#D9BE93', 32), 0, .03, 0, -PI / 2, 0, 0));
  [[-7, 0, 6], [7, 0, 6], [-7, 0, -6], [7, 0, -6]].forEach(p => g.add(D.cone3(p[0], p[2])));
  g.add(D.planks(5, -3), at(ball(1.2, '#C9A97A', 1.3, .5, 1), -4, .1, -3), at(ball(.9, '#C9A97A', 1.2, .5, 1), -2, .1, -4.5));
  const sign = D.signPlane(d, 'BUILD ME!', 5, 2.8);
  g.add(at(cyl(.18, .18, 3.6, '#A7794E', 8), 0, 1.8, 2), at(box(5.4, 3.2, .3, '#A7794E', .1), 0, 4, 2), at(sign, 0, 4, 2.17));
  return g;
}
/* a sign board texture: building icon + word */
D.signPlane = (d, word, w, h, o = {}) => {
  const vbw = 200, vbh = Math.round(200 * h / w), ink = o.ink || dk(d.roof || '#2B2141', .2);
  const svg = `<rect x="2" y="2" width="${vbw - 4}" height="${vbh - 4}" rx="16" fill="${o.bg || '#FFF8EC'}"/>${d.icon ? d.icon(K, word ? 30 : vbw / 2, vbh / 2, word ? Math.min(1.5, vbh / 50) : vbh / 28) : ''}<text x="${word && d.icon ? 118 : 100}" y="${vbh / 2}" dy=".36em" text-anchor="middle" font-family="Nunito,Arial Rounded MT Bold,sans-serif" font-weight="900" font-size="${Math.min(vbh * .34, (d.icon ? 140 : 180) / (.66 * Math.max(3, (word || '').length)))}" fill="${ink}">${word || ''}</text>`;
  const tex = D.svgTex(svg, `0 0 ${vbw} ${vbh}`, 512);
  return D.mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tex, roughness: .7 }), false);
};

/* ---------- generic fun building: kiosk (Lv1-2) then grows ---------- */
function roof3(style, w, dep, col) {
  const g = G();
  if (style === 'gable') g.add(at(slab([[-w / 2 - .8, 0], [w / 2 + .8, 0], [0, 4.2]], dep + 1.4, col, .15), 0, 0, 0));
  else if (style === 'mansard') g.add(at(slab([[-w / 2 - .6, 0], [w / 2 + .6, 0], [w / 2 - 1.8, 2.6], [-w / 2 + 1.8, 2.6]], dep + 1, col, .15), 0, 0, 0));
  else if (style === 'dome') { const m = D.mesh(new T.CylinderGeometry(dep / 2 + .4, dep / 2 + .4, w + .4, 32, 1, false, 0, PI), D.mat(col)); m.rotation.set(0, 0, PI / 2); g.add(m, at(D.disc(dep / 2 + .4, col), w / 2 + .2, 0, 0, 0, PI / 2, 0), at(D.disc(dep / 2 + .4, col), -w / 2 - .2, 0, 0, 0, -PI / 2, 0)); }
  else g.add(at(box(w + .6, .8, dep + .6, col, .15), 0, .4, 0));
  return g;
}
function civicBody(c, d) {
  const L = c.L, wall = d.wall, roof = d.roof, trim = d.trim || '#FFFFFF', awn = d.awn || [roof, '#FFFFFF'], g = G();
  if (L <= 2) {
    g.add(at(box(8, 3.4, 4, wall, .25), 0, 1.7, 0), at(box(8.6, .3, 4.4, trim, .1), 0, 3.5, 0));
    [[-3.7, 1.8], [3.7, 1.8], [-3.7, -1.8], [3.7, -1.8]].forEach(([x, z]) => g.add(at(cyl(.12, .12, 3.4, '#8A6A4E', 8), x, 5.2, z)));
    g.add(at(D.awning3(9, 4.8, awn, .3), 0, 6.9, -2.4));
    g.add(at(D.signPlane(d, '', 2.4, 2), 0, 1.9, 2.02));
    if (L === 2) g.add(at(G(at(box(1.4, 1.8, .15, '#3D4B45', .05), 0, .9, 0, -.2, 0, 0), at(box(1.4, 1.8, .15, '#3D4B45', .05), 0, .9, -.6, .2, 0, 0)), -6, 0, 3), D.pot(5.5, 3));
    c.g = { doorW: 2.4 };
    return g;
  }
  const w = L >= 5 ? 16 : 12.5, dep = 9, fl = L >= 6 ? 2 : 1, fh = 5.4, H = fl * fh, gm = { w, dep, fl, fh, H, doorW: d.garage ? 6 : 2.4, front: dep / 2 };
  c.g = gm;
  if (d.behind) g.add(d.behind(D, L, gm));
  g.add(at(box(w, H, dep, wall, .3), 0, H / 2, 0));
  if (fl === 2) g.add(at(box(w + .4, .5, dep + .4, trim, .12), 0, fh, 0));
  g.add(at(box(w + .8, .7, dep + .8, trim, .15), 0, H + .2, 0));
  g.add(at(roof3(d.roofStyle, w, dep, roof), 0, H + .5, 0));
  const fz = dep / 2;
  if (d.garage) g.add(at(G(at(box(gm.doorW, 4.6, .3, d.door || '#F4F1F8', .1), 0, 2.3, 0), ...[0, 1, 2, 3].map(i => at(cube(gm.doorW - .5, .07, .1, '#C8C0D6'), 0, 1 + i * .9, .18)), at(cube(gm.doorW - 1, .8, .1, D.mat('#BFE6F7', { r: .2 })), 0, 3.9, .18)), 0, 0, fz));
  else g.add(c.door(0, 0, fz, 2.4, 4.2, d.door || roof, { arch: d.archDoor === true }));
  const gw = L >= 5 ? 3.8 : 2.8;
  [-1, 1].forEach(k => { const x = k * (w / 2 - 1.2 - gw / 2); g.add(c.win(x, 2.6, fz + .05, gw, 2.6, { noBox: 1 })); if (L >= 4) g.add(at(D.awning3(gw + 1, 1.3, awn, .5), x, 4.4, fz + .1)); });
  [-1, 1].forEach(k => g.add(c.win(k * (w / 2 + .05), 2.6, 0, 2.4, 2.2, { noBox: 1, ry: k * PI / 2 })));
  if (fl === 2) [-.32, 0, .32].forEach(t => g.add(c.win(t * w, fh + 2.6, fz + .05, 2.2, 2, { noBox: 1 })));
  const sy = H + (d.roofStyle === 'gable' ? 1.6 : d.roofStyle === 'mansard' ? 1.4 : d.roofStyle === 'dome' ? 1.6 : 1.8);
  g.add(at(box(7.4, 2.4, .35, '#FFFFFF', .12), 0, sy, fz + .9), at(D.signPlane(d, d.sign || '', 7, 2.1), 0, sy, fz + 1.09));
  if (L >= 8) for (let i = 0; i < 9; i++) { const b = at(ball(.12, D.mat('#FFE27A', { e: '#FFD54A', ei: .9 }), 1, 1, 1, 8), -3.4 + i * .85, sy + 1.3, fz + 1); D.anim(b, 'glow', { ph: i }); g.add(b); }
  if (L >= 9) g.add(D.lights3([[-w / 2, H + .3, fz + .5], [0, H - .6, fz + .9], [w / 2, H + .3, fz + .5]]));
  if (L >= 10) g.add(D.flag3(-w / 2 + .4, H + .6, fz - .5, '#FF6FA3'), D.flag3(w / 2 - .4, H + .6, fz - .5, '#FFD54A'), D.medal(4.8, sy + .4, fz + 1.3, .9));
  if (d.extra3) g.add(d.extra3(D, L, gm, c));
  return g;
}

/* ---------- full building at a level ---------- */
D.building = function (id, L, o = {}) {
  const d = SQ.B[id]; if (!d) return new T.Group();
  const civ = d.type !== 'house', root = new T.Group();
  root.add(plotBase(d, L, civ));
  if (civ && L === 0) { root.add(lot(d)); return root; }
  const c = ctx(d, L, civ);
  const bigSize = D.SIZE; D.SIZE = Math.min(bigSize, 1.5);   // squishies that are part of a building's own model keep their designed size
  const body = d.model ? d.model(D, c) : civicBody(c, d);
  D.SIZE = bigSize;
  const bodyG = G(body); D.optimize(bodyG);
  const breathe = G(bodyG); D.anim(breathe, 'squish', { amp: .22 }); if (d.float && L >= 6) D.anim(bodyG, 'drift');
  root.add(breathe, civ ? civicYard(d, L, c.g) : houseYard(d, L));
  if (o.life) {
    const solids = []; bodyG.traverse(m => { if (!m.isMesh || m.userData.outline || m.material.transparent) return; for (let p = m; p && p !== bodyG; p = p.parent) if (p.userData.anim) return; solids.push(m); });
    const placed = [];
    if (!civ) { const n = o.owned == null ? 6 : o.owned; d.squishies.slice(0, n).forEach(q => { if (!q.idle3) return; const v = q.idle3(D, L); if (!v) return; (q.on ? bodyG : root).add(v); placed.push(v); }); }
    else if (d.life3) { const v = d.life3(D, L); if (v) { root.add(v); placed.push(v); } }
    settle(root, placed, solids);
  }
  return D.finish(root);
};
/* squishies sitting up on a building (roofs, lids, caps) are dropped or lifted onto the real surface,
   so a bigger squishy never sinks into a roof or hovers above it */
const ray3 = new T.Raycaster(), DOWN = new T.Vector3(0, -1, 0);
function settle(root, placed, solids) {
  if (!solids.length) return; root.updateMatrixWorld(true);
  placed.forEach(v => v.traverse(w => {
    const u = w.userData.sqWrap; if (!u || u.clip || u.anim === 'float' || u.anim === 'mow') return;
    const p = new T.Vector3(); w.getWorldPosition(p); if (p.y < 1.5) return;
    const r = u.size * .26; let top = -1e9;
    [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [r * .7, r * .7], [-r * .7, -r * .7], [r * .7, -r * .7], [-r * .7, r * .7]].forEach(([dx, dz]) => {
      ray3.set(new T.Vector3(p.x + dx, p.y + 40, p.z + dz), DOWN); const h = ray3.intersectObjects(solids, false)[0]; if (h) top = Math.max(top, h.point.y); });
    if (top < -1e8 || Math.abs(top - p.y) > u.size * 1.4) return;
    const local = w.parent.worldToLocal(new T.Vector3(p.x, top + .02, p.z)); w.position.y = local.y;
  }));
}
/* a squishy peeking out of a window: centre of window (x,y,z), window bottom yb, facing ry */
D.peek = (id, x, y, z, yb, ry = 0, size = 1.7) => { size *= 1.25; const w = D.place(id, x, y - size * .55, z, size, 'peek', { clipY: yb, ry, depth: size * .9, shadow: false, raw: true }); return w; };
/* fix window-peek clipping planes after a building has been moved into a bigger scene */
D.fixClips = root => { root.updateMatrixWorld(true); root.traverse(o => { if (o.userData.clip) { const p = o.userData.clip, y0 = o.userData.clipY0 ?? (o.userData.clipY0 = -p.constant); const v = new T.Vector3(); o.parent.localToWorld(v.set(0, y0, 0)); p.constant = -v.y; } }); };
})();
