# Carte Far West — proposition visuelle 1

2 novembre 2026. Aperçu public : https://le-pacte-ludificateur.web.app/far-west.html

## Réalisation

La vue Far West remplace le diagramme circulaire générique par un atlas illustré de la frontière : terrain peint, forts et lieux dessinés en SVG, noms visibles, médaillons d’équipe numérotés et pistes sélectionnables. Les autres univers conservent leur rendu existant. Les labels personnalisés des éditions sont utilisés, sans noms figés dans le renderer.

Le moteur reste la source des 33 lieux et 60 connexions. L’illustration ne porte aucun chemin ni information de jeu. Chaque piste visible provient du graphe fourni par l’API. Le numéro complète la couleur pour identifier une équipe. Le clic ou le clavier sur un lieu affiche sa fiche et signale ses pistes incidentes. Le zoom reste disponible, avec défilement sur les petits écrans.

La carte publique d’aperçu utilise la position de départ, sans créer de session ni révéler de données privées. Le module de dessin reçoit seulement l’édition, les propriétaires visibles et les éventuels conflits révélés. La carte des équipes et la relecture utilisent les propriétaires de leur vue existante.

## Fichiers

- `public/western-board.js` : présentation SVG du plateau.
- `public/assets/western/frontier-terrain-v1.webp` : terrain décoratif.
- `public/far-west.html` et `public/western-preview.js` : aperçu sans connexion.
- `public/app.js` et `public/style.css` : intégration aux vues de jeu.

Illustration créée avec l’outil intégré ImageGen, sans image de référence. L’encodage WebP conserve le dessin à ses dimensions d’origine. Le terrain fictif n’est pas une carte historique ou géographique réelle.

## Vérifications ciblées

36 tests réussis : rendu UI, relecture, animation, transport HTTP et module Far West. Les nouveaux contrôles vérifient la conservation exacte des identifiants et connexions, l’échappement des noms éditables, les routes mises en évidence et les propriétaires visibles. Les ressources ajoutées sont servies par la liste explicite du serveur local. Syntaxe JavaScript et diff vérifiés. Dans le navigateur public, la sélection de S1 affiche Grand Dépôt et ses sept connexions ; les boutons de zoom modifient bien l’échelle. Aucune modification des formules, du stockage ou des droits d’accès.

## Prompt de l’illustration

Use case: stylized-concept. Asset type: background terrain illustration for a playable Far West strategy board in a web game, landscape 4:3 composition. Primary request: a richly illustrated, elegant American frontier terrain map viewed from directly overhead, nineteenth-century hand-painted atlas engraving with fine ink hatching and watercolor, realistic geography yet inviting premium board-game art. Full-bleed continuous land surface, no physical paper edges. Compose a broad open warm grassland basin at center with quiet uncluttered space for interface markers. Around the outer rim: rocky wooded hills at north, a few winding dry ravines and ochre mesas at east, dry red badlands at southeast, a pale desert at south, open grazing grassland at southwest, dark pine groves and pale granite at northwest. Small natural rock and scrub details give scale; landform clusters concentrated at the outer margins and corners so game information stays readable across the middle 80 percent. Daylight, muted natural sandstone, sage and dark pine colors, fine detailed tactile illustration, sophisticated restrained contrast, no cartoon faces, no glossy 3D. Constraints: purely decorative terrain, not an information diagram. NO text, letters, labels, numbers, legend, compass, border, icons, territorial boundaries, roads, tracks, railways, buildings or settlements. No map nodes or connecting lines. No people, weapons or flags. No ocean. High-detail seamless coherent landscape, not a collage.
