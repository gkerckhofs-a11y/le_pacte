# Tableau de bord opérateur Western — 3 novembre 2026

## Noms de famille

L’API publiée a accepté un enregistrement conservant le nom existant (HTTP 200). Le défaut exact rencontré par l’utilisateur n’a pas été reproduit à l’identique. Deux problèmes vérifiables du navigateur ont été corrigés : la saisie pouvait être remplacée lors d’une actualisation après perte de focus et le message global était effacé par le prochain rafraîchissement. Le chemin de récupération après erreur tentait aussi une actualisation alors que le verrou `busy` l’interdisait.

- Le brouillon reste présent pendant les actualisations et les changements d’onglet.
- Un message persistant à côté du formulaire confirme l’enregistrement ou décrit le refus.
- Le bouton est désactivé pendant l’envoi.
- Si une autre équipe a fait évoluer la révision, seul l’enregistrement du nom peut être retenté une fois, avec la révision courante. Les votes et transferts ne sont jamais retentés automatiquement.
- Une modification concurrente du nom de la même équipe, une couleur différente ou un Conseil déjà démarré interrompent la relance. Le brouillon reste disponible.
- Une réponse de consultation ancienne ne remplace pas l’état courant pendant/après une commande.

## Direction visuelle

Ambiance western commune : bois sombre, en-tête illustré de Hot Spring, panneaux de registre clairs, encre brune, boutons cuir et laiton. La couleur de famille est réservée à l’identité d’équipe, au filet supérieur et au repère de focus. Les autres univers conservent leur présentation.

## Noms définitifs des rôles

Décision utilisateur du 3 novembre 2026, qui remplace le premier choix de la même journée :

| Fonction | Nom affiché | Identifiant interne conservé |
|---|---|---|
| Mener le vote | Maire | leader |
| Départager les égalités | Shérif | moderator |

Boutons, instructions, règles, projection, régie et erreurs du moteur utilisent ces noms. Aucune mécanique de vote ni ressource n’a été modifiée.

## Validation ciblée

31 tests de syntaxe, identité, HTTP, thèmes, projection, vote et gestion des conflits d’enregistrement. Construction Firebase et vérification des bundles. Dans le navigateur : conservation du brouillon après changement d’onglet et actualisation d’une autre famille, enregistrement avec confirmation locale, lisibilité de la skin rouge et règles avec les rôles inversés. Le scénario navigateur de concurrence utilise une fixture locale, distincte de la partie de test utilisateur.

## Contrôle après publication

Source applicative : `e26d067543da738f51a653c76e4a87404e298913`. Déploiement Functions + Hosting réussi, suivi de la version finale Hosting `5cda65edb6deaab2`. Vérification du formulaire publié : enregistrement du nom existant avec confirmation persistante à côté du champ, sans renommer une famille de l’utilisateur. Vérification de la skin et des règles dans la session de démonstration publiée.
