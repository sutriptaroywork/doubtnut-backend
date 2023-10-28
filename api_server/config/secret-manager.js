const { SecretsManager } = require('aws-sdk');
const DDApi = require('../dd-metrics');

const globalSecretId = process.env.AWS_SECRET_NAME;
const mysqlSecretId = process.env.AWS_SECRET_NAME_MYSQL;

const client = new SecretsManager({
    region: process.env.AWS_DEFAULT_REGION,
});

const secrets = {};

async function fetchSecretWithRetry(SecretId, retryCounter = 0) {
    try {
        console.log('Fetching secrets from secret manager', SecretId);
        const data = await client.getSecretValue({ SecretId }).promise();
        return data;
    } catch (err) {
        retryCounter++;
        DDApi.metrics.send('dn.api_backend.secret_manager_initialise_failures', 1);
        if (retryCounter < 3) {
            return fetchSecretWithRetry(SecretId, retryCounter);
        }
        throw err;
    }
}

async function fetchSecretsAndDecode(SecretId) {
    let obj = {};
    const data = await fetchSecretWithRetry(SecretId);
    // Decrypts secret using the associated KMS CMK.
    // Depending on whether the secret is a string or binary, one of these fields will be populated.
    if ('SecretString' in data) {
        obj = JSON.parse(data.SecretString);
    } else {
        const buff = Buffer.from(data.SecretBinary, 'base64');
        obj = JSON.parse(buff.toString('ascii'));
    }
    return obj;
}

async function populateMysqlSecrets(secretId) {
    if (!secretId) {
        return {};
    }
    const obj = await fetchSecretsAndDecode(secretId);

    return {
        MYSQL_HOST_READ: obj.host_read,
        MYSQL_DB_READ: obj.dbname,
        MYSQL_USER_READ: obj.username,
        MYSQL_PASS_READ: obj.password,
        MYSQL_HOST_WRITE: obj.host,
        MYSQL_DB_WRITE: obj.dbname,
        MYSQL_USER_WRITE: obj.username,
        MYSQL_PASS_WRITE: obj.password,
    };
}

async function populateSecrets() {
    const obj = await fetchSecretsAndDecode(globalSecretId);
    // eslint-disable-next-line guard-for-in
    for (const key in obj) {
        if (!['NODE_ENV', 'PORT'].includes(key) && process.env[key] === undefined) {
            process.env[key] = obj[key];
            secrets[key] = obj[key];
        }
    }

    const mysqlObj = await populateMysqlSecrets(mysqlSecretId);
    // eslint-disable-next-line guard-for-in
    for (const key in mysqlObj) {
        if (process.env[key] === undefined) {
            process.env[key] = mysqlObj[key];
            secrets[key] = mysqlObj[key];
        }
    }
}

module.exports = {
    populateSecrets,
    secrets,
};
