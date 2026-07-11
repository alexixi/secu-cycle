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
déjà des tables mais pas la table `alembic_version`. Sans rien faire, le
conteneur crashe au démarrage sur `relation "..." already exists` : Alembic croit
la base vierge et rejoue la baseline. Le plus simple, si les données ne sont pas
précieuses, est de repartir de zéro avec `make clean`.

Sinon, il faut la marquer au baseline sans rejouer les `CREATE TABLE`, **puis**
rattraper la dérive :
```sh
make shell
alembic stamp head
alembic check
```
`stamp head` déclare la base à jour, mais ne vérifie rien : elle peut très bien
être en retard sur les modèles. C'est `alembic check` qui le dit, et il faut
corriger jusqu'à obtenir `No new upgrade operations detected.` :

- **table manquante** (`add_table`) : `create_all` ne crée que ce qui manque, sans
  toucher à l'existant.
  ```sh
  python -c "import models; from database import Base, engine; Base.metadata.create_all(bind=engine)"
  ```
- **colonne manquante** (`add_column`) : `create_all` n'a jamais su modifier une
  table existante — c'est justement l'origine de la dérive. Il faut du SQL, par
  exemple `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20);`
