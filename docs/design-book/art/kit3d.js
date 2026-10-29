/* =====================================================================
   SQUISHVILLE 3D KIT  ·  art/kit3d.js
   Turns the designs into 3D (Three.js):
   - squishies: the 2D drawing in each art file is "inflated" into a puffy 3D toy
   - buildings: modelled in 3D in each art file's model() function
   - viewers, snapshots, animation loop shared by every page and the city map
   You rarely need to edit this file.
   ===================================================================== */
(function () {
'use strict';
const T = THREE, K = SQ.K, D = SQ.three = {};
D.dk = SQ.dk; D.lt = SQ.lt; D.mix = SQ.mix;
const mix = SQ.mix;

/* ---------------- materials + basic meshes ---------------- */
const mats = new Map(), geos = new Map();
/* toon look: soft 4-step cartoon shading + plum outlines (D.TOON / D.OUTLINE switch it off) */
D.TOON = true; D.OUTLINE = true;
let toonRamp = null;
function ramp() { if (!toonRamp) { const d = new Uint8Array([150, 150, 150, 255, 196, 196, 196, 255, 232, 232, 232, 255, 255, 255, 255, 255]); toonRamp = new T.DataTexture(d, 4, 1, T.RGBAFormat); toonRamp.minFilter = toonRamp.magFilter = T.NearestFilter; toonRamp.generateMipmaps = false; toonRamp.needsUpdate = true; } return toonRamp; }
function mat(color, o = {}) {
  const key = [color, o.r ?? .6, o.m ?? 0, o.op ?? 1, o.e || '', o.ei ?? '', o.side || 0, o.glass ? 1 : 0, o.std ? 1 : 0].join('|');
  let m = mats.get(key);
  if (!m) {
    const base = { color, transparent: (o.op ?? 1) < 1, opacity: o.op ?? 1, side: o.side || T.FrontSide };
    m = D.TOON && !o.std ? new T.MeshToonMaterial(Object.assign(base, { gradientMap: ramp() })) : new T.MeshStandardMaterial(Object.assign(base, { roughness: o.r ?? .6, metalness: o.m ?? 0 }));
    if (o.op != null && o.op < 1) m.depthWrite = !!o.dw;
    if (o.e) { m.emissive = new T.Color(o.e); m.emissiveIntensity = o.ei ?? .9; }
    mats.set(key, m);
  }
  return m;
}
D.mat = mat;
function mesh(geo, m, shadow = true) { const x = new T.Mesh(geo, m); x.castShadow = shadow; x.receiveShadow = true; return x; }
function at(o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; }
function G(...kids) { const g = new T.Group(); kids.flat(5).forEach(k => k && g.add(k)); return g; }
function cg(key, make) { let g = geos.get(key); if (!g) { g = make(); geos.set(key, g); } return g; }
D.at = at; D.G = G; D.mesh = mesh;
const C = (c) => typeof c === 'string' ? mat(c) : c;

/* rounded box, centred */
D.box = (w, h, d, color, r) => {
  r = Math.max(.01, Math.min(r ?? Math.min(w, h, d) * .15, w / 2 - .01, h / 2 - .01, d / 2 - .01));
  const geo = cg(`b${w}|${h}|${d}|${r}`, () => {
    const iw = w - 2 * r, ih = h - 2 * r, cr = Math.min(r * .6, iw / 2, ih / 2), s = new T.Shape();
    s.moveTo(-iw / 2 + cr, -ih / 2); s.lineTo(iw / 2 - cr, -ih / 2); s.quadraticCurveTo(iw / 2, -ih / 2, iw / 2, -ih / 2 + cr);
    s.lineTo(iw / 2, ih / 2 - cr); s.quadraticCurveTo(iw / 2, ih / 2, iw / 2 - cr, ih / 2); s.lineTo(-iw / 2 + cr, ih / 2);
    s.quadraticCurveTo(-iw / 2, ih / 2, -iw / 2, ih / 2 - cr); s.lineTo(-iw / 2, -ih / 2 + cr); s.quadraticCurveTo(-iw / 2, -ih / 2, -iw / 2 + cr, -ih / 2);
    const g = new T.ExtrudeGeometry(s, { depth: Math.max(.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 3 });
    g.translate(0, 0, -(d - 2 * r) / 2); g.computeVertexNormals(); return g;
  });
  return mesh(geo, C(color));
};
/* plain sharp box */
D.cube = (w, h, d, color) => mesh(cg(`c${w}|${h}|${d}`, () => new T.BoxGeometry(w, h, d)), C(color));
D.cyl = (rt, rb, h, color, seg = 16, open) => mesh(cg(`y${rt}|${rb}|${h}|${seg}|${open}`, () => new T.CylinderGeometry(rt, rb, h, seg, 1, !!open)), C(color));
D.cone = (r, h, color, seg = 24) => mesh(cg(`k${r}|${h}|${seg}`, () => new T.ConeGeometry(r, h, seg)), C(color));
D.ball = (r, color, sx = 1, sy = 1, sz = 1, seg = 14) => { const m = mesh(cg(`s${seg}`, () => new T.SphereGeometry(1, seg, Math.round(seg * .7))), C(color)); m.scale.set(r * sx, r * sy, r * sz); return m; };
D.torus = (R, r, color, arc = Math.PI * 2, rs = 7, ts = 22) => mesh(cg(`t${R}|${r}|${arc}|${rs}|${ts}`, () => new T.TorusGeometry(R, r, rs, ts, arc)), C(color));
D.disc = (r, color, seg = 28) => mesh(cg(`d${r}|${seg}`, () => new T.CircleGeometry(r, seg)), C(color), false);
/* revolve a profile [[radius, y], ...] around the vertical axis */
D.lathe = (pts, color, seg = 36, smooth = true) => {
  const key = 'l' + seg + smooth + JSON.stringify(pts);
  const geo = cg(key, () => {
    let v = pts.map(p => new T.Vector2(Math.max(0, p[0]), p[1]));
    if (smooth && v.length > 2) v = new T.SplineCurve(v).getPoints(v.length * 4).map(p => new T.Vector2(Math.max(0, p.x), p.y));
    return new T.LatheGeometry(v, seg);
  });
  return mesh(geo, C(color));
};
/* extrude a 2D outline [[x,y],...] (y up) along z */
D.slab = (pts, depth, color, bevel = .15) => {
  const key = 'x' + depth + '|' + bevel + JSON.stringify(pts);
  const geo = cg(key, () => { const s = new T.Shape(pts.map(p => new T.Vector2(p[0], p[1]))); const g = new T.ExtrudeGeometry(s, { depth: Math.max(.001, depth - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 }); g.translate(0, 0, -(depth - 2 * bevel) / 2); return g; });
  return mesh(geo, C(color));
};
D.tube = (pts, r, color, closed = false) => {
  const v = pts.map(p => new T.Vector3(p[0], p[1], p[2] || 0));
  return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(v, closed), Math.max(8, pts.length * 6), r, 8, closed), C(color));
};
/* canvas text sign (front plane) */
D.textTex = (text, o = {}) => {
  const w = o.w || 256, h = o.h || 64, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d');
  x.fillStyle = o.bg || '#FFFFFF'; x.fillRect(0, 0, w, h);
  let size = o.size || h * .5; const font = () => `${o.weight || 900} ${size}px ${o.font || 'Nunito, system-ui, sans-serif'}`;
  x.fillStyle = o.fg || '#2B2141'; x.font = font(); const mw = x.measureText(text).width; if (mw > w * .92) { size *= w * .92 / mw; x.font = font(); }   // shrink long words to fit
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2 + (o.dx || 0), h / 2 + 2);
  const t = new T.CanvasTexture(cv); t.anisotropy = 4; return t;
};
D.sign = (text, w, h, o = {}) => {
  const tex = D.textTex(text, { w: 512, h: Math.round(512 * h / w), bg: o.bg, fg: o.fg, size: o.size });
  const p = mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tex, roughness: .7 }), false);
  return p;
};
/* svg drawing -> texture (async). D.pending collects the promises */
D.pending = [];
D.svgTex = (svgInner, vb, px = 256) => {
  const [, , vw, vh] = vb.split(' ').map(Number), cv = document.createElement('canvas'); cv.width = px; cv.height = Math.round(px * vh / vw);
  const tex = new T.CanvasTexture(cv), img = new Image();
  D.pending.push(new Promise(res => { img.onload = () => { cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); tex.needsUpdate = true; res(); }; img.onerror = res; }));
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${cv.width}" height="${cv.height}">${svgInner}</svg>`);
  return tex;
};
D.ready = () => { const p = D.pending.slice(); D.pending.length = 0; return Promise.all(p); };

/* soft round contact shadow */
let shadowTex;
D.blobShadow = (r, op = .22) => {
  if (!shadowTex) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(43,33,65,1)'); g.addColorStop(1, 'rgba(43,33,65,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); shadowTex = new T.CanvasTexture(cv); }
  const m = new T.Mesh(cg('pl1', () => new T.PlaneGeometry(1, 1)), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: op, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.scale.set(r * 2, r * 2, 1); m.position.y = .03; m.renderOrder = 1; return m;
};

/* ---------------- animation ---------------- */
D.anim = (o, type, opts = {}) => { o.userData.anim = Object.assign({ type, ph: opts.ph ?? Math.random() * 6 }, opts); return o; };
D.collect = root => { const list = []; root.traverse(o => { const a = o.userData.anim; if (a) { a.p = o.position.clone(); a.r = o.rotation.clone(); a.s = o.scale.clone(); list.push(o); } }); return list; };
D.tick = (list, t) => {
  for (const o of list) {
    const a = o.userData.anim, ph = a.ph, k = a.amp ?? 1, S = Math.sin;
    switch (a.type) {
      case 'bob': o.position.y = a.p.y + (S(t * 2.4 + ph) * .5 + .5) * .25 * k; break;
      case 'squish': case 'sleep': { const v = S(t * (a.type === 'sleep' ? 1.7 : 2.8) + ph) * .5 + .5; o.scale.set(a.s.x * (1 + .05 * v * k), a.s.y * (1 - .07 * v * k), a.s.z * (1 + .05 * v * k)); break; }
      case 'hop': { const u = ((t + ph) % 1.8) / 1.8, up = u > .15 && u < .85 ? S((u - .15) / .7 * Math.PI) : 0, sq = u < .15 ? 1 - S(u / .15 * Math.PI) * .18 : 1; o.position.y = a.p.y + up * 1.7 * k; o.scale.set(a.s.x * (2 - sq), a.s.y * sq, a.s.z * (2 - sq)); break; }
      case 'mow': o.position.x = a.p.x + (1 - Math.cos(t * 1.75 + ph)) * .5 * 2.4 * k; break;
      case 'sway': o.rotation.z = a.r.z + S(t * 2.1 + ph) * .13 * k; break;
      case 'wiggle': o.rotation.z = a.r.z + S(t * 5 + ph) * .2 * k; break;
      case 'float': o.position.y = a.p.y + S(t * 1.7 + ph) * .45 * k; break;
      case 'drift': o.position.y = a.p.y + S(t * 1.4 + ph) * .3 * k; break;
      case 'spin': o.rotation.y = a.r.y + t * (a.sp ?? .7); break;
      case 'spinz': o.rotation.z = a.r.z + t * (a.sp ?? .7); break;
      case 'spinx': o.rotation.x = a.r.x + t * (a.sp ?? .7); break;
      case 'twinkle': { const v = .35 + .65 * Math.abs(S(t * 1.6 + ph)); o.scale.set(a.s.x * v, a.s.y * v, a.s.z * v); break; }
      case 'blink': { const u = (t + ph) % 4.2; o.scale.y = a.s.y * (u > 4 ? .12 : 1); break; }
      case 'smoke': { const u = ((t + ph) % 3) / 3; o.position.set(a.p.x + u * .8, a.p.y + u * 3.2, a.p.z); const v = S(u * Math.PI) * 1.3; o.scale.set(a.s.x * v, a.s.y * v, a.s.z * v); break; }
      case 'flag': o.rotation.y = a.r.y + S(t * 4 + ph) * .3; break;
      case 'swing': o.rotation.x = a.r.x + S(t * 2.6 + ph) * .32 * k; break;
      case 'rock': o.rotation.z = a.r.z + S(t * 1.8 + ph) * .2 * k; break;
      case 'peek': { const u = ((t + ph) % 4.6) / 4.6, v = u < .12 ? 0 : u < .3 ? (u - .12) / .18 : u < .78 ? 1 : u < .95 ? 1 - (u - .78) / .17 : 0; o.position.y = a.p.y - (1 - v) * (a.depth || 1.4); break; }
      case 'glow': if (o.material && o.material.emissive) o.material.emissiveIntensity = .45 + .45 * (S(t * 2.6 + ph) * .5 + .5); break;
      case 'water': if (o.material && o.material.map) { o.material.map.offset.x = (t * .03) % 1; o.material.map.offset.y = (t * .02) % 1; } break;
    }
  }
};

/* ---------------- 2D drawing -> puffy 3D ("inflate") ---------------- */
function mulM(A, B) { return [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]]; }
function parseTf(s) {
  let m = [1, 0, 0, 1, 0, 0]; if (!s) return m; const re = /(\w+)\(([^)]*)\)/g; let r;
  while ((r = re.exec(s))) {
    const a = r[2].split(/[\s,]+/).filter(Boolean).map(Number); let t = [1, 0, 0, 1, 0, 0];
    if (r[1] === 'translate') t = [1, 0, 0, 1, a[0], a[1] || 0];
    else if (r[1] === 'scale') t = [a[0], 0, 0, a[1] ?? a[0], 0, 0];
    else if (r[1] === 'rotate') { const g = a[0] * Math.PI / 180, c = Math.cos(g), s2 = Math.sin(g); t = [c, s2, -s2, c, 0, 0]; if (a.length > 2) t = mulM(mulM([1, 0, 0, 1, a[1], a[2]], t), [1, 0, 0, 1, -a[1], -a[2]]); }
    else if (r[1] === 'matrix') t = a;
    m = mulM(m, t);
  }
  return m;
}
const ap = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
function arcPts(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
  const out = []; if (!rx || !ry) return [[x2, y2]];
  const c = Math.cos(phi), s = Math.sin(phi), dx = (x1 - x2) / 2, dy = (y1 - y2) / 2, x1p = c * dx + s * dy, y1p = -s * dx + c * dy;
  rx = Math.abs(rx); ry = Math.abs(ry); const lam = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry); if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p, den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let co = Math.sqrt(Math.max(0, num / den)); if (fa === fs) co = -co;
  const cxp = co * rx * y1p / ry, cyp = -co * ry * x1p / rx, cx = c * cxp - s * cyp + (x1 + x2) / 2, cy = s * cxp + c * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => { const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy); return a; };
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry); let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dt > 0) dt -= 2 * Math.PI; if (fs && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(4, Math.ceil(Math.abs(dt) / (Math.PI / 10)));
  for (let i = 1; i <= n; i++) { const tt = t1 + dt * i / n; out.push([cx + rx * Math.cos(tt) * c - ry * Math.sin(tt) * s, cy + rx * Math.cos(tt) * s + ry * Math.sin(tt) * c]); }
  return out;
}
function pathSubs(d) {
  const tk = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/g) || []; let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, cur = null, qx, qy, cx2, cy2; const subs = [];
  const num = () => parseFloat(tk[i++]); const isCmd = () => /^[a-zA-Z]$/.test(tk[i]);
  const ensure = () => { if (!cur) { cur = { pts: [[x, y]], closed: false }; subs.push(cur); } };
  while (i < tk.length) {
    if (isCmd()) cmd = tk[i++]; else if (!cmd) { i++; continue; }
    const rel = cmd === cmd.toLowerCase(), U = cmd.toUpperCase(); let lastQ = false, lastC = false;
    if (U === 'Z') { if (cur) { cur.closed = true; } x = sx; y = sy; cur = null; continue; }
    if (i >= tk.length || isCmd()) continue;
    if (U === 'M') { let X = num(), Y = num(); if (rel) { X += x; Y += y; } x = sx = X; y = sy = Y; cur = { pts: [[x, y]], closed: false }; subs.push(cur); cmd = rel ? 'l' : 'L'; continue; }
    ensure();
    if (U === 'L') { let X = num(), Y = num(); if (rel) { X += x; Y += y; } x = X; y = Y; cur.pts.push([x, y]); }
    else if (U === 'H') { let X = num(); if (rel) X += x; x = X; cur.pts.push([x, y]); }
    else if (U === 'V') { let Y = num(); if (rel) Y += y; y = Y; cur.pts.push([x, y]); }
    else if (U === 'Q' || U === 'T') {
      let x1, y1; if (U === 'Q') { x1 = num(); y1 = num(); if (rel) { x1 += x; y1 += y; } } else { x1 = qx != null ? 2 * x - qx : x; y1 = qy != null ? 2 * y - qy : y; }
      let X = num(), Y = num(); if (rel) { X += x; Y += y; }
      for (let k = 1; k <= 8; k++) { const t = k / 8, u = 1 - t; cur.pts.push([u * u * x + 2 * u * t * x1 + t * t * X, u * u * y + 2 * u * t * y1 + t * t * Y]); }
      qx = x1; qy = y1; x = X; y = Y; lastQ = true;
    } else if (U === 'C' || U === 'S') {
      let x1, y1; if (U === 'C') { x1 = num(); y1 = num(); if (rel) { x1 += x; y1 += y; } } else { x1 = cx2 != null ? 2 * x - cx2 : x; y1 = cy2 != null ? 2 * y - cy2 : y; }
      let x2 = num(), y2 = num(), X = num(), Y = num(); if (rel) { x2 += x; y2 += y; X += x; Y += y; }
      for (let k = 1; k <= 10; k++) { const t = k / 10, u = 1 - t; cur.pts.push([u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * X, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * Y]); }
      cx2 = x2; cy2 = y2; x = X; y = Y; lastC = true;
    } else if (U === 'A') {
      const rx = num(), ry = num(), rot = num(), fa = num(), fs = num(); let X = num(), Y = num(); if (rel) { X += x; Y += y; }
      cur.pts.push(...arcPts(x, y, rx, ry, rot * Math.PI / 180, fa, fs, X, Y)); x = X; y = Y;
    } else { i++; }
    if (!lastQ) { qx = qy = null; } if (!lastC) { cx2 = cy2 = null; }
  }
  return subs.filter(s => s.pts.length > 1);
}
function colorOf(f, grads) {
  if (!f || f === 'none' || f === 'transparent') return null;
  const m = /url\(#([^)]+)\)/.exec(f); if (m) return grads[m[1]] || '#FFFFFF';
  return f;
}
function dedupe(pts) { const o = []; for (const p of pts) { const l = o[o.length - 1]; if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > .05) o.push(p); } return o; }
function bboxOf(pts) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } return { x: a, y: b, w: c - a, h: d - b, cx: (a + c) / 2, cy: (b + d) / 2 }; }

/* inflate(svgInner, o): returns THREE.Group. Source units: svg px, y down. Output: x right, y up (negated), z toward viewer.
   o.bodyMin: area above which the first filled element is treated as the round "body"
   o.puff: global thickness multiplier   o.skipBig: ignore elements bigger than this (room backgrounds) */
const parser = new DOMParser(), ray = new T.Raycaster();
D.inflate = function (svgInner, o = {}) {
  const doc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svgInner}</svg>`, 'image/svg+xml');
  const root = new T.Group(), solids = [], grads = {}, puff = o.puff ?? 1;
  let bodyDone = !!o.noBody, order = 0;
  doc.querySelectorAll('linearGradient,radialGradient').forEach(g => { const st = g.querySelectorAll('stop'); grads[g.id] = st[Math.floor(st.length / 2)]?.getAttribute('stop-color') || '#fff'; });
  const surfZ = (x, y) => { ray.set(new T.Vector3(x, -y, 500), new T.Vector3(0, 0, -1)); const h = ray.intersectObjects(solids, false); return h.length ? h[0].point.z : null; };
  function material(col, op, gl) { return mat(col, { r: o.rough ?? .5, op: op < 1 ? op : 1, e: gl || o.std ? col : null, ei: gl ? .5 : .26, std: o.std }); }
  function addSolid(m, parent) { parent.add(m); m.updateMatrixWorld(true); solids.push(m); order++; }
  function walk(node, M, parent, op) {
    for (const el of node.children) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'defs' || tag === 'clippath' || tag === 'lineargradient' || tag === 'radialgradient' || tag === 'text' || tag === 'title') continue;
      const M2 = mulM(M, parseTf(el.getAttribute('transform')));
      const op2 = op * parseFloat(el.getAttribute('opacity') ?? 1) * parseFloat(el.getAttribute('fill-opacity') ?? 1);
      if (tag === 'g') {
        const cls = el.getAttribute('class') || ''; const am = /\ba-(\w+)/.exec(cls); const eyes = /\beyes\b/.test(cls);
        if (am || eyes) {
          const sub = new T.Group(); parent.add(sub); walk(el, M2, sub, op2);
          const bb = new T.Box3().setFromObject(sub); if (!bb.isEmpty()) {
            const piv = new T.Vector3((bb.min.x + bb.max.x) / 2, eyes || am[1] === 'twinkle' || am[1] === 'spin' ? (bb.min.y + bb.max.y) / 2 : bb.min.y, (bb.min.z + bb.max.z) / 2);
            sub.children.forEach(ch => ch.position.sub(piv)); sub.position.copy(piv);
            const map = { bob: 'bob', squish: 'squish', sleep: 'sleep', hop: 'hop', sway: 'sway', wiggle: 'wiggle', float: 'float', spin: 'spinz', 'spin-fast': 'spinz', twinkle: 'twinkle', glow: 'none', drift: 'drift', mow: 'none', peek: 'none', swing: 'sway', flag: 'sway' };
            const ty = eyes ? 'blink' : (map[am[1]] || 'none'); if (ty !== 'none' && !o.noAnim) D.anim(sub, ty, { amp: .3 });
          }
        } else walk(el, M2, parent, op2);
        continue;
      }
      const fill = colorOf(el.getAttribute('fill') ?? '#000', grads), stroke = colorOf(el.getAttribute('stroke'), grads), sw = parseFloat(el.getAttribute('stroke-width') || 0) * Math.hypot(M2[0], M2[1]);
      const glowCls = /a-glow/.test(el.getAttribute('class') || '');
      if (glowCls && op2 < .7) continue;
      if (tag === 'ellipse' || tag === 'circle') {
        const cx = +el.getAttribute('cx') || 0, cy = +el.getAttribute('cy') || 0;
        let rx = +(el.getAttribute('rx') ?? el.getAttribute('r')) || 0, ry = +(el.getAttribute('ry') ?? el.getAttribute('r')) || 0;
        const sc = Math.hypot(M2[0], M2[1]), ang = Math.atan2(M2[1], M2[0]); rx *= sc; ry *= Math.hypot(M2[2], M2[3]);
        const [px, py] = ap(M2, [cx, cy]); if (rx < .05 || ry < .05) continue;
        if (o.skipBig && rx * ry * 4 > o.skipBig) continue;
        if (!fill) { if (stroke && sw > 0) { const m = mesh(new T.TorusGeometry((rx + ry) / 2, sw / 2 * .9, 8, 32), material(stroke, op2)); const z = surfZ(px, py); m.position.set(px, -py, (z ?? 0) + sw * .3); m.scale.y = ry / rx; addSolid(m, parent); } continue; }
        if ((fill.toLowerCase() === '#fff' || fill.toLowerCase() === '#ffffff') && op2 <= .62 && !o.keepSheen) continue;
        if (op2 < .3) continue;
        const s = Math.min(rx, ry), isBody = !bodyDone && rx * ry * 3.14 > (o.bodyMin || 500);
        const rz = (isBody ? s * .85 : op2 < .7 ? s * .28 : s < 2.2 ? s * .55 : s < 6 ? s * .5 : s * .42) * puff;
        const m = mesh(cg('s20', () => new T.SphereGeometry(1, 20, 14)), material(fill, op2, glowCls));
        m.scale.set(rx, ry, rz); m.rotation.z = -ang;
        const z = isBody ? null : surfZ(px, py);
        m.position.set(px, -py, z == null ? (o.back ? rz : 0) : z - rz * .3);
        if (isBody) bodyDone = true; addSolid(m, parent); continue;
      }
      let subs = [];
      if (tag === 'path') subs = pathSubs(el.getAttribute('d') || '');
      else if (tag === 'rect') {
        const x = +el.getAttribute('x') || 0, y = +el.getAttribute('y') || 0, w = +el.getAttribute('width'), h = +el.getAttribute('height'), r = Math.min(+el.getAttribute('rx') || 0, w / 2, h / 2);
        if (!w || !h) continue; const p = [];
        if (r > .2) { const arc = (cx, cy, a0) => { for (let k = 0; k <= 4; k++) { const a = a0 + k / 4 * Math.PI / 2; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } }; arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI); }
        else p.push([x, y], [x + w, y], [x + w, y + h], [x, y + h]);
        subs = [{ pts: p, closed: true }];
      } else continue;
      subs.forEach(sp => sp.pts = dedupe(sp.pts.map(p => ap(M2, p))));
      const all = subs.flatMap(sp => sp.pts); if (all.length < 2) continue; const bb = bboxOf(all);
      if (o.skipBig && bb.w * bb.h > o.skipBig) continue;
      if (!fill) { // stroked line -> tube that hugs the surface
        if (!stroke || sw <= 0 || op2 < .3) continue;
        subs.forEach(sp => {
          let pts = sp.pts; if (sp.closed) pts = pts.concat([pts[0]]); if (pts.length < 2) return;
          const dense = []; for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1], n2 = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2.5)); for (let j = 0; j < n2; j++) dense.push([a[0] + (b[0] - a[0]) * j / n2, a[1] + (b[1] - a[1]) * j / n2]); } dense.push(pts[pts.length - 1]);
          const v = dense.map(p => { const z = surfZ(p[0], p[1]); return new T.Vector3(p[0], -p[1], (z ?? (o.back ? sw : 0)) + sw * .25); });
          if (v.length < 2) return;
          const m = mesh(new T.TubeGeometry(new T.CatmullRomCurve3(v), Math.min(80, v.length * 2), Math.max(.25, sw / 2), 6, false), material(stroke, op2));
          addSolid(m, parent);
        });
        continue;
      }
      if ((fill.toLowerCase() === '#fff' || fill.toLowerCase() === '#ffffff') && op2 <= .62 && !o.keepSheen) continue;
      if (op2 < .3) continue;
      const evenodd = el.getAttribute('fill-rule') === 'evenodd';
      const s = Math.min(bb.w, bb.h), isBody = !bodyDone && bb.w * bb.h > (o.bodyMin || 500) * 1.25;
      let depth, bt, bs, fx = 1, fy = 1;
      if (isBody) { depth = s * .1; bt = s * .38; bs = s * .15; fx = Math.max(.4, (bb.w - 2 * bs) / bb.w); fy = Math.max(.4, (bb.h - 2 * bs) / bb.h); }
      else if (s >= 14) { depth = s * .08; bt = s * .14; bs = s * .035; }
      else { depth = Math.max(.3, s * .12); bt = Math.max(.25, s * .16); bs = Math.max(.12, s * .04); }
      const shapes = []; subs.forEach((sp, k) => { if (sp.pts.length < 3) return; const v = sp.pts.map(p => new T.Vector2(bb.cx + (p[0] - bb.cx) * fx, -(bb.cy + (p[1] - bb.cy) * fy))); if (evenodd && k > 0 && shapes.length) shapes[0].holes.push(new T.Path(v)); else shapes.push(new T.Shape(v)); });
      if (!shapes.length) continue;
      depth *= puff; bt *= puff; if (o.flat && !isBody) { depth = Math.min(depth, o.flat); bt = Math.min(bt, o.flat * .6); }
      const geo = new T.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: isBody ? 5 : 2, curveSegments: 3 });
      D.smoothNormals(geo);
      const m = mesh(geo, material(fill, op2, glowCls));
      let z = isBody ? null : surfZ(bb.cx, bb.cy);
      if (z == null && !isBody) { // try a couple of points inside the shape
        for (const p of [subs[0].pts[Math.floor(subs[0].pts.length / 3)], subs[0].pts[Math.floor(subs[0].pts.length * 2 / 3)]]) { const zz = surfZ(p[0] * .7 + bb.cx * .3, p[1] * .7 + bb.cy * .3); if (zz != null) { z = zz; break; } }
      }
      m.position.z = z == null ? (o.back ? bt : -depth / 2) : z - Math.min(bt * 1.1, 1.6) + bt;
      if (isBody) bodyDone = true;
      addSolid(m, parent);
    }
  }
  walk(doc.documentElement, [1, 0, 0, 1, 0, 0], root, 1);
  return root;
};

/* ---------------- interior rooms: the 2D room drawing becomes a 3D shadow-box diorama ---------------- */
D.room3 = function (id, choice) {
  const d = SQ.B[id]; if (!d || !d.interior) return new T.Group();
  let roomSvg = ''; const orig = K.room, origTag = K.tag, tags = []; K.room = o => { roomSvg = orig(o); return ''; }; K.tag = (x, y, n) => { tags.push([x, y, n]); return ''; };
  let items = ''; try { items = d.interior(K); } finally { K.room = orig; K.tag = origTag; }
  items = SQ.restyle(items, choice);
  const g = new T.Group();
  const tex = D.svgTex(roomSvg, '0 0 600 340', 1200);
  const panel = mesh(new T.PlaneGeometry(60, 34), new T.MeshStandardMaterial({ map: tex, roughness: .95 }), false); panel.position.set(0, 17, 0); g.add(panel);
  const fr = '#FFF8EC', edge = SQ.dk(fr, .15);
  g.add(at(D.box(63, 1.4, 9, '#C9A97A', .4), 0, -.7, 3.6), at(D.box(1.6, 36, 9, fr, .5), -31, 17, 3.6), at(D.box(1.6, 36, 9, fr, .5), 31, 17, 3.6), at(D.box(63.6, 1.6, 9, fr, .5), 0, 34.8, 3.6), at(D.box(66, 36, 1.2, edge, .4), 0, 17, -.7));
  const rel = D.inflate(items, { noBody: true, back: true, puff: 1.7, rough: .55 });
  rel.scale.set(.1, .1, .1); rel.position.set(-30, 34, .05); g.add(rel);
  tags.forEach(([x, y, n]) => { const cv = document.createElement('canvas'); cv.width = cv.height = 96; const c2 = cv.getContext('2d'); c2.fillStyle = '#2B2141'; c2.beginPath(); c2.arc(48, 48, 46, 0, 7); c2.fill(); c2.fillStyle = '#FF6FA3'; c2.beginPath(); c2.arc(48, 48, 38, 0, 7); c2.fill(); c2.fillStyle = '#fff'; c2.font = '900 50px Nunito, sans-serif'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillText(n, 48, 52); const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), depthTest: false })); sp.scale.set(2.6, 2.6, 1); sp.position.set(x / 10 - 30, 34 - y / 10, 6); sp.renderOrder = 5; g.add(sp); });
  return D.finish(g);
};

/* ---------------- performance: merge everything that doesn't move ---------------- */
function mergeGeos(list) {
  let nv = 0, ni = 0; list.forEach(({ geo }) => { nv += geo.attributes.position.count; ni += geo.index ? geo.index.count : geo.attributes.position.count; });
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0; const v = new T.Vector3(), nm = new T.Matrix3();
  list.forEach(({ geo, m4 }) => {
    const P = geo.attributes.position, N = geo.attributes.normal; nm.getNormalMatrix(m4);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m4); pos.set([v.x, v.y, v.z], (vo + i) * 3); if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.set([v.x, v.y, v.z], (vo + i) * 3); } }
    if (geo.index) { const I = geo.index.array; for (let i = 0; i < I.length; i++) idx[io + i] = I[i] + vo; io += I.length; } else { for (let i = 0; i < P.count; i++) idx[io + i] = vo + i; io += P.count; }
    vo += P.count;
  });
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setIndex(new T.BufferAttribute(idx, 1)); g.computeBoundingSphere(); return g;
}
D.optimize = function (root) {
  root.updateMatrixWorld(true);
  const inv = new T.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map(), gone = [];
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.outline) return;
    for (let p = o; p && p !== root; p = p.parent) if (p.userData.anim || p.userData.clip || p.userData.keep) return;
    const m = o.material; if (Array.isArray(m) || m.map || m.transparent || m.clippingPlanes || !o.geometry.attributes.normal) return;
    const m4 = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld); if (m4.determinant() < 0) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const small = o.geometry.boundingSphere.radius * Math.cbrt(Math.abs(m4.determinant())) < (D.SMALL ?? .5);
    const nol = !!o.userData.noOutline || small, key = m.uuid + (o.castShadow ? 's' : 'n') + (nol ? 'x' : ''); if (!buckets.has(key)) buckets.set(key, { m, cast: o.castShadow, nol, list: [] });
    buckets.get(key).list.push({ geo: o.geometry, m4 }); gone.push(o);
  });
  gone.forEach(o => o.parent.remove(o));
  buckets.forEach(b => { const me = new T.Mesh(mergeGeos(b.list), b.m); me.castShadow = b.cast; me.receiveShadow = true; me.userData.merged = true; me.userData.noOutline = b.nol; root.add(me); });
  return root;
};
/* cartoon outlines (inverted hull, about 2px wide on screen) */
const smoothCache = new WeakMap();
D.smoothNormals = geo => { const g = smoothed(geo); geo.setAttribute('normal', g.attributes.normal); smoothCache.set(geo, geo); return geo; };
function smoothed(geo) {
  let g = smoothCache.get(geo); if (g) return g;
  const P = geo.attributes.position, N = geo.attributes.normal, acc = new Map(), keys = new Array(P.count);
  for (let i = 0; i < P.count; i++) { const k = Math.round(P.getX(i) * 200) + ',' + Math.round(P.getY(i) * 200) + ',' + Math.round(P.getZ(i) * 200); keys[i] = k; let a = acc.get(k); if (!a) { a = [0, 0, 0]; acc.set(k, a); } a[0] += N.getX(i); a[1] += N.getY(i); a[2] += N.getZ(i); }
  const on = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) { const a = acc.get(keys[i]), l = Math.hypot(a[0], a[1], a[2]) || 1; on[i * 3] = a[0] / l; on[i * 3 + 1] = a[1] / l; on[i * 3 + 2] = a[2] / l; }
  g = new T.BufferGeometry(); g.setAttribute('position', P); g.setAttribute('normal', new T.BufferAttribute(on, 3)); if (geo.index) g.setIndex(geo.index); g.boundingSphere = geo.boundingSphere; smoothCache.set(geo, g); return g;
}
let outlineMat = null;
D.outlineMat = () => outlineMat || (outlineMat = new T.ShaderMaterial({
  uniforms: { color: { value: new T.Color('#3A2A4A') }, px: { value: .0013 } }, side: T.BackSide,
  vertexShader: `uniform float px; void main(){ vec4 p = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      p = instanceMatrix * p; vec3 n = mat3(instanceMatrix) * normal;
    #else
      vec3 n = normal;
    #endif
    vec4 mv = modelViewMatrix * p; vec3 vn = normalize(normalMatrix * n); mv.xyz += vn * (-mv.z) * px; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: 'uniform vec3 color; void main(){ gl_FragColor = vec4(color, 1.0); }'
}));
D.outline = function (root) {
  if (!D.OUTLINE) return root; const add = [];
  root.traverse(o => { if (!o.isMesh || o.userData.outline || o.userData.noOutline || o.isSprite || o.userData.hasOutline) return; const m = o.material; if (!m || Array.isArray(m) || m.transparent || m.isShaderMaterial || m.isMeshBasicMaterial || !o.geometry.attributes.normal) return; if (o.geometry.type === 'PlaneGeometry' || o.geometry.type === 'CircleGeometry' || o.geometry.type === 'RingGeometry') return; add.push(o); });
  add.forEach(o => { const sg = smoothed(o.geometry), ol = o.isInstancedMesh ? new T.InstancedMesh(sg, D.outlineMat(), o.count) : new T.Mesh(sg, D.outlineMat()); if (o.isInstancedMesh) ol.instanceMatrix = o.instanceMatrix; ol.userData.outline = true; o.userData.hasOutline = true; ol.castShadow = false; ol.receiveShadow = false; if (o.material.clippingPlanes) { ol.material = D.outlineMat().clone(); ol.material.clippingPlanes = o.material.clippingPlanes; } o.add(ol); });
  return root;
};
D.finish = root => D.outline(D.optimize(root));
D.outlinePx = (cam, hPx, px = 2) => { D.outlineMat().uniforms.px.value = px * 2 * Math.tan(cam.fov * Math.PI / 360) / Math.max(100, hPx); };

/* ---------------- squishies ---------------- */
const sqCache = new Map();
/* a squishy model, ~ `size` units tall, standing at the origin, facing +z */
D.squishy = function (id, size = 2.6, mood) {
  const q = SQ.SQ[id]; if (!q) return new T.Group();
  const key = id + JSON.stringify(mood || {});
  let tpl = sqCache.get(key);
  if (!tpl) {
    const g = D.inflate(q.art(K, mood || {}), { bodyMin: 450, std: true });
    const bb = new T.Box3().setFromObject(g); const h = bb.max.y - bb.min.y || 1;
    g.position.set(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2 + (bb.max.z - bb.min.z) * 0);
    tpl = new T.Group(); tpl.add(g); D.optimize(g); tpl.userData.h = h; sqCache.set(key, tpl);
  }
  const out = tpl.clone(true); const s = size / tpl.userData.h; out.scale.setScalar(s); out.userData.sq = id;
  return out;
};
/* place a squishy with an idle animation. o: {ry, shadow, clipY (hide below this y, for window peeking), mood} */
D.SIZE = 1.5;
D.place = function (id, x, y, z, size = 2.4, anim = 'bob', o = {}) {
  size *= o.raw ? 1 : D.SIZE;
  const body = D.squishy(id, size, o.mood);
  const wrap = new T.Group(); wrap.add(body); wrap.position.set(x, y, z); wrap.rotation.y = o.ry || 0;
  if (anim && anim !== 'none') D.anim(anim === 'mow' || anim === 'peek' ? wrap : body, anim, { depth: o.depth || size * .6 });
  if (o.shadow !== false && !o.clipY) { const sh = D.blobShadow(size * .45); wrap.add(sh); }
  if (o.clipY != null) { const plane = new T.Plane(new T.Vector3(0, 1, 0), -o.clipY); body.traverse(m => { if (m.material) { m.material = m.material.clone(); m.material.clippingPlanes = [plane]; } }); wrap.userData.clip = plane; }
  if (o.inner) wrap.add(o.inner);
  wrap.userData.sqWrap = { size, anim, clip: o.clipY != null };
  return wrap;
};

/* ---------------- lights, scenes, renderers ---------------- */
D.lights = (scene, span = 40, o = {}) => {
  const toon = D.TOON;
  scene.add(new T.HemisphereLight('#FFFFFF', '#B9A8D8', o.hemi ?? (toon ? .42 : .55)));
  scene.add(new T.AmbientLight('#FFF0F6', o.amb ?? (toon ? .1 : .16)));
  const sun = new T.DirectionalLight('#FFF4E6', o.sun ?? (toon ? .6 : .78));
  sun.position.set(-span * .6, span * 1.4, span * .9); sun.castShadow = true;
  sun.shadow.mapSize.set(o.map || 1024, o.map || 1024); const c = sun.shadow.camera; c.left = c.bottom = -span; c.right = c.top = span; c.near = 1; c.far = span * 5;
  sun.shadow.bias = -.0008; sun.shadow.normalBias = .08; sun.shadow.radius = 3;
  scene.add(sun); scene.add(sun.target); return sun;
};
function fitCamera(cam, box, yaw, pitch, pad = 1.15) {
  const sph = box.getBoundingSphere(new T.Sphere()), r = sph.radius * pad, dist = r / Math.sin(cam.fov * Math.PI / 360) * (cam.aspect < 1 ? 1 / cam.aspect : 1);
  const c = sph.center; cam.position.set(c.x + dist * Math.cos(pitch) * Math.sin(yaw), c.y + dist * Math.sin(pitch), c.z + dist * Math.cos(pitch) * Math.cos(yaw)); cam.lookAt(c); return { c, dist };
}
D.fitCamera = fitCamera;

/* one shared offscreen renderer for thumbnails + sprites */
let snapR = null;
D.snap = function (obj, o = {}) {
  const w = o.w || 320, h = o.h || 300;
  if (!snapR) { snapR = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); snapR.shadowMap.enabled = true; snapR.shadowMap.type = T.PCFSoftShadowMap; snapR.localClippingEnabled = true; snapR.setPixelRatio(1); }
  snapR.setSize(w, h, false);
  const scene = new T.Scene(); scene.add(obj);
  const box = o.box || new T.Box3().setFromObject(obj); const span = box.getSize(new T.Vector3()).length() * .7;
  D.lights(scene, Math.max(10, span), { map: 1024 });
  const cam = new T.PerspectiveCamera(o.fov || 30, w / h, .1, 2000);
  fitCamera(cam, box, o.yaw ?? .45, o.pitch ?? .42, o.pad ?? 1.08);
  if (o.t != null) D.tick(D.collect(obj), o.t);
  snapR.setClearColor(0x000000, 0); D.outlinePx(cam, h, o.line ?? Math.max(1.3, h / 230)); snapR.render(scene, cam);
  const url = snapR.domElement.toDataURL('image/png'); scene.remove(obj); return url;
};
const spriteCache = new Map();
D.sprite = (id, mood, px = 220) => {
  const key = id + JSON.stringify(mood || {}) + px; if (spriteCache.has(key)) return spriteCache.get(key);
  const g = D.outline(D.squishy(id, 3, mood)); const box = new T.Box3().setFromObject(g);
  const url = D.snap(g, { w: px, h: px, yaw: .32, pitch: .16, pad: 1.0, fov: 26, box }); spriteCache.set(key, url); return url;
};

/* an interactive viewer (drag to turn, wheel/pinch to zoom) */
D.Viewer = class {
  constructor(el, o = {}) {
    this.el = el; this.o = o; this.yaw = o.yaw ?? .5; this.pitch = o.pitch ?? .45; this.zoom = 1; this.t0 = performance.now();
    this.r = new T.WebGLRenderer({ antialias: true, alpha: true }); this.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.r.shadowMap.enabled = true; this.r.shadowMap.type = T.PCFSoftShadowMap; this.r.localClippingEnabled = true;
    el.appendChild(this.r.domElement); this.r.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab';
    this.scene = new T.Scene(); this.cam = new T.PerspectiveCamera(o.fov || 30, 1, .1, 3000);
    this.anims = []; this.visible = true;
    const cv = this.r.domElement; let drag = null, pinch = null;
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; this.auto = false; });
    cv.addEventListener('pointermove', e => { if (!drag) return; this.yaw = drag.yaw - (e.clientX - drag.x) * .008; if (o.yawLim) this.yaw = Math.max(-o.yawLim, Math.min(o.yawLim, this.yaw)); if (o.tilt !== false) this.pitch = Math.max(o.pitchMin ?? .08, Math.min(o.pitchMax ?? 1.2, drag.pitch + (e.clientY - drag.y) * .005)); this.place(); });
    const up = () => { drag = null; cv.style.cursor = 'grab'; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { if (!e.ctrlKey && !this.o.wheel) return; e.preventDefault(); this.zoom = Math.max(.55, Math.min(1.6, this.zoom * (1 + e.deltaY * .001))); this.place(); }, { passive: false });
    this.auto = o.auto !== false;
    new ResizeObserver(() => this.resize()).observe(el);
    new IntersectionObserver(es => { this.visible = es[0].isIntersecting; if (this.visible) this.loop(); }).observe(el);
    this.resize();
  }
  set(obj) {
    if (this.obj) this.scene.remove(this.obj);
    this.scene.clear(); this.obj = obj; this.scene.add(obj);
    this.box = new T.Box3().setFromObject(obj); const span = this.box.getSize(new T.Vector3()).length() * .7;
    D.lights(this.scene, Math.max(10, span), { map: 2048 });
    this.anims = D.collect(obj); this.place(); this.loop();
  }
  resize() { const w = this.el.clientWidth, h = this.el.clientHeight || w * .8; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.place(); }
  place() { if (!this.box) return; const f = fitCamera(this.cam, this.box, this.yaw, this.pitch, this.o.pad || 1.05); const dir = this.cam.position.clone().sub(f.c).multiplyScalar(this.zoom); this.cam.position.copy(f.c).add(dir); this.cam.lookAt(f.c); this.dirty = true; }
  loop() {
    if (this.raf || !this.visible) return;
    const step = () => {
      this.raf = null; if (!this.visible || !this.obj) return;
      const t = (performance.now() - this.t0) / 1000;
      if (this.auto && this.o.spin) { this.yaw += .0025; this.place(); }
      D.tick(this.anims, t); D.outlinePx(this.cam, this.r.domElement.height, 2.2 * this.r.getPixelRatio()); this.r.render(this.scene, this.cam);
      if (!reduced) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
};
const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
D.reduced = reduced;
})();
