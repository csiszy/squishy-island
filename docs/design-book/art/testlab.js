/* SQUISHY TESTING FACILITY — art file (lab building + "Squish Lab" toy)
   Words for this page live in testlab.html */
SQ.reg('testlab', {
  type: 'civic', name: 'Squishy Testing Facility', sign: 'LAB', mult: 1.1, unit: 10, goal: 'Squish # times in the Lab', bench: false,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#4A7BD0' },
  wall: '#EAF6FF', roof: '#4A7BD0', trim: '#FFFFFF', awn: ['#4A7BD0', '#FFFFFF'], roofStyle: 'flat', door: '#4A7BD0',
  // icon: a little hydraulic press squishing a pink blob
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.R(-10, -12, 20, 5, '#5B6B85', 1.5, 1.4, '#2B2141')}${K.L('M-7 -12 V-15 M7 -12 V-15', '#9AA8BC', 2)}${K.P('M-11 9 Q-12 -4 0 -5 Q12 -4 11 9Z', '#FF8FB8', 1.6, '#2B2141')}${K.C(-3.5, 3, 1.2, '#2B2141', 0)}${K.C(3.5, 3, 1.2, '#2B2141', 0)}</g>`,
  /* 3D extras that appear on top of the generic fun building */
  extra3(D, L, g) {
    const { G, at, cyl, ball, box, cube } = D, PI = Math.PI, out = G();
    // a test bench out front: a mini hydraulic press over a squishy
    if (L >= 3) { const press = G(at(box(3.6, .4, 2.4, '#C9D3E2', .1), 0, .2, 0), at(cyl(.14, .14, 3.4, '#9AA8BC', 8), -1.4, 2, 0), at(cyl(.14, .14, 3.4, '#9AA8BC', 8), 1.4, 2, 0), at(box(3.4, .5, 2, '#5B6B85', .1), 0, 3.6, 0)); const plate = at(box(2.8, .35, 1.8, '#FFD54A', .1), 0, 2.4, 0); D.anim(plate, 'bob', { amp: .5 }); press.add(plate); out.add(at(press, -10, 0, 6), D.place('marshmallow', -10, .45, 6, 1.1, 'squish')); }
    if (L >= 5) { const dish = G(at(cyl(.12, .12, 1.6, '#9AA8BC', 8), 0, .8, 0), at(ball(1, '#FFFFFF', 1, .4, 1, 16), 0, 1.8, 0, .5, 0, 0)); D.anim(dish, 'sway'); out.add(at(dish, g.w / 2 - 1.6, g.H + .8, -2)); }
    // a big bubbling test tank
    if (L >= 7) { const tank = G(at(cyl(1.6, 1.6, .5, '#5B6B85', 16), 0, .25, 0), at(cyl(1.4, 1.4, 4.6, D.mat('#BFE6F7', { r: .1, op: .55 }), 20), 0, 2.8, 0), at(cyl(1.6, 1.6, .5, '#5B6B85', 16), 0, 5.3, 0)); [0, 1, 2, 3].forEach(i => tank.add(D.anim(at(ball(.22 + i * .05, '#FFFFFF'), (i - 1.5) * .45, 1.2 + i * .9, 0), 'float', { ph: i }))); tank.add(D.place('jelly', 0, 1.4, 0, 1.1, 'float')); out.add(at(tank, 10.4, 0, 3)); }
    // the giant roof press squishing a giant marshmallow
    if (L >= 9) { const y = g.H + .9; const big = G(at(cyl(.3, .3, 6, '#9AA8BC', 10), -3.4, 3, 0), at(cyl(.3, .3, 6, '#9AA8BC', 10), 3.4, 3, 0), at(box(8, 1, 3, '#5B6B85', .15), 0, 6.2, 0)); const p2 = at(box(7, .5, 2.6, '#FFD54A', .1), 0, 4.6, 0); D.anim(p2, 'bob', { amp: .7 }); big.add(p2); out.add(at(big, 0, y, -1), D.place('marshmallow', 0, y, -1, 2.4, 'squish')); }
    return out;
  },
  life3: (D, L) => L <= 2 ? D.place('bao', 5.6, 0, 4.4, 1.5, 'squish') : null,

  mock(K) {
    // the Squish Lab toy: a squishy under the hydraulic press, tools along the bottom
    let s = `<rect width="236" height="452" fill="#E8F4FF"/><rect width="236" height="44" fill="#4A7BD0"/>`;
    for (let x = 0; x < 236; x += 16) s += `<path d="M${x} 44 V360" stroke="#5A78A0" stroke-opacity=".1"/>`;
    s += K.R(8, 10, 112, 24, '#FFFFFF', 12, 2, '#2B2141') + K.Tb(36, 26, 'squish', 8, '#6E6688') + K.R(56, 16, 56, 12, '#F2EFFA', 6, 1.4, '#2B2141') + K.R(57.5, 17.5, 44, 9, '#FF6FA3', 4.5, 0) + K.Tb(164, 26, 'best 96%', 10, '#FFFFFF');
    // press
    s += `<rect x="40" y="44" width="10" height="196" fill="#9AA8BC"/><rect x="186" y="44" width="10" height="196" fill="#9AA8BC"/>` + K.R(18, 226, 200, 28, '#5B6B85', 6, 2, '#2B2141') + [0, 1, 2, 3, 4, 5].map(i => K.P(`M${30 + i * 32} 232 h10 l-6 16 h-10z`, '#FFD54A', 0)).join('') + K.T(118, 245, 'HYDRAULIC PRESS', 9, '#FFFFFF');
    // the squished squishy: wide and flat, bulging at the sides
    s += `<g class="a-squish"><ellipse cx="118" cy="300" rx="78" ry="45" fill="#FFFFFF" stroke="#2B2141" stroke-width="2.2"/>${K.C(102, 296, 3.4, '#2B2141', 0)}${K.C(134, 296, 3.4, '#2B2141', 0)}${K.P('M110 306 q8 6 16 0', 'none', 2, '#2B2141')}<ellipse cx="88" cy="304" rx="8" ry="4" fill="#FFB3C8"/><ellipse cx="148" cy="304" rx="8" ry="4" fill="#FFB3C8"/></g>`;
    s += K.R(-4, 346, 244, 14, '#B8C6D8', 0, 2, '#2B2141') + K.Tb(118, 380, 'Bao Bun · Slow-rise foam', 10, '#4A7BD0');
    // toolbar
    s += K.R(6, 392, 224, 54, '#FFFFFF', 14, 2, '#2B2141');
    ['Hand', 'Press', 'Roller', 'Squeeze', 'Ball', 'Drop'].forEach((t, i) => { const x = 25 + i * 37; s += K.C(x, 412, 13, i === 1 ? '#FFF3B0' : '#F2F6FC', 1.6, i === 1 ? '#2B2141' : '#C9D3E2') + K.Tb(x, 438, t, 7, '#6E7C92'); });
    return s;
  }
});
