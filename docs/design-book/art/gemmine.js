/* GEM MINE — art file (where Squish Gems are bought with real money)
   One level only: it is built from day one and always looks finished and sparkly.
   Words for this page live in gemmine.html */
SQ.reg('gemmine', {
  type: 'civic', name: 'Gem Mine', single: true, singleLabel: 'Gem store', kind: 'Gem store · buy Gems', noPots: true, bench: false,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#8E6CFF' },
  fence: '#E9E2FF',
  /* icon: a faceted gem */
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.P('M-11 -4 L-6 -11 H6 L11 -4 L0 11Z', '#B9A4FF', 1.6, '#2B2141')}${K.P('M-11 -4 H11 M-6 -11 L-3 -4 L0 11 L3 -4 L6 -11', 'none', 1.2, '#6F55D9')}${K.P('M-6 -11 L-3 -4 H3 L6 -11Z', '#E3DAFF', 0)}</g>`,
  gemCols: ['#FF6FB5', '#5FD4FF', '#B48CFF', '#FFD54A', '#6FE3B5'],
  /* a 6-sided crystal, base at (0,0,0), pointing up */
  crystal(D, r, h, col) {
    const m = D.mat(col, { e: col, ei: .28 }), { G, at, cyl, cone } = D;
    return G(at(cyl(r, r * 1.05, h, m, 6), 0, h / 2, 0), at(cone(r, h * .45, m, 6), 0, h + h * .225, 0));
  },
  model(D, c) {
    const { G, at, box, cube, cyl } = D, PI = Math.PI, B = SQ.B.gemmine, g = G();
    /* a small mountain: one main peak and two little side peaks, soft rock with a pale frosty top */
    const peak = (h, r, col) => D.lathe([[r, 0], [r * .96, h * .12], [r * .8, h * .34], [r * .58, h * .58], [r * .34, h * .8], [r * .14, h * .95], [0, h]], col, 9, false);
    const cap = (h, r) => D.lathe([[r * .5, h * .66], [r * .36, h * .8], [r * .15, h * .95], [0, h + .08]], '#EEE8FF', 9, false);
    const M = [[0, -2.2, 12.5, 7.6, 0], [-5.6, -.8, 7.2, 4.6, .5], [5.4, -1.2, 8, 4.8, -.4]];
    M.forEach(([x, z, h, r, ry]) => g.add(at(peak(h, r, '#A99CC4'), x, 0, z, 0, ry, 0), at(cap(h, r), x, 0, z, 0, ry, 0)));
    // a few boulders around the foot
    [[-8.6, 3.4, 1], [8.4, 3.8, .8], [-3.4, 5.4, .55], [9.6, -3, .9], [-9.4, -3.6, .7]].forEach(([x, z, s]) => g.add(at(D.ball(1.1 * s, '#B9AFCF', 1.2, .8, 1, 10), x, .5 * s, z)));
    // mine entrance in the front of the mountain: dark tunnel in a wooden frame
    const arch = []; arch.push([-1.9, 0], [1.9, 0], [1.9, 2.6]); for (let i = 1; i < 12; i++) { const a = i / 12 * PI; arch.push([1.9 * Math.cos(a), 2.6 + 1.9 * Math.sin(a)]); } arch.push([-1.9, 2.6]);
    g.add(at(D.slab(arch, 2, '#2F2638', 0), 0, 0, 3.7));
    g.add(at(box(.55, 4.8, .7, '#A7794E', .08), -2.2, 2.4, 5.6), at(box(.55, 4.8, .7, '#A7794E', .08), 2.2, 2.4, 5.6), at(box(5.4, .65, .8, '#A7794E', .08), 0, 4.9, 5.6));
    // sign above the entrance
    g.add(at(box(6, 1.6, .3, '#8A5A2E', .1), 0, 6.2, 5.75), at(D.signPlane({ icon: null, roof: '#6F55D9' }, 'GEM MINE', 5.6, 1.3, { bg: '#FFF3B0', ink: '#6F55D9' }), 0, 6.2, 5.92));
    // rails coming out of the mine, with a cart full of gems
    for (let i = 0; i < 5; i++) g.add(at(cube(3, .14, .42, '#8A6A4E'), 0, .08, 6.2 + i * 1.05));
    g.add(at(cube(.16, .14, 5.2, '#8C93A3'), -1, .2, 8.3), at(cube(.16, .14, 5.2, '#8C93A3'), 1, .2, 8.3));
    const cart = G(at(box(2.4, 1.2, 1.8, '#7E8696', .15), 0, 1, 0));
    [[-.75, -.9], [.75, -.9], [-.75, .9], [.75, .9]].forEach(([x, z]) => cart.add(at(cyl(.3, .3, .2, '#3E3A44', 12), x, .36, z, PI / 2, 0, 0)));
    B.gemCols.forEach((col, i) => cart.add(at(D.mesh(new THREE.OctahedronGeometry(.4), D.mat(col, { e: col, ei: .35 })), -.75 + (i % 3) * .75, 1.85 + (i > 2 ? .22 : 0), (i % 2 ? .32 : -.28), .4 * i, .7 * i, 0)));
    D.anim(cart, 'bob', { amp: .05 }); g.add(at(cart, 0, .2, 9.4, 0, .08, 0));
    /* glowing crystals growing out of the slopes: [peak index, angle around it, height fraction, size, colour] */
    const crystals = [[0, .9, .3, 1, '#FF6FB5'], [0, -.95, .28, .95, '#5FD4FF'], [0, 1.9, .5, .8, '#B48CFF'], [0, -1.9, .48, .8, '#FFD54A'], [0, .45, .62, .7, '#6FE3B5'], [0, -.5, .66, .65, '#FF6FB5'],
      [0, 3.1, .45, .9, '#5FD4FF'], [1, .7, .35, .7, '#FFD54A'], [1, -.4, .5, .55, '#5FD4FF'], [2, -.8, .32, .75, '#B48CFF'], [2, .5, .52, .6, '#FF6FB5']];
    crystals.forEach(([k, ang, f, s, col]) => {
      const [px, pz, h, r] = M[k], y = h * f, rr = r * (1 - f * .95) * .98, x = px + Math.sin(ang) * rr, z = pz + Math.cos(ang) * rr;
      g.add(at(B.crystal(D, .55 * s, 2.6 * s, col), x, y - .3, z, Math.cos(ang) * .55, 0, -Math.sin(ang) * .55));
    });
    // a crown of crystals on the summit
    [[0, '#FF6FB5', 0], [1.2, '#5FD4FF', .35], [-1.2, '#B48CFF', -.35]].forEach(([dx, col, tilt]) => g.add(at(B.crystal(D, .5, 2.2, col), dx * .5, 12.1, -2.2, 0, 0, -tilt)));
    // lanterns by the door and twinkles
    g.add(D.lantern(-2.9, 4, 6.1, '#FFD54A', true), D.lantern(2.9, 4, 6.1, '#FFD54A', true));
    [[-5, 8, 0], [5.6, 9, -.5], [0, 15.8, -2.2], [2.6, 13.6, -1.6], [-6.4, 4.8, 2.4]].forEach(p => g.add(D.sparkle(...p, 1.5, '#FFFFFF')));
    return g;
  },
  life3: (D) => D.place('goldumpling', -5.4, 0, 7.4, 1.5, 'hop'),
  mock(K) { return `<rect width="236" height="452" fill="#F1EDFF"/>`; }
});
