# Hot Spring : partie test à six équipes et projection illustrée

Livraison du 3 novembre 2026.

- Scénario intégré illustré `1.1.0` : dix scènes avant décision ; la version `1.0.0` reste disponible avec son contenu d’origine.
- L’écran projeté réunit le dilemme et son illustration, le panorama évolutif, les totaux d’influence POUR/CONTRE et les six indicateurs. Les bulletins du dernier vote restent visibles après révélation.
- Les variations des jauges utilisent les valeurs réelles avant et après application des effets, y compris les plafonds de 0 à 10. Les sessions antérieures sans ces instantanés affichent simplement la valeur courante.
- Maire remplace Modérateur ; Shérif remplace Meneur dans les écrans et erreurs utilisateurs. Les identifiants du protocole restent compatibles avec les sessions existantes.
- Le tableau de bord du porte-parole conserve dollars, influence, objectif privé, négociation et commandes de vote ; son onglet Règles est accessible au clavier et ne réinitialise pas la table.
- La partie vierge et la démonstration de résultat sont distinctes. Les liens privés des équipes sont transmis à l’organisateur uniquement ; ils ne sont ni dans ce dépôt ni dans les fichiers publics.

Validation ciblée : 29 tests de domaine, HTTP, catalogue, projection et syntaxe d’interface ; construction Firebase et vérification des bundles. Les contrôles automatiques ne remplacent pas une partie humaine pour juger l’équilibre.
