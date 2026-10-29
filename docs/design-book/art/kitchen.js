/* COZY TEAPOT KITCHEN — art file
   House: a giant butter-yellow teapot.  Family: the Pantry Pals (6 squishies).
   Words for this page live in kitchen.html */
SQ.reg('kitchen', {
  type: 'house', name: 'Cozy Teapot Kitchen', family: 'Pantry Pals', mult: 1.25,
  /* map bubble: house icon with this family emblem */
  badge: { sq: 'toast', color: '#FF8A5C' },
  front3: 7, smoke3: [10.6, 10.6, 0], star3: [0, 11.6, 4.6], mail3: [10.8, 8.8], ladder3: [7.8, 1.6], bx3: 8,
  trim: '#FF8A5C', paint: '#FFD86B', cur: '#9EE0C4', smoke: [214, 96], star: [120, 52], web: [64, 112], mail: 208,

  /* 3D model: a giant polka-dot teapot */
  model(D, c) {
    const { G, at, cyl, torus, lathe, ball, box, tube, cone } = D, L = c.L, PI = Math.PI;
    const w = c.c('#FFE29A'), dot = c.c('#FFB86B'), band = c.c('#7ED3B2'), lid = c.c('#FFD06B', 3);
    const prof = [[0, 0], [6, 0], [6.9, 1.2], [7.3, 4], [7, 7], [5.8, 9], [4.3, 9.8], [0, 9.9]];
    const g = G(at(lathe(prof, w, 44), 0, 0, 0));
    g.add(at(torus(7.32, .38, band, PI * 2, 8, 56), 0, 4.2, 0, PI / 2, 0, 0));
    if (L >= 4) for (let i = 0; i < 26; i++) { const a = i * 2.4, y = 1.5 + (i * 3.7) % 7, r = y < 4 ? 6.9 + (y - 1.2) * .14 : 7.3 - (y - 4) * .1; if (Math.abs(y - 4.2) < .7) continue; g.add(at(ball(.42, dot, 1, 1, .3, 10), Math.sin(a) * r, y, Math.cos(a) * r, 0, a, 0)); }
    // handle + spout
    g.add(at(torus(3, .6, w, PI, 10, 24), -6.9, 5, 0, 0, 0, PI / 2));
    if (L >= 4) g.add(tube([[6.6, 3, 0], [8.6, 4.4, 0], [9.6, 7.4, 0], [10.6, 9.6, 0]], .85, w), at(cyl(.95, .7, .5, w, 16), 10.7, 9.9, 0, 0, 0, -.45));
    else g.add(tube([[6.6, 3, 0], [8.2, 4.1, 0], [8.8, 5.2, 0]], .85, w));
    // lid
    const lidG = G(at(lathe([[4.5, 0], [4.3, .9], [3.1, 2], [0, 2.5]], lid, 36), 0, 0, 0), at(torus(4.4, .3, lid, PI * 2, 6, 40), 0, .1, 0, PI / 2, 0, 0), at(ball(.85, c.c(L >= 10 ? '#FFD54A' : '#FF8A5C', 3)), 0, 3.1, 0));
    if (L <= 2) { g.add(at(D.disc(4.2, '#4B4152'), 0, 9.92, 0, -PI / 2, 0, 0)); lidG.position.set(2.2, 9.4, -.6); lidG.rotation.set(.1, 0, -.35); if (L === 2) lidG.add(at(box(3, .2, 2.4, '#6C9BEF', .05), -.5, 1.8, 1.4, -.4, 0, .2)); }
    else lidG.position.y = 9.8;
    g.add(lidG);
    [-.6, .6].forEach(a => g.add(c.win(Math.sin(a) * 7.2, 6.2, Math.cos(a) * 7.2, 2.4, 2.4, { r: 1, ry: a })));
    g.add(c.door(0, 0, 6.95, 2.8, 4.4, c.c('#FF8A5C', 6)));
    g.add(c.crack(-3.4, 3.4, 6.4, -.5), c.crack(3.4, 7.4, 6.2, .5));
    if (L >= 8) { g.add(at(D.awning3(4.2, 1.6, ['#FF8A5C', '#FFFFFF'], .5), 0, 5, 7.1)); g.add(at(G(at(cyl(.12, .12, 3.4, '#C9CFD8', 8), 0, 1.7, 0), ...[0, 1, 2].map(i => at(torus(.5, .06, '#C9CFD8', PI * 2, 4, 16), 0, 3.6, 0, 0, i * PI / 3, 0))), 8.4, 0, 7.6), at(G(at(cyl(.12, .12, 2.8, '#C9CFD8', 8), 0, 1.4, 0), at(ball(.5, '#C9CFD8', 1, 1.4, .4), 0, 3.2, 0)), 9.6, 0, 7.6)); }
    if (L >= 9) { const pts = []; for (let i = 0; i <= 14; i++) { const a = -1.4 + i / 14 * 2.8; pts.push([Math.sin(a) * 7.6, 4.9 - Math.sin(i / 14 * PI) * .4, Math.cos(a) * 7.6]); } g.add(D.lights3(pts)); }
    return g;
  },

  squishies: [
    { id: 'toast', name: 'Toast', r: 'C',
      bio: 'A golden slice of toast with a crunchy crust and a soft heart. Early riser, first to say good morning.',
      where: 'Peeks out of the round window on the left.',
      art: (K, m) => K.P('M20 88 V46 Q10 40 16 28 Q24 14 50 16 Q76 14 84 28 Q90 40 80 46 V88Z', '#D9944A') + K.P('M27 82 V48 Q20 42 24 32 Q30 22 50 23 Q70 22 76 32 Q80 42 73 48 V82Z', '#FFE3B0', 1.4, '#E8B878') + K.sh(36, 38, 6, 3) + K.face(50, 58, 1, m),
      idle3: (D) => D.peek('toast', -4.05, 6.2, 6.25, 5.0, -.6) },
    { id: 'egg', name: 'Sunny Egg', r: 'C',
      bio: 'A sunny-side-up egg who loves sunbathing. Gets a little runny when nervous.',
      where: 'Floats in a frying-pan paddling pool, soaking up the sun.',
      art: (K, m) => K.P('M14 66 Q8 42 32 40 Q44 24 66 34 Q92 34 88 60 Q92 86 60 84 Q30 92 14 66Z', '#FFFFFF') + K.C(50, 60, 18, '#FFC23D', 2.2, '#E89A1A') + K.sh(43, 52, 5, 3) + K.face(50, 61, .75, m),
      idle3: (D) => { const p = D.G(D.at(D.cyl(2, 1.9, .5, '#4A4458', 24), 0, .25, 0), D.at(D.disc(1.75, '#8CD3F0'), 0, .52, 0, -Math.PI / 2, 0, 0), D.at(D.cyl(.14, .14, 2.2, '#4A4458', 8), 2.8, .35, 0, 0, 0, Math.PI / 2)); p.position.set(-9.4, 0, 3.4); p.add(D.place('egg', 0, .45, 0, 1.4, 'bob', { mood: { eyes: 'happy' }, shadow: false })); return p; } },
    { id: 'banana', name: 'Banana', r: 'U',
      bio: 'The famous squishy banana. Bendy, bouncy, and always in a-peel-ingly good spirits.',
      where: 'Pushes the lawnmower back and forth across the front lawn.',
      art: (K, m) => K.P('M20 30 Q12 74 50 84 Q84 90 92 60 Q72 70 52 62 Q32 52 30 28Z', '#FFE066') + K.P('M20 30 L18 20 L28 18 L30 28Z', '#8A6A3A', 1.8) + K.L('M30 36 Q30 58 52 70', '#F2C94C', 2) + K.sh(30, 54, 4, 8, 20) + K.face(56, 70, .8, m),
      idle3: (D) => D.place('banana', -11, 0, 8.2, 1.8, 'mow', { inner: D.at(D.mower(), .6, 0, 0) }) },
    { id: 'butter', name: 'Butter', r: 'R',
      bio: 'The viral butter block! Melts hearts (and sometimes himself). Lives for a warm slice of toast.',
      where: 'Lounges on a toast sunbed on the porch, slowly melting with happiness.',
      art: (K, m) => K.E(50, 84, 42, 8, '#E9F2FF', 2.2) + K.P('M22 50 L32 40 H82 L72 50Z', '#FFF6C9', 2, '#D6B550') + K.P('M72 50 L82 40 V74 L72 84Z', '#F2D46E', 2, '#D6B550') + K.R(22, 50, 50, 34, '#FFE694', 4, 2.2, '#D6B550') + K.P('M40 50 Q44 58 48 50', '#FFE694', 1.6, '#D6B550') + K.sh(30, 58, 4, 6, 0) + K.face(47, 66, .85, m),
      idle3: (D) => D.G(D.at(D.box(2.4, .6, 3, '#D9944A', .2), 9.6, .3, 3), D.at(D.box(2, .2, 2.6, '#FFE3B0', .08), 9.6, .65, 3), D.place('butter', 9.6, .75, 3, 1.4, 'sleep', { mood: { eyes: 'happy' }, shadow: false })) },
    { id: 'croissant', name: 'Croissant', r: 'E',
      bio: 'A flaky French croissant with perfect manners. Says "bonjour" to every squishy who walks by.',
      where: 'Waves from the round window on the right.',
      art: (K, m) => { const segs = [[16, 70, 12, 10], [30, 58, 15, 14], [50, 52, 19, 18], [70, 58, 15, 14], [84, 70, 12, 10]]; return segs.map(([x, y, rx, ry]) => K.E(x, y, rx, ry, '#F2B25C', 2.2, '#B97A2A')).join('') + K.E(50, 52, 19, 18, '#F6BE6A', 2.2, '#B97A2A') + K.sh(44, 42, 6, 3) + K.face(50, 56, .8, m); },
      idle3: (D) => D.peek('croissant', 4.05, 6.2, 6.25, 5.0, .6) },
    { id: 'pancake', name: 'Pancake Tower', r: 'L',
      bio: 'A royal stack of fluffy pancakes wearing a butter crown, with maple syrup dripping down like a cape.',
      where: 'Perches on the tip of the spout, glittering in the steam.',
      art: (K, m) => [80, 66, 52].map(y => K.R(14, y - 8, 72, 16, '#F0B465', 8, 2.2, '#B97A2A') + K.L(`M18 ${y - 3} H82`, '#FFE3B0', 2)).join('') + K.P('M20 44 Q50 36 80 44 L78 54 Q74 62 72 54 Q60 60 56 52 Q40 66 36 54 Q28 60 24 54Z', '#C26A1E', 1.6) + K.R(40, 30, 20, 14, '#FFE694', 3, 1.8, '#D6B550') + K.P('M40 30 L44 20 L50 27 L56 20 L60 30Z', '#FFD54A', 1.6, '#C98A12') + K.face(50, 70, .8, m) + K.spark(14, 30, .7) + K.spark(88, 26, .6),
      idle3: (D) => D.place('pancake', 10.8, 10.4, 0, 1.4, 'float', { shadow: false }) }
  ],

  /* the room: each numbered decor item is wrapped in K.item(n) so the shop can swap its design */
  interior(K) {
    let s = K.room({ wall: '#E9FBF2', wall2: '#C9F0DD', pat: 'check', floor: '#FF9D7A', floor2: '#FFF1E6', fl: 'check', base: '#FFFFFF' });
    // 4 whisk chandelier
    s += K.item(4);
    s += K.L('M300 0 V30', '#9AA3B5', 3) + [-18, -9, 0, 9, 18].map(d => K.L(`M300 30 Q${300 + d * 2.2} 70 300 96`, '#9AA3B5', 2.4)).join('') + K.C(300, 30, 5, '#FF8A5C', 2) + [-30, 30].map(d => `<circle class="a-glow" cx="${300 + d}" cy="80" r="14" fill="#FFE58A" opacity=".4"/>` + K.C(300 + d, 80, 6, '#FFE58A', 1.6, '#C98A12')).join('') + K.tag(340, 40, 4);
    s += K.itemEnd();
    // 1 oven fireplace
    s += K.item(1);
    s += K.R(26, 120, 140, 130, '#FFFFFF', 12, 2.6, '#9AA3B5') + K.R(42, 156, 108, 76, '#4B4152', 8, 2.4) + `<path d="M70 230 Q74 200 86 210 Q92 186 102 206 Q114 196 118 230Z" fill="#FF8A5C"/><path d="M84 230 Q90 214 96 220 Q100 208 106 230Z" fill="#FFD54A"/>` + [52, 82, 112, 142].map(x => K.C(x, 136, 6, '#FF8A5C', 2)).join('') + K.tag(20, 112, 1);
    s += K.itemEnd();
    // 2 toaster bunk bed
    s += K.item(2);
    s += K.R(196, 168, 140, 112, '#C9D3E2', 20, 2.6, '#7D869C') + K.R(214, 160, 40, 12, '#4B4152', 6, 2) + K.R(278, 160, 40, 12, '#4B4152', 6, 2) + K.R(340, 210, 12, 30, '#7D869C', 4, 2) + K.L('M206 250 H326', '#FFFFFF', 3) + K.tag(352, 176, 2);
    s += K.place('toast', 234, 176, .42, 'sleep', { mood: { eyes: 'sleep' } }) + K.place('egg', 298, 182, .38, 'sleep', { mood: { eyes: 'sleep' } });
    s += K.itemEnd();
    // 3 fridge wardrobe
    s += K.item(3);
    s += K.R(470, 64, 104, 220, '#9EE0C4', 18, 2.6) + K.L('M472 140 H572', K.dk('#9EE0C4'), 2.4) + K.R(484, 96, 8, 30, '#FFFFFF', 4, 2) + K.R(484, 160, 8, 40, '#FFFFFF', 4, 2) + K.C(540, 100, 8, '#FF6FA3', 2) + K.R(524, 170, 26, 20, '#FFE694', 3, 2) + K.tag(586, 70, 3);
    s += K.itemEnd();
    // 5 plate rug
    s += K.item(5);
    s += K.E(400, 306, 72, 20, '#FFFFFF', 2.6, '#9AA3B5') + K.E(400, 306, 52, 13, '#EAF6FF', 2, '#9AA3B5') + K.tag(486, 312, 5);
    s += K.place('butter', 400, 308, .5, 'squish');
    s += K.itemEnd();
    // 6 cookie-jar lamp
    s += K.item(6);
    s += K.R(360, 216, 78, 8, '#C98A55', 3, 2) + K.L('M372 224 l6 10 M426 224 l-6 10', '#C98A55', 3) + K.R(374, 166, 50, 50, '#E9F6FF', 14, 2.4, '#7D869C') + K.R(380, 156, 38, 12, '#FF8A5C', 5, 2) + K.C(388, 196, 6, '#D9944A', 1.6) + K.C(408, 186, 6, '#D9944A', 1.6) + `<circle class="a-glow" cx="399" cy="190" r="34" fill="#FFE58A" opacity=".25"/>` + K.tag(434, 166, 6);
    s += K.itemEnd();
    return s;
  }
});
