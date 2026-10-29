"""Fails (exit 1) if any part of the game reaches across a wall it must not cross (build.html, "Architecture").

    python3 tools/check_boundaries.py            check game/
    python3 tools/check_boundaries.py --list     also print the rules

The walls:
  minigames/<game>/     only its own folder, minigame_api/ and minigame_kit/vN/. No autoloads (Save, Audio, ...),
                        no class names from anywhere else. This is what keeps every minigame sealed.
  minigame_api/         only itself (it is the contract; it knows nothing about the game).
  minigame_kit/vN/      itself and minigame_api/.
  core/                 itself and data/, audio/ (services never know about features, the app or minigames).
  features/<feature>/   never another feature's folder, never app/; only minigame_host/ may touch minigames/.
  shared_ui/            core/, data/, art/, audio/ and itself (no features, no app).
How: every res:// path in .gd/.tscn/.tres/.gdshader/.json files is checked, and so is every use of a class_name or
autoload defined behind a wall. addons/ (third-party code) is not checked. Standard library only."""
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'game')
SCANNED = ('.gd', '.tscn', '.tres', '.gdshader', '.gdshaderinc', '.json', '.cfg')
RES_PATH = re.compile(r'res://([A-Za-z0-9_./-]+)')
CLASS_NAME = re.compile(r'^\s*class_name\s+([A-Za-z_]\w*)', re.M)
WORD = re.compile(r'\b[A-Z]\w*\b')
STRING_OR_COMMENT = re.compile(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|#[^\n]*')


def zone(rel):
    """The area a game-relative path belongs to, e.g. 'minigames/sky_bounce', 'features/city', 'core'."""
    parts = rel.replace('\\', '/').split('/')
    if parts[0] in ('minigames', 'features') and len(parts) > 2:
        return parts[0] + '/' + parts[1]
    if parts[0] == 'minigame_kit' and len(parts) > 2:
        return 'minigame_kit/' + parts[1]
    return parts[0] if len(parts) > 1 else ''


def allowed(src, dst):
    """May code in zone `src` use something in zone `dst`?"""
    if dst == src or dst == '':
        return True
    top, dtop = src.split('/')[0], dst.split('/')[0]
    if top == 'minigames':
        return dst == 'minigame_api' or dtop == 'minigame_kit'
    if top == 'minigame_api':
        return False
    if top == 'minigame_kit':
        return dst == 'minigame_api'
    if top == 'core':
        return dst in ('data', 'audio')
    if top == 'shared_ui':
        return dtop in ('core', 'data', 'art', 'audio')
    if top == 'features':
        if dtop == 'features' or dtop == 'app':
            return False
        if dtop == 'minigames':
            return src == 'features/minigame_host'
        return True
    if top == 'tests':
        return True   # whole-game tests may look at anything
    if top == 'app':
        return dtop != 'minigames'
    return True


def autoloads(project_text):
    sec = re.search(r'^\[autoload\]\s*$(.*?)(?=^\[|\Z)', project_text, re.M | re.S)
    out = {}
    for m in re.finditer(r'^(\w+)="\*?res://([^"]+)"', sec.group(1) if sec else '', re.M):
        out[m.group(1)] = zone(m.group(2))
    return out


def scan(root=ROOT):
    files = []
    for dirpath, dirnames, filenames in os.walk(root):
        rel_dir = os.path.relpath(dirpath, root).replace('\\', '/')
        dirnames[:] = [d for d in dirnames if not d.startswith('.') and not (rel_dir == '.' and d in ('addons', 'android', 'build'))]
        for f in filenames:
            if f.endswith(SCANNED) and f != 'project.godot':
                rel = os.path.normpath(os.path.join(rel_dir, f)).replace('\\', '/')
                with open(os.path.join(dirpath, f), encoding='utf-8', errors='replace') as fh:
                    files.append((rel, fh.read()))
    return files


def check(root=ROOT):
    problems = []
    files = scan(root)
    project = os.path.join(root, 'project.godot')
    names = {}
    if os.path.exists(project):
        with open(project, encoding='utf-8') as fh:
            names = autoloads(fh.read())
    for rel, text in files:
        if rel.endswith('.gd'):
            for m in CLASS_NAME.finditer(text):
                names.setdefault(m.group(1), zone(rel))
    for rel, text in files:
        src = zone(rel)
        for m in RES_PATH.finditer(text):
            dst = zone(m.group(1).rstrip('/') + ('/x' if m.group(1).endswith('/') else ''))
            if not allowed(src, dst):
                line = text.count('\n', 0, m.start()) + 1
                problems.append(f'{rel}:{line}: {src} may not use res://{m.group(1)} ({dst})')
        if rel.endswith('.gd'):
            code = STRING_OR_COMMENT.sub('', text)
            own = set(CLASS_NAME.findall(text))
            for word in sorted(set(WORD.findall(code)) - own):
                dst = names.get(word)
                if dst is not None and not allowed(src, dst):
                    problems.append(f'{rel}: {src} may not use {word} (defined in {dst})')
    return problems


def main():
    if '--list' in sys.argv:
        print(__doc__)
    problems = check()
    if problems:
        print('Boundary check failed: a part of the game reaches across a wall (see tools/check_boundaries.py):')
        for p in problems:
            print('  ' + p)
        return 1
    print('Boundary check passed.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
