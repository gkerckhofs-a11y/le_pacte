# Les Colons de Hotspring

Campagne versionnée à cinq familles, de l’arrivée des chariots en 1872 au choix d’une charte en 1893. La sélection « Les Colons de Hotspring » crée une session propre au parcours.

Le catalogue propose la V1.2 par défaut. Les cinq jauges commencent à 5. Sous le panorama, la Stabilité affiche leur moyenne, soit 5,0 au départ. Les sauvegardes antérieures réutilisent leurs règles d’origine. En V1.2, l’animateur ouvre le vote et décide quand poursuivre. La [matrice des résultats](matrice-indicateurs-v1.2.md) détaille les décisions et chartes. Le [rapport de simulation](rapport-simulation-v1.2.md) contient les captures et les points à revoir en salle.

## Essai local

1. Démarrer le serveur avec `npm start`.
2. Ouvrir `/founders-setup.html?scenario=les-colons-de-hotspring` sur ce serveur, puis charger le catalogue avec la clé de régie locale.
3. Prévisualiser la campagne, nommer les équipes et créer la partie. Choisir « Séance standard » pour limiter le chapitre V à deux crises par séance.
4. Dans la régie, cliquer sur « Générer les fiches équipes », puis « Imprimer les fiches équipes ». Choisir A4 portrait et une échelle de 100 %. Chaque famille tient sur une page avec son QR et le rappel des règles. Un renouvellement remplace l’accès précédent. Les QR expirent 24 heures après création et peuvent être régénérés à une reprise.
5. Ouvrir la projection. La régie peut passer de la lecture à la négociation puis au vote. L’épilogue annonce le résultat et les scores. Un bouton dévoile ensuite les ambitions et le détail des points. Les commandes d’animation sont regroupées en haut de la régie.

Les cartes de rôle sont accessibles dans « Les équipes et leurs accès ». Choisir le nombre de diplomates par famille et imprimer en A4 portrait à 100 %. Chaque planche contient jusqu’à neuf cartes de 63 × 88 mm.

L’accueil « Games of Influence » donne accès aux univers. La régie de Hotspring regroupe les parties de la version courante, la création de parties et l’atelier de dilemmes. L’atelier enregistre la situation, la question et les deux issues comme brouillon privé. Les brouillons pourront être intégrés à une version de campagne après validation des règles et de l’équilibrage.

Pour déléguer l’animation, ouvrir « Inviter un animateur » depuis la régie de la partie. Enregistrer l’adresse du compte Google, puis transmettre le lien de la régie. L’invité peut animer cette partie, préparer ses fiches et ouvrir la projection. Le propriétaire peut remplacer l’adresse ou retirer l’accès depuis la même rubrique.

« Terminer la séance » sauvegarde aussi un scrutin ouvert, ses mises, ses propositions et son chrono. Le bilan ne compte que les chapitres clôturés et la trajectoire. Au checkpoint du chapitre V, la régie peut reprendre les crises en réserve ou ouvrir le final. La variante d’une archive repart du checkpoint « Gouvernement choisi », avec les ressources et le panorama précédant le duel des chartes.

## Calibrage consigné pour le test

- Quand deux règles de sélection de D14 s’appliquent, la Confiance solide ou l’accord respecté choisissent D14A. Pour D20, quand le rail et la grande mine coexistent, la mine tient le rôle du principal employeur.
- Pour la crue et la pénurie d’eau, le moteur utilise un seuil de 2 à partir d’un risque de base de 1, puis compte les vulnérabilités et protections du chapitre V. Pour la mine et la banque, les marqueurs de présence déterminent l’éligibilité. Le détail des risques et l’ordre sont visibles en régie. Les scores égaux sont triés par numéro de dilemme.
- Le coût foncier privé du programme d’assainissement s’applique si ce coût et l’avantage du quartier planifié coexistent. Les bonus et pertes de jauge sortent de la résolution puis sont bornés entre 0 et 10.
- En qualification des chartes, une égalité au seuil des deux premières places ouvre un vote simple entre les chartes ex æquo. Le moteur actuel ne fournit pas de registre de Prestige public pour le départage prévu sous le Conseil des Fondateurs. Le test utilise le tour supplémentaire.
- Le total sur 18 points se compose de deux points au maximum par chapitre clôturé, deux pour la trajectoire, trois pour l’héritage si la charte a été choisie et trois pour le classement des fortunes finales. Les rangs 1, 2 et 3 valent respectivement 3, 2 et 1 point. Deux fortunes égales occupent le même rang et les rangs suivants tiennent compte du nombre de familles devant elles. Les familles à égalité au total le plus élevé partagent la victoire.

## Revue des visuels

Le manifeste couvre 323 entrées. Le jeu dispose de 194 fichiers WebP, dont les 32 en-têtes, les 62 plans fixes des votes, les six chartes, les six ouvertures, trois variantes en image, 36 calques transparents le fond de vallée et les 48 images des deux tableaux de ville. Les 129 autres entrées sont composées par le moteur. Les coordonnées du panorama restent les mêmes quels que soient les toits, les travaux, la densité, l’état de la rivière ou les traces de crise.

- La [galerie](galerie.html) associe les 129 compositions à des planches de contrôle et présente les neuf captures de croissance et la progression des trois parcelles. Les gros plans des planches sont des états de vérification. Les captures suivent une partie sur la terrasse et montrent aussi une ville fondée dans les terres basses.
- Dès le choix du site, le premier foyer partage le terrain avec trois tentes. La décision sur l’eau puis le lotissement libèrent les deux premières parcelles pour les maisons de bois. La scierie permet de remplacer la dernière tente immédiatement. Avec la coupe limitée, elle reste un dilemme de plus. Le bouton « Carte de la vallée » de la projection permet de retrouver la vallée entière.
- Sur la projection, chaque site dispose de son propre point de vue. Le premier foyer garde sa parcelle. La rue se dessine lors du lotissement et le cadrage s’élargit avec les équipements. Les plans lointains sont détourés à leur silhouette pour garder les arbres, les berges et les collines en place. La carte de la vallée donne aussi accès aux ouvrages hors champ et aux repères de crise.
- Sur la carte de la vallée, les parcelles sont placées sur la même vue de la vallée, avec des ombres au pied des bâtiments et des rues propres à chaque site. Les tracés suivent le terrain sous les bâtiments. Les teintes de la rivière et les traces de crue suivent les berges.
- Les [crédits](manifeste-assets.json) et les [prompts utilisés](prompts-utilises.json) accompagnent les fichiers intégrés, dont les devantures, la charrette, les peupliers, la charpente et les débris ajoutés après la revue de la direction visuelle. Les entrées « validé » ont un fichier intégré ou un rendu du moteur contrôlable dans la galerie.
- Les repères de contexte apparaissent lorsque le dilemme et l’état de la partie les justifient. L’épilogue part du camp de 1872 et réutilise jusqu’à trois résultats effectivement joués, selon les décisions prises et les crises survenues. Le réglage de mouvement réduit affiche directement la ville finale.
- `node scripts/capture-hotspring.mjs --states` reproduit les captures 1080p et 4K, les planches et la galerie. ImageMagick est nécessaire.

## Vérifications de la répétition

Le test HTTP crée une partie à cinq familles, vérifie les liens de leurs fiches et ouvre un scrutin. Il ferme puis rouvre le stockage SQLite, vérifie la mise, le budget et le chrono restaurés et rejoint l’épilogue et le classement. Une partie du premier parcours sert de témoin. Les tests de rendu vérifient aussi les 129 compositions, le chargement des WebP et l’ordre de révélation de l’épilogue.

La projection a été contrôlée dans Chromium aux tailles 1920 × 1080 et 3840 × 2160. Les captures des étapes de croissance sont disponibles dans la galerie. L’essai avec cinq porte-paroles et un vidéoprojecteur reste à faire.
