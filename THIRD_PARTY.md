# Dépendances tierces

Les versions et empreintes de distribution sont verrouillées dans `package-lock.json`.

| Paquet | Version | Licence | Utilisation | Source |
|---|---|---|---|---|
| qrcode-generator | 2.0.4 | MIT | Création des matrices QR côté serveur | https://github.com/kazuhikoarase/qrcode-generator |
| jsqr | 1.4.0 | Apache-2.0 | Décodage indépendant des SVG rasterisés par les tests ; pas de scanner dans le frontend | https://github.com/cozmo/jsQR |

Les paquets et leurs licences sont installés par `npm ci`. Aucune clé d’équipe n’est envoyée à un service tiers pour la génération ou la vérification des QR.

| Paquet | Version | Licence | Utilisation |
|---|---|---|---|
| firebase | 13.1.0 | Apache-2.0 | Auth du navigateur et tests des accès directs Firestore |
| firebase-admin | 14.5.0 | Apache-2.0 | Auth vérifiée et opérations serveur Firebase |
| firebase-functions | 7.4.0 | MIT | API HTTPS et déclenchement planifié |
| @google-cloud/firestore | 9.4.0 | Apache-2.0 | Transactions et Pipelines Enterprise |
| esbuild | 0.28.2 | MIT | Compilation des fonctions et du frontend Auth |
| @firebase/rules-unit-testing | 6.0.0 | Apache-2.0 | Assertions des règles dans l’Emulator Suite |

Sources primaires : https://github.com/firebase/firebase-js-sdk , https://github.com/firebase/firebase-admin-node , https://github.com/firebase/firebase-functions , https://github.com/googleapis/nodejs-firestore , https://github.com/evanw/esbuild . Les manifestes de paquets installés ont été vérifiés le 2 novembre 2026.

## Illustration Far West — 2 novembre 2026

`public/assets/western/frontier-terrain-v1.webp` : décor généré pour Le Pacte avec l’outil intégré ImageGen, sans image de référence externe, puis encodé en WebP. Ce visuel est une illustration fictive de frontière, sans données géographiques réelles. Les repères, noms et pistes sont rendus séparément en SVG par le code du projet. Prompt conservé dans `docs/far-west-visuels-v1.md`.
