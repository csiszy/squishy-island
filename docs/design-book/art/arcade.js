/* SQUISH ARCADE — art file (arcade hall + "Squish Breaker" minigame)
   Words for this page live in arcade.html */
SQ.reg('arcade', {
  type: 'civic', name: 'Squish Arcade', sign: 'ARCADE', mult: 1.7, unit: 2, goal: 'Beat level #', bench: false,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#FF7A45' },
  wall: '#FFE8D6', roof: '#FF7A45', trim: '#FFFFFF', awn: ['#FF7A45', '#FFFFFF'], roofStyle: 'dome', door: '#7C4DDB',
  // icon: a ball bouncing off two bricks
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.R(-11, -11, 10, 7, '#FFD54A', 2, 1.4, '#2B2141')}${K.R(1, -11, 10, 7, '#FF6FA3', 2, 1.4, '#2B2141')}${K.C(-2, 7, 4.5, '#FFFFFF', 1.6, '#2B2141')}${K.L('M-2 2 L-6 -3', '#FF7A45', 1.6)}</g>`,
  /* 3D extras that appear on top of the generic fun building */
  extra3(D, L, g) {
    const { G, at, cyl, ball, box, cube } = D, PI = Math.PI, out = G();
    const brick = (c, x, y, z) => at(box(1.6, .9, .9, c, .15), x, y, z);
    // a stack of numbered bricks by the door
    if (L >= 3) out.add(at(G(brick('#FFD54A', -.9, .45, 0), brick('#FF6FA3', .9, .45, 0), brick('#A57CFF', 0, 1.4, 0)), -9.6, 0, 6.2));
    // a giant bouncing squishy ball on the roof
    if (L >= 5) out.add(D.place('kitty', 0, g.H + 1.4, -1, 1.8, 'hop'));
    // arcade cabinet outside
    if (L >= 7) { const cab = G(at(box(2.4, 4.4, 2, '#7C4DDB', .2), 0, 2.2, 0), at(cube(1.8, 1.4, .1, D.mat('#5ACB7A', { e: '#5ACB7A', ei: .5 })), 0, 3.2, 1.02), at(box(2.4, .5, 1, '#5B3BAA', .1), 0, 2.1, 1.2), at(cyl(.08, .08, .5, '#2B2141', 6), -.4, 2.5, 1.3), at(ball(.18, '#FF5E6C'), -.4, 2.8, 1.3), at(ball(.16, '#FFD54A'), .4, 2.45, 1.4)); out.add(at(cab, 10.2, 0, 4.8, 0, -.4, 0)); }
    // glowing neon bricks along the roof edge
    if (L >= 9) ['#FFD54A', '#FF6FA3', '#A57CFF', '#4A9BFF', '#5ACB7A'].forEach((c, i) => out.add(D.anim(at(box(1.4, .7, .5, D.mat(c, { e: c, ei: .8 }), .12), -4 + i * 2, g.H + .9, g.dep / 2 + .3), 'glow', { ph: i })));
    return out;
  },
  life3: (D, L) => L <= 2 ? D.place('puppy', 5.6, 0, 4.4, 1.5, 'hop') : null,

  mock(K) {
    // SQUISH BREAKER: bricks with numbers, a stream of squishy balls, aim line
    let s = `<rect width="236" height="452" fill="#2A2350"/><rect width="236" height="44" fill="#FF7A45"/>`;
    s += K.R(8, 11, 70, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(43, 27, 'Level 12', 10) + K.R(140, 11, 88, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(184, 27, '14 squishies', 10);
    const cols = ['#FFD54A', '#FF8FB8', '#B48CFF', '#4A9BFF'], B = [[0, 0, 12], [1, 0, 7], [3, 0, 18], [5, 0, 9], [6, 0, 3], [0, 1, 5], [2, 1, 21], [3, 1, 14], [4, 1, 6], [1, 2, 11], [5, 2, 16], [6, 2, 8], [2, 3, 4], [4, 3, 2]];
    B.forEach(([c, r, hp]) => { const x = 10 + c * 31, y = 56 + r * 30; s += K.R(x + 2, y + 2, 27, 26, cols[Math.min(3, Math.floor(hp / 6))], 6, 1.8, '#2B2141') + K.T(x + 15.5, y + 20, String(hp), 11, '#FFFFFF'); });
    s += `<path d="M10 330 H226" stroke="#FF6F7D" stroke-width="1.6" stroke-dasharray="6 4"/>`;
    // the aim line and a stream of squishies
    s += `<path d="M118 400 L196 230 L150 150" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round"/>`;
    [['bao', 160, 312], ['kitty', 176, 276], ['jelly', 190, 244], ['peach', 182, 200], ['marshmallow', 166, 170]].forEach(([id, x, y], i) => s += `<circle cx="${x}" cy="${y - 7}" r="11" fill="#FFFFFF" opacity=".2"/>` + K.place(id, x, y, .22, i % 2 ? 'bob' : 'squish'));
    s += K.place('puppy', 118, 410, .34, 'squish') + K.Tb(146, 398, '×9', 11, '#FFFFFF');
    s += K.R(8, 420, 220, 26, '#FFFFFF', 13, 0).replace('fill="#FFFFFF"', 'fill="rgba(255,255,255,.12)"') + K.Tb(118, 437, 'Drag to aim · let go to fire your squishies', 9, '#FFFFFF');
    return s;
  }
});
