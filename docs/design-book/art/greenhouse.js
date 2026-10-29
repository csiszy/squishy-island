/* SPROUT CLUB GREENHOUSE — art file (greenhouse + "Grow Grow Garden" minigame)
   Grows from a potting table into a crystal palace.  Words live in greenhouse.html */
SQ.reg('greenhouse', {
  type: 'civic', name: 'Sprout Club Greenhouse', mult: 2.2, unit: 2, goal: 'Best: # flowers in one run', noPots: true, bench: false,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#3BA7A0' },
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.L('M0 10 V-2', '#4E9B4E', 2)}${K.P('M0 -2 Q-12 -14 -12 -4 Q-6 2 0 -2Z', '#7ED36A', 1.4)}${K.P('M0 -2 Q12 -14 12 -4 Q6 2 0 -2Z', '#7ED36A', 1.4)}</g>`,
  /* 3D model: a potting table that grows into a crystal palace */
  model(D, c) {
    const { G, at, cyl, ball, box, cube, cone, torus, lathe } = D, L = c.L, PI = Math.PI, g = G();
    const glass = D.mat('#CFF3EE', { op: .35, r: .1 }), frame = '#3BA7A0';
    const plant = (x, z, col, h = 1.4) => G(at(cyl(.05, .05, h, '#4E9B4E', 5), x, h / 2, z), at(ball(.32, '#7ED36A', 1, .4, .8), x - .2, h * .5, z), at(ball(.28, col), x, h + .1, z), at(ball(.12, '#FFE27A'), x, h + .25, z + .12));
    const cols = ['#FF7AA8', '#FFD54A', '#B48CFF', '#FF8A5C', '#8CCBFF'];
    if (L <= 2) {
      g.add(at(box(7, .3, 3, '#C98A55', .08), 0, 2.6, 0), ...[[-3.2, -1.2], [3.2, -1.2], [-3.2, 1.2], [3.2, 1.2]].map(([x, z]) => at(cube(.25, 2.5, .25, '#8E5E34'), x, 1.25, z)), at(cyl(.6, .45, .9, '#D9824F', 14), 0, 3.2, 0), plant(0, 0, '#FF7AA8', 1).translateY(3.6));
      if (L === 2) g.add(at(box(3, .8, 2, '#C98A55', .1), -7, .4, 3), plant(-7.6, 3, '#FFD54A', .8).translateY(.8), plant(-6.4, 3, '#FFD54A', .8).translateY(.8), at(G(at(cyl(.6, .7, 1.2, '#5AA9E6', 14), 0, .6, 0), at(cyl(.1, .14, 1.4, '#5AA9E6', 6), .9, 1, 0, 0, 0, -.9)), 7, 0, 3));
      g.add(D.place('sprout', 4.6, 0, 3.6, 1.4, 'bob'));
      return g;
    }
    if (L === 3) { g.add(at(D.slab([[-5, 0], [5, 0], [5, 2.2], [-5, 3.4]], 4, glass, 0), 0, 0, 0), at(D.box(10.2, .2, 4.2, frame, .05), 0, .1, 0)); for (let i = 0; i < 6; i++) g.add(plant(-4 + i * 1.6, 0, cols[i % 5], 1.2)); g.add(D.place('sprout', 8, 0, 5, 1.4, 'bob')); return g; }
    const w = L >= 6 ? 17 : 12, dep = L >= 6 ? 10 : 8, h = L >= 6 ? 6.4 : 5;
    if (L >= 8) { const mill = G(at(cyl(.9, 1.3, 9, '#FFF1DC', 10), 0, 4.5, 0), at(cone(1.4, 1.6, '#C98A55', 10), 0, 9.8, 0)); const blades = G(); [0, 1, 2, 3].forEach(i => blades.add(at(G(at(box(.9, 4, .12, '#FFFFFF', .05), 0, 2.3, 0)), 0, 0, 0, 0, 0, i * PI / 2))); D.anim(blades, 'spinz', { sp: 1.2 }); mill.add(at(blades, 0, 8.6, 1.2), at(ball(.3, '#C98A55'), 0, 8.6, 1.2)); g.add(at(mill, -11, 0, -5)); }
    g.add(at(D.cube(w, h, dep, glass), 0, h / 2, 0));
    for (let i = 0; i <= 6; i++) { const x = -w / 2 + i * w / 6; g.add(at(cube(.16, h, .16, frame), x, h / 2, dep / 2), at(cube(.16, h, .16, frame), x, h / 2, -dep / 2)); }
    [0, h / 2, h].forEach(y => { g.add(at(cube(w, .16, .16, frame), 0, y, dep / 2), at(cube(w, .16, .16, frame), 0, y, -dep / 2), at(cube(.16, .16, dep, frame), -w / 2, y, 0), at(cube(.16, .16, dep, frame), w / 2, y, 0)); });
    if (L >= 7) { const dm = D.mesh(new THREE.SphereGeometry(dep / 2 + .6, 28, 12, 0, PI * 2, 0, PI / 2), glass, false); g.add(at(dm, 0, h, 0)); for (let i = 0; i < 6; i++) g.add(at(torus(dep / 2 + .6, .07, frame, PI, 4, 20), 0, h, 0, 0, i * PI / 6, 0)); g.add(at(ball(.5, L >= 10 ? D.mat('#FFD54A', { m: .4, r: .3 }) : frame), 0, h + dep / 2 + .9, 0)); }
    else { g.add(at(D.slab([[-w / 2 - .3, 0], [w / 2 + .3, 0], [0, 3]], dep + .4, glass, 0), 0, h, 0)); g.add(at(cube(.16, .16, dep + .4, frame), 0, h + 3, 0)); }
    const n = L >= 6 ? 8 : 6; for (let i = 0; i < n; i++) for (const z of [-1.5, 1.5]) g.add(plant(-w / 2 + 1.2 + i * (w - 2.4) / (n - 1), z, cols[(i + (z > 0)) % 5], 1.2 + (i % 3) * .5));
    g.add(at(box(2.4, 4, .2, D.mat('#E9FFFB', { op: .6 }), .05), 0, 2, dep / 2 + .1));
    if (L >= 5) [-1, 1].forEach(k => g.add(at(G(at(box(2.4, .8, 1.2, '#C98A55', .1), 0, .4, 0), plant(-.5, 0, '#FF7AA8', .8).translateY(.8), plant(.5, 0, '#FFD54A', 1).translateY(.8)), k * (w / 2 + 2), 0, dep / 2)));
    if (L >= 9) { g.add(D.tube([[-w / 2 - .1, 0, dep / 2 + .1], [-w / 2 + .5, 2, dep / 2 + .2], [-w / 2 - .1, 4, dep / 2 + .1], [-w / 2 + .6, 6, dep / 2 + .2]], .12, '#4E9B4E'), D.tube([[w / 2 + .1, 0, dep / 2 + .1], [w / 2 - .5, 2.4, dep / 2 + .2], [w / 2 + .1, 4.6, dep / 2 + .1]], .12, '#4E9B4E')); [[-w / 2, 2.6], [-w / 2 + .3, 5], [w / 2 - .2, 3.4]].forEach(([x, y]) => g.add(at(ball(.3, '#FF7AA8'), x, y, dep / 2 + .3))); [[-4, 11, 4], [5, 12, 3]].forEach(([x, y, z], i) => { const b = G(at(ball(.4, '#FFD54A', 1, .2, .7), -.35, 0, 0, 0, 0, .5), at(ball(.4, '#FFD54A', 1, .2, .7), .35, 0, 0, 0, 0, -.5)); D.anim(b, 'float', { ph: i * 2 }); g.add(at(b, x, y, z)); }); }
    g.add(D.place('sprout', L >= 8 ? 9 : w / 2 + 2, 0, dep / 2 + 3, 1.4, 'bob'));
    return g;
  },

  mock(K) {
    let s = `<rect width="236" height="452" fill="#E9FFF6"/><rect width="236" height="44" fill="#3BA7A0"/>`;
    s += K.R(8, 11, 86, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(51, 27, 'HARVEST 14', 11) + K.R(150, 11, 78, 22, '#FFFFFF', 11, 2, '#2B2141') + [0, 1, 2].map(i => K.P(`M${166 + i * 18} 27 c-7 -6 -6 -12 0 -9 c6 -3 7 3 0 9z`, '#FF5E6C', 1.4, '#2B2141')).join('');
    // 3x3 beds
    const stage = [0, 1, 2, 3, 2, 1, 3, 0, 2];
    stage.forEach((st, i) => {
      const x = 22 + (i % 3) * 66, y = 66 + Math.floor(i / 3) * 86;
      s += K.R(x, y, 60, 72, '#B5764A', 10, 2.2) + K.R(x + 5, y + 5, 50, 62, '#8E5E34', 8, 0);
      if (st === 0) s += `<circle cx="${x + 30}" cy="${y + 40}" r="3" fill="#E0B07A"/>`;
      if (st >= 1) s += K.L(`M${x + 30} ${y + 56} V${y + 56 - st * 10}`, '#4E9B4E', 2) + K.P(`M${x + 30} ${y + 50 - st * 4} q-10 -8 -12 0 q6 4 12 0Z`, '#7ED36A', 1.2) + K.P(`M${x + 30} ${y + 50 - st * 4} q10 -8 12 0 q-6 4 -12 0Z`, '#7ED36A', 1.2);
      if (st === 3) s += `<g class="a-bob">${K.C(x + 30, y + 22, 9, ['#FF7AA8', '#FFD54A', '#B48CFF'][i % 3], 1.8)}${K.C(x + 30, y + 22, 3.4, '#FFE27A', 0)}</g>` + K.spark(x + 50, y + 12, .6);
      if (i === 4) s += `<g class="a-float">${K.P(`M${x + 50} ${y - 6} q8 10 6 16 q-6 8 -12 0 q-2 -6 6 -16z`, '#8FD3FF', 1.4)}</g>`;
    });
    // snail pest
    s += `<g class="a-mow">${K.E(36, 324, 12, 4, '#B9D98A', 1.4)}${K.C(32, 316, 7, '#C98A55', 1.6)}${K.L('M44 320 l4 -8 M46 321 l6 -6', '#7C8B4A', 1.2)}</g>`;
    // tool bar
    s += K.R(8, 346, 220, 98, '#FFFFFF', 16, 2.4, '#2B2141') + K.Tb(22, 364, 'TOOLS', 10, '#3BA7A0', 'start');
    const tools = [
      (x, y) => K.P(`M${x - 10} ${y + 8} L${x - 8} ${y - 6} H${x + 6} L${x + 8} ${y + 8}Z`, '#5AA9E6', 1.6) + K.L(`M${x + 8} ${y - 2} l8 -6`, '#5AA9E6', 2.4),
      (x, y) => K.C(x, y, 8, '#FFD54A', 1.6, '#C98A12') + [0, 60, 120, 180, 240, 300].map(a => K.L(`M${(x + 11 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(y + 11 * Math.sin(a * Math.PI / 180)).toFixed(1)} l${(3 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(3 * Math.sin(a * Math.PI / 180)).toFixed(1)}`, '#F59E0B', 2)).join(''),
      (x, y) => K.R(x - 9, y - 9, 18, 18, '#E0B07A', 4, 1.6) + `<circle cx="${x - 3}" cy="${y - 2}" r="2" fill="#8E5E34"/><circle cx="${x + 3}" cy="${y + 3}" r="2" fill="#8E5E34"/>`,
      (x, y) => K.P(`M${x - 12} ${y - 2} H${x + 12} L${x + 8} ${y + 10} H${x - 8}Z`, '#C98A55', 1.6) + K.L(`M${x - 8} ${y - 2} Q${x} ${y - 16} ${x + 8} ${y - 2}`, '#C98A55', 2)
    ];
    tools.forEach((f, i) => { const x = 40 + i * 52; s += K.C(x, 400, 20, i === 0 ? '#E3F7FF' : '#F6F3FF', 2, i === 0 ? '#5AA9E6' : '#CFC8E3') + f(x, 400); });
    return s;
  }
});
