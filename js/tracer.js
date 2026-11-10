// Pipeline de vectorisation client-side (ImageTracerJS chargé via CDN)
export function loadToCanvas(file, max = 512) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src); res(c);
    };
    img.onerror = () => rej(new Error('Image illisible'));
    img.src = URL.createObjectURL(file);
  });
}
// Suppression de fond : couleur des 4 coins comme référence, flood fill par seuil.
export function removeBackground(canvas, tol) {
  const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
  const ctx = c.getContext('2d'); ctx.drawImage(canvas, 0, 0);
  const { width: w, height: h } = c, d = ctx.getImageData(0, 0, w, h), p = d.data;
  const px = (x, y) => (y * w + x) * 4;
  const ref = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].map(([x, y]) => p.slice(px(x, y), px(x, y) + 3));
  const near = i => ref.some(r => Math.hypot(p[i] - r[0], p[i + 1] - r[1], p[i + 2] - r[2]) < tol);
  const seen = new Uint8Array(w * h), st = [];
  for (let x = 0; x < w; x++) st.push(x, x + (h - 1) * w);
  for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
  while (st.length) {
    const n = st.pop(); if (seen[n]) continue; seen[n] = 1;
    const i = n * 4; if (!near(i)) continue;
    p[i + 3] = 0; const x = n % w, y = (n / w) | 0;
    if (x > 0) st.push(n - 1); if (x < w - 1) st.push(n + 1);
    if (y > 0) st.push(n - w); if (y < h - 1) st.push(n + w);
  }
  ctx.putImageData(d, 0, 0); return c;
}
export function trace(canvas, colors = 14) {
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return ImageTracer.imagedataToSVG(data, {
    numberofcolors: colors, colorsampling: 2, ltres: 1, qtres: 1, pathomit: 12,
    blurradius: 1, blurdelta: 20, viewbox: true, desc: false, roundcoords: 1
  });
}
