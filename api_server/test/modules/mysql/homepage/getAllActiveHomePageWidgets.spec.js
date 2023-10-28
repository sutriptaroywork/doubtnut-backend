const { describe, it } = require('mocha');
const { expect } = require('chai');
const Homepage = require('../../../../modules/mysql/homepage');

const json = require('./getAllActiveHomePageWidgets.json');
const { app } = require('../../../app.spec');

describe('getAllActiveHomePageWidgets', () => {
    for (let i = 0; i < json.length; i++) {
        const { input, output } = json[i];
        it('db read', async () => {
            const data = await Homepage.getAllActiveHomePageWidgets(app.get('db').mysql.read, input.studentClass, input.versionCode, input.page, input.limit);
            expect(data).to.be.eql(output);
        });
    }
});
