all: dev

start: dev

install:
	npm install

dev:
	npm start

ota-preview:
	APP_VARIANT=preview npx eas update --branch preview --environment preview \
		--message "$$(git log -1 --pretty=%s)"

ota:
	APP_VARIANT=production npx eas update --branch production --environment production \
		--message "$$(git log -1 --pretty=%s)"

.PHONY: all start install dev ota-preview ota
