const { describe, it } = require('mocha');
const { expect } = require('chai');
const Homepage = require('../../../../modules/mysql/homepage');

const json = require('./getPersonalisedCaraousel.json');
const { app } = require('../../../app.spec');

describe('getPersonalisedCaraousel', () => {
    for (let i = 0; i < json.length; i++) {
        const { input, output } = json[i];
        it('db read', async () => {
            const data = await Homepage.getPersonalisedCaraousel(input.studentId, input.studentClass, input.studentLocale, input.cemString, input.limit, input.page, input.versionCode, app.get('db').mysql.read);
            expect(data).to.be.eql(output);
        });
    }
});
