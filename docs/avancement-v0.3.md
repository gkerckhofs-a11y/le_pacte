# Studio des contenus — 0.3.0 — 2 novembre 2026

Cette tranche ajoute l’espace de conception des univers au serveur local. Elle ne déploie aucun service Firebase.

- Duplication des cinq exemples et des éditions existantes ; brouillons persistants et contrôle de révision.
- Formulaires de contenus : identité, introduction, épilogue, lexique, six factions, couleurs, 33 territoires, cinq Conseils et six objectifs.
- Prévisualisations projection/équipe/régie avec données fictives ; import/export JSON versionné.
- Publication de contenus figés, empreinte SHA-256, nouvelle version dans une même famille ou duplication indépendante.
- Sélection d’une version publiée à la création de session ; snapshot de contenu et référence de version conservés dans la session.
- Règles fixes affichées séparément des textes narratifs. Rejet des champs et identifiants mécaniques non autorisés.
- Les brouillons incomplets sont enregistrables ; les publications incomplètes sont bloquées.

L’habillage publié dans cette version utilise uniquement les composants vectoriels existants et leurs palettes. La publication ne certifie pas un univers commercialement finalisé. Les médias personnalisés, les contrôles de contraste complets, la séparation cloud des rôles, les QR imprimables, l’initiation interactive et Firebase restent à réaliser.

Vérification : 15 nouveaux tests ciblés du studio (13 domaine/HTTP/persistance et 2 génération HTML), soit 77 tests dans la suite complète. Les tests couvrent notamment la parité mécanique des cinq versions publiées, l’immuabilité, les conflits d’édition et le maintien d’une session sur v1 après publication de v2. La QA visuelle dans un navigateur réel demeure non réalisée dans cet environnement.
