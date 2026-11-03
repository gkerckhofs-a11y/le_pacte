# Publication du panorama peint — 3 novembre 2026

Projet Firebase `le-pacte-ludificateur`, Functions et Hosting. Source : `feat/fondateurs-v2-7-calibration-lab`, commit `e676e31a5f24f745ce2ffe4c2af92a00e7a1f9b7`. Résultat Firebase : `success`. Version Hosting : `0d819f8e7a99b733`.

La skin Western utilise désormais les treize JPEG approuvés et les masques de quartiers selon les jauges. Les illustrations d’incendie et d’épidémie sont exclues ; aucune mécanique d’aléa ni de prévention n’est activée. Aucun merge dans `main`, changement de rôle, de règles/index Firestore ou de données de parties pendant la publication.

Galerie : https://le-pacte-ludificateur.web.app/founders-skins.html?skin=western&color=bleu

Contrôles après publication :

- Les treize JPEG et quatre ressources (module peint, module des scènes, CSS et catalogue des skins) répondent HTTP 200 avec des empreintes SHA-256 identiques aux fichiers construits.
- Le catalogue régie répond HTTP 403 sans identité.
- Dans le navigateur de production, le panorama peint est visible ; le passage des six jauges à 8 charge et applique les variantes hautes. Le signal de chargement revient à `aria-busy=false`.
- Avant publication : 24 tests ciblés réussis, build Firebase et vérification des bundles réussis. Aucun nouveau test humain ou essai sur téléphone réel.

Sources : CLI Firebase, réponses HTTP et observation navigateur, 3 novembre 2026. Voir `fondateurs-panorama-peint.md` pour la méthode, les limites et les tests.
