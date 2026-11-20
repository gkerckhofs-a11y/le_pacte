# Cosa Nostra — Régie de préparation

Cette tranche part de `deploy/firebase` au commit `6328b69`, qui contient l’accueil des univers et la régie Hotspring. La carte Cosa Nostra ouvre `/cosa-nostra`. Cette page reprend la connexion organisateur et les composants visuels de la préparation Hotspring. Elle permet d’importer la campagne V2, de relire ses trois issues par scène et d’enregistrer un parcours de 15 pivots et jusqu’à 10 crises. Par défaut, elle sélectionne les deux premières crises de chaque chapitre.

Le JSON d’origine reste dans la préparation privée de l’organisateur et conserve ses identifiants, textes, jauges, objectifs, marqueurs, briefs et épilogues. La régie affiche les ambitions uniquement après authentification. Les mises à jour utilisent une révision pour détecter les modifications simultanées. Aucun export de la campagne complète ne fait partie des fichiers publics du site.

## Répétition des Conseils

La régie définit, pour chaque dilemme, la variante POUR et la variante CONTRE. Le troisième choix reste dans la campagne privée. Le moteur refuse un couple qui écarte l’issue d’une ambition majeure. Les couples sont préremplis avec A/B, ou A/C si C porte le marqueur d’un pivot. Les organisateurs peuvent modifier les couples autorisés avant la création de la répétition.

La répétition fige les décisions éditoriales et crée un accès privé par famille. Elle réutilise les Conseils ordinaires, l’Influence, la réserve, les offres financières, les engagements et le départage du moteur. Les jauges de Chicago démarrent à 50/100 pour la recette. La projection emprunte le décor Mafia existant en attendant les illustrations propres à chaque scène. Le dernier Conseil clôt la répétition. La succession secrète reste une phase à intégrer et à tester.

## Audit des écarts avec Hotspring

| Élément | Moteur vérifié sur `6328b69` | Adaptation proposée |
| --- | --- | --- |
| Issues A/B/C | Le catalogue accepte `pour` et `contre`. Le moteur gère aussi des actions d’abstention, qui ne constituent pas une troisième issue. | Écrire, pour chaque dilemme, une question binaire et lier explicitement chaque camp à une issue source. Pour chaque pivot, inclure l’issue qui porte le marqueur ainsi qu’une alternative validée. La troisième issue reste au catalogue éditorial. Suivre le texte, les effets, le marqueur et le visuel à partir de la même correspondance. |
| Identifiants | Le catalogue impose un identifiant commençant par une lettre et le moteur refuse le point à l’ouverture du vote. | Conserver `01.04` comme identifiant source. Produire un alias d’exécution réversible comme `CN_01_04` et conserver la table de correspondance dans le scénario versionné. |
| Jauges et granularité | Les clés, le calibrage, la borne de 10 et le rendu de plusieurs écrans sont codés dans le moteur ou l’habillage des scénarios existants. Hotspring calcule aussi une Stabilité dérivée. | Ajouter au scénario Chicago les cinq clés PRO, EMP, POL, UNI, DIS et une échelle entière sur 100 à la lecture et à l’application des effets. Garder les valeurs de départ côté configuration jusqu’au calibrage. Diviser les variations par dix et les arrondir modifierait les effets et le passage du seuil 60. |
| Rôles | Le Maire ouvre le vote et son rôle peut évoluer à la clôture. L’abstention correspondante peut transférer le rôle de Shérif, qui arbitre les égalités ordinaires et certains choix du prochain Maire. L’historique conserve les deux titulaires à la clôture. | Mapper les noms vers « L’Homme du Maire » et « L’Homme du Commissaire ». Prendre les titulaires du dernier Conseil résolu pour le départage final, sous réserve des règles d’éligibilité. |
| Arrêt pendant un Conseil | Des mises sont engagées dans le vote. L’acceptation d’une offre financière applique le transfert immédiatement et l’enregistre. La pause et la sauvegarde prolongent une séance en cours. | Pour terminer le Conseil, attendre sa résolution. Pour l’annuler, définir la frontière des transactions à conserver. Un instantané à l’ouverture du Conseil pourrait restaurer l’Influence et les transactions de ce Conseil sans toucher aux accords antérieurs. L’arbitrage produit est requis avant d’ajouter cette transition. |
| Finale et score | La fin Hotspring utilise un parcours et un calcul de score propres à sa campagne. L’historique commun conserve choix et mises des Conseils résolus. | Ajouter une séquence Chicago distincte. Calculer les petits objectifs à partir des issues adoptées et de l’Influence effectivement engagée. Pour les ambitions majeures, tester la neutralisation avant que chaque famille ait eu une occasion, puis la comparaison sur un nombre commun d’occasions. Valider les seuils et le départage après simulation. |
| Bulletins et révélation | Les vues de projection, famille et régie sont séparées. Le Conseil expose publiquement les positions et mises. | Stocker les bulletins de succession côté serveur, avec un bulletin immuable par famille, sans autovote. Avant révélation, seul l’accusé de réception est visible par le votant. Tester l’isolement des vues, puis révéler les scores agrégés et l’épilogue. |
| Médias | Le JSON V2 fournit des briefs et références, sans les fichiers finaux. | Conserver les références par identifiant et par issue, y compris les issues placées en réserve. Brancher les fichiers 16:9 après production et validation des deux issues jouables. |

### Exemple vérifié sur le moteur

Sur un pivot de test dont le marqueur se trouve sur C, la correspondance **POUR → C**, **CONTRE → A**, **B en réserve** conserve le vote binaire. Le test joue les deux résultats avec cinq familles, vérifie le rejet d’un bulletin direct « C » et confirme que seul le bon résultat restitue le marqueur. Les textes, effets et visuels de chaque issue proviennent de la même entrée JSON. Les correspondances de la campagne réelle restent dans la régie et sont à valider avant leur utilisation en partie.

### Recette

Depuis l’accueil local, ouvrir Cosa Nostra, se connecter, importer le JSON V2 et enregistrer un parcours. Le test automatisé vérifie la validation, la limite de deux crises par chapitre, le rejet des accès joueur, l’isolement des comptes et le conflit d’écriture. Pour lancer le test ciblé avec le fichier original local, utiliser `COSA_NOSTRA_TEST_CAMPAIGN=/chemin/campagne.json node --test test/cosa-nostra-preparation.test.mjs`.

La campagne et les choix propres à l’organisateur restent privés. Le retrait du commit retire le bouton et la route tout en laissant les préparations privées stockées. La fusion vers `deploy/firebase` déclenche le déploiement de production et requiert l’accord de l’organisateur.
