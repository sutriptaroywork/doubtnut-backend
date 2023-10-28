const { expect } = require('chai');
const { describe, it, before } = require('mocha');
const fuzz = require('fuzzball');
const utility = require('../../../modules/utility');
const { handleElasticSearchWrapper } = require('../../../server/helpers/question.helper');
const { app } = require('../../app.spec');
const config = require('../../../config/config');

const json = require('./elasticsearch.json');

function test() {
    for (let i = 0; i < json.length; i++) {
        describe('elasticsearch wrapper', () => {
            let stringDiffResp;
            let info;
            before(async () => {
                const data = await handleElasticSearchWrapper({
                    elasticSearchInstance: app.get('elasticSearchInstance'),
                    kinesisClient: app.get('kinesis'),
                    elasticIndex: config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION,
                    stockWordList: [],
                    useStringDiff: true,
                    fuzz,
                    UtilityModule: utility,
                    ...json[i].input,
                });
                stringDiffResp = data.stringDiffResp;
                info = data.info;
            });

            it('should not return undefined values', () => {
                expect(stringDiffResp).to.not.be.undefined;
                expect(info).to.not.be.undefined;
                expect(info.version).to.not.be.undefined;
            });

            it('should have version Vn', () => {
                expect(Number(info.version.substr(1))).to.not.be.NaN;
            });

            it('should return same ocr text', () => {
                expect(info.query_ocr_text).to.be.equal(json[i].output.query_ocr_text);
            });
        });
    }
}

test();
