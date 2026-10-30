/* Sound pack -> game/audio. Copies assets/audio/sfx/*.wav and assets/audio/music/*.ogg into the Godot project and
   checks that every sound named in game/data/audio.json has a file (and every file is named there).
     node tools/export_audio/export_audio.js           copy
     node tools/export_audio/export_audio.js --check   only compare; exit 1 if game/audio is out of date (CI runs this)
   To change a sound, change art/sound.js in the design book, then re-render the pack:
     node tools/render_audio.js && python3 tools/process_audio.py   (see CLAUDE.md), then run this script.
   Hand-made replacements: drop a file with the same name into assets/audio/ and run this script. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'assets', 'audio'), DST = path.join(ROOT, 'game', 'audio');
const check = process.argv.includes('--check');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'game', 'data', 'audio.json'), 'utf8'));
const want = { sfx: ['.wav', catalog.sfx.map(x => x.id)], music: ['.ogg', catalog.music.map(x => x.id)] };
const problems = [], stale = [];
for (const [dir, [ext, ids]] of Object.entries(want)) {
  const have = fs.readdirSync(path.join(SRC, dir)).filter(f => f.endsWith(ext)).map(f => f.slice(0, -ext.length));
  ids.filter(id => !have.includes(id)).forEach(id => problems.push(`assets/audio/${dir}/${id}${ext} is missing`));
  have.filter(id => !ids.includes(id)).forEach(id => problems.push(`assets/audio/${dir}/${id}${ext} is not in the sound list (art/sound.js)`));
  fs.mkdirSync(path.join(DST, dir), { recursive: true });
  for (const id of have) {
    const a = path.join(SRC, dir, id + ext), b = path.join(DST, dir, id + ext);
    if (fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b))) continue;
    stale.push(`${dir}/${id}${ext}`); if (!check) fs.copyFileSync(a, b);
  }
  for (const f of fs.readdirSync(path.join(DST, dir)).filter(f => f.endsWith(ext))) {
    if (have.includes(f.slice(0, -ext.length))) continue;
    stale.push(`${dir}/${f} (extra)`);
    if (!check) { fs.rmSync(path.join(DST, dir, f)); fs.rmSync(path.join(DST, dir, f + '.import'), { force: true }); }
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
if (check && stale.length) { console.error('game/audio is out of date: ' + stale.join(', ') + '\nRun: node tools/export_audio/export_audio.js'); process.exit(1); }
console.log(check ? 'game/audio is up to date' : (stale.length ? `copied ${stale.length} files` : 'nothing changed'));
