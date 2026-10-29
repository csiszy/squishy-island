/* SWAP MEET MARKET — art file (player-to-player squishy trading)
   Grows from a picnic blanket into a grand bazaar.  Words live in market.html */
SQ.reg('market', {
  type: 'civic', name: 'Swap Meet Market', mult: 1.3, unit: 3, goal: 'Finish # trades', noPots: true, bench: false,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#2E8A84' },
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.L('M-10 -4 H8 M3 -9 L8 -4 L3 1', '#3BA7A0', 2.6)}${K.L('M10 5 H-8 M-3 0 L-8 5 L-3 10', '#FF6FA3', 2.6)}</g>`,
  /* 3D model: grows from a picnic blanket into a grand bazaar */
  model(D, c) {
    const { G, at, cyl, ball, box, cube, cone, torus } = D, L = c.L, PI = Math.PI, g = G();
    const tent = (x, z, col, goods = '#FFD54A') => at(G(...[[-1.9, 1.3], [1.9, 1.3], [-1.9, -1.3], [1.9, -1.3]].map(([a, b]) => at(cyl(.1, .1, 3.2, '#8A6A4E', 6), a, 1.6, b)), at(box(4.2, 1.4, 2.4, '#C98A55', .12), 0, .7, .3), ...[0, 1, 2].map(i => at(ball(.38, [goods, '#FF8FB8', '#8CCBFF'][i]), -1.2 + i * 1.2, 1.7, .6)), at(cone(3.6, 2, col, 4), 0, 4.2, 0, 0, PI / 4, 0), at(cone(3.62, 2.02, D.mat('#FFFFFF'), 4, true), 0, 4.21, 0, 0, PI / 4 + .2, 0)), x, 0, z);
    if (L === 1) { g.add(at(box(9, .12, 6, '#FF8FB8', .05), 0, .06, 0), at(cube(9.02, .13, .5, '#FFFFFF'), 0, .07, 0), at(cube(.5, .13, 6.02, '#FFFFFF'), 0, .07, 0), D.place('kitty', -2.4, .1, .4, 1.6, 'bob', { ry: .6 }), D.place('bao', 2.4, .1, .4, 1.6, 'bob', { ry: -.6 }), at(G(at(cyl(.06, .06, 1.6, '#8A6A4E', 6), 0, .8, 0), at(D.signPlane(SQ.B.market, '', 1.6, 1.2), 0, 1.9, .03)), 0, 0, -1.6)); return g; }
    if (L === 2) { g.add(at(box(6, 1.8, 2.6, '#C98A55', .12), 0, .9, 0), at(cyl(.08, .08, 4.6, '#8A6A4E', 6), 0, 2.3, -.4), at(cone(3.4, 1.2, '#3BA7A0', 16), 0, 5, -.4), D.place('kitty', -1.6, 1.8, .2, 1.4, 'bob', { shadow: false }), D.place('bao', 1.6, 1.8, .2, 1.4, 'squish', { shadow: false }), at(G(at(cyl(.06, .06, 1.6, '#8A6A4E', 6), 0, .8, 0), at(D.signPlane(SQ.B.market, '', 1.6, 1.2), 0, 1.9, .03)), 5, 0, 2)); return g; }
    const hall = L >= 5, roofed = L >= 6;
    if (L >= 7) { g.add(at(box(3.6, 11, 3.6, '#FFF3C4', .2), 0, 5.5, -4.6), at(cyl(1.2, 1.2, .2, '#FFFFFF', 24), 0, 9, -2.7, PI / 2, 0, 0), at(cube(.12, .9, .1, '#2B2141'), 0, 9.3, -2.55), at(cube(.7, .12, .1, '#2B2141'), .3, 9, -2.55), at(cone(2.6, 2, '#3BA7A0', 4), 0, 12, -4.6, 0, PI / 4, 0)); }
    if (L >= 9) g.add(at(D.mesh(new THREE.SphereGeometry(2.2, 20, 10, 0, PI * 2, 0, PI / 2), D.mat('#CFF3EE', { op: .5, r: .1 }), false), 0, 13, -4.6), at(ball(.4, L >= 10 ? D.mat('#FFD54A', { m: .4, r: .3 }) : '#3BA7A0'), 0, 15.4, -4.6));
    if (hall) { [[-10, 4.4], [-3.4, 4.4], [3.4, 4.4], [10, 4.4], [-10, -4.4], [10, -4.4]].forEach(([x, z]) => g.add(at(cyl(.25, .25, 6.4, '#8A6A4E', 8), x, 3.2, z))); if (roofed) { g.add(at(D.slab([[-11.6, 0], [11.6, 0], [0, 4.6]], 10.6, '#3BA7A0', .15), 0, 6.4, 0), at(box(7.4, 1.6, .3, '#FFFFFF', .1), 0, 7.6, 5.4), at(D.signPlane({ icon: SQ.B.market.icon, roof: '#2E8A84' }, 'SWAP MEET', 7, 1.4), 0, 7.6, 5.58)); } else g.add(at(cube(20.4, .3, .3, '#8A6A4E'), 0, 6.4, 4.4), at(cube(20.4, .3, .3, '#8A6A4E'), 0, 6.4, -4.4), at(cube(.3, .3, 9, '#8A6A4E'), -10, 6.4, 0), at(cube(.3, .3, 9, '#8A6A4E'), 10, 6.4, 0), at(D.slab([[-10.4, 0], [10.4, 0], [0, 3.6]], .3, '#8A6A4E', 0), 0, 6.4, 4.4)); }
    const tents = L === 3 ? [[-3.4, '#FF6FA3'], [3.4, '#3BA7A0']] : [[-6.4, '#FF6FA3'], [0, '#3BA7A0'], [6.4, '#B48CFF']];
    tents.forEach(([x, col]) => g.add(tent(x, 1, col)));
    if (L === 4) g.add(D.lights3([[-10, 5.4, 3], [0, 4.6, 3.4], [10, 5.4, 3]]));
    if (L >= 8) [[-10, 5.6, 4.6, '#FFD54A'], [-3.4, 5.6, 4.6, '#FF6FA3'], [3.4, 5.6, 4.6, '#FF6FA3'], [10, 5.6, 4.6, '#FFD54A']].forEach(([x, y, z, col]) => g.add(D.lantern(x, y, z, col, true)));
    if (L >= 9) g.add(D.lights3([[-11, 6.4, 5.4], [0, 5.6, 6], [11, 6.4, 5.4]]));
    if (L >= 10) g.add(D.flag3(-11.4, 6.4, 5, '#FF6FA3'), D.flag3(11.4, 6.4, 5, '#FFD54A'), D.medal(5.2, 7.6, 5.7, .8));
    g.add(D.place('kitty', -8.6, 0, 7.4, 1.5, 'bob'), D.place('octopus', 8.6, 0, 7.4, 1.5, 'squish'));
    if (L >= 5) g.add(D.place('banana', 0, 0, 7.6, 1.5, 'bob'));
    return g;
  },

  mock(K) {
    let s = `<rect width="236" height="452" fill="#E9FFFB"/><rect width="236" height="44" fill="#3BA7A0"/>`;
    s += K.T(118, 30, 'Trade with Mila', 15, '#FFFFFF');
    const panel = (y, title, items, col) => K.R(8, y, 220, 120, '#FFFFFF', 16, 2.4, col) + K.Tb(22, y + 18, title, 10, col, 'start') + items.map((id, i) => K.R(18 + i * 70, y + 28, 60, 78, '#F6F3FF', 12, 1.6, '#CFC8E3') + K.place(id, 48 + i * 70, y + 88, .5, 'squish') + K.R(24 + i * 70, y + 92, 48, 10, SQ.RARITY[SQ.SQ[id].r].color, 5, 0)).join('');
    s += panel(56, 'MILA OFFERS', ['macaron', 'strawberry'], '#FF6FA3') + panel(214, 'YOU OFFER', ['banana'], '#3BA7A0');
    // swap arrows between the two offers
    s += K.C(118, 196, 13, '#FFFFFF', 2, '#2B2141') + K.L('M110 192 H126 M122 188 L126 192 L122 196', '#3BA7A0', 2.4) + K.L('M126 201 H110 M114 197 L110 201 L114 205', '#FF6FA3', 2.4);
    // buttons
    [['#FFC94D', 'plus', 60], ['#FF6F7D', 'x', 118], ['#4FCFA0', 'tick', 176]].forEach(([col, k, x]) => {
      s += K.C(x, 376, 26, col, 3, '#2B2141');
      if (k === 'plus') s += K.L(`M${x - 10} 376 H${x + 10} M${x} 366 V386`, '#FFFFFF', 5);
      if (k === 'x') s += K.L(`M${x - 8} 368 L${x + 8} 384 M${x + 8} 368 L${x - 8} 384`, '#FFFFFF', 5);
      if (k === 'tick') s += K.L(`M${x - 10} 376 L${x - 3} 384 L${x + 11} 368`, '#FFFFFF', 5);
    });
    s += K.Tb(60, 418, 'Ask more', 9, '#5E5679') + K.Tb(118, 418, 'Decline', 9, '#5E5679') + K.Tb(176, 418, 'Accept', 9, '#5E5679');
    s += K.R(40, 428, 156, 18, '#FFF3B0', 9, 0) + K.Tb(118, 441, 'Both players must tap accept', 8.5, '#8A5A00');
    return s;
  }
});
