# Recette de projection des Colons de Hotspring

## Parcours joués

Cinq parties locales de la version 1.2 ont été menées du premier vote au classement final. Le simulateur envoie les mêmes commandes que les familles et la régie. Les valeurs sont celles du moteur après la charte. La dernière colonne donne l’illustration d’épilogue effectivement sélectionnée. Les jauges sont sur 10.

| Parcours | Économie | Écologie | Sécurité | Bien-être | Démographie | Crises vécues | Épilogue |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Industrie et pollution | 8 | 0 | 10 | 0 | 8 | 2 | `fin-industrie` |
| Vallée préservée | 0 | 10 | 10 | 10 | 3 | 0 | `fin-ressources` |
| Affluence et précarité | 8 | 5 | 1 | 0 | 10 | 2 | `fin-tensions` |
| Institutions et sécurité | 7 | 8 | 9 | 10 | 9 | 2 | `fin-equilibre` |
| Appauvrissement et crises | 1 | 1 | 8 | 2 | 4 | 5 | `fin-declin` |

Pour les institutions et le parcours de crises, le total des crises comprend l’incendie contenu automatiquement par l’eau communale et le règlement coupe-feu. La partie « Appauvrissement et crises » passe aussi par quatre votes de crise.

Chaque parcours vérifie les six bilans, les variations des cinq jauges et de leur moyenne par rapport au bilan précédent, les conditions des vues et le classement calculé. La régie suspend chaque partie au bilan du chapitre V. Le test ferme la base SQLite, la rouvre puis reprend la séance le jour suivant. L’illustration, le bilan et l’historique des chapitres doivent rester identiques.

Une sixième partie est arrêtée juste après le vote sur la coupe du bois, au chapitre II. Le test exige un épilogue de ce stade, sans charte, gouvernement ultérieur ni image de la ville mature.

## Captures à comparer

Les deux compositions correspondant aux maquettes de référence sont la résolution POUR du saloon et le bilan du chapitre II.

| Écran | 1920 × 1080 | 3840 × 2160 |
| --- | --- | --- |
| Le saloon de Main Street, permis accordé | [1080p](captures/industrie-saloon-pour-1920x1080.webp) | [4K](captures/industrie-saloon-pour-3840x2160.webp) |
| Chapitre II terminé, ville en expansion | [1080p](captures/industrie-chapitre-2-1920x1080.webp) | [4K](captures/industrie-chapitre-2-3840x2160.webp) |
| Épilogue industriel | [1080p](captures/industrie-epilogue-1920x1080.webp) | [4K](captures/industrie-epilogue-3840x2160.webp) |
| Épilogue de la vallée préservée | [1080p](captures/vallee-epilogue-1920x1080.webp) | [4K](captures/vallee-epilogue-3840x2160.webp) |
| Épilogue de la ville surpeuplée | [1080p](captures/affluence-epilogue-1920x1080.webp) | [4K](captures/affluence-epilogue-3840x2160.webp) |
| Épilogue des institutions | [1080p](captures/institutions-epilogue-1920x1080.webp) | [4K](captures/institutions-epilogue-3840x2160.webp) |
| Épilogue de la ville touchée par les crises | [1080p](captures/crises-epilogue-1920x1080.webp) | [4K](captures/crises-epilogue-3840x2160.webp) |
| Arrêt au chapitre II | [1080p](captures/anticipation-epilogue-1920x1080.webp) | [4K](captures/anticipation-epilogue-3840x2160.webp) |
| Classement des familles après l’épilogue | [1080p](captures/industrie-classement-1920x1080.webp) | [4K](captures/industrie-classement-3840x2160.webp) |

## Profils et stades

Le contrôle des 24 couples utilise les cinq jauges de référence de chaque profil du manifeste. Pour chaque chapitre, il exige une vue de l’ambiance et du stade demandés. Au chapitre I, les équipements déclarés sont limités aux abris et à leurs charpentes, aux tentes et aux chariots. Les cinq parties du tableau couvrent séparément le choix entre les vues génériques et les variantes autorisées par des décisions réelles.

Les deux planches permettent de comparer les périodes et les histoires. La galerie complète renvoie vers les fichiers utilisés par la projection.

- [Les quatre ambiances du chapitre I au chapitre VI](captures/matrice-chapitres-profils.webp)
- [Les variantes de décisions, les vues de secours et les épilogues](captures/galerie-variantes.webp)
- [Les vues originales avec les identifiants du manifeste](captures/galerie.md)

## Vérifications de projection

La recette ouvre la véritable page `founders-city.html` et vérifie l’illustration décodée, son adresse, les dimensions affichées et l’absence de défilement dans les deux axes. Elle teste une présentation dans chacun des six chapitres, le saloon de Main Street, la négociation, le vote et les deux résultats possibles de « Qui paie Hotspring ? ». Elle compare également l’espace réservé à l’image au fil des chapitres et contrôle la présence du tour de parole, de la réserve et des variations de jauges dans les phases correspondantes.

La vue d’épilogue est collective. Le classement nominatif des familles apparaît quand la régie demande sa révélation. La recette vérifie cette transition sur les cinq parcours, ouvre puis ferme le plein écran pendant le Conseil et pour chaque épilogue, et vérifie que la carte de la vallée peut être ouverte puis refermée pendant le Conseil.

Les 54 instantanés ont passé les quatre formats, soit **216 contrôles de projection**. La projection ne défile sur aucun de ces écrans. Les 34 captures enregistrées correspondent aux formats natifs des fenêtres 1080p et 4K. En complément, deux pannes de chargement ont été provoquées sur le chapitre IV. Lors de la première, la vue de secours de la même période s’affiche. Lorsque les deux images sont indisponibles, le titre et les jauges restent lisibles avec un avis explicite. [Relevé de chaque écran](captures/releve.json)

| Format de projection | Écrans vérifiés | Hauteur de l’image, présentations des chapitres I à VI |
| --- | ---: | ---: |
| 1280 × 720 | 54 | 398 px |
| 1920 × 1080 | 54 | 598 px |
| 2560 × 1440 | 54 | 798 px |
| 3840 × 2160 | 54 | 1197 px |

La revue des images montre des situations distinctes. Les quatre vues de fondation font varier le commerce, la tension, l’entraide et la boue autour des tentes et des premiers abris. Au chapitre II, la rue s’organise autour des maisons de bois et de leurs porches. Les cinq épilogues retenus vont de l’atelier fumant au bord de l’eau aux maisons aux volets clos, en passant par les cultures, deux groupes qui se font face au crépuscule et les artisans de Main Street en plein jour. L’arrêt anticipé conserve une scène de quartier du chapitre II.

La lisibilité a été contrôlée en navigateur aux dimensions annoncées. La distance de lecture, la luminosité et les couleurs d’un véritable vidéoprojecteur restent à apprécier en salle par l’organisateur.

## Régie

Une partie locale a été menée au chapitre IV jusqu’à la révision 145. Dans l’aperçu, le passage de cette partie à une simulation industrielle, puis à son épilogue et de nouveau à la partie réelle, conserve le chapitre en cours. Les contrôles affichent les jauges, les raisons de la sélection, les cinq parcours et les sept étapes. L’essai du chargement en erreur a porté sur la vue choisie et sa vue de secours. Le bouton de signalement a copié les deux chemins. La capture montre le panneau dans un navigateur. [Régie — aperçu des illustrations](captures/regie-apercu.webp)

## Reproduire

Versions de la recette : Node 24.22.3, Chromium 158.0.8127.0, Playwright pour Python 1.62.0 et Pillow 13.0.0. Exécuter depuis la racine du dépôt.

```sh
node --test test/hotspring-cinema-routes.test.mjs
python scripts/capture-hotspring-cinema.py --output /tmp/recette-hotspring
python scripts/capture-hotspring-cinema.py --matrix --output /tmp/recette-hotspring
```

La variable `CHROMIUM` peut désigner explicitement le binaire du navigateur. Les deux scripts utilisent uniquement le moteur et les pages de ce dépôt. Les instantanés proviennent de la vue publique des parties et sont servis sur l’interface locale, sans connexion à une séance de production.
