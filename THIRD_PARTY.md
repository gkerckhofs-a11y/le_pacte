# Dépendances tierces

Les versions et empreintes de distribution sont verrouillées dans `package-lock.json`.

| Paquet | Version | Licence | Utilisation | Source |
|---|---|---|---|---|
| qrcode-generator | 2.0.4 | MIT | Création des matrices QR côté serveur | https://github.com/kazuhikoarase/qrcode-generator |
| jsqr | 1.4.0 | Apache-2.0 | Décodage indépendant des SVG rasterisés par les tests ; pas de scanner dans le frontend | https://github.com/cozmo/jsQR |

Les paquets et leurs licences sont installés par `npm ci`. Aucune clé d’équipe n’est envoyée à un service tiers pour la génération ou la vérification des QR.
