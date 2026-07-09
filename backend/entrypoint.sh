#!/bin/sh
# Applique les migrations en attente avant de lancer le serveur.
# `depends_on: db: service_healthy` garantit que Postgres accepte les connexions.
set -e

echo "[entrypoint] Application des migrations Alembic..."
alembic upgrade head

exec "$@"
