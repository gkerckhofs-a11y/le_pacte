# Les Colons de Hotspring

Campagne versionnée à cinq familles, de l’arrivée des chariots en 1872 au choix d’une charte en 1893. La sélection « Les Colons de Hotspring » crée une session propre au parcours.

## Essai local

1. Démarrer le serveur avec `npm start`.
2. Ouvrir `/founders-setup.html?scenario=les-colons-de-hotspring` sur ce serveur, puis charger le catalogue avec la clé de régie locale.
3. Prévisualiser la campagne, nommer les équipes et créer la partie. Choisir « Séance standard » pour limiter le chapitre V à deux crises par séance.
4. Dans la régie, vérifier les cinq fiches QR avant de les imprimer. Un renouvellement remplace l’accès précédent. Les QR expirent 24 heures après création et peuvent être régénérés à une reprise.
5. Ouvrir la projection. La régie peut passer de la lecture à la négociation puis au vote. L’épilogue précède le bouton de révélation des ambitions et du classement.

« Terminer la séance » sauvegarde aussi un scrutin ouvert, ses mises, ses propositions et son chrono. Le bilan ne compte que les chapitres clôturés et la trajectoire. Au checkpoint du chapitre V, la régie peut reprendre les crises en réserve ou ouvrir le final. La variante d’une archive repart du checkpoint « Gouvernement choisi », avec les ressources et le panorama précédant le duel des chartes.

## Calibrage consigné pour le test

- Quand deux règles de sélection de D14 s’appliquent, la Confiance solide ou l’accord respecté choisissent D14A. Pour D20, quand le rail et la grande mine coexistent, la mine tient le rôle du principal employeur.
- Pour la crue et la pénurie d’eau, le moteur utilise un seuil de 2 à partir d’un risque de base de 1, puis compte les vulnérabilités et protections du chapitre V. Pour la mine et la banque, les marqueurs de présence déterminent l’éligibilité. Le détail des risques et l’ordre sont visibles en régie. Les scores égaux sont triés par numéro de dilemme.
- Le coût foncier privé du programme d’assainissement s’applique si ce coût et l’avantage du quartier planifié coexistent. Les bonus et pertes de jauge sortent de la résolution puis sont bornés entre 0 et 10.
- En qualification des chartes, une égalité au seuil des deux premières places ouvre un vote simple entre les chartes ex æquo. Le moteur actuel ne fournit pas de registre de Prestige public pour le départage prévu sous le Conseil des Fondateurs. Le test utilise le tour supplémentaire.
- Le total sur 18 points se compose de deux points au maximum par chapitre clôturé, deux pour la trajectoire, trois pour l’héritage si la charte a été choisie et trois pour le classement des fortunes finales. Les rangs 1, 2 et 3 valent respectivement 3, 2 et 1 point. Deux fortunes égales occupent le même rang et les rangs suivants tiennent compte du nombre de familles devant elles. Les familles à égalité au total le plus élevé partagent la victoire.

## Revue des visuels

Le manifeste couvre 272 entrées. Le jeu charge 143 fichiers WebP, dont les 32 en-têtes, les 62 plans fixes des votes, les six chartes, les six ouvertures, trois variantes en image, 33 calques transparents et le fond de vallée. Les 129 autres entrées sont composées par le moteur. Les coordonnées du panorama restent les mêmes quels que soient les toits, les travaux, la densité, l’état de la rivière ou les traces de crise.

- La [galerie](galerie.html) associe les 129 compositions à des planches de contrôle et présente les sept captures de croissance. Les gros plans des planches sont des états de vérification. Les captures suivent une partie sur la terrasse et montrent aussi une ville fondée dans les terres basses.
- Les parcelles sont placées sur la même vue de la vallée, avec des ombres au pied des bâtiments et des rues propres à chaque site. Les tracés suivent le terrain sous les bâtiments. Les teintes de la rivière et les traces de crue suivent les berges.
- Les [crédits](manifeste-assets.json) et les [prompts utilisés](prompts-utilises.json) accompagnent les fichiers intégrés, dont les devantures, la charrette, les peupliers, la charpente et les débris ajoutés après la revue de la direction visuelle. Les entrées « validé » ont un fichier intégré ou un rendu du moteur contrôlable dans la galerie.
- Les repères de contexte apparaissent lorsque le dilemme et l’état de la partie les justifient. L’épilogue part du camp de 1872 et réutilise jusqu’à trois résultats effectivement joués, selon les décisions prises et les crises survenues. Le réglage de mouvement réduit affiche directement la ville finale.
- `node scripts/capture-hotspring.mjs --states` reproduit les captures 1080p et 4K, les planches et la galerie. ImageMagick est nécessaire.

## Vérifications de la répétition

Le test HTTP crée une partie à cinq familles, vérifie les liens de leurs fiches et ouvre un scrutin. Il ferme puis rouvre le stockage SQLite, vérifie la mise, le budget et le chrono restaurés et rejoint l’épilogue et le classement. Une partie du premier parcours sert de témoin. Les tests de rendu vérifient aussi les 129 compositions, le chargement des WebP et l’ordre de révélation de l’épilogue.

L’accès du navigateur de contrôle à la répétition locale a échoué. Les rendus du panorama en 1080p et en 4K sont disponibles dans la galerie. L’essai avec cinq porte-paroles et un vidéoprojecteur reste à faire.
