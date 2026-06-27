COMPOSE = docker compose --env-file backend/.env
COMPOSE_PROD = $(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml

GRAPHS_VOLUME = secu_cycle_graphs_data
GRAPH_PROFILE_ACTIVE = $(shell grep -E '^GRAPH_PROFILE=' backend/.env | cut -d= -f2)

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

appli: api-background mobile

install: web-install mobile-install

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
	@test -n "$(GRAPH_PROFILE_ACTIVE)" || { echo "❌ GRAPH_PROFILE introuvable dans backend/.env"; exit 1; }
	@echo "♻️  Régénération du graphe '$(GRAPH_PROFILE_ACTIVE)' (volume $(GRAPHS_VOLUME))..."
	$(COMPOSE_PROD) down
	docker run --rm -v $(GRAPHS_VOLUME):/graphs alpine \
		rm -f /graphs/$(GRAPH_PROFILE_ACTIVE).graphml \
		$(if $(WIPE_IGN),/graphs/$(GRAPH_PROFILE_ACTIVE).ign.json,)
	$(COMPOSE_PROD) --profile web up -d --build
	@echo "🛠️  Graphe en cours de régénération au démarrage (Overpass + IGN, qq min)."
	@echo "    L'API ne répondra qu'à la fin du chargement. Suivi des logs (Ctrl-C = quitter le suivi, la régen continue) :"
	$(COMPOSE_PROD) logs -f api

.PHONY: all api api-background api-build api-stop web web-docker web-install mobile mobile-install appli install logs shell stop down clean prod deploy deploy-static regen-graph
