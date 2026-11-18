# Parties narratives à cinq ou six familles — 17 novembre 2026

## Comportement implémenté

Le sélecteur « Nombre de familles » propose cinq ou six familles. Le nombre est transporté par la longueur de `members` et reste compatible avec les parties historiques à six familles. À cinq familles, A–E participent ; F/Pumpkins est absente. Les noms et couleurs des familles actives restent modifiables. Le nombre de participants par famille reste libre (1–300).

Le moteur utilise les familles réellement présentes pour le Maire, le Shérif, la circulation du vote, les clôtures, les surenchères, la réserve d’Influence, les transferts, le classement et les accès privés. Aucun jeton d’accès n’est créé pour une famille absente. Le laboratoire accepte également les effectifs sélectionnés.

Les champs de Pumpkins sont masqués et désactivés à cinq familles. Revenir à six conserve les valeurs déjà saisies. La liste des effectifs sauvegardée par le client contient le nombre choisi ; le rechargement client déduit le sélecteur de cette longueur. Les modèles conservent six cartes d’ambitions configurables, dont seules celles des familles actives sont utilisées en jeu.

Les cartes de familles, rôles et QR parcourent `view.families` ; le compteur de QR suit cette longueur. Les vérifications HTTP de l’enregistrement/rechargement des modèles et de l’autorisation des QR passent dans les deux formats.

## Vérifications

- `npm test` : 214 tests réussis.
- Neuf nouveaux tests : finales complètes à cinq/six familles, surenchères avec second passage, clôture, conservation des ressources, accès privés, refus d’une famille absente, formats invalides, laboratoire hybride à cinq, bascule du sélecteur avec conservation des saisies.
- `npm run build:firebase` : compilation réussie.
- `node --check public/founders-setup.js` et `git diff --check` : réussis.
- Correction d’une assertion historique de version illustrée : la dernière version de ce scénario est 1.3.0.

## Récupération de la source publiée

L’archive `api_function-source.zip` fournie par l’organisateur a permis de récupérer le 17 novembre 2026 la validation des modèles, les méthodes Firestore et les routes `/api/founders/configurations` et `/api/founders/access-qr`. SHA-256 de l’archive : `44105d7ff41df8d9ee021442306a8a859b492aaa49cb793a2eea9df0969c6400`.

Le stockage Firestore utilise toujours la collection `pacteNarrativeConfigurations`, les champs `id`, `ownerId`, `updated`, `dataJson` et la même isolation par organisateur. La projection sauvegardée utilise désormais les familles actives. L’adaptateur SQLite équivalent a été rétabli pour les tests et les répétitions locales.

Trois tests supplémentaires couvrent les modèles cinq/six familles enregistrés puis utilisés pour créer une partie, l’absence de données d’accès dans les modèles, les QR privés, leur origine canonique et le refus d’un accès révoqué. Les fichiers publics récemment publiés ont également été récupérés, dont l’accueil narratif et la page territoriale historique.

Validation finale : `npm test` → 214 tests réussis ; compilation Firebase et contrôle des bundles réussis. Le blocage de source est levé.

## Publication du 17 novembre 2026

La connexion Firebase de l’organisateur a été rétablie. Le déploiement `functions:pacte,hosting` sur `le-pacte-ludificateur` a réussi : les fonctions `api` et `tick` sont mises à jour, et Hosting confirme la nouvelle publication.

Les sept fichiers d’accueil, préparation, modèles, impressions, régie et progression de vote contrôlés en HTTP 200 correspondent exactement aux fichiers compilés (comparaison SHA-256).

Une session distincte a été créée pour le test humain : `TEST5NOV17`, « Le Pacte — Test cinq joueurs », cinq familles d’un joueur, scénario hybride 1.3.0, habillage Western. Elle appartient au compte organisateur existant et reste en phase READY. Aucun vote n’a été saisi. Les anciennes parties sont conservées.

Les lectures HTTP de la projection publique et des cinq accès privés ont été vérifiées : cinq familles, phase READY, chaque accès limité à la famille attendue. Les liens privés ne sont pas enregistrés dans le dépôt ; leur validité reste de 24 heures après création ou renouvellement.

Le script `scripts/publish-founders.sh` reste disponible pour une publication depuis un terminal connecté. Il ne publie ni règles Firestore, ni index, ni changements de droits.
