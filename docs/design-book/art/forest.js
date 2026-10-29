/* MUSHROOM HOLLOW — art file  (made-up family)
   House: a giant red toadstool.  Family: the Forest Folk.
   Words for this page live in forest.html */
SQ.reg('forest', {
  type: 'house', name: 'Mushroom Hollow', family: 'Forest Folk', mult: 2.75,
  /* map bubble: house icon with this family emblem */
  badge: { sq: 'shroomy', color: '#E8615A' },
  front3: 4.2, smoke3: [4.4, 14.6, -1.6], star3: [0, 9.6, 8.6], mail3: [10.4, 8.6], ladder3: [6.2, 1.4], bx3: 6,
  trim: '#C98A55', paint: '#E8615A', cur: '#FFE27A', fence: '#E2C89A', smoke: [166, 50], star: [120, 70], web: [86, 126], mail: 204,

  /* 3D model: a giant red toadstool */
  model(D, c) {
    const { G, at, cyl, torus, ball, box, tube, cone, lathe } = D, L = c.L, PI = Math.PI;
    const stem = c.c('#FFF1DC'), cap = c.c('#E8615A', 3);
    const g = G(lathe([[3.9, 0], [3.6, 2.6], [3.3, 5.6], [3.4, 8]], stem, 32));
    g.add(at(cyl(.6, .6, 3, c.c('#8A6A4E', 3), 10), 4.4, 12.6, -1.6));
    const capProf = L <= 2 ? [[9.2, -1.3], [8.6, .2], [7, 2.6], [4.4, 4.4], [0, 5]] : [[9.6, 0], [9.3, 1.2], [7.8, 3.6], [4.8, 5.8], [0, 6.6]];
    g.add(at(lathe(capProf, cap, 44), 0, 7.6, 0), at(D.disc(9.2, c.c('#F6DCC0', 3), 44), 0, 7.62, 0, PI / 2, 0, 0));
    if (L >= 4) [[3, 2.6, 8], [-4, 2, 7.6], [0, 5.4, 3.4], [6.4, 1.2, 4], [-6.6, 1.4, 3.6], [-2, 4, -6], [4, 3.4, -5]].forEach(([x, dy, z]) => { const v = new THREE.Vector3(x, 0, z).normalize(); g.add(at(ball(1.1, '#FFFFFF', 1, .35, 1), x * .92, 7.6 + dy + .2, z * .92, v.z * .7, 0, -v.x * .7)); });
    else { [[3, 9.6, 6.6], [-5, 8.8, 5.8], [1, 12, 3]].forEach(([x, y, z]) => g.add(at(ball(.9, '#6F8A4A', 1, .4, 1), x, y, z))); }
    if (L <= 2) { g.add(at(D.disc(1.2, '#4B4152'), 3.6, 10.6, 4.4, -.7, .5, 0)); if (L === 2) g.add(at(box(2.8, .15, 2.4, '#6C9BEF', .04), 3.6, 10.8, 4.5, -.65, .5, 0)); }
    g.add(at(G(c.win(0, 0, 0, 1.8, 1.8, { r: 1 })), 0, 10.6, 6.6, -.62, 0, 0));
    [-.55, .55].forEach(a => g.add(c.win(Math.sin(a) * 3.45, 4.6, Math.cos(a) * 3.45, 1.4, 1.8, { ry: a })));
    g.add(c.door(0, 0, 3.75, 2, 3.4, c.c('#C98A55', 6)));
    g.add(c.crack(-2.4, 6.6, 2.6, -.7), c.crack(2.2, 3, 3, .7));
    if (L >= 8) { [[-6, 4.6, '#FF8A5C'], [-7.2, 3.2, '#B48CFF'], [6.4, 4.4, '#FFD54A'], [7.4, 2.8, '#FF8A5C']].forEach(([x, z, col]) => g.add(at(G(at(cyl(.22, .26, .9, '#FFF1DC', 8), 0, .45, 0), at(lathe([[.9, 0], [.8, .3], [.4, .65], [0, .75]], col, 14), 0, .85, 0)), x, 0, z))); g.add(D.lantern(-7.4, 6.4, 3.4, '#FFE066', L >= 9), D.lantern(7.4, 6.4, 3.4, '#FFE066', L >= 9)); }
    if (L >= 9) { [[-8, 11, 3], [8, 12, 1], [-4, 15, -2], [5, 15.6, 2], [0, 16.4, 0]].forEach((p, i) => g.add(D.sparkle(...p, 1, '#E8FF7A'))); const pts = []; for (let i = 0; i <= 14; i++) { const a = -1.5 + i / 14 * 3; pts.push([Math.sin(a) * 9.4, 7.2 - Math.sin(i / 14 * PI) * .6, Math.cos(a) * 9.4]); } g.add(D.lights3(pts)); }
    return g;
  },

  squishies: [
    { id: 'sprout', name: 'Sprout', r: 'C',
      bio: 'A tiny seed who just sprouted two leaves. Waters itself every morning and grows a millimetre a day.',
      where: 'Waters itself with a little watering can in the yard.',
      art: (K, m) => K.L('M50 34 V20', '#4E9B4E', 3) + K.P('M50 22 Q34 6 26 18 Q38 26 50 22Z', '#7ED36A', 1.8) + K.P('M50 22 Q66 6 74 18 Q62 26 50 22Z', '#7ED36A', 1.8) + K.P('M20 70 Q20 34 50 34 Q80 34 80 70 Q80 90 50 90 Q20 90 20 70Z', '#E3F0B8') + K.sh(34, 48, 6, 3) + K.face(50, 64, .95, m),
      idle3: (D) => D.G(D.at(D.G(D.at(D.cyl(.55, .65, 1, '#5AA9E6', 14), 0, .5, 0), D.at(D.cyl(.08, .12, 1.3, '#5AA9E6', 6), .8, .9, 0, 0, 0, -.9)), -8.2, 0, 4.6, 0, 0, .3), D.place('sprout', -9.8, 0, 4.6, 1.5, 'squish')) },
    { id: 'acorn', name: 'Acorn', r: 'C',
      bio: 'A round acorn wearing a cosy textured cap. Collects shiny pebbles and hides them "somewhere safe".',
      where: 'Peeks out of the left stem window.',
      art: (K, m) => K.P('M18 50 Q18 86 50 90 Q82 86 82 50Z', '#E0A060') + K.P('M14 52 Q12 22 50 20 Q88 22 86 52 Q50 60 14 52Z', '#9A6A3A') + K.L('M24 40 l8 -6 M38 34 l8 -6 M54 32 l8 -6 M68 36 l8 -6 M30 48 l8 -6 M46 44 l8 -6 M62 46 l8 -6', '#7A4E28', 1.6) + K.L('M50 20 V10', '#7A4E28', 3) + K.sh(30, 62, 5, 3) + K.face(50, 68, .9, m),
      idle3: (D) => D.peek('acorn', -1.81, 4.6, 3.3, 3.5, -.55, 1.3) },
    { id: 'mossball', name: 'Moss Ball', r: 'U',
      bio: 'A fuzzy green ball of moss. Rolls everywhere instead of walking and is always a little bit damp.',
      where: 'Rolls back and forth across the side lawn.',
      art: (K, m) => `<path d="${K.bumpy(50, 58, 32, 18, 3.5)}" fill="#6FBF5A" stroke="#3E8A3A" stroke-width="2.2" stroke-linejoin="round"/>` + [[34, 44], [64, 40], [70, 70], [30, 72], [50, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#4E9B4E"/>`).join('') + K.sh(36, 42, 6, 3) + K.face(50, 60, .95, m),
      idle3: (D) => D.place('mossball', 7, 0, 7.4, 1.5, 'mow') },
    { id: 'shroomy', name: 'Shroomy', r: 'R',
      bio: 'A little purple mushroom who dances whenever it rains. Leaves a ring of tiny flowers where it stood.',
      where: 'Dances on top of the big red cap.',
      art: (K, m) => K.P('M34 90 Q36 64 34 52 H66 Q64 64 66 90Z', '#FFF1DC') + K.P('M12 56 Q12 14 50 12 Q88 14 88 56 Q50 64 12 56Z', '#9D7BFF') + [[30, 34, 6], [54, 24, 7], [72, 42, 5]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .8}" fill="#FFFFFF"/>`).join('') + K.face(50, 72, .8, m),
      idle3: (D) => D.place('shroomy', 0, 14, 0, 1.4, 'sway', { shadow: false }) },
    { id: 'fluffle', name: 'Fluffle', r: 'E',
      bio: 'A made-up fluffball critter with two bobbly antennae. Nobody knows where Fluffles come from, and they won’t say.',
      where: 'Peeks out of the round window in the cap.',
      art: (K, m) => K.L('M40 30 Q34 16 28 12 M60 30 Q66 16 72 12', '#5BB0A8', 2) + K.C(28, 12, 5, '#FF8FB8', 1.6) + K.C(72, 12, 5, '#FF8FB8', 1.6) + `<path d="${K.bumpy(50, 58, 32, 22, 3)}" fill="#9BE3DA" stroke="#4FA89E" stroke-width="2.2" stroke-linejoin="round"/>` + K.E(40, 90, 7, 4, '#4FA89E', 0) + K.E(60, 90, 7, 4, '#4FA89E', 0) + K.sh(36, 42, 6, 3) + K.face(50, 58, 1, m),
      idle3: (D) => { const w = D.peek('fluffle', 0, 10.6, 6.9, 9.6, 0, 1.2); return w; } },
    { id: 'mossdragon', name: 'Moss Dragon', r: 'L',
      bio: 'A baby dragon with leafy spikes who breathes warm puffs of flower petals instead of fire.',
      where: 'Curls up on the edge of the cap, puffing petals.',
      art: (K, m) => K.L('M80 76 Q96 70 92 54', '#58B868', 6) + K.P('M30 40 Q22 22 36 24 L40 32Z M70 40 Q78 22 64 24 L60 32Z', '#FFE066', 1.6) + [[34, 34], [46, 28], [58, 28], [68, 34]].map(([x, y]) => K.P(`M${x - 5} ${y + 4} Q${x} ${y - 8} ${x + 5} ${y + 4}Z`, '#3E9A55', 1.4)).join('') + K.P('M16 74 Q12 34 50 32 Q88 34 84 74 Q82 90 50 90 Q18 90 16 74Z', '#7ED36A') + K.E(50, 76, 18, 10, '#E3F7B8', 0) + K.P('M18 58 Q4 50 8 40 Q16 50 22 50Z', '#B4E8A0', 1.6) + K.sh(30, 46, 6, 3) + K.face(50, 58, 1, m) + `<g class="a-float">${K.F('M88 34 q4 -6 8 0 q-4 6 -8 0Z', '#FF8FB8')}${K.F('M94 22 q4 -6 8 0 q-4 6 -8 0Z', '#FFD54A')}</g>` + K.spark(10, 24, .6),
      idle3: (D) => D.place('mossdragon', -6.4, 9.8, 4.6, 1.5, 'bob', { shadow: false, ry: -.4 }) }
  ],

  /* the room: each numbered decor item is wrapped in K.item(n) so the shop can swap its design */
  interior(K) {
    let s = K.room({ wall: '#E8C99A', wall2: '#D4B07A', pat: 'logs', floor: '#8CC56E', fl: 'plain', base: '#8A6A4E' });
    // 6 tree-stump fireplace
    s += K.item(6);
    s += K.P('M230 250 V120 Q230 96 300 96 Q370 96 370 120 V250Z', '#A0714A', 2.6) + K.E(300, 112, 66, 14, '#D9B48A', 2.4) + K.L('M300 104 m-40 8 a40 8 0 1 0 80 0 a40 8 0 1 0 -80 0', '#A0714A', 1.4) + K.P('M262 250 V190 Q262 160 300 160 Q338 160 338 190 V250Z', '#4B4152', 2.2) + `<path d="M280 250 Q284 220 296 230 Q300 206 310 228 Q320 214 322 250Z" fill="#FF8A5C"/><path d="M292 250 Q296 236 302 240 Q306 228 312 250Z" fill="#FFD54A"/>` + K.tag(386, 120, 6);
    s += K.place('acorn', 380, 272, .4, 'squish');
    s += K.itemEnd();
    // 1 leaf hammock
    s += K.item(1);
    s += K.L('M30 120 L60 190 M220 120 L190 190', '#8A6A4E', 3) + K.P('M50 180 Q125 240 200 180 Q125 220 50 180Z', '#6FBF5A', 2.4) + K.L('M60 186 Q125 230 190 186', '#4E9B4E', 1.6) + K.tag(24, 112, 1);
    s += K.place('mossball', 125, 214, .38, 'sleep', { mood: { eyes: 'sleep' } });
    s += K.itemEnd();
    // 2 toadstool table + stools
    s += K.item(2);
    s += K.R(108, 272, 24, 34, '#FFF1DC', 6, 2.2, '#C9A97A') + K.P('M70 276 Q70 244 120 242 Q170 244 170 276Z', '#E8615A', 2.4) + `<ellipse cx="104" cy="256" rx="7" ry="5" fill="#fff"/><ellipse cx="140" cy="262" rx="6" ry="4" fill="#fff"/>` + [40, 200].map(x => K.R(x - 6, 292, 12, 18, '#FFF1DC', 3, 2, '#C9A97A') + K.P(`M${x - 18} 296 Q${x} 274 ${x + 18} 296Z`, '#9D7BFF', 2)).join('') + K.tag(186, 252, 2);
    s += K.place('sprout', 40, 276, .34, 'bob');
    s += K.itemEnd();
    // 3 firefly jar lamp
    s += K.item(3);
    s += K.R(430, 56, 50, 64, '#E9F6FF', 14, 2.4, '#7D869C') + K.R(436, 48, 38, 10, '#A0714A', 3, 2) + `<circle class="a-glow" cx="455" cy="88" r="38" fill="#E8FF7A" opacity=".25"/>` + [[444, 76], [464, 94], [452, 104], [468, 70]].map(([x, y], i) => `<circle class="a-glow" style="animation-delay:-${i * .4}s" cx="${x}" cy="${y}" r="3" fill="#E8FF7A"/>`).join('') + K.L('M455 48 V0', '#8A6A4E', 1.6) + K.tag(496, 60, 3);
    s += K.itemEnd();
    // 4 acorn cupboard
    s += K.item(4);
    s += K.P('M460 290 V196 Q460 170 520 170 Q580 170 580 196 V290Z', '#E0A060', 2.6) + K.P('M452 200 Q452 150 520 148 Q588 150 588 200 Q520 212 452 200Z', '#9A6A3A', 2.4) + K.L('M520 214 V286', '#9A6A3A', 2) + K.C(510, 250, 3, '#FFD54A', 1.2) + K.C(530, 250, 3, '#FFD54A', 1.2) + K.tag(590, 160, 4);
    s += K.itemEnd();
    // 5 pinecone rug
    s += K.item(5);
    s += K.E(300, 306, 70, 18, '#C98A55', 2.6) + [[-40, 0], [-20, -6], [0, 0], [20, -6], [40, 0], [-30, 8], [-10, 6], [10, 8], [30, 6]].map(([dx, dy]) => K.P(`M${300 + dx - 7} ${306 + dy} Q${300 + dx} ${306 + dy - 8} ${300 + dx + 7} ${306 + dy}Z`, '#A0714A', 1.2)).join('') + K.tag(386, 300, 5);
    s += K.itemEnd();
    return s;
  }
});
