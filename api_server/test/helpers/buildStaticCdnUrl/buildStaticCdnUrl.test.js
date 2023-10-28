const { describe, it } = require('mocha');
const { expect } = require('chai');
const { buildStaticCdnUrl } = require('../../../server/helpers/buildStaticCdnUrl');

const jsonObj = require('./urlTestCases.json');

function test() {
    const json = jsonObj.cloudfront; // * change the distributions for this in data.js file accordingly because of random urls
    for (let i = 0; i < json.length; i++) {
        describe('Build static CDN URL Test', () => {
            it('should have same urls', () => {
                const expected = json[i].output;
                const actual = buildStaticCdnUrl(json[i].input, json[i].sendVideoCDNUrl);
                expect(expected).to.be.equal(actual);
            });
        });
    }
}

test();
