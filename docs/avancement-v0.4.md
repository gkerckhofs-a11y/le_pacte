# Accès QR, relecture et préparation Firebase — 0.4.0 — 2 novembre 2026

## Livré dans le dépôt

- QR SVG individuels et planche de six cartons imprimables depuis la régie ; génération locale, marges de quatre modules, correction M, validation de la clé et de l’origine.
- Renouvellement explicite par équipe, invalidation des cartons précédents, prise en compte des clés manquantes et de leur expiration.
- Sélection d’une résolution archivée, quatre étapes de relecture, carte historique et conservation des scores, ressources, ordres et échéances.
- La carte d’équipe reste actuelle ; la relecture est une commande réservée à la régie.
- Dépendances QR et lecteur de test verrouillés ; installation reproductible ajoutée à la CI.

## État Firebase vérifié

- Projet créé : `le-pacte-ludificateur`, nom affiché « Le Pacte ».
- Application web créée : `1:48298108779:web:da8e882a62c0c8852dce2e`, nom « Le Pacte web ».
- Configuration SDK téléchargée par le CLI et conservée dans `firebase/web-config.json` ; cible locale `.firebaserc`.
- Tentative de liste des bases : erreur HTTP 403, API Firestore non utilisée ou désactivée dans ce nouveau projet.
- Aucune base ni région créée, aucune facturation liée, aucun backend ou site déployé par cette tranche. Le raccordement de l’application au cloud reste à développer et vérifier.

## Vérification

89 tests locaux : les 77 existants, 11 tests QR/relecture et 1 test supplémentaire du rendu de carte pendant une relecture. Les QR produits sont rasterisés puis décodés par jsQR ; la restitution de l’URL et du fragment est comparée à l’accès attendu. Les commandes de relecture sont testées par le contrat de session et par HTTP.

Les impressions physiques, les téléphones, le réseau de salle et la QA visuelle dans un navigateur réel ne sont pas validés dans cette tranche. Les QR ne rendent pas une adresse locale accessible à distance.
