#!/bin/sh
git pull origin master &&
touch public/.maintenance
docker stop villagerdb_app &&
docker-compose -f docker-compose-prod.yaml up --no-deps -d --build villagerdb_app &&
docker exec villagerdb_app bin/util delete-asset-cache
docker exec villagerdb_app npm run build-js &&
docker exec villagerdb_app npm run build-css &&
docker exec villagerdb_app bin/util build-redis-db &&
docker exec villagerdb_app bin/util delete-search-index && 
docker exec villagerdb_app bin/util build-search-index &&
rm public/.maintenance
