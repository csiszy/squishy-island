/* CORAL COVE — art file
   House: a giant pink conch shell on the beach.  Family: the Sea Squish.
   Words for this page live in ocean.html */
SQ.reg('ocean', {
  type: 'house', name: 'Coral Cove', family: 'Sea Squish', mult: 2.25,
  /* map bubble: house icon with this family emblem */
  badge: { sq: 'whale', color: '#3BA7C9' },
  front3: 6.6, smoke3: false, star3: [0, 11.6, 4.8], mail3: [10.6, 8.8], ladder3: [7.4, 1.6], bx3: 7.8,
  trim: '#3BA7C9', paint: '#FF9E8C', cur: '#9EE0F0', fence: '#F6E7C8', star: [126, 126], web: [70, 140], mail: 206, smoke: false,

  /* 3D model: a giant pink conch shell on the beach */
  model(D, c) {
    const { G, at, cyl, torus, ball, box, tube, cone } = D, L = c.L, PI = Math.PI;
    const w = c.c('#FFB8A8'), stripe = c.c('#F58A7A'), lip = c.c('#FFE3D6');
    const g = G();
    if (L >= 7) g.add(at(D.disc(10, '#F6E2B3', 40), 0, .04, 0, -PI / 2, 0, 0));
    g.add(D.lathe([[0, 0], [6.8, 0], [7.1, 1.8], [6.2, 4.4], [6.3, 4.9], [4.9, 7.8], [5, 8.3], [3.3, 11.2], [3.3, 11.7], [1.6, 14.2], [0, 16]], w, 40));
    [[6.3, 4.7], [5, 8.1], [3.35, 11.5], [1.7, 14]].forEach(([r, y]) => g.add(at(torus(r, .22, stripe, PI * 2, 6, 40), 0, y, 0, PI / 2, 0, 0)));
    [[6.3, 4.7, 9], [5, 8.1, 7], [3.35, 11.5, 5]].forEach(([r, y, n]) => { for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + .2; g.add(at(cone(.45, 1.3, w, 8), Math.sin(a) * (r + .3), y + .3, Math.cos(a) * (r + .3), Math.cos(a) * .9, 0, -Math.sin(a) * .9)); } });
    if (L <= 3) { for (let i = 0; i < 16; i++) { const a = i * 1.7, y = 1 + (i * 2.3) % 12, r = y < 4.5 ? 6.8 : y < 8 ? 5.5 : 3.8; g.add(at(ball(.38, '#D8D0C8', 1, .7, 1), Math.sin(a) * r, y, Math.cos(a) * r)); } g.add(D.tube([[-6.4, 0, 3], [-6.6, 2, 3.4], [-6, 3.6, 2.6], [-6.2, 5.4, 2]], .12, '#6F8A4A'), D.tube([[6, 0, 3.6], [6.4, 1.6, 3.2], [6, 3.4, 3.4]], .12, '#6F8A4A')); }
    g.add(at(ball(3.4, lip, 1, 1, .55), 0, 3, 6.3));
    g.add(c.door(0, 0, 7.6, 2.6, 4.2, c.c('#3BA7C9', 6)));
    [-.68, .68].forEach(a => g.add(c.win(Math.sin(a) * 6.5, 3.6, Math.cos(a) * 6.5, 2.2, 2.2, { r: 1, ry: a, frame: '#FFE3D6' })));
    g.add(at(G(c.win(0, 0, 0, 2, 2, { r: 1, frame: '#FFE3D6' })), 0, 7.8, 5.35, -.25, 0, 0));
    g.add(c.crack(-3.5, 9.6, 3.8, -.6), c.crack(4.4, 4, 4.9, .7));
    if (L >= 8) { g.add(at(G(at(cyl(.1, .1, 6, '#8A6A4E', 6), 0, 3, 0), at(cone(3, 1.4, '#FF6F7D', 16), 0, 6.4, 0), at(cone(3.02, 1.42, D.mat('#FFFFFF'), 4), 0, 6.42, 0, 0, .4, 0)), -9.6, 0, -4)); [[9.6, 9.2, '#FF8A5C'], [-6.4, 9.4, '#FFD54A']].forEach(([x, z, col]) => g.add(at(D.slab(D.starPts(.8, .36), .25, col, .06), x, .15, z, -PI / 2, 0, 0))); }
    if (L >= 9) { [[-6, 11, 2], [6.5, 9.6, 1], [-3, 15, 0], [4, 16, -1]].forEach(([x, y, z], i) => g.add(D.anim(at(ball(.5 + (i % 2) * .3, D.mat('#DFF6FF', { op: .55, r: .1 })), x, y, z), 'float', { ph: i }))); g.add(D.lights3([[-6.6, 5.2, 2.6], [0, 4.6, 7], [6.6, 5.2, 2.6]])); }
    return g;
  },

  squishies: [
    { id: 'jelly', name: 'Jellyfish', r: 'C',
      bio: 'A wobbly lilac jellyfish who floats instead of walks. Glows softly at night like a nightlight.',
      where: 'Floats lazily in the air beside the shell tip.',
      art: (K, m) => K.L('M30 58 q-4 12 2 22 q4 8 -2 14 M44 60 q-4 12 2 22 M56 60 q4 12 -2 22 M70 58 q4 12 -2 22 q-4 8 2 14', '#B49CF0', 3) + K.P('M16 60 Q16 22 50 22 Q84 22 84 60 Q78 66 72 60 Q66 68 60 60 Q54 68 48 60 Q42 68 36 60 Q30 66 24 60 Q20 64 16 60Z', '#D5C6FF') + K.sh(34, 36, 7, 3) + K.face(50, 44, .9, m),
      idle3: (D) => D.place('jelly', -6.4, 12, 1, 1.5, 'float', { shadow: false }) },
    { id: 'puffer', name: 'Pufferfish', r: 'C',
      bio: 'A spiky-but-soft pufferfish. Puffs up round when surprised, which is about every five minutes.',
      where: 'Peeks out of the left porthole.',
      art: (K, m) => [0, 40, 80, 120, 160, 200, 240, 280, 320].map(a => { const r = a * Math.PI / 180, x = 50 + 36 * Math.cos(r), y = 56 + 34 * Math.sin(r); return `<path d="M${(50 + 28 * Math.cos(r - .12)).toFixed(1)} ${(56 + 28 * Math.sin(r - .12)).toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)} L${(50 + 28 * Math.cos(r + .12)).toFixed(1)} ${(56 + 28 * Math.sin(r + .12)).toFixed(1)}Z" fill="#FFE29A" stroke="#D9A43A" stroke-width="1.6"/>`; }).join('') + K.C(50, 56, 30, '#FFD36B', 2.2) + K.E(50, 70, 18, 10, '#FFF3C4', 0) + K.P('M80 50 L94 40 L92 64Z', '#FFB84A', 1.8) + K.sh(36, 42, 6, 3) + K.face(48, 56, .9, Object.assign({ mouth: 'o' }, m)),
      idle3: (D) => D.peek('puffer', -4.08, 3.6, 5.3, 2.5, -.68) },
    { id: 'axolotl', name: 'Axolotl', r: 'U',
      bio: 'A pink axolotl with frilly gills and a permanent smile. Can regrow a squish if you squeeze too hard.',
      where: 'Paddles in a little tide pool by the shell.',
      art: (K, m) => [[-1, 0], [1, 0]].map(([k]) => [-12, 0, 12].map(d => `<ellipse cx="${50 + k * 40}" cy="${46 + d}" rx="10" ry="4" fill="#FF8FB8" stroke="#E0659A" stroke-width="1.6" transform="rotate(${k * d * 1.6} ${50 + k * 40} ${46 + d})"/>`).join('')).join('') + K.P('M14 70 Q10 36 50 34 Q90 36 86 70 Q84 90 50 90 Q16 90 14 70Z', '#FFB6D0') + K.sh(30, 48, 7, 3) + K.face(50, 60, 1, Object.assign({ mouth: 'w' }, m)),
      idle3: (D) => D.G(D.at(D.cyl(2.3, 2.3, .25, '#4BA8CC', 26), -9.4, .1, 3.6), D.at(D.disc(1.9, '#BDEBFA'), -9.4, .24, 3.6, -Math.PI / 2, 0, 0), D.place('axolotl', -9.4, .2, 3.6, 1.4, 'bob', { shadow: false })) },
    { id: 'octopus', name: 'Octopus', r: 'R',
      bio: 'A coral-red octopus who can wave eight hellos at once. Excellent at hugs. Very excellent.',
      where: 'Waves from the right porthole with two arms at once.',
      art: (K, m) => K.L('M24 76 q-10 6 -6 16 M36 82 q-4 10 4 12 M64 82 q4 10 -4 12 M76 76 q10 6 6 16', '#E85E50', 6) + K.P('M18 70 Q14 22 50 20 Q86 22 82 70 Q66 86 50 80 Q34 86 18 70Z', '#FF8A7A') + [[34, 74], [50, 78], [66, 74]].map(([x, y]) => K.C(x, y, 2.6, '#FFC2B8', 0)).join('') + K.sh(34, 36, 7, 3) + K.face(50, 52, 1, m),
      idle3: (D) => D.peek('octopus', 4.08, 3.6, 5.3, 2.5, .68) },
    { id: 'whale', name: 'Whale', r: 'E',
      bio: 'A big blue whale who is the gentlest squishy on Squishy Island. Sneezes tiny rainbows from her spout.',
      where: 'Sunbathes on a beach towel, spouting a little fountain.',
      art: (K, m) => K.P('M10 70 Q12 38 50 38 Q80 38 88 56 L96 44 Q100 62 90 66 Q90 88 50 88 Q12 88 10 70Z', '#7DB7FF') + K.P('M14 74 Q40 90 80 78 Q70 88 50 88 Q22 88 14 74Z', '#D6E9FF', 0) + `<g class="a-bob">${K.L('M44 34 q-6 -10 -12 -8 M44 34 V20 M44 34 q6 -10 12 -8', '#8CCBFF', 2.4)}</g>` + K.sh(30, 50, 7, 3) + K.face(38, 62, .9, m),
      idle3: (D) => D.G(D.at(D.towel(3.4), 9.6, 0, 3), D.place('whale', 9.6, .1, 3, 1.6, 'sleep', { mood: { eyes: 'happy' }, ry: -.3 })) },
    { id: 'turtle', name: 'Pearl Turtle', r: 'L',
      bio: 'An ancient sea turtle carrying a glowing pearl on her shell. She has seen every sunset since the ocean began.',
      where: 'Rests at the shell door, her pearl glowing.',
      art: (K, m) => K.C(18, 72, 8, '#9ED67E', 2) + K.C(82, 72, 8, '#9ED67E', 2) + K.C(50, 42, 14, '#9ED67E', 2.2) + K.P('M14 78 Q14 40 50 38 Q86 40 86 78Z', '#4FAF8C', 2.4) + K.L('M30 58 l10 -8 h20 l10 8 M40 50 v28 M60 50 v28 M14 78 H86', '#2E8A6A', 1.8) + `<circle class="a-glow" cx="50" cy="40" r="14" fill="#FFF3FF" opacity=".6"/>` + K.C(50, 40, 8, '#FDF4FF', 2, '#C8A6E8') + K.sh(47, 37, 3, 2) + K.E(50, 84, 30, 6, '#9ED67E', 2) + K.face(50, 64, .7, m) + K.spark(10, 40, .6) + K.spark(90, 30, .7),
      idle3: (D) => D.place('turtle', 3.6, 0, 8.6, 1.4, 'bob') }
  ],

  /* the room: each numbered decor item is wrapped in K.item(n) so the shop can swap its design */
  interior(K) {
    let s = K.room({ wall: '#E3F6FF', wall2: '#C2E9FA', pat: 'waves', floor: '#F6E2B3', fl: 'plain', base: '#FFE3D6' });
    // 2 porthole aquarium
    s += K.item(2);
    s += K.C(300, 100, 58, '#4BA8CC', 8, '#C9A06A') + K.C(300, 100, 50, '#7FD3F0', 0) + K.P('M270 96 q12 -12 24 0 q-12 12 -24 0Z M294 96 l9 -7 v14Z', '#FF8A5C', 1.4) + K.P('M300 126 q10 -9 20 0 q-10 9 -20 0Z M320 126 l7 -5 v10Z', '#FFD54A', 1.4) + [[318, 72, 4], [328, 60, 3], [276, 120, 3]].map(([x, y, r]) => `<circle class="a-float" cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" opacity=".8"/>`).join('') + [0, 60, 120, 180, 240, 300].map(a => K.C(300 + 54 * Math.cos(a * Math.PI / 180), 100 + 54 * Math.sin(a * Math.PI / 180), 3, '#8A6A3A', 0)).join('') + K.tag(370, 50, 2);
    s += K.itemEnd();
    // 1 clam shell bed
    s += K.item(1);
    s += K.P('M40 290 Q40 240 130 240 Q220 240 220 290Z', '#FFB8D0', 2.6) + K.P('M50 240 Q60 150 130 150 Q200 150 210 240Z', '#FFC9DC', 2.6) + K.L('M90 236 L80 166 M130 236 V152 M170 236 L180 166', '#F59AB8', 2.4) + K.C(80, 262, 14, '#FDF4FF', 2, '#C8A6E8') + K.tag(30, 160, 1);
    s += K.place('puffer', 140, 274, .5, 'sleep', { mood: { eyes: 'sleep', mouth: 'o' } });
    s += K.itemEnd();
    // 3 coral lamp
    s += K.item(3);
    s += `<circle class="a-glow" cx="460" cy="160" r="50" fill="#FFE58A" opacity=".25"/>` + K.L('M460 250 V170 M460 210 Q440 196 436 168 M460 196 Q484 184 486 150 M436 168 Q426 156 430 144 M486 150 Q494 140 490 128', '#FF7A8A', 8) + K.L('M460 250 V170 M460 210 Q440 196 436 168 M460 196 Q484 184 486 150', '#FFA8B4', 4) + K.E(460, 254, 26, 8, '#C9A06A', 2) + K.tag(500, 200, 3);
    s += K.place('jelly', 412, 140, .36, 'float');
    s += K.itemEnd();
    // 4 treasure chest
    s += K.item(4);
    s += K.R(250, 250, 90, 50, '#C98A55', 6, 2.6) + K.P('M250 252 Q250 214 295 214 Q340 214 340 252Z', '#B07A40', 2.6) + K.R(286, 238, 18, 20, '#FFD54A', 3, 2, '#C98A12') + K.L('M250 270 H340', '#FFD54A', 3) + K.spark(262, 210, .9) + K.spark(330, 208, .7) + K.tag(356, 246, 4);
    s += K.itemEnd();
    // 5 anchor shelf
    s += K.item(5);
    s += K.R(500, 60, 84, 8, '#C9A06A', 3, 2) + K.L('M542 68 V118 M524 104 Q542 126 560 104 M532 80 H552', '#5A5170', 4) + K.C(542, 76, 0, '#5A5170') + K.star(514, 50, 9, 4, '#FF8A5C', 1.6) + K.C(568, 50, 9, '#FFE3D6', 2, '#F58A7A') + K.tag(590, 100, 5);
    s += K.itemEnd();
    // 6 seaweed curtains
    s += K.item(6);
    s += [[560, 252], [576, 252], [592, 252]].map(([x, y], i) => K.L(`M${x} ${y} q-8 -30 0 -60 q8 -30 0 -60`, i % 2 ? '#4FAF72' : '#6CC56B', 7)).join('') + K.tag(560, 150, 6);
    s += K.itemEnd();
    return s;
  }
});
