# Premier déploiement — 2 novembre 2026

Application : https://le-pacte-ludificateur.web.app/

## État vérifié

Le propriétaire a indiqué avoir activé Blaze. La relecture Cloud Billing confirme `billingEnabled: true`. Aucune modification du compte de facturation n’a été effectuée par l’assistant.

Les règles et index de la base Enterprise nommée `le-pacte` sont publiés. Les fonctions de deuxième génération `api` et `tick` sont `ACTIVE`, sous Node 22, dans `europe-west1`. Leurs limites d’instances sont respectivement 2 et 1. Le job `firebase-schedule-tick-europe-west1` est `ENABLED`, à la fréquence `every 1 minutes`.

Le premier envoi global a publié les fonctions et Firestore, puis s’est arrêté sur l’absence de politique de nettoyage des images de construction. La politique officielle Artifact Registry a ensuite été configurée dans `europe-west1`, avec conservation des images de construction pendant sept jours. La publication Hosting séparée a terminé avec succès. Cette politique concerne les images de construction, pas les sessions de jeu.

## Contrôles ciblés

- Build cloud et navigateur vérifié.
- Accueil et bundle Auth servis en HTTP 200 via Hosting.
- `/api/catalog` : HTTP 200, mode Firebase, projet attendu, aucune URL d’émulateur.
- `/api/sessions` et `/api/studio` sans identité : HTTP 403.
- Lecture par l’API d’un identifiant de session inexistant : HTTP 404, sans création de document.
- Lecture directe anonyme via le SDK client vers la base nommée : `permission-denied`.
- Navigateur réel : écran organisateur avec bouton Google affiché. Aucun message d’erreur applicatif observé dans la console ; un message provenant d’une extension du navigateur est exclu de ce constat.
- Correction du libellé d’attente avant connexion : « Non connecté ». Vérification de syntaxe JavaScript et contrôle visuel, sans relancer les tests complets pour ce changement d’affichage.

Aucune session de démonstration ni donnée de jeu n’a été créée dans la base distante pendant ces contrôles. Le timer n’a pas été déclenché manuellement. La suite complète déjà validée reste celle de la [CI v0.5](https://github.com/gkerckhofs-a11y/le_pacte/actions/runs/41476679035).

## Validation restante

La connexion Google réelle de `gkerckhofs@gmail.com`, le rattachement de son fournisseur Google et la vérification de son adresse restent à effectuer. Le rôle organisateur est préattribué ; aucun rôle éditeur n’est attribué. Tester ensuite une session avec les six accès d’équipe et une projection sur de vrais appareils. Aucun test humain de partie complète n’est revendiqué.

Sources : réponses des API Firebase Hosting, Cloud Functions, Cloud Scheduler et Cloud Billing, plus requêtes HTTP/SDK et observation du navigateur, vérifiées le 2 novembre 2026. L’état d’activation Auth antérieur est conservé dans [firebase-auth-activation.md](firebase-auth-activation.md).
