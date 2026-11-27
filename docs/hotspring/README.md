# Les Colons de Hotspring

Campagne versionnée à cinq familles, de l’arrivée des chariots en 1872 au choix d’une charte en 1893. La sélection « Les Colons de Hotspring » crée une session propre au parcours.

Le catalogue propose la V1.2 par défaut. Les cinq jauges commencent à 5. Le panneau Stabilité affiche leur moyenne, soit 5,0 au départ. Les sauvegardes antérieures réutilisent leurs règles d’origine. En V1.2, l’animateur ouvre le vote et décide quand poursuivre. La [matrice des résultats](matrice-indicateurs-v1.2.md) détaille les décisions et chartes. Le [rapport de simulation](rapport-simulation-v1.2.md) contient les captures et les points à revoir en salle.

## Essai local

1. Démarrer le serveur avec `npm start`.
2. Ouvrir `/founders-setup.html?scenario=les-colons-de-hotspring` sur ce serveur, puis charger le catalogue avec la clé de régie locale.
3. Prévisualiser la campagne, nommer les équipes et créer la partie. Choisir « Séance standard » pour limiter le chapitre V à deux crises par séance.
4. Dans la régie, cliquer sur « Générer les fiches équipes », puis « Imprimer les fiches équipes ». Choisir A4 portrait et une échelle de 100 %. Chaque famille tient sur une page avec son QR et le rappel des règles. Un renouvellement remplace l’accès précédent. Les QR expirent 24 heures après création et peuvent être régénérés à une reprise.
5. Ouvrir la projection. La régie peut passer de la lecture à la négociation puis au vote. L’épilogue montre d’abord ce que les familles ont fait de la ville. La régie dévoile ensuite les vainqueurs, les scores et le détail des objectifs. Les commandes d’animation sont regroupées en haut de la régie.

Les cartes de rôle sont accessibles dans « Les équipes et leurs accès ». Choisir le nombre de diplomates par famille et imprimer en A4 portrait à 100 %. Chaque planche contient jusqu’à neuf cartes de 63 × 88 mm.

L’accueil « Games of Influence » donne accès aux univers. La régie de Hotspring regroupe les parties de la version courante, la création de parties et l’atelier de dilemmes. L’atelier enregistre la situation, la question et les deux issues comme brouillon privé. Les brouillons pourront être intégrés à une version de campagne après validation des règles et de l’équilibrage.

Pour déléguer l’animation, ouvrir « Inviter un animateur » depuis la régie de la partie. Enregistrer l’adresse du compte Google, puis transmettre le lien de la régie. L’invité peut animer cette partie, préparer ses fiches et ouvrir la projection. Le propriétaire peut remplacer l’adresse ou retirer l’accès depuis la même rubrique.

Dans le cadre « Pause et fin de partie », « Sauvegarder et suspendre la séance » conserve aussi un scrutin ouvert, ses mises, ses propositions et son chrono. Le bilan ne compte que les chapitres clôturés et la trajectoire. Au checkpoint du chapitre V, la régie peut reprendre les crises en réserve ou ouvrir le final. La variante d’une archive repart du checkpoint « Gouvernement choisi », avec les ressources et le panorama précédant le duel des chartes.

## Calibrage consigné pour le test

- Quand deux règles de sélection de D14 s’appliquent, la Confiance solide ou l’accord respecté choisissent D14A. Pour D20, quand le rail et la grande mine coexistent, la mine tient le rôle du principal employeur.
- Pour la crue et la pénurie d’eau, le moteur utilise un seuil de 2 à partir d’un risque de base de 1, puis compte les vulnérabilités et protections du chapitre V. Pour la mine et la banque, les marqueurs de présence déterminent l’éligibilité. Le détail des risques et l’ordre sont visibles en régie. Les scores égaux sont triés par numéro de dilemme.
- Le coût foncier privé du programme d’assainissement s’applique si ce coût et l’avantage du quartier planifié coexistent. Les bonus et pertes de jauge sortent de la résolution puis sont bornés entre 0 et 10.
- En qualification des chartes, une égalité au seuil des deux premières places ouvre un vote simple entre les chartes ex æquo. Le moteur actuel ne fournit pas de registre de Prestige public pour le départage prévu sous le Conseil des Fondateurs. Le test utilise le tour supplémentaire.
- Le total sur 18 points se compose de deux points au maximum par chapitre clôturé, deux pour la trajectoire, trois pour l’héritage si la charte a été choisie et trois pour le classement des fortunes finales. Les rangs 1, 2 et 3 valent respectivement 3, 2 et 1 point. Deux fortunes égales occupent le même rang et les rangs suivants tiennent compte du nombre de familles devant elles. Les familles à égalité au total le plus élevé partagent la victoire.

## Projection et revue des visuels

Pendant le Conseil, la projection montre la scène du dilemme à gauche et la proposition à droite. Lors de la révélation, la scène et la décision adoptées occupent ces mêmes emplacements. Au bilan, le Conseil découvre une illustration complète de la ville correspondant à son stade de croissance et aux décisions de la partie. Le MJ ouvre le chapitre suivant depuis la régie.

La [revue de projection](cinema/README.md) réunit les trajectoires, les illustrations et les vérifications. Le panneau « Carte de la vallée » reste accessible sur demande, y compris via « Commandes » pendant un bilan. La [galerie historique](galerie.html) conserve l’inventaire et les captures de l’ancienne présentation.

## Vérifications de la répétition

Le test HTTP crée une partie à cinq familles, vérifie les liens de leurs fiches et ouvre un scrutin. Il ferme puis rouvre le stockage SQLite, vérifie la mise, le budget et le chrono restaurés et rejoint l’épilogue et le classement. Une partie du premier parcours sert de témoin. Les tests de rendu vérifient aussi les 129 compositions, le chargement des WebP et l’ordre de révélation de l’épilogue.

La projection a été contrôlée dans Chromium aux tailles 1920 × 1080 et 3840 × 2160. Les captures des étapes de croissance sont disponibles dans la galerie. L’essai avec cinq porte-paroles et un vidéoprojecteur reste à faire.
