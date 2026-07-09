# Backend

## Prérequis
- [Docker](https://www.docker.com/)
- [Python](https://www.python.org/)

## Build les images Docker
```sh
make build
```

## Lancer les conteneurs Docker

### En premier plan
```sh
make up
```

### En arrière plan
```sh
make background
```

## Arrêter les conteneurs Docker
```sh
make down
```

## Migrations de base de données (Alembic)

Les modèles SQLAlchemy (`models/`) sont la source de vérité du schéma, et
`alembic/versions/` en est l'historique versionné. `entrypoint.sh` lance
`alembic upgrade head` avant uvicorn : les migrations s'appliquent donc toutes
seules au démarrage du conteneur, en dev comme en prod.

### Après avoir modifié un modèle
```sh
make shell
alembic revision --autogenerate -m "description du changement"
```
Relire le fichier généré dans `alembic/versions/`, puis le commiter. Le prochain
démarrage du conteneur l'appliquera.

`alembic check` signale si le schéma de la base diverge des modèles.

### Bascule d'une base existante vers Alembic (une seule fois)
Une base créée avant Alembic (par l'ancien `Base.metadata.create_all`) contient
déjà les tables mais pas la table `alembic_version`. Il faut la marquer au
baseline sans rejouer les `CREATE TABLE` :
```sh
make shell
alembic stamp head
alembic check   # doit afficher "No new upgrade operations detected."
```
Si `alembic check` signale des colonnes manquantes, c'est de la dérive laissée
par `create_all` (qui n'a jamais su modifier une table existante) : les ajouter
à la main en SQL, puis relancer `alembic check` jusqu'à ce qu'il soit propre.
