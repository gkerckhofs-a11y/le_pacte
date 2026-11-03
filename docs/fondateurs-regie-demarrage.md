# Régie : connexion et lancement — 3 novembre 2026

## Problème observé

Sans session Google connectée, la régie publiée conservait « Chargement… » et affichait un bouton ambigu « Se connecter / Actualiser ». Les commandes de partie n’étaient pas affichées avant authentification, sans parcours de démarrage explicite. Aucun refus du moteur de lancement n’a été reproduit sur la partie utilisateur ; son état n’a pas été avancé pour les vérifications.

## Parcours livré

1. Connexion : bouton « Se connecter avec Google », indication du compte à utiliser, erreurs de fenêtre bloquée ou de mauvais compte expliquées. La clé de répétition locale est absente de l’interface cloud.
2. Préparation : titre et code de partie, nombre d’équipes ayant choisi leur nom, lien de projection et grand bouton « Lancer la partie ». Le lancement fige les noms et ouvre le premier dilemme ; les noms par défaut restent autorisés.
3. Animation : une consigne explique s’il faut attendre une équipe, laisser le Shérif départager, révéler les conséquences, passer au dilemme suivant ou afficher le classement final.

« Mes parties » retrouve les sessions du compte connecté. Un lien sans identifiant permet de choisir sa partie après connexion. Le compte Google connecté est affiché et peut être changé.

Le lancement relit l’état avant d’envoyer la commande. Une modification simultanée de nom provoquant un conflit de révision autorise une seule relance. Une partie déjà lancée n’est pas relancée ; une erreur réseau ou un refus n’est pas retenté automatiquement. Les messages de lancement restent visibles près du bouton. Les autorisations existantes restent appliquées par le serveur.

## Validation ciblée

22 tests de syntaxe, HTTP et parcours de régie. Le test HTTP simule un nom enregistré entre la lecture et le lancement, puis vérifie l’ouverture de D01 et le droit de vote du Maire. Les tests couvrent aussi le démarrage concurrent, les erreurs et la limite des relances.

Dans le navigateur, une répétition locale distincte a été ouverte avec la nouvelle interface, lancée par le bouton puis retrouvée via le sélecteur sans identifiant. La vérification de connexion Google en production porte sur l’écran et ses libellés ; aucune connexion Google interactive n’a été effectuée à la place de l’utilisateur.

## Publication

Source applicative `b4320ef547f097a5cb4965de0b483b9ecfcebb85`. Hosting publié avec succès : version `177d80f951835f35`. Écran Google non connecté vérifié dans le navigateur publié : statut « Connexion requise », bouton « Se connecter avec Google » et absence du champ de clé locale. Les erreurs de connexion restent visibles jusqu’à une nouvelle tentative. Les permissions et le moteur serveur sont inchangés ; seul Hosting a été redéployé.
