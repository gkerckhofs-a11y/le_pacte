# Publication des skins et identités — 3 novembre 2026

Le propriétaire a demandé explicitement la mise en ligne pour examiner les habillages.

- Projet Firebase : `le-pacte-ludificateur`.
- Source : branche `feat/fondateurs-v2-7-calibration-lab`, commit `994c01453094182eb63326327bc4ee33fb2e65db`.
- Périmètre : Functions (`api`, `tick`, europe-west1) et Hosting ; résultat de la commande Firebase : `success`.
- Version Hosting : `57803c8ebd237efc`.
- Galerie : https://le-pacte-ludificateur.web.app/founders-skins.html

Cette publication comprend le correctif `[hidden]` précédemment en attente, le candidat d’équilibrage Hot Spring, les identités et tableaux de bord colorés, la ville évolutive et les cinq habillages avec leur atelier public. Aucun merge dans `main`, changement des règles/index Firestore, de la facturation ou des rôles utilisateur n’a été effectué.

## Contrôles après publication

Huit ressources publiées ont répondu HTTP 200 avec une empreinte SHA-256 identique à la construction : galerie HTML/JS/JSON, modules de thème et de décors, scripts famille, projection et préparation.

La configuration publique indique Firebase Auth et le projet attendu. Le catalogue régie répond HTTP 403 sans identité. La galerie s’est chargée dans le navigateur en production ; les cinq sélecteurs sont présents. Le changement vers Futuriste, la sélection Orange et le passage des six jauges à 8 ont été observés. Ces manipulations portent uniquement sur la démonstration visuelle, sans création de session de production.

Les 25 tests ciblés, le build et la vérification des bundles passaient avant publication. Ces contrôles ne remplacent pas une répétition humaine, un essai mobile réel ou une vérification complète des parcours applicatifs Google/Sheets.

Sources : résultat de la CLI Firebase, contrôle HTTP des empreintes et observation navigateur du 3 novembre 2026. Les journaux d’authentification et les secrets ne sont pas ajoutés au dépôt.
