// Client Gemini : fetch natif, réponse JSON stricte
const SYSTEM = `Tu es un expert SVG et GSAP 3.x. Tu reçois une illustration (image) et son SVG vectorisé automatiquement (nombreux <path> sans structure).
Tâches :
1. Identifie les groupes sémantiques (fond, corps/buste, tête, cheveux, yeux, bras, etc.) et regroupe les <path> concernés dans des <g> avec id/class explicites (id="head", id="eye-left", class="limb"). Conserve tous les paths et leurs attributs, ne les redessine pas. Garde le viewBox.
2. Ajoute sur chaque groupe animable style="transform-box:fill-box;transform-origin:..." avec le point d'ancrage anatomique adapté (ex. "center bottom" pour un bras, "center" pour un œil).
3. Écris un script GSAP 3.x : respiration, clignement des yeux, flottement, légère oscillation des cheveux/bras. Boucles infinies (repeat:-1, yoyo, ease sine.inOut), mouvements subtils.
Le script reçoit les variables 'gsap', 'svg' (élément <svg>) et 'root' (conteneur). Il doit créer une gsap.timeline() et la RETOURNER. Sélectionne via svg.querySelector('#id'). Pas de fetch, pas d'accès DOM hors de 'svg'.
Réponds UNIQUEMENT avec un JSON : {"svg_structured":"<svg ...>...</svg>","gsap_code":"..."}`;

export async function analyze({ key, model, imageDataUrl, svg, onStatus }) {
  if (!key) throw new Error('Clé API Gemini manquante');
  const [meta, b64] = imageDataUrl.split(',');
  const mime = meta.match(/:(.*?);/)[1];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  onStatus?.('Envoi à Gemini…');
  const r = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mime, data: b64 } }, { text: 'SVG à structurer :\n' + svg }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 65536 }
    })
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(`Gemini ${r.status} : ${e.error?.message || 'erreur inconnue'}`);
  }
  onStatus?.('Lecture de la réponse…');
  const j = await r.json();
  const txt = j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  const clean = txt.replace(/^```json\s*|```\s*$/g, '').trim();
  try {
    const o = JSON.parse(clean);
    if (!o.svg_structured || !o.gsap_code) throw 0;
    return o;
  } catch { throw new Error('Réponse JSON invalide ou tronquée. Réduisez le nombre de couleurs et réessayez.'); }
}
