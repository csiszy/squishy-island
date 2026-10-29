/* SQUISH BISTRO — art file (restaurant + "Bistro Rush" minigame)
   Words for this page live in restaurant.html */
SQ.reg('restaurant', {
  type: 'civic', name: 'Squish Bistro', bench: false, sign: 'BISTRO', mult: 1.2, unit: 1500, goal: 'Best score #',
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#E5484D' },
  wall: '#FFF1E0', roof: '#E5484D', trim: '#FFFFFF', awn: ['#E5484D', '#FFFFFF'], roofStyle: 'gable', door: '#E5484D',
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.blobs([[-7, -4, 7], [0, -8, 8], [7, -4, 7]], '#FFFFFF', 1.6, '#9A8FAA')}${K.R(-8, -2, 16, 10, '#FFFFFF', 2, 1.6, '#9A8FAA')}</g>`,
  /* 3D extras that appear on top of the generic fun building */
  extra3(D, L, g) {
    const { G, at, cyl, ball, cone, box } = D, PI = Math.PI, out = G();
    const table = (x, z, who) => G(at(cyl(.12, .12, 1.4, '#8A6A4E', 6), x, .7, z), at(cyl(1, 1, .12, '#FFFFFF', 18), x, 1.4, z), at(cyl(.06, .06, 3.2, '#8A6A4E', 6), x, 2.6, z), at(cone(2.2, .9, '#E5484D', 16), x, 4.3, z), at(cone(2.22, .92, D.mat('#FFFFFF'), 4), x, 4.31, z, 0, .4, 0), who ? D.place(who, x + 1.4, 0, z + .6, 1.4, 'bob', { ry: -.6 }) : null);
    if (L >= 7) out.add(table(-10.4, 3, 'kitty'), table(10.4, 3, 'puppy'));
    if (L >= 9) { const y = g.H + 3.8; out.add(at(cyl(1.3, 1.3, 1.2, '#FFFFFF', 20), 0, y, -1), at(ball(1.2, '#FFFFFF'), -.9, y + 1.3, -1), at(ball(1.4, '#FFFFFF'), 0, y + 1.6, -1), at(ball(1.2, '#FFFFFF'), .9, y + 1.3, -1), D.puffs(3, g.H + 4, -2)); }
    if (L >= 3 && L < 7) out.add(D.place('bao', -9.6, 0, 6.4, 1.6, 'bob'));
    return out;
  },
  life3: (D, L) => L <= 2 ? D.place('toast', 5.6, 0, 4.4, 1.5, 'bob') : null,

  mock(K) {
    const food = {
      noodles: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.P('M-14 -2 H14 Q12 12 0 12 Q-12 12 -14 -2Z', '#FFFFFF', 1.6, '#9A8FAA')}${K.L('M-10 -2 q3 -8 6 0 q3 -8 6 0 q3 -8 6 0', '#FFD06B', 2)}${K.L('M6 -14 L12 -2 M10 -14 L14 -3', '#8A6A4E', 1.6)}</g>`,
      cake: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.P('M-12 10 V-2 L12 -8 V10Z', '#FFF1D6', 1.6, '#D9B78A')}${K.L('M-12 3 L12 0', '#FF8FB8', 3)}${K.C(6, -11, 4, '#EF3E5C', 1.4)}</g>`,
      juice: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.P('M-8 -10 H8 L6 12 H-6Z', '#FFB833', 1.6, '#C98A12')}${K.L('M2 -10 L8 -18', '#FF6FA3', 2)}${K.C(-6, -10, 3.5, '#7ED36A', 1.2)}</g>`,
      cookie: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.C(0, 0, 11, '#E0A060', 1.6)}${[[-4, -3], [4, 2], [-1, 5], [5, -5]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1.8" fill="#7A4A2A"/>`).join('')}</g>`
    };
    let s = `<rect width="236" height="452" fill="#FFF1E0"/><rect width="236" height="40" fill="#E5484D"/>${K.awning(0, 40, 236, 12, ['#E5484D', '#FFFFFF'])}`;
    s += K.R(8, 10, 78, 22, '#FFFFFF', 11, 2, '#2B2141') + K.star(22, 21, 7, 3, '#FFD54A', 1.2) + K.Tb(56, 26, '1,240', 12) + K.R(150, 10, 78, 22, '#FFFFFF', 11, 2, '#2B2141') + [0, 1, 2].map(i => K.P(`M${166 + i * 18} 26 c-7 -6 -6 -12 0 -9 c6 -3 7 3 0 9z`, '#FF5E6C', 1.4, '#2B2141')).join('');
    // window wall
    s += K.R(20, 70, 196, 70, '#BFE6F7', 10, 2, '#C9A97A') + K.L('M118 70 V140', '#C9A97A', 3);
    // customers on stools
    const cust = [['kitty', 46, 'noodles', .8], ['puff', 118, 'cake', .45], ['puppy', 190, 'juice', .2]];
    cust.forEach(([id, x, f, pat]) => {
      s += K.R(x - 26, 100, 52, 36, '#FFFFFF', 10, 2, '#2B2141') + K.P(`M${x - 6} 136 L${x} 146 L${x + 6} 136Z`, '#FFFFFF', 2, '#2B2141') + food[f](x - 8, 118, .9) + K.R(x + 4, 110, 16, 18, '#F2EFFA', 4, 0) + K.Tb(x + 12, 124, '×1', 9);
      s += K.R(x - 22, 152, 44, 6, '#E8E4EF', 3, 1.4, '#9A8FAA') + K.R(x - 22, 152, 44 * pat, 6, pat > .5 ? '#4FCFA0' : pat > .3 ? '#FFC94D' : '#FF6F7D', 3, 0);
      s += K.place(id, x, 222, .62, 'bob');
    });
    // counter
    s += K.R(-4, 224, 244, 26, '#C98A55', 4, 2.4) + K.R(-4, 248, 244, 60, '#E5484D', 0, 2.4);
    for (let i = 0; i < 8; i++) s += `<rect x="${i * 30}" y="250" width="15" height="56" fill="#FFFFFF" opacity=".25"/>`;
    // kitchen
    s += `<rect y="306" width="236" height="146" fill="#FFF8EC"/>`;
    s += K.place('bao', 52, 384, .52, 'squish', { inner: K.R(36, 4, 28, 14, '#FFFFFF', 4, 2, '#9A8FAA') + K.blobs([[38, 4, 9], [50, -2, 11], [62, 4, 9]], '#FFFFFF', 2, '#9A8FAA') });
    s += K.R(96, 330, 128, 46, '#E8E4EF', 10, 2, '#9A8FAA') + K.Tb(160, 346, 'TAP TO COOK', 9, '#5E5679') + food.noodles(124, 362, .9) + food.cookie(160, 362, .9) + food.cake(196, 362, .9);
    // tray of choices
    s += K.R(8, 396, 220, 48, '#FFFFFF', 14, 2.4, '#2B2141');
    Object.keys(food).forEach((k, i) => { const x = 36 + i * 55; s += K.C(x, 420, 19, i === 0 ? '#FFF3B0' : '#F6F3FF', 2, i === 0 ? '#F59E0B' : '#CFC8E3') + food[k](x, 420, .9); });
    s += `<g class="a-bob">${K.P('M38 444 l8 -14 l4 10 l8 -4z', '#FF6FA3', 1.6, '#2B2141')}</g>`;
    return s;
  }
});
