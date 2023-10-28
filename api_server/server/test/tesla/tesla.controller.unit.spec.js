/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const { mockRes } = require('sinon-express-mock');
const { stub } = require('sinon');
const { expect } = require('chai');
const { sendFeedForCountriesIfNecessary } = require('../../v3/tesla/tesla.controller');

describe('Tesla controller', () => {
    let next;
    let res;
    before(() => {
        next = stub();
        res = mockRes();
    });

    afterEach(() => {
        next.resetHistory();
    });

    it('sendFeedForCountriesIfNecessary will send data with next if country is us', () => {
        res.locals = { carouselsData: ['test'], offsetCursor: 1 };
        const req = {
            headers: { country: 'us' },
        };
        sendFeedForCountriesIfNecessary(req, res, next);
        expect(next.args[0][0].data.feeddata).to.eql(['test']);
        expect(next.args[0][0].data.offsetCursor).to.be.equal(1);
    });

    it('sendFeedForCountriesIfNecessary will not send data with next if country is not us', () => {
        res.locals = { carouselsData: ['test'], offsetCursor: 1 };
        const req = {
            headers: '',
        };
        sendFeedForCountriesIfNecessary(req, res, next);
        expect(next.args[0][0]).to.be.undefined;
    });
});
