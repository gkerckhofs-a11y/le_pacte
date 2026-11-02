# Activation Firebase Auth — 2 novembre 2026

Projet : `le-pacte-ludificateur`.

## Modifications réalisées

Le propriétaire a désigné `gkerckhofs@gmail.com` comme compte organisateur et adresse de support. La configuration Google est versionnée dans `firebase.json`, puis appliquée par le CLI officiel avec `deploy --only auth`. La commande a terminé avec succès.

Vérification distante : le fournisseur `google.com` est activé. Les domaines autorisés sont `le-pacte-ludificateur.firebaseapp.com` et `le-pacte-ludificateur.web.app`.

Le compte désigné a été précréé sans mot de passe, avec `emailVerified: false`, puis le claim booléen `pacteOrganizer: true` lui a été attribué en préservant les autres claims. La relecture Admin confirme ce rôle et l’absence du rôle éditeur. Aucun fournisseur n’est encore lié à ce compte. La connexion Google réelle reste à effectuer et à vérifier ; le serveur continue de refuser les comptes non vérifiés. Aucune vérification d’adresse n’a été simulée.

## État de mise en ligne

- Le site Hosting par défaut existe, mais aucune version applicative n’a été déployée pendant cette étape.
- La facturation est désactivée : `billingEnabled: false`, vérifié par l’API Cloud Billing.
- Aucun compte de facturation n’a été lié et aucun changement d’offre n’a été effectué.
- Functions, Hosting, règles Firestore et index ne sont pas déployés par cette étape.
- La CI du commit `77fd34d43a5e1c1ed872001e682f947c29546471` a réussi : 90 tests locaux, 17 tests Firestore/Auth/règles et le test HTTP Functions sous Node 22.

Le prochain déploiement applicatif nécessite le forfait Blaze et la validation du propriétaire prévue au cahier des charges. La commande préparée pour cette étape future est :

```sh
npx -y firebase-tools@latest deploy --project le-pacte-ludificateur --only firestore,functions,hosting
```

Cette commande n’a pas été exécutée. Après déploiement, vérifier la connexion Google, l’accès organisateur, le refus de Studio sans rôle éditeur, la création d’une session et les six accès d’équipe sur de vrais appareils.

## Vérifications de cette étape

Configuration JSON relue, diff vérifié et état distant Auth relu après activation. Aucun code du moteur ou du backend n’a changé ; la suite complète n’a pas été relancée pour ce changement de configuration et de documentation.

Sources : métadonnées Firebase/Cloud Billing du projet, vérifiées le 2 novembre 2026 ; [CI GitHub](https://github.com/gkerckhofs-a11y/le_pacte/actions/runs/41476679035) ; Firebase, [premier déploiement Functions](https://firebase.google.com/docs/functions/get-started), documentation consultée le 2 novembre 2026 (Blaze requis pour le déploiement).
