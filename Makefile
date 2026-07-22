COMPOSE = docker compose --env-file backend/.env
COMPOSE_PROD = $(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml

GRAPHS_VOLUME = secu_cycle_graphs_data

SCREEN_DIR = Documentation/store-assets
MAIL_PREVIEW = backend/.mail-preview/emails.html

all: api-background web

api:
	$(COMPOSE) up

api-background:
	$(COMPOSE) up -d

api-build:
	$(COMPOSE) up --build

api-stop: stop

web:
	$(MAKE) -C frontend-web dev

web-docker:
	$(COMPOSE) --profile web up -d --build web

web-install:
	$(MAKE) -C frontend-web install

mobile:
	$(MAKE) -C frontend-mobile dev

mobile-install:
	$(MAKE) -C frontend-mobile install

admin:
	$(MAKE) -C frontend-admin dev

admin-install:
	$(MAKE) -C frontend-admin install

appli: api-background mobile

install: web-install mobile-install admin-install

logs:
	$(COMPOSE) logs -f api

shell:
	$(COMPOSE) exec api /bin/bash

stop:
	$(COMPOSE) down

down: stop

clean:
	$(COMPOSE) --profile web down -v


prod:
	$(COMPOSE_PROD) down
	$(COMPOSE_PROD) --profile web up -d --build
	@echo "🚀 Stack déployée (API :8000, front nginx :8080 sur 127.0.0.1) !"

deploy: prod

deploy-static:
	$(MAKE) -C frontend-web deploy


regen-graph:
	@test -n "$(PROFILE)" || { echo "❌ Précisez le profil : make regen-graph PROFILE=bordeaux"; exit 1; }
	@echo "♻️  Régénération du graphe '$(PROFILE)' (volume $(GRAPHS_VOLUME))..."
	$(COMPOSE_PROD) down
	docker run --rm -v $(GRAPHS_VOLUME):/graphs alpine \
		rm -f /graphs/$(PROFILE).graphml \
		$(if $(WIPE_IGN),/graphs/$(PROFILE).ign.json,)
	$(COMPOSE_PROD) --profile web up -d --build
	@echo "🛠️  Graphe en cours de régénération au démarrage (Overpass + IGN, qq min)."
	@echo "    L'API ne répondra qu'à la fin du chargement. Suivi des logs (Ctrl-C = quitter le suivi, la régen continue) :"
	$(COMPOSE_PROD) logs -f api

sync-pois:
	@echo "🚰 Synchronisation des POI OSM (Overpass, qq min)..."
	$(COMPOSE) exec api python -m pois.sync

sync-accidents:
	@echo "🚑 Récupération des accidents corporels (BAAC / Statbel)..."
	$(COMPOSE) exec api python -m accidents.sync

screen:
	@test -d $(SCREEN_DIR)/node_modules || npm --prefix $(SCREEN_DIR) install
	npm --prefix $(SCREEN_DIR) run screenshots -- $(ARGS)

mail:
	@python3 backend/preview_emails.py
	@xdg-open $(MAIL_PREVIEW) >/dev/null 2>&1 \
		|| open $(MAIL_PREVIEW) >/dev/null 2>&1 \
		|| echo "   Ouvrez $(MAIL_PREVIEW) dans un navigateur."

.PHONY: all api api-background api-build api-stop web web-docker web-install mobile mobile-install appli install logs shell stop down clean prod deploy deploy-static regen-graph sync-pois sync-accidents screen mail
