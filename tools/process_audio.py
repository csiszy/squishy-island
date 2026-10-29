"""Turns build/audio_raw (from tools/render_audio.js) into the shipped sound pack in assets/audio:
sfx/*.wav  trimmed, peak -3 dBFS  ·  music/*.ogg  one seamless loop each (reverb tail folded onto the start), peak -1.5 dBFS.
Needs numpy, scipy and ffmpeg.  Run: python3 tools/process_audio.py"""
import numpy as np, json, glob, os, subprocess
from scipy.io import wavfile
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
R = os.path.join(ROOT, 'build', 'audio_raw'); O = os.path.join(ROOT, 'assets', 'audio')
os.makedirs(os.path.join(O, 'sfx'), exist_ok=True); os.makedirs(os.path.join(O, 'music'), exist_ok=True)
meta = json.load(open(os.path.join(R, 'meta.json')))
for f in sorted(glob.glob(os.path.join(R, 'sfx_*.wav'))):
    sr, x = wavfile.read(f); x = x.astype(np.float32) / 32768
    a = np.abs(x).max(axis=1); idx = np.where(a > 10 ** (-60 / 20))[0]
    if len(idx) == 0: print('SILENT', f); continue
    y = x[max(0, idx[0] - int(.002 * sr)):min(len(x), idx[-1] + int(.05 * sr))]
    y = y / np.abs(y).max() * 10 ** (-3 / 20)
    wavfile.write(os.path.join(O, 'sfx', os.path.basename(f)[4:]), sr, (y * 32767).astype(np.int16))
for f in sorted(glob.glob(os.path.join(R, 'music_*.wav'))):
    tid = os.path.basename(f)[6:-4]; sr, x = wavfile.read(f); x = x.astype(np.float32) / 32768
    s, e = int(.05 * sr), int(meta[tid]['loopEnd'] * sr); loop = x[s:e].copy(); tail = x[e:]
    n = min(len(tail), len(loop)); loop[:n] += tail[:n]
    loop = loop / np.abs(loop).max() * 10 ** (-1.5 / 20)
    tmp = os.path.join(R, 'tmp.wav'); wavfile.write(tmp, sr, (loop * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-c:a', 'libvorbis', '-q:a', '5', os.path.join(O, 'music', tid + '.ogg')], check=True)
    print(tid, meta[tid]['name'], round(len(loop) / sr, 1), 's')
