import { loadToCanvas, removeBackground, trace } from './tracer.js';
import { analyze } from './gemini.js';
import { mount, timeline, sanitizeSvg } from './animator.js';
const $ = id => document.getElementById(id);
const S = { src: null, canvas: null, svg: '', gsap: '', tab: 'gsap' };
const status = (m, err) => { $('status').textContent = m; $('status').style.color = err ? '#e5826b' : ''; };
$('apiKey').value = localStorage.getItem('gemini_key') || '';
$('model').value = localStorage.getItem('gemini_model') || 'gemini-2.0-flash';
$('apiKey').onchange = e => localStorage.setItem('gemini_key', e.target.value.trim());
$('model').onchange = e => localStorage.setItem('gemini_model', e.target.value);

async function setFile(f) {
  if (!f) return;
  try { S.src = await loadToCanvas(f); render(); $('traceBtn').disabled = false; }
  catch (e) { status(e.message, true); }
}
function render() {
  if (!S.src) return;
  S.canvas = $('rmbg').checked ? removeBackground(S.src, +$('tol').value) : S.src;
  const img = new Image(); img.src = S.canvas.toDataURL('image/png');
  $('rasterBox').replaceChildren(img);
}
$('file').onchange = e => setFile(e.target.files[0]);
const drop = $('drop');
['dragover', 'dragenter'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => setFile(e.dataTransfer.files[0]));
drop.addEventListener('keydown', e => { if (e.key === 'Enter') $('file').click(); });
$('rmbg').onchange = $('tol').onchange = render;

$('traceBtn').onclick = () => {
  S.svg = trace(S.canvas, +$('colors').value);
  $('svgBox').innerHTML = sanitizeSvg(S.svg);
  $('aiBtn').disabled = false; status(`SVG : ${(S.svg.length / 1024).toFixed(0)} Ko`);
};
$('aiBtn').onclick = async () => {
  $('aiBtn').disabled = true;
  try {
    const r = await analyze({ key: $('apiKey').value.trim(), model: $('model').value,
      imageDataUrl: S.canvas.toDataURL('image/png'), svg: S.svg, onStatus: status });
    S.svg = r.svg_structured; S.gsap = r.gsap_code; show(); run(); status('Animation prête');
  } catch (e) { status(e.message, true); }
  $('aiBtn').disabled = false;
};
function show() { $('code').value = S.tab === 'gsap' ? S.gsap : S.svg; }
function run() {
  try { const tl = mount($('stage'), S.svg, S.gsap); tl?.timeScale(+$('speed').value); $('play').textContent = 'Pause'; }
  catch (e) { status(e.message, true); }
}
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  S[S.tab] = $('code').value; S.tab = b.dataset.t;
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); show();
});
$('apply').onclick = () => { S[S.tab] = $('code').value; run(); };
$('play').onclick = () => { const t = timeline(); if (!t) return; t.paused(!t.paused()); $('play').textContent = t.paused() ? 'Lecture' : 'Pause'; };
$('reset').onclick = () => timeline()?.restart();
$('speed').oninput = e => timeline()?.timeScale(+e.target.value);

const dl = (name, text, type) => { const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); };
$('exportSvg').onclick = () => S.svg && dl('animation.svg', sanitizeSvg(S.svg), 'image/svg+xml');
$('exportHtml').onclick = () => S.svg && dl('animation.html',
`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Animation</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"><\/script></head>
<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#0d1220">
<div id="root" style="width:min(90vw,600px)">${sanitizeSvg(S.svg)}</div>
<script>const root=document.getElementById('root'),svg=root.querySelector('svg');
(function(gsap,svg,root){${S.gsap}\n})(gsap,svg,root);<\/script></body></html>`, 'text/html');

$('sampleBtn').onclick = async () => {
  const b = await (await fetch('assets/sample.png')).blob();
  setFile(new File([b], 'sample.png', { type: 'image/png' }));
};
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
