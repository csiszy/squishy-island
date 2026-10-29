/* =====================================================================
   SQUISHVILLE CITY MAP ENGINE  ·  art/city3d.js
   Builds the explorable 3D town from the CITY layout in index.html:
   ground + coast + river, curvy roads, roundabouts, bridges, forests,
   parks, decorations, the 18 buildings and their squishies.
   Drag to move, scroll / pinch to zoom, tap a building to open it.
   To move things around, edit the CITY block in index.html, not this file.
   ===================================================================== */
(function () {
'use strict';
const T = THREE, D = SQ.three, PI = Math.PI;
const { G, at, cyl, cone, ball, box, cube } = D;

/* ---------- helpers ---------- */
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function spline(pts, closed, step = 2) {
  const v = pts.map(p => new T.Vector3(p[0], 0, p[1])), c = new T.CatmullRomCurve3(v, !!closed, 'centripetal');
  const n = Math.max(8, Math.round(c.getLength() / step)); return c.getSpacedPoints(n).map(p => [p.x, p.z]);
}
const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
function nearest(p, pts) { let best = 1e18, bi = 0; for (let i = 0; i < pts.length; i++) { const d = dist2(p, pts[i]); if (d < best) { best = d; bi = i; } } return { d: Math.sqrt(best), i: bi, p: pts[bi] }; }

/* flat ribbon along a polyline (roads, river, paths). bump(x,z) lifts it (bridges) */
function ribbon(pts, w, y, material, bump, closed) {
  const P = closed ? pts.concat([pts[0]]) : pts, pos = [], idx = [], uv = []; let len = 0;
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const nx = -tz, nz = tx, yy = y + (bump ? bump(P[i][0], P[i][1]) : 0);
    if (i) len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    pos.push(P[i][0] + nx * w / 2, yy, P[i][1] + nz * w / 2, P[i][0] - nx * w / 2, yy, P[i][1] - nz * w / 2); uv.push(0, len / w, 1, len / w);
    if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new T.Mesh(g, material); m.receiveShadow = true; m.userData.noOutline = true; return m;
}
function flatMat(color, off, o = {}) { const m = D.TOON ? new T.MeshToonMaterial(Object.assign({ color, gradientMap: D.mat('#fff').gradientMap }, o.map ? { map: o.map } : {})) : new T.MeshStandardMaterial(Object.assign({ color, roughness: .92 }, o)); m.polygonOffset = true; m.polygonOffsetFactor = -off; m.polygonOffsetUnits = -off; return m; }
function canvasTex(w, h, draw, rep) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; if (rep) t.repeat.set(rep, rep); t.anisotropy = 4; return t; }

/* instanced helper */
function instanced(geo, mat, list, colorFn) {
  const im = new T.InstancedMesh(geo, mat, list.length); const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
  list.forEach((it, i) => { e.set(it.rx || 0, it.ry || 0, it.rz || 0); q.setFromEuler(e); m4.compose(new T.Vector3(it.x, it.y, it.z), q, new T.Vector3(it.sx ?? it.s, it.sy ?? it.s, it.sz ?? it.s)); im.setMatrixAt(i, m4); if (colorFn) im.setColorAt(i, new T.Color(colorFn(it, i))); });
  im.castShadow = true; im.receiveShadow = true; return im;
}

/* ================================================================== */
SQ.city = function (host, CITY, opt = {}) {
  const W = CITY.size || [340, 290];
  /* graphics tier from Settings (art/sound.js): Low = 1× resolution, no soft shadows */
  const tier = window.SQS ? SQS.tier() : 'high';
  const renderer = new T.WebGLRenderer({ antialias: tier !== 'low' }); renderer.setPixelRatio(Math.min(tier === 'low' ? 1 : tier === 'medium' ? 1.5 : 1.75, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = tier !== 'low'; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.localClippingEnabled = true;
  host.appendChild(renderer.domElement); host.__r = renderer; const cv = renderer.domElement; cv.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab';
  const scene = new T.Scene(); scene.background = new T.Color('#BFE6FF'); scene.fog = new T.Fog('#CFEBFF', 260, 620);
  const cam = new T.PerspectiveCamera(30, 1, 1, 2500);
  scene.add(new T.HemisphereLight('#FFFFFF', '#B9A8D8', D.TOON ? .46 : .58)); scene.add(new T.AmbientLight('#FFF0F6', D.TOON ? .12 : .16));
  const sun = new T.DirectionalLight('#FFF4E6', D.TOON ? .62 : .8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0008; sun.shadow.normalBias = .09; scene.add(sun, sun.target);
  const world = new T.Group(); scene.add(world); host.__s = scene;
  const R = rng(CITY.seed || 7);

  /* ---------- island outline (wobbly ellipse) ---------- */
  const coastR = a => 1 + .05 * Math.sin(a * 3 + 1) + .04 * Math.sin(a * 7 + 2) + .025 * Math.sin(a * 13);
  const ratio = (x, z) => { const a = Math.atan2(z / (W[1] / 2), x / (W[0] / 2)); return Math.hypot(x / (W[0] / 2), z / (W[1] / 2)) / coastR(a); };
  const inside = (x, z, m = .95) => ratio(x, z) < m;
  const pullIn = (x, z, m = .86) => { let k = 1; while (!inside(x * k, z * k, m) && k > .2) k -= .02; return [x * k, z * k]; };

  /* ---------- polylines: roads are clipped to the island, the river runs from its lake to the sea ---------- */
  const clip = (pts, m) => { let best = [], cur = []; pts.forEach(p => { if (inside(p[0], p[1], m)) cur.push(p); else { if (cur.length > best.length) best = cur; cur = []; } }); if (cur.length > best.length) best = cur; return best; };
  const roads = CITY.roads.map(r => { const sp = spline(r.pts, r.loop); return { pts: r.loop ? sp : clip(sp, .9), w: r.w || 5, loop: !!r.loop, name: r.name }; }).filter(r => r.pts.length > 3);
  const riverRaw = spline(CITY.river.pts, false, 2.5), riverW = CITY.river.w || 9;
  const river = []; for (const p of riverRaw) { river.push(p); if (ratio(p[0], p[1]) > 1.1) break; }
  roads.forEach(r => { if (r.loop) return; const near = p => nearest(p, river).d < riverW / 2 + r.w * 1.25 + 5; while (r.pts.length > 4 && near(r.pts[r.pts.length - 1])) r.pts.pop(); while (r.pts.length > 4 && near(r.pts[0])) r.pts.shift(); });
  const bridgeBump = (x, z) => { const n = nearest([x, z], river); return n.d < 11 ? 1.3 * Math.cos(n.d / 11 * PI / 2) ** 2 : 0; };
  // where the river meets the beach it tips over the edge into the sea
  const riverDrop = (x, z) => { const r = ratio(x, z); return r < 1.055 ? 0 : -Math.min(1.3, (r - 1.055) / .03 * 1.3); };

  /* ---------- ground: island, sand, sea ---------- */
  const coast = []; for (let i = 0; i < 96; i++) { const a = i / 96 * PI * 2, r = coastR(a); coast.push([Math.cos(a) * W[0] / 2 * r, Math.sin(a) * W[1] / 2 * r]); }
  const shape = pts => new T.Shape(pts.map(p => new T.Vector2(p[0], -p[1])));
  const grassTex = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#9ED67E'; x.fillRect(0, 0, w, h); const r2 = rng(3); for (let i = 0; i < 160; i++) { x.fillStyle = r2() < .5 ? 'rgba(126,196,96,.35)' : 'rgba(186,232,150,.35)'; x.beginPath(); x.arc(r2() * w, r2() * h, 6 + r2() * 22, 0, 7); x.fill(); } for (let i = 0; i < 260; i++) { x.fillStyle = ['#FFFFFF', '#FFD54A', '#FF9EC0', '#B48CFF'][i % 4]; x.fillRect(r2() * w, r2() * h, 1.6, 1.6); } });
  grassTex.repeat.set(1 / 34, 1 / 34);
  const ground = new T.Mesh(new T.ShapeGeometry(shape(coast), 48), flatMat('#FFFFFF', 0, { map: grassTex })); ground.rotation.x = -PI / 2; ground.receiveShadow = true; world.add(ground);
  const sandPts = coast.map(p => [p[0] * 1.06, p[1] * 1.07]);
  const sand = new T.Mesh(new T.ShapeGeometry(shape(sandPts), 48), flatMat('#F6E2B3', 0)); sand.rotation.x = -PI / 2; sand.position.y = -.25; sand.receiveShadow = true; sand.userData.noOutline = true; world.add(sand);
  const cliff = new T.Mesh(new T.ExtrudeGeometry(shape(sandPts), { depth: 2.4, bevelEnabled: false, curveSegments: 48 }), new T.MeshStandardMaterial({ color: '#E3C690', roughness: 1 })); cliff.rotation.x = -PI / 2; cliff.position.y = -2.65; world.add(cliff);
  const waveTex = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#7FD3F0'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 3; x.lineCap = 'round'; const r3 = rng(9); for (let i = 0; i < 26; i++) { const cx = r3() * w, cy = r3() * h; x.beginPath(); x.arc(cx, cy, 10, PI * 1.15, PI * 1.85); x.stroke(); } }, 30);
  const sea = new T.Mesh(new T.PlaneGeometry(2400, 2400), new T.MeshStandardMaterial({ map: waveTex, roughness: .3 })); sea.rotation.x = -PI / 2; sea.position.y = -1.2; D.anim(sea, 'water'); world.add(sea);

  /* ---------- river ---------- */
  const riverTex = canvasTex(64, 256, (x, w, h) => { x.fillStyle = '#7FD3F0'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 3; for (let i = 0; i < 8; i++) { const y = i * 32 + 8; x.beginPath(); x.moveTo(10 + (i % 2) * 20, y); x.lineTo(30 + (i % 2) * 20, y + 6); x.stroke(); } });
  const riverIn = river.filter(p => ratio(p[0], p[1]) < 1.0);
  world.add(ribbon(riverIn, riverW + 5, .03, flatMat('#E9D29E', 1)), D.anim(ribbon(river, riverW, .06, flatMat('#7FD3F0', 2, { map: riverTex, roughness: .3 }), riverDrop), 'water'));
  // the lake the river starts from
  { const s0 = river[0], lr = CITY.river.lake || 10, lake = G(at(D.disc(lr + 2, '#E9D29E', 40), 0, .05, 0, -PI / 2, 0, 0), D.anim(at(D.disc(lr, D.mat('#7FD3F0', { r: .25 }), 40), 0, .09, 0, -PI / 2, 0, 0), 'none'));
    for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2; lake.add(at(ball(.9 + (i % 3) * .25, '#D6D0E0', 1.2, .5, 1), Math.cos(a) * (lr + 1.4), .2, Math.sin(a) * (lr + 1.4))); }
    for (let i = 0; i < 7; i++) { const a = i * .9 + .3, rr = lr * (.35 + (i % 3) * .2); lake.add(at(cyl(1, 1, .08, '#7ED36A', 12), Math.cos(a) * rr, .14, Math.sin(a) * rr)); if (i % 2) lake.add(at(ball(.28, '#FF9EC0'), Math.cos(a) * rr, .3, Math.sin(a) * rr)); }
    for (let i = 0; i < 10; i++) { const a = PI * .9 + i * .14; lake.add(at(cyl(.08, .08, 2.2, '#6F9A4A', 5), Math.cos(a) * (lr + .4), 1.1, Math.sin(a) * (lr + .4)), at(D.ball(.18, '#8A5A3A', 1, 2, 1), Math.cos(a) * (lr + .4), 2.2, Math.sin(a) * (lr + .4))); }
    const duck = G(at(ball(.8, '#FFFFFF', 1.3, .8, 1), 0, .3, 0), at(ball(.5, '#FFFFFF'), .8, .9, 0), at(cone(.2, .5, '#FFB833', 8), 1.35, .85, 0, 0, 0, -PI / 2)); D.anim(duck, 'bob'); lake.add(at(duck, lr * .35, .1, -lr * .2));
    world.add(at(lake, s0[0], 0, s0[1])); }
  // splash where the river falls into the sea
  { const end = river[river.length - 1]; for (let i = 0; i < 6; i++) world.add(D.anim(at(ball(.6 + (i % 3) * .3, D.mat('#FFFFFF', { op: .85 })), end[0] + (i - 2.5) * 1.3, -1.1, end[1] + (i % 2) * 1.2), 'bob', { ph: i * .5 })); }

  /* ---------- roads, roundabouts, dashes, bridges ---------- */
  const asphalt = flatMat('#8E89A6', 4), walk = flatMat('#EAE4F2', 3), dashM = new T.MeshStandardMaterial({ color: '#FFFFFF', roughness: .8 });
  roads.forEach(r => { world.add(ribbon(r.pts, r.w + 2.4, .1, walk, bridgeBump, r.loop), ribbon(r.pts, r.w, .14, asphalt, bridgeBump, r.loop)); });
  const rbs = (CITY.roundabouts || []).map(rb => { if (!rb.snap) return rb; const n = nearest([rb.x, rb.z], roads.flatMap(r => r.pts)); return Object.assign({}, rb, { x: n.p[0], z: n.p[1] }); });
  rbs.forEach(rb => {
    const ringW = rb.w || 6, o = rb.r + ringW / 2, inner = rb.r - ringW / 2;
    const ring = (r1, r2, y, m) => { const me = new T.Mesh(new T.RingGeometry(r1, r2, 64), m); me.rotation.x = -PI / 2; me.position.set(rb.x, y, rb.z); me.receiveShadow = true; return me; };
    world.add(ring(inner - 1.5, o + 1.5, .12, walk), ring(inner, o, .16, flatMat('#8E89A6', 6)));
    const isl = at(cyl(inner - 1.3, inner - 1.1, .7, '#8FCB6E', 40), rb.x, .35, rb.z); isl.receiveShadow = true; world.add(isl, at(D.torus(inner - 1.2, .25, '#FFFFFF', PI * 2, 6, 48), rb.x, .7, rb.z, PI / 2, 0, 0));
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; world.add(D.flower(rb.x + Math.cos(a) * (inner - 2.4), rb.z + Math.sin(a) * (inner - 2.4), ['#FF7AA8', '#FFD54A', '#B48CFF'][i % 3], .9).translateY(.7)); }
    if (rb.center === 'fountain') {
      const f = G(D.lathe([[0, 0], [5.4, 0], [5.6, 1], [5, 1.2], [4.8, .8], [0, .8]], '#C9D3E2', 40, false), at(D.disc(4.8, D.mat('#8FD3FF', { r: .2 })), 0, .95, 0, -PI / 2, 0, 0), at(cyl(.8, 1.1, 3.4, '#C9D3E2', 20), 0, 2.4, 0), D.lathe([[0, 0], [2.6, 0], [2.8, .6], [2.4, .7], [0, .5]], '#C9D3E2', 30, false).translateY(4), at(cyl(.4, .5, 2, '#C9D3E2', 12), 0, 5.4, 0));
      for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, dr = G(at(ball(.35, D.mat('#BFE6F7', { op: .8 })), 0, 0, 0)); D.anim(dr, 'hop', { ph: i * .22, amp: 1.2 }); f.add(at(dr, Math.cos(a) * 3.4, 1.2, Math.sin(a) * 3.4)); }
      f.add(D.anim(at(ball(.7, D.mat('#BFE6F7', { op: .8 })), 0, 6.8, 0), 'bob'));
      world.add(at(f, rb.x, .7, rb.z));
      // banner
      const ban = D.sign('Welcome to Squishy Island', 18, 2.6, { bg: '#FF6FA3', fg: '#FFFFFF' }); world.add(at(G(at(cyl(.2, .2, 9, '#5A5170', 8), -9.4, 4.5, 0), at(cyl(.2, .2, 9, '#5A5170', 8), 9.4, 4.5, 0), at(box(19, 3, .3, '#FF6FA3', .1), 0, 7.6, 0), at(ban, 0, 7.6, .17), at(ban.clone(), 0, 7.6, -.17, 0, PI, 0)), rb.x, .7, rb.z - inner + 3.2));
    } else if (rb.center === 'statue') {
      const st = G(at(cyl(2.6, 3, 2.4, '#C9D3E2', 24), 0, 1.2, 0), at(D.squishy('bao', 6), 0, 2.4, 0)); st.children[1].traverse(m => { if (m.isMesh && m.material.color) { const c = m.material.color.getHex(); if (c !== 0x3a2740 && c !== 0xffffff) m.material = D.mat('#FFD54A', { m: .5, r: .3 }); } });
      world.add(at(st, rb.x, .7, rb.z));
    }
  });
  // turning circles where a road ends (instead of stopping abruptly)
  const ends = [];
  roads.forEach((r, ri) => { if (r.loop) return; [r.pts[0], r.pts[r.pts.length - 1]].forEach(p => { const joined = roads.some((q, qi) => qi !== ri && q.pts.some(t => Math.hypot(t[0] - p[0], t[1] - p[1]) < q.w)) || rbs.some(rb => Math.hypot(rb.x - p[0], rb.z - p[1]) < rb.r + 6); if (!joined) ends.push([p[0], p[1], r.w]); }); });
  ends.forEach(([x, z, w]) => { const c1 = new T.Mesh(new T.CircleGeometry(w * 1.25 + 1.2, 36), walk), c2 = new T.Mesh(new T.CircleGeometry(w * 1.25, 36), asphalt); [c1, c2].forEach((m, i) => { m.rotation.x = -PI / 2; m.position.set(x, .1 + i * .04, z); m.receiveShadow = true; m.userData.noOutline = true; world.add(m); }); world.add(at(G(at(D.box(1.4, 1.6, .3, '#FFFFFF', .1), 0, .8, 0), at(D.cube(1.42, .4, .32, '#FF6F7D'), 0, 1.1, 0)), x, 0, z)); });

  // lane dashes
  const dashes = [];
  roads.forEach(r => { let acc = 0; const P = r.loop ? r.pts.concat([r.pts[0]]) : r.pts; for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += l; if (acc < 5) continue; acc = 0; if (rbs.some(rb => Math.hypot(b[0] - rb.x, b[1] - rb.z) < rb.r + 5)) continue; dashes.push({ x: b[0], y: .2 + bridgeBump(b[0], b[1]), z: b[1], ry: Math.atan2(b[0] - a[0], b[1] - a[1]), s: 1, sx: .3, sy: .04, sz: 1.8 }); } });
  world.add(instanced(new T.BoxGeometry(1, 1, 1), dashM, dashes));
  // bridges: railings where roads cross the river
  const rails = [];
  roads.forEach(r => r.pts.forEach((p, i) => { const n = nearest(p, river); if (n.d > riverW / 2 + 2.5) return; const b = r.pts[Math.min(i + 1, r.pts.length - 1)], a = r.pts[Math.max(0, i - 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; [-1, 1].forEach(k => rails.push({ x: p[0] - tz * k * (r.w / 2 + 1.2), y: bridgeBump(p[0], p[1]) + .8, z: p[1] + tx * k * (r.w / 2 + 1.2), ry: Math.atan2(tx, tz), s: 1, sx: .35, sy: 1, sz: 2.4 })); }));
  if (rails.length) world.add(instanced(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: '#FFFFFF', roughness: .7 }), rails));

  /* ---------- obstacle grid (keeps trees off roads and plots) ---------- */
  const cell = 2, gx = Math.ceil(W[0] * 1.2 / cell), gz = Math.ceil(W[1] * 1.2 / cell), grid = new Uint8Array(gx * gz);
  const toCell = (x, z) => [Math.floor((x + W[0] * .6) / cell), Math.floor((z + W[1] * .6) / cell)];
  const block = (x, z, r) => { const [cx, cz] = toCell(x, z), rr = Math.ceil(r / cell); for (let i = -rr; i <= rr; i++) for (let j = -rr; j <= rr; j++) { if (i * i + j * j > rr * rr) continue; const a = cx + i, b = cz + j; if (a >= 0 && b >= 0 && a < gx && b < gz) grid[b * gx + a] = 1; } };
  const free = (x, z) => { const [cx, cz] = toCell(x, z); return cx >= 0 && cz >= 0 && cx < gx && cz < gz && !grid[cz * gx + cx]; };
  roads.forEach(r => r.pts.forEach(p => block(p[0], p[1], r.w / 2 + 3)));
  river.forEach(p => block(p[0], p[1], riverW / 2 + 4)); block(river[0][0], river[0][1], (CITY.river.lake || 10) + 4); ends.forEach(([x, z, w]) => block(x, z, w * 1.25 + 3));
  rbs.forEach(rb => block(rb.x, rb.z, rb.r + 5));

  /* ---------- buildings (placed + facing their road) ---------- */
  const allRoad = roads.flatMap(r => r.pts);
  const slots = CITY.buildings.map(b => {
    const n = nearest([b.x, b.z], allRoad), ry = b.ry != null ? b.ry : (CITY.face === 'road' ? Math.atan2(n.p[0] - b.x, n.p[1] - b.z) : (CITY.yaw || 0)) + (b.turn || 0);
    const bs = CITY.buildingScale || 1; block(b.x, b.z, 17 * bs); for (let k = 11 * bs; k <= 22; k += 3) for (const sx of [-9, 0, 9]) block(b.x + Math.sin(ry) * k + Math.cos(ry) * sx, b.z + Math.cos(ry) * k - Math.sin(ry) * sx, 4);
    // driveway from the plot front to the road
    const fx = b.x + Math.sin(ry) * 11 * bs, fz = b.z + Math.cos(ry) * 11 * bs;
    const path = [[fx, fz], [(fx + n.p[0]) / 2, (fz + n.p[1]) / 2], n.p];
    world.add(ribbon(spline(path, false, 1), 3.6, .08, flatMat('#E2D6C3', 2)));
    path.forEach(p => block(p[0], p[1], 3));
    return Object.assign({ ry }, b);
  });


  /* ---------- extra little houses that fill the town blocks + parked cars ---------- */
  (function () {
    const extra = [];
    roads.forEach((r, ri) => { if (r.w < 4.5) return; const P = r.pts; let acc = 0; for (let i = 1; i < P.length; i++) { acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (acc < 13) continue; acc = 0; const b = P[i], a = P[i - 1]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; const nz = tx > 0 ? 1 : -1; const off = 14 + R() * 4, x = b[0] - tz * nz * off, z = b[1] + tx * nz * off; if (R() < .78 && free(x, z) && free(x - 5, z) && free(x + 5, z) && inside(x, z, .9)) { extra.push({ auto: true, kind: ['cottage', 'cottage', 'shop', 'tower'][Math.floor(R() * 4)], x, z, w: 8 + R() * 3 }); block(x, z, 7); } } });
    CITY.fillers = (CITY.fillers || []).concat(extra);
    const cars = []; roads.forEach(r => { const P = r.pts; for (let i = 8; i < P.length - 8; i += 26 + Math.floor(R() * 20)) { const b = P[i], a = P[i - 1]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; const side = R() < .5 ? -1 : 1, x = b[0] - tz * side * (r.w / 2 + .2), z = b[1] + tx * side * (r.w / 2 + .2); if (rbs.some(q => Math.hypot(q.x - x, q.z - z) < q.r + 6) || nearest([x, z], river).d < riverW) continue; cars.push({ x, z, ry: Math.atan2(tx, tz) + PI / 2 }); } });
    const CC = ['#FF8FB8', '#7FB8FF', '#FFD54A', '#7ED3B2', '#B48CFF', '#FF8A5C'];
    cars.forEach((c, i) => { const col = CC[i % CC.length]; const car = G(at(box(4.2, 1.4, 2.2, col, .55), 0, .95, 0), at(box(2.4, 1.2, 2, col, .5), -.2, 2, 0), at(D.cube(2.2, .8, 2.04, D.mat('#BFE6F7')), -.2, 2.05, 0), ...[[-1.3, 1.05], [1.3, 1.05], [-1.3, -1.05], [1.3, -1.05]].map(([x, z]) => at(cyl(.45, .45, .3, '#4A4458', 12), x, .45, z, PI / 2, 0, 0)), at(D.ball(.18, '#FFF3B0'), 2.1, 1.1, .6), at(D.ball(.18, '#FFF3B0'), 2.1, 1.1, -.6)); world.add(at(car, c.x, .1, c.z, 0, c.ry, 0)); block(c.x, c.z, 3); });
  })();

  /* ---------- background houses (not clickable, they just make it feel like a town) ---------- */
  const FW = ['#FFE3EE', '#E3F2FF', '#FFF3C4', '#E6FFE9', '#F1E6FF', '#FFE8D6', '#FFFFFF'], FR = ['#FF8FB8', '#7FB8FF', '#FFB84A', '#7ED3B2', '#B48CFF', '#FF8A5C', '#E5484D'];
  (CITY.fillers || []).forEach((f, i) => {
    if (!f.auto && (!inside(f.x, f.z, .9) || ![[0, 0], [-4, 0], [4, 0], [0, -3], [0, 3]].every(([a, b]) => free(f.x + a, f.z + b)))) return;
    const w = (f.w || 12) * .68, h = w * (.66 + R() * .3), dp = w * .7, wall = FW[Math.floor(R() * FW.length)], roof = D.mix(FR[Math.floor(R() * FR.length)], '#FFFFFF', .28);
    const c = D.ctx({ cur: FR[(i + 2) % FR.length] }, 8, false), g = G();
    g.add(at(box(w + 3, .6, dp + 4, '#9ED67E', .25), 0, -.25, 0));
    if (f.kind === 'tower') {
      const r = w * .38; g.add(at(cyl(r, r * 1.05, h * 1.3, wall, 24), 0, h * .65, 0), at(cone(r * 1.35, h * .8, roof, 24), 0, h * 1.3 + h * .38, 0), at(D.ball(.5, '#FFD54A'), 0, h * 1.72 + .3, 0));
      g.add(c.win(0, h * .95, r + .05, 1.6, 1.6, { r: 1 }), c.door(0, 0, r + .05, 2, 3.4, roof));
    } else if (f.kind === 'shop') {
      g.add(at(box(w, h, dp, wall, .3), 0, h / 2, 0), at(box(w + .6, .7, dp + .6, roof, .2), 0, h + .2, 0), at(D.awning3(w - 1, 1.6, [roof, '#FFFFFF'], .5), 0, h * .62, dp / 2 + .1));
      g.add(c.win(-w * .22, h * .32, dp / 2 + .05, w * .3, h * .3, { noBox: 1 }), c.door(w * .22, 0, dp / 2 + .05, 2, 3.4, roof, { arch: false }));
      g.add(at(box(w * .5, 1.2, .3, '#FFFFFF', .1), 0, h + 1.1, dp / 2 - .3));
    } else {
      g.add(at(box(w, h, dp, wall, .3), 0, h / 2, 0), at(D.slab([[-w / 2 - .7, 0], [w / 2 + .7, 0], [0, h * .62]], dp + 1.2, roof, .15), 0, h - .1, 0), at(box(1.2, 2.6, 1.2, D.dk(roof, .25), .1), w * .25, h + h * .4, -dp * .15));
      g.add(c.win(-w * .27, h * .55, dp / 2 + .05, w * .2, w * .18), c.win(w * .27, h * .55, dp / 2 + .05, w * .2, w * .18), c.door(0, 0, dp / 2 + .05, 2, 3.4, roof));
      if (R() < .5) g.add(D.flowerBed(-w * .3, dp / 2 + 1.4, w * .3), D.flowerBed(w * .3, dp / 2 + 1.4, w * .3));
    }
    if (R() < .4) g.add(D.mailbox(w / 2 + .8, dp / 2 + 1.4, roof));
    world.add(D.finish(at(g, f.x, 0, f.z, 0, (CITY.yaw || 0) + (f.turn ?? (R() - .5) * .4), 0)));
    block(f.x, f.z, w * .8);
  });

  /* ---------- parks, ponds, fields, hills ---------- */
  const areaFree = (x, z, r) => { if (!free(x, z)) return false; for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; if (!free(x + Math.cos(a) * r, z + Math.sin(a) * r)) return false; } return true; };
  const findFree = (x, z, r, m = .88) => { for (let d = 0; d <= 40; d += 2) for (let k = 0; k < (d ? 12 : 1); k++) { const a = k / 12 * PI * 2, xx = x + Math.cos(a) * d, zz = z + Math.sin(a) * d; if (inside(xx, zz, m) && areaFree(xx, zz, r)) return [xx, zz]; } return null; };
  const inl = (o, m, r) => { let [x, z] = pullIn(o.x, o.z, m); if (r) { const f = findFree(x, z, r, m); if (!f) return null; [x, z] = f; } return Object.assign({}, o, { x, z }); };
  (CITY.parks || []).map(p => inl(p, .85, p.r * .7)).filter(Boolean).forEach(p => { block(p.x, p.z, p.r * .6); const d = new T.Mesh(new T.CircleGeometry(p.r, 48), flatMat('#B4E494', 1)); d.rotation.x = -PI / 2; d.position.set(p.x, .05, p.z); d.receiveShadow = true; world.add(d); for (let i = 0; i < (p.benches || 4); i++) { const a = i / (p.benches || 4) * PI * 2 + .4, x = p.x + Math.cos(a) * p.r * .8, z = p.z + Math.sin(a) * p.r * .8; if (free(x, z)) { world.add(D.bench(x, z, -a - PI / 2)); world.add(D.lamp(x + Math.cos(a + .3) * 3, z + Math.sin(a + .3) * 3, true)); block(x, z, 3); } } });
  (CITY.ponds || []).map(p => inl(p, .84, p.r + 2)).filter(Boolean).forEach(p => {
    const pond = G(at(D.disc(p.r + 1.4, '#E9D29E', 40), 0, .07, 0, -PI / 2, 0, 0)), water = at(D.disc(p.r, D.mat('#7FD3F0', { r: .25 }), 40), 0, .12, 0, -PI / 2, 0, 0);
    pond.add(water); for (let i = 0; i < 6; i++) { const a = i * 1.1, rr = p.r * (.3 + .5 * ((i * 37) % 10) / 10); pond.add(at(cyl(.9, .9, .08, '#7ED36A', 12), Math.cos(a) * rr, .16, Math.sin(a) * rr)); if (i % 2) pond.add(at(ball(.25, '#FF9EC0'), Math.cos(a) * rr, .3, Math.sin(a) * rr)); }
    for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; pond.add(at(ball(.7 + (i % 3) * .2, '#D6D0E0', 1.2, .5, 1), Math.cos(a) * (p.r + 1), .2, Math.sin(a) * (p.r + 1))); }
    const duck = G(at(ball(.8, '#FFFFFF', 1.3, .8, 1), 0, .3, 0), at(ball(.5, '#FFFFFF'), .8, .9, 0), at(cone(.2, .5, '#FFB833', 8), 1.35, .85, 0, 0, 0, -PI / 2)); D.anim(duck, 'bob'); pond.add(at(duck, p.r * .3, .1, -p.r * .2));
    world.add(at(pond, p.x, 0, p.z)); block(p.x, p.z, p.r + 2);
  });
  (CITY.fields || []).map(f => inl(f, .8, Math.max(f.w, f.d) / 2)).filter(Boolean).forEach(f => { const g = G(); for (let i = 0; i < f.rows; i++) { g.add(at(box(f.w, .5, 1.6, '#B5764A', .2), 0, .25, -f.d / 2 + i * f.d / f.rows)); for (let k = 0; k < f.w / 2.2; k++) g.add(at(ball(.75, f.crop || '#7ED36A', 1, .8, 1, 10), -f.w / 2 + 1 + k * 2.2, .9, -f.d / 2 + i * f.d / f.rows)); } world.add(at(g, f.x, 0, f.z, 0, f.ry || 0, 0)); block(f.x, f.z, Math.max(f.w, f.d) / 2 + 2); });
  (CITY.hills || []).forEach(h => { const hl = at(ball(h.r, h.snow ? '#9FCB8E' : '#8BCB6C', 1, h.h / h.r, 1, 28), h.x, -1, h.z); world.add(hl); if (h.snow) world.add(at(cone(h.r * .38, h.h * .5, '#FFFFFF', 20), h.x, h.h * .78, h.z)); block(h.x, h.z, h.r * .95); });

  /* ---------- decorations ---------- */
  (CITY.deco || []).map(d => d.sea || d.coast || d.y > 5 ? d : inl(d, .9, d.r || 3)).filter(Boolean).forEach(d => {
    let o = null;
    if (d.type === 'lighthouse') { o = G(at(cyl(2, 2.6, 14, '#FFFFFF', 20), 0, 7, 0), ...[2, 6, 10].map(y => at(cyl(2.25 - y * .03, 2.4 - y * .03, 1.6, '#FF6F7D', 20), 0, y, 0)), at(cyl(2.4, 2.4, .5, '#5A5170', 20), 0, 14.2, 0), at(cyl(1.5, 1.5, 2, D.mat('#FFE58A', { e: '#FFD54A', ei: .9 }), 16), 0, 15.4, 0), at(cone(2.2, 2.2, '#FF6F7D', 20), 0, 17.5, 0)); const beam = at(cone(1.2, 10, D.mat('#FFF3B0', { op: .25 }), 12), 5, 15.4, 0, 0, 0, PI / 2); const bg = G(beam); D.anim(bg, 'spin', { sp: .9 }); o.add(at(bg, 0, 0, 0)); }
    if (d.type === 'boat') { o = G(at(box(6, 1.4, 2.4, '#FF8A5C', .5), 0, .6, 0), at(cyl(.12, .12, 6, '#8A6A4E', 6), 0, 4, 0), at(D.slab([[0, 0], [0, 4.6], [3, .2]], .1, '#FFFFFF', 0), .2, 1.6, 0)); D.anim(o, 'drift'); }
    if (d.type === 'balloon') { o = G(at(ball(4, '#FF6FA3', 1, 1.15, 1), 0, 0, 0), ...[0, 1, 2, 3].map(i => at(D.cube(.4, 8.2, .1, '#FFFFFF'), Math.cos(i * PI / 2) * 4.02, 0, Math.sin(i * PI / 2) * 4.02, 0, -i * PI / 2, 0)), at(box(2.2, 1.6, 2.2, '#C98A55', .3), 0, -6.4, 0), D.place('puff', 0, -5.8, 0, 1.6, 'none', { shadow: false })); D.anim(o, 'float'); }
    if (d.type === 'windmill') { o = G(at(cyl(1.4, 2, 12, '#FFF1DC', 10), 0, 6, 0), at(cone(2.2, 2.4, '#C98A55', 10), 0, 13.2, 0)); const bl = G(); [0, 1, 2, 3].forEach(i => bl.add(at(G(at(box(1.4, 6, .2, '#FFFFFF', .05), 0, 3.4, 0)), 0, 0, 0, 0, 0, i * PI / 2))); D.anim(bl, 'spinz', { sp: 1 }); o.add(at(bl, 0, 11, 2)); }
    if (d.type === 'umbrella') o = G(at(cyl(.1, .1, 4, '#8A6A4E', 6), 0, 2, 0), at(cone(2.4, 1.1, d.color || '#FF6F7D', 14), 0, 4.2, 0), at(D.towel(3, d.color || '#FF6F7D'), 1.6, 0, 1.6));
    if (d.type === 'bus') { o = G(at(box(9, 4.2, 4, '#FFB833', 1.1), 0, 2.6, 0), ...[0, 1, 2, 3].map(i => at(D.cube(1.5, 1.4, 4.04, D.mat('#BFE6F7', { r: .2 })), -3 + i * 2, 3.1, 0)), ...[[-2.8, 2], [2.8, 2], [-2.8, -2], [2.8, -2]].map(([x, z]) => at(cyl(.8, .8, .5, '#4A4458', 14), x, .8, z, PI / 2, 0, 0))); D.anim(o, 'drift'); }
    if (d.type === 'sign') { const s = D.sign(d.text, d.text.length * .62 + 1.6, 1.4, { bg: '#4FAF72', fg: '#FFFFFF' }); o = G(at(cyl(.12, .12, 4, '#5A5170', 6), 0, 2, 0), at(box(d.text.length * .62 + 1.9, 1.7, .2, '#2B2141', .08), 0, 4, 0), at(s, 0, 4, .12)); }
    if (d.type === 'statue') o = G(at(cyl(2, 2.4, 1.6, '#C9D3E2', 20), 0, .8, 0), at(D.squishy(d.who || 'luckycat', 4), 0, 1.6, 0));
    if (d.type === 'picnic') o = G(at(D.box(4, .1, 4, '#FF8FB8', .05), 0, .06, 0), at(D.cube(4.02, .11, .5, '#FFFFFF'), 0, .07, 0), at(D.cube(.5, .11, 4.02, '#FFFFFF'), 0, .07, 0), at(box(1.4, .8, 1, '#C98A55', .2), .8, .4, -.6));
    if (d.type === 'kite') { o = G(at(D.slab([[0, 1.4], [1, 0], [0, -1.6], [-1, 0]], .1, '#FFD54A', 0), 0, 0, 0), D.tube([[0, -1.6, 0], [-1, -4, .4], [-3, -9, 1], [-4, -16, 2]], .03, '#9A8FAA')); D.anim(o, 'sway'); }
    if (o) { world.add(at(o, d.x, d.y || 0, d.z, 0, d.ry || 0, 0)); block(d.x, d.z, d.r || 4); }
  });
  // street lamps along roads
  roads.forEach((r, ri) => { let acc = 0, side = 1; const P = r.pts; for (let i = 1; i < P.length; i++) { acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (acc < 44) continue; acc = 0; side *= -1; const b = P[i], a = P[i - 1]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; const x = b[0] - tz * side * (r.w / 2 + 2.2), z = b[1] + tx * side * (r.w / 2 + 2.2); if (!free(x, z) && !roads.some(() => false)) { const near = slots.some(s => Math.hypot(s.x - x, s.z - z) < 16) || rbs.some(rb => Math.hypot(rb.x - x, rb.z - z) < rb.r + 4) || nearest([x, z], river).d < riverW / 2 + 3; if (near) continue; } world.add(D.lamp(x, z, true)); } });
  // street names
  roads.forEach(r => { if (!r.name) return; const p = r.pts[Math.floor(r.pts.length * .15)], q = r.pts[Math.floor(r.pts.length * .15) + 1]; let tx = q[0] - p[0], tz = q[1] - p[1]; const l = Math.hypot(tx, tz) || 1; const x = p[0] + tz / l * (r.w / 2 + 3), z = p[1] - tx / l * (r.w / 2 + 3); const s = D.sign(r.name, r.name.length * .62 + 1.6, 1.4, { bg: '#4FAF72', fg: '#FFFFFF' }); world.add(at(G(at(cyl(.12, .12, 4, '#5A5170', 6), 0, 2, 0), at(box(r.name.length * .62 + 1.9, 1.7, .2, '#2B2141', .08), 0, 4, 0), at(s, 0, 4, .12), at(s.clone(), 0, 4, -.12, 0, PI, 0)), x, 0, z, 0, Math.atan2(tx, tz) + PI / 2, 0)); block(x, z, 2); });

  /* ---------- avenue trees + hedges along every street ---------- */
  const avenue = [];
  roads.forEach(r => { let acc = 0, k = 0; const P = r.pts; for (let i = 1; i < P.length; i++) { acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (acc < 13) continue; acc = 0; k++; const b = P[i], a = P[i - 1]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; for (const side of [-1, 1]) { const off = r.w / 2 + 4.6, x = b[0] - tz * side * off, z = b[1] + tx * side * off; if (free(x, z) && inside(x, z, .92)) avenue.push({ x, z, side, k }); } } });
  /* ---------- forests + scattered nature (instanced) ---------- */
  const trees = [], pines = [], bushes = [], flowers = [], rocks = [];
  const tryPlace = (x, z, kind) => { if (!inside(x, z, .93) || !free(x, z)) return false; const s = .8 + R() * .7; if (kind === 'pine') pines.push({ x, z, s }); else if (kind === 'tree') trees.push({ x, z, s, c: ['#69C46A', '#7FD07A', '#5BB85C', '#8BD36C', '#F0A6C8'][Math.floor(R() * (R() < .1 ? 5 : 4))] }); else if (kind === 'bush') bushes.push({ x, z, s: .7 + R() * .6 }); block(x, z, kind === 'bush' ? 1.5 : 3.4 * s); return true; };
  avenue.forEach(a => { if ((a.k + (a.side > 0 ? 1 : 0)) % 2) { if (free(a.x, a.z)) { trees.push({ x: a.x, z: a.z, s: .62 + R() * .2, c: ['#69C46A', '#7FD07A', '#F0A6C8', '#8BD36C'][Math.floor(R() * 4)] }); block(a.x, a.z, 2.6); } } else if (free(a.x, a.z)) { bushes.push({ x: a.x, z: a.z, s: .8 }); block(a.x, a.z, 1.4); } });
  (CITY.forests || []).forEach(f => { for (let k = 0; k < f.n; k++) { const a = R() * PI * 2, r = Math.sqrt(R()) * f.r; tryPlace(f.x + Math.cos(a) * r, f.z + Math.sin(a) * r, f.pine && R() < f.pine ? 'pine' : 'tree'); } });
  for (let k = 0; k < (CITY.scatter || 260); k++) { const x = (R() - .5) * W[0], z = (R() - .5) * W[1]; const u = R(); tryPlace(x, z, u < .35 ? 'tree' : u < .5 ? 'pine' : 'bush'); }
  for (let k = 0; k < 900; k++) { const x = (R() - .5) * W[0], z = (R() - .5) * W[1]; if (inside(x, z, .94) && free(x, z)) flowers.push({ x, y: .45, z, s: 1, c: ['#FF7AA8', '#FFD54A', '#B48CFF', '#FFFFFF', '#FF8A5C'][k % 5] }); }
  for (let k = 0; k < 40; k++) { const x = (R() - .5) * W[0], z = (R() - .5) * W[1]; if (inside(x, z, .96) && free(x, z)) rocks.push({ x, y: .2, z, s: .6 + R(), sy: .4 + R() * .3, ry: R() * 3 }); }
  const trunkG = new T.CylinderGeometry(.35, .45, 2.6, 8); trunkG.translate(0, 1.3, 0);
  const canopyG = new T.SphereGeometry(1.9, 12, 8); canopyG.translate(0, 3.7, 0);
  const pineG = new T.ConeGeometry(1.8, 5.4, 10); pineG.translate(0, 3.8, 0);
  world.add(instanced(trunkG, D.mat('#A0714A'), trees.concat(pines).map(t => Object.assign({ y: 0 }, t))));
  world.add(instanced(canopyG, new T.MeshStandardMaterial({ roughness: .7 }), trees.map(t => Object.assign({ y: 0 }, t)), t => t.c));
  world.add(instanced(pineG, new T.MeshStandardMaterial({ roughness: .7 }), pines.map(t => Object.assign({ y: 0 }, t)), (t, i) => ['#4FAF72', '#5BBF7E', '#3E9A65'][i % 3]));
  world.add(instanced(new T.SphereGeometry(1, 10, 8), new T.MeshStandardMaterial({ roughness: .75 }), bushes.map(b => Object.assign({ y: b.s * .6, sy: b.s * .8 }, b)), (b, i) => ['#6CC56B', '#7FD07A', '#5BB85C'][i % 3]));
  if (flowers.length) { const fl = instanced(new T.SphereGeometry(.32, 6, 5), new T.MeshStandardMaterial({ roughness: .6 }), flowers, f => f.c); fl.userData.noOutline = true; fl.castShadow = false; world.add(fl); }
  if (rocks.length) world.add(instanced(new T.DodecahedronGeometry(1), new T.MeshStandardMaterial({ color: '#D6D0E0', roughness: .9, flatShading: true }), rocks));

  D.outline(D.optimize(world));

  /* ---------- floating clouds ---------- */
  for (let k = 0; k < 10; k++) { const a = PI + k / 9 * PI + R() * .2, x = Math.cos(a) * W[0] * .62, z = Math.sin(a) * W[1] * .66, c = G(); for (let j = 0; j < 5; j++) c.add(at(ball(4 + R() * 3, D.mat('#FFFFFF', { op: .9 })), j * 4 - 8, R() * 2, R() * 4 - 2)); c.traverse(m => { if (m.isMesh) m.castShadow = false; }); D.anim(c, 'drift', { ph: k }); world.add(at(c, x, 30 + R() * 14, z)); }

  /* ---------- buildings layer (rebuilt when the progress preview changes) ---------- */
  let bLayer = null, anims = [], picks = [];
  const labels = document.createElement('div'); labels.className = 'map-labels'; host.appendChild(labels);
  function setState(state) {
    if (bLayer) world.remove(bLayer);
    bLayer = new T.Group(); picks = []; labels.innerHTML = '';
    slots.forEach(s => {
      const d = SQ.B[s.id]; if (!d) return;
      const L = state.level(s.id), house = d.type === 'house';
      const keep = D.SIZE; D.SIZE = CITY.squishySize || 2.1; const b = D.building(s.id, house ? Math.max(1, L) : L, { life: true, owned: state.owned(s.id) }); D.SIZE = keep;
      b.position.set(s.x, 0, s.z); b.rotation.y = s.ry; b.scale.setScalar(CITY.buildingScale || 1); b.userData.bid = s.id; bLayer.add(b); picks.push(b);
      // icon bubble above the building (what it is) + name pill (shown when zoomed in)
      const body = b.children[1] || b; const bb = new T.Box3().setFromObject(body); s.top = Math.min(30, Math.max(12, bb.max.y)) + 3;
      const locked = state.locked(s.id), lvTxt = d.single ? d.singleLabel || '' : locked ? 'locked' : L === 0 ? 'empty plot' : `Lv ${house ? Math.max(1, L) : L}`;
      const tag = document.createElement('button'); tag.type = 'button'; tag.className = 'map-bub' + (locked ? ' locked' : '') + (L === 0 && !house ? ' empty' : ''); tag.style.setProperty('--bc', (d.badge && d.badge.color) || '#FF6FA3');
      tag.setAttribute('aria-label', `${d.name}, ${lvTxt}`);
      tag.innerHTML = `<span class="bb">${SQ.badgeHTML(s.id)}${d.single ? '' : locked ? '<i class="bb-chip lock" aria-hidden="true">&#128274;</i>' : L === 0 && !house ? '<i class="bb-chip plus" aria-hidden="true">+</i>' : `<i class="bb-chip">${house ? Math.max(1, L) : L}</i>`}</span><span class="bn">${d.name} <small>${lvTxt}</small></span>`;
      tag.addEventListener('click', e => { e.stopPropagation(); select(s.id); }); labels.appendChild(tag); s.tag = tag; s.lv = lvTxt;
    });
    world.add(bLayer); D.fixClips(bLayer);
    D.ready().then(() => { anims = D.collect(world); });
    anims = D.collect(world);
  }

  /* ---------- camera: pan / zoom like a city-builder ---------- */
  const view = { x: CITY.start?.[0] ?? 0, z: CITY.start?.[1] ?? 10, dist: CITY.start?.[2] ?? 190, yaw: CITY.yaw ?? -.35 };
  const lim = { x: W[0] / 2, z: W[1] / 2, dmin: 34, dref: CITY.maxZoom || 270, dmax: 900 };
  /* the camera tilts down as you zoom out; past dref it keeps tilting toward a bird's-eye overview */
  const pitch = d => d <= lim.dref ? .4 + Math.max(0, (d - lim.dmin) / (lim.dref - lim.dmin)) * .46 : .86 + Math.min(1, (d - lim.dref) / Math.max(1, lim.dmax - lim.dref)) * .3;
  const overview = () => Math.min(1, Math.max(0, (view.dist - 110) / Math.max(1, lim.dmax - 110)));
  function aim() { const p = pitch(view.dist); cam.position.set(view.x + view.dist * Math.cos(p) * Math.sin(view.yaw), view.dist * Math.sin(p), view.z + view.dist * Math.cos(p) * Math.cos(view.yaw)); cam.lookAt(view.x, 0, view.z); cam.updateMatrixWorld(); }
  /* how far out you may zoom: just far enough to see the whole island on this screen */
  function fitAll() {
    const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2, r = coastR(a) * 1.08; pts.push(new T.Vector3(Math.cos(a) * W[0] / 2 * r, 0, Math.sin(a) * W[1] / 2 * r)); }
    const keep = { ...view }; view.x = 0; view.z = 0; let lo = 150, hi = 3000;
    for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2; lim.dmax = mid; view.dist = mid; aim(); const ok = pts.every(p => { const v = p.clone().project(cam); return Math.abs(v.x) < .96 && Math.abs(v.y) < .92; }); if (ok) hi = mid; else lo = mid; }
    lim.dmax = hi; Object.assign(view, keep);
  }
  function place() {
    view.dist = Math.max(lim.dmin, Math.min(lim.dmax, view.dist));
    const u = overview(); view.x = Math.max(-lim.x * (1 - u), Math.min(lim.x * (1 - u), view.x)); view.z = Math.max(-lim.z * (1 - u), Math.min(lim.z * (1 - u), view.z));
    aim(); scene.fog.near = view.dist * 1.4; scene.fog.far = view.dist * 3.4; cam.far = view.dist * 4; cam.updateProjectionMatrix();
    const s = Math.min(215, view.dist * .85); sun.position.set(view.x - s * .55, s * 1.25, view.z + s * .75); sun.target.position.set(view.x, 0, view.z); const sc = sun.shadow.camera; sc.left = sc.bottom = -s; sc.right = sc.top = s; sc.near = 1; sc.far = s * 4; sc.updateProjectionMatrix();
  }
  const ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0), ndc = new T.Vector2();
  const groundAt = (cx, cy) => { const r = cv.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const p = new T.Vector3(); return ray.ray.intersectPlane(plane, p) ? p : null; };
  const pts = new Map(); let pan = null, pinch = null, vel = { x: 0, z: 0 }, lastMove = 0, downAt = null;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); vel = { x: 0, z: 0 }; cv.style.cursor = 'grabbing';
    if (pts.size === 1) { pan = groundAt(e.clientX, e.clientY); downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; } else if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: view.dist }; pan = null; } });
  cv.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size >= 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); view.dist = pinch.dist * pinch.d / Math.max(20, d); place(); if (opt.onZoom) opt.onZoom(view.dist); return; }
    if (pan) { const g = groundAt(e.clientX, e.clientY); if (!g) return; const dx = pan.x - g.x, dz = pan.z - g.z; view.x += dx; view.z += dz; place(); if (opt.onPan) opt.onPan(Math.hypot(dx, dz)); const now = performance.now(), dt = Math.max(8, now - lastMove); vel = { x: dx / dt * 16, z: dz / dt * 16 }; lastMove = now; } });
  const end = e => { pts.delete(e.pointerId); cv.style.cursor = 'grab'; if (pts.size < 2) pinch = null;
    if (pts.size === 0) { if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 7 && performance.now() - downAt.t < 450) { vel = { x: 0, z: 0 }; pick(e.clientX, e.clientY); } if (performance.now() - lastMove > 80) vel = { x: 0, z: 0 }; pan = null; downAt = null; }
    else if (pts.size === 1) { const [a] = [...pts.values()]; pan = groundAt(a.x, a.y); } };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('wheel', e => { e.preventDefault(); const before = groundAt(e.clientX, e.clientY); view.dist *= Math.exp(e.deltaY * .0012); place(); if (opt.onZoom) opt.onZoom(view.dist); const after = groundAt(e.clientX, e.clientY); if (before && after) { view.x += before.x - after.x; view.z += before.z - after.z; place(); } }, { passive: false });
  cv.addEventListener('dblclick', e => { const g = groundAt(e.clientX, e.clientY); if (g) flyTo(g.x, g.z, Math.max(lim.dmin, view.dist * .55)); });
  let fly = null;
  function flyTo(x, z, dist, ms = 700) { fly = { from: { ...view }, to: { x, z, dist }, t0: performance.now(), ms }; }

  /* ---------- picking + info card ---------- */
  const card = document.createElement('div'); card.className = 'map-card-pop'; card.hidden = true; host.appendChild(card);
  function pick(cx, cy) { const r = cv.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const hits = ray.intersectObjects(picks, true); if (!hits.length) { card.hidden = true; return; } let o = hits[0].object; while (o && !o.userData.bid) o = o.parent; if (o) select(o.userData.bid); }
  function select(id) {
    const s = slots.find(q => q.id === id), d = SQ.B[id]; if (!s || !d) return;
    flyTo(s.x, s.z + 4, Math.min(view.dist, 90));
    const kind = d.kind ? d.kind : d.type === 'house' ? `Family house · ${d.family}` : id === 'factory' ? 'Squishy shop · Mystery Boxes' : id === 'market' ? 'Squishy shop · trading' : 'Fun building · minigame';
    card.innerHTML = `<button class="mc-x" type="button" aria-label="Close">×</button><p class="eyebrow">${kind}</p><h3>${d.name}</h3><p class="mc-lv">${s.lv || ''}</p><a class="mc-go" href="${id}.html">${d.single ? 'Open the Gem store' : 'Open design page'} &rarr;</a>`;
    card.hidden = false; card.querySelector('.mc-x').onclick = () => { card.hidden = true; if (window.SQS) SQS.play('back'); };
    if (window.SQS) { SQS.play('tap'); SQS.play('whoosh'); }
    if (opt.onSelect) opt.onSelect(id);
  }

  /* ---------- zoom buttons ---------- */
  const ui = document.createElement('div'); ui.className = 'map-ui'; ui.innerHTML = '<button type="button" data-z="in" aria-label="Zoom in">+</button><button type="button" data-z="out" aria-label="Zoom out">&minus;</button><button type="button" data-z="home" aria-label="Show the whole island" title="Show the whole island"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8V3h5M14 3h5v5M19 14v5h-5M8 19H3v-5"/></svg></button>'; host.appendChild(ui);
  ui.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const z = b.dataset.z; if (window.SQS) SQS.play('tap'); if (z === 'in') { flyTo(view.x, view.z, view.dist * .62, 350); if (opt.onZoom) opt.onZoom(view.dist * .62); } if (z === 'out') flyTo(view.x, view.z, view.dist * 1.6, 350); if (z === 'home') flyTo(0, 0, lim.dmax); });

  /* ---------- loop ---------- */
  function resize() { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); fitAll(); place(); }
  new ResizeObserver(resize).observe(host); resize();
  if (cam.aspect < 1.1) { view.dist = Math.min(lim.dmax, view.dist * Math.min(1.5, 1.1 / cam.aspect)); place(); }
  let visible = true; new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  const t0 = performance.now(), v3 = new T.Vector3();
  let lastTouch = performance.now(), lastF = 0; host.addEventListener('pointerdown', () => lastTouch = performance.now(), true);
  function frame() {
    requestAnimationFrame(frame); if (!visible || document.hidden) return;
    const now = performance.now(); if (window.SQS && SQS.fps() < 60 && now - lastF < 1000 / SQS.fps() - 4) return; lastF = now;
    if (fly) { const u = Math.min(1, (now - fly.t0) / fly.ms), e = u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2; view.x = fly.from.x + (fly.to.x - fly.from.x) * e; view.z = fly.from.z + (fly.to.z - fly.from.z) * e; view.dist = fly.from.dist + (fly.to.dist - fly.from.dist) * e; place(); if (u >= 1) fly = null; }
    else if (!pan && (Math.abs(vel.x) + Math.abs(vel.z) > .01)) { view.x += vel.x; view.z += vel.z; vel.x *= .92; vel.z *= .92; place(); }
    if (!D.reduced && !(window.SQS && SQS.reduced()) && !(window.SQS && SQS.settings.battery && now - lastTouch > 20000)) D.tick(anims, (now - t0) / 1000);
    D.outlinePx(cam, cv.height, 1.8 * renderer.getPixelRatio());
    renderer.render(scene, cam);
    // labels follow their buildings
    const w = cv.clientWidth, h = cv.clientHeight, sc = Math.max(.62, Math.min(1, 150 / view.dist + .35)), names = view.dist < 175;
    labels.classList.toggle('names', names);
    slots.forEach(s => { if (!s.tag) return; v3.set(s.x, (s.top || 20) * (CITY.buildingScale || 1), s.z).project(cam); const vis = v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.15; s.tag.style.display = vis ? '' : 'none'; if (vis) { s.tag.style.transform = `translate(${((v3.x + 1) / 2 * w).toFixed(1)}px, ${((1 - v3.y) / 2 * h).toFixed(1)}px) translate(-50%, -100%) scale(${sc.toFixed(3)})`; s.tag.style.zIndex = String(Math.round((1 - v3.z) * 1e5)); } });
  }
  requestAnimationFrame(frame);
  /* debug: top-down picture of the whole island (used to check the layout) */
  host.__top = (px = 1400) => { const oc = new T.OrthographicCamera(-W[0] * .6, W[0] * .6, W[1] * .6, -W[1] * .6, 1, 1000); oc.position.set(0, 400, 0); oc.lookAt(0, 0, 0); oc.up.set(0, 0, -1); oc.lookAt(0, 0, 0); const ow = renderer.domElement.width, oh = renderer.domElement.height; renderer.setSize(px, px * W[1] / W[0], false); const f = scene.fog; scene.fog = null; renderer.render(scene, oc); const url = renderer.domElement.toDataURL('image/png'); scene.fog = f; renderer.setSize(ow / renderer.getPixelRatio(), oh / renderer.getPixelRatio(), false); return url; };
  return { setState, flyTo, select, view, lim, bubble: id => (slots.find(q => q.id === id) || {}).tag, close: () => { card.hidden = true; }, host };
};
})();
