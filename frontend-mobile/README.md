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
