# Chroniques de la ville — 3 novembre 2026

Après révélation par la régie, l’écran public présente le récit de l’issue
retenue, son titre, son illustration et les variations réelles des indicateurs.
Au prochain Conseil, le dernier chapitre devient un bandeau compact au bas de
l’écran. Le bouton de lecture et les boutons de chapitre ouvrent les versions
complètes. Le système est commun aux skins et n’affiche pas les objectifs privés.

Les chroniques sont calculées depuis l’historique public enregistré, et non à
partir de la mémoire du navigateur. Elles persistent après rechargement et en
fin de partie. Les valeurs avant/après rendent visibles les plafonnements à 0
ou 10 et le retour au centre de Stabilité. Pour les archives anciennes sans
valeur avant résolution, l’interface annonce une évolution non archivée au lieu
de l’inventer.

Le catalogue comprend une nouvelle version 1.2.0 du scénario Hot Spring avec
vingt récits développés, titres et résumés. Les effets et les branches restent
identiques à 1.1.0 ; les sessions déjà créées conservent leur scénario figé et
bénéficient de l’affichage avec leurs textes d’origine. La proposition de
rééquilibrage V2 reste séparée et non intégrée.

Les illustrations de dilemme existantes sont utilisées par défaut ; aucune
nouvelle image d’après-décision n’a été générée. Les six colonnes Google Sheets
optionnelles permettent de fournir des titres, résumés et images propres à
chaque issue. Voir `import-narratif-google-sheets-v1.md`.

Validation ciblée : tests de chroniques (confidentialité avant révélation,
issue adverse jamais exposée, plafonnement, reprise, ancien scénario, huit
Conseils et fin de partie), import ancien/nouveau et validation des URLs,
projection et syntaxe UI. Construction Firebase réussie. La vérification
visuelle locale est bloquée : aucun navigateur local installé, téléchargement
de Chromium tronqué et navigateur distant sans accès au serveur local.
Aucune validation visuelle ni publication Firebase n’est affirmée ici.
