API_CONTAINER = fastapi_api

all: up

up:
	docker compose up

background:
	docker compose up -d

build:
	docker compose up --build

prod:
	docker compose -f docker-compose.yml up -d --build

stop:
	docker compose down

clean:
	docker compose down -v

logs:
	docker compose logs -f api

shell:
	docker compose exec api /bin/bash

.PHONY: all up build prod stop clean logs shell
