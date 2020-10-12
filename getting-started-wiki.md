# Set Up a Development Environment

To help contribute to VillagerDB, it is important to have your development environment properly configured. Please follow this guide to ensure your first Pull Request can go as smoothly as possible.

## Getting Started

Follow these steps to get started on setting up your development environment.

- Install [Docker](https://docs.docker.com/get-docker/) for your OS
- Fork VillagerDB so you have your own repository to experiment with
- (Optional) Set up an [SSH](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account) key on GitHub
- Using SSH:
  - Clone the origin: `git clone origin git@github.com:jefflomacy/villagerdb.git`
  - Clone your fork: `git clone forky git@github.com:<your_username>/villagerdb.git`
- Using GitHub/HTTPS:
  - Click the "Fork" button on GitHub
  - Locally clone your repo: `git clone https://github.com/<your_username>/villagerdb.git`
  - [Set the upstream repo](https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/syncing-a-fork)
- Create a .env file with the following values in the root of your project:
  ```
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  NODE_ENV=development
  ```

### Google Developer Console

VillagerDB uses Passport.js for user authentication. You will need to head to the [Google Developer Console](https://console.developers.google.com/) to set up your local environment.

- Login and click "Create Project"
- Set a project name (such as villagerdb) and leave organization empty
- Go to the API Library and search for the "Google People API" and enable it
- Go to Credentials and choose "Create Credentials" at the top of the page and choose "OAuth client ID"
- When/if prompted, click the "Configure a consent screen" button
- Choose the "External" radio button
- Fill out the required fields and click through the setup - this info will never be used in production
- Once that is complete, click on "Create Credentials" and "OAuth client ID" again
- Choose "Web Application" in the Application Type dropdown
- Name it whatever you want (ex. villagerdb)
- Enter `http://localhost` as the Authorized JavaScript Origins
- Enter `http://localhost/auth/google/redirect` as the Authorized Redirect URI
- Add the resulting Google Client ID and Google Client Secret in your .env file

## Starting the app

If you are having issues with the ElasticSearch container continuously restarting, try running the following command: `sysctl -w vm.max_map_count=262144`

Note: Depending on how your Docker usergroup is set up you may need to preface your docker commands with `sudo`.

- Run `docker-compose up -d --build` to build the app to start the dockers detached
- Assuming your Docker containers are running successfully, run the following commands:
  ```
  sudo docker exec villagerdb_app npm run build-js
  sudo docker exec villagerdb_app npm run build-css
  ```
- Leave the following watches running anytime you're developing:
  ```
  sudo docker exec villagerdb_app npm run watch-js
  sudo docker exec villagerdb_app npm run watch-less
  ```
- The first time you run your app and anytime the JSON is updated you'll want to re-index Redis: `./reindex.sh`
  - On Windows:
    ```
    sudo docker exec villagerdb_app bin/util build-redis-db
    sudo docker exec villagerdb_app bin/util build-search-index
    ```

If everything worked correctly, your app should be up and running! Head to `http://localhost:80` in your web browser to access the site.
