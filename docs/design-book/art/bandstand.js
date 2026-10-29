/* SQUEAK STAGE BANDSTAND — art file (music stage + "Squeak Beat" rhythm minigame)
   Grows from two crates into a concert shell.  Words live in bandstand.html */
SQ.reg('bandstand', {
  type: 'civic', name: 'Squeak Stage', mult: 2, unit: .9, goal: 'Clear # tracks', noPots: true, bench: false,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#7C4DDB' },
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.L('M-4 6 V-10 L8 -12 V4', '#7C4DDB', 2.4)}${K.E(-7, 6, 4, 3, '#7C4DDB', 0)}${K.E(5, 4, 4, 3, '#7C4DDB', 0)}</g>`,
  /* 3D model: grows from two crates into a concert shell */
  model(D, c) {
    const { G, at, cyl, ball, box, cube, cone, torus, tube, lathe } = D, L = c.L, PI = Math.PI, g = G();
    const note = (x, y, z, col, ph) => D.anim(at(G(at(ball(.35, col, 1.2, .9, .6), 0, 0, 0), at(cube(.08, 1.1, .08, col), .35, .55, 0), at(cube(.5, .12, .08, col), .6, 1.05, 0)), x, y, z), 'float', { ph });
    if (L >= 10) { const sh = D.mesh(new THREE.SphereGeometry(9.5, 32, 16, PI, PI, 0, PI / 2), D.mat('#FFF1DC', { side: THREE.DoubleSide })); g.add(at(sh, 0, 0, -1.5), ...[7.5, 8.5].map(r => at(torus(r, .15, '#E8C99A', PI, 6, 32), 0, 0, -1.4 + (9.5 - r) * .1))); }
    if (L <= 2) {
      g.add(at(box(3, 2, 2.4, '#C98A55', .1), -1.8, 1, 0), at(box(3.4, 1.4, 2.4, '#C98A55', .1), 1.6, .7, .2), at(cyl(.06, .06, 3, '#5A5170', 6), 4, 1.5, 1), at(ball(.3, '#5A5170'), 4, 3.1, 1), D.place('puppy', -1.8, 2, 0, 1.5, 'bob', { shadow: false }));
      if (L === 2) g.add(at(G(at(box(1.6, 2.2, 1.4, '#4B4152', .15), 0, 1.1, 0), at(cyl(.45, .45, .1, '#9A8FAA', 16), 0, 1.4, .72, PI / 2, 0, 0)), -6, 0, 1), D.lights3([[-8, 4, -2], [0, 3.2, -1], [8, 4, -2]]), note(5.6, 4, 1, '#7C4DDB', 0));
      return g;
    }
    const R = L >= 5 ? 7.2 : 6.2, deck = L >= 6 ? '#B48CFF' : '#C98A55';
    g.add(at(cyl(R, R + .3, 1, deck, 8), 0, .5, 0, 0, PI / 8, 0));
    if (L >= 6) { for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + PI / 8; if (Math.abs(Math.sin(a)) < .4 && Math.cos(a) > 0) continue; g.add(at(cube(.12, 1, .12, '#FFFFFF'), Math.sin(a) * (R - .3), 1.5, Math.cos(a) * (R - .3))); } g.add(at(torus(R - .3, .07, '#FFFFFF', PI * 2, 4, 8), 0, 2, 0, PI / 2, 0, PI / 8)); }
    if (L === 4) { [[-5, -3], [5, -3], [-5, 3], [5, 3]].forEach(([x, z]) => g.add(at(cyl(.15, .15, 6, '#8E5E34', 8), x, 4, z))); g.add(at(D.awning3(11, 7, ['#7C4DDB', '#FFFFFF'], .05), 0, 7, -3.5)); }
    if (L >= 5) {
      for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + PI / 8; g.add(at(cyl(.18, .18, 6.4, '#FFFFFF', 8), Math.sin(a) * (R - .5), 4.2, Math.cos(a) * (R - .5))); }
      const top = L >= 8 ? 5.2 : 4; g.add(at(lathe([[R + .8, 0], [R * .7, top * .5], [R * .3, top * .85], [0, top]], L >= 6 ? '#7C4DDB' : '#B48CFF', 8, false), 0, 7.4, 0, 0, PI / 8, 0), at(ball(.5, '#FFD54A'), 0, 7.4 + top + .3, 0));
      for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; g.add(at(ball(.55, i % 2 ? '#FFFFFF' : (L >= 6 ? '#7C4DDB' : '#B48CFF'), 1, .7, .5), Math.sin(a) * (R + .5), 7.2, Math.cos(a) * (R + .5), 0, a, 0)); }
    }
    if (L >= 8) [-1, 1].forEach(k => g.add(at(D.slab([[0, 0], [1.8, 0], [1.2, 5.4], [-.2, 5.4]].map(([x, y]) => [x * k, y]), .2, '#FF6F7D', .05), k * (R - 2.6), 1, 2.4)));
    g.add(D.place('puppy', -2.2, 1, .6, 1.6, 'bob', { shadow: false }), D.place('kitty', 2.2, 1, .6, 1.6, 'squish', { shadow: false }));
    if (L >= 6) g.add(D.place('octopus', 0, 1, -1.6, 1.6, 'sway', { shadow: false }));
    if (L >= 3) g.add(note(-4, 6, 2, '#7C4DDB', 0), note(4.4, 5.4, 2, '#FF6FA3', 1.6));
    if (L >= 7) [-10.2, 10.2].forEach(x => g.add(at(G(at(box(2, 3, 1.8, '#4B4152', .2), 0, 1.5, 0), at(cyl(.6, .6, .1, '#9A8FAA', 16), 0, 2, .92, PI / 2, 0, 0), at(cyl(.35, .35, .1, '#9A8FAA', 16), 0, .9, .92, PI / 2, 0, 0)), x, 0, 2)));
    if (L >= 8) [-1, 1].forEach(k => g.add(at(cone(1.6, 5, D.mat('#FFF3B0', { op: .25 }), 16, true), k * 4, 4, 4, .5, 0, k * .4)));
    if (L >= 9) { g.add(D.anim(at(G(at(ball(.9, '#7C4DDB', 1.2, .9, .6), -1, 0, 0), at(ball(.9, '#7C4DDB', 1.2, .9, .6), 1.4, .4, 0), at(cube(.25, 3, .25, '#7C4DDB'), -.1, 1.5, 0), at(cube(.25, 2.6, .25, '#7C4DDB'), 2.3, 1.7, 0), at(cube(2.6, .4, .25, '#7C4DDB'), 1.1, 3, 0, 0, 0, .15)), 0, 15, 0), 'bob')); const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * PI * 2; pts.push([Math.sin(a) * (R + .7), 7 - Math.abs(Math.sin(a * 4)) * .4, Math.cos(a) * (R + .7)]); } g.add(D.lights3(pts)); }
    return g;
  },

  mock(K) {
    // SQUEAK BEAT: piano-tiles style, the squishies themselves slide down four columns
    let s = `<rect width="236" height="452" fill="#2E2452"/><rect width="236" height="44" fill="#7C4DDB"/>` + [[30, 70], [200, 96], [120, 60], [60, 160], [180, 210]].map(([x, y]) => `<circle class="a-twinkle" cx="${x}" cy="${y}" r="1.8" fill="#FFF3B0"/>`).join('');
    s += K.R(8, 11, 70, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(43, 27, '18,450', 11) + K.Tb(100, 20, 'cheer', 7, '#FFFFFF') + K.R(86, 24, 60, 9, '#F2EFFA', 4.5, 1.4, '#2B2141') + K.R(87.5, 25.5, 44, 6, '#4FCFA0', 3, 0) + K.Tb(172, 20, 'song', 7, '#FFFFFF') + K.R(160, 24, 68, 9, '#F2EFFA', 4.5, 1.4, '#2B2141') + K.R(161.5, 25.5, 30, 6, '#FFD54A', 3, 0);
    const col = ['#FF6FA3', '#FFC93C', '#5ACB7A', '#4A9BFF'], lx = l => 8 + l * 55 + 27.5;
    col.forEach((c, l) => s += `<rect x="${8 + l * 55 + 2}" y="50" width="51" height="380" rx="12" fill="${c}" opacity=".14"/>`);
    // a long squishy with its hold stripe
    s += `<rect x="${lx(2) - 9}" y="120" width="18" height="150" rx="9" fill="${col[2]}" opacity=".8" stroke="#FFFFFF" stroke-width="2"/>` + K.star(lx(2), 122, 6, 2.6, '#FFF3B0', 1.2, '#2B2141');
    const tile = (l, y, id, next) => (next ? `<rect class="a-twinkle" x="${lx(l) - 24}" y="${y - 44}" width="48" height="44" rx="12" fill="none" stroke="#FFFFFF" stroke-width="3"/>` : '') + K.R(lx(l) - 21, y - 41, 42, 38, col[l], 10, 2, '#FFFFFF') + K.place(id, lx(l), y - 2, .4, 'squish');
    s += tile(0, 120, 'bao') + tile(3, 210, 'peachbun') + tile(2, 290, 'xlb') + tile(1, 368, 'gyoza', true);
    s += `<rect x="6" y="374" width="224" height="3" fill="#FFFFFF"/>` + K.T(lx(1), 318, 'PERFECT', 12, '#FFD54A', 'class="a-bob"');
    ['D', 'F', 'J', 'K'].forEach((k, l) => s += K.R(lx(l) - 22, 384, 44, 36, '#FFFFFF', 10, 1.4, '#FFFFFF').replace('fill="#FFFFFF"', 'fill="rgba(255,255,255,.18)"') + K.Tb(lx(l), 407, k, 12, '#FFFFFF'));
    s += K.T(118, 444, '24 combo · Bao Bounce', 11, '#FFD54A');
    return s;
  }
});
