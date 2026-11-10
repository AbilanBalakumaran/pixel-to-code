# Pixel-to-Code Agent

Image 2D → SVG structuré → animation GSAP, 100 % dans le navigateur. Aucun build.

## Déploiement sur GitHub Pages
1. Créez un dépôt GitHub et envoyez-y le contenu de ce dossier (index.html à la racine).
2. **Settings → Pages → Build and deployment → Source : Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Après environ une minute, l'app est en ligne sur `https://<utilisateur>.github.io/<dépôt>/`.

## Utilisation
1. Obtenez une clé gratuite sur https://aistudio.google.com/apikey et collez-la en haut de page (stockée dans le `localStorage` de votre navigateur uniquement).
2. Importez une image, vectorisez, puis lancez « Structurer et animer ».
3. Modifiez le code GSAP ou le SVG, cliquez sur « Appliquer », puis exportez.

## Conseils
- Images plates (anime / cel-shading) : 10 à 16 couleurs donnent le meilleur compromis.
- Si Gemini renvoie un JSON tronqué, baissez le nombre de couleurs : le SVG est renvoyé en entier.
- Le script GSAP reçoit `gsap`, `svg`, `root` et doit retourner une timeline.
- L'app est installable (PWA) et fonctionne hors-ligne, sauf l'étape Gemini. Après une mise à jour, changez `V` dans `sw.js` (ex. `ptc-v2`) pour vider le cache.
- Le bouton « Essayer avec l'exemple » charge `assets/sample.png`.
