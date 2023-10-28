async function getCameraButtonHint(args) {
    let durationSec = 0;
    if (!args.openCount && args.openCount !== 0) {
        throw new Error('Open count is null');
    }
    if (args.openCount < 3) {
        durationSec = 120;
    } else if (args.openCount < 6) {
        durationSec = 2;
    }

    return {
        durationSec,
        content: ['Question ki photo khiche aur turant solution paao', 'No Handwritten Question'],
    };
}

async function getCameraBottomOverlayInfo() {
    return {
        title: 'JEE MAINS',
        content: 'Previous Paper Solution available',
        imageUrl: 'abc',
    };
}

async function getCameraBottomOverlaySubjectList(args) {
    if (!args.studentClass && args.studentClass !== 0) {
        throw new Error('Student class is null');
    }
    switch (args.studentClass) {
        case 6:
        case 7:
        case 8: return [{
            subject: 'Maths',
            imageUrl: 'abc',
        }];
        case 9:
        case 10:
        case 11:
        case 12:
            return [{
                subject: 'Maths',
                imageUrl: 'abc',
            }, {
                subject: 'Physics',
                imageUrl: 'abc',
            }, {
                subject: 'Chemistry',
                imageUrl: 'abc',
            }, {
                subject: 'Biology',
                imageUrl: 'abc',
            }];
        case 14:
            return [{
                subject: 'Maths',
                imageUrl: 'abc',
            }];
        default: throw new Error('Invalid student class');
    }
}

module.exports = {
    getCameraButtonHint,
    getCameraBottomOverlayInfo,
    getCameraBottomOverlaySubjectList,
};
