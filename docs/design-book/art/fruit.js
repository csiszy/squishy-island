/* PINEAPPLE ORCHARD — art file
   House: a giant pineapple with a leafy crown.  Family: the Fresh Fruits.
   Words for this page live in fruit.html */
SQ.reg('fruit', {
  type: 'house', name: 'Pineapple Orchard', family: 'Fresh Fruits', mult: 2,
  /* map bubble: house icon with this family emblem */
  badge: { sq: 'strawberry', color: '#4FAF72' },
  front3: 6.4, smoke3: false, star3: [0, 9.6, 6.4], mail3: [10.6, 8.8], ladder3: [7.4, 1.6], bx3: 7.6,
  trim: '#4FAF72', paint: '#FFB833', cur: '#FF9E9E', star: [120, 92], web: [70, 112], mail: 206, smoke: false,

  /* 3D model: a giant pineapple with a leafy crown */
  model(D, c) {
    const { G, at, cyl, ball, box, tube, cone } = D, L = c.L, PI = Math.PI;
    const w = c.c('#FFC24A'), line = c.c('#E8962A'), leaf = c.c('#58B868', 3), leaf2 = c.c('#3E9A55', 3);
    const prof = [[0, 0], [5.2, 0], [6.3, 1.6], [6.8, 5.2], [6.3, 8.6], [4.4, 11], [0, 11.8]];
    const g = G(at(D.lathe(prof, w, 44), 0, 0, 0));
    const R = y => { if (y < 1.6) return 5.2 + y / 1.6 * 1.1; if (y < 5.2) return 6.3 + (y - 1.6) / 3.6 * .5; if (y < 8.6) return 6.8 - (y - 5.2) / 3.4 * .5; return 6.3 - (y - 8.6) / 2.4 * 1.9; };
    for (let k = 0; k < 10; k++) for (const dir of [1, -1]) { const pts = []; for (let y = .6; y <= 10.4; y += .7) { const a = k / 10 * PI * 2 + dir * y * .26, r = R(y) + .03; pts.push([Math.sin(a) * r, y, Math.cos(a) * r]); } g.add(tube(pts, .06, line)); }
    if (L >= 4) for (let i = 0; i < 36; i++) { const y = 1.2 + (i % 9) * 1.05, a = Math.floor(i / 9) * PI / 2 + (i % 9) * .26 + PI / 10, r = R(y) + .05; g.add(at(ball(.16, '#A86A1C', 1, 1, .5, 6), Math.sin(a) * r, y, Math.cos(a) * r, 0, a, 0)); }
    const crown = G();
    for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2, tall = i % 2 ? 4.2 : 5.4, droop = L <= 2 ? 1.9 : .55 - (i % 2) * .15; const lf = at(G(at(ball(.9, i % 2 ? leaf2 : leaf, .5, tall / 1.8, .2), 0, tall / 2, 0)), Math.sin(a) * .9, 0, Math.cos(a) * .9); lf.rotation.set(Math.cos(a) * droop, 0, -Math.sin(a) * droop); crown.add(lf); }
    crown.add(at(ball(1, leaf, 1, 2.4, 1), 0, 2, 0));
    if (L <= 2) crown.traverse(m => { if (m.isMesh) m.material = D.mat('#B8A15A'); });
    g.add(at(crown, 0, 11.2, 0));
    [-.42, .42].forEach(a => g.add(c.win(Math.sin(a) * 6.85, 6.2, Math.cos(a) * 6.85, 2.4, 2.4, { r: 1, ry: a })));
    g.add(c.door(0, 0, 6.3, 2.8, 4.4, c.c('#4FAF72', 6)));
    g.add(c.crack(-3.6, 3.6, 5.6, -.6), c.crack(3.9, 8.4, 5.2, .6));
    if (L >= 8) { g.add(at(G(at(box(2.6, 1.6, 1.8, '#C98A55', .1), 0, .8, 0), at(ball(.5, '#FF5C6C'), -.6, 1.9, 0), at(ball(.5, '#FFB48A'), .6, 1.9, .2), at(ball(.45, '#FFE066'), 0, 2.1, -.3)), 5.4, 0, 7.4), at(G(at(cyl(.6, .7, 1.2, '#5AA9E6', 14), 0, .6, 0), at(cyl(.1, .14, 1.4, '#5AA9E6', 6), .9, 1, 0, 0, 0, -.9)), -5.6, 0, 7.6)); }
    if (L >= 9) { g.add(D.lights3([[-6.6, 9, 3.4], [0, 8, 7], [6.6, 9, 3.4]])); [-1, 1].forEach(k => g.add(D.lantern(k * 6.2, 7.9, 4, '#FFE066', true))); }
    return g;
  },

  squishies: [
    { id: 'strawberry', name: 'Strawberry', r: 'C',
      bio: 'A sweet little strawberry with a leafy hat. Loves swinging so high she can see the whole town.',
      where: 'Swings on a tire swing under the yard tree.',
      art: (K, m) => K.P('M50 88 Q16 72 18 44 Q22 28 50 32 Q78 28 82 44 Q84 72 50 88Z', '#FF5C6C') + [[32, 48], [46, 44], [62, 46], [72, 58], [28, 62], [40, 72], [58, 74], [66, 66]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="2.2" fill="#FFE27A"/>`).join('') + K.P('M50 34 L36 26 L46 28 L42 18 L50 26 L58 18 L54 28 L64 26Z', '#58B868', 1.8) + K.sh(32, 46, 5, 3) + K.face(50, 58, .9, m),
      idle3: (D) => { const t = D.tree(0, 0, 1.15); t.position.set(-9.6, 0, -1); const sw = D.G(D.at(D.cyl(.03, .03, 2.8, '#8A6A4E', 4), -.4, -1.4, 0), D.at(D.cyl(.03, .03, 2.8, '#8A6A4E', 4), .4, -1.4, 0), D.at(D.tire(0, 0), 0, -2.95, 0, 0, 0, 0), D.place('strawberry', 0, -2.8, 0, 1.3, 'squish', { shadow: false })); D.anim(sw, 'swing'); sw.position.set(1.6, 3.4, .9); t.add(sw); return t; } },
    { id: 'peach', name: 'Peach', r: 'C',
      bio: 'A fuzzy, blushing peach. The softest squish in the orchard, and the first to give a hug.',
      where: 'Peeks out of the left window.',
      art: (K, m) => K.P('M50 32 C18 28 12 66 30 82 Q50 94 70 82 C88 66 82 28 50 32Z', '#FFB48A') + K.F('M30 80 Q50 92 70 80 Q72 66 60 70 Q40 74 30 80Z', '#FF8A8A', .45) + K.L('M50 32 Q44 52 48 66', '#F08A6A', 1.6) + K.P('M50 32 Q60 18 74 22 Q66 32 50 32Z', '#58B868', 1.6) + K.sh(32, 46, 6, 4) + K.face(54, 62, .9, m),
      idle3: (D) => D.peek('peach', -2.83, 6.2, 6.6, 5.0, -.42) },
    { id: 'avocado', name: 'Avocado', r: 'U',
      bio: 'A chill avocado who treats his pit like a round tummy. Takes life one sunbathe at a time.',
      where: 'Relaxes on a sunbed with sunglasses on.',
      art: (K, m) => K.P('M50 12 Q70 12 74 40 Q90 62 80 80 Q70 94 50 94 Q30 94 20 80 Q10 62 26 40 Q30 12 50 12Z', '#6FA53A') + K.P('M50 20 Q66 20 68 42 Q82 62 74 78 Q66 88 50 88 Q34 88 26 78 Q18 62 32 42 Q34 20 50 20Z', '#D8EE9A', 1.6, '#9CC25A') + K.C(50, 70, 13, '#A8683A', 2) + K.sh(46, 66, 4, 2) + K.face(50, 42, .8, m),
      idle3: (D) => D.G(D.sunbed(9.6, 2.6, '#FFB833', -.25), D.place('avocado', 9.6, .7, 2.8, 1.5, 'sleep', { mood: { eyes: 'happy' }, ry: -.25, shadow: false })) },
    { id: 'watermelon', name: 'Watermelon', r: 'R',
      bio: 'A juicy watermelon slice with a big grin full of seeds. Splashes everyone at summer parties.',
      where: 'Pops into the right window, grinning.',
      art: (K, m) => K.P('M8 44 H92 Q92 92 50 92 Q8 92 8 44Z', '#4FAF72') + K.P('M14 44 H86 Q86 84 50 84 Q14 84 14 44Z', '#F5FFF0', 1, '#C9E8C0') + K.P('M18 44 H82 Q82 78 50 78 Q18 78 18 44Z', '#FF6B7D', 1.4, '#E8485E') + [[30, 58], [44, 66], [58, 66], [70, 58], [50, 72]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.6" fill="#3A2740"/>`).join('') + K.face(50, 52, .8, Object.assign({ mouth: 'open' }, m)),
      idle3: (D) => D.peek('watermelon', 2.83, 6.2, 6.6, 5.0, .42) },
    { id: 'dragonfruit', name: 'Dragon Fruit', r: 'E',
      bio: 'A magenta dragon fruit with flame-shaped leaves. Pretends to be fierce, is actually a big softie.',
      where: 'Sits in the leafy crown, swaying in the breeze.',
      art: (K, m) => K.E(50, 58, 32, 32, '#FF4FA0', 2.4) + [[24, 40, -40], [76, 40, 40], [20, 64, -70], [80, 64, 70], [50, 24, 0], [36, 82, -140], [64, 82, 140]].map(([x, y, r]) => `<path d="M${x} ${y} q-3 -8 0 -14 q3 6 6 6 z" fill="#7ED36A" stroke="#4E9B4E" stroke-width="1.4" transform="rotate(${r} ${x} ${y})"/>`).join('') + K.sh(36, 44, 6, 3) + K.face(50, 60, .95, m),
      idle3: (D) => D.place('dragonfruit', 0, 14.6, .8, 1.3, 'sway', { shadow: false }) },
    { id: 'goldapple', name: 'Golden Apple', r: 'L',
      bio: 'A shimmering golden apple from the very top of the oldest tree. Said to grant one tiny wish a day.',
      where: 'Hovers on the front step, glittering.',
      art: (K, m) => K.P('M50 30 Q34 20 22 34 Q10 52 22 74 Q32 92 50 86 Q68 92 78 74 Q90 52 78 34 Q66 20 50 30Z', '#FFD54A', 2.4, '#C98A12') + K.L('M50 30 Q48 20 52 12', '#8A6A3A', 3) + K.P('M52 18 Q66 8 74 16 Q64 24 52 18Z', '#58B868', 1.6) + K.sh(32, 44, 5, 8, 10) + K.face(50, 58, .95, m) + K.spark(14, 30, .7) + K.spark(88, 46, .6),
      idle3: (D) => D.place('goldapple', 2.9, 0, 8, 1.3, 'float') }
  ],

  /* the room: each numbered decor item is wrapped in K.item(n) so the shop can swap its design */
  interior(K) {
    let s = K.room({ wall: '#EAF8E2', wall2: '#CDEDBE', pat: 'leaves', floor: '#DDB07A', fl: 'wood', base: '#FFFFFF' });
    // 6 vine bookshelf
    s += K.item(6);
    s += K.R(250, 40, 120, 150, '#C98A55', 8, 2.6) + K.R(258, 84, 104, 6, '#8E5E34', 2, 1.6) + K.R(258, 132, 104, 6, '#8E5E34', 2, 1.6) + ['#FF5C6C', '#FFE066', '#7ED3B2', '#FFB48A', '#B48CFF'].map((col, i) => K.R(266 + i * 14, 52, 11, 32, col, 2, 1.4) + K.R(272 + i * 16, 100, 12, 32, col, 2, 1.4)).join('') + K.L('M250 44 q20 20 0 40 q-16 24 6 46 M370 44 q-14 30 4 50', '#4FAF72', 3) + K.tag(386, 50, 6);
    s += K.itemEnd();
    // 1 fruit crate bunk beds
    s += K.item(1);
    s += K.R(30, 120, 170, 60, '#D9A066', 4, 2.6) + K.R(30, 200, 170, 60, '#D9A066', 4, 2.6) + K.L('M30 140 H200 M30 160 H200 M30 220 H200 M30 240 H200', '#B07A40', 1.6) + K.R(30, 120, 8, 170, '#B07A40', 2, 2) + K.R(192, 120, 8, 170, '#B07A40', 2, 2) + K.T(115, 158, 'FRESH', 16, '#B07A40') + K.tag(22, 110, 1);
    s += K.place('peach', 80, 200, .45, 'sleep', { mood: { eyes: 'sleep' } }) + K.place('watermelon', 150, 120, .45, 'sleep', { mood: { eyes: 'sleep', mouth: 'none' } });
    s += K.itemEnd();
    // 2 juice bar
    s += K.item(2);
    s += K.R(420, 190, 150, 90, '#FFE066', 10, 2.6) + K.R(410, 180, 170, 14, '#FF8A5C', 6, 2.4) + K.R(440, 140, 30, 40, '#FFFFFF', 6, 2, '#9AA3B5') + K.R(442, 156, 26, 22, '#FFB833', 4, 0) + K.R(486, 146, 30, 34, '#FFFFFF', 6, 2, '#9AA3B5') + K.R(488, 160, 26, 18, '#FF5C6C', 4, 0) + K.L('M500 146 l6 -16', '#58B868', 3) + K.tag(586, 186, 2);
    s += K.itemEnd();
    // 3 watering-can lamp
    s += K.item(3);
    s += `<circle class="a-glow" cx="470" cy="76" r="34" fill="#FFE58A" opacity=".3"/>` + K.L('M470 0 V44', '#6b4a3a', 2) + K.P('M446 50 H494 L490 90 H450Z', '#5AA9E6', 2.4) + K.L('M494 60 l20 -16', '#5AA9E6', 4) + K.C(470, 96, 8, '#FFE58A', 1.6, '#C98A12') + K.tag(520, 70, 3);
    s += K.itemEnd();
    // 4 melon-rind hammock
    s += K.item(4);
    s += K.L('M220 210 L240 300 M404 210 L384 300', '#8E5E34', 4) + K.P('M228 236 Q312 296 396 236 Q312 280 228 236Z', '#4FAF72', 2.4) + K.L('M236 240 Q312 288 388 240', '#FF6B7D', 4) + K.tag(312, 316, 4);
    s += K.place('strawberry', 312, 266, .4, 'sleep', { mood: { eyes: 'sleep' } });
    s += K.itemEnd();
    // 5 basket chair
    s += K.item(5);
    s += `<g transform="translate(330 34)">${K.P('M80 300 Q70 252 120 248 Q170 252 160 300Z', '#E8B26A', 2.6)}${K.L('M86 268 H154 M82 284 H158', '#B07A40', 1.6)}${K.tag(176, 290, 5)}${K.place('avocado', 120, 280, .4, 'squish')}</g>`;
    s += K.itemEnd();
    return s;
  }
});
