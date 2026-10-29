/* Shared helpers for the export tools: serve the design book on a local port and open a page in headless Chromium.
   Needs Node 18+ and Playwright (npm i -D playwright, or the copy that comes with the dev container). */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..');
const THREE_DIR = path.join(__dirname, '..', 'node_modules', 'three');
const BOOK = path.join(ROOT, 'docs', 'design-book');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

function serve(dir = BOOK) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const vendor = rel.startsWith('_vendor/three/');   // the pinned three.js package (for its ES modules, e.g. GLTFExporter)
      const base = vendor ? THREE_DIR : dir, file = path.join(base, vendor ? rel.slice('_vendor/three/'.length) : (rel || 'index.html'));
      if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}/` }));
  });
}

/* three.js comes from tools/node_modules (npm install in tools/), pinned to the version the book asks for. */
async function serveThree(route) {
  const m = new URL(route.request().url()).pathname.match(/\/npm\/three@([^/]+)\/(.+)$/);
  const want = m && m[1], have = require(path.join(THREE_DIR, 'package.json')).version;
  if (!m || want !== have) throw new Error(`The book wants three@${want}, tools/package.json has ${have}`);
  await route.fulfill({ path: path.join(THREE_DIR, m[2]) });
}

/* Opens a design-book page, waits until it sets document.title to 'done' (or 'ERR ...'), returns window.__out,
   or, with work(page, out, errors), whatever work returns (the page stays open while it runs). */
async function runPage(rel, { timeout = 600000, gl = false, onPage, work } = {}) {
  const { srv, url } = await serve();
  const args = gl ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [];
  const browser = await chromium.launch({ args });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(timeout);
    await page.route('**/fonts.g*/**', r => r.abort());   // fonts are not needed and may be offline
    await page.route('**/npm/three@*/**', serveThree);     // the book loads three.js from a CDN; use the pinned local copy
    if (onPage) await onPage(page);
    await page.goto(url + rel);
    await page.waitForFunction(() => document.title === 'done' || document.title.startsWith('ERR'), null, { timeout });
    const title = await page.title();
    if (title !== 'done') throw new Error(`${rel}: ${title}`);
    if (errors.length) throw new Error(`${rel}: page errors:\n  ${errors.join('\n  ')}`);
    const out = await page.evaluate(() => window.__out);
    return work ? await work(page, out, errors) : out;
  } finally { await browser.close(); srv.close(); }
}

module.exports = { ROOT, BOOK, THREE_DIR, serve, runPage };
