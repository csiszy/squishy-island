const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
/* Squeak Beat for the real game: renders each track's backing band and every melody note the tracks use with the
   prototype's own synthesiser (docs/design-book/play/squeak-beat.html), and writes the note charts.
   Needs ffmpeg.  Run: node tools/render_squeak_beat.js   (one track: ... render_squeak_beat.js 3, only the charts: ... charts, only the notes: ... notes)
   Writes game/minigames/squeak_beat/charts.json, songs/track_NN.ogg, notes/<tone>_<pitch>[_hold].ogg */
const ROOT = path.join(__dirname, '..'), GAME = path.join(ROOT, 'game', 'minigames', 'squeak_beat');
const TMP = path.join(ROOT, 'build', 'squeak_raw'); fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(path.join(GAME, 'songs'), { recursive: true }); fs.mkdirSync(path.join(GAME, 'notes'), { recursive: true });
const LEAD = 0.4, HOLD = 5;   // song time 0 is LEAD s into each song file; held notes last HOLD s (the game fades them out)
// mono Ogg; the songs at 32 kHz and quality 0 (about 13 MB for all 30), the notes a little better (quality 1)
const ogg = (wav, out, q, rate = 44100) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-ar', String(rate), '-c:a', 'libvorbis', '-q:a', String(q), out]);
(async () => {
  const arg = process.argv[2], chartsOnly = arg === 'charts', notesOnly = arg === 'notes', only = arg != null && !chartsOnly && !notesOnly ? +arg - 1 : null;
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/fonts.g*/**', r => r.abort());
  await p.goto('file://' + path.join(ROOT, 'docs', 'design-book', 'play', 'squeak-beat.html')); await p.waitForTimeout(500);
  const toB64 = `async blob => { const a = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < a.length; i += 32768) s += String.fromCharCode.apply(null, a.subarray(i, i + 32768)); return btoa(s); }`;
  // the charts: everything the game needs to know about each track
  const charts = await p.evaluate(LEAD => [...Array(SQV.api.NT).keys()].map(i => {
    const K = SQV.api.track(i), r3 = x => Math.round(x * 1000) / 1000;
    return { title: `squeak_beat.track.${i + 1}`, tags: [`squeak_beat.diff.${K.diff.toLowerCase()}`, `squeak_beat.band.${K.band.tone}`], name: K.name, diff: K.diff, bpm: K.bpm, spb: r3(K.spb), len: r3(K.len), travel: r3(K.travel), style: K.style, band: K.band.name, tone: K.band.tone, sq: K.band.sq,
      lead: LEAD, acc_max: K.accMax, max: K.max,
      tiles: K.tiles.map(t => [r3(t.t), t.lane, r3(t.hold), t.semi + K.key, t.pair === true ? 1 : 0]) };
  }), LEAD);
  fs.writeFileSync(path.join(GAME, 'charts.json'), JSON.stringify({ about: 'Made by tools/render_squeak_beat.js from the Squeak Beat prototype. tiles: [time s, column, hold s, pitch (semitones from C4), second of a pair]', tracks: charts }));
  const want = new Set(); charts.forEach(c => c.tiles.forEach(t => want.add(`${c.tone}_${t[3]}${t[2] > 0 ? '_hold' : ''}`)));
  console.log(`${charts.length} tracks, ${want.size} notes`);
  for (let i = 0; i < charts.length; i++) {
    if (chartsOnly || notesOnly || (only != null && i !== only)) continue;
    const b64 = await p.evaluate(async ([i, lead, f]) => (eval(f))(SQS.wav(await SQV.api.renderBacking(i, lead))), [i, LEAD, toB64]);
    const wav = path.join(TMP, `track_${i + 1}.wav`); fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
    ogg(wav, path.join(GAME, 'songs', `track_${String(i + 1).padStart(2, '0')}.ogg`), 0, 32000);
    process.stdout.write(`track ${i + 1} `);
  }
  if (only == null && !chartsOnly) for (const n of want) {
    const [tone, semi, hold] = n.split('_');
    const b64 = await p.evaluate(async ([tone, semi, hold, f]) => (eval(f))(SQS.wav(await SQV.api.renderNote(tone, semi, hold))), [tone, +semi, hold ? HOLD : 0, toB64]);
    const wav = path.join(TMP, n + '.wav'); fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
    ogg(wav, path.join(GAME, 'notes', n + '.ogg'), 1, 32000);
  }
  console.log('\nerrors:', errs); await b.close();
})();
