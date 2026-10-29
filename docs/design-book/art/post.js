/* SQUISHY POST OFFICE — art file (post office + "Sort-a-Lot" minigame)
   Words for this page live in post.html */
SQ.reg('post', {
  type: 'civic', name: 'Squishy Post Office', sign: 'POST', mult: 1.5, unit: 4, goal: 'Best: # letters sorted', bench: 24,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#3BA7A0' },
  wall: '#FFF3C4', roof: '#3BA7A0', trim: '#FFFFFF', awn: ['#3BA7A0', '#FFFFFF'], roofStyle: 'gable', door: '#3BA7A0',
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.R(-11, -8, 22, 16, '#FFFFFF', 2, 1.8, '#3BA7A0')}${K.L('M-11 -8 L0 2 L11 -8', '#3BA7A0', 1.6)}${K.C(0, 2, 2.4, '#FF6FA3', 0)}</g>`,
  /* 3D extras that appear on top of the generic fun building */
  extra3(D, L, g) {
    const { G, at, cyl, ball, box, cube, torus } = D, PI = Math.PI, out = G();
    if (L >= 4) out.add(at(G(at(cyl(.15, .15, 1.6, '#5A5170', 8), 0, .8, 0), at(box(1.2, 1.5, 1, '#FF5E6C', .3), 0, 2.2, 0), at(cyl(.6, .6, 1, '#FF5E6C', 16), 0, 2.95, 0, PI / 2, 0, 0), at(cube(.7, .12, .1, '#2B2141'), 0, 2.6, .52)), g.w / 2 + 1.4, 0, g.dep / 2 + 1.4));
    if (L >= 7) out.add(at(G(at(torus(.6, .1, '#5A5170', PI * 2, 6, 20), -1, .6, 0), at(torus(.6, .1, '#5A5170', PI * 2, 6, 20), 1, .6, 0), at(cube(2, .12, .12, '#3BA7A0'), 0, 1.2, 0, 0, 0, .1), at(cube(.12, 1, .12, '#3BA7A0'), -.4, 1.5, 0), at(box(1, .7, .8, '#C98A55', .1), 1.1, 1.6, 0)), -10.2, 0, 6, 0, .3, 0), D.place('hargow', -8.6, 0, 8, 1.4, 'bob', { inner: D.at(D.letter3(), .5, 1, .5) }));
    if (L >= 9) { const y = g.H + 4.8; const plane = D.anim(at(D.slab([[0, 0], [1.6, .3], [0, .7]], .1, '#FFFFFF', 0), 0, 0, 0), 'spin', { sp: .8 }); out.add(at(cyl(.06, .06, 1.6, '#5A5170', 6), 0, y, 0), at(G(plane), 0, y + .9, 0)); }
    return out;
  },
  life3: (D, L) => L <= 2 ? D.place('hargow', 5.6, 0, 4.4, 1.5, 'bob', { inner: D.at(D.letter3(), .5, 1, .5) }) : null,

  mock(K) {
    let s = `<rect width="236" height="452" fill="#FFF7D6"/><rect width="236" height="44" fill="#3BA7A0"/>`;
    s += K.R(8, 11, 86, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(51, 27, 'SORTED 23', 11) + K.R(150, 11, 78, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(189, 27, 'STREAK ×5', 11);
    // conveyor
    s += K.R(-4, 176, 244, 26, '#5A5170', 6, 2) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => K.C(14 + i * 30, 189, 7, '#9A8FAA', 1.4, '#2B2141')).join('');
    const env = (x, y, col, r = 0, big) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${big ? 1.5 : 1})">${K.R(-18, -12, 36, 24, '#FFFFFF', 3, 2, '#9A8FAA')}${K.L('M-18 -12 L0 2 L18 -12', '#9A8FAA', 1.6)}${K.R(8, -9, 8, 9, col, 1, 1.2)}</g>`;
    s += env(30, 162, '#E2B676') + env(86, 162, '#FF8FB8') + env(198, 162, '#7ED3B2');
    // letter being swiped
    s += `<g class="a-bob">${env(122, 250, '#8CCBFF', -10, true)}</g>` + K.L('M118 276 Q112 310 148 340', '#FF6FA3', 3) + K.P('M140 340 L154 344 L150 330Z', '#FF6FA3', 1.4) + `<g class="a-bob">${K.P('M150 284 q6 -18 0 -30 q14 4 16 18 q2 12 -6 18 z', '#FFE3D6', 1.6, '#2B2141')}</g>`;
    // mail bags (one per family colour)
    const bags = [['#E2B676', 'bao'], ['#FF8FB8', 'marshmallow'], ['#8CCBFF', 'jelly'], ['#7ED3B2', 'sprout']];
    bags.forEach(([col, id], i) => { const x = 32 + i * 57; s += K.P(`M${x - 24} 440 Q${x - 28} 370 ${x - 14} 362 H${x + 14} Q${x + 28} 370 ${x + 24} 440Z`, col, 2.4) + K.L(`M${x - 14} 362 Q${x} 352 ${x + 14} 362`, K.dk(col), 2) + K.place(id, x, 420, .34, 'squish'); });
    s += K.R(68, 54, 100, 58, '#FFFFFF', 10, 2, '#2B2141') + K.Tb(118, 70, 'NEXT UP', 9, '#3BA7A0') + env(118, 92, '#FFD54A', 0) + K.Tb(118, 130, 'Swipe each letter to the bag', 9.5, '#5E5679') + K.Tb(118, 143, 'with the same stamp colour', 9.5, '#5E5679');
    return s;
  }
});
