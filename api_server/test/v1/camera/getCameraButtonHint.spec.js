const { describe, it } = require('mocha');
const { expect } = require('chai');

const { getCameraButtonHint } = require('../../../server/v1/camera/camera.bl');

const json = require('./getCameraButtonHint.json');

describe('getCameraButtonHint', () => {
    for (let i = 0; i < json.length; i++) {
        const { input, output } = json[i];
        if (output) {
            it(`should return ${output.durationSec}`, () => {
                expect(getCameraButtonHint(input).durationSec).to.eql(output.durationSec);
            });
        } else {
            it('should throw', () => {
                expect(() => getCameraButtonHint(input)).to.throw;
            });
        }
    }
});
