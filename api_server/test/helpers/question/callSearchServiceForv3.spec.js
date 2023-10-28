const chai = require('chai');
const { describe, it } = require('mocha');
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');

chai.use(chaiShallowDeepEqual);

const { expect } = chai;
const questionHelper = require('../../../server/helpers/question.helper');
const json = require('./callSearchServiceForv3.json');

describe('callSearchServiceForv3 should return matches array with length > 0', () => {
    for (let i = 0; i < json.length; i++) {
        const { input, output } = json[i];
        it(`should call search service ${input.searchImplVersion}`, async () => {
            const matches = await questionHelper.callSearchServiceForv3(input);
            // expect(matches.timed_out).to.be.false;
            // expect(matches._shards.total).to.be.eql(matches._shards.successful);
            // expect(matches._shards.skipped).to.be.eql(0);
            // expect(matches._shards.failed).to.be.eql(0);
            expect(matches.hits.hits).to.shallowDeepEqual(output.hits.hits);
        });
    }
});
