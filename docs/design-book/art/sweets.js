/* SWEET SHOPPE — art file
   House: a giant cupcake with a frosting roof and cherry chimney.  Family: the Sugar Squad.
   Words for this page live in sweets.html */
SQ.reg('sweets', {
  type: 'house', name: 'Sweet Shoppe', family: 'Sugar Squad', mult: 1.75,
  /* map bubble: house icon with this family emblem */
  badge: { sq: 'icecream', color: '#FF6FA3' },
  front3: 6.4, smoke3: [1.6, 14.6, 0], star3: [0, 4.2, 6.9], mail3: [10.4, 8.8], ladder3: [7.4, 1.6], bx3: 7.6,
  trim: '#FF6FA3', paint: '#FFB3D1', cur: '#B7E4C7', fence: '#FFFFFF', smoke: [138, 36], star: [120, 118], web: [66, 140], mail: 204,

  /* 3D model: a cupcake with a piped-frosting roof and a cherry */
  model(D, c) {
    const { G, at, cyl, torus, ball, box, tube, cube } = D, L = c.L, PI = Math.PI;
    const wrap = c.c('#8FD3F4'), wrap2 = c.c('#C8EBFA'), fro = c.c('#FFC2DA', 3), cake = c.c('#E8A86A');
    const g = G(at(cyl(6.6, 5.8, 5.4, wrap, 32), 0, 2.7, 0));
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; g.add(at(cube(.7, 5.3, .2, wrap2), Math.sin(a) * 6.22, 2.7, Math.cos(a) * 6.22, -.07 * 0, a, 0)); }
    g.add(at(cyl(6.9, 6.7, .9, cake, 36), 0, 5.8, 0));
    if (L <= 2) { g.add(at(D.lathe([[7.2, 0], [7, .6], [5.6, 1.4], [2, 2], [0, 2.1]], fro, 36), 0, 6, 0)); for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2 + .3; g.add(at(ball(.5, fro, 1, 2.2, .7), Math.sin(a) * 7, 5.2, Math.cos(a) * 7, 0, a, 0)); } }
    else {
      const ring = (r, y, n, br) => { for (let i = 0; i < n; i++) { const a = i / n * PI * 2; g.add(at(ball(br, fro), Math.sin(a) * r, y, Math.cos(a) * r)); } };
      ring(5.6, 7, 13, 1.9); ring(3.9, 8.9, 10, 1.8); ring(2.1, 10.7, 6, 1.6); g.add(at(ball(1.7, fro), 0, 12, 0));
      if (L >= 4) { const cols = ['#FFD54A', '#7ED3B2', '#8CCBFF', '#B48CFF', '#FF8A5C']; for (let i = 0; i < 40; i++) { const a = i * 2.39, y = 7 + (i % 12) * .45, r = 7.1 - (y - 7) * .95; g.add(at(cyl(.09, .09, .5, cols[i % 5], 5), Math.sin(a) * r, y + .4, Math.cos(a) * r, i, a, i * .7)); } }
      if (L >= 5) g.add(at(ball(1.1, '#EF3E5C'), 0, 14.1, 0), tube([[0, 14.9, 0], [.4, 16, 0], [1.4, 16.6, 0]], .08, '#4E9B4E'));
      else g.add(tube([[0, 13.6, 0], [.4, 14.8, 0], [1.2, 15.4, 0]], .08, '#7D8A60'));
    }
    [-.62, .62].forEach(a => g.add(c.win(Math.sin(a) * 6.32, 2.9, Math.cos(a) * 6.32, 2.2, 2.4, { ry: a })));
    if (L >= 3) g.add(at(G(c.win(0, 0, 0, 1.9, 1.9, { r: 1 })), 0, 9.1, 5.9, -.5, 0, 0));
    g.add(c.door(0, 0, 6.32, 2.8, 4.4, c.c('#FF6FA3', 6)));
    g.add(c.crack(-3.6, 4.6, 5.4, -.6), c.crack(3.4, 3.6, 5.5, .6));
    if (L >= 8) [[-10.6, '#FF6FA3'], [10.6, '#B48CFF']].forEach(([x, col]) => g.add(at(G(at(cyl(.14, .14, 5, '#FFFFFF', 8), 0, 2.5, 0), at(cyl(1.3, 1.3, .4, col, 28), 0, 5.6, 0, PI / 2, 0, 0), at(torus(.8, .14, '#FFFFFF', PI * 1.6, 6, 20), 0, 5.6, .22), at(torus(.4, .12, '#FFFFFF', PI * 1.6, 6, 16), 0, 5.6, .22, 0, 0, 2)), x, 0, -5)));
    if (L >= 9) { const pts = []; for (let i = 0; i <= 14; i++) { const a = -1.5 + i / 14 * 3; pts.push([Math.sin(a) * 7.4, 6.6 - Math.sin(i / 14 * PI) * .4, Math.cos(a) * 7.4]); } g.add(D.lights3(pts)); }
    return g;
  },

  squishies: [
    { id: 'marshmallow', name: 'Marshmallow', r: 'C',
      bio: 'The squishiest of all squishies. Gets toasty-brown on top when embarrassed.',
      where: 'Bounces on a jelly trampoline in the side yard.',
      art: (K, m) => K.R(22, 38, 56, 52, '#FFF4F7', 16, 2.2, '#D9B8C6') + K.E(50, 42, 26, 8, '#FFFFFF', 1.6, '#D9B8C6') + K.sh(32, 56, 4, 8, 0) + K.face(50, 66, 1, m),
      idle3: (D) => D.G(D.at(D.cyl(1.8, 1.8, .35, '#7ED3B2', 24), 9.6, .6, 3), ...[[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].map(([x, z]) => D.at(D.cyl(.1, .1, .6, '#5A5170', 6), 9.6 + x, .3, 3 + z)), D.place('marshmallow', 9.6, .8, 3, 1.6, 'hop', { shadow: false })) },
    { id: 'macaron', name: 'Macaron', r: 'C',
      bio: 'A minty macaron with a creamy middle. Very polite, a tiny bit fancy.',
      where: 'Peeks out of the left window.',
      art: (K, m) => K.E(50, 74, 36, 13, '#B7E4C7', 2.2) + K.R(16, 62, 68, 10, '#FFF6E8', 5, 1.6, '#D9C8A8') + K.E(50, 50, 36, 17, '#B7E4C7', 2.2) + K.L('M18 60 q4 3 8 0 q4 3 8 0 q4 3 8 0 q4 3 8 0 q4 3 8 0 q4 3 8 0 q4 3 8 0 q4 3 8 0', '#8CC7A6', 1.6) + K.sh(36, 44, 8, 3, 0) + K.face(50, 52, .8, m),
      idle3: (D) => D.peek('macaron', -3.7, 2.9, 5.55, 1.7, -.62) },
    { id: 'donut', name: 'Donut', r: 'U',
      bio: 'A pink-frosted donut covered in sprinkles. Doubles as a pool ring on hot days.',
      where: 'Floats around a milk paddling pool like a pool ring.',
      art: (K, m) => `<path d="M50 28 a34 34 0 1 1 -0.1 0Z M50 50 a12 12 0 1 0 0.1 0Z" fill="#E8B07A" fill-rule="evenodd" stroke="#B9824A" stroke-width="2.2"/>` + `<path d="M50 32 C70 30 84 44 82 60 Q78 66 74 60 Q70 70 64 62 Q50 50 50 50 Q40 50 34 62 Q30 70 26 60 Q20 66 18 58 C16 44 30 30 50 32Z" fill="#FF8FB8"/>` + [[34, 40, 30], [62, 36, -20], [72, 50, 60], [28, 52, -50], [46, 38, 10]].map(([x, y, r], i) => `<rect x="${x}" y="${y}" width="7" height="2.6" rx="1.3" fill="${['#FFD54A', '#7ED3B2', '#8CCBFF', '#B48CFF', '#FFFFFF'][i]}" transform="rotate(${r} ${x} ${y})"/>`).join('') + K.face(50, 78, .7, m),
      idle3: (D) => { const p = D.G(D.at(D.torus(2.1, .35, '#FFFFFF', Math.PI * 2, 8, 30), 0, .45, 0, Math.PI / 2, 0, 0), D.at(D.disc(2.05, '#E3F3FF'), 0, .5, 0, -Math.PI / 2, 0, 0)); p.position.set(-9.4, 0, 3.6); p.add(D.place('donut', 0, .3, 0, 1.5, 'bob', { shadow: false })); return p; } },
    { id: 'icecream', name: 'Ice Cream Cone', r: 'R',
      bio: 'A strawberry scoop on a crunchy waffle cone. Melts a little drip of joy when she laughs.',
      where: 'Waves from the round window in the frosting roof.',
      art: (K, m) => K.P('M30 52 L50 94 L70 52Z', '#F0B465', 2.2, '#B97A2A') + K.L('M36 60 L58 82 M46 54 L64 72 M64 60 L42 82 M54 54 L36 72', '#C88A3A', 1.4) + K.P('M24 54 Q20 22 50 18 Q80 22 76 54 Q72 62 66 56 Q62 66 56 58 Q50 64 44 58 Q38 66 34 56 Q28 62 24 54Z', '#FFA6C4') + K.sh(36, 30, 7, 3) + K.face(50, 40, .9, m),
      idle3: (D) => { const w = D.peek('icecream', 0, 9.1, 6.45, 8.2, 0, 1.3); return w; } },
    { id: 'shortcake', name: 'Strawberry Shortcake', r: 'E',
      bio: 'A slice of strawberry shortcake with fluffy cream layers. Always the life of every party.',
      where: 'Dances on top of the frosting swirl next to the cherry.',
      art: (K, m) => K.P('M12 86 V54 L88 38 V86Z', '#FFF1D6', 2.2, '#D9B78A') + K.L('M12 66 L88 56 M12 76 L88 70', '#FF8FB8', 4) + K.P('M12 54 L88 38 L88 44 Q80 50 74 44 Q66 52 60 46 Q52 54 46 48 Q38 56 32 50 Q24 58 18 52 L12 56Z', '#FFFFFF', 1.6, '#D9B78A') + K.P('M66 40 Q62 24 72 22 Q82 24 78 38Z', '#EF3E5C', 1.8) + K.L('M72 22 l-2 -6 M72 22 l4 -5', '#4E9B4E', 1.6) + K.face(46, 72, .85, Object.assign({ eyes: 'happy' }, m)),
      idle3: (D) => D.place('shortcake', -2.6, 10.6, 2.6, 1.3, 'sway', { shadow: false }) },
    { id: 'gummy', name: 'Rainbow Gummy Bear', r: 'L',
      bio: 'A see-through gummy bear that glows every colour of the rainbow. Leaves a sweet sparkle wherever it goes.',
      where: 'Bounces on the front step, glittering.',
      art: (K, m) => `<defs><linearGradient id="gummyG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8FB8"/><stop offset=".3" stop-color="#FFD54A"/><stop offset=".6" stop-color="#7ED3B2"/><stop offset="1" stop-color="#8CA8FF"/></linearGradient></defs><g opacity=".92">${K.C(32, 24, 8, 'url(#gummyG)', 2.2, '#9B7BD6')}${K.C(68, 24, 8, 'url(#gummyG)', 2.2, '#9B7BD6')}${K.P('M50 18 Q78 18 76 44 Q90 52 86 64 Q80 70 74 64 Q76 90 50 90 Q24 90 26 64 Q20 70 14 64 Q10 52 24 44 Q22 18 50 18Z', 'url(#gummyG)', 2.2, '#9B7BD6')}</g>` + K.sh(36, 30, 6, 3) + K.face(50, 40, .9, m) + K.spark(10, 30, .6) + K.spark(90, 40, .7),
      idle3: (D) => D.place('gummy', 2.9, 0, 8, 1.4, 'hop') }
  ],

  /* the room: each numbered decor item is wrapped in K.item(n) so the shop can swap its design */
  interior(K) {
    let s = K.room({ wall: '#FFF1F6', wall2: '#FFD6E6', pat: 'stripes', floor: '#F0C58E', floor2: '#E8B477', fl: 'check', base: '#FFFFFF' });
    // 4 gingerbread clock
    s += K.item(4);
    s += K.C(300, 74, 40, '#C9814A', 2.6) + K.C(300, 74, 30, '#FFF6E8', 2, '#C9814A') + K.L('M300 74 V54 M300 74 L314 80', '#2B2141', 3) + K.L('M266 60 q6 -4 12 0 M322 60 q6 -4 12 0', '#FFFFFF', 2) + K.tag(352, 44, 4);
    s += K.itemEnd();
    // 1 cupcake sofa
    s += K.item(1);
    s += K.P('M60 290 L52 220 H248 L240 290Z', '#8FD3F4', 2.6) + K.blobs([[80, 214, 26], [130, 206, 30], [180, 206, 30], [224, 214, 26]], '#FFC2DA') + K.R(44, 232, 26, 46, '#FFC2DA', 12, 2.4) + K.R(230, 232, 26, 46, '#FFC2DA', 12, 2.4) + K.tag(34, 206, 1);
    s += K.place('marshmallow', 130, 246, .5, 'squish') + K.place('gummy', 186, 248, .44, 'bob');
    s += K.itemEnd();
    // 2 lollipop lamps
    s += K.item(2);
    [[30, '#FF6FA3'], [270, '#B48CFF']].forEach(([x, col]) => s += K.R(x - 3, 140, 6, 150, '#FFFFFF', 2, 2, '#D9B8C6') + `<circle class="a-glow" cx="${x}" cy="130" r="30" fill="#FFE58A" opacity=".25"/>` + K.C(x, 130, 20, col, 2.4) + K.L(`M${x - 12} ${128} q12 -16 22 0 q-10 12 -16 2`, '#FFFFFF', 2.4));
    s += K.tag(300, 140, 2);
    s += K.itemEnd();
    // 3 candy jar shelf
    s += K.item(3);
    s += K.R(400, 110, 170, 10, '#C9814A', 3, 2.2) + K.R(400, 180, 170, 10, '#C9814A', 3, 2.2);
    [[420, '#FF8FB8'], [470, '#FFD54A'], [520, '#7ED3B2']].forEach(([x, col], i) => s += K.R(x - 16, 72, 32, 38, '#EAF6FF', 10, 2, '#9AA3B5') + K.R(x - 12, 66, 24, 8, col, 3, 1.6) + [0, 1, 2, 3].map(j => `<circle cx="${x - 8 + (j % 2) * 14}" cy="${86 + Math.floor(j / 2) * 12}" r="5" fill="${col}"/>`).join('') + K.R(x - 6 + 10, 142, 26, 38, ['#FFE694', '#FFC2DA', '#C8EBFA'][i], 6, 2));
    s += K.tag(586, 100, 3);
    s += K.itemEnd();
    // 5 jelly bean rug
    s += K.item(5);
    s += K.P('M330 300 Q330 270 380 272 Q420 274 440 290 Q470 300 470 314 Q440 330 380 322 Q330 320 330 300Z', '#B7E4C7', 2.6) + [[360, 296, '#FF8FB8'], [392, 290, '#FFD54A'], [424, 302, '#8CCBFF'], [380, 310, '#B48CFF']].map(([x, y, col]) => K.E(x, y, 7, 4, col, 1.4)).join('') + K.tag(484, 300, 5);
    s += K.place('macaron', 402, 302, .36, 'bob');
    s += K.itemEnd();
    // 6 chocolate fountain
    s += K.item(6);
    s += K.R(500, 270, 70, 20, '#C9CFD8', 6, 2.2) + K.R(528, 214, 14, 56, '#C9CFD8', 4, 2) + K.E(535, 214, 26, 6, '#C9CFD8', 2) + `<path class="a-pour" d="M512 218 Q508 240 512 268 M558 218 Q562 240 558 268" fill="none" stroke="#7A4A2A" stroke-width="5" stroke-dasharray="8 6"/>` + K.E(535, 270, 32, 6, '#7A4A2A', 2) + K.tag(586, 250, 6);
    s += K.itemEnd();
    return s;
  }
});
