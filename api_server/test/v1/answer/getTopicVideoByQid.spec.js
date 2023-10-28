const { expect } = require('chai');
const { describe, it, before } = require('mocha');

const { app } = require('../../app.spec');

const json = require('./getTopicVideoByQid');
const { getTopicVideoByQid } = require('../../../server/v1/answer/answer.bl');

const db = app.get('db');

describe('getTopicVideoByQid', () => {
    for (let i = 0; i < json.length; i++) {
        const { input, output } = json[i];
        expect();
        let data = [];
        before(async function () {
            this.timeout(20000);
            data = await getTopicVideoByQid(db, input);
        });

        it('should have tab 4', () => {
            expect(data.tab).to.have.length(output.tab.length);
        });
        it('should have BOARD', () => {
            expect(data.tab[0].type).to.be.equal(output.tab[0].type);
        });
        it('should have list 34', () => {
            expect(data.list).to.have.length(output.list.length);
        });
        it('should have 91188480', () => {
            expect(data.list[0].question_id).to.be.equal(output.list[0].question_id);
        });
        it('should have 56705141', () => {
            expect(data.list[33].question_id).to.be.equal(output.list[33].question_id);
        });
    }
});
