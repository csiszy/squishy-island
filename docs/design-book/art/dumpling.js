/* DUMPLING STEAMHOUSE — art file
   House: a stack of bamboo steamer baskets with a lid roof.
   Family: the Dumpling Gang (6 squishies).  Words for this page live in dumpling.html */
SQ.reg('dumpling', {
  type: 'house', name: 'Dumpling Steamhouse', family: 'Dumpling Gang', mult: 1,
  /* map bubble: house icon with this family emblem */
  badge: { sq: 'bao', color: '#D2483F' },
  front3: 6.6, smoke3: [-2.4, 14.2, 2.2], star3: [0, 13.2, 5.6], mail3: [10.6, 8.8], ladder3: [7.6, 1.2], bx3: 7.6,
  wall: '#EFCB8B', trim: '#D2483F', paint: '#D2483F', cur: '#FFB3A8',
  smoke: [84, 62], star: [176, 140], web: [56, 144], doorX: 120, mail: false,

  /* 3D model: stacked bamboo steamer baskets with a lid roof */
  model(D, c) {
    const { G, at, cyl, torus, lathe, ball, box, tube } = D, L = c.L, PI = Math.PI;
    const w = c.c('#EFCB8B'), band = c.c('#C99A58'), lid = c.c('#E2B676', 3), knob = c.c(L >= 10 ? '#FFD54A' : '#D2483F', 3);
    const g = G();
    g.add(at(cyl(6.6, 6.6, 5.6, w, 40), 0, 2.8, 0), at(torus(6.68, .16, band, Math.PI * 2, 6, 48), 0, 1.9, 0, PI / 2, 0, 0), at(torus(6.68, .16, band, Math.PI * 2, 6, 48), 0, 3.8, 0, PI / 2, 0, 0));
    g.add(at(torus(6.8, .38, band, Math.PI * 2, 8, 48), 0, 5.6, 0, PI / 2, 0, 0));
    g.add(at(cyl(6, 6, 4.4, w, 40), 0, 8.1, 0), at(torus(6.08, .15, band, Math.PI * 2, 6, 48), 0, 7.4, 0, PI / 2, 0, 0), at(torus(6.08, .15, band, Math.PI * 2, 6, 48), 0, 8.9, 0, PI / 2, 0, 0), at(torus(6.25, .36, band, Math.PI * 2, 8, 48), 0, 10.3, 0, PI / 2, 0, 0));
    const lidG = G(at(lathe([[6.6, 0], [6.3, 1.4], [5.2, 2.9], [3.2, 4.1], [0, 4.6]], lid, 40), 0, 0, 0), at(ball(.9, knob), 0, 4.9, 0));
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, pts = [[6.55, 0], [6.25, 1.4], [5.15, 2.9], [3.15, 4.1], [.3, 4.6]].map(([r, y]) => [Math.sin(a) * r, y + .05, Math.cos(a) * r]); lidG.add(tube(pts, .07, c.c('#C49452', 3))); }
    if (L <= 2) { g.add(at(D.disc(5.9, '#4B4152'), 0, 10.35, 0, -PI / 2, 0, 0)); lidG.rotation.set(.12, 0, -.2); lidG.position.set(1.6, 10, 0); if (L === 2) lidG.add(at(box(3.2, .2, 2.6, '#6C9BEF', .05), -1.6, 2.6, 2.6, -.5, 0, .35)); }
    else lidG.position.y = 10.4;
    g.add(lidG);
    const R1 = 6.6, R2 = 6;
    [-.55, .55].forEach(a => g.add(c.win(Math.sin(a) * (R1 + .05), 3, Math.cos(a) * (R1 + .05), 2.3, 2.3, { r: 1, ry: a })));
    [-.42, .42].forEach(a => g.add(c.win(Math.sin(a) * (R2 + .05), 8.1, Math.cos(a) * (R2 + .05), 2, 1.8, { ry: a })));
    g.add(c.door(0, 0, R1 - .05, 2.6, 4.6, c.c('#D2483F', 6)));
    g.add(c.crack(-4.6, 4.6, 4.8, -.75), c.crack(4, 9.6, 4.5, .7));
    if (L >= 8) {
      g.add(at(cyl(.22, .14, 8, '#C98A55', 10), -1.9, 3.6, 8, 0, 0, -.42), at(cyl(.22, .14, 8, '#C98A55', 10), 1.9, 3.6, 8, 0, 0, .42));
      [-1, 1].forEach(k => g.add(D.lantern(k * 5.4, 9.3, 3.4, '#E8483F', L >= 9)));
    }
    if (L >= 9) { const pts = []; for (let i = 0; i <= 12; i++) { const a = -1.3 + i / 12 * 2.6; pts.push([Math.sin(a) * 6.9, 10.6 + Math.cos(i / 12 * PI * 2) * .1 - .2, Math.cos(a) * 6.9]); } g.add(D.lights3(pts)); }
    return g;
  },

  squishies: [
    { id: 'bao', name: 'Bao Bun', r: 'C',
      bio: 'A fluffy steamed bun who squishes flat when you hug it and slowly puffs back up. Always warm, always smiling.',
      where: 'Cannonballs into the soup-bowl pool, hops out, and does it again.',
      art: (K, m) => K.P('M18 86 Q14 42 50 32 Q86 42 82 86 Q50 94 18 86Z', '#FBF6EC') + K.L('M42 36 Q50 26 58 36 M46 33 Q50 40 54 33', '#D9CDB8', 1.8) + K.sh(34, 52, 8, 4) + K.face(50, 64, 1, m),
      idle3: (D) => { const b = D.bowl3(2.2, '#F6C25E'); b.position.set(-9.3, 0, 3.6); b.add(D.at(D.cyl(.08, .08, 3, '#C9CFD8', 6), 1.8, 1.6, 0, 0, 0, -.5)); b.add(D.place('bao', 0, .45, 0, 1.9, 'hop', { shadow: false })); return b; } },
    { id: 'gyoza', name: 'Gyoza', r: 'C',
      bio: 'A crescent dumpling with a crispy golden bottom. Loves lazy afternoons and the smell of sesame oil.',
      where: 'Naps on a striped sunbed in the side yard, softly breathing in and out.',
      art: (K, m) => K.P('M10 74 Q50 12 90 74 Q50 92 10 74Z', '#F6E7C8') + K.L('M10 74 Q50 92 90 74', '#E2A75A', 4) + K.L('M30 44 q4 6 0 10 M42 35 q4 7 0 11 M54 34 q4 7 0 11 M66 40 q4 6 0 10', '#D7C3A0', 1.8) + K.sh(30, 58, 6, 3) + K.face(50, 64, .9, m),
      idle3: (D) => D.G(D.sunbed(9.6, 2.4, '#7FD3E6', -.25), D.place('gyoza', 9.6, .7, 2.6, 1.6, 'sleep', { mood: { eyes: 'sleep' }, ry: -.25, shadow: false })) },
    { id: 'xlb', name: 'Xiao Long Bao', r: 'U',
      bio: 'A soup dumpling with a twisty top-knot. Very curious. Secretly full of warm soup, so please squeeze gently.',
      where: 'Pops up in the upstairs window to watch the street.',
      art: (K, m) => K.P('M20 86 Q12 52 42 38 Q46 24 50 20 Q54 24 58 38 Q88 52 80 86 Q50 94 20 86Z', '#FFF4E2') + K.L('M50 22 Q44 34 36 44 M50 22 Q50 34 50 44 M50 22 Q56 34 64 44', '#DDCDB2', 1.6) + K.sh(34, 60, 7, 3) + K.face(50, 68, 1, Object.assign({ mouth: 'o' }, m)),
      idle3: (D) => D.peek('xlb', -2.45, 8.1, 5.75, 7.15, -.42) },
    { id: 'hargow', name: 'Har Gow', r: 'R',
      bio: 'A see-through shrimp dumpling that blushes pink. Writes letters to every dumpling in town.',
      where: 'Stands on the front step reading the day’s mail.',
      art: (K, m) => `<g opacity=".95">${K.P('M16 84 Q14 50 50 40 Q86 50 84 84 Q50 94 16 84Z', '#FFD9D2')}</g>` + K.L('M32 72 Q50 52 70 70', '#FF9F7A', 6) + K.L('M30 46 l4 6 M42 41 l3 7 M54 41 l-1 7 M66 45 l-3 6', '#F2B7AA', 1.8) + K.sh(30, 58, 6, 3) + K.face(50, 66, 1, m),
      idle3: (D) => D.place('hargow', -2.6, 0, 7.6, 1.5, 'bob', { inner: D.at(D.letter3(), .55, .9, .45, 0, 0, -.2) }) },
    { id: 'peachbun', name: 'Peach Bun', r: 'E',
      bio: 'A sweet longevity bun shaped like a peach. Rumour says hugging her makes your birthday come faster.',
      where: 'Sits on the steamer lid, swaying to music only she can hear.',
      art: (K, m) => K.P('M50 30 C20 24 10 62 22 80 Q50 96 78 80 C90 62 80 24 50 30Z', '#FFB3C4') + K.F('M28 76 Q50 92 72 76 Q60 86 50 86 Q40 86 28 76Z', '#FF8FAB', .6) + K.L('M50 30 Q46 50 50 60', '#F28AA5', 1.8) + K.P('M50 30 Q64 16 76 24 Q66 34 50 30Z', '#7FCB6E', 1.8) + K.sh(32, 46, 7, 4) + K.face(50, 64, 1, Object.assign({ eyes: 'happy' }, m)),
      idle3: (D) => D.place('peachbun', 2.6, 13.6, 2.4, 1.6, 'sway', { shadow: false }) },
    { id: 'goldumpling', name: 'Golden Lucky Dumpling', r: 'L',
      bio: 'A shining gold-ingot dumpling. Legend says it only appears to squishy keepers with kind hearts.',
      where: 'Floats above the lid knob, sparkling like a tiny sun.',
      art: (K, m) => K.P('M8 70 Q20 54 34 60 Q40 32 50 30 Q60 32 66 60 Q80 54 92 70 Q90 88 50 90 Q10 88 8 70Z', '#FFD54A', 2.4, '#C98A12') + K.L('M34 60 Q50 70 66 60', '#E8A91C', 2) + K.sh(42, 46, 5, 8, 10) + K.face(50, 74, .9, m) + K.spark(16, 40, .7) + K.spark(86, 36, .6),
      idle3: (D) => D.place('goldumpling', 0, 16.3, 0, 1.5, 'float', { shadow: false }) }
  ],

  /* the room: each numbered decor item is wrapped in K.item(n) so the shop can swap its design */
  interior(K) {
    let s = K.room({ wall: '#F3DDB0', wall2: '#E8CC94', pat: 'weave', floor: '#D8D49A', fl: 'tatami', base: '#C99A58' });
    // round window
    s += K.C(300, 96, 46, '#BFE6F7', 6, '#C99A58') + K.L('M300 52 V140 M256 96 H344', '#C99A58', 4) + K.sh(316, 80, 8, 14, 20);
    // 6 lucky knot
    s += K.item(6);
    s += K.L('M130 40 V64', '#C9302C', 2) + `<g transform="rotate(45 130 84)">${K.R(116, 70, 28, 28, '#E8483F', 6, 2.4)}${K.L('M120 80 H140 M120 88 H140 M126 74 V94 M134 74 V94', '#FFB3A8', 1.6)}</g>` + K.L('M126 104 l-2 26 M130 104 V132 M134 104 l2 26', '#E8483F', 2.4) + K.tag(158, 64, 6);
    s += K.itemEnd();
    // 2 paper lantern
    s += K.item(2);
    s += K.L('M430 0 V40', '#6b4a3a', 2) + K.R(416, 38, 28, 8, '#FFC94D', 3, 1.6) + K.E(430, 80, 30, 36, '#E8483F', 2.4) + K.L('M410 70 Q430 76 450 70 M408 86 Q430 92 452 86', '#B02E2A', 1.6) + K.R(416, 112, 28, 8, '#FFC94D', 3, 1.6) + K.L('M430 120 V138', '#FFC94D', 3) + `<circle class="a-glow" cx="430" cy="80" r="44" fill="#FFE58A" opacity=".25"/>` + K.tag(470, 50, 2);
    s += K.itemEnd();
    // 1 steamer bed
    s += K.item(1);
    s += K.R(40, 214, 170, 70, '#E9C88C', 16, 2.6) + K.L('M44 236 H206 M44 258 H206', '#C99A58', 2.4) + K.P('M46 220 Q60 196 126 196 Q192 196 204 220Z', '#E2B676', 2.4) + K.E(70, 210, 20, 9, '#FFFFFF', 2) + K.tag(28, 202, 1);
    s += K.place('bao', 104, 214, .62, 'sleep', { mood: { eyes: 'sleep' } }) + K.zz(130, 170);
    s += K.itemEnd();
    // 3 tea table
    s += K.item(3);
    s += K.R(250, 262, 124, 12, '#B5653A', 5, 2.4) + K.R(262, 274, 8, 22, '#8E4C2B', 2, 2) + K.R(354, 274, 8, 22, '#8E4C2B', 2, 2);
    s += K.E(296, 248, 16, 13, '#7ED3B2', 2.2) + K.L('M311 246 q10 -4 12 -10', '#5BB894', 3) + K.C(296, 233, 4, '#7ED3B2', 2) + K.R(328, 250, 14, 12, '#FFFFFF', 4, 2) + K.R(348, 252, 12, 10, '#FFFFFF', 4, 2) + K.tag(312, 300, 3);
    s += K.itemEnd();
    // 4 chopstick bookshelf
    s += K.item(4);
    s += K.L('M478 130 L556 250 M556 130 L478 250', '#8B5A2B', 5) + K.R(470, 156, 96, 6, '#C98A55', 2, 2) + K.R(470, 200, 96, 6, '#C98A55', 2, 2);
    ['#FF8A5C', '#6FB6FF', '#FFD54A', '#B48CFF'].forEach((col, i) => { s += K.R(480 + i * 12, 130, 10, 26, col, 2, 1.6) + K.R(500 + i * 12, 174, 10, 26, col, 2, 1.6); });
    s += K.tag(580, 140, 4);
    s += K.itemEnd();
    // 5 soy-sauce fish bean bag
    s += K.item(5);
    s += K.P('M440 300 Q470 262 520 278 L548 262 L546 300 L520 290 Q470 318 440 300Z', '#9B5A34', 2.6) + K.C(456, 290, 3, '#2B2141', 0) + K.R(436, 290, 10, 8, '#E8483F', 3, 1.6) + K.tag(560, 300, 5);
    s += K.place('gyoza', 490, 282, .5, 'squish');
    s += K.itemEnd();
    return s;
  }
});
