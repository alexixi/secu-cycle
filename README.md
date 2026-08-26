# Sécu'Cycle
[Sécu'Cycle](https://secu-cycle.fr/) est une application web et mobile qui calcule des itinéraires cyclables sécurisés, en tenant compte de la qualité des infrastructures et des accidents corporels recensés. 


### Prérequis
- [Make](https://www.gnu.org/software/make/)
- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/en/download/)
- [Python](https://www.python.org/downloads/)

### Architecture
Le backend est codé en Python. L'api est développée avec le framework FastAPI, la base de données est gérée avec SQLAlchemy, le calcul de graph est réalisé avec NetworkX et OSMnx.
Le frontend web utilise React et Vite et le frontend mobile est développé avec React Native et Expo.
L'api et la base de données sont conteneurisées avec Docker


### Installation des dépendances du frontend (web et mobile)
```sh
make install
```

### Lancement
#### Lancer le backend
Cette commande lance l'api et la base de données dans des conteneurs Docker.
```sh
make api
```

Pour lancer l'api en arrière plan (pour qu'elle ne bloque pas le terminal), utilisez la commande suivante :
```sh
make api-background
```

#### Lancer le frontend
Cela lance en local avec Vite le frontend web en version de développement sur http://localhost:5173.
```sh
make web
```

#### Lancer le frontend mobile
Cette commande lance le projet mobile en mode développement avec Expo. Vous pourrez ensuite scanner le QR code affiché dans le terminal avec l'application de développement sur votre smartphone pour voir l'application en action. Attention, assurez-vous que votre smartphone et votre ordinateur sont connectés au même réseau Wi-Fi pour que cela fonctionne.
```sh
make mobile
```
Vous devez avoir au préalable installé l'application de dévloppement sur votre téléphone. Étant doné que l'application utilise la librairie de carte Maplibre, vous ne pouvez pas utiliser l'application de développement clé en main Expo Go, mais bien installé une version dev.

#### Lancer le backend + frontend
Cette commande permet de lancer d'un seul coup le backend en arrière-plan et le frontend web en mode développement. Équivaut à `make api-background` + `make web`.
```sh
make
```

#### Lancer le backend + frontend mobile
Cette commande permet de lancer d'un seul coup le backend en arrière-plan et le frontend mobile en mode développement. Équivaut à `make api-background` + `make mobile`.
```sh
make appli
```

### Arrêter les services
Cette commande arrête tous les conteneurs Docker liés à l'api et à la base de données. Cette commande est utile pour arrêter proprement les services backend et éviter de laisser des conteneurs en cours d'exécution, surtout si on a lancé l'api en arrière-plan.
```sh
make stop
```


## Déploiement
Le projet est hébergé sur un VPS de la plateforme [IONOS](https://www.ionos.fr/), orchestré par
[**Coolify**](https://coolify.io/) (PaaS auto-hébergé qui construit les images Docker directement à partir du
dépôt et gère les stacks, les domaines et le TLS). Le nom de domaine `secu-cycle.fr` a été acheté sur IONOS,
et les enregistrements DNS (dont les sous-domaines) sont gérés dans l'interface IONOS.

Le site public est accessible à l'adresse https://secu-cycle.fr/.

> **Note :** l'ancien flux de déploiement par `make prod` / SSH n'est **plus utilisé en production**. Les cibles
> `make` (`make api`, `make web`, `make admin`, `make mobile`…) ne servent plus qu'au **développement local**.
> Les cibles `prod` / `deploy` du `Makefile` sont conservées en secours mais ne reflètent plus la prod.

### Organisation dans Coolify
Chaque brique est une **ressource Coolify distincte**, avec son propre domaine, son build à partir du `Dockerfile`
correspondant, et ses propres variables d'environnement (définies dans l'UI Coolify, pas dans un `.env` versionné) :

- **API** (backend FastAPI) — `backend/Dockerfile`.
- **Frontend web** (React/Vite servi par Nginx) — `frontend-web/Dockerfile`.
- **Dashboard admin** (React/Vite servi par Nginx) — `frontend-admin/Dockerfile`.
- **Umami** (mesure d'audience) — service séparé sur `analytics.secu-cycle.fr` (voir la configuration analytics).

### Mise à jour du site
Le déploiement est **automatique au push Git** : Coolify écoute le dépôt via un webhook et **reconstruit puis
relance la ressource concernée** dès qu'un commit arrive sur la branche suivie. Concrètement, mettre à jour la
prod revient à **fusionner / pousser sur la branche de production** — il n'y a plus de commande de déploiement à
lancer à la main.

En cas de besoin, un **redéploiement manuel** reste possible depuis l'interface Coolify (bouton *Redeploy* de la
ressource), utile par exemple pour reconstruire le frontend sans nouveau commit.

À savoir sur le cycle de build :

- **Migrations Alembic** : elles s'appliquent **au démarrage du conteneur API** (le conteneur exécute `alembic
  upgrade head` avant de servir). Un nouveau déploiement suffit donc à migrer le schéma ; aucune commande manuelle.
- **Prérendu SEO (react-snap)** et **contenus bakés** : le HTML statique du frontend (ex. contenu par défaut
  `DEFAULT_*` et balisage JSON-LD) est régénéré **au build de l'image**. La **FAQ**, éditable depuis le dashboard
  admin et stockée en base, est servie en direct aux visiteurs mais ne devient visible pour les crawlers qu'au
  **prochain build/redéploiement Coolify**. Les cases de la page d'accueil ne passent plus par la base : leur
  texte vit dans le catalogue du site, précisément pour supprimer cet écart entre visiteurs et crawlers.
- **API à 1 worker** : en production l'API tourne avec un seul worker uvicorn, car chaque worker charge sa propre
  copie du graphe. Le coût mémoire suit la taille du `.graphml`, à raison d'environ **1,5 Gio par 100 Mo de
  fichier** : Bordeaux seul (105 Mo) tient dans ~1,8 Gio, Bordeaux + Tournai (126 Mo) dans ~2,1 Gio. Le VPS
  n'ayant que 3,8 Gio, c'est cette règle qui décide de l'emprise du graphe tenable — pas le confort. Le calcul
  d'itinéraire étant déporté hors de l'event loop, un worker async reste réactif.
- **Limites mémoire** : elles se règlent dans l'UI Coolify (*Resource Limits*), pas dans un compose, et ne
  prennent effet qu'au **redéploiement** du conteneur — « Save » seul ne les applique pas. Sans limite, un
  dépassement part en swap au lieu d'échouer : l'API répond alors avec des secondes de latence sans que rien
  n'alerte. Ne jamais **générer** un graphe sur le serveur de production : le pic de construction vaut
  plusieurs fois la taille du graphe fini, et il s'ajoute au graphe déjà chargé (voir « Profils de graphe »).

### Mises à jour de l'application mobile (OTA)
L'application mobile utilise [**EAS Update**](https://docs.expo.dev/eas-update/introduction/) : les changements
**JavaScript et assets** sont livrés directement aux applications déjà installées, sans rebuild ni resoumission
aux stores. Le passage par l'App Store et le Play Store n'est plus nécessaire que pour les modifications
**natives**.

La publication est **automatique au merge** (workflow `.github/workflows/mobile-ota.yml`), sur le même principe
que le site : aucune commande à lancer à la main. Le workflow ne se déclenche que si le commit touche
`frontend-mobile/`, et **choisit lui-même** entre publier un update OTA et lancer un build Android —
voir « Détection automatique » plus bas.

- **Branches** : un merge sur `main` alimente le flux **production** (binaires des stores), un merge sur `dev`
  alimente le flux **preview** (builds internes de recette).
- **Channels** : `production` (builds des stores), `preview` (builds internes de recette), `development`
  (dev clients). Un update publié sur un channel n'atteint jamais les autres.
- **Application côté téléphone** : l'update est téléchargé **en arrière-plan** au lancement et devient actif au
  **lancement suivant**. Le démarrage n'attend jamais le réseau (`fallbackToCacheTimeout: 0`) — une navigation
  en cours n'est jamais interrompue.
- **Publication manuelle** (recette ou secours) : `make ota-preview` / `make ota` depuis `frontend-mobile/`.

#### Ce qui exige quand même un rebuild et une resoumission
Le lien entre un update et les binaires compatibles est le `runtimeVersion`, calculé depuis le champ `version`
de `app.config.js` (policy `appVersion`). **Il faut bumper `version` puis rebuilder** dès qu'un changement
touche le natif :

- ajout, suppression ou mise à jour d'une **dépendance native** ;
- modification d'un **config plugin**, d'une **permission**, du nom, de l'icône ou du splash screen ;
- modification du **module natif local** `frontend-mobile/modules/nav-notification` (Kotlin) ;
- montée de version du **SDK Expo**.

Sans ce bump, l'update partirait vers des binaires qui n'embarquent pas le code natif correspondant, et
l'application planterait au démarrage.

#### Détection automatique
Le workflow ne se contente pas d'avertir : avant de publier quoi que ce soit, il calcule l'**empreinte
native** du commit (`eas fingerprint:generate`) et la compare à celle du **dernier build Android terminé sur
le même profil**, qu'EAS conserve pour chaque build.

La règle est **`dev` informe, `main` applique** :

| Empreinte native | `version` | `main` (production) | `dev` (preview) |
| --- | --- | --- | --- |
| identique | — | **update OTA** | **update OTA** |
| différente | bumpée | **build Android** (`eas build --no-wait`) | rien, avertissement ⚠️ |
| différente | inchangée | **échec du workflow** | rien, avertissement ⚠️ |
| aucun build de référence | — | **échec du workflow** | rien, avertissement ⚠️ |

Le cas « empreinte différente, `version` inchangée » est le garde-fou : un binaire natif neuf portant le même
`runtimeVersion` que celui déjà distribué rendrait tout update ultérieur dangereux pour les téléphones restés
sur l'ancien binaire.

**Aucun build preview n'est déclenché automatiquement.** Un binaire preview s'installe à la main sur quelques
téléphones ; en rebuilder un à chaque changement natif produirait surtout des artefacts que personne n'installe,
et qui expirent au bout de 30 jours sur EAS. Le workflow se contente donc d'un avertissement, sans passer au
rouge — un job rouge sur `dev` le resterait à chaque push tant que personne n'aurait rebuildé. Quand un test sur
téléphone est nécessaire : `eas build -p android --profile preview`.

Côté production, le build est lancé pour **Android uniquement** — il n'y a pas de compte Apple Developer à ce
jour — et **n'est pas soumis automatiquement** au Play Store : la soumission reste manuelle
(`eas submit -p android`) tant qu'aucun compte de service Google n'est configuré dans le bloc `submit`
d'`eas.json`.

> L'empreinte calculée en local diffère de celle du CI tant que le dossier `frontend-mobile/android/` existe
> sur la machine : il est gitignoré, donc absent aussi bien du CI que de l'archive envoyée à EAS Build. Cette
> comparaison n'a de sens que dans le workflow.

### Points d'intérêt (POI)
Les POI (eau, toilettes, stationnement, réparation) sont stockés en base et servis par `GET /pois/` :
la carte ne dépend donc jamais d'Overpass à l'exécution. La table `map_pois` est créée automatiquement
par les migrations Alembic au démarrage du conteneur, mais **son remplissage n'est pas automatique**.

Tout se pilote depuis la page **Points d'intérêt** du dashboard admin : nombre de POI par catégorie,
bouton « Synchroniser maintenant », réglage de l'intervalle de synchronisation automatique (0 = désactivé)
et historique des récupérations (manuelle ou automatique, date, nombre de POI, nouveaux, supprimés, échecs).
Après un premier déploiement, il faut donc lancer une synchro depuis cette page pour peupler la carte.

La synchro interroge Overpass sur l'emprise des données — le profil de graphe actif, ou celui que désigne
`DATA_PROFILE` (voir « Profils de graphe ») — pendant quelques minutes, met à jour
les POI existants et purge ceux qui ont disparu d'OSM. Elle est idempotente, tourne en tâche de fond et ne
nécessite aucun redémarrage. En cas d'échec Overpass, rien n'est écrit : la base reste inchangée et le run
apparaît en échec dans l'historique.

En recours (dashboard inaccessible), la synchro reste lançable en ligne de commande :

```sh
# Stack lancée par le compose du dépôt
make sync-pois

# Stack gérée par Coolify (le conteneur n'appartient pas au projet compose local)
docker exec <conteneur_api> python -m pois.sync
```

### Accidents de la route

Le score de sécurité d'un segment était jusqu'ici entièrement déduit d'OpenStreetMap : il décrivait ce à
quoi la rue **ressemble**, jamais ce qui s'y est réellement produit. Les accidents corporels officiellement
recensés apportent ce second signal. Ils sont stockés en base (`road_accidents`) et servis par
`GET /accidents/` en GeoJSON, comme les POI : la carte ne dépend jamais des sources amont à l'exécution.

Deux sources, choisies d'après les pays du profil de graphe actif (même détection que le géocodage,
« Tournai, Belgium » → `be`) :

- **France** — le dérivé [« Accidents de vélo »](https://www.data.gouv.fr/datasets/accidents-de-velo) des
  bases **BAAC** de l'ONISR (Licence Ouverte 2.0). On branche ce dérivé plutôt que les quatre CSV bruts :
  la jointure caractéristiques/lieux/véhicules/usagers et le filtrage « au moins un vélo » y sont déjà faits,
  les coordonnées sont déjà décimales, et son API accepte un filtre `bbox`.
- **Belgique** — [Statbel, « Géolocalisation des accidents de la circulation »](https://statbel.fgov.be/fr/open-data/geolocalisation-des-accidents-de-la-circulation-2017-2024)
  (CC BY 4.0), filtré sur les collisions impliquant une bicyclette. Coordonnées publiées en **Lambert 72**,
  reprojetées en WGS84 à l'ingestion.

Tout se pilote depuis la page **Accidents** du dashboard admin : comptage par source et par gravité,
millésimes couverts, bouton « Synchroniser maintenant », intervalle de synchronisation automatique
(en **jours** — ces bases ne sont republiées qu'une fois par an) et historique des récupérations.
Comme pour les POI, **le remplissage n'est pas automatique** : après un premier déploiement, il faut lancer
une synchro depuis cette page. En recours :

```sh
make sync-accidents
# ou, sous Coolify :
docker exec <conteneur_api> python -m accidents.sync
```

Trois partis pris méritent d'être connus, parce qu'ils sont contre-intuitifs :

- **La fenêtre temporelle est large (2015+), pas courte.** La tentation serait de ne garder que les années
  récentes. Mais la couverture du géocodage BAAC varie énormément d'une année à l'autre : sur Bordeaux
  intra-rocade, le dérivé compte 176 accidents géolocalisés en 2015 contre 15 en 2019, 4 en 2020 et 3 en
  2021 — sans qu'il se soit rien passé de tel sur le terrain. Une fenêtre courte ne donnerait pas une donnée
  « plus fraîche » mais un échantillon de quelques dizaines de points, dont la géographie refléterait surtout
  les aléas de saisie. C'est la **décroissance exponentielle** (demi-vie de 5 ans) qui fait le travail de
  recence, sans falaise arbitraire.
- **Le malus est plafonné à 1,5 point sur 10.** Les données ne comportent aucun dénominateur d'exposition
  (combien de cyclistes sont passés) : un axe cyclable très fréquenté cumule mécaniquement des accidents sans
  être plus dangereux au kilomètre parcouru. Un malus non plafonné pénaliserait donc les grands axes aménagés
  au profit de rues résidentielles désertes — l'inverse de l'effet recherché. Le malus est en outre normalisé
  par la longueur du segment et compressé logarithmiquement.
- **Le malus est soustractif, jamais un bonus.** Un segment sans accident recensé — ou situé dans une zone
  qu'aucune source ne couvre — garde exactement sa note d'infrastructure. Il n'y a donc aucun avantage à ne
  pas être couvert, ce qui serait le cas avec une normalisation entre segments.

Les deux sources sortent au même format après ingestion, mais **ne sont pas équivalentes** :

| | France (BAAC) | Belgique (Statbel) |
| --- | --- | --- |
| Période retenue | 2015 – 2023 | 2022 – 2024 |
| Date | jour exact | mois seulement (champ `date_precision`) |
| Granularité amont | une ligne par victime, regroupée sur `Num_Acc` | une ligne par accident, sans nombre de victimes |
| Filtre vélo | jeu déjà filtré, code VAE distinct | deux emplacements d'usager seulement, pas de code VAE |
| Identifiant | `Num_Acc` stable | aucun — empreinte SHA-1 synthétisée |
| Récupération | API avec filtre `bbox` | ZIP de 8 Mo, Lambert 72 à reprojeter |

La conséquence à connaître : les fenêtres temporelles différant, **un accident belge pèse en moyenne 2,1 fois
un accident français** (0,84 contre 0,40 après décroissance) — non parce qu'il serait plus grave (la gravité
moyenne belge est même légèrement inférieure), mais parce que les données belges sont toutes récentes. La
France accumule en retour trois fois plus d'années par segment, ce qui compense en partie. Les échelles de
malus ne sont donc pas strictement comparables d'un pays à l'autre ; le classement *à l'intérieur* d'un pays,
seul à piloter le routage, reste juste. Normaliser par pays corrigerait l'écart, mais récompenserait les pays
dont les données sont les plus lacunaires — c'est précisément ce qu'on cherche à éviter.

Le rattachement aux arêtes se fait au chargement du graphe (`graph/accidents.py`), avec un rayon de
tolérance de 25 m : au-delà, l'accident concerne une autre rue. Un accident accroché à `u→v` pénalise aussi
`v→u`, sans quoi le score dépendrait du sens de parcours. Une synchro réussie réactualise le graphe déjà
chargé et vide le cache d'itinéraires — pas de redémarrage nécessaire.

Enfin, ces données ne recensent que les **accidents corporels déclarés aux forces de l'ordre**. Les chutes
sans tiers sont très largement sous-déclarées, et le géocodage est plus lacunaire hors agglomération : le
signal est structurellement plus fiable en ville. La carte le dit explicitement à l'utilisateur plutôt que de
le masquer.

### Graphe de routage et profils

Les profils de graphe (nom + liste de communes) sont **stockés en base**. L'ancien `backend/graphs.json` a
été supprimé : embarqué dans l'image Docker, il aurait fait disparaître à chaque déploiement les profils
créés en production. Les profils historiques sont repris par la migration `15a5aa55f3f1`, qui les contient
en dur — une base neuve (prod, poste d'un coéquipier) est donc peuplée automatiquement.

C'est le profil marqué **par défaut** en base qui est chargé au démarrage. `GRAPH_PROFILE` ne sert plus que
d'amorçage, si aucun profil n'est marqué par défaut : la régler n'a plus d'effet en fonctionnement normal,
et une valeur laissée dans un `.env` est simplement ignorée. Sans cette priorité, un profil activé depuis le
dashboard serait silencieusement annulé au redémarrage suivant.

Tout se pilote depuis la page **Graphe** du dashboard admin : nombre de nœuds et d'arêtes du graphe chargé,
taille sur disque, carte de l'emprise (contours des communes), création de profils, ajout/retrait de
communes, génération du graphe et activation d'un profil.

Deux comportements à connaître :

- **Générer** un graphe supprime son `.graphml` avant de le reconstruire. C'est nécessaire : le chargement
  réutilise le fichier existant sans jamais comparer sa liste de communes, donc modifier un profil sans
  régénérer n'a aucun effet. La génération prend plusieurs minutes (Overpass puis altitudes IGN) et
  consomme beaucoup de mémoire. Le cache d'altitudes est conservé par défaut (c'est le poste le plus long).
- **Activer** un profil recharge le graphe à chaud, sans redémarrage. L'ancien graphe est libéré *avant* le
  chargement du nouveau, pour ne jamais en tenir deux en mémoire : en contrepartie, le calcul d'itinéraire
  répond `503` pendant 1 à 2 minutes.

L'emprise du graphe et celle des **données** (POI, accidents, éclairage) sont **découplables**. Le graphe doit
tenir en RAM ; les données ne coûtent que du disque, et les cartes thématiques d'une ville n'ont besoin que
d'elles — `routers/poi.py`, `accident.py` et `streetlight.py` ne consultent jamais le graphe. Restent liées au
graphe les couches qui ont besoin du réseau lui-même : le trafic (il projette la congestion sur les arêtes), la
météo, la qualité de l'air et la vigilance (leurs points de mesure sont tirés des nœuds par `sample_points`),
ainsi que les voies éclairées de `GET /streetlights/lit-roads` et, bien sûr, le calcul d'itinéraire. Un profil peut donc être marqué **« emprise des données »** depuis la page Graphe, indépendamment du profil
marqué « par défaut » : ses communes délimitent les trois synchros **et les vélos en libre-service**, et **son
graphe n'a besoin ni d'exister ni d'être généré**, seules ses communes sont lues. Les zones correspondantes
sont calculées par `graph.extent.data_zones()`, pendant de `graph_zones()` qui, lui, part des nœuds du graphe. Comme pour le graphe, la base fait autorité ; `DATA_PROFILE`
n'est qu'un amorçage tant qu'aucun profil ne porte le drapeau. Sans l'un ni l'autre, les données suivent le
profil de graphe actif. Cela permet de servir les cartes de plusieurs métropoles
avec un graphe restreint à celles où l'itinéraire est proposé. **Attention** : les trois synchros purgent tout
ce qu'elles n'ont pas rafraîchi, donc rétrécir cette emprise — ou laisser un petit profil de graphe la dicter —
efface les données des communes qui en sortent, et vide les pages thématiques correspondantes. Le changement
n'a d'ailleurs **aucun effet visible immédiat** : c'est la synchro suivante qui purge, d'où la confirmation
demandée par le dashboard. Pour la même raison, le profil qui porte le drapeau ne peut pas être supprimé sans
qu'un autre le reprenne.

Un profil peut couvrir **plusieurs zones sans continuité routière** entre elles. Overpass est alors interrogé
une fois par zone contiguë, et les graphes sont composés. C'est indispensable : osmnx n'envoie à Overpass
qu'une seule partie d'un MultiPolygon, si bien qu'un profil aux communes non limitrophes voyait toutes ses
zones disparaître sauf une, **sans le moindre avertissement**. Un itinéraire demandé d'une zone à l'autre
échoue proprement (« Aucun itinéraire trouvé »), ce qui est le comportement attendu. À l'intérieur de chaque
zone, seules les composantes fortement connexes d'au moins 500 nœuds sont gardées : cela écarte les îlots
parasites (impasses en sens unique, parkings isolés) sur lesquels un itinéraire pourrait s'accrocher sans
pouvoir en repartir.

### Recherche d'adresses (géocodage)

L'autocomplétion d'adresses passe par l'API (`GET /geo/search`, `GET /geo/reverse`) et non plus par des
appels directs des clients à la BAN. Ce détour permet de servir plusieurs pays, de garder la clé MapTiler
hors des bundles web et mobile, et de mutualiser un cache entre les deux.

Deux sources, choisies d'après les pays du profil de graphe actif (déduits du suffixe des communes,
« Tournai, Belgium » → `be`) :

- la **BAN** pour les adresses françaises : gratuite, sans quota, et faisant autorité ;
- **MapTiler** pour les lieux (« ENSEIRB-MATMECA », « CHU Pellegrin », absents d'un référentiel
  d'adresses) et pour les pays que la BAN ne couvre pas, dont la Belgique.

Les résultats sont **filtrés sur l'emprise du graphe chargé**, et non sur un seuil de pertinence.
Interrogée sur un lieu, la BAN ne répond pas « rien » mais renvoie du bruit à des centaines de kilomètres,
que son score ne permet pas d'isoler (« rue des lil » sort à 0.602 et est légitime, « Gare Saint-Jean » à
0.620 et ne l'est pas). La géographie, elle, tranche nettement — et un résultat hors du graphe est de toute
façon inutilisable, puisqu'on ne sait pas y calculer d'itinéraire.

Sur un profil **transfrontalier** (le profil `tournai` couvre Tournai et Mouscron, mais aussi Lille et
Roubaix), les deux sources sont interrogées puis **entrelacées**. Les concaténer avant de tronquer ne
marcherait pas : la BAN remplit à elle seule les cinq places et les résultats MapTiler seraient payés puis
jetés. Le score de la BAN sert alors, et seulement alors, à décider qui mène la liste — élevé (~0.98) elle a
reconnu l'adresse et passe devant, bas (~0.5) elle répond à côté et recule.

Les réponses sont mises en cache en base (`geocode_cache`, un an par défaut) : les préfixes tapés sont très
largement partagés d'un utilisateur à l'autre, ce qui fait tomber le nombre d'appels facturés. Une réponse
produite alors que MapTiler était indisponible ou hors budget n'est jamais mémorisée, pour qu'elle ne
survive pas à la remise à zéro du quota. La consommation mensuelle est comptée dans `geocode_usage` et
plafonnée par `MAPTILER_GEOCODING_BUDGET` : au-delà, la recherche se dégrade en « BAN seule » plutôt que
d'épuiser un quota **partagé avec les tuiles de la carte**, dont l'épuisement éteindrait la carte elle-même.

Variables d'environnement associées (backend) : `MAPTILER_KEY`, `MAPTILER_GEOCODING_BUDGET`,
`GEOCODE_CACHE_TTL_DAYS`. Sans clé, la recherche reste fonctionnelle en France mais se limite aux adresses.

### Couches temps réel : trafic, vélos en libre-service, qualité de l'air, météo, éclairage

Cinq couches alimentées par des sources externes rafraîchies en continu. Toutes suivent le même
principe de **sélection géographique** : une source n'est interrogée que si son emprise croise celle
du graphe chargé, jamais parce qu'elle est « nationale ».

- **Trafic** (`traffic/config.py`) — quatre portails Opendatasoft moissonnés toutes les 5 minutes :
  Bordeaux Métropole (`ci_trafi_l`), Eurométropole de Strasbourg (`sirac_flux_trafic`), Rennes
  Métropole (`etat-du-trafic-en-temps-reel`) et Nantes Métropole (`fluidite-axes-routiers`). Chaque
  portail publie son propre vocabulaire d'état (majuscules à Bordeaux, entier 0-3 à Strasbourg, enum
  DATEX II à Rennes) : `level_map` les ramène à une échelle unique green/orange/red/gray. Le malus de
  routage correspondant vit dans `graph/config.py`, pas ici. AVATAR (Cerema) a été **évalué puis
  écarté** — couverture trompeuse, vitesse renseignée dans 21 % des cas, latence de 31 s.
- **Vélos en libre-service** (`bikeshare/config.py`) — neuf systèmes GBFS français et belges (Le Vélo,
  Vélib', V'Lille, LE vélo STAR, Naolib, Vélo'v, Vélhop, Villo!, Blue-bike), atteints par
  auto-découverte (`gbfs.json`) : aucune URL de flux ni numéro de version en dur, ce qui permet
  d'ajouter un système sans savoir quelle version du standard il parle. Couche **informative**, sans
  effet sur le calcul d'itinéraire. La fraîcheur est mesurée sur *notre* dernière collecte réussie et
  non sur le `last_reported` publié, que plusieurs opérateurs laissent figé.
- **Qualité de l'air** (`air_quality/config.py`) — indice européen (EAQI) du **CAMS**
  (Copernicus Atmosphere Monitoring Service) via Open-Meteo, sur une maille d'environ 11 km,
  échantillonné le long du trajet. Complété par les stations au sol du **World Air Quality Index**,
  publiées sur l'échelle AQI américaine — deux échelles distinctes, affichées comme telles. Sans
  `WAQI_TOKEN`, seule la couche CAMS est servie.
- **Météo** (`weather/config.py`) — Open-Meteo (DWD ICON-D2 et Météo-France AROME sur notre emprise),
  rafraîchie tous les quarts d'heure. Trois horizons pour trois usages : les conditions courantes
  alimentent le bandeau de carte (température, vent, condition), relevées sur des **points placés
  par densité du réseau cyclable** (`graph/extent.py`, `sample_points`) — trois pour Bruxelles,
  vingt-quatre pour Bordeaux + Tournai, et le lecteur se voit servir le plus proche de lui.
  L'échelle reste celle d'un quartier, jamais la position exacte d'une averse ;
  `minutely_15` porte la promesse « pluie dans 15 minutes », et
  n'est demandé qu'à l'intérieur de la couverture ICON-D2/AROME, faute de quoi la source
  l'interpolerait depuis l'horaire **sans le signaler** ; la prévision horaire alimente les conseils
  d'équipement et la suggestion de décaler l'heure de départ. Les alertes (grêle, orage, verglas,
  rafales, gel) portent sur les **valeurs numériques**, jamais sur le code temps — sur le modèle mixé,
  `weather_code = 61` et `precipitation = 0.0` coexistent régulièrement, et s'y fier produirait des
  alertes fantômes à chaque cycle. Couche **informative** : elle n'entre pas dans le coût de routage.
- **Vigilance officielle** (`vigilance/config.py`) — deux sources **indépendantes**, une par pays,
  sur le registre de `traffic/` : la vigilance Météo-France par département (miroir Opendatasoft,
  donc la même API `explore/v2.1` que le trafic, sans clé) et les avertissements de l'IRM relayés
  par **MeteoAlarm** au format CAP pour la Belgique. Chacune a son emprise et peut échouer seule.
  Le rattachement d'une zone du graphe à un département ou à une province passe par un unique
  résolveur (`ISO3166-2-lvl6` de Nominatim : `FR-33`, `BE-WHT`), appelé une fois par zone puis mis
  en cache. Ces alertes sont fusionnées dans le résumé de `/weather/` et sont **les seules** à
  employer le mot « vigilance » : nos propres seuils n'ont pas l'autorité d'un institut, et le
  vocabulaire officiel le dirait à tort.
  Le vent corrige la durée *affichée* (`duration_wind`, posée à côté de `duration` après le cache) et
  les ponts d'au moins 30 m sont signalés sous 3 °C — un tablier gèle une à deux heures avant la
  chaussée voisine, faute d'inertie du sol.
- **Éclairage public** (`lighting/config.py`) — les lampadaires OSM (`highway=street_lamp`) couvrent
  toute la zone mais inégalement ; deux jeux open data les densifient : points lumineux de Bordeaux
  Métropole (`bor_ptlum`) et luminaires de Nantes Métropole.

L'inventaire complet des sources, avec usage, licence et producteur, fait l'objet de la page publique
[`/donnees`](https://secu-cycle.fr/donnees) et du § 1 de
`Documentation/opendata-reutilisations.md`, qui fait foi. Les attributions ODbL, Licence Ouverte,
CC BY 4.0, Copernicus et WAQI sont des **obligations de licence** : toute source ajoutée doit y être
répercutée, ainsi que dans les mentions légales.

### Internationalisation (français, anglais)

Chantier en cours. Le français reste la langue par défaut ; l'anglais s'ajoute à côté, sans
qu'aucune URL française existante ne change — les 56 pages `/carte/<ville>/<thème>` sont
indexées, et le préfixe `/fr` aurait cassé cette indexation.

**Côté API.** La langue de la réponse est négociée par requête, dans cet ordre : le paramètre
`?lang=` (il fait varier l'URL, donc il est sûr côté cache), puis l'en-tête `Accept-Language`
(CORS-safelisted, donc sans requête préliminaire OPTIONS), puis le français. Le module
`backend/i18n/` porte la négociation, le catalogue et la plomberie HTTP.

```bash
curl -H 'Accept-Language: en-GB' https://api.secu-cycle.fr/weather/?lat=44.84\&lon=-0.58
curl 'https://api.secu-cycle.fr/weather/?lat=44.84&lon=-0.58&lang=en'
```

Trois règles à ne pas contourner :

- **La couche de calcul émet des clés, la couche de sérialisation émet des mots.** Rien qui
  tourne dans une boucle de fond ni qui finit dans un cache ne doit porter un libellé déjà
  rendu — il n'y a pas de locale à cet endroit-là.
- **La locale entre dans l'empreinte des ETags** (`i18n.etag_for`). Sans cela, un client qui
  change de langue renvoie son `If-None-Match` précédent, reçoit un `304 Not Modified` et
  garde l'ancienne langue. C'est le chemin nominal, pas un cas limite.
- **Les attributions de sources ne se traduisent jamais.** « Licence Ouverte 2.0 »,
  « BAAC / ONISR », « Bordeaux Métropole » sont des noms légaux, identiques en anglais. Les
  laisser tranquilles garde `/pois/` et `/streetlights/` neutres en langue, donc insensibles
  au piège du cache partagé — ce sont les deux seules réponses servies en
  `public, max-age=3600`.

Le middleware `LocaleMiddleware` ajoute `Vary: Accept-Language` et `Content-Language` à toute
réponse. Il *ajoute* à `Vary`, il ne l'assigne pas : `GZipMiddleware` y a déjà mis
`Accept-Encoding` et `CORSMiddleware` `Origin`.

**Détection de session morte.** Les deux fronts décidaient de déconnecter l'utilisateur en
comparant le *message* du 401 (`SESSION_INVALID_DETAILS`). Traduire ces messages aurait cassé
la déconnexion silencieusement. L'API pose désormais un en-tête `X-Auth-Error:
session_invalid`, que les clients lisent en priorité ; il doit rester listé dans
`expose_headers` du `CORSMiddleware`, sans quoi le navigateur le masque.

**Vérifications.**

```bash
make check-i18n   # parité des catalogues fr/en (clés et paramètres) — sans pytest
make test         # suite de tests du backend (fonctions pures : ni base, ni graphe)
```

`make check-i18n` est le filet minimal : l'internationalisation échoue *silencieusement*, une
clé absente est servie telle quelle sans exception ni code d'erreur.

### Sécurité : limitation du débit (rate-limiting)
L'API limite déjà le débit des tentatives de connexion (`5/minute` par IP via `slowapi`).
En production, l'API tourne derrière Nginx avec plusieurs workers : le stockage en mémoire de
`slowapi` est par worker, et derrière le reverse-proxy l'IP vue est celle de Nginx si les
en-têtes ne sont pas transmis. Il est donc recommandé d'ajouter une limitation **au niveau Nginx**
(par IP réelle) en défense en profondeur :

```nginx
# Dans le bloc http { }
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Dans le bloc location de l'API (ex. /users/login)
location /users/login {
    limit_req zone=login_limit burst=5 nodelay;
    proxy_pass http://127.0.0.1:8000;
    # ... (proxy_set_header X-Forwarded-For, etc.)
}
```

Pour que `slowapi` voie l'IP réelle du client derrière Nginx, lancer uvicorn avec
`--proxy-headers --forwarded-allow-ips="127.0.0.1"` et transmettre `X-Forwarded-For` côté Nginx.

### Sécurité : audit des dépendances
Les versions des dépendances backend sont épinglées dans `backend/requirements.txt` pour des
builds reproductibles. Pensez à auditer régulièrement les vulnérabilités connues :

```sh
# Backend (Python)
pip install pip-audit
pip-audit -r backend/requirements.txt

# Frontends (Node)
cd frontend-web && npm audit
cd frontend-mobile && npm audit
```
