const dogapi = require('dogapi');

const options = {
    api_key: process.env.DD_API_KEY,
};

dogapi.initialize(options);

module.exports = dogapi;
