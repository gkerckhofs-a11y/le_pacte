# Cosa Nostra — visuels et publication

Contrôle du 21 novembre 2026 (heure de Bruxelles).

Les 30 dilemmes disposent chacun d'une introduction et de deux résultats distincts : 90 WebP de 1440 × 810 pixels. Les dix introductions de départ sont conservées ; les 80 autres plans proviennent du chantier de création récupéré. Les fichiers finaux sont répertoriés avec leurs empreintes dans [le manifeste](media-manifest.json).

## Revue des images

Les 90 vues ont été examinées en planches contact. Les compositions comportant des gestes ou superpositions difficiles ont été agrandies, notamment 01.01 POUR, 01.06 introduction, 02.02 POUR, 03.01 CONTRE, 04.01 introduction, 04.04 POUR, 05.02 POUR, 05.04 POUR, 05.05 introduction et 05.06 POUR.

- 05.02 POUR : reprise de la variante où les cinq personnes entourent le coffre, sans empilement de mains.
- 05.06 CONTRE : intégration de la scène de départ précédemment créée mais non publiée.
- 05.06 POUR : reprise de la poignée de main et correction du personnage de gauche, dont le visage dupliquait celui du personnage central. Les cinq silhouettes sont désormais distinctes.

Aucun autre défaut anatomique évident n'a été retenu après cette revue. Cette appréciation visuelle ne remplace pas une vérification des détails historiques.

La dernière retouche a été réalisée avec l'outil de génération d'images intégré, à partir de la scène existante. Instruction : changer uniquement le visage et les cheveux de l'homme à l'extrême gauche en un homme plus âgé, au front dégarni et à la moustache grise ; conserver les quatre autres hommes, la poignée de main, les vêtements, la pièce, la lumière et le cadrage. Export final : `content/chicago-media/0506-pour.webp`.

## Correction de publication

Le build copie maintenant les images à la fois dans le paquet des fonctions, utilisé par les URL propres aux sessions, et dans `dist/public/assets/chicago/v3`, utilisé par les adresses publiques des anciennes parties. La répétition locale sert également ces dernières depuis les mêmes sources.

`scripts/verify-chicago-media.mjs` vérifie les 90 fichiers, leur signature WebP, leur unicité et leur égalité avec les deux paquets. Avec `--url=...`, il vérifie aussi le statut HTTP, le type `image/webp` et l'empreinte de chaque fichier réellement publié. Ce contrôle est intégré au workflow de publication.

## Validation

- 308 tests applicatifs réussis avec la campagne V3 réelle.
- Compilation Firebase réussie ; 90 images distinctes identiques aux sources dans chaque paquet.
- Répétition locale : quatre états préparés avec le moteur réel (attente, introduction, résolution POUR, résolution CONTRE).
- Chromium : 12 contrôles d’affichage à 1920 × 1080, 1280 × 720 et 390 × 844 ; introduction et bon résultat affichés, aucune image manquante, aucune erreur JavaScript ni débordement horizontal. Les 90 fichiers ont aussi été décodés par le navigateur.

Captures : [introduction](final-intro-1920.webp), [résultat POUR](final-pour-1920.webp), [résultat CONTRE](final-contre-1920.webp).
