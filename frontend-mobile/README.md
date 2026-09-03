# Frontend Mobile

## Prérequis
- [Node.js](https://nodejs.org/) installé sur votre machine.
- L'application de développement installée sur votre smartphone (iOS ou Android).

## Installer les dépendances
```sh
make install
```

## Développement
### Lancer le projet en mode développement
```sh
make dev
```

Ouvrez l'application de dévloppement sur votre smartphone et scannez le QR code affiché dans le terminal pour voir l'application en action.

## Mises à jour OTA
Les changements **JavaScript et assets** sont livrés aux applications déjà installées sans repasser par les
stores, via [EAS Update](https://docs.expo.dev/eas-update/introduction/). La publication est **automatique**
par GitHub Actions : un merge sur `dev` alimente le channel `preview`, un merge sur `main` le channel
`production`. Les deux cibles locales ne sont qu'un secours :

```sh
make ota-preview   # publie sur le channel de recette (builds « preview »)
make ota           # publie en production
```

> ⚠️ Une modification **native** (dépendance native, config plugin, permission, icône/splash, module
> `modules/nav-notification`) ne peut pas passer en OTA : il faut bumper `version` dans `app.config.js`,
> rebuilder et resoumettre aux stores.

Le workflow le **détecte tout seul** : il compare l'empreinte native du commit à celle du dernier build Android
du même profil. Sur `main`, il lance un `eas build` au lieu d'un `eas update` quand elles diffèrent, et échoue
si `version` n'a pas été bumpée. Sur `dev`, il ne publie rien et se contente d'un avertissement : les builds
preview ne sont **jamais** rebuildés automatiquement, il faut lancer `eas build -p android --profile preview`
quand un test sur téléphone est nécessaire. Voir la section « Mises à jour de l'application mobile » du
[README racine](../README.md#mises-à-jour-de-lapplication-mobile-ota).

## Internationalisation

L'application est disponible en français et en anglais. Le sélecteur est dans **Paramètres →
Langue**, à trois positions : « Auto » suit la langue du téléphone, les deux autres la forcent.

Les catalogues vivent dans `i18n/locales/{fr,en}/`, un fichier par domaine, réunis en un
**namespace unique** par `i18n/catalogues.js` : la clé écrite dans le code est donc exactement
la clé du catalogue, ce qui la rend vérifiable statiquement.

```jsx
const { t } = useTranslation();
<Text>{t('parametres.langue.titre')}</Text>
<Text>{t('compte.historique.minutes', { valeur: 12 })}</Text>
```

Trois règles :

- **Dans un composant, toujours `useTranslation()`** — jamais `i18n.t` ni `i18n.language`. Le
  React Compiler est actif : une lecture hors du flux React peut ne pas être rejouée au
  changement de langue. `i18n.t` reste la bonne solution **hors** React (`services/`).
- **Pas de libellé dans une table au niveau module** : elle serait figée à la langue du
  chargement du bundle. Garder l'identifiant, traduire au rendu.
- **Les dates et les nombres passent par `useFormat()`** (ou `makeFormatters()` hors React), pas
  par `toLocaleDateString('fr-FR')` — et jamais par un `.replace('.', ',')`.

Avant de pousser :

```sh
node scripts/check-i18n.mjs   # ou `make check-i18n` à la racine, pour les trois plateformes
```

Il vérifie la parité fr/en, l'existence des clés appelées, et l'absence de texte français en
dur. Pour un cas légitime — nom propre, attribution de source, repli de compatibilité — poser
`// i18n-exempt: <raison>` sur la ligne précédente, ou encadrer par
`// i18n-exempt-start: <raison>` … `// i18n-exempt-end`. La raison est obligatoire.

> ⚠️ Le nom de l'application et les demandes de permission viennent de la clé `locales` d'
> `app.config.js` et suivent la **langue du système**, pas la préférence choisie dans
> l'application : iOS lit l'Info.plist avant tout code JS.
