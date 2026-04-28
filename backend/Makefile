API_CONTAINER = fastapi_api

all: up

up:
	docker compose up

down:
	docker compose down

background:
	docker compose up -d

build: down
	docker compose up --build

prod: down
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

clean:
	docker compose down -v

logs:
	docker compose logs -f api

shell:
	docker compose exec api /bin/bash

stop: down

.PHONY: all up down build prod clean logs shell stop
