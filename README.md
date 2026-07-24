# Sécu'Cycle

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
  `DEFAULT_*` et balisage JSON-LD) est régénéré **au build de l'image**. Les contenus éditables depuis le dashboard
  admin et stockés en base (cases de la page d'accueil, **FAQ**) sont servis en direct pour les visiteurs, mais ne
  deviennent visibles pour les crawlers qu'au **prochain build/redéploiement Coolify**.
- **API à 1 worker** : en production l'API tourne avec un seul worker uvicorn (chaque worker charge sa propre copie
  du graphe de Bordeaux, ~0,5–1 Go ; le VPS ~3,8 Go sans swap est sensible à l'OOM). Le calcul d'itinéraire étant
  déporté hors de l'event loop, un worker async reste réactif.

### Points d'intérêt (POI)
Les POI (eau, toilettes, stationnement, réparation) sont stockés en base et servis par `GET /pois/` :
la carte ne dépend donc jamais d'Overpass à l'exécution. La table `map_pois` est créée automatiquement
par les migrations Alembic au démarrage du conteneur, mais **son remplissage n'est pas automatique**.

Tout se pilote depuis la page **Points d'intérêt** du dashboard admin : nombre de POI par catégorie,
bouton « Synchroniser maintenant », réglage de l'intervalle de synchronisation automatique (0 = désactivé)
et historique des récupérations (manuelle ou automatique, date, nombre de POI, nouveaux, supprimés, échecs).
Après un premier déploiement, il faut donc lancer une synchro depuis cette page pour peupler la carte.

La synchro interroge Overpass sur l'emprise du profil `GRAPH_PROFILE` actif (quelques minutes), met à jour
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
