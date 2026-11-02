# Backend Firebase — 0.5.0 — 2 novembre 2026

## État distant vérifié

Projet `le-pacte-ludificateur` ; base nommée `le-pacte`, région `europe-west1` choisie pour la Belgique. API Firestore activée et base créée le 2 novembre 2026. Métadonnées : `ENTERPRISE`, `FIRESTORE_NATIVE`, accès Firestore et temps réel activés, accès MongoDB désactivé. Aucune liaison de facturation ni attribution de rôle à un utilisateur réel n’a été effectuée par cette tranche. Aucun déploiement applicatif n’a eu lieu.

## Code livré

- Adaptateur Firestore transactionnel, projections séparées public/équipe et isolation par propriétaire.
- Reçus d’idempotence et audit séparés du document canonique ; verrouillage des dépenses et offres atomiques.
- Revérification transactionnelle des clés d’équipe, y compris après authentification d’une requête ; même garde ajoutée à SQLite.
- Studio Firestore : conflits d’édition, publication immuable et compteur de versions transactionnel.
- Firebase Auth : compte vérifié, ID token vérifié avec contrôle de révocation/désactivation, claims booléens organisateur/éditeur distincts. Aucune promotion automatique et aucun endpoint public d’attribution des rôles.
- Connexion Google du frontend compilée, actualisation des ID tokens et conservation de l’accès local existant.
- API Functions, fonction planifiée, configuration Hosting et build Node 22. Aucun import SQLite dans le bundle cloud.
- Règles proposées fermant tous les accès directs au SDK client ; tous les accès de jeu passent par l’API.

Les recherches de métadonnées et de versions utilisent les Pipelines Enterprise, testés dans l’émulateur Enterprise. Les mutations utilisent les transactions natives sur des références de documents. Le scheduler utilise une Pipeline de plages sur les échéances positives, excluant les archives et pauses à échéance nulle.

## Vérification

90 tests locaux et 17 tests Firestore/Auth/règles réussis dans l’émulateur. Les nouveaux tests couvrent notamment les doublons concurrents, la révocation entre authentification et transaction, les rôles distincts, les comptes désactivés, la conservation d’une session v1 après publication v2, l’export privé et le refus de toutes les écritures directes du client.

Le build serveur et le bundle Auth navigateur sont vérifiés. L’exécution locale du lanceur Functions est bloquée par `EPERM` sur son socket Unix interne ; la CI contient son test HTTP réel sous Node 22. Le test du scheduler planifié porte sur le service de données ; aucun événement Cloud Scheduler distant n’a été déclenché.

Les tests de règles couvrent lecture/liste anonyme, accès du propriétaire connecté, documents privés/publics, créations, changements de propriétaire, suppressions, champs de rôle, chaînes volumineuses, omissions de champs, types incorrects et sous-collections orphelines. Tous sont refusés. Les appels Admin sont hors Security Rules et font l’objet des tests d’autorisation serveur.

## Limites avant mise en ligne

Activer le fournisseur Google, identifier et autoriser le premier compte, revoir règles/index/configuration, valider le déploiement, puis tester la connexion réelle et les téléphones. Les données SQLite ne sont pas migrées automatiquement. La QA visuelle dans un navigateur réel et la partie humaine restent à faire.

## Note sur les règles proposées

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for this server-only architecture because every direct client read and write is denied, while the backend enforces identity and ownership in transactions. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

## Sources techniques

- Firebase, *Get started with Firestore Enterprise edition using server client libraries* : https://firebase.google.com/docs/firestore/enterprise/quickstart-server
- Firebase, *Transactions and batched writes* : https://firebase.google.com/docs/firestore/manage-data/transactions
- Firebase, *Manage functions* : https://firebase.google.com/docs/functions/manage-functions
- Google Cloud, *Runtime support* : https://docs.cloud.google.com/functions/docs/runtime-support

Documentation consultée le 2 novembre 2026 ; les métadonnées de base ont été vérifiées avec le CLI Firebase authentifié sur le projet dédié.
