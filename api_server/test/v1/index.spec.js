const { describe } = require('mocha');

describe('v1', () => {
    require('./camera/index.spec');
    require('./answer/index.spec');
});
