/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const { expect } = require('chai');
const { isFeedForPagesOtherThanHomeRequired } = require('../../v3/tesla/tesla.utils');

describe('tesla unit', () => {
    it('isFeedForPagesOtherThanHomeRequired will return true source is other than home and page number is zero', () => {
        const result = isFeedForPagesOtherThanHomeRequired('not home', 0);
        expect(result).to.be.true;
    });

    it('isFeedForPagesOtherThanHomeRequired will return false source is home and page number is zero', () => {
        const result = isFeedForPagesOtherThanHomeRequired('home', 0);
        expect(result).to.be.false;
    });
});
