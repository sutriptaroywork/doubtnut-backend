const { describe, it } = require('mocha');
const { expect } = require('chai');

const { getCameraBottomOverlaySubjectList } = require('../../../server/v1/camera/camera.bl');

const json = require('./getCameraBottomOverlaySubjectList.json');

describe('getCameraBottomOverlaySubjectList', () => {
    for (let i = 0; i < json.length; i++) {
        const { input, output } = json[i];
        if (output) {
            it(`should return ${output.length} values`, () => {
                expect(getCameraBottomOverlaySubjectList(input, 3).map((x) => x.subject)).to.eql(output);
            });
            it('should return null', () => {
                expect(getCameraBottomOverlaySubjectList(input, 4)).to.be.null;
            });
        } else {
            it('should throw', () => {
                expect(() => getCameraBottomOverlaySubjectList(input, 2)).to.throw;
            });
        }
    }
});
