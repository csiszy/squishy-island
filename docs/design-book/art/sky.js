/* CLOUD NINE — art file  (made-up family)
   House: a fluffy cloud on a stilt that floats once fully puffed up.  Family: the Sky Puffs.
   Words for this page live in sky.html */
SQ.reg('sky', {
  type: 'house', name: 'Cloud Nine', family: 'Sky Puffs', mult: 2.5, float: true,
  /* map bubble: house icon with this family emblem */
  badge: { sq: 'sunny', color: '#8C7CF0' },
  front3: 6, smoke3: false, star3: [0, 16.4, 0], mail3: [10.6, 8.8], ladder3: [7.4, 1.6], bx3: 7.6,
  trim: '#8C7CF0', paint: '#B9A6FF', cur: '#FFE27A', star: [120, 58], web: [74, 104], mail: 206, smoke: false, doorX: 120,

  /* 3D model: a fluffy cloud on a stilt (floats from level 6) */
  model(D, c) {
    const { G, at, cyl, torus, ball, box, tube } = D, L = c.L, PI = Math.PI;
    const deflated = L <= 3, cl = deflated ? c.c('#F4F6FF', 9) : '#F7F8FF';
    const g = G(at(cyl(.7, .9, 7, c.c('#B9A6FF'), 16), 0, 3.5, 0), at(cyl(1.8, 2, .5, c.c('#8C7CF0'), 20), 0, .25, 0));
    const puffs = [[0, 9.5, 0, 5], [-4.4, 8.6, .4, 3.8], [4.4, 8.6, .2, 3.8], [-2.2, 11.8, -.8, 3.4], [2.4, 12, -.6, 3.2], [0, 8, 2.6, 3.4], [-6.4, 8.2, -1, 2.6], [6.4, 8, -1, 2.6]];
    puffs.forEach(([x, y, z, r]) => g.add(deflated ? at(ball(r * .9, cl, 1.05, .55, 1), x, 6.6 + (y - 8) * .3, z) : at(ball(r, cl), x, y, z)));
    if (deflated) { [-4, -1, 2, 5].forEach((x, i) => g.add(D.anim(at(ball(.18, '#8CA8D8', 1, 1.6, 1), x, 4.6, 3), 'float', { ph: i }))); if (L <= 2) g.add(at(box(2.6, .15, 2.2, '#6C9BEF', .04), 2.6, 9, 2.6, -.6, .3, 0)); }
    if (deflated) { g.add(c.win(-3, 7, 4.2, 1.8, 1.4, { r: 1 }), c.win(3, 7, 4.2, 1.8, 1.4, { r: 1 }), c.door(0, 5, 5.4, 1.8, 2.6, c.c('#8C7CF0', 6), { noLamp: 1 })); }
    else {
      g.add(c.win(-2.4, 9.8, 4.45, 2.2, 2.2, { r: 1, ry: -.5, frame: '#E7E2FF' }), c.win(2.4, 9.8, 4.45, 2.2, 2.2, { r: 1, ry: .5, frame: '#E7E2FF' }));
      g.add(c.door(0, 5.6, 5.55, 2.2, 3, c.c('#8C7CF0', 6), { noLamp: 1 }));
    }
    if (L >= 5 && !deflated) { g.add(tube([[-.8, 5.6, 5.8], [-.9, 0, 7.4]], .05, '#B98B5C'), tube([[.8, 5.6, 5.8], [.9, 0, 7.4]], .05, '#B98B5C')); for (let i = 1; i < 6; i++) { const t = i / 6; g.add(at(D.cube(1.7, .08, .2, '#B98B5C'), 0, 5.6 * (1 - t), 5.8 + 1.6 * t)); } }
    if (L >= 6) [[-7.4, 15, -1, '#FF6FA3'], [-8.6, 13.6, .5, '#FFD54A'], [7.6, 15.4, -1.2, '#7ED3B2']].forEach(([x, y, z, col], i) => g.add(at(ball(1, col, .9, 1.1, .9), x, y, z), tube([[x, y - 1.1, z], [x * .9, y - 3, z], [x * .75, 9, z * .5]], .03, '#9A8FAA')));
    if (L >= 8) { [['#FF6F7D', 5], ['#FFB84A', 4.4], ['#FFE066', 3.8], ['#7ED3B2', 3.2], ['#8CCBFF', 2.6]].forEach(([col, r]) => g.add(at(torus(r, .3, col, PI, 6, 32), 9.6, 0, -3.4))); g.add(at(ball(1.4, '#FFFFFF'), 4.6, .8, -3.4), at(ball(1.4, '#FFFFFF'), 14.6, .8, -3.4)); }
    if (L >= 9) { const pts = []; for (let i = 0; i <= 12; i++) { const a = -1.4 + i / 12 * 2.8; pts.push([Math.sin(a) * 6.4, 6.6 - Math.sin(i / 12 * PI) * .5, Math.cos(a) * 4.6]); } g.add(D.lights3(pts)); [[-9, 17, -3], [9, 18, -2], [-3, 18, 3]].forEach(p => g.add(D.sparkle(...p, 1.2, '#FFF3B0'))); }
    return g;
  },

  squishies: [
    { id: 'puff', name: 'Puff Cloud', r: 'C',
      bio: 'A tiny runaway cloud who drifts wherever the wind goes. Makes the best pillow in town.',
      where: 'Drifts in the sky above the house.',
      art: (K, m) => K.blobs([[26, 66, 16], [44, 52, 20], [62, 50, 20], [76, 64, 15], [50, 72, 18]], '#FFFFFF', 2.2, '#A9A2D8') + K.sh(40, 46, 6, 3) + K.face(52, 64, .9, m),
      idle3: (D) => D.place('puff', -8.4, 17, -3, 1.6, 'float', { shadow: false }) },
    { id: 'raindrop', name: 'Raindrop', r: 'C',
      bio: 'A bouncy raindrop who loves jumping in puddles. Every splash makes a tiny rainbow.',
      where: 'Jumps in and out of a puddle in the yard.',
      art: (K, m) => K.P('M50 16 Q78 52 76 68 Q76 90 50 90 Q24 90 24 68 Q22 52 50 16Z', '#8FD3FF') + K.sh(38, 56, 5, 9, 15) + K.face(50, 68, .9, m),
      idle3: (D) => D.G(D.at(D.puddle(1.8), -9.4, 0, 4), D.place('raindrop', -9.4, .1, 4, 1.5, 'hop')) },
    { id: 'sunny', name: 'Sunny', r: 'U',
      bio: 'A cheerful little sun with spinning rays. Wakes everyone up a bit too early, but nobody minds.',
      where: 'Sits on top of the cloud, rays slowly spinning.',
      art: (K, m) => `<g class="a-spin">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M50 54 m-5 -30 l5 -10 l5 10z" fill="#FFB833" stroke="#E08A1A" stroke-width="1.4" transform="rotate(${a} 50 54)"/>`).join('')}</g>` + K.C(50, 54, 26, '#FFC93C', 2.4, '#E08A1A') + K.sh(40, 44, 6, 3) + K.face(50, 56, .9, Object.assign({ eyes: 'happy', mouth: 'open' }, m)),
      idle3: (D) => D.place('sunny', 0, 14.2, 0, 1.6, 'bob', { shadow: false }), on: true },
    { id: 'star', name: 'Star Blob', r: 'R',
      bio: 'A fallen star who never wanted to go back up. Glows brighter the happier everyone around her is.',
      where: 'Peeks out of the left cloud window.',
      art: (K, m) => K.star(50, 56, 40, 20, '#FFE27A', 4, '#E0A81A') + K.sh(40, 44, 5, 3) + K.face(50, 60, .85, m),
      idle3: (D) => D.peek('star', -2.6, 9.8, 4.85, 8.7, -.5, 1.5), on: true },
    { id: 'moon', name: 'Moon Mochi', r: 'E',
      bio: 'A sleepy crescent moon made of soft mochi. Wears a nightcap all day "just in case".',
      where: 'Dozes on a sunbed with a nightcap on.',
      art: (K, m) => `<path d="M60 14 A38 38 0 1 0 86 74 A32 32 0 1 1 60 14Z" fill="#FFF1B5" stroke="#D9BE5A" stroke-width="2.4" stroke-linejoin="round"/>` + K.P('M34 26 Q50 4 72 18 Q58 22 50 34Z', '#8C7CF0', 2) + K.C(76, 18, 5, '#FFFFFF', 1.6) + K.sh(28, 46, 4, 8, 10) + K.face(36, 60, .75, m),
      idle3: (D) => D.G(D.sunbed(9.6, 2.6, '#8C7CF0', -.25), D.place('moon', 9.6, .7, 2.8, 1.6, 'sleep', { mood: { eyes: 'sleep' }, ry: -.25, shadow: false })) },
    { id: 'rainbow', name: 'Rainbow Puff', r: 'L',
      bio: 'A cloud with a rainbow for a tail. Only appears after the happiest rainstorms of the year.',
      where: 'Glides back and forth over the rooftop, leaving sparkles.',
      art: (K, m) => [['#FF6F7D', 30], ['#FFB84A', 25], ['#FFE066', 20], ['#7ED3B2', 15], ['#8CCBFF', 10]].map(([col, r]) => `<path d="M${70 - r} 70 A${r} ${r} 0 0 1 ${70 + r} 70" fill="none" stroke="${col}" stroke-width="5.5" transform="translate(0 -6)"/>`).join('') + K.blobs([[22, 66, 14], [38, 58, 18], [54, 64, 16], [38, 76, 16]], '#FFFFFF', 2.2, '#A9A2D8') + K.face(38, 66, .8, m) + K.spark(84, 30, .7) + K.spark(14, 40, .6),
      idle3: (D) => D.place('rainbow', 8.6, 18, 1, 1.6, 'float', { shadow: false }) }
  ],

  /* the room: each numbered decor item is wrapped in K.item(n) so the shop can swap its design */
  interior(K) {
    let s = K.room({ wall: '#E9E4FF', wall2: '#D6CCFF', pat: 'stars', floor: '#FFFFFF', fl: 'plain', base: '#D6CCFF' });
    s += K.blobs([[0, 290, 40], [80, 300, 40], [160, 296, 36], [440, 300, 40], [520, 292, 40], [600, 300, 40]], '#FFFFFF', 2, '#D6CCFF');
    // 2 moon lamp
    s += K.item(2);
    s += `<circle class="a-glow" cx="300" cy="74" r="56" fill="#FFF3B0" opacity=".35"/>` + K.L('M300 0 V30', '#9A8FAA', 2) + `<path d="M310 34 A40 40 0 1 0 336 104 A33 33 0 1 1 310 34Z" fill="#FFF1B5" stroke="#D9BE5A" stroke-width="2.6"/>` + K.tag(350, 40, 2);
    s += K.itemEnd();
    // 1 cloud bed
    s += K.item(1);
    s += K.R(40, 230, 190, 40, '#B9A6FF', 12, 2.6) + K.blobs([[70, 214, 30], [120, 206, 34], [170, 206, 34], [210, 216, 28]], '#FFFFFF', 2.4, '#A9A2D8') + K.tag(30, 192, 1);
    s += K.place('puff', 128, 228, .55, 'sleep', { mood: { eyes: 'sleep' } }) + K.zz(160, 170);
    s += K.itemEnd();
    // 3 rainbow bookshelf
    s += K.item(3);
    [['#FF6F7D', 70], ['#FFB84A', 58], ['#FFE066', 46], ['#7ED3B2', 34]].forEach(([col, r]) => s += `<path d="M${470 - r} 250 A${r} ${r} 0 0 1 ${470 + r} 250" fill="none" stroke="${K.dk(col, .25)}" stroke-width="13"/><path d="M${470 - r} 250 A${r} ${r} 0 0 1 ${470 + r} 250" fill="none" stroke="${col}" stroke-width="10"/>`);
    s += ['#5AA9E6', '#FF6FA3', '#FFFFFF'].map((col, i) => K.R(452 + i * 12, 222, 10, 28, col, 2, 1.4)).join('') + K.tag(556, 196, 3);
    s += K.itemEnd();
    // 4 raindrop chandelier
    s += K.item(4);
    s += K.L('M150 0 V40 M120 40 H180', '#9A8FAA', 2) + [120, 140, 160, 180].map((x, i) => K.L(`M${x} 40 V${56 + i % 2 * 14}`, '#9A8FAA', 1.2) + K.P(`M${x} ${56 + i % 2 * 14} q8 10 6 16 q-6 8 -12 0 q-2 -6 6 -16z`, '#8FD3FF', 1.6)).join('') + K.tag(198, 40, 4);
    s += K.itemEnd();
    // 5 kite wall art
    s += K.item(5);
    s += K.P('M420 40 L450 80 L420 130 L390 80Z', '#FF6FA3', 2.4) + K.L('M390 80 H450 M420 40 V130', '#FFFFFF', 2) + K.L('M420 130 q-10 14 4 24 q12 10 0 22', '#9A8FAA', 1.6) + `<path d="M418 150 l8 -4 v8z M416 170 l8 -4 v8z" fill="#FFD54A"/>` + K.tag(464, 50, 5);
    s += K.itemEnd();
    // 6 telescope
    s += K.item(6);
    s += K.L('M300 300 L284 244 M300 300 L316 244 M300 300 V240', '#8A6A4E', 3) + `<g transform="rotate(-28 300 236)">${K.R(268, 226, 70, 18, '#8C7CF0', 8, 2.4)}${K.R(334, 222, 14, 26, '#FFD54A', 4, 2)}</g>` + K.tag(246, 236, 6);
    s += K.place('raindrop', 350, 300, .42, 'hop');
    s += K.itemEnd();
    return s;
  }
});
