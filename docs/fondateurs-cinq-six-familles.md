# Parties narratives à cinq ou six familles — 17 novembre 2026

## Comportement implémenté

Le sélecteur « Nombre de familles » propose cinq ou six familles. Le nombre est transporté par la longueur de `members` et reste compatible avec les parties historiques à six familles. À cinq familles, A–E participent ; F/Pumpkins est absente. Les noms et couleurs des familles actives restent modifiables. Le nombre de participants par famille reste libre (1–300).

Le moteur utilise les familles réellement présentes pour le Maire, le Shérif, la circulation du vote, les clôtures, les surenchères, la réserve d’Influence, les transferts, le classement et les accès privés. Aucun jeton d’accès n’est créé pour une famille absente. Le laboratoire accepte également les effectifs sélectionnés.

Les champs de Pumpkins sont masqués et désactivés à cinq familles. Revenir à six conserve les valeurs déjà saisies. La liste des effectifs sauvegardée par le client contient le nombre choisi ; le rechargement client déduit le sélecteur de cette longueur. Les modèles conservent six cartes d’ambitions configurables, dont seules celles des familles actives sont utilisées en jeu.

Les cartes de familles, rôles et QR parcourent `view.families` ; le compteur de QR suit cette longueur. La vérification serveur de l’enregistrement/rechargement des modèles et celle de l’encodage QR restent à faire dans la dernière source déployée.

## Vérifications

- `npm test` : 211 tests réussis.
- Neuf nouveaux tests : finales complètes à cinq/six familles, surenchères avec second passage, clôture, conservation des ressources, accès privés, refus d’une famille absente, formats invalides, laboratoire hybride à cinq, bascule du sélecteur avec conservation des saisies.
- `npm run build:firebase` : compilation réussie.
- `node --check public/founders-setup.js` et `git diff --check` : réussis.
- Correction d’une assertion historique de version illustrée : la dernière version de ce scénario est 1.3.0.

## Blocage de publication — ne pas déployer ce checkout

Le clone GitHub a retrouvé la branche narrative `feat/chroniques-ville-20261103` à `5f9d093`. Elle contient les accords contraignants et les repères de vote, mais pas le dernier chantier « modèles de configuration et supports imprimables » déjà publié.

Les fichiers publics récents de configuration et de régie ont été récupérés depuis le site publié pour intégrer le sélecteur sans effacer ce travail visuel. Cela restaure notamment `founders-workspace.js` et `founders-print.js`. En revanche, les sources des routes serveur `/api/founders/configurations` et `/api/founders/access-qr` n’ont pas été retrouvées. Les anciens espaces de travail ont été nettoyés et la recherche dans les fichiers persistants n’a pas retrouvé de sauvegarde exploitable.

Il faut récupérer la dernière archive de sources du déploiement Firebase, ou le checkout complet qui l’a produit, puis y reporter les changements de cette branche et tester les modèles/QR en cinq et six familles avant publication. Cette branche n’a pas été déployée et aucune session de test utilisateur n’a été créée.
