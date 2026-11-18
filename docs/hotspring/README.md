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
- Le classement donne deux points au maximum par chapitre clôturé, deux pour la trajectoire et trois pour l’héritage lorsque les deux votes du final ont été joués. Les ex æquo partagent la victoire.

## Revue des visuels

- [Galerie de contrôle](galerie.html) avec les en-têtes, résultats, calques et captures. Ouvrir le fichier depuis une copie du dépôt.
- [Manifeste](manifeste-assets.json), [prompts utilisés](prompts-utilises.json), [briefs des chapitres](briefs-visuels.json) et [visuels temporaires](visuels-temporaires.md). Les statuts « validé » correspondent à des images générées et intégrées au brouillon. La validation artistique en projection est à faire.
- [Captures](captures/) rendues depuis des sauvegardes de test avec la vallée commune. Le script `node scripts/capture-hotspring.mjs` recrée les rendus 1080p et 4K. Il requiert ImageMagick.
- Les fichiers de la scène en cours utilisent des WebP. Le plan de la vallée et les calques présents sont partagés entre les phases. Le résultat démarre avec le panorama recomposé pendant le chargement de son plan fixe. Le mode de réduction des animations montre le plan de secours en vignette.
- Les personnages, enseignes diégétiques et détails situés conditionnellement appellent une revue visuelle. La communauté de la vallée reste fictive dans les textes et les briefs. Tester la cohérence des scènes qui la représentent avant une diffusion.

La révision d’intégration reste en brouillon jusqu’à la finition de la liste des visuels temporaires et à l’essai en salle.
