const { chromium } = require('playwright'); const fs = require('fs');
/* Renders every sound effect and one loop of every song from docs/design-book/art/sound.js to raw WAV files.
   1) serve the book:  cd docs/design-book && python3 -m http.server 8765
   2) node tools/render_audio.js      3) python3 tools/process_audio.py   (trims, normalises, makes seamless Ogg loops) */
const path = require('path');
const OUT = path.join(__dirname, '..', 'build', 'audio_raw') + path.sep; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/fonts.g*/**', r => r.abort());
  await p.goto('http://localhost:8765/sound.html'); await p.waitForTimeout(500);
  const toB64 = `async blob => { const a = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < a.length; i += 32768) s += String.fromCharCode.apply(null, a.subarray(i, i + 32768)); return btoa(s); }`;
  const fx = await p.evaluate(() => SQS.SFX_LIST.map(x => x.id));
  for (const id of fx) {
    const b64 = await p.evaluate(async ([id, f]) => { const buf = await SQS.renderFX(id, id === 'wind' ? 3.6 : id === 'revealL' || id === 'thunder' ? 3 : 2.2); return (eval(f))(SQS.wav(buf)); }, [id, toB64]);
    fs.writeFileSync(OUT + 'sfx_' + id + '.wav', Buffer.from(b64, 'base64'));
  }
  const tr = await p.evaluate(() => Object.keys(SQS.TRACKS));
  const meta = {};
  for (const id of tr) {
    const r = await p.evaluate(async ([id, f]) => { const { buf, loopEnd } = await SQS.renderTrack(id); return { loopEnd, sr: buf.sampleRate, b64: await (eval(f))(SQS.wav(buf)) }; }, [id, toB64]);
    fs.writeFileSync(OUT + 'music_' + id + '.wav', Buffer.from(r.b64, 'base64')); meta[id] = { loopEnd: r.loopEnd, name: (await p.evaluate(i => SQS.TRACKS[i].name, id)) };
  }
  fs.writeFileSync(OUT + 'meta.json', JSON.stringify(meta));
  console.log(fx.length, tr.length, errs); await b.close();
})();
