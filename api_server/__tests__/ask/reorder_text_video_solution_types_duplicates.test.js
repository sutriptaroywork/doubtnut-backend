require('dotenv').config({ path: '../../.env.dev' });


const {
    reorderTextVideoDuplicateSolutions,
} = require('../../server/helpers/question.helper');

const MatchedQuestionArrayItem = require('../schemas/matchedQuestionsArrayItem');
const DuplicateQuestionMapByTag = require('../../modules/duplicateQuestionMap');

let matchesArray;
let reorderedMatchesArray;
let duplicateQuestionMapByTag;


const variantAttachment = {
    reorderTextVideoDuplicateSolutions: true,
}

describe('text vs video reordering logic test', () => {
    beforeEach(() => {
        duplicateQuestionMapByTag = new DuplicateQuestionMapByTag();
    });

    test('test where en video matches exists', () => {
        const matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'en', 'a1b1c1', 100, 'text'),
            new MatchedQuestionArrayItem(2, 'MATHS', 'te-en', 'a1b1c1', 120, 'video'),
            new MatchedQuestionArrayItem(3, 'MATHS', 'en', 'a1b1c1', 50, 'video'),
        ];
        reorderTextVideoDuplicateSolutions(matchesArray, duplicateQuestionMapByTag, null, variantAttachment);
        expect(matchesArray.length).toBe(3);
        expect(matchesArray[0]._id).toBe(3);
        expect(matchesArray[2]._id).toBe(1);
        expect(matchesArray[0].resource_type).toBe('video');
        expect(matchesArray[2].resource_type).toBe('text');
    });

    test('test where non-en or video matches exists', () => {
        const matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'en', 'a1b1c1', 100, 'text'),
            new MatchedQuestionArrayItem(2, 'MATHS', 'te-en', 'a1b1c1', 120, 'video'),
            new MatchedQuestionArrayItem(3, 'MATHS', 'te', 'a1b1c1', 50, 'video'),
        ];
        reorderTextVideoDuplicateSolutions(matchesArray, duplicateQuestionMapByTag, null, variantAttachment);
        expect(matchesArray.length).toBe(3);
        expect(matchesArray[0]._id).toBe(2);
        expect(matchesArray[0].resource_type).toBe('video');
        expect(matchesArray[0]._source.video_language).toBe('te-en');


        expect(matchesArray[1]._id).toBe(1);
        expect(matchesArray[1].resource_type).toBe('text');
        expect(matchesArray[1]._source.video_language).toBe('en');
    });

    test('test where multiple video matches exists', () => {
        const matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'en', 'a1b1c1', 100, 'text'),
            new MatchedQuestionArrayItem(2, 'MATHS', 'te', 'a1b1c1', 120, 'video'),
            new MatchedQuestionArrayItem(3, 'MATHS', 'mr', 'a1b1c1', 50, 'video'),
            new MatchedQuestionArrayItem(4, 'MATHS', 'hi-en', 'a1b1c1', 150, 'video'),

        ];
        reorderTextVideoDuplicateSolutions(matchesArray, duplicateQuestionMapByTag, null, variantAttachment);
        expect(matchesArray.length).toBe(4);
        expect(matchesArray[0]._id).toBe(4);
        expect(matchesArray[0].resource_type).toBe('video');
        expect(matchesArray[0]._source.video_language).toBe('hi-en');


        expect(matchesArray[3]._id).toBe(1);
        expect(matchesArray[3].resource_type).toBe('text');
        expect(matchesArray[3]._source.video_language).toBe('en');
    });
})
