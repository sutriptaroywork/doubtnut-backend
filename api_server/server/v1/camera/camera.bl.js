const { sampleQuestionsForCamera, cameraTooltip } = require('../../../data/data');

/**
 * - Gets camera button hint
 * @param {number} openCount Number of times camera opened
 * @returns {{durationSec: number, content: string[]}} camera button hint
 * @author Abhishek Sinha
 */
function getCameraButtonHint(openCount) {
    let durationSec = 0;
    if (!openCount || openCount < 0) {
        throw new Error('Open count is invalid');
    }
    if (openCount < 4) {
        durationSec = 120;
    } else if (openCount < 7) {
        durationSec = 2;
    }

    if (!durationSec) {
        return { durationSec };
    }
    return {
        durationSec,
        content: cameraTooltip,
    };
}

/**
 * - Gets camera bottom page overlay
 * @param {number} studentClass
 * @returns {{title: string, content: string, imageUrl: string, showTimes: number}} camera bottom page overlay info
 * @author Abhishek Sinha
 */
function getCameraBottomOverlayInfo(studentClass) {
    switch (studentClass) {
        // case 11:
        // case 12: return {
        //     title: 'JEE MAINS',
        //     content: 'Previous Paper Solution available',
        //     imageUrl: 'https://img.icons8.com/color/72/delicious.png',
        //     showTimes: 3,
        // };
        default: return null;
    }
}

/**
 * - Gets a list of subject-sample image mapping as sample for camera
 * @param {number} studentClass
 * @param {number} openCount Number of times camera opened
 * @returns {{subject: string, imageUrl: string}[]} list of subjects and their corresponding landing images
 * @author Abhishek Sinha
 */
function getCameraBottomOverlaySubjectList(studentClass, openCount) {
    if (!studentClass) {
        throw new Error('Student class is null');
    }
    if (!openCount || openCount < 0) {
        throw new Error('Open count is invalid');
    }
    if (openCount > 3) {
        return null;
    }
    switch (studentClass) {
        case 6: return [{
            subject: 'Maths',
            imageUrl: sampleQuestionsForCamera.maths[6],
        }];
        case 7: return [{
            subject: 'Maths',
            imageUrl: sampleQuestionsForCamera.maths[7],
        }];
        case 8: return [{
            subject: 'Maths',
            imageUrl: sampleQuestionsForCamera.maths[8],
        }];
        case 9: return [{
            subject: 'Maths',
            imageUrl: sampleQuestionsForCamera.maths[9],
        }, {
            subject: 'Physics',
            imageUrl: sampleQuestionsForCamera.physics[9],
        }, {
            subject: 'Chemistry',
            imageUrl: sampleQuestionsForCamera.chemistry[9],
        }, {
            subject: 'Biology',
            imageUrl: sampleQuestionsForCamera.biology[9],
        }];
        case 10: return [{
            subject: 'Maths',
            imageUrl: sampleQuestionsForCamera.maths[10],
        }, {
            subject: 'Physics',
            imageUrl: sampleQuestionsForCamera.physics[10],
        }, {
            subject: 'Chemistry',
            imageUrl: sampleQuestionsForCamera.chemistry[10],
        }, {
            subject: 'Biology',
            imageUrl: sampleQuestionsForCamera.biology[10],
        }];
        case 11: return [{
            subject: 'Maths',
            imageUrl: sampleQuestionsForCamera.maths[11],
        }, {
            subject: 'Physics',
            imageUrl: sampleQuestionsForCamera.physics[11],
        }, {
            subject: 'Chemistry',
            imageUrl: sampleQuestionsForCamera.chemistry[11],
        }, {
            subject: 'Biology',
            imageUrl: sampleQuestionsForCamera.biology[11],
        }];
        case 12: return [{
            subject: 'Maths',
            imageUrl: sampleQuestionsForCamera.maths[12],
        }, {
            subject: 'Physics',
            imageUrl: sampleQuestionsForCamera.physics[12],
        }, {
            subject: 'Chemistry',
            imageUrl: sampleQuestionsForCamera.chemistry[12],
        }, {
            subject: 'Biology',
            imageUrl: sampleQuestionsForCamera.biology[12],
        }];
        case 14: return [{
            subject: 'Maths',
            imageUrl: sampleQuestionsForCamera.maths[14],
        }];
        default: throw new Error('Invalid student class');
    }
}

module.exports = {
    getCameraButtonHint,
    getCameraBottomOverlayInfo,
    getCameraBottomOverlaySubjectList,
};
