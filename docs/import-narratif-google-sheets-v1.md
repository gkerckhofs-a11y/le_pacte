# Import narratif Google Sheets → Le Pacte (contrat V1)
Date : 3 novembre 2026. **Spécification + données d'essai ; l'import automatique dans l'application n'est PAS encore codé.**

## Source maître
Google Sheets : https://docs.google.com/spreadsheets/d/1YevZlBCu6SD6nP5_jkCzWzR3BKKlRtwySbCUT_y291o/edit
Contenu de démonstration : 10 dilemmes, 46 effets, 20 branches. Tous sont `prototype`.

### Onglets
- `Mode_emploi` : consignes pour l'auteur.
- `Parametres` : métadonnées éditoriales (pas les chiffres de session).
- `Dilemmes` : une ligne par dilemme, deux libellés de vote, deux conséquences, et URL d'image optionnelle.
- `Effets` : une ligne par effet de l'issue `pour` ou `contre`, sur les cinq ressources de ville ou sa stabilité.
- `Branches` : exactement une ligne par combinaison (dilemme, issue). `FIN` signifie `next_id: null`.

## Cible JSON
Le fichier `content/fondateurs-sheet-sample-v1.json` suit `schemas/founders-story-v1.schema.json`. Les champs `notes_auteur`, `note_interne` et les choix de styles de l'éditeur ne sont pas publics.
- Version du contrat : 1.0.0, distincte de la version du jeu.
- `scenario` = identité éditoriale.
- `dilemmas[].outcomes.pour|contre` = texte de résultat, effets, cible du prochain dilemme.
- `image.url` vaut `null` tant qu'aucune image n'est sélectionnée.
- `status` Sheets `actif` / `archive` devient `active` / `archived` en JSON.

## Règles impératives pour l'importeur futur
1. Lecture authentifiée de **tous** les onglets au même instant logique.
2. Validation du JSON Schema ET contrôles référentiels : IDs uniques, entrée existante, deux issues complètes, cibles existantes ou FIN, aucune branche orpheline.
3. Les opérateurs sont uniquement `delta`, `toward_center`, `away_from_center`. Jamais d'évaluation de formule ou de code provenant d'une cellule.
4. Seules les images HTTPS sont admises (image accessible, autorisations et licences vérifiées avant publication).
5. Prévisualisation des différences et messages d'erreur par onglet/ligne ; **échec atomique** si une erreur bloquante existe.
6. Import de **tout le scénario d'un coup**, puis **publication d'un snapshot versionné**. Les parties démarrées restent fixées sur leur version.
7. Les 5 ressources, stabilité initiale, dollars, pouvoir, durée, objectifs secrets et paramètres des familles restent configurables en ligne et ne sont pas dupliqués dans ce Sheets.
8. Audit : heure, opérateur, ID du Google Sheets, nombre de dilemmes et checksum du snapshot.

## État de la chaîne narrative
Le premier vote mène à D02 (pour) ou D03 (contre) ; D05 mène à D06 (pour) ou D07 (contre). Les chemins se rejoignent ensuite. **Une partie parcourt huit dilemmes**, pas les dix. Aucun des textes/effets n'est encore équilibré par un test humain.

## Cohabitation avec la V1 territoriale
Ne pas modifier `src/engine.ts` ni `src/session.ts`. À ce stade, le prototype Founders `src/founders.ts` utilise une autre représentation des effets de jauges. Prévoir un adaptateur explicite lors du branchement futur ; ne pas insérer directement le JSON narratif dans les commandes territoriales.
