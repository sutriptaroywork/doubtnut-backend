const { describe } = require('mocha');

describe('question', () => {
    require('./elasticsearch.spec');
    require('./callSearchServiceForv3.spec');
});
