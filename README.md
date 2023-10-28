# Project Setup
## Prerequisites
1. VPN
2. AWS IAM Account, AWS Access Key ID and Secret. Download aws cli and have it configured using the CLI command `aws configure`
If you don't have any of the above, create a ticket [here](https://jira-dn.atlassian.net/servicedesk/customer/portal/1)
3. Setup your ssh keys in your github account [here](https://github.com/settings/keys). More on how to generate your ssh key and add to your Github account [here](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

## To setup the project in local:
1. Clone the project using `git clone git@github.com:class21a/doubtnut_backend.git`. Typically create a directory called `doubtnut` in your machine and use it for cloning all the projects.
1. Be connected to VPN.
1. Create a file `.env.dev` in the `api_server` directory with the following content:
```
NODE_ENV=development
PORT=3000

## If you want to use database from Docker setup
# MYSQL_HOST_WRITE=localhost
# MYSQL_USER_WRITE=root
# MYSQL_DB_WRITE=classzoo1
# MYSQL_PASS_WRITE=root
# MYSQL_HOST_READ=localhost
# MYSQL_USER_READ=root
# MYSQL_DB_READ=classzoo1
# MYSQL_PASS_READ=root

REDIS_CLUSTER_HOSTS=localhost
KAFKA_HOSTS=localhost:29092

AWS_SECRET_NAME=dev/api-backend
AWS_SECRET_NAME_MYSQL=dev/testdb/test
AWS_DEFAULT_REGION=ap-south-1

```
1. Run `npm install` in `api_server` directory.
1. Run using `node index.js` in the api_server directory.

## Common issues
1. You might get an erorr - like `Access to KMS is not allowed`. In this case, get yourself added to the KMS users list that goes by the alias [dn-prod-cms](https://ap-south-1.console.aws.amazon.com/kms/home?region=ap-south-1#/kms/keys/f3234618-931d-482d-9048-14a93551628d)

# doubtnut_backend

Using flagr in Video API v13 - https://docs.google.com/document/d/1qfgQk5v0sAX0Etugy9GL_M1_9cpkt9KttJXWpCeA0y8/edit?usp=sharing

# PR Rules
PR title should give a clearn summary about the PR and the description should detail out everything about the PR. 

# Important Infrastructure Details
## Mongo Endpoints
mongo-prod-rs1-1 (172.31.29.247) - Primary
mongo-prod-rs1-2 (172.31.31.83) - Secondary
mongo-prod-rs1-3 (172.31.21.40) - Secondary
mongo-prod-rs1-4 (172.31.25.153) - Secondary
mongo-analytics (172.31.19.59) - Secondary
