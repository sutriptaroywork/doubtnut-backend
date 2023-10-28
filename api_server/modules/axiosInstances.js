const axios = require('axios');
const http = require('http');
const https = require('https');
const AWS = require('aws-sdk');

AWS.config.update({
    httpOptions: {
        agent: new https.Agent({ keepAlive: true, maxSockets: 200, timeout: 180 }),
    },
});
// baseURL : config.flagr.evaluation
const configFlagrInst = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100, timeout: 120 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100, timeout: 120 }),
});

// baseURL : config.microUrl
const configMicroInst = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 250, timeout: 120 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 250, timeout: 120 }),
});

// baseURL : preprocess.doubtnut.internal
const preprocessDoubtnutInst = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100, timeout: 100 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100, timeout: 100 }),
});

// baseURL : api.branch.io
const apiBranchInst = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100, timeout: 80 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100, timeout: 80 }),
});

// baseURL : 172.31.24.221:3000
const newtonInst = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100, timeout: 120 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100, timeout: 120 }),
});

const iasInstEsV7 = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50 }),
});

const pznInst = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50 }),
});

// baseURL : media.smsgupshup
// const mediaGupshupInst =

module.exports = {
    configFlagrInst,
    configMicroInst,
    preprocessDoubtnutInst,
    apiBranchInst,
    newtonInst,
    iasInstEsV7,
    pznInst,
};
