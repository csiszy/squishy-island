/* SPLASH SQUAD FIRE STATION — art file (fire station + "Bucket Brigade" colour-sorting minigame)
   Words for this page live in fire.html */
SQ.reg('fire', {
  type: 'civic', name: 'Splash Squad Station', sign: 'SPLASH', mult: 1.8, unit: 2, goal: 'Beat level #', garage: true, bench: false,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#D93A2B' },
  wall: '#FFE6DA', roof: '#D93A2B', trim: '#FFFFFF', awn: ['#D93A2B', '#FFFFFF'], roofStyle: 'flat', door: '#F4F1F8',
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.P('M0 -12 Q10 -2 8 6 Q6 12 0 12 Q-6 12 -8 6 Q-10 -2 -2 -6 Q-2 0 2 0 Q0 -6 0 -12Z', '#FF8A3D', 1.6, '#C2410C')}${K.P('M0 2 Q4 6 3 9 Q0 12 -3 9 Q-3 6 0 2Z', '#FFD54A', 0)}</g>`,
  /* 3D extras that appear on top of the generic fun building */
  extra3(D, L, g) {
    const { G, at, cyl, ball, box, cube, cone } = D, PI = Math.PI, out = G();
    if (L >= 7) { const t = G(at(box(5.6, 1.8, 2.4, '#D93A2B', .3), 0, 1.3, 0), at(box(1.8, 1.6, 2.3, '#D93A2B', .3), 2.4, 2.6, 0), at(cube(1.2, .9, 2.32, D.mat('#BFE6F7', { r: .2 })), 2.6, 2.75, 0), at(cube(4.2, .14, .14, '#C9CFD8'), -.8, 2.5, .6, 0, 0, .12), at(cube(4.2, .14, .14, '#C9CFD8'), -.8, 2.5, -.6, 0, 0, .12), ...[-2.4, -1.6, -.8, 0, .8].map(x => at(cube(.1, .1, 1.3, '#C9CFD8'), x - .4, 2.45 + (x + 2.4) * .12, 0)), at(cube(5.62, .2, 2.42, '#FFFFFF'), 0, 1.5, 0), ...[[-1.8, 1.2], [1.8, 1.2], [-1.8, -1.2], [1.8, -1.2]].map(([x, z]) => at(cyl(.55, .55, .35, '#4A4458', 14), x, .55, z, PI / 2, 0, 0))); out.add(at(t, 9.4, 0, 6.8, 0, -.45, 0), D.place('raindrop', 6.4, 0, 9, 1.4, 'hop')); }
    if (L >= 9) out.add(at(G(at(box(2.6, 9, 2.6, '#D93A2B', .2), 0, 4.5, 0), at(cone(2.2, 1.8, '#B02E22', 4), 0, 9.9, 0, 0, PI / 4, 0), at(cyl(.7, .7, .2, D.mat('#BFE6F7', { r: .2 }), 18), 0, 7, 1.32, PI / 2, 0, 0)), -g.w / 2 - 1.6, 0, -2));
    if (L >= 10) out.add(D.place('puppy', -9.6, 0, 7, 1.5, 'bob', { inner: D.at(D.G(D.at(D.ball(.75, '#D93A2B', 1, .5, 1), 0, 0, 0), D.at(D.box(.5, .4, .1, '#FFD54A', .05), 0, .15, .7)), 0, 1.85, 0) }));
    return out;
  },
  life3: (D, L) => L <= 2 ? D.place('raindrop', 5.6, 0, 4.4, 1.5, 'hop') : null,

  mock(K) {
    // BUCKET BRIGADE: level-based colour-sorting puzzle
    let s = `<rect width="236" height="452" fill="#CDEBFF"/><rect y="300" width="236" height="152" fill="#FFE6DA"/><rect width="236" height="44" fill="#D93A2B"/>`;
    s += K.R(8, 11, 80, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(48, 27, 'Level 12', 11) + K.R(150, 11, 78, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(189, 27, '8 colours', 10);
    s += K.R(8, 50, 220, 44, '#FFFFFF', 12, 2, '#2B2141') + K.R(14, 56, 50, 32, '#D93A2B', 9, 0) + K.Tb(39, 66, 'moves', 7, '#FFE0DA') + K.T(39, 84, '9', 16, '#FFFFFF');
    s += K.Tb(146, 66, 'Stars if you finish now', 8, '#7C7494') + [0, 1, 2].map(i => K.star(124 + i * 22, 80, 8, 3.6, i < 3 ? '#FFC93C' : '#E3DEEF', 1.4, '#2B2141')).join('');
    const COL = ['#FF5E6C', '#FF9F43', '#FFD23F', '#5ACB7A', '#3CC8C8', '#4A8BFF', '#A57CFF', '#FF7AC8'];
    const tube = (x, y, layers, done) => {
      let g = `<path d="M${x + 15} ${y + 2} a13 13 0 0 1 0 0" fill="none"/>` + K.L(`M${x + 2} ${y + 6} A13 13 0 0 1 ${x + 28} ${y + 6}`, '#9A8FAA', 2);
      const body = `M${x} ${y + 6} H${x + 30} L${x + 28} ${y + 78} Q${x + 27} ${y + 86} ${x + 15} ${y + 86} Q${x + 3} ${y + 86} ${x + 2} ${y + 78}Z`;
      g += `<path d="${body}" fill="rgba(255,255,255,.6)"/>`;
      layers.forEach((k, j) => { const ly = y + 84 - (j + 1) * 18; g += k === 'h' ? `<rect x="${x + 2}" y="${ly}" width="26" height="18" fill="#B8B2C8"/>` + K.Tb(x + 15, ly + 13, '?', 10, '#FFFFFF') : `<rect x="${x + 2}" y="${ly}" width="26" height="18" fill="${COL[k]}"/><rect x="${x + 2}" y="${ly}" width="26" height="2.5" fill="#FFFFFF" opacity=".3"/>`; });
      g += `<path d="${body}" fill="none" stroke="#2B2141" stroke-width="2"/>` + K.R(x - 2, y + 2, 34, 8, done ? '#FFC93C' : '#D93A2B', 4, 1.8, '#2B2141');
      return g;
    };
    const rows = [[[0, 'h', 3, 2], [5, 5, 1, 4], [6, 6, 6, 6], [2, 'h', 7, 0], [4, 1, 3, 4]], [[3, 7, 0, 1], [7, 2], [5, 5], []]];
    rows.forEach((row, r) => row.forEach((L, i) => { const x = 14 + i * 44, y = 116 + r * 120; s += tube(x, y, L, L.length === 4 && L.every(v => v === L[0])); if (L.length === 4 && L.every(v => v === L[0])) s += K.place('raindrop', x + 15, y + 2, .28, 'bob'); }));
    // pouring bucket
    s += K.L('M166 233 Q163 260 161 312', '#3CC8C8', 5) + `<g transform="translate(172 228) rotate(-60) scale(.8)">${tube(-15, -6, [0, 4, 4], false)}</g>`;
    // buttons + firefighter
    s += ['Undo', 'Restart', '+ Bucket'].map((t, i) => K.R(10 + i * 76, 372, 66, 26, '#FFFFFF', 13, 2, '#2B2141') + K.Tb(43 + i * 76, 389, t, 9.5)).join('');
    s += K.place('raindrop', 28, 446, .48, 'squish', { inner: K.P('M24 30 Q50 6 76 30 L72 38 H28Z', '#D93A2B', 1.8) }) + K.Tb(140, 426, '3 of 8 colours sorted', 10, '#9A3A2F') + K.Tb(140, 440, 'Tap a bucket, then tap where to pour', 8.5, '#5E5679');
    return s;
  }
});
