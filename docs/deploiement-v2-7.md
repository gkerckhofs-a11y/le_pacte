# Publication Firebase V2.7 — 3 novembre 2026

Projet : `le-pacte-ludificateur`.

Interface de préparation : https://le-pacte-ludificateur.web.app/founders-setup.html

## Source et périmètre

Version narrative issue de `feat/fondateurs-v2-7-calibration-lab`, commit `4aa384a9c4ac515243c98869c9f6fc16c0ba2c6e`. Le propriétaire a explicitement confirmé la mise à jour des Functions et du Hosting. Le déploiement a réussi ; la version Hosting initiale est `9266ff07033f53e3`.

Aucun merge dans `main`, changement de facturation, attribution de droits utilisateur, ni déploiement de règles ou d’index Firestore n’a été effectué. Les collections narratives sont distinctes des sessions territoriales. Aucun compte ou document de jeu de démonstration n’a été créé en production pendant les contrôles.

Une correction CSS de présentation est préparée dans la branche mais non publiée : `[hidden]` est respecté dans les interfaces narratives pour que les styles de labels, champs et boutons ne réaffichent pas les éléments masqués. Le contrôle navigateur avait identifié le champ de jeton local visible malgré le mode Firebase ; cette correction vise à rétablir le masquage attendu. Sa publication Hosting supplémentaire a été bloquée par la validation automatique, qui demande une confirmation explicite du propriétaire pour ce correctif. Aucun mécanisme d’autorisation n’est modifié par cette règle CSS.

## Vérifications

- Build cloud et Auth navigateur réussi ; vérification du bundle cloud réussie.
- 48 tests ciblés `test/founders*.test.mjs` réussis dans cet environnement.
- Les pages de préparation, régie, famille, ville et import, ainsi que le JS de préparation et la feuille de style, sont servies en HTTP 200 ; leurs empreintes correspondent aux fichiers construits.
- Sans identité, le catalogue narratif, la liste des parties narratives et la simulation répondent HTTP 403.
- La configuration publique indique le projet attendu et Firebase Auth, sans URL d’émulateur.
- Une lecture API d’une session narrative inexistante répond HTTP 404 : aucun document de test n’est créé.
- L’écran de préparation et le bouton Google sont observés dans un navigateur réel.

Les tests Firestore dédiés n’ont pas été relancés ici : le runtime Java 21 nécessaire à l’émulateur n’est pas disponible dans cet environnement de reprise. Aucun résultat cloud supplémentaire n’est revendiqué. La connexion applicative Google avec le compte réel, l’import d’un Sheets réel et une répétition humaine restent à valider ; la connexion CLI seule ne valide pas ces parcours.

Sources : code de la branche, journaux des commandes Firebase, requêtes HTTP de contrôle et observation du navigateur, vérifiés le 3 novembre 2026.
