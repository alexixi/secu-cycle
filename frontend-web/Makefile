WEB_DIR = /var/www/secucycle

all: dev

install:
	npm install

dev:
	npm run dev

host:
	npm run dev -- --host

build:
	npm run build

deploy: build
	sudo cp -r dist/* $(WEB_DIR)/
	sudo chown -R www-data:www-data $(WEB_DIR)
	sudo chmod -R 755 $(WEB_DIR)

.PHONY: all install dev host build deploy
