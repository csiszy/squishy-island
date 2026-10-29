/* SQUISHY FACTORY — art file (where Mystery Boxes are opened)
   Grows from a little workshop into a candy-striped factory.  Words live in factory.html */
SQ.reg('factory', {
  type: 'civic', name: 'Squishy Factory', mult: 1, unit: 5, goal: 'Open # boxes', noPots: true, bench: false,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#FF6FA3' },
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${SQ.B.factory.box(K, 0, 0, .9, '#FF6FA3')}</g>`,
  /* Gem Shop exclusives: sold only for Squish Gems, never inside any box.
     Kept OUT of the normal squishy list on purpose (rarity 'X'), so box rolls and the
     48-squishy collection count never see them. factory.html registers them for its pictures. */
  exclusives: [
    { id: 'prismmochi', name: 'Prism Mochi', r: 'X', gems: 500, home: 'Visits any house you pick',
      bio: 'A see-through mochi that splits sunlight into little rainbows on the floor. Very calm, very shiny.',
      art: (K, m) => `<defs><linearGradient id="prismG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC2DA"/><stop offset=".35" stop-color="#FFEFA8"/><stop offset=".65" stop-color="#B4F2D6"/><stop offset="1" stop-color="#C3CCFF"/></linearGradient></defs>` + K.P('M50 30 Q84 31 86 62 Q86 88 50 88 Q14 88 14 62 Q16 31 50 30Z', 'url(#prismG)', 2.2, '#9B7BD6') + K.L('M22 70 Q24 80 32 84 M74 40 Q80 46 81 54', '#FFFFFF', 2.4) + K.sh(34, 44, 7, 3.5) + K.face(50, 66, .9, m) + K.spark(86, 32, .7) + K.spark(14, 44, .5, '#8CE0FF') },
    { id: 'starbun', name: 'Starlight Bun', r: 'X', gems: 500, home: 'Visits any house you pick',
      bio: 'A night-time bun with a golden star on top. Glows softly at bedtime so nobody is scared of the dark.',
      art: (K, m) => K.P('M18 86 Q14 42 50 34 Q86 42 82 86 Q50 94 18 86Z', '#CFC6FF', 2.2, '#7C6BD6') + K.L('M42 38 Q50 30 58 38', '#A99BF0', 1.8) + K.star(50, 28, 10, 4.4, '#FFD54A', 2, '#C98A12') + [[28, 56], [72, 52], [64, 78], [34, 78]].map(([x, y]) => K.star(x, y, 3.2, 1.4, '#FFF3B0', .8, '#C98A12')).join('') + K.sh(34, 52, 7, 3.5) + K.face(50, 64, 1, m) + K.spark(86, 40, .6) }
  ],
  /* a mystery box, centred at (x,y) */
  box(K, x, y, s = 1, col = '#FF6FA3', q = true) {
    return `<g transform="translate(${x} ${y}) scale(${s})">${K.P('M-12 -6 L0 -12 L12 -6 L0 0Z', K.lt(col, .35), 1.6, K.dk(col))}${K.P('M-12 -6 L0 0 V14 L-12 8Z', col, 1.6, K.dk(col))}${K.P('M12 -6 L0 0 V14 L12 8Z', K.dk(col, .15), 1.6, K.dk(col))}${K.L('M-6 -9 L6 -3 M-6 -3 V11', '#FFFFFF', 2)}${q ? `<text x="6" y="9" font-family="Nunito,sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">?</text>` : ''}</g>`;
  },
  /* 3D model: a little workshop that grows into a candy-striped factory */
  model(D, c) {
    const { G, at, cyl, ball, box, cube, cone, torus } = D, L = c.L, PI = Math.PI, g = G(), B = SQ.B.factory;
    const wall = '#E7E0FF';
    if (L <= 2) {
      g.add(at(box(9, 5, 7, wall, .25), 0, 2.5, 0), at(D.slab([[-5.2, 0], [5.2, 0], [0, 3.4]], 8, '#FF6FA3', .15), 0, 5, 0), at(box(1.2, 4, 1.2, '#B48CFF', .1), 3, 7, -1.5), c.door(0, 0, 3.55, 2.4, 3.6, '#FFFFFF', { arch: false }), c.win(-3, 2.8, 3.55, 1.6, 1.6, { noBox: 1 }), c.win(3, 2.8, 3.55, 1.6, 1.6, { noBox: 1 }), at(B.box3(D, '#FF6FA3', 1.2), -6.4, 0, 4.6), D.place('bao', -8.6, 0, 6.6, 1.5, 'bob'));
      if (L === 2) g.add(D.puffs(3, 9.4, -1.5, '#F1EDFF'), at(box(5, .8, 3, '#C98A55', .1), 7.6, .4, 2), at(B.box3(D, '#FFD54A', 1), 6.8, .8, 2), at(B.box3(D, '#7ED3B2', 1), 8.4, .8, 2.2), at(B.box3(D, '#8CCBFF', 1), 7.6, 2, 2));
      return g;
    }
    const fl = L >= 6 ? 2 : 1, w = L >= 5 ? 16 : 14, dep = 10, H = fl * 5.4;
    if (L >= 8) { g.add(at(box(4.4, 5, 5, '#C9D3E2', .2), -w / 2 - 2.6, 2.5, -1)); const gear = (r, col, sp) => { const gr = G(at(cyl(r, r, .5, col, 20), 0, 0, 0, PI / 2, 0, 0)); for (let i = 0; i < 10; i++) gr.add(at(cube(.5, .6, .5, col), Math.cos(i / 10 * PI * 2) * (r + .2), Math.sin(i / 10 * PI * 2) * (r + .2), 0, 0, 0, i / 10 * PI * 2)); return D.anim(gr, 'spinz', { sp }); }; g.add(at(gear(1.3, '#FFD54A', .8), -w / 2 - 2.6, 3.4, 1.6), at(gear(.8, '#FF8A5C', -1.3), -w / 2 - 1.4, 1.6, 1.6)); }
    g.add(at(box(w, H, dep, wall, .3), 0, H / 2, 0));
    for (let y = 1; y < H; y += 1.1) g.add(at(cube(w - .2, .06, .06, '#CFC4F5'), 0, y, dep / 2 + .02));
    const teeth = 4; for (let i = 0; i < teeth; i++) { const x0 = -w / 2 + i * w / teeth; g.add(at(D.slab([[0, 0], [w / teeth, 0], [w / teeth, 2.6]], dep + .6, '#FF6FA3', .1), x0, H, 0), at(cube(.12, 2.2, dep, D.mat('#BFE6F7', { r: .2 })), x0 + w / teeth - .1, H + 1.2, 0)); }
    if (fl === 2) [-.36, -.12, .12, .36].forEach(t => g.add(c.win(t * w, 5.4 + 2.6, dep / 2 + .05, 2.2, 2, { noBox: 1 })));
    g.add(c.win(-w / 2 + 2.4, 2.6, dep / 2 + .05, 2.8, 2.4, { noBox: 1 }), c.win(w / 2 - 2.4, 2.6, dep / 2 + .05, 2.8, 2.4, { noBox: 1 }));
    g.add(at(G(at(box(5, 4.6, .3, '#F4F1F8', .1), 0, 2.3, 0), ...[0, 1, 2, 3].map(i => at(cube(4.6, .07, .1, '#C8C0D6'), 0, .9 + i, .18))), 0, 0, dep / 2), at(box(6.4, 1.1, .3, '#FFD54A', .15), 0, 5.1 - (fl === 2 ? 0 : .2), dep / 2 + .2), at(D.signPlane({ icon: null, roof: '#8A5A00' }, 'SQUISH CO.', 6, 1, { bg: '#FFD54A', ink: '#8A5A00' }), 0, 5.1 - (fl === 2 ? 0 : .2), dep / 2 + .37));
    if (L >= 7) { const st = G(); for (let i = 0; i < 6; i++) st.add(at(cyl(1, 1, 1.3, i % 2 ? '#FF6FA3' : '#FFFFFF', 18), 0, i * 1.3 + .65, 0)); st.add(at(cyl(1.3, 1.3, .5, '#FF6FA3', 18), 0, 8, 0)); g.add(at(st, w / 2 - 2, H, -2.6)); [0, 1, 2].forEach(i => { const hp = G(at(ball(.5, L >= 10 ? ['#FF6F7D', '#FFE066', '#8CCBFF'][i] : '#FF9EC0'), -.3, 0, 0), at(ball(.5, L >= 10 ? ['#FF6F7D', '#FFE066', '#8CCBFF'][i] : '#FF9EC0'), .3, 0, 0), at(cone(.7, .8, L >= 10 ? ['#FF6F7D', '#FFE066', '#8CCBFF'][i] : '#FF9EC0', 12), 0, -.55, 0, PI, 0, 0)); g.add(D.anim(at(hp, w / 2 - 2, H + 9.4, -2.6), 'smoke', { ph: i })); }); }
    else g.add(at(box(1.6, 4, 1.6, '#B48CFF', .1), w / 2 - 2, H + 2, -2.6), D.puffs(w / 2 - 2, H + 4.4, -2.6, '#F1EDFF'));
    if (L >= 4) { g.add(at(box(6, .5, 2.2, '#5A5170', .2), w / 2 + 2.6, 1.6, 4), ...[0, 1, 2, 3].map(i => at(cyl(.12, .12, 1.6, '#9A8FAA', 6), w / 2 + .4 + i * 1.5, .7, 4))); const belt = G(at(B.box3(D, '#7ED3B2', 1), 0, 0, 0), at(B.box3(D, '#FFD54A', 1), 2, 0, 0)); D.anim(belt, 'mow', { amp: .5 }); g.add(at(belt, w / 2 + .4, 1.85, 4)); }
    if (L >= 5) { const big = D.place('marshmallow', -w / 2 + 4, H + .1, 0, 3.2, 'squish', { shadow: false }); g.add(big); }
    if (L >= 9) g.add(at(B.box3(D, '#FFD54A', 2.4), 1.2, H + 2.6, -1.6), D.sparkle(1.2, H + 6, -1.6, 1.6), D.lights3([[-w / 2, H + .2, dep / 2 + .3], [0, H - .8, dep / 2 + .6], [w / 2, H + .2, dep / 2 + .3]]));
    if (L >= 10) g.add(D.flag3(-w / 2 + .5, H + 2.6, dep / 2 - .5, '#FF6FA3'), D.medal(0, H + 1.4, dep / 2 + .8));
    g.add(D.place('bao', -10.4, 0, 7.6, 1.5, 'bob'));
    return g;
  },
  /* a 3D mystery box */
  box3(D, col = '#FF6FA3', s = 1) {
    const { G, at, box, cube } = D;
    return at(G(at(box(1.2 * s, 1.2 * s, 1.2 * s, col, .12 * s), 0, .6 * s, 0), at(cube(1.24 * s, 1.24 * s, .2 * s, '#FFFFFF'), 0, .6 * s, 0), at(cube(.2 * s, 1.24 * s, 1.24 * s, '#FFFFFF'), 0, .6 * s, 0), at(D.ball(.22 * s, '#FFFFFF', 1.4, .7, 1.4), 0, 1.25 * s, 0)), 0, 0, 0);
  },

  mock(K) {
    const B = SQ.B.factory;
    let s = `<rect width="236" height="452" fill="#F1EDFF"/><rect width="236" height="44" fill="#FF6FA3"/>`;
    s += K.R(8, 11, 90, 22, '#FFFFFF', 11, 2, '#2B2141') + K.C(22, 22, 6, '#FFD54A', 1.4, '#C98A12') + K.Tb(60, 27, '2,350', 11) + K.R(132, 11, 96, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(180, 27, 'Rare in 4 boxes', 9);
    s += K.T(118, 74, 'Pick a box!', 18, '#2B2141');
    [['Mystery Box', '#FF6FA3', '200', 60], ['Family Box', '#7ED3B2', '500', 118], ['Golden Box', '#FFD54A', '1000', 176]].forEach(([n, col, p, x], i) => {
      s += K.R(x - 27, 90, 54, 108, i === 0 ? '#FFFFFF' : '#FAF8FF', 12, i === 0 ? 3 : 2, i === 0 ? '#FF6FA3' : '#CFC8E3') + `<g class="${i === 0 ? 'a-wiggle' : ''}">${B.box(K, x, 128, 1.7, col)}</g>` + K.Tb(x, 168, n.split(' ')[0], 9) + K.R(x - 20, 176, 40, 16, '#FFF3B0', 8, 1.4, '#C98A12') + K.Tb(x, 188, p, 9, '#8A5A00');
    });
    // conveyor & reveal
    s += K.R(-4, 330, 244, 18, '#5A5170', 4, 2) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => K.C(14 + i * 30, 339, 5, '#9A8FAA', 1.2, '#2B2141')).join('');
    s += `<circle class="a-glow" cx="118" cy="270" r="54" fill="#B48CFF" opacity=".35"/>` + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M118 270 L${(118 + 70 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(270 + 70 * Math.sin(a * Math.PI / 180)).toFixed(1)}" stroke="#FFFFFF" stroke-width="6" opacity=".6"/>`).join('');
    s += K.place('croissant', 118, 304, .78, 'hop') + K.R(70, 312, 96, 18, '#9B5CF6', 9, 2, '#2B2141') + K.Tb(118, 325, 'EPIC · CROISSANT', 9, '#FFFFFF');
    s += K.R(28, 370, 180, 50, '#FF6FA3', 25, 3, '#2B2141') + K.T(118, 403, 'OPEN!', 22, '#FFFFFF');
    s += K.Tb(118, 438, 'Mystery Box: 200 coins', 9, '#5E5679');
    return s;
  }
});
