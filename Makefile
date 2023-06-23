.PHONY: dev build backend web

export NETWORK=100000
export PORT=3000
export WORKERS=5

export VITE_API_URL=localhost:3000

dev: backend web

build:
	docker compose build

backend:
	@echo "Run backend" 
	@cd api && npm i && \
	node server.js &

web:
	@echo "Run frontend" 
	@cd web && npm i && \
	npm run dev &
