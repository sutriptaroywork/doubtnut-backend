const { describe, it } = require('mocha');
const { expect } = require('chai');
const Homepage = require('../../../../modules/mysql/homepage');

const json = require('./getCaraousel.json');
const { app } = require('../../../app.spec');

describe('getCaraousel', () => {
    for (let i = 0; i < json.length; i++) {
        const { input, output } = json[i];
        it('db read', async () => {
            const data = await Homepage.getCaraousel(input.studentClass, input.limit, input.page, input.versionCode, app.get('db').mysql.read);
            expect(data).to.be.eql(output);
        });
    }
});
