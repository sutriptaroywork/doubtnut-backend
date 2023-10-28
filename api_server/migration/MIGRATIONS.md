# What are Migrations?
Any change in schema - adding/removing a table/column or changing the datatype are classified as schema migrations. Changes in static data within the database are also considered as data migrations. 

We cover schema migrations for now.

# Why Migrations?
To maintain a consistent state of the database structural changes and sync them across environments.

This would also enable a lot of downstream applications:
* Local dev environments
* Being able to run automated integration / unit tests on local as well as test environments.
* Keep a history of all past migrations

# Installation and initial setup
## Prerequisites
Mysql client should already be installed on the local machine.
See to it that you have a file `.env.dev` with the following contents:

### Setup the environment variables
```text
NODE_ENV=development
PORT=3000
AWS_SECRET_NAME=dev/api-backend
AWS_SECRET_NAME_MYSQL=dev/testdb/test
AWS_DEFAULT_REGION=ap-south-1
MYSQL_HOST_WRITE=127.0.0.1
MYSQL_USER_WRITE=root
MYSQL_DB_WRITE=classzoo1
MYSQL_PASS_WRITE=root
MYSQL_HOST_READ=localhost
MYSQL_USER_READ=root
MYSQL_DB_READ=classzoo1
MYSQL_PASS_READ=root
```
> The secrets loading process ensures that these variables override anything that you get from the secret manager.

### Setting up local MySQL
Now, to set up local MySQL, you can start a container user docker-compose. In the `api_server` directory, simply run
```shell
docker-compose up -d
```

This will start MySQL, Mongo, Redis and ElasticSearch. Then you can connect to the MysQL on your local simply by setting the host as `127.0.0.1` and username `root` and password `root` (specified in the `.env.dev` file as well)

### Load the initial schema
By importing schema.sql in your local mysql:
1. Connect to the Local MySQL using host `127.0.0.1`, username `root` and password `root`
1. Create a Database called `classzoo1` in your local server.
   ```shell
    mysql -u root -p -h "0.0.0.0" -e "create database classzoo1"
   ```

1. Import `api_server/migration/schema.sql` in classzoo1. For this you can run
   ```shell
   mysql -u root -p -h "0.0.0.0" classzoo1 < migration/schema.sql
   ```

### Typeorm setup
By default, when you run `npm install --only=dev `, `typeorm` will get installed.

Make sure you have ts-node installed.
> npm install -g ts-node

# Creating migration
In the `api_server` directory, run

> typeorm migration:create -n AReadableMigrationName

This will create a migration file with time prefix in the `api_server/migration` directory.

# Running migrations

Then run: 
```shell
npm run typeorm migration:run
```

This will create the migrations table (if it doesn't exist already) and run all the pending migrations.

# FAQs

### How does it work?
`typeorm` maintains the timestamp of last migration, and it's name in the database, in a table named `migrations`

Using this timestamp, and the timestamp of files generated using `add migration` command, this module is able to identify which migrations to run.

### Can migrations be run on production and staging using mysql-migrations?
No. That would be a bad idea. Staging - maybe. However, production migrations are run by the MyDBOps team using specialised tools like pt-osc etc. Migrations on staging are run by the devops team.

That is the reason the config has been hardcoded to with `127.0.0.1` as the host and `root` , `root` as username and password respectively.

The idea of these migrations is to sync the state of DB (mysql) for local (dev) environments and test environments.

These migrations also help to keep a track of all database changes that have been made in the past.

### Do I have to include all database changes here?
Yes. The source of truth for all DB changes is this. Any migration that has to be run, has to be shared with the devops team as a filename from this directory.

### To reset the docker container with fresh volume
1. Stop the container(s) using the following command:
docker-compose down
2. Delete all containers using the following command:
docker rm -f $(docker ps -a -q)
3. Delete all volumes using the following command:
docker volume rm $(docker volume ls -q)
4. Restart the containers using the following command:
docker-compose up -d
