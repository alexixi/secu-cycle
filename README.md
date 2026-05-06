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
Le projet est hebergé sur un VPS de la plateforme [IONOS](https://www.ionos.fr/). Le backend est déployé avec Docker et le frontend web est déployé avec Vite et hébergé via Nginx.
La connexion au VPS se fait via SSH.
Le site est accessible à l'adresse suivante : https://secu-cycle.fr/ (le nom de domaine a été acheté sur IONOS).

### Mise à jour du site
Pour mettre à jour la version du site, la démarche est la suivante :
```sh
# Se placer dans le dépôt du projet
cd secu-cycle

# Mettre à jour le dépôt local avec les dernières modifications du dépôt distant
git pull

# Lancer le déploiement en production
make prod
```

`make prod` lance la commande production du backend qui construit les conteneurs en mode production (plus de restrictions sur les ports) et la commande déploiement du frontend web qui fait un build du projet via Vite, deplace le build au bon endroit et donne les bonnes permissions pour que Nginx puisse y accéder.
