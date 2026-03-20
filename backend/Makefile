all: up

up:
	docker compose up

background:
	docker compose up -d

build:
	docker compose up --build

stop:
	docker compose down

down: stop

.PHONY: all up build stop down background
