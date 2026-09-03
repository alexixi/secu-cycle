#!/bin/sh
set -e

mkdir -p /app/graphs
chown -R app:app /app/graphs 2>/dev/null || true

echo "[entrypoint] Application des migrations Alembic..."
gosu app alembic upgrade head

# Dernier filet avant de servir : le CI bloque déjà la fusion, ceci attrape ce
# qui l'aurait contourné (image reconstruite depuis une branche, correctif à
# chaud). Volontairement NON bloquant, contrairement aux migrations : un écart
# de catalogue dégrade, il ne corrompt pas. `t()` retombe sur le français puis
# sur la clé, alors qu'un schéma en retard casse les écritures. Refuser de
# démarrer l'API parce qu'un libellé anglais manque serait un mauvais échange.
echo "[entrypoint] Vérification des catalogues de traduction..."
gosu app python -m i18n.check || echo "[entrypoint] ATTENTION : catalogues incohérents, voir ci-dessus."

exec gosu app "$@"
