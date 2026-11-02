# Carte Far West — territoires jointifs

2 novembre 2026. Aperçu : https://le-pacte-ludificateur.web.app/far-west.html

La carte présente désormais des territoires aux frontières irrégulières, teintés selon leur propriétaire. Le décor illustré de la version 1 est conservé. Les cercles de lieux et les plaques sont remplacés par des noms dans les régions ; les forts et sites conservent un pictogramme. La sélection met en évidence la région et ses voisins. Les anciennes pistes générales sont masquées ; les traits affichés lors d’une sélection servent d’aide de lecture.

## Frontières et règles

Les frontières sont générées une seule fois par côté partagé, puis réutilisées par les deux régions. Les six districts de capitale bordent leur province ; les provinces N séparent P et M et se terminent en point aux passages F. Un simple contact ponctuel n’accorde donc pas de voisinage. Les trois sites centraux partagent leurs frontières respectives.

Le contrôle géométrique vérifie : 33 polygones valides, aucun chevauchement de surface, aucun trou intérieur dans l’union des régions, position des repères à l’intérieur, et correspondance exacte des frontières partagées avec les 60 arêtes du moteur. Les irrégularités sont déterministes, sans modifier les identifiants, valeurs, règles, propriétaires ou droits d’accès.

## Fichiers et génération

`public/western-territories.js` contient les contours et positions. `scripts/build-western-territories.py` les construit puis les audite avec Shapely ; Node lit le graphe officiel dans `src/map.ts`. Exécution depuis le dépôt :

```sh
python -m pip install shapely
python scripts/build-western-territories.py
```

Shapely sert seulement à la régénération et à l’audit ; aucune dépendance supplémentaire n’est chargée par le navigateur. Le renderer SVG, l’aperçu et les ressources locales sont mis à jour. Aucun nouveau visuel bitmap n’a été généré pour cette étape : les contours précis sont du code SVG.

## Vérifications ciblées

27 tests réussis : rendu UI, transport HTTP et renderer Far West. Deux contrôles spécifiques vérifient les frontières partagées à partir des segments du fichier livré et la position de chaque repère dans sa région. L’audit Shapely indépendant confirme aussi l’absence de chevauchements et de trous. Syntaxe des modules et diff vérifiés.

## Bâtiments — 2 novembre 2026

Les neuf repères bâtis (six forts, dépôt, mine, Conseil) utilisent des miniatures SVG originales avec faces ombrées, matériaux bois/pierre, petites fenêtres et détails propres à leur fonction. Les forts portent palissades, tours et fanion ; le dépôt, des caisses ; la mine, un chevalement et un wagonnet ; la maison du Conseil, un porche et un petit clocheton. Les bâtiments ont été agrandis et les codes/médaillons décalés pour dégager leurs silhouettes. Les noms et les contours gardent leur fonction de lecture du jeu. Aucun nouveau bitmap ni dépendance n’est ajouté. Onze tests ciblés de rendu UI et de géométrie réussissent après ce changement.
