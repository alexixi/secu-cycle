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
