# VillagerDB

## Introduction
VillagerDB is an attempt to organize as much metadata as we
can about Animal Crossing. The scope of this
project is all of the main series video games, including:
Animal Forest, Animal Forest +, Animal Crossing,
Animal Forest e+, Wild World, City Folk and New Leaf. When
New Horizons is released, it will also be included in this
list. 

The overall goal of this project is to catalog all 
metadata across all main series games. Currently, 
the database only includes information on villagers.

## Format
Part of the goal of this project is to keep all of the
metadata in an easily used and publicly accessible format.
We have selected JSON for this purpose. This application
loads all metadata from disk at launch into a Redis cache. In
the future, this is likely to be a Redis and ElasticSearch
dependent app, with a further dependence on MySQL for
features such as tracking wishlists of items.

## Long-term goals
Quite simply we aim for this database to be as complete as
possible, spanning villagers and items from every main
series game in the franchise. This is a daunting task 
that will take quite some time and dedication to complete. 
All contributions are welcome and are very helpful in 
making this dream a reality.

## License
All code as part of this application is licensed under GPLv3.
However, all JSON under the `data` folder is public domain.

## Contributing
Find bugs or want a feature? Submit a ticket and we will
investigate as time permits. Alternatively, send us a pull
request and we will discuss it with you. We look forward to
your help with this large project!

### Getting Started & Local Development

Ensure you have Docker installed \
Create Environments variables in an .env file in the root directory

```env
GOOGLE_CLIENT_ID=whatever.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
NODE_ENV=development
```

You will need to create a Google APIs project for the ClientID: \
Find People API \
Create Credentials \
Calling People API from webserver \
redirectURI `http://localhost/auth/google/redirect`


### Running VillagerDB Locally
You can then run
`docker-compose up`

When the application is running you will want to run 

```bash
sudo docker exec villagerdb_app npm run watch-js
sudo docker exec villagerdb_app npm run watch-less
sudo docker exec villagerdb_app npm run build-js
sudo docker exec villagerdb_app npm run build-css
```

To reindex your Redis & Elasticsearch
`./reindex.sh`