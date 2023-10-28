require('dotenv').config({ path: '../.env.dev' });
const {
    reorderExactMatchDuplicateByMaxVideoDuration,
} = require('../../server/helpers/question.helper');

const DuplicateQuestionMapByTag = require('../../modules/duplicateQuestionMap');

let duplicateQuestionMapByTag;
let matchesArray = [];
let reorderMatchesArr = [];


describe('reorder max duration video to the top', () => {
    beforeEach(() => {
        matchesArray = [
            {
                _id: 1,
                _source: {
                    subject: 'MATHS',
                    video_language: 'en',
                    duplicateTag: 'a1b1',
                    duration: 100,

                },
            },
            {
                _id: 2,
                _source: {
                    subject: 'MATHS',
                    video_language: 'en',
                    duplicateTag: 'a1b1',
                    duration: 200,
                },
            },
        ];
        reorderMatchesArr = [
            {
                _id: 2,
                _source: {
                    subject: 'MATHS',
                    video_language: 'en',
                    duplicateTag: 'a1b1',
                    duration: 200,
                },
            },
            {
                _id: 1,
                _source: {
                    subject: 'MATHS',
                    video_language: 'en',
                    duplicateTag: 'a1b1',
                    duration: 100,
                },
            },
        ];
        duplicateQuestionMapByTag = new DuplicateQuestionMapByTag();
    });
    afterAll(() => {
    })
    test('same language max reorder', () => {
        reorderExactMatchDuplicateByMaxVideoDuration(matchesArray, duplicateQuestionMapByTag);
        expect(matchesArray).toEqual(reorderMatchesArr);
    });

    test('same language max reorder without duplicate question map', () => {
        reorderExactMatchDuplicateByMaxVideoDuration(matchesArray);
        expect(matchesArray).toEqual(matchesArray);
    });

    test('same language max reorder with null duplicate question map', () => {
        reorderExactMatchDuplicateByMaxVideoDuration(matchesArray, null);
        expect(matchesArray).toEqual(matchesArray);
    })



});



describe('reorder without duplicate tags in matches', () => {
    beforeEach(() => {
        matchesArray = [
            {
                _id: 1,
                _source: {
                    subject: 'MATHS',
                    video_language: 'en',
                    duration: 100,
                },
            },
            {
                _id: 2,
                _source: {
                    subject: 'MATHS',
                    video_language: 'en',
                    duration: 150,
                },
            },
        ];
        duplicateQuestionMapByTag = new DuplicateQuestionMapByTag();
    });
    test('same language duplicates', () => {
        reorderExactMatchDuplicateByMaxVideoDuration(matchesArray, duplicateQuestionMapByTag);
        expect(matchesArray).toEqual(matchesArray);
    });
})


describe('reorder with duplicate in different undesired video language', () => {
    beforeEach(() => {
        matchesArray = [
            {
                _id: 1,
                _source: {
                    subject: 'MATHS',
                    video_language: 'en',
                    duration: 100,
                    duplicateTag: 'a#2$',
                },
            },
            {
                _id: 2,
                _source: {
                    subject: 'MATHS',
                    video_language: 'te-en',
                    duration: 150,
                    duplicateTag: 'a#2$',
                },
            },
        ];
        duplicateQuestionMapByTag = new DuplicateQuestionMapByTag();
    })
    test('same language duplicates', () => {
        reorderExactMatchDuplicateByMaxVideoDuration(matchesArray, duplicateQuestionMapByTag);
        expect(matchesArray).toEqual(matchesArray);
    });
})


describe('reorder with duplicate in different desired video language', () => {
    beforeEach(() => {
        matchesArray = [
            {
                _id: 1,
                _source: {
                    subject: 'MATHS',
                    video_language: 'en',
                    duration: 100,
                    duplicateTag: 'a#2$',
                },
            },
            {
                _id: 2,
                _source: {
                    subject: 'MATHS',
                    video_language: 'hi-en',
                    duration: 150,
                    duplicateTag: 'a#2$',
                },
            },
        ];
        duplicateQuestionMapByTag = new DuplicateQuestionMapByTag();

        reorderMatchesArr = [
            {
                _id: 2,
                _source: {
                    subject: 'MATHS',
                    video_language: 'hi-en',
                    duration: 150,
                    duplicateTag: 'a#2$',
                },
            },
            {
                _id: 1,
                _source: {
                    subject: 'MATHS',
                    video_language: 'en',
                    duration: 100,
                    duplicateTag: 'a#2$',
                },
            },
        ]
    });


    test('same language duplicates', () => {
        reorderExactMatchDuplicateByMaxVideoDuration(matchesArray, duplicateQuestionMapByTag);
        expect(matchesArray).toEqual(reorderMatchesArr);
    });
})
