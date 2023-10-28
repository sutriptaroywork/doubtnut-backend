const request = require('supertest');
require('../config/local-secret-manager');
const { populateSecrets } = require('../config/secret-manager');

async function getExpressApp() {
    await populateSecrets();
    // eslint-disable-next-line global-require
    const express = require('../config/express');
    return function app() {
        return request(express);
    };
}

module.exports = {
    getExpressApp,
};
