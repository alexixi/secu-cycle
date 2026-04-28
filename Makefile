all: api-background web

api:
	$(MAKE) -C backend up

api-background:
	$(MAKE) -C backend background

api-build:
	$(MAKE) -C backend build

api-stop:
	$(MAKE) -C backend stop

web:
	$(MAKE) -C frontend-web dev

web-install:
	$(MAKE) -C frontend-web install

mobile:
	$(MAKE) -C frontend-mobile dev

appli: api-background mobile

mobile-install:
	$(MAKE) -C frontend-mobile install

install: web-install mobile-install

stop:
	$(MAKE) -C backend stop

down: stop

prod:
	$(MAKE) -C backend prod
	$(MAKE) -C frontend-web deploy
	@echo "🚀 Déploiement du Frontend terminé avec succès !"

deploy: prod

.PHONY: all api api-build api-stop api-background web web-install mobile mobile-install appli install stop down prod deploy
