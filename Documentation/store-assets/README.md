# Visuels de fiche store

Génère les captures habillées pour l'App Store et Google Play à partir des
captures brutes de l'app. Le design est un **panorama** : le fond et le tracé de
route traversent les 5 slides comme une seule image, découpée ensuite slide par
slide. Départ sur la 1re, arrivée sur la dernière.

## Utilisation

Depuis la racine du dépôt (le premier lancement installe `playwright-core` ici) :

```bash
make screen                     # tous les formats
make screen ARGS="--ios"        # App Store 6,9" uniquement
make screen ARGS="--play"       # Google Play uniquement
make screen ARGS="--4-3"        # visuels 4:3 paysage uniquement
make screen ARGS="--square"     # visuels carrés uniquement
make screen ARGS="--ph"         # galerie Product Hunt uniquement
make screen ARGS="--og"         # image Open Graph uniquement

make screen ARGS="--strict"     # échoue si une capture manque dans raw/
```

Un flag inconnu fait échouer le script avec la liste des flags valides : une
faute de frappe ne peut plus produire zéro image en silence.

**Avant un upload réel, passe `--strict`.** Sans lui, une capture absente de
`raw/` est remplacée par un placeholder rayé et le script sort quand même en
succès — pratique pour relire le design, désastreux pour une fiche store.

Chaque format régénéré vide son dossier de sortie au préalable : pas de visuel
périmé qui traîne après avoir renommé ou réordonné une slide. Les formats *non*
demandés ne sont pas touchés.

Les textes de fiche store qui accompagnent ces visuels sont dans
[`../store-listing.md`](../store-listing.md).

Sortie dans `out/` (git-ignoré) :

| Fichier | Format | Destination |
|---|---|---|
| `out/ios/6.9/*.png` | 1290 × 2796 | App Store Connect |
| `out/play/phone/*.png` | 1080 × 1920 | Play Console |
| `out/play/feature-graphic.png` | 1024 × 500 | Play Console (obligatoire) |
| `out/4-3/*.png` | 1600 × 1200 (4:3) | usage libre (voir ci-dessous) |
| `out/square/*.png` | 1080 × 1080 | posts LinkedIn / Instagram |
| `out/product-hunt/*.png` | 1270 × 760 | galerie Product Hunt |
| `out/og-image.jpg` | 1200 × 630 | aperçu des liens partagés (`frontend-web`) |
| `out/panorama-*.png` | vue d'ensemble | contrôle visuel — **ne pas uploader** |

Les visuels `4-3/` sont en **paysage**, format demandé partout où le 9:16 des
stores ne passe pas : annuaires de produits (BetaList, Product Hunt), README,
site vitrine, slides de soutenance. `01-apercu.png` est l'image d'ouverture
(3 écrans côte à côte), les suivantes présentent une fonctionnalité chacune.
Textes et cadrage se règlent dans l'objet `landscape` de `slides.config.mjs`.

(Le dossier s'appelle `4-3` et non `4:3` : les deux-points cassent le montage sur
Windows et pas mal d'outils.)

`og-image.jpg` est à servir depuis `frontend-web` et à déclarer dans le `<head>` :

```html
<meta property="og:image" content="https://…/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
```

Ouvre `panorama-ios.png` avant chaque upload : c'est là qu'on voit si le tracé se
raccorde bien d'une slide à l'autre.

## Prendre les captures brutes

Dépose-les dans `raw/` sous les **noms de base** attendus par `slides.config.mjs`
(`carte`, `navigation`, `signalement`, `poi`, `detail`, `profil`, `historique`).

**L'extension est libre** : `.png`, `.webp`, `.jpg` ou `.jpeg`, le générateur
trouve le fichier tout seul. `carte.png` et `carte.jpg` marchent aussi bien l'un
que l'autre — inutile de convertir quoi que ce soit ni de toucher à la config.
Si les deux existent, le PNG est retenu (sans perte) et le générateur le dit.

Tant qu'un fichier manque, le générateur met un placeholder à sa place — le
design reste relisible.

Depuis un téléphone Android branché en USB (débogage activé), à la racine du dépôt :

```bash
adb exec-out screencap -p > Documentation/store-assets/raw/carte.png
```

Ou depuis un émulateur Android Studio (AVD Pixel, 1080 × 2400).

Le ratio d'origine importe peu : les captures sont recadrées en `object-fit:
cover` dans un châssis 9/19.5. Évite juste les captures en paysage.

## Modifier le contenu ou le design

- **Textes, ordre, nombre de slides** → `slides.config.mjs`. Un mot entre
  astérisques passe en accent dégradé : `le plus *sûr*`.
- **Design** (couleurs, typo, châssis, tracé) → `template.mjs`, en CSS.
- **Formats de sortie** → `targets` dans `slides.config.mjs`.

Ajouter ou retirer une slide recalcule automatiquement le tracé : il reste
continu quel que soit le nombre de slides. Google Play plafonne à 8 captures,
l'App Store à 10.

## À savoir

- Le rendu passe par `playwright-core` branché sur le **Chrome système**
  (`channel: 'chrome'`) : aucun navigateur n'est téléchargé à l'install.
- La police **Inter** est embarquée : les woff2 viennent de `@fontsource/inter`
  (dans `node_modules`, rien à committer) et sont injectés en `@font-face`
  data-URI. Le rendu ne dépend donc pas des polices installées sur la machine —
  deux coéquipiers obtiennent les mêmes visuels au pixel près.
- `frontend-mobile/app.config.js` déclare `ios.supportsTablet: false` : Apple n'exige donc que le
  6,9" iPhone. Si l'app repasse un jour sur iPad, il faudra **aussi** un jeu de
  captures iPad 13" (2064 × 2752) — à ajouter dans `targets`, sans quoi la
  soumission est refusée.
