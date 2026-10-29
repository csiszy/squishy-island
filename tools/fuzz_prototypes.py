"""Smoke test: opens every minigame prototype and hammers it with random taps, drags and keys for ~15 s,
then reports any JavaScript error.  Needs playwright.  Run: python3 tools/fuzz_prototypes.py"""
import random, os
from playwright.sync_api import sync_playwright
PLAY = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs', 'design-book', 'play'))
G = ['bistro-rush', 'sky-bounce', 'lost-and-found', 'style-studio', 'bucket-brigade', 'sort-a-lot', 'squeak-beat', 'grow-grow-garden', 'squish-lab', 'squish-breaker']
with sync_playwright() as p:
    b = p.chromium.launch(); bad = 0
    for gid in G:
        pg = b.new_page(viewport={'width': 1280, 'height': 800}); msgs = []
        pg.on('pageerror', lambda e: msgs.append(str(e))); pg.route('**/fonts.g*/**', lambda r: r.abort())
        pg.goto('file://' + os.path.join(PLAY, gid + '.html')); pg.wait_for_timeout(500); pg.click('.go')
        box = pg.locator('canvas').bounding_box()
        for i in range(160):
            x = box['x'] + random.random() * box['width']; y = box['y'] + random.random() * box['height']; r = random.random()
            if r < .6: pg.mouse.click(x, y)
            elif r < .8: pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + random.uniform(-80, 80), y + random.uniform(-50, 250), steps=4); pg.mouse.up()
            else: pg.keyboard.press(random.choice(['Digit1', 'Digit2', 'Digit3', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'ArrowLeft', 'ArrowRight', 'Enter']))
            pg.wait_for_timeout(random.randint(20, 120))
        print(gid, pg.evaluate('SQV.G.state'), ' | '.join(msgs) or 'ok'); bad += bool(msgs); pg.close()
    b.close(); raise SystemExit(1 if bad else 0)
