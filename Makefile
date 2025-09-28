.PHONY: build up down seed

build:
docker compose build

up:
docker compose up -d --build
docker compose logs -f --tail=50

down:
docker compose down

seed:
docker compose run --rm backend-node npm run seed
