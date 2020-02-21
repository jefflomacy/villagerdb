#!/bin/sh
git pull origin master &&
sudo docker stop villagerdb_webserver &&
sudo docker stop villagerdb_app &&
sudo docker-compose -f docker-compose-prod.yaml up --no-deps -d --build villagerdb_app &&
sudo docker exec villagerdb_app bin/util build-redis-db && 
sudo docker exec villagerdb_app bin/util delete-search-index && 
sudo docker exec villagerdb_app bin/util build-search-index &&
sudo docker-compose -f docker-compose-prod.yaml up --no-deps -d villagerdb_webserver