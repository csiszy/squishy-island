/* Design book -> game/data: every number and every player-facing word the game needs, as plain files.
     node tools/export_data/export_data.js           write game/data/*.json and game/data/strings_en.csv
     node tools/export_data/export_data.js --check   only compare; exit 1 if game/data is out of date (CI runs this)
   Where things come from: docs/design-book/_tools/export.html (which reads the art/*.js files, the building pages,
   the CITY block in index.html and art/economy.js), plus docs/strings_ui_en.csv for words that are not on a
   design-book page yet (buttons, messages). Never edit game/data by hand: change the book and run this again. */
const fs = require('fs'), path = require('path');
const { ROOT, runPage } = require('../lib/book');

const OUT = path.join(ROOT, 'game', 'data');
const UI_STRINGS = path.join(ROOT, 'docs', 'strings_ui_en.csv');
const check = process.argv.includes('--check');

/* minimal CSV (RFC 4180): fields with a comma, quote or newline are quoted, quotes doubled */
function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => x !== ''));
}
const cell = s => /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
const json = v => JSON.stringify(v, null, 1) + '\n';

(async () => {
  const out = await runPage('_tools/export.html');
  if (out.problems.length) { console.error('The design book disagrees with itself:\n  ' + out.problems.join('\n  ')); process.exit(1); }

  const strings = Object.assign({}, out.strings);
  const ui = parseCsv(fs.readFileSync(UI_STRINGS, 'utf8'));
  if (ui[0][0] !== 'keys' || ui[0][1] !== 'en') throw new Error(`${UI_STRINGS}: first row must be "keys,en"`);
  for (const [key, en] of ui.slice(1)) {
    if (key.startsWith('#')) continue;
    if (strings[key] !== undefined) throw new Error(`${UI_STRINGS}: key ${key} is already taken by the design book`);
    strings[key] = en;
  }
  const files = {};
  for (const [name, data] of Object.entries(out.files)) files[name] = json(data);
  files['strings_en.csv'] = 'keys,en\n' + Object.keys(strings).sort().map(k => cell(k) + ',' + cell(strings[k])).join('\n') + '\n';

  let stale = [];
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, text] of Object.entries(files)) {
    const file = path.join(OUT, name), old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (old === text) continue;
    stale.push(name);
    if (!check) fs.writeFileSync(file, text);
  }
  const summary = `${Object.keys(strings).length} strings, ${out.files['squishies.json'].squishies.length} squishies, ${out.files['buildings.json'].buildings.length} buildings`;
  if (check) {
    if (stale.length) { console.error(`game/data is out of date with the design book: ${stale.join(', ')}\nRun: node tools/export_data/export_data.js`); process.exit(1); }
    console.log('game/data is up to date (' + summary + ')');
  } else console.log((stale.length ? 'wrote ' + stale.join(', ') : 'nothing changed') + ' (' + summary + ')');
})().catch(e => { console.error(e.message || e); process.exit(1); });
