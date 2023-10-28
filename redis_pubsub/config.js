"use strict";
const Joi = require('joi');

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: Joi.number()
    .default(3000),
  DEV_MYSQL_HOST: Joi.string().required().description('Mysql host'),
  DEV_MYSQL_USER: Joi.string().required().description('root'),
  DEV_MYSQL_DB: Joi.string().required().description('classzoo1'),
  DEV_MYSQL_PASS: Joi.string().required().description('root'),
  PROD_MYSQL_HOST_WRITE: Joi.string().required().description('Mysql host'),
  PROD_MYSQL_USER_WRITE: Joi.string().required().description('root'),
  PROD_MYSQL_DB_WRITE: Joi.string().required().description('classzoo1'),
  PROD_MYSQL_PASS_WRITE: Joi.string().required().description('root'),
  PROD_MYSQL_HOST_READ: Joi.string().required().description('Mysql host'),
  PROD_MYSQL_USER_READ: Joi.string().required().description('root'),
  PROD_MYSQL_DB_READ: Joi.string().required().description('classzoo1'),
  PROD_MYSQL_PASS_READ: Joi.string().required().description('root'),
  VDO_CIPHER: Joi.string().required().description('root'),
  TWO_FA_KEY: Joi.string().required().description('root'),
  DEV_REDIS_HOST: Joi.string().required().description('root'),
  DEV_REDIS_PORT: Joi.string().required().description('root'),
  PROD_REDIS_HOST: Joi.string().required().description('root'),
  PROD_REDIS_PORT: Joi.string().required().description('root'),
  REDIS_SECRET: Joi.string().required().description('root'),
  GOOGLE_KEYFILE: Joi.string().required().description('root'),
  GOOGLE_VISION_KEY: Joi.string().required().description('root'),
  JWT_SECRET: Joi.string().required().description('root'),
  CDN_URL: Joi.string().required().description('root'),
  BLOB_URL: Joi.string().required().description('root'),
  FIREBASE_BASE_URL: Joi.string().required().description('root'),
  DEV_MONGO_USER: Joi.string().required().description('root'),
  PROD_MONGO_USER: Joi.string().required().description('root'),
  DEV_MONGO_PASS: Joi.string().required().description('root'),
  PROD_MONGO_PASS: Joi.string().required().description('root'),
  DEV_MONGO_URL: Joi.string().required().description('root'),
  PROD_MONGO_URL: Joi.string().required().description('root'),
  DEV_MONGO_DB_NAME: Joi.string().required().description('root'),
  PROD_MONGO_DB_NAME: Joi.string().required().description('root'),
  DOUBTNUT_LOGO_PATH: Joi.string().required().description('root'),
  TEST_PROJECT_ID: Joi.string().required().description('root'),
  PRODUCTION_PROJECT_ID: Joi.string().required().description('root'),
  TEST_INSTANCE_ID: Joi.string().required().description('root'),
  PRODUCTION_INSTANCE_ID: Joi.string().required().description('root'),
  TEST_ZONE: Joi.string().required().description('root'),
  PRODUCTION_ZONE: Joi.string().required().description('root'),
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().required().description('root'),
  AWS_ACCESS_ID: Joi.string().required().description('root'),
  AWS_SECRET: Joi.string().required().description('root'),
  S3_BUCKET: Joi.string().required().description('root'),
  REDIS_PASS: Joi.string().required().description('root'),
  NEW_RELIC_KEY: Joi.string().required().description('root'),
  WA_APIKEY: Joi.string().required().description('root'),
  TELEGRAM_TOKEN: Joi.string().required().description('root'),
  BRANCH_KEY: Joi.string().required().description('root'),
  CLEVERTAP_ACCOUNT_ID: Joi.string().required().description('root'),
  CLEVERTAP_PASSCODE: Joi.string().required().description('root'),
}).unknown()
  .required();

const {error, value: envVars} = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}
const config = {
  env: (typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : envVars.NODE_ENV,
  port: envVars.PORT,
  caching: 1,
  mysql: {
    host: envVars.DEV_MYSQL_HOST,
    user: envVars.DEV_MYSQL_USER,
    password: envVars.DEV_MYSQL_PASS,
    database: envVars.DEV_MYSQL_DB,
    connectionLimit: 75,
    connectTimeout: 60 * 60 * 1000,
    aquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000
  },
  elastic: {
    ELASTIC_HOST: envVars.ELASTIC_HOST,
    REPO_INDEX: "doubtnut_new",
    REPO_INDEX_TYPE: "repository",
    ELASTIC_RESULT_SIZE: "20"
  },
  firebase: {
    base_url: envVars.FIREBASE_BASE_URL
  },
  vdo_secret: envVars.VDO_CIPHER,
  versions: {'Version 1': '/v1', 'Version 2': '/v2', 'Version 3': '/v3', 'Version 4': '/v4'},
  two_fa_key: envVars.TWO_FA_KEY,
  GOOGLE_KEYFILE: envVars.GOOGLE_KEYFILE,
  GOOGLE_VISION_KEY: envVars.GOOGLE_VISION_KEY,
  jwt_secret: envVars.JWT_SECRET,
  cdn_url: envVars.CDN_URL,
  blob_url: envVars.BLOB_URL,
  logo_path: envVars.DOUBTNUT_LOGO_PATH,
  GCE_CREDENTIAL: envVars.GOOGLE_APPLICATION_CREDENTIALS,
  aws_access_id: envVars.AWS_ACCESS_ID,
  aws_secret: envVars.AWS_SECRET,
  aws_region: 'ap-south-1',
  aws_signature_version: 'v4',
  aws_bucket: envVars.S3_BUCKET,
  wa_api_key: envVars.WA_APIKEY,
  telegram_token:envVars.TELEGRAM_TOKEN,
  branch_key:envVars.BRANCH_KEY,
  clevertap_account_id:envVars.CLEVERTAP_ACCOUNT_ID,
  clevertap_passcode: envVars.CLEVERTAP_PASSCODE
};
// const is_prod = 0;
if (config['env'] === 'development') {

  config['write_mysql'] = {
    host: envVars.DEV_MYSQL_HOST,
    user: envVars.DEV_MYSQL_USER,
    password: envVars.DEV_MYSQL_PASS,
    database: envVars.DEV_MYSQL_DB,
    connectionLimit: 75,
    connectTimeout: 60 * 60 * 1000,
    aquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
  }
  config['read_mysql'] = {
    host: envVars.DEV_MYSQL_HOST,
    user: envVars.DEV_MYSQL_USER,
    password: envVars.DEV_MYSQL_PASS,
    database: envVars.DEV_MYSQL_DB,
    connectionLimit: 75,
    connectTimeout: 60 * 60 * 1000,
    aquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
    // socketPath : '/var/run/mysqld/mysqld.sock',
  }
  config['read_mysql_prod'] = {
    host: envVars.PROD_MYSQL_HOST_READ,
    user: envVars.PROD_MYSQL_USER_READ,
    password: envVars.PROD_MYSQL_PASS_READ,
    database: envVars.PROD_MYSQL_DB_READ,
    connectionLimit: 75,
    connectTimeout: 60 * 60 * 1000,
    aquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
  }
  config['redis'] = {
    host: envVars.DEV_REDIS_HOST,
    port: envVars.DEV_REDIS_PORT,
    secret: envVars.REDIS_SECRET,
    password: envVars.REDIS_PASS
  }
  config['mongo'] = {
    database_url: envVars.DEV_MONGO_URL,
    database_name: envVars.DEV_MONGO_DB_NAME,
    database_user: envVars.DEV_MONGO_USER,
    database_pass: envVars.DEV_MONGO_PASS
  }
  config.project_id = envVars.TEST_PROJECT_ID
  config.instance_id = envVars.TEST_INSTANCE_ID
  config.server_zone = envVars.TEST_ZONE
} else if (config['env'] === 'production') {
  config['write_mysql'] = {
    host: envVars.PROD_MYSQL_HOST_WRITE,
    user: envVars.PROD_MYSQL_USER_WRITE,
    password: envVars.PROD_MYSQL_PASS_WRITE,
    database: envVars.PROD_MYSQL_DB_WRITE,
    connectionLimit: 75,
    connectTimeout: 60 * 60 * 1000,
    aquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
  }
  config['read_mysql'] = {
    host: envVars.PROD_MYSQL_HOST_READ,
    user: envVars.PROD_MYSQL_USER_READ,
    password: envVars.PROD_MYSQL_PASS_READ,
    database: envVars.PROD_MYSQL_DB_READ,
    connectionLimit: 100,
    connectTimeout: 60 * 60 * 1000,
    aquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
  }
  config['redis'] = {
    host: envVars.PROD_REDIS_HOST,
    port: envVars.PROD_REDIS_PORT,
    secret: envVars.REDIS_SECRET,
    password: envVars.REDIS_PASS
  }
  config['mongo'] = {
    database_url: envVars.PROD_MONGO_URL,
    database_name: envVars.PROD_MONGO_DB_NAME,
    database_user: envVars.PROD_MONGO_USER,
    database_pass: envVars.PROD_MONGO_PASS
  }
  config.project_id = envVars.PRODUCTION_PROJECT_ID
  config.instance_id = envVars.PRODUCTION_INSTANCE_ID
  config.server_zone = envVars.PRODUCTION_ZONE,
    config.newrelic_key = envVars.NEW_RELIC_KEY


} else if (config['env'] === 'staging') {
  config['write_mysql'] = {
    host: envVars.PROD_MYSQL_HOST_WRITE,
    user: envVars.PROD_MYSQL_USER_WRITE,
    password: envVars.PROD_MYSQL_PASS_WRITE,
    database: envVars.PROD_MYSQL_DB_WRITE,
    connectionLimit: 2,
    connectTimeout: 60 * 60 * 1000,
    aquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
  }
  config['read_mysql'] = {
    host: envVars.PROD_MYSQL_HOST_READ,
    user: envVars.PROD_MYSQL_USER_READ,
    password: envVars.PROD_MYSQL_PASS_READ,
    database: envVars.PROD_MYSQL_DB_READ,
    connectionLimit: 2,
    connectTimeout: 60 * 60 * 1000,
    aquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
  }
  config['redis'] = {
    host: envVars.PROD_REDIS_HOST,
    port: envVars.PROD_REDIS_PORT,
    secret: envVars.REDIS_SECRET,
    password: envVars.REDIS_PASS
  }
  config['mongo'] = {
    database_url: envVars.PROD_MONGO_URL,
    database_name: envVars.PROD_MONGO_DB_NAME,
    database_user: envVars.PROD_MONGO_USER,
    database_pass: envVars.PROD_MONGO_PASS
  }
  config.project_id = envVars.PRODUCTION_PROJECT_ID
  config.instance_id = envVars.PRODUCTION_INSTANCE_ID
  config.server_zone = envVars.PRODUCTION_ZONE
}
module.exports = config;
