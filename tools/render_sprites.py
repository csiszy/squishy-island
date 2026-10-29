"""Re-renders prototypes/sprites.json (squishy portraits used by the minigame prototypes) from the design book.
Needs: pip install playwright && playwright install chromium.  Run: python3 tools/render_sprites.py
Then rebuild the prototypes: python3 prototypes/build.py"""
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
srv = subprocess.Popen(['python3', '-m', 'http.server', '8766'], cwd=os.path.join(ROOT, 'docs', 'design-book'), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = b.new_page(); pg.set_default_timeout(300000)
        pg.goto('http://localhost:8766/_tools/sprites.html'); pg.wait_for_function("document.title==='done'||document.title.startsWith('ERR')")
        out = pg.evaluate('window.__out'); b.close()
    json.dump(out, open(os.path.join(ROOT, 'prototypes', 'sprites.json'), 'w'))
    print(len(out), 'sprites')
finally:
    srv.terminate()
