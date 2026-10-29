"""Builds every playable minigame prototype into one standalone HTML file:
   docs/design-book/play/<game>.html  =  template.html + art/sound.js + engine.js + games/<game>.js + the sprites it uses.
   Run from anywhere:  python3 prototypes/build.py            (all games)
                       python3 prototypes/build.py sky-bounce (one game)"""
import json, re, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
BOOK = os.path.join(HERE, '..', 'docs', 'design-book')
OUT = os.path.join(BOOK, 'play')
os.makedirs(OUT, exist_ok=True)
rd = lambda *p: open(os.path.join(*p), encoding='utf-8').read()
spr = json.loads(rd(HERE, 'sprites.json')); tpl = rd(HERE, 'template.html'); eng = rd(HERE, 'engine.js'); snd = rd(BOOK, 'art', 'sound.js')
# id: (title, accent colour, background top, background bottom)
GAMES = {'bistro-rush': ('Bistro Rush', '#E5484D', '#FFE3E0', '#FFF1E0'), 'sky-bounce': ('Sky Bounce', '#4A9BFF', '#D9CCFF', '#DFF3FF'),
         'lost-and-found': ('Lost & Found', '#2F5BD3', '#E3EDFF', '#D9F2DF'), 'style-studio': ('Style Studio', '#C7509A', '#FFE3EF', '#F4E8FF'),
         'bucket-brigade': ('Bucket Brigade', '#D93A2B', '#CDEBFF', '#FFE6DA'), 'sort-a-lot': ('Sort-a-Lot', '#3BA7A0', '#FFF7D6', '#DDF5F2'),
         'squeak-beat': ('Squeak Beat', '#7C4DDB', '#2E2452', '#5A3A8C'), 'grow-grow-garden': ('Grow Grow Garden', '#3BA7A0', '#E9FFF6', '#FFF3C4'),
         'squish-lab': ('Squish Lab', '#4A7BD0', '#E8F4FF', '#D8E6F5'), 'squish-breaker': ('Squish Breaker', '#FF7A45', '#2A2350', '#4A2F6E')}
THREE = '<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>\n'
for gid in (sys.argv[1:] or GAMES):
    title, acc, b1, b2 = GAMES[gid]; code = rd(HERE, 'games', gid + '.js')
    used = set(re.findall(r"'([a-z_]+)'", code))
    sub = {k: v for k, v in spr.items() if k in used}
    html = (tpl.replace('%%TITLE%%', title).replace('%%ACCENT%%', acc).replace('%%BG1%%', b1).replace('%%BG2%%', b2)
            .replace('%%SPRITES%%', json.dumps(sub)).replace('%%SOUND%%', snd).replace('%%ENGINE%%', eng).replace('%%GAME%%', code)
            .replace('%%EXTRA%%', THREE if gid == 'squish-lab' else ''))
    open(os.path.join(OUT, gid + '.html'), 'w', encoding='utf-8').write(html)
    print(gid, len(sub), 'sprites', len(html) // 1024, 'KB')
