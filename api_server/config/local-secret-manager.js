/* eslint-disable global-require */
const fs = require('fs');
const path = require('path');

const envs = {
    local: path.resolve(process.cwd(), '.env.local'),
    dev: path.resolve(process.cwd(), '.env.dev'),
    staging: path.resolve(process.cwd(), '.env.staging'),
    prod: path.resolve(process.cwd(), '.env'),
};

function loadLocalEnv() {
    require('dotenv').config({ path: envs.local });
}

function loadDevEnv() {
    require('dotenv').config({ path: envs.dev });
}

function loadStagingEnv() {
    require('dotenv').config({ path: envs.staging });
}

function loadEnv() {
    require('dotenv').config();
}

/**
 * - Sequence of envs:
 * .env.local - If NODE_ENV=development
 * .env.dev - If NODE_ENV=development
 * .env.staging - If NODE_ENV=development or NODE_ENV=staging
 * .env - If NODE_ENV=development or NODE_ENV=staging or NODE_ENV=production
 */
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    if (fs.existsSync(envs.local)) {
        loadLocalEnv();
    } else if (fs.existsSync(envs.dev)) {
        loadDevEnv();
    } else if (fs.existsSync(envs.staging)) {
        loadStagingEnv();
    } else {
        loadEnv();
    }
} else if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'test') {
    if (fs.existsSync(envs.staging)) {
        loadStagingEnv();
    } else {
        loadEnv();
    }
} else {
    loadEnv();
}
