require('dotenv').config({ path: '../../.env.dev' });
const fuzz = require('fuzzball');

const MatchedQuestionArrayItem = require('../schemas/matchedQuestionsArrayItem');

const {
    reorderMatchesArrayForSouthIndianStates,
} = require('../../server/helpers/question.helper');

const attachment = {
    southIndianReorderingSdThreshold: 70,
    southIndianStateLanguageReorder: true,
};

describe('south indian board user reorder', () => {
    test('south indian users with bump language matches sd greater than threshold', () => {
        const matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'hi-en', 'a1b1', 100, 'video', 'What is the value of x'),
            new MatchedQuestionArrayItem(2, 'MATHS', 'en', 'a1b1', 150, 'video', 'Find is the value of x'),
        ];

        const reorderedMatchesArray = reorderMatchesArrayForSouthIndianStates([[...matchesArray], [], []], attachment, {
            schoolBoard: 'Andhra Pradesh Board',
        }, fuzz, {});

        expect(reorderedMatchesArray.length).toBe(3);
        expect(reorderedMatchesArray[0].length).toBe(2);
        expect(reorderedMatchesArray[0][0]._id).toBe(2);
        expect(reorderedMatchesArray[0][0]._source.video_language).toBe('en');
        expect(reorderedMatchesArray[0][1]._id).toBe(1);
        expect(reorderedMatchesArray[0][1]._source.video_language).toBe('hi-en');
    });

    test('non south indian users with bump language matches sd greater than threshold', () => {
        const matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'en', 'a1b1', 100, 'video', 'What is the value of x'),
            new MatchedQuestionArrayItem(2, 'MATHS', 'hi-en', 'a1b1', 150, 'video', 'Find is the value of x'),
        ];

        const reorderedMatchesArray = reorderMatchesArrayForSouthIndianStates([[...matchesArray], [], []], attachment, {
            schoolBoard: 'CBSE',
        }, fuzz, {});

        expect(reorderedMatchesArray.length).toBe(3);
        expect(reorderedMatchesArray[0].length).toBe(2);
        expect(reorderedMatchesArray[0][0]._id).toBe(2);
        expect(reorderedMatchesArray[0][0]._source.video_language).toBe('hi-en');
        expect(reorderedMatchesArray[0][1]._id).toBe(1);
        expect(reorderedMatchesArray[0][1]._source.video_language).toBe('en');
    });

    test('south indian users with bump language matches sd less than threshold', () => {
        const matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'hi-en', 'a1b1', 100, 'video', 'Find is the value of x'),
            new MatchedQuestionArrayItem(2, 'MATHS', 'en', 'a1b1', 150, 'video', 'Evaluate x=?'),
        ];
        const reorderedMatchesArray = reorderMatchesArrayForSouthIndianStates([[...matchesArray], [], []], attachment, {
            schoolBoard: 'Andhra Pradesh Board',
        }, fuzz, {});

        expect(reorderedMatchesArray.length).toBe(3);
        expect(reorderedMatchesArray[0].length).toBe(2);
        expect(reorderedMatchesArray[0][0]._id).toBe(1);
        expect(reorderedMatchesArray[0][0]._source.video_language).toBe('hi-en');
        expect(reorderedMatchesArray[0][1]._id).toBe(2);
        expect(reorderedMatchesArray[0][1]._source.video_language).toBe('en');
    });

    test('non south indian users with bump language matches sd less than threshold', () => {
        const matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'en', 'a1b1', 100, 'video', 'Evaluate x=?'),
            new MatchedQuestionArrayItem(2, 'MATHS', 'hi-en', 'c2d2', 150, 'video', 'Find is the value of x'),
        ];
        const reorderedMatchesArray = reorderMatchesArrayForSouthIndianStates([[...matchesArray], [], []], attachment, {
            schoolBoard: 'CBSE',
        }, fuzz, {});

        expect(reorderedMatchesArray.length).toBe(3);
        expect(reorderedMatchesArray[0].length).toBe(2);
        expect(reorderedMatchesArray[0][0]._id).toBe(1);
        expect(reorderedMatchesArray[0][0]._source.video_language).toBe('en');
        expect(reorderedMatchesArray[0][1]._id).toBe(2);
        expect(reorderedMatchesArray[0][1]._source.video_language).toBe('hi-en');
    });
});
