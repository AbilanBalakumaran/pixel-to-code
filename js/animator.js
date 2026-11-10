// Injection du SVG nettoyé + exécution du code GSAP dans un scope restreint
export function sanitizeSvg(src) {
  const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
  const svg = doc.documentElement;
  if (doc.querySelector('parsererror') || svg.tagName.toLowerCase() !== 'svg') throw new Error('SVG invalide');
  svg.querySelectorAll('script,foreignObject,iframe,object,embed').forEach(n => n.remove());
  svg.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => {
    if (/^on/i.test(a.name) || /javascript:/i.test(a.value)) n.removeAttribute(a.name);
  }));
  return new XMLSerializer().serializeToString(svg);
}
let tl = null;
export const timeline = () => tl;
export function mount(stage, svgSrc, gsapCode) {
  tl?.kill(); gsap.globalTimeline.clear();
  stage.innerHTML = sanitizeSvg(svgSrc);
  const svg = stage.querySelector('svg');
  svg.removeAttribute('width'); svg.removeAttribute('height');
  if (!gsapCode.trim()) return null;
  try {
    tl = new Function('gsap', 'svg', 'root', `"use strict";\n${gsapCode}`)(gsap, svg, stage) || null;
  } catch (e) { throw new Error('Erreur GSAP : ' + e.message); }
  return tl;
}
