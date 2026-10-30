/* Design book -> game/art: every building at every level and every squishy as a glTF model, plus squishy portraits.
     node tools/export_art/export_art.js                 everything
     node tools/export_art/export_art.js dumpling bao    only items whose id matches
   Writes game/art/models/buildings/<id>/building_<id>_L07.glb, game/art/models/squishies/squishy_<id>.glb and
   game/art/sprites/squishies/<id>.png, game/art/models/island/island.glb (the map without its buildings),
   game/art/models/life/life_<id>.glb (each squishy's spot and idle loop around its house), game/art/life.json
   (the height of each of those squishies at every house level), plus game/art/art_index.json (sizes, triangles).
   The models are built by the same code as the book's pictures (art/*.js). In Godot the import script
   (game/art/import/toon_import.gd) gives them the toon look, the outline and their idle animations.
   Hand-made art: put a file with the same name in game/art/overrides/ and the game uses that instead. */
const fs = require('fs'), path = require('path');
const { ROOT, runPage } = require('../lib/book');

const OUT = path.join(ROOT, 'game', 'art');
const only = process.argv.slice(2).filter(a => !a.startsWith('--'));

/* triangle and vertex counts straight from the glb's JSON chunk (no extra libraries) */
function stats(buf) {
  const len = buf.readUInt32LE(12), j = JSON.parse(buf.subarray(20, 20 + len).toString('utf8'));
  let tris = 0, meshes = 0;
  (j.meshes || []).forEach(m => m.primitives.forEach(p => { meshes++; const a = j.accessors[p.indices != null ? p.indices : p.attributes.POSITION]; tris += Math.round(a.count / 3); }));
  return { tris, meshes, materials: (j.materials || []).length, images: (j.images || []).length };
}

(async () => {
  const t0 = Date.now();
  const index = await runPage('_tools/export_art.html', {
    gl: true,
    work: async (page) => {
      const items = (await page.evaluate(() => window.EXPORT.list())).filter(it => !only.length || only.includes(it.id));
      const out = [];
      for (const it of items) {
        const r = await page.evaluate(x => window.EXPORT.one(x), it);
        const buf = r.svg ? Buffer.from(r.svg, 'utf8') : Buffer.from(r.glb || r.png, 'base64'), file = path.join(OUT, it.file);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, buf);
        out.push(Object.assign({ file: it.file, kind: it.kind, id: it.id, level: it.level, bytes: buf.length }, r.glb ? stats(buf) : {}));
        process.stdout.write(`\r${out.length}/${items.length} ${it.file.padEnd(60)}`);
      }
      if (!only.length) fs.writeFileSync(path.join(OUT, 'life.json'), JSON.stringify(await page.evaluate(() => window.EXPORT.lifeHeights()), null, 1) + '\n');
      return out;
    }
  });
  process.stdout.write('\n');
  if (!only.length) fs.writeFileSync(path.join(OUT, 'art_index.json'), JSON.stringify({ items: index }, null, 1) + '\n');
  const mb = index.reduce((a, b) => a + b.bytes, 0) / 1e6;
  console.log(`${index.length} files, ${mb.toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})().catch(e => { console.error(e.message || e); process.exit(1); });
