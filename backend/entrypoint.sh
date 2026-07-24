#!/bin/sh
set -e

mkdir -p /app/graphs
chown -R app:app /app/graphs 2>/dev/null || true

echo "[entrypoint] Application des migrations Alembic..."
gosu app alembic upgrade head

exec gosu app "$@"
