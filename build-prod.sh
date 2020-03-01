#!/bin/sh
git pull origin master &&
docker stop villagerdb_webserver &&
docker stop villagerdb_app &&
docker-compose -f docker-compose-prod.yaml up --no-deps -d --build villagerdb_app &&
docker exec villagerdb_app bin/util build-redis-db && 
docker exec villagerdb_app bin/util delete-search-index && 
docker exec villagerdb_app bin/util build-search-index &&
docker-compose -f docker-compose-prod.yaml up --no-deps -d villagerdb_webserver
