/* PAW PALACE — art file
   House: a giant dog kennel with a bone sign.  Family: the Pet Pals (6 squishies).
   Words for this page live in pets.html */
SQ.reg('pets', {
  type: 'house', name: 'Paw Palace', family: 'Pet Pals', mult: 1.5,
  /* map bubble: house icon with this family emblem */
  badge: { sq: 'puppy', color: '#E8727A' },
  front3: 5.1, smoke3: [3.5, 15.6, -2], star3: [0, 11.3, 6.6], mail3: [10.2, 6.8], ladder3: [7.2, 1.4], bx3: 7.6,
  trim: '#5AA9E6', paint: '#E8727A', cur: '#FFD27A', smoke: [158, 52], star: [120, 132], web: [62, 112], mail: 204,

  /* 3D model: a giant dog kennel with a bone sign */
  model(D, c) {
    const { G, at, cyl, torus, ball, box, slab, cube } = D, L = c.L, PI = Math.PI;
    const w = c.c('#F6D7A7'), roof = c.c('#E8727A', 3), plank = c.c('#E2BD86');
    const g = G(at(box(12, 9.4, 10, w, .3), 0, 4.7, 0));
    [2.2, 4.4, 6.6, 8.6].forEach(y => g.add(at(cube(11.6, .12, .1, plank), 0, y, 5.02)));
    g.add(at(box(1.6, 3.6, 1.6, c.c('#C98A55', 3), .15), 3.5, 14.2, -2));
    g.add(at(slab([[-7.4, 0], [7.4, 0], [0, 7.2]], 11.4, roof, .25), 0, 9.3, 0));
    g.add(at(slab([[-6, .1], [6, .1], [0, 6]], .3, w, .05), 0, 9.4, 5.05));
    if (L >= 4) for (let r = 0; r < 4; r++) for (let k = -1; k <= 1; k += 2) g.add(at(cube(.12, .12, 11.2, D.dk(roof, .15)), k * (6.6 - r * 1.6), 9.9 + r * 1.55, 0));
    if (L <= 2) { g.add(at(D.disc(1.3, '#4B4152'), 3.4, 12.6, 2.5, -.75, .55, 0)); if (L === 2) g.add(at(box(2.6, .15, 2.2, '#6C9BEF', .04), 3.2, 12.8, 2.4, -.7, .5, 0)); }
    const bone = G(at(box(4.4, .9, .4, c.c('#FFFFFF', 6), .3), 0, 0, 0), ...[[-2.2, .45], [-2.2, -.45], [2.2, .45], [2.2, -.45]].map(([x, y]) => at(ball(.6, c.c('#FFFFFF', 6), 1, 1, .5), x, y, 0)));
    g.add(L >= 3 ? at(bone, 0, 10.6, 5.6) : at(bone, .4, 10.2, 5.6, 0, 0, .35));
    g.add(c.win(0, 12.9, 5.4, 2, 2, { r: 1 }));
    g.add(c.win(-3.7, 4.8, 5.05, 2.4, 2.2), c.win(3.7, 4.8, 5.05, 2.4, 2.2), c.win(-6.05, 4.8, 0, 2.4, 2.2, { ry: -PI / 2 }), c.win(6.05, 4.8, 0, 2.4, 2.2, { ry: PI / 2 }));
    g.add(c.door(0, 0, 5.05, 3.4, 5.4, c.c('#5AA9E6', 6)));
    g.add(c.crack(-4.6, 8, 5.1), c.crack(4, 2.6, 5.1));
    if (L >= 8) { g.add(D.lantern(-6.4, 8.4, 5.6, '#FFD27A', L >= 9), D.lantern(6.4, 8.4, 5.6, '#FFD27A', L >= 9)); [[-3, 9.5], [3, 9.5], [-1.6, 8], [1.6, 8]].forEach(([x, z]) => g.add(at(G(at(ball(.45, '#E2BD86', 1, .2, .9), 0, .05, 0), ...[-.4, 0, .4].map(dx => at(ball(.17, '#E2BD86', 1, .3, 1), dx, .05, -.55))), x, 0, z))); }
    if (L >= 9) g.add(D.lights3([[-7.4, 9.4, 5.9], [-3.7, 12.9, 5.9], [0, 16.4, 5.9], [3.7, 12.9, 5.9], [7.4, 9.4, 5.9]]));
    return g;
  },

  squishies: [
    { id: 'kitty', name: 'Kitty', r: 'C',
      bio: 'An orange tabby who naps in every sunbeam. Purrs so hard she vibrates when you squeeze her.',
      where: 'Sleeps stretched out on the warm roof.',
      art: (K, m) => K.P('M18 84 Q12 50 26 38 L24 18 L42 30 Q50 28 58 30 L76 18 L74 38 Q88 50 82 84 Q50 94 18 84Z', '#FFC58A') + K.L('M44 34 l2 8 M50 32 v9 M56 34 l-2 8', '#E8934A', 2.2) + K.P('M28 26 L30 34 L36 30Z', '#FF9EB5', 0) + K.P('M72 26 L70 34 L64 30Z', '#FF9EB5', 0) + K.L('M18 62 l-10 -2 M18 68 l-10 2 M82 62 l10 -2 M82 68 l10 2', '#B97A4A', 1.2) + K.sh(30, 52, 6, 3) + K.face(50, 60, 1, Object.assign({ mouth: 'w' }, m)),
      idle3: (D) => D.place('kitty', -3.2, 12.2, 1.4, 1.7, 'sleep', { mood: { eyes: 'sleep', mouth: 'w' }, ry: .2, shadow: false }) },
    { id: 'puppy', name: 'Puppy', r: 'C',
      bio: 'A golden puppy with floppy ears. Fetches the mail every morning and wags so hard his whole body wiggles.',
      where: 'Waits by the mailbox with a letter in his mouth.',
      art: (K, m) => K.P('M20 84 Q14 44 50 36 Q86 44 80 84 Q50 94 20 84Z', '#F3D3A8') + K.E(20, 54, 9, 18, '#B9825A', 2.2) + K.E(80, 54, 9, 18, '#B9825A', 2.2) + K.E(50, 70, 14, 9, '#FFF1DE', 0) + K.E(50, 64, 4, 3, '#3A2740', 0) + K.sh(34, 48, 6, 3) + K.face(50, 56, 1, Object.assign({ mouth: 'w', my: 12, blush: true }, m)),
      idle3: (D) => D.place('puppy', 10.4, 0, 9.4, 1.8, 'bob', { ry: -.3, inner: D.at(D.letter3(), 0, .9, 1.2, -.3, 0, 0) }) },
    { id: 'bunny', name: 'Bunny', r: 'U',
      bio: 'A snow-white bunny with pink ears. Keeps the lawn perfectly trimmed (and nibbles a little of it too).',
      where: 'Pushes the lawnmower across the grass.',
      art: (K, m) => K.E(38, 28, 8, 20, '#FFFFFF', 2.2) + K.E(62, 28, 8, 20, '#FFFFFF', 2.2) + K.E(38, 30, 3.5, 13, '#FFB6C8', 0) + K.E(62, 30, 3.5, 13, '#FFB6C8', 0) + K.P('M22 86 Q16 50 50 44 Q84 50 78 86 Q50 94 22 86Z', '#FFFFFF') + K.sh(34, 58, 6, 3) + K.face(50, 68, 1, Object.assign({ mouth: 'w' }, m)),
      idle3: (D) => D.place('bunny', -11, 0, 8.4, 1.8, 'mow', { inner: D.at(D.mower(), .6, 0, 0) }) },
    { id: 'hamster', name: 'Hamster', r: 'R',
      bio: 'A round little hamster whose cheeks are always stuffed with sunflower seeds "for later".',
      where: 'Pops in and out of the round attic window, cheeks full.',
      art: (K, m) => K.C(28, 42, 7, '#E89A5A', 2) + K.C(72, 42, 7, '#E89A5A', 2) + K.P('M14 80 Q10 46 50 42 Q90 46 86 80 Q84 92 50 92 Q16 92 14 80Z', '#F7C37E') + K.E(50, 78, 22, 12, '#FFF3DC', 0) + K.E(26, 70, 10, 9, '#FFF3DC', 0) + K.E(74, 70, 10, 9, '#FFF3DC', 0) + K.sh(34, 54, 6, 3) + K.face(50, 62, 1, Object.assign({ mouth: 'w' }, m)),
      idle3: (D) => D.peek('hamster', 0, 12.9, 5.65, 12.0, 0, 1.4) },
    { id: 'corgi', name: 'Corgi Loaf', r: 'E',
      bio: 'A corgi shaped exactly like a loaf of bread. Has never once been seen standing up.',
      where: 'Snores on the doormat right in front of the door.',
      art: (K, m) => K.P('M12 86 Q8 54 30 50 L28 32 L42 46 Q50 44 58 46 L72 32 L70 50 Q92 54 88 86Z', '#F2A65A') + K.P('M30 86 Q32 64 50 60 Q68 64 70 86Z', '#FFFFFF', 0) + K.E(50, 70, 4, 3, '#3A2740', 0) + K.P('M31 38 L33 46 L38 44Z', '#FFB6C8', 0) + K.P('M69 38 L67 46 L62 44Z', '#FFB6C8', 0) + K.sh(24, 62, 5, 3) + K.face(50, 62, .95, Object.assign({ mouth: 'w', my: 12 }, m)),
      idle3: (D) => D.place('corgi', 0, 0, 7.4, 1.6, 'sleep', { mood: { eyes: 'sleep', mouth: 'w', my: 12 } }) },
    { id: 'luckycat', name: 'Lucky Cat', r: 'L',
      bio: 'A golden-belled beckoning cat who waves good luck to the whole town. Never stops waving. Ever.',
      where: 'Sits on the very top of the roof, waving to everyone.',
      art: (K, m) => K.P('M18 86 Q12 50 26 38 L24 18 L42 30 Q50 28 58 30 L76 18 L74 38 Q88 50 82 86 Q50 94 18 86Z', '#FFFFFF') + K.P('M28 26 L30 34 L36 30Z', '#FF9EB5', 0) + K.P('M72 26 L70 34 L64 30Z', '#FF9EB5', 0) + K.E(30, 32, 6, 4, '#FF9A3D', 0) + K.L('M28 72 Q50 82 72 72', '#E8483F', 5) + K.C(50, 80, 6, '#FFD54A', 2, '#C98A12') + `<g class="a-wiggle">${K.E(84, 40, 9, 12, '#FFFFFF', 2.2)}${K.L('M80 32 v6 M84 31 v6 M88 32 v6', '#D8CFE0', 1.2)}</g>` + K.face(46, 56, 1, Object.assign({ eyes: 'happy', mouth: 'w' }, m)) + K.spark(10, 28, .6) + K.spark(92, 16, .7),
      idle3: (D) => D.place('luckycat', 0, 16.2, 0, 1.6, 'bob', { shadow: false }) }
  ],

  /* the room: each numbered decor item is wrapped in K.item(n) so the shop can swap its design */
  interior(K) {
    let s = K.room({ wall: '#FFF1D6', wall2: '#FFDDB0', pat: 'paws', floor: '#E2BD86', fl: 'wood', base: '#FFFFFF' });
    // 1 cat tree
    s += K.item(1);
    s += K.R(60, 70, 16, 180, '#D8B48A', 4, 2.4) + K.L('M60 90 l16 6 M60 110 l16 6 M60 130 l16 6 M60 150 l16 6 M60 170 l16 6', '#B48A5E', 1.4) + K.R(30, 120, 76, 12, '#FF9EB5', 6, 2.4) + K.R(46, 64, 60, 12, '#FF9EB5', 6, 2.4) + K.R(28, 238, 90, 14, '#FF9EB5', 6, 2.4) + K.L('M100 132 V160', '#B48A5E', 2) + K.C(100, 164, 7, '#FFD54A', 2) + K.tag(120, 60, 1);
    s += K.place('kitty', 76, 66, .46, 'sleep', { mood: { eyes: 'sleep', mouth: 'w' } });
    s += K.itemEnd();
    // 2 donut dog bed
    s += K.item(2);
    s += K.E(250, 296, 80, 26, '#7EC4F0', 2.6) + K.E(250, 290, 56, 14, '#C7E6FA', 2.2) + K.tag(340, 286, 2);
    s += K.place('corgi', 250, 298, .62, 'sleep', { mood: { eyes: 'sleep', mouth: 'w', my: 12 } }) + K.zz(286, 240);
    s += K.itemEnd();
    // 3 fish tank
    s += K.item(3);
    s += K.R(390, 150, 110, 80, '#BFE6F7', 8, 2.6, '#7D869C') + K.R(386, 226, 118, 18, '#5AA9E6', 4, 2.4) + `<rect x="392" y="166" width="106" height="58" fill="#8FD3FF" opacity=".5"/>` + K.P('M420 190 q10 -10 20 0 q-10 10 -20 0Z M440 190 l8 -6 v12Z', '#FF8A5C', 1.4) + K.P('M460 206 q8 -8 16 0 q-8 8 -16 0Z M476 206 l6 -5 v10Z', '#FFD54A', 1.4) + K.L('M410 224 q-4 -16 2 -28 M480 224 q4 -14 -2 -24', '#4FAF72', 2.4) + K.R(400, 244, 8, 50, '#7D869C', 2, 2) + K.R(482, 244, 8, 50, '#7D869C', 2, 2) + K.tag(514, 156, 3);
    s += K.itemEnd();
    // 4 yarn ball basket
    s += K.item(4);
    s += K.P('M520 300 L530 262 H590 L600 300Z', '#C98A55', 2.4) + K.C(546, 258, 12, '#B48CFF', 2) + K.C(570, 254, 11, '#FF7AA8', 2) + K.L('M540 252 q6 4 12 0 M564 250 q6 4 12 0', '#ffffff', 1.4) + K.tag(560, 226, 4);
    s += K.itemEnd();
    // 5 bone shelf
    s += K.item(5);
    s += K.P('M196 106 a6 6 0 1 1 5 -7 H319 a6 6 0 1 1 5 7 a6 6 0 1 1 -5 7 H201 a6 6 0 1 1 -5 -7Z', '#FFFFFF', 2.4, '#B48A5E') + K.C(220, 88, 9, '#FF8A5C', 2) + K.R(250, 76, 22, 22, '#9EE0C4', 4, 2) + K.C(296, 88, 9, '#FFD54A', 2) + K.tag(340, 98, 5);
    s += K.itemEnd();
    // 6 hamster tube wall
    s += K.item(6);
    s += `<path d="M380 30 Q420 30 420 70 Q420 110 470 110 H560" fill="none" stroke="#7D869C" stroke-width="22" stroke-linecap="round"/><path d="M380 30 Q420 30 420 70 Q420 110 470 110 H560" fill="none" stroke="#DFF3FF" stroke-width="17" stroke-linecap="round"/>` + K.place('hamster', 470, 117, .17, 'bob') + K.tag(580, 110, 6);
    s += K.itemEnd();
    return s;
  }
});
