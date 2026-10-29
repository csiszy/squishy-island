/* =====================================================================
   SQUISHVILLE SMALL UI PIECES  ·  art/ui.js
   SQU.modal(html)          a pop-up card; returns its element (call .close() to remove)
   SQU.gate(onPass, why)    the grown-up gate: a sum written in words, answered on a number pad
   SQU.ask(text, yes, no)   a friendly "are you sure?" pop-up
   Used by the Settings, Accounts and Factory pages.
   ===================================================================== */
(function () {
'use strict';
const SQU = window.SQU = {};
const css = `
.squ-back{position:fixed;inset:0;z-index:9000;background:rgba(43,33,65,.45);display:grid;place-items:center;padding:16px;animation:squIn .18s ease-out}
.squ-card{width:min(360px,100%);max-height:92vh;overflow:auto;background:#fff;border:3px solid #2B2141;border-radius:24px;box-shadow:6px 6px 0 #2B2141;padding:18px 18px 16px;text-align:center;display:grid;gap:8px;font-family:Nunito,system-ui,sans-serif;color:#2B2141;animation:squPop .25s cubic-bezier(.2,1.5,.4,1)}
.squ-card h3{margin:0;font-family:"Bagel Fat One",system-ui,sans-serif;font-weight:400;font-size:24px;line-height:1.1}
.squ-card p{margin:0;font-weight:700;line-height:1.35}
.squ-card .q{font-size:20px;font-weight:900;color:#9B5CF6}
.squ-ans{font:900 30px/1 Nunito,system-ui,sans-serif;letter-spacing:.2em;min-height:40px;border:2.5px dashed #CFC8E3;border-radius:14px;display:grid;place-items:center}
.squ-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.squ-pad button,.squ-row button{all:unset;box-sizing:border-box;cursor:pointer;text-align:center;font:900 20px/1 Nunito,system-ui,sans-serif;padding:11px 0;border:2.5px solid #2B2141;border-radius:14px;background:#fff;box-shadow:2px 2px 0 #2B2141}
.squ-pad button:active,.squ-row button:active{transform:translate(2px,2px);box-shadow:none}
.squ-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.squ-row button{font-size:17px;padding:10px 18px;border-radius:999px}
.squ-row .yes{background:#FF6FA3;color:#fff}
.squ-pad button:focus-visible,.squ-row button:focus-visible{outline:3px solid #FF6FA3;outline-offset:2px}
.squ-err{color:#E5484D;font-weight:900;min-height:1.2em}
.squ-tag{font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#6E6688}
@keyframes squIn{from{opacity:0}}@keyframes squPop{from{transform:scale(.85);opacity:0}}
@media (prefers-reduced-motion:reduce){.squ-back,.squ-card{animation:none}}`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
const snd = n => { if (window.SQS) SQS.play(n); };

SQU.modal = html => {
  const back = document.createElement('div'); back.className = 'squ-back'; back.innerHTML = `<div class="squ-card" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(back); back.close = () => { back.remove(); }; snd('open');
  back.addEventListener('click', e => { if (e.target === back) { snd('back'); back.close(); } });
  const f = back.querySelector('button'); if (f) f.focus({ preventScroll: true });
  return back;
};

SQU.ask = (text, yes, no, labels = ['Yes', 'No']) => {
  snd('gemAsk');
  const m = SQU.modal(`${text}<div class="squ-row"><button type="button" class="yes">${labels[0]}</button><button type="button" class="no">${labels[1]}</button></div>`);
  m.querySelector('.yes').onclick = () => { m.close(); yes && yes(); };
  m.querySelector('.no').onclick = () => { snd('back'); m.close(); no && no(); };
  return m;
};

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
let lockUntil = 0;
SQU.gate = (onPass, why = 'This part is for grown-ups.') => {
  if (Date.now() < lockUntil) { snd('nope'); const m = SQU.modal(`<p class="squ-tag">Grown-ups only</p><h3>Try again soon</h3><p>Too many wrong answers. Please wait ${Math.ceil((lockUntil - Date.now()) / 1000)} seconds.</p><div class="squ-row"><button type="button">OK</button></div>`); m.querySelector('button').onclick = m.close; return; }
  const a = 6 + Math.floor(Math.random() * 9), b = 5 + Math.floor(Math.random() * 9), add = Math.random() < .6, x = add ? a : a + b, y = b, ans = add ? a + b : a;
  const w = n => n <= 20 ? WORDS[n] : 'twenty-' + WORDS[n - 20], q = add ? `${w(x)} plus ${w(y)}` : `${w(x)} minus ${w(y)}`;
  let typed = '', tries = 0;
  const m = SQU.modal(`<p class="squ-tag">Grown-ups only</p><h3>Ask a grown-up</h3><p>${why}</p><p>Grown-ups: what is</p><p class="q">${q}?</p><div class="squ-ans" aria-live="polite"></div><p class="squ-err"></p><div class="squ-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-n="${n}">${n}</button>`).join('')}<button type="button" data-n="del" aria-label="Delete">&#9003;</button><button type="button" data-n="0">0</button><button type="button" data-n="ok" style="background:#FFD54A">OK</button></div><div class="squ-row"><button type="button" class="no">Cancel</button></div>`);
  const out = m.querySelector('.squ-ans'), err = m.querySelector('.squ-err');
  m.querySelector('.no').onclick = () => { snd('back'); m.close(); };
  m.querySelector('.squ-pad').addEventListener('click', e => { const k = e.target.closest('[data-n]'); if (!k) return; const n = k.dataset.n; snd('tap');
    if (n === 'del') typed = typed.slice(0, -1);
    else if (n === 'ok') { if (+typed === ans) { m.close(); snd('unlock'); onPass && onPass(); return; } tries++; typed = ''; snd('nope'); err.textContent = tries >= 3 ? '' : 'Not quite, try again.'; if (tries >= 3) { lockUntil = Date.now() + 30000; m.close(); SQU.gate(onPass, why); return; } }
    else if (typed.length < 3) typed += n;
    out.textContent = typed; });
};
})();
