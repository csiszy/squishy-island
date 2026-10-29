/* SQUISH PATROL STATION — art file (police station + "Lost & Found" match-3 minigame)
   Words for this page live in police.html */
SQ.reg('police', {
  type: 'civic', name: 'Squish Patrol Station', sign: 'PATROL', mult: 1.6, unit: 2, goal: 'Beat level #', bench: false,
  /* map bubble: colour of the icon bubble on the city map */
  badge: { color: '#2F5BD3' },
  wall: '#E3EDFF', roof: '#2F5BD3', trim: '#FFFFFF', awn: ['#2F5BD3', '#FFFFFF'], roofStyle: 'mansard', door: '#2F5BD3',
  icon: (K, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${K.P('M0 -11 L9 -7 V2 Q9 9 0 12 Q-9 9 -9 2 V-7Z', '#FFD54A', 1.6, '#C98A12')}${K.star(0, 0, 5, 2.2, '#FFFFFF', 1, '#C98A12')}</g>`,
  /* 3D extras that appear on top of the generic fun building */
  extra3(D, L, g) {
    const { G, at, cyl, ball, box, cube } = D, PI = Math.PI, out = G();
    if (L >= 7) { const car = G(at(box(4.6, 1.3, 2.4, '#FFFFFF', .4), 0, 1, 0), at(cube(4.62, .35, 2.42, '#2F5BD3'), 0, 1.05, 0), at(box(2.4, 1.1, 2.2, '#FFFFFF', .35), -.2, 2.1, 0), at(cube(2.3, .8, 2.24, D.mat('#BFE6F7', { r: .2 })), -.2, 2.15, 0), ...[[-1.5, 1.1], [1.5, 1.1], [-1.5, -1.1], [1.5, -1.1]].map(([x, z]) => at(cyl(.45, .45, .3, '#4A4458', 14), x, .45, z, PI / 2, 0, 0)), at(box(.8, .35, .6, '#C9D3E2', .1), -.2, 2.8, 0)); const s = D.anim(at(ball(.25, D.mat('#FF5E6C', { e: '#FF5E6C', ei: .8 })), -.4, 3.05, 0), 'glow'); const s2 = D.anim(at(ball(.25, D.mat('#4A9BFF', { e: '#4A9BFF', ei: .8 })), 0, 3.05, 0), 'glow', { ph: 3 }); car.add(s, s2); out.add(at(car, 9.4, 0, 6.6, 0, -.5, 0)); }
    if (L >= 9) { const y = g.H + 3.4; out.add(at(box(1.8, .6, 1, '#C9D3E2', .15), 0, y, 0), D.anim(at(ball(.45, D.mat('#FF5E6C', { e: '#FF5E6C', ei: .9 })), -.5, y + .55, 0), 'glow'), D.anim(at(ball(.45, D.mat('#4A9BFF', { e: '#4A9BFF', ei: .9 })), .5, y + .55, 0), 'glow', { ph: 3 })); }
    if (L >= 3 && L < 7) out.add(D.place('puppy', -9.6, 0, 6.4, 1.6, 'bob'));
    return out;
  },
  life3: (D, L) => L <= 2 ? D.place('puppy', 5.6, 0, 4.4, 1.5, 'bob') : null,

  mock(K) {
    // LOST & FOUND: level-based match-3
    let s = `<rect width="236" height="452" fill="#E3EDFF"/><rect width="236" height="44" fill="#2F5BD3"/>`;
    s += K.R(8, 11, 76, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(46, 27, 'Level 7', 11) + K.R(160, 11, 68, 22, '#FFFFFF', 11, 2, '#2B2141') + K.Tb(194, 27, '↺ restart', 9);
    s += K.R(8, 50, 220, 48, '#FFFFFF', 12, 2, '#2B2141') + K.R(14, 56, 48, 36, '#2F5BD3', 9, 0) + K.Tb(38, 67, 'moves', 7, '#CFE0FF') + K.T(38, 87, '14', 17, '#FFFFFF');
    const paw = (x, y, sc, c) => `<g transform="translate(${x} ${y}) scale(${sc})" fill="${c}"><ellipse cx="0" cy="3" rx="6" ry="5"/><ellipse cx="-6" cy="-3" rx="2.3" ry="2.7"/><ellipse cx="-2.2" cy="-7" rx="2.3" ry="2.7"/><ellipse cx="2.2" cy="-7" rx="2.3" ry="2.7"/><ellipse cx="6" cy="-3" rx="2.3" ry="2.7"/></g>`;
    const item = (k, x, y, sc = 1) => {
      const g = c => `<g transform="translate(${x} ${y}) scale(${sc})">${c}</g>`;
      if (k === 0) return g(K.E(0, -2, 9, 10, '#FF5E6C', 1.6, '#2B2141') + K.L('M0 8 q-2 4 1 6', '#2B2141', 1.4) + `<ellipse cx="-3.5" cy="-6" rx="2" ry="3.2" fill="#FFFFFF" opacity=".75"/>`);
      if (k === 1) return g(K.P('M-7 10 V-3 Q-7 -11 1 -11 Q8 -11 7 -3 L7 0 Q12 -4 12 1 Q12 6 7 7 V10Z', '#5BA8FF', 1.6, '#2B2141') + K.R(-8, 6, 16, 6, '#FFFFFF', 3, 1.4, '#2B2141'));
      if (k === 2) return g(K.P('M-7 0 L-13 -5 V5Z M7 0 L13 -5 V5Z', '#C9579C', 1.4, '#2B2141') + K.C(0, 0, 8, '#FF8FD0', 1.6, '#2B2141') + K.L('M-4 2 A4.5 4.5 0 0 0 4 2', '#FFFFFF', 1.6));
      if (k === 3) return g(K.C(-4, -4, 6.5, '#FFC93C', 1.6, '#2B2141') + K.C(-4, -4, 2.3, '#FFFFFF', 1.2, '#2B2141') + K.P('M0 0 L9 9 L6 12 L4 10 L2 11 L-2 4Z', '#FFC93C', 1.6, '#2B2141'));
      if (k === 4) return g([0, 1, 2, 3].map(i => `<g transform="rotate(${45 + i * 90})">${K.P('M0 0 C-7 -4 -6 -12 0 -9 C6 -12 7 -4 0 0Z', '#5ACB7A', 1.4, '#2B2141')}</g>`).join('') + K.C(0, 0, 2, '#FFFFFF', 1, '#2B2141'));
      return g(K.P('M0 0 Q-12 -12 -12 -1 Q-12 9 0 0Z M0 0 Q12 -12 12 -1 Q12 9 0 0Z', '#A57CFF', 1.6, '#2B2141') + K.C(0, 0, 3.2, '#6E48C9', 1.4, '#2B2141'));
    };
    s += item(1, 110, 70, .8) + K.Tb(110, 92, '6', 10) + paw(160, 72, 1, '#8E6CE0') + K.Tb(160, 92, '4', 10) + item(5, 205, 70, .8) + `<circle cx="214" cy="78" r="6" fill="#4FCFA0" stroke="#2B2141" stroke-width="1.4"/>` + K.L('M211 78 l2 2 l4 -4', '#FFFFFF', 1.6);
    // board 7 x 8
    const T = 30, X0 = 13, Y0 = 108, B = ['3401253', '1250341', '0425103', '5013240', '2340512', '4103025', '0541203', '3215430'];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 7; c++) s += `<rect x="${X0 + c * T}" y="${Y0 + r * T}" width="${T}" height="${T}" fill="${(r + c) % 2 ? '#FFFFFF' : '#F0F5FF'}"/>`;
    [[6, 1], [6, 2], [7, 1], [7, 2], [5, 2]].forEach(([r, c]) => s += paw(X0 + c * T + 15, Y0 + r * T + 15, .9, '#B9A2F0'));
    s += `<rect x="${X0}" y="${Y0}" width="${7 * T}" height="${8 * T}" fill="none" stroke="#2B2141" stroke-width="2"/>`;
    B.forEach((row, r) => [...row].forEach((k, c) => { const x = X0 + c * T + 15, y = Y0 + r * T + 15; if (r === 3 && c === 3) s += `<g class="a-twinkle">${K.star(x, y, 12, 7, '#FFC93C', 1.6, '#2B2141')}${K.C(x, y, 4, '#FFF3B0', 1.2, '#2B2141')}</g>`; else s += item(+k, x, y, .82); if (r === 5 && c === 5) s += `<rect x="${x - 10}" y="${y - 2}" width="20" height="2" fill="#FFFFFF"/><rect x="${x - 10}" y="${y + 2}" width="20" height="2" fill="#FFFFFF"/>` + K.C(x + 9, y - 9, 3.5, '#FF5E6C', 1.2, '#2B2141'); if ((r === 1 && c === 4) || (r === 2 && c === 1)) s += K.R(x - 13, y - 13, 26, 26, 'rgba(200,232,255,.7)', 6, 1.8, '#6FA8DC'); }));
    // a swipe hint
    s += `<g class="a-bob">${K.R(X0 + 2 * T + 2, Y0 + 4 * T + 2, T * 2 - 4, T - 4, 'none', 8, 2.4, '#FFC93C')}</g>` + K.L(`M${X0 + 2 * T + 22} ${Y0 + 4 * T + 26} h16`, '#2B2141', 2) + K.P(`M${X0 + 2 * T + 38} ${Y0 + 4 * T + 22} l5 4 l-5 4Z`, '#2B2141', 1);
    // score bar + officer
    s += K.R(12, 360, 212, 10, '#F2EFFA', 5, 1.6, '#2B2141') + K.R(14, 362, 120, 6, '#FFC93C', 3, 0) + K.star(140, 365, 7, 3.2, '#FFC93C', 1.4, '#2B2141') + K.star(196, 365, 7, 3.2, '#E3DEEF', 1.4, '#2B2141');
    s += K.place('puppy', 28, 444, .5, 'bob') + K.R(58, 392, 170, 40, '#FFFFFF', 12, 2, '#2B2141') + K.Tb(143, 409, 'Find the paw-print clues!', 9.5, '#2F5BD3') + K.Tb(143, 423, '4 in a row makes a Siren', 8.5, '#5E5679');
    return s;
  }
});
