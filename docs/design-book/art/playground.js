/* BOUNCE PARK PLAYGROUND — art file (playground + "Sky Bounce" minigame)
   Not a building: play equipment is added level by level.  Words live in playground.html */
SQ.reg('playground', {
  type: 'civic', name: 'Bounce Park', mult: 1, unit: 60, goal: 'Best height #m', noPots: true, bench: false,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#4A9BFF' },
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.L('M-10 10 V-10 H-2', '#5A5170', 2)}${K.P('M-2 -10 Q4 -10 6 0 Q8 8 12 10 L8 12 Q2 8 0 0 Q-2 -6 -2 -6Z', '#FF8FB8', 1.4)}</g>`,
  /* 3D model: play equipment added level by level */
  model(D, c) {
    const { G, at, cyl, ball, box, cube, cone, torus, tube } = D, L = c.L, PI = Math.PI, g = G();
    // sandbox (Lv1)
    g.add(at(G(at(box(6, .6, .5, '#C98A55', .1), 0, .3, -2.75), at(box(6, .6, .5, '#C98A55', .1), 0, .3, 2.75), at(box(.5, .6, 6, '#C98A55', .1), -2.75, .3, 0), at(box(.5, .6, 6, '#C98A55', .1), 2.75, .3, 0), at(box(5.2, .3, 5.2, '#FFE3A8', .1), 0, .25, 0), D.bucket(-1.4, 1, '#4A9BFF'), at(cyl(.06, .06, 1.4, '#FF6F7D', 6), 1.6, .8, -1, .5, 0, .3), D.place('toast', .6, .35, .4, 1.3, 'squish')), -7.5, 0, 5));
    if (L >= 2) { const plank = G(at(box(7, .3, .7, '#7ED3B2', .12), 0, 0, 0), at(cube(.12, .8, .7, '#5A5170'), -3, .4, 0), at(cube(.12, .8, .7, '#5A5170'), 3, .4, 0)); if (L >= 5) plank.add(D.place('marshmallow', -2.6, .15, 0, 1.2, 'none', { shadow: false })); D.anim(plank, 'rock'); g.add(at(G(at(cone(.6, 1.2, '#9A8FAA', 4), 0, .6, 0), at(plank, 0, 1.25, 0)), 7, 0, 7)); }
    if (L >= 3 && L < 7) { g.add(at(G(D.ladder(0, 0, 3.4, 0), at(box(1.6, .2, 1.6, '#C98A55', .05), 0, 3.4, -.6), at(box(1.2, .2, 5, '#FF8FB8', .1), 0, 1.8, 2, -.6, 0, 0), at(cube(.12, .6, 5, '#FF8FB8'), -.6, 2.1, 2, -.6, 0, 0), at(cube(.12, .6, 5, '#FF8FB8'), .6, 2.1, 2, -.6, 0, 0)), 0, 0, -1)); }
    if (L >= 4) {
      const frame = G(at(cyl(.15, .15, 6, '#4A9BFF', 8), -3.4, 2.8, .9, -.3, 0, 0), at(cyl(.15, .15, 6, '#4A9BFF', 8), -3.4, 2.8, -.9, .3, 0, 0), at(cyl(.15, .15, 6, '#4A9BFF', 8), 3.4, 2.8, .9, -.3, 0, 0), at(cyl(.15, .15, 6, '#4A9BFF', 8), 3.4, 2.8, -.9, .3, 0, 0), at(cyl(.18, .18, 7, '#4A9BFF', 8), 0, 5.6, 0, 0, 0, PI / 2));
      [[-1.5, 'bunny', '#FF6FA3'], [1.5, L >= 8 ? 'kitty' : null, '#FFD54A']].forEach(([x, who, col], i) => { const s = G(at(cyl(.03, .03, 3.6, '#9A8FAA', 4), -.5, -1.8, 0), at(cyl(.03, .03, 3.6, '#9A8FAA', 4), .5, -1.8, 0), at(box(1.3, .15, .6, col, .05), 0, -3.6, 0), who ? D.place(who, 0, -3.55, 0, 1.3, 'none', { shadow: false }) : null); D.anim(s, 'swing', { ph: i * 1.2 }); frame.add(at(s, x, 5.5, 0)); });
      g.add(at(frame, 6.5, 0, -4.5));
    }
    if (L >= 5) { const duck = G(at(ball(1, '#FFD54A', 1.3, .9, .9), 0, 0, 0), at(ball(.65, '#FFD54A'), .9, .8, 0), at(cone(.25, .5, '#FF8A3D', 8), 1.6, .75, 0, 0, 0, -PI / 2)); D.anim(duck, 'sway'); g.add(at(G(tube([[0, 0, 0], [.3, .3, 0], [0, .6, 0], [-.3, .9, 0], [0, 1.2, 0]], .1, '#9A8FAA'), at(duck, 0, 2, 0)), -2.8, 0, 6.6, 0, -.6, 0)); }
    if (L >= 6) { const dm = G(); for (let i = 0; i < 4; i++) dm.add(at(torus(3, .12, '#FF8A5C', PI, 6, 24), 0, 0, 0, 0, i * PI / 4, 0)); [1, 2].forEach(k => dm.add(at(torus(Math.sqrt(9 - k * k), .1, '#FF8A5C', PI * 2, 6, 28), 0, k, 0, PI / 2, 0, 0))); g.add(at(dm, -7.5, 0, -4.5)); }
    if (L >= 7) { const tw = G(at(box(3.4, 7.4, 3.4, '#FFE29A', .2), 0, 3.7, 0)); [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([x, z]) => tw.add(at(box(.8, .9, .8, '#FFE29A', .1), x, 7.8, z))); tw.add(at(cyl(.5, .5, .1, D.mat('#BFE6F7', { r: .2 }), 16), 0, 5, 1.72, PI / 2, 0, 0), at(box(1.2, 2.2, .2, '#C98A55', .1), 0, 1.1, 1.72), D.flag3(0, 8.2, 0, '#FF6FA3', 2.2)); tw.add(tube([[1.7, 5.6, 0], [3.6, 4.4, 1.4], [5, 2.6, 3], [5.6, .6, 4.6]], .55, '#FF8FB8'), D.place('peach', 4.4, 3.4, 2.4, 1.2, 'bob', { shadow: false })); g.add(at(tw, -.5, 0, -2)); }
    if (L >= 8) g.add(at(G(at(cyl(1.8, 1.8, .2, '#4A9BFF', 24), 0, .8, 0), ...[0, 1, 2, 3].map(i => at(cyl(.08, .08, .8, '#5A5170', 6), Math.cos(i * PI / 2) * 1.6, .4, Math.sin(i * PI / 2) * 1.6)), D.place('raindrop', 0, .9, 0, 1.2, 'hop', { shadow: false })), 2.4, 0, 6.4));
    if (L >= 9) { g.add(tube([[-.5, 8, -2], [11, 3.8, 8]], .04, '#5A5170'), at(cyl(.15, .15, 4, '#C98A55', 8), 11, 2, 8)); const rider = G(tube([[0, 0, 0], [0, -1, 0]], .03, '#5A5170'), D.place('jelly', 0, -2.2, 0, 1.1, 'none', { shadow: false })); D.anim(rider, 'float'); g.add(at(rider, 5.4, 5.8, 3)); }
    if (L >= 10) [['#FF6F7D', 6], ['#FFB84A', 5.4], ['#FFE066', 4.8], ['#7ED3B2', 4.2], ['#8CCBFF', 3.6]].forEach(([col, r]) => g.add(at(torus(r, .3, col, PI, 6, 36), 0, 0, 10.2)));
    return g;
  },

  mock(K) {
    let s = `<defs><linearGradient id="pgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9A6FF"/><stop offset=".5" stop-color="#8CCBFF"/><stop offset="1" stop-color="#DFF3FF"/></linearGradient></defs><rect width="236" height="452" fill="url(#pgSky)"/>`;
    s += K.R(8, 12, 100, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(58, 28, 'HEIGHT 1,250m', 10) + K.R(170, 12, 58, 22, '#FFFFFF', 11, 2, '#2B2141') + K.C(186, 23, 6, '#FFD54A', 1.4, '#C98A12') + K.Tb(208, 28, '36', 11);
    const cloud = (x, y, w = 50) => K.blobs([[x - w * .3, y, 9], [x, y - 4, 11], [x + w * .3, y, 9], [x - w * .45, y + 4, 7], [x + w * .45, y + 4, 7]], '#FFFFFF', 1.8, '#A9A2D8');
    const leaf = (x, y) => K.P(`M${x - 26} ${y} Q${x} ${y - 14} ${x + 26} ${y} Q${x} ${y + 8} ${x - 26} ${y}Z`, '#7ED36A', 1.8);
    s += cloud(60, 410) + cloud(170, 350) + leaf(70, 290) + cloud(180, 220) + leaf(54, 150) + cloud(150, 90);
    // crumbly cloud + spring pad
    s += `<g opacity=".7">${cloud(60, 230, 40)}</g>` + K.L('M48 224 l6 8 M66 226 l-4 8', '#9A8FAA', 1.4);
    s += K.L('M160 342 q-4 -3 0 -6 q4 -3 0 -6', '#9A8FAA', 2.4) + K.R(150, 324, 20, 6, '#FF6F7D', 3, 1.6);
    // coins + balloon power-up
    [[110, 320], [124, 300], [96, 196], [170, 168]].forEach(([x, y]) => s += K.C(x, y, 6, '#FFD54A', 1.6, '#C98A12'));
    s += `<g class="a-float">${K.E(200, 270, 12, 15, '#FF6FA3', 2)}${K.L('M200 285 q-4 10 2 20', '#9A8FAA', 1.2)}</g>`;
    // jumping squishy
    s += `<g class="a-bob">${K.place('marshmallow', 120, 268, .7, 'squish')}</g>` + K.L('M106 280 l-6 10 M134 280 l6 10', '#FFFFFF', 2.4);
    // tilt hint
    s += K.R(48, 418, 140, 26, '#FFFFFF', 13, 2, '#2B2141') + K.Tb(118, 435, 'Tilt to steer · tap to bounce', 9, '#5E5679');
    return s;
  }
});
