/* FLUFF & PUFF SALON — art file (hair salon + "Style Studio" minigame)
   Words for this page live in salon.html */
SQ.reg('salon', {
  type: 'civic', name: 'Fluff & Puff Salon', sign: 'SALON', mult: 1.4, unit: 900, goal: 'Best score #', bench: false,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#C7509A' },
  wall: '#FFE3EF', roof: '#C7509A', trim: '#FFFFFF', awn: ['#C7509A', '#FFFFFF'], roofStyle: 'dome', door: '#C7509A',
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.C(-5, 6, 4, '#FFFFFF', 1.8, '#C7509A')}${K.C(5, 6, 4, '#FFFFFF', 1.8, '#C7509A')}${K.L('M-3 3 L6 -10 M3 3 L-6 -10', '#9A8FAA', 2.4)}</g>`,
  /* 3D extras that appear on top of the generic fun building */
  extra3(D, L, g) {
    const { G, at, cyl, ball, box } = D, PI = Math.PI, out = G();
    if (L >= 4) { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 64, 128); for (let i = -2; i < 8; i++) { x.fillStyle = i % 2 ? '#4A9BFF' : '#FF5E6C'; x.beginPath(); x.moveTo(0, i * 24); x.lineTo(64, i * 24 - 24); x.lineTo(64, i * 24 - 12); x.lineTo(0, i * 24 + 12); x.fill(); } const tex = new THREE.CanvasTexture(cv); const pole = D.mesh(new THREE.CylinderGeometry(.35, .35, 3.2, 16), new THREE.MeshStandardMaterial({ map: tex, roughness: .4 })); D.anim(pole, 'spin', { sp: 1.6 }); out.add(at(G(at(pole, 0, 1.9, 0), at(ball(.45, '#FFD54A'), 0, 3.7, 0), at(cyl(.45, .45, .3, '#C9CFD8', 14), 0, .2, 0)), -g.w / 2 - .7, 0, g.dep / 2 + .6)); }
    if (L >= 7) out.add(at(G(at(cyl(.08, .08, 2.2, '#9A8FAA', 6), 0, 1.1, 0), at(box(2.2, 1.4, .2, '#FFFFFF', .08), 0, 2.4, 0)), 10, 0, 6), D.place('bunny', 10.6, 0, 8, 1.5, 'bob', { inner: D.at(D.G(D.at(D.ball(.55, '#FF8FB8'), -.4, 0, 0), D.at(D.ball(.65, '#FF8FB8'), .2, .2, 0), D.at(D.ball(.5, '#FF8FB8'), .6, -.1, 0)), 0, 1.75, .2) }));
    if (L >= 9) { const y = g.H + 3; out.add(at(G(at(box(2.6, 1.6, 1.6, '#FF8FB8', .6), 0, 0, 0), at(cyl(.5, .5, 1.4, '#FFFFFF', 12), -1.8, 0, 0, 0, 0, PI / 2), at(box(.7, 1.6, .7, '#FF8FB8', .25), .6, -1.3, 0)), 0, y, -1.2)); [0, 1, 2].forEach(i => out.add(D.anim(at(ball(.25 + i * .08, D.mat('#FFFFFF', { op: .7 })), -3.6 - i * .9, y + .3 + i * .5, -1.2), 'float', { ph: i }))); }
    return out;
  },
  life3: (D, L) => L <= 2 ? D.place('kitty', 5.6, 0, 4.4, 1.5, 'bob') : null,

  mock(K) {
    let s = `<rect width="236" height="452" fill="#FFE3EF"/><rect width="236" height="44" fill="#C7509A"/>`;
    s += K.R(8, 11, 86, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(51, 27, 'MATCH ?', 11) + K.R(150, 11, 78, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(189, 27, 'Guest 3', 11);
    // mirror + reference card
    s += K.E(96, 150, 80, 92, '#F6FBFF', 4, '#FFD06B') + K.sh(54, 100, 10, 26, 20);
    s += K.R(160, 58, 68, 84, '#FFFFFF', 10, 2, '#2B2141') + K.Tb(194, 74, 'WANTS', 9, '#C7509A') + K.place('bunny', 194, 132, .5, 'squish', { inner: K.blobs([[28, 26, 10], [40, 18, 12], [56, 18, 12], [70, 26, 10]], '#B48CFF', 1.8) + K.P('M58 6 l10 -6 l2 10z M58 6 l-8 -8 l-2 10z', '#FFD54A', 1.4) });
    // chair + customer with half-done hair
    s += K.R(48, 230, 96, 16, '#C7509A', 8, 2.4) + K.R(90, 246, 12, 30, '#9A8FAA', 3, 2) + K.E(96, 280, 34, 6, '#9A8FAA', 2);
    s += K.place('bunny', 96, 238, 1, 'squish', { inner: K.blobs([[28, 30, 10], [40, 22, 12], [56, 22, 12]], '#B48CFF', 1.8) + K.blobs([[70, 26, 9]], '#FFFFFF', 1.8, '#C9BFB0') });
    s += `<g class="a-wiggle">${K.R(170, 188, 16, 22, '#8CCBFF', 4, 2, '#2B2141')}${K.R(174, 181, 8, 7, '#FFFFFF', 2, 1.6, '#2B2141')}</g>` + [[192, 182], [198, 190], [194, 198]].map(([x, y]) => `<circle class="a-twinkle" cx="${x}" cy="${y}" r="2.4" fill="#C7509A"/>`).join('');
    // tool tray
    s += K.R(8, 300, 220, 144, '#FFFFFF', 16, 2.4, '#2B2141') + K.Tb(22, 320, 'TOOLS', 10, '#C7509A', 'start') + K.Tb(22, 384, 'COLOURS & EXTRAS', 10, '#C7509A', 'start');
    // comb, fringe, spray, then Done!
    const tools = [
      (x, y) => K.R(x - 10, y - 4, 20, 8, '#FFD06B', 2, 1.6) + K.L(`M${x - 8} ${y + 4} v5 M${x - 4} ${y + 4} v5 M${x} ${y + 4} v5 M${x + 4} ${y + 4} v5 M${x + 8} ${y + 4} v5`, '#C98A12', 1.4),
      (x, y) => K.P(`M${x - 10} ${y - 8} H${x + 10} V${y + 2} q-2.5 6 -5 0 q-2.5 6 -5 0 q-2.5 6 -5 0 q-2.5 6 -5 0Z`, '#B48CFF', 1.6, '#2B2141'),
      (x, y) => K.R(x - 6, y - 5, 12, 15, '#8CCBFF', 3, 1.6, '#2B2141') + K.R(x - 3, y - 10, 6, 5, '#FFFFFF', 1, 1.4, '#2B2141')
    ];
    tools.forEach((f, i) => { const x = 36 + i * 54; s += K.C(x, 348, 20, i === 0 ? '#FFF3B0' : '#F6F3FF', 2, i === 0 ? '#F59E0B' : '#CFC8E3') + f(x, 348); });
    s += K.C(198, 348, 22, '#C7509A', 2, '#2B2141') + K.T(198, 353, 'Done!', 10, '#FFFFFF');
    ['#B48CFF', '#FF8FB8', '#8CCBFF', '#FFD54A', '#7ED3B2'].forEach((col, i) => s += K.P(`M${32 + i * 34} 400 q10 12 0 22 q-10 -10 0 -22z`, col, 1.6));
    s += K.P('M196 410 l10 -6 l2 12z M196 410 l-10 -6 l-2 12z', '#FF6FA3', 1.4) + K.C(196, 410, 3, '#FF6FA3', 1);
    return s;
  }
});
