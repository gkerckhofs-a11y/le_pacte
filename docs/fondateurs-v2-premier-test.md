# Corrections du premier test — 18 novembre 2026

Source fonctionnelle : cahier des charges V2 fourni par l’organisateur le 18 novembre. Version jouable : `hot-spring-reserve-hybride@2.0.0`, cinq ou six familles. Les éditions historiques restent disponibles ; le nouvel écran de configuration sélectionne la V2 par défaut.

## Déroulement

Négociation (480 secondes), vote (180 secondes), résolution (20 secondes). Durées modifiables dans la régie avant le lancement et pendant la partie. La négociation et la résolution passent automatiquement à la phase suivante si l’option est activée. Le chrono du vote est indicatif : à zéro, l’avertissement apparaît et les familles terminent leurs décisions. Aucune décision politique ni aucun arbitrage ne sont inventés à l’expiration.

Premier passage de toutes les familles, camp verrouillé, abstentions définitivement sautées aux passages suivants. La clôture choisie pour compléter le cahier des charges est un circuit complet des familles votantes sans surenchère. Tout ajout d’Influence relance ce circuit. Le Shérif conserve les arbitrages d’égalité. Dès leur résolution, les effets et le résultat sont publiés automatiquement, une seule fois.

L’heure serveur pilote les transitions, vérifiées transactionnellement par les lectures et par la tâche Firebase existante. La pause bloque les décisions, fige le temps restant et permet une correction tracée des ressources. Les boutons ± 1 minute ajustent le chrono actuel ; enregistrer une durée configure les prochaines phases.

## Ville et conclusion

Quatre jauges : Économie, Écologie, Sécurité, Démographie. Les 40 issues des 20 dilemmes ont des effets explicites et des textes cohérents avec ces nouvelles jauges ; l’Écologie n’est pas un simple renommage du Développement. Les conditions d’accès à la réserve et les fragments de conclusion ont été adaptés. Les six ambitions proposées utilisent les quatre jauges. Ces effets et ambitions constituent une nouvelle calibration à éprouver en test humain.

Les seuils par défaut sont 2, 4, 6, 8 : critique, faible, stable, bon, excellent. Ils sont modifiables. La valeur, le libellé et la couleur restent visibles. À la résolution, une pastille distincte indique le delta effectif : positif en vert, négatif en rouge, zéro en gris. La variation utilise les valeurs réellement archivées avant/après, donc respecte les bornes de 0 à 10.

Le bouton séparé « Terminer la partie » demande confirmation et déclenche l’épilogue et les scores sur tous les écrans. Les mises d’un vote interrompu sont remboursées ; ce vote n’invente ni décision ni effet de ville. L’épilogue combine l’état final des quatre jauges et les décisions réellement prises. Les écrans de projection et de famille placent automatiquement le résultat final au premier plan.

## Négociations

Une proposition peut être envoyée pendant la négociation ou le vote, avec un message facultatif. La famille destinataire reçoit une fenêtre Accepter / Refuser. Le solde est revérifié lors de l’acceptation dans la même transaction que le transfert. La V2 rend ces propositions libres : aucun engagement de vote n’est créé, même si le commentaire contient une promesse. Les statuts sont visibles des deux familles et les offres en attente expirent à la résolution ou à la fin de partie.

## Fiches et QR

Un bouton génère toutes les fiches, une famille par A4. Chaque fiche contient le nom, la session, le QR individuel, les instructions, le plan réel de l’application et le rappel des rôles. Impression dédiée sur fond blanc, zone calme autour du QR de 58 mm.

La préparation et le clic d’impression vérifient chaque accès côté serveur, la famille authentifiée, le terminal, le nom courant et la session. Le client vérifie aussi l’origine, le chemin, la session, la famille et le jeton du lien. Il exige un accès unique et valide pour chaque famille ; un seul échec bloque l’ensemble. Un nom modifié ou un accès renouvelé invalide les fiches préparées. Les clés absentes ou expirées sont renouvelées au clic « Générer les fiches » ; les clés encore valides sont conservées. Les clés durent 24 heures après création ou renouvellement.

Le terminal vérifie le paramètre `family` contre l’identité réellement reçue. Son cache est séparé par session et famille pour éviter de réutiliser le terminal d’une autre équipe dans le même navigateur.

Les tests décodent les SVG insérés dans les fiches avec un lecteur indépendant après rasterisation, puis utilisent chaque lien pour ouvrir l’API du terminal et vérifier son identité. Ils couvrent cinq/six familles, révocation entre préparation et impression, expiration complète, rechargement, panne réseau, mauvais destinataire et changement de nom.

## Publication et nouveau test

`bash scripts/publish-founders.sh` installe les dépendances, lance les tests, compile et publie uniquement les fonctions du codebase `pacte` et Hosting. Il utilise l’authentification disponible, notamment celle de Cloud Shell, sans forcer une nouvelle connexion. Aucun changement de règle, index ou rôle Firebase n’est requis.

Après une publication vérifiée : `node scripts/reset-founders-test.mjs --reset-test` crée d’abord une nouvelle partie V2 à cinq joueurs, puis archive les parties narratives antérieures du compte organisateur nommé dans le script. Les états archivés sont conservés mais retirés de la liste et inaccessibles aux anciens liens. Les jetons privés ne sont jamais affichés ou enregistrés dans le dépôt. Le script affiche seulement les liens régie/projection de la nouvelle partie.

Validation locale : 229 tests réussis, compilation Firebase et vérification des bundles réussies. Les tests d’écran exécutent les modules réels dans un DOM simulé (configuration V2, projection, famille, régie, offres et épilogue). Aucun contrôle visuel des nouveaux écrans dans un navigateur réel n’a encore été effectué : le navigateur ne peut pas joindre le serveur local et la publication est bloquée par l’absence de connexion Firebase CLI. Le site en production n’a pas été remplacé le 18 novembre à ce stade.

La publication peut être lancée dans un Cloud Shell déjà connecté :

```sh
pacte_v2_dir=$(mktemp -d)
git clone --depth 1 --single-branch --branch feat/five-or-six-families https://github.com/gkerckhofs-a11y/le_pacte.git "$pacte_v2_dir"
bash "$pacte_v2_dir/scripts/publish-founders.sh" --reset-test
```

L’option `--reset-test` ne s’exécute qu’après la réussite de la publication et dans le même environnement Node 24. Elle utilise les identifiants applicatifs de Cloud Shell. Si elle échoue après publication, la V2 reste publiée et les anciennes parties restent accessibles jusqu’à la réussite de l’archivage. Aucun mot de passe ou code de connexion ne doit être envoyé dans la conversation.
