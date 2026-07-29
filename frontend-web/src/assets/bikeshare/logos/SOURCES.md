# Logos des exploitants de vélos en libre-service

Affichés dans l'en-tête de la fiche station, à la place du pictogramme vélo générique.

Un fichier par système, **nommé d'après sa clé dans `backend/bikeshare/config.py`** (`SYSTEMS`) :
c'est cette clé qui arrive au frontend dans `properties.system`, et le rapprochement se fait
uniquement sur le nom de fichier. Ajouter une ville au registre puis déposer ici un
`<clé>.png` suffit — aucun code à toucher. Un système sans logo retombe sur le pictogramme.

Le même jeu est dupliqué dans `frontend-mobile/assets/bikeshare/logos/`, où il faut en plus
déclarer le `require()` dans `BIKESHARE_LOGOS` (Metro n'accepte pas de chemin dynamique).

Format : PNG à fond transparent, **hauteur 48 px**, largeur libre. Le CSS contraint la hauteur
et laisse la largeur suivre, les logos en bandeau (Vélib') comme carrés (Blue-bike) passent
donc sans recadrage. Les marges du fichier d'origine sont supprimées (`magick -trim +repage`)
pour que le logo remplisse sa tuile.

Villo! fait exception, et c'est délibéré : son logo est un bloc ambre plein, seule source disponible
en résolution suffisante — le favicon du site est détouré mais natif en 32 px et tronqué. Il reste
donc opaque et **non détouré** : `-trim` mordrait sur les marges ambre, qui appartiennent au bloc,
et tasserait le lettrage contre les bords.

Cette tuile est **blanche en dur**, sur les deux plateformes, et doit le rester : l'en-tête de la
fiche change de couleur avec la disponibilité, et la modale mobile a un thème sombre. Le V de
V'Lille est un détourage — du vide, pas du blanc — et prendrait la couleur de ce qu'il y a derrière ;
posé à même l'en-tête il deviendrait vert sur une station bien fournie.

## Provenance

| Fichier | Source | Statut |
|---|---|---|
| `paris-velib.png` | [Wikimedia Commons, `Vélib-Métropole-Logo.png`](https://commons.wikimedia.org/wiki/File:V%C3%A9lib-M%C3%A9tropole-Logo.png) | Domaine public (sous le seuil d'originalité) |
| `lille-vlille.png` | [Wikimedia Commons, `Logo V'Lille.svg`](https://commons.wikimedia.org/wiki/File:Logo_V%27Lille.svg) | Domaine public (sous le seuil d'originalité), marque déposée d'Ilévia |
| `lyon-velov.png` | [Wikimedia Commons, `Vélo'v 2024 logo.svg`](https://commons.wikimedia.org/wiki/File:V%C3%A9lo%27v_2024_logo.svg) | Domaine public (sous le seuil d'originalité) — charte 2024 |
| `rennes-velostar.png` | [Wikimedia Commons, `Logo STAR le vélo Rennes.svg`](https://commons.wikimedia.org/wiki/File:Logo_STAR_le_v%C3%A9lo_Rennes.svg) | Domaine public (sous le seuil d'originalité), marque déposée de la STAR |
| `nantes-naolib.png` | `https://naolib.fr/uas/NaolibParticuliers/LOGO/logo+naolib.svg` | Marque déposée de Nantes Métropole |
| `strasbourg-velhop.png` | `https://velhop.strasbourg.eu/wp-content/themes/velhop/assets/svg/logo-header.svg` | Marque déposée de Strasbourg Mobilités Vélo |
| `bruxelles-villo.png` | [fr.wikipedia, `Villo-logo.jpg`](https://fr.wikipedia.org/wiki/Fichier:Villo-logo.jpg) | Marque déposée de JCDecaux / Bruxelles-Capitale |
| `bordeaux-tbm.png` | `https://www.infotbm.com/favicons/android-chrome-512x512.png` | Marque déposée de Bordeaux Métropole / Keolis |
| `be-bluebike.png` | `https://blue-bike.be/wp-content/uploads/2025/08/cropped-Blue-bike-logo-PNG-hoge-kwaliteit-192x192.png` | Marque déposée de Blue-mobility |

Vélhop publie deux variantes : celle du **pied** de page est blanche, taillée pour un fond sombre, et
s'évanouit sur la tuile. C'est celle de l'**en-tête** qu'il faut. Le réflexe vaut pour tout logo à
venir : le vérifier sur blanc avant de l'installer, un aplat de la bonne couleur ne se voit pas.

Le standard GBFS prévoit pourtant un champ pour ça — `brand_assets.brand_image_url` dans
`system_information.json`, introduit en v2.3. **Aucun des neuf flux ne le publie**, ni en v1.0
(Rennes), ni en v2.3 (Blue-bike, Vélhop), ni en v3.0 (TBM, Vélo'v, Naolib, Villo!) : le champ est optionnel
et personne ne l'a repris. D'où ces fichiers déposés à la main.
Si un opérateur se met à le publier, le récupérer automatiquement deviendrait préférable à
cette copie locale, qui se périme silencieusement à chaque refonte de charte.

Les logos ne servent qu'à identifier les stations de leur propre exploitant. Ils ne sont ni
modifiés ni recolorés, seulement détourés et redimensionnés.
