const { describe } = require('mocha');

describe('helpers', () => {
    require('./question/index.spec');
    require('./buildStaticCdnUrl/index.spec');
});
