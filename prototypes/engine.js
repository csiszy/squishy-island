/* ===== Squishy Island mini engine (shared by every minigame file) =====
   Logical screen 360 x 640 (phone portrait), scaled to fit any screen.
   A game is an object: { id, title, init, update(dt), draw(ctx), down/move/up(x,y), key(code, isDown) } */
const SQV = (() => {
  const W = 360, H = 640;
  const IMG = {};
  Object.entries(SPR).forEach(([k, v]) => { const i = new Image(); i.src = v; IMG[k] = i; });
  const store = {
    get(k) { try { return +(localStorage.getItem('squishyisland-' + k) || 0); } catch (e) { return 0; } },
    set(k, v) { try { localStorage.setItem('squishyisland-' + k, String(v)); } catch (e) {} }
  };
  let ac = null;
  const getAc = () => (ac = ac || (window.SQS && SQS.ctx()) || null);
  const OUT = () => (window.SQS ? SQS.out(ac) : ac.destination);
  function sfx(f = 600, d = .08, type = 'sine', v = .12, slide = 0) {
    if (!getAc() || (window.SQS && !SQS.settings.sfx)) return; try {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f * slide), t + d);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(OUT()); o.start(t); o.stop(t + d + .02);
    } catch (e) {}
  }
  function noise(d = .05, v = .08, hp = 4000) {
    if (!getAc() || (window.SQS && !SQS.settings.sfx)) return; try {
      const n = ac.createBufferSource(), b = ac.createBuffer(1, Math.ceil(ac.sampleRate * d), ac.sampleRate), ch = b.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
      const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const g = ac.createGain(); g.gain.value = v;
      n.buffer = b; n.connect(f); f.connect(g); g.connect(OUT()); n.start();
    } catch (e) {}
  }
  const buzz = ms => { if (window.SQS) return SQS.buzz(ms); try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  const play = (n, p) => { if (window.SQS) SQS.play(n, p); };
  /* background music for each minigame (see sound.html); Squeak Beat makes its own */
  const TRACK = { 'bistro-rush': 'bistro', 'sky-bounce': 'sky', 'lost-and-found': 'detective', 'style-studio': 'salon', 'bucket-brigade': 'fire', 'sort-a-lot': 'post', 'grow-grow-garden': 'garden', 'squish-breaker': 'arcade', 'squish-lab': 'lab' };
  const tier = () => window.SQS ? SQS.tier() : 'high', calm = () => window.SQS && SQS.reduced();

  /* ---------- drawing helpers ---------- */
  const INK = '#3A2A4A';
  const D = {
    rr(c, x, y, w, h, r, fill, stroke = INK, lw = 2.5) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : (c.moveTo(x + r, y), c.arcTo(x + w, y, x + w, y + h, r), c.arcTo(x + w, y + h, x, y + h, r), c.arcTo(x, y + h, x, y, r), c.arcTo(x, y, x + w, y, r)); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke && lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); } },
    circle(c, x, y, r, fill, stroke = INK, lw = 2.5) { c.beginPath(); c.arc(x, y, Math.max(.1, r), 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke && lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); } },
    text(c, t, x, y, size = 16, fill = INK, align = 'center', font = 'display', stroke = null, sw = 4) {
      c.font = (font === 'display' ? `${size}px "Bagel Fat One", "Arial Rounded MT Bold", system-ui, sans-serif` : `900 ${size}px Nunito, system-ui, sans-serif`);
      c.textAlign = align; c.textBaseline = 'middle'; if (stroke) { c.lineJoin = 'round'; c.lineWidth = sw; c.strokeStyle = stroke; c.strokeText(t, x, y); } c.fillStyle = fill; c.fillText(t, x, y);
    },
    sprite(c, id, x, y, size, opt = {}) { const im = IMG[id]; if (!im || !im.complete) return; c.save(); c.translate(x, y); if (opt.rot) c.rotate(opt.rot); const sx = (opt.sx || 1) * (opt.flip ? -1 : 1), sy = opt.sy || 1; c.scale(sx, sy); if (opt.alpha != null) c.globalAlpha = opt.alpha; c.drawImage(im, -size / 2, -size * (opt.anchor ?? .92), size, size); c.restore(); },
    shadow(c, x, y, rx, a = .14) { c.save(); c.globalAlpha = a; c.fillStyle = '#2B2141'; c.beginPath(); c.ellipse(x, y, rx, rx * .28, 0, 0, Math.PI * 2); c.fill(); c.restore(); },
    heart(c, x, y, s, fill = '#FF6F7D') { c.save(); c.translate(x, y); c.scale(s / 20, s / 20); c.beginPath(); c.moveTo(0, 7); c.bezierCurveTo(-12, -2, -9, -12, 0, -6); c.bezierCurveTo(9, -12, 12, -2, 0, 7); c.fillStyle = fill; c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke(); c.restore(); },
    star(c, x, y, R, r, fill = '#FFD54A', stroke = INK, lw = 2) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; c.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); } c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); } },
    coin(c, x, y, r) { D.circle(c, x, y, r, '#FFD54A', '#C98A12', 2); c.fillStyle = '#FFF3B0'; c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .3, 0, 7); c.fill(); },
    hud(c, color, left, right) { c.fillStyle = color; c.fillRect(0, 0, W, 52); if (left) { D.rr(c, 10, 12, left.w || 112, 28, 14, '#FFFFFF'); D.text(c, left.t, 10 + (left.w || 112) / 2, 27, 14, INK, 'center', 'body'); } if (right) { D.rr(c, W - 10 - (right.w || 100), 12, right.w || 100, 28, 14, '#FFFFFF'); D.text(c, right.t, W - 10 - (right.w || 100) / 2, 27, 14, INK, 'center', 'body'); } },
    hearts(c, x, y, n, max = 3) { D.rr(c, x - 16, y - 14, max * 22 + 10, 28, 14, '#FFFFFF'); for (let i = 0; i < max; i++) D.heart(c, x + i * 22, y + 1, 18, i < n ? '#FF5E6C' : '#E3DEEF'); },
    bar(c, x, y, w, h, t, col) { D.rr(c, x, y, w, h, h / 2, '#F2EFFA', INK, 2); if (t > 0) D.rr(c, x + 2, y + 2, Math.max(h - 4, (w - 4) * Math.min(1, t)), h - 4, (h - 4) / 2, col || (t > .5 ? '#4FCFA0' : t > .25 ? '#FFC94D' : '#FF6F7D'), null, 0); },
    INK
  };

  /* ---------- the runner ---------- */
  function run(game) {
    document.title = game.title + ' · Squishy Island';
    const root = document.getElementById('app'), cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    cv.setAttribute('aria-label', game.title + ' game'); root.appendChild(cv);
    const ui = document.createElement('div'); ui.className = 'ui'; root.appendChild(ui);
    let scale = 1, dpr = 1, ox = 0, oy = 0;
    function fit() {
      const vw = root.clientWidth, vh = root.clientHeight; scale = Math.min(vw / W, vh / H); dpr = Math.min({ low: 1, medium: 2, high: 3 }[tier()] || 2, window.devicePixelRatio || 1);
      const cw = Math.round(W * scale), ch = Math.round(H * scale); cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      ox = (vw - cw) / 2; oy = (vh - ch) / 2; cv.style.left = ox + 'px'; cv.style.top = oy + 'px'; ui.style.left = ox + 'px'; ui.style.top = oy + 'px'; ui.style.width = cw + 'px'; ui.style.height = ch + 'px'; ui.style.setProperty('--s', scale);
    }
    window.addEventListener('resize', fit); fit();
    const G = { W, H, IMG, D, sfx, noise, buzz, score: 0, state: 'menu', t: 0, fx: [], shakeT: 0, best: store.get(game.id) };
    G.float = (x, y, t, col = '#FFFFFF', size = 18) => G.fx.push({ k: 'txt', x, y, t, col, size, life: 1 });
    G.burst = (x, y, col = '#FFD54A', n = 10, sp = 140) => { if (calm()) n = Math.ceil(n / 3); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = sp * (.4 + Math.random() * .8); G.fx.push({ k: 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, r: 3 + Math.random() * 4, col, life: .7 + Math.random() * .4 }); } };
    G.shake = t => { if (!calm()) G.shakeT = Math.max(G.shakeT, t); };
    /* rewarded ad: once per game, a player who just lost may choose to watch a short ad to keep going */
    G.end = () => {
      if (G.state !== 'play') return;
      if (game.revive && !G.revived && !(window.SQS && SQS.settings.adsOff) && (!game.canRevive || game.canRevive(G))) { G.state = 'continue'; if (game.pause) game.pause(G); if (window.SQS) SQS.duck(true); buzz(120); sfx(300, .4, 'triangle', .14, .4); return showContinue(); }
      finish();
    };
    function showContinue() {
      card(`<p class="eyebrow">${game.reviveTitle ? game.reviveTitle(G) : 'Oh no!'}</p><h1>Keep going?</h1><p class="sub">${game.reviveLine ? game.reviveLine(G) : `You have ${G.score.toLocaleString('en-US')} ${game.scoreName || 'points'} so far.`}</p><button class="go" type="button" data-act="__ad">&#9654; Watch an ad</button><p class="keys" style="margin:.4em 0 .6em">${game.reviveGift || 'and carry on with 1 more heart'} · once per game</p><button class="ghost" type="button" data-act="__no">No thanks</button>`);
      ui.querySelector('[data-act="__ad"]').addEventListener('click', playAd); ui.querySelector('[data-act="__no"]').addEventListener('click', finish);
    }
    function playAd() {
      // prototype stand-in: the real app shows a kid-safe rewarded video here (no tracking).
      // Google Play Families rule: an ad that interrupts play must be closable after 5 seconds.
      // Closing early gives no reward; watching to the end continues the game.
      const LEN = 8; let t = 0; play('adStart');
      const draw = () => { ui.innerHTML = `<div class="card"><p class="eyebrow">Ad</p><h1 style="font-size:1.6em">Your ad plays here</h1><p class="sub">In the real app: a short, kid-safe video ad. Here it is just a wait (${LEN - t}).</p><div class="adbar"><i style="width:${t / LEN * 100}%"></i></div>${t >= 5 ? '<button class="ghost" type="button" data-act="__close">&#10005; Close (no reward)</button>' : '<p class="keys">You can close it after 5 seconds</p>'}</div>`;
        const c = ui.querySelector('[data-act="__close"]'); if (c) c.addEventListener('click', () => { clearInterval(iv); if (window.SQS) SQS.duck(false); finish(); }); };
      draw(); const iv = setInterval(() => { t++; draw(); if (t >= LEN) { clearInterval(iv); G.revived = true; ui.innerHTML = ''; G.state = 'play'; game.revive(G); if (game.resume) game.resume(G); if (window.SQS) SQS.duck(false); sfx(880, .2, 'triangle', .1, 1.5); } }, 1000);
    }
    function finish() {
      if (game.beforeOver) game.beforeOver(G);
      G.state = 'over'; const nb = !game.levels && G.score > G.best; if (nb) { G.best = G.score; store.set(game.id, G.score); } G.jarFrom = store.get('wallet'); const pay = payout(); if (pay.total) store.set('wallet', store.get('wallet') + pay.total); G.pay = pay; buzz(120); sfx(300, .4, 'triangle', .14, .4); if (window.SQS) SQS.duck(true); showOver(nb, pay); tourBack(); countUp(); }
    /* first tour: the map sends the player here with ?tour=game; the results card gets a way back to town */
    const TOUR = new URLSearchParams(location.search).get('tour') === 'game';
    function tourBack() { if (!TOUR) return; const c = ui.querySelector('.card'); if (c) c.insertAdjacentHTML('beforeend', `<div class="tourback"><p><b>Bao:</b> Great bouncing! Let’s go back to town.</p><a class="go" data-act="__town" href="../index.html">Back to town &#9654;</a></div>`); }
    function tourHello() { if (!TOUR) return; const c = ui.querySelector('.card'); if (c) c.insertAdjacentHTML('afterbegin', `<p class="tourback" style="margin:0 0 .5em"><b>Bao:</b> Bounce as high as you can, then come back!</p>`); }
    /* results screen: every number counts up from 0 in about half a second, with ticks, then a ding.
       Score first, then coins, then the coin jar. 'New best' stamps pop in after the counting. */
    function countUp() {
      const els = [...ui.querySelectorAll('[data-count]')], later = [...ui.querySelectorAll('.nb')], put = (el, v) => { el.textContent = fmt(v); };
      G.counting = true; G.countSkip = false;
      const reveal = () => { G.counting = false; later.forEach(el => { el.classList.remove('later'); el.classList.add('stamp'); }); if (later.length) { play('newBest'); buzz(40); } };
      if (calm() || !els.length) { els.forEach(el => put(el, +el.dataset.count)); play('countDone'); reveal(); return; }
      later.forEach(el => el.classList.add('later')); els.forEach(el => put(el, +(el.dataset.from || 0)));
      let i = 0; const DUR = 500, GAP = 110;
      const next = () => {
        const el = els[i++]; if (!el) return reveal(); if (!el.isConnected) return;
        const a = +(el.dataset.from || 0), b = +el.dataset.count, coins = el.dataset.kind === 'coins', t0 = performance.now(); let tk = 0;
        if (a === b) { put(el, b); return next(); }
        const step = now => { if (!el.isConnected) return; const u = G.countSkip ? 1 : Math.min(1, (now - t0) / DUR), e = 1 - Math.pow(1 - u, 3); put(el, a + (b - a) * e);
          if (u < 1) { if (now - tk > 42) { tk = now; play(coins ? 'coinsCount' : 'tick', u); } requestAnimationFrame(step); }
          else { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); play(coins ? 'jar' : 'countDone'); setTimeout(next, G.countSkip ? 0 : GAP); } };
        requestAnimationFrame(step);
      };
      setTimeout(next, 150);
    }
    G.store = store; G.card = card; G.start = start;
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); if (G.state === 'play' && game.down) game.down(...pos(e), e.pointerId); });
    cv.addEventListener('pointermove', e => { if (G.state === 'play' && game.move) game.move(...pos(e), e.pointerId, e.buttons || e.pointerType === 'touch'); });
    const up = e => { if (G.state === 'play' && game.up) game.up(...pos(e), e.pointerId); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    window.addEventListener('keydown', e => { if (G.state === 'play' && game.key) { if (game.key(e.code, true, e) !== false) { if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); } } else if ((G.state === 'menu' || G.state === 'over') && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); const f = ui.querySelector('.go'); if (f) start(f.dataset.go); } });
    window.addEventListener('keyup', e => { if (G.state === 'play' && game.key) game.key(e.code, false, e); });
    /* coins: every game says how its run turns into coins (game.coins). Milestone bonus = only the highest milestone reached. */
    const BONUS = [10, 25, 50];
    function payout() {
      const R = game.coins; if (!R) return { total: 0 };
      if (R.custom) return R.custom(G);
      const base = Math.max(0, Math.floor(R.base(G))), m = R.metric ? R.metric(G) : G.score; let tier = -1;
      (R.tiers || []).forEach((t, i) => { if (m >= t) tier = i; });
      const bonus = tier >= 0 ? BONUS[tier] : 0, next = R.tiers && tier < R.tiers.length - 1 ? { at: R.tiers[tier + 1], add: BONUS[tier + 1] } : null;
      return { base, bonus, tier, next, total: base + bonus, rule: R.from || R.rule, unit: R.unit || 'points', m };
    }
    const fmt = n => Math.round(n).toLocaleString('en-US'), mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const coinIco = '<i class="ci" aria-hidden="true"></i>';
    function rewardLine() { const R = game.coins; if (!R) return ''; if (R.menu) return `<p class="rw">${coinIco}${R.menu}</p>`; return `<p class="rw">${coinIco}Coins: ${R.rule}${R.tiers ? `<br><span>Bonus +${BONUS.join(' / +')} at ${R.tiers.map(fmt).join(' / ')} ${R.unit || 'points'}</span>` : ''}</p>`; }
    function payHTML(p) {
      if (!game.coins) return '';
      if (p.html) return p.html + walletHTML();
      return `<div class="pay"><p class="pay-big">${coinIco}+<span data-count="${p.total}" data-kind="coins">${fmt(p.total)}</span> coins</p><p class="pay-sm">in ${mmss(G.t)} of play</p><p class="pay-sm">${fmt(p.base)} from ${p.rule}${p.bonus ? ` · <b>+${p.bonus} bonus</b> (${fmt(game.coins.tiers[p.tier])} ${p.unit})` : ''}</p>${p.next ? `<p class="pay-sm">Next bonus: <b>+${p.next.add}</b> at ${fmt(p.next.at)} ${p.unit}</p>` : '<p class="pay-sm">Top bonus reached!</p>'}</div>` + walletHTML();
    }
    const walletHTML = () => `<p class="wallet">Coin jar: <b data-count="${store.get('wallet')}" data-from="${G.jarFrom ?? store.get('wallet')}" data-kind="coins">${fmt(store.get('wallet'))}</b> · Mystery Box 200 · Family 500 · Golden 1,000</p>`;
    function start(arg) {
      G.arg = arg; G.revived = false;
      getAc(); if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } else if (ac.state === 'suspended') ac.resume();
      if (window.SQS) { SQS.duck(false); SQS.music(game.music === false ? null : TRACK[game.id] || null); }
      G.score = 0; G.t = 0; G.fx = []; G.state = 'play'; ui.innerHTML = ''; game.init(G); sfx(660, .12, 'sine', .1, 1.5);
    }
    function card(html) {
      ui.innerHTML = `<div class="card">${html}</div>`;
      ui.querySelectorAll('.go:not([data-act]),[data-go]').forEach(b => b.addEventListener('click', () => start(b.dataset.go)));
      ui.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => game.act && game.act(b.dataset.act, G)));
      const f = ui.querySelector('.go'); if (f) f.focus({ preventScroll: true });
    }
    G.menu = () => { G.state = 'menu'; showMenu(); };
    function showMenu() { if (game.menu) return card(game.menu(G, rewardLine())); card(`<p class="eyebrow">Squishy Island minigame</p><h1>${game.title}</h1><p class="sub">${game.where}</p><ul>${game.how.map(h => `<li>${h}</li>`).join('')}</ul>${rewardLine()}${G.best ? `<p class="best">Your best: <b>${G.best.toLocaleString('en-US')}</b></p>` : ''}<button class="go" type="button">Play</button><p class="keys">${game.keys || ''}</p>`); }
    function showOver(nb, pay) { if (game.over) return card(game.over(G, payHTML(pay))); card(`<p class="eyebrow">${game.overTitle ? game.overTitle(G) : 'Game over'}</p><h1 data-count="${G.score}">${G.score.toLocaleString('en-US')}</h1><p class="sub">${game.scoreName || 'points'}${game.overLine ? ' · ' + game.overLine(G) : ''}</p>${game.overExtra ? game.overExtra(G) : ''}${nb ? '<p class="nb">New best score!</p>' : `<p class="best">Best: <b>${G.best.toLocaleString('en-US')}</b></p>`}${payHTML(pay)}<button class="go" type="button">Play again</button>`); }
    let paused = false;
    document.addEventListener('visibilitychange', () => { paused = document.hidden; last = performance.now(); });
    let last = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      const cap = window.SQS ? SQS.fps() : 60; if (cap < 60 && now - last < 1000 / cap - 4) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; if (paused) return;
      if (G.state === 'play') { G.t += dt; game.update(dt, G); }
      G.fx.forEach(f => { f.life -= dt * (f.k === 'txt' ? .9 : 1.4); if (f.k === 'dot') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 420 * dt; } else f.y -= 38 * dt; });
      G.fx = G.fx.filter(f => f.life > 0); G.shakeT = Math.max(0, G.shakeT - dt);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      if (G.shakeT > 0) ctx.translate((Math.random() - .5) * 8 * G.shakeT * 4, (Math.random() - .5) * 8 * G.shakeT * 4);
      ctx.clearRect(-20, -20, W + 40, H + 40); game.draw(ctx, G);
      G.fx.forEach(f => { ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.6)); if (f.k === 'dot') D.circle(ctx, f.x, f.y, f.r, f.col, null, 0); else D.text(ctx, f.t, f.x, f.y, f.size, f.col, 'center', 'display', D.INK, 4); ctx.globalAlpha = 1; });
    }
    if (game.boot) game.boot(G);
    if (window.SQS) { SQS.music(game.music === false ? null : TRACK[game.id] || null); SQS.onChange(() => fit()); }
    ui.addEventListener('pointerdown', () => { if (G.counting) G.countSkip = true; }, true);
    ui.addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled) play(b.classList.contains('go') ? 'open' : 'tap'); });
    game.init(G); showMenu(); tourHello(); requestAnimationFrame(frame);
    return G;
  }
  /* ---------- level-based games: saved progress, level picker, star results ---------- */
  function levels(id) {
    const key = 'squishyisland-' + id + '-levels'; let d = { top: 1, stars: {} };
    try { const v = JSON.parse(localStorage.getItem(key)); if (v && v.top) d = v; } catch (e) {}
    const save = () => { try { localStorage.setItem(key, JSON.stringify(d)); } catch (e) {} };
    return {
      get top() { return d.top; }, stars: n => d.stars[n] || 0, total: () => Object.values(d.stars).reduce((a, b) => a + b, 0),
      // coins: first clear 30 + 15 per star (every 10th level pays double); replays pay 10 + 15 per NEW star
      finish(n, stars) { const prev = d.stars[n] || 0, first = !prev, big = n % 10 === 0; if (stars > prev) d.stars[n] = stars; if (n >= d.top) d.top = n + 1; save(); return { first, prev, big, coins: first ? (30 + 15 * stars) * (big ? 2 : 1) : 10 + 15 * Math.max(0, stars - prev) }; }
    };
  }
  const starRow = (n, big) => `<span class="${big ? 'stars big' : 'stars'}">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
  function levelMenu(game, L, rw) {
    const top = L.top, from = Math.max(1, top - 13), btns = [];
    for (let n = from; n <= top + 2; n++) btns.push(n <= top ? `<button type="button" class="lv${n === top ? ' cur' : ''}${n % 10 === 0 ? ' boss' : ''}" data-go="${n}" aria-label="Level ${n}">${n}${starRow(L.stars(n))}</button>` : `<button type="button" class="lv lock" disabled aria-label="Level ${n} locked">${n}</button>`);
    return `<p class="eyebrow">Squishy Island minigame</p><h1>${game.title}</h1><p class="sub">${game.where}</p><details class="how"${top === 1 ? ' open' : ''}><summary>How to play</summary><ul>${game.how.map(h => `<li>${h}</li>`).join('')}</ul>${rw}</details><p class="best">Stars collected: <b>${L.total()}</b></p><button class="go" type="button" data-go="${top}">Play level ${top}</button><div class="lvgrid">${btns.join('')}</div><p class="keys">${game.keys || ''}</p>`;
  }
  function levelPay(L, r) {
    if (!r.win) return { total: 0, html: '<div class="pay"><p class="pay-sm">No coins this time. Beat the level to earn coins!</p></div>' };
    const f = L.finish(r.n, r.stars); Object.assign(r, f);
    const k = Math.max(0, r.stars - f.prev), why = f.first ? `first clear: 30 + 15 per star${f.big ? ' · big level ×2' : ''}` : k ? `replay: 10 + 15 for ${k} new star${k > 1 ? 's' : ''}` : 'replay: 10 coins (get more stars for more)';
    return { total: f.coins, html: `<div class="pay"><p class="pay-big"><i class="ci" aria-hidden="true"></i>+<span data-count="${f.coins}" data-kind="coins">${f.coins}</span> coins</p><p class="pay-sm">${why}</p></div>` };
  }
  function levelOver(r, pay) {
    return `<p class="eyebrow">Level ${r.n}${r.n % 10 === 0 ? ' · big level' : ''}</p><h1>${r.win ? 'Level clear!' : r.title || 'Out of moves'}</h1>${r.win ? starRow(r.stars, true) : ''}<p class="sub">${r.line || ''}</p>${r.win && r.stars > r.prev && !r.first ? '<p class="nb">New best stars!</p>' : ''}${pay}<div class="btnrow">${r.win ? `<button class="go" type="button" data-go="${r.n + 1}">Next level</button>` : `<button class="go" type="button" data-go="${r.n}">Try again</button>`}</div><div class="btnrow">${r.win ? `<button class="ghost" type="button" data-go="${r.n}">Replay</button>` : ''}<button class="ghost" type="button" data-act="menu">All levels</button></div>`;
  }
  // tiny seeded random, so level N is always the same level for everyone
  function rng(seed) { let a = seed >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  return { run, IMG, D, W, H, store, levels, levelMenu, levelPay, levelOver, starRow, rng };
})();
