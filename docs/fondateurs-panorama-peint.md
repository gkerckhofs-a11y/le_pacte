# Hot Spring : intégration du panorama peint

3 novembre 2026 — skin Western 1.2.0, prototype visuel.

Publié sur Firebase : voir le [compte rendu de publication](deploiement-panorama-peint.md).

## Périmètre

Intégration des treize illustrations approuvées : une référence et deux variantes (basse/haute) pour chacune des six jauges. Les deux illustrations de catastrophes, incendie et épidémie, sont exclues. Les événements fortuits, financements de prévention et résultats de l’expérience hors production ne sont pas reliés à la partie. Les règles, scores, objectifs et données de sessions ne sont pas modifiés.

Les PNG originaux sont conservés. Les treize images servies sont encodées en JPEG qualité 85, sans retouche artistique ni réduction de leur résolution. Volume total : 6 382 487 octets. La référence mesure 1672 × 941 pixels ; trois variantes mesurent 1671 × 941 et sont alignées sur le même canevas par le navigateur.

## Assemblage dans le moteur d’affichage

`public/founders-painted-western.js` compose six zones locales au-dessus de la référence. Les masques SVG emploient les illustrations JPEG entières : aucun SVG de bâtiment n’est superposé au paysage peint. Un raccord adouci de 2,5 unités atténue les limites entre les zones. Les coordonnées et l’ordre de superposition tiennent compte de l’occlusion entre gare/dispensaire et Conseil/place.

Les niveaux sont ceux du rendu précédent : 0–3 = bas, 4–6 = référence, 7–10 = haut. Les six jauges restent indépendantes. Une ville peut avoir un marché actif, des soins développés, une gare achevée et une population contestataire en même temps. La potence apparaît uniquement dans la variante basse de Sécurité ; la Stabilité basse affiche des délégations autonomes, sans catastrophe.

La projection publique, l’atelier des skins et l’aperçu de création emploient tous `mountCity`/`updateCity` : l’intégration couvre donc ces trois emplacements. Les autres univers gardent leurs décors vectoriels. Les parties Western déjà enregistrées profitent du nouveau rendu frontal sans migration des états.

Les images nécessaires au nouvel état sont préchargées, puis les six zones sont appliquées ensemble. Une réponse réseau ancienne ne peut pas écraser une sélection plus récente. Un échec conserve l’état affiché et produit un message ; les fichiers ne sont chargés qu’au besoin et les téléchargements déjà réussis sont réutilisés. Les descriptions des six jauges sont conservées pour les lecteurs d’écran.

## Contrôles

24 tests ciblés réussis : indépendance des quartiers, bornes 3/4 et 6/7, absence des catastrophes dans les treize fichiers, chargement asynchrone sans retour à un état périmé, service HTTP des JPEG/module, bibliothèque, thèmes et syntaxe des onze modules d’interface. Build Firebase et vérification des bundles réussis.

Observation navigateur de l’atelier : référence, six jauges à 2, six jauges à 8 et état mixte (Économie/Bien-être/Développement hauts ; Sécurité/Satisfaction/Stabilité bas). Les raccords observés permettent ce premier assemblage. Les 729 combinaisons théoriques n’ont pas toutes été inspectées visuellement. Le jeu humain, les téléphones réels et la reprise après interruption réseau prolongée restent à vérifier.

```sh
node --test test/founders-painted.test.mjs test/founders-skins.test.mjs test/founders-ui-syntax.test.mjs test/founders-library.test.mjs
npm run build:firebase
node scripts/verify-cloud-build.mjs
```

Sources : illustrations générées et approuvées dans la conversation, fichiers intégrés, tests et observation navigateur du 3 novembre 2026. Les originaux d’incendie et d’épidémie restent disponibles pour une éventuelle version ultérieure mais ne sont ni copiés dans les assets ni référencés par le rendu.
