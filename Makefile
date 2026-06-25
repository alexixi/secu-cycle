COMPOSE      = docker compose --env-file backend/.env
COMPOSE_PROD = $(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml

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

.PHONY: all api api-background api-build api-stop web web-docker web-install mobile mobile-install appli install logs shell stop down clean prod deploy deploy-static
