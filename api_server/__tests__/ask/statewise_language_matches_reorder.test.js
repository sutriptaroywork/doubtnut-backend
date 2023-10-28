require('dotenv').config({ path: '../../.env.dev' });

const Utility = require('../../modules/utility');

const MatchedQuestionArrayItem = require('../schemas/matchedQuestionsArrayItem');
const DuplicateQuestionMapByTag = require('../../modules/duplicateQuestionMap');

const {
    stateWiseLanguageRelevanceDuplicatesReorder,
} = require('../../server/helpers/question.helper');

let duplicateQuestionMapByTag;

const attachment = {
    "languagePriorityWeightsByRegions": [
        {
            "schoolBoards": [
                "Andhra Pradesh Board",
                "Telangana Board"
            ],
            "userLocation": [
                "AP",
                "TG"
            ],
            "weights": [
                "en>hi-en",
                "te-en>hi-en"
            ]
        }
    ],
};

describe('state wise language reorder', () => {
    beforeEach(() => {
        duplicateQuestionMapByTag = new DuplicateQuestionMapByTag();
    })
    test('eligible user matches reorder - IP', () => {
        const matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'hi-en', 'a1b1', 100, 'video'),
            new MatchedQuestionArrayItem(2, 'MATHS', 'te-en', 'a1b1', 150, 'video'),
        ];
        jest.spyOn(Utility, 'getStudentStateCode').mockReturnValue(['AP', '0.0.0.0']);
        const reorderedMatchesArray = stateWiseLanguageRelevanceDuplicatesReorder([[...matchesArray], [], []], attachment, {
            schoolBoard: 'CBSE',
        }, {}, duplicateQuestionMapByTag);

        expect(reorderedMatchesArray.length).toBe(3);
        expect(reorderedMatchesArray[0].length).toBe(2);
        expect(reorderedMatchesArray[0][0]._id).toBe(2);
        expect(reorderedMatchesArray[0][0]._source.video_language).toBe('te-en');
        expect(reorderedMatchesArray[0][1]._id).toBe(1);
        expect(reorderedMatchesArray[0][1]._source.video_language).toBe('hi-en');
    });

    test('eligible user matches reorder - BOARD', () => {
        const matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'hi-en', 'a1b1', 100, 'video'),
            new MatchedQuestionArrayItem(2, 'MATHS', 'en', 'a1b1', 150, 'video'),
        ];
        jest.spyOn(Utility, 'getStudentStateCode').mockReturnValue(['CG', '0.0.0.0']);
        const reorderedMatchesArray = stateWiseLanguageRelevanceDuplicatesReorder([[...matchesArray], [], []], attachment, {
            schoolBoard: 'Telangana Board',
        }, {}, duplicateQuestionMapByTag);

        expect(reorderedMatchesArray.length).toBe(3);
        expect(reorderedMatchesArray[0].length).toBe(2);
        expect(reorderedMatchesArray[0][0]._id).toBe(2);
        expect(reorderedMatchesArray[0][0]._source.video_language).toBe('en');
        expect(reorderedMatchesArray[0][1]._id).toBe(1);
        expect(reorderedMatchesArray[0][1]._source.video_language).toBe('hi-en');
    });

    test('uneligible user matches reorder', () => {
        const matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'hi-en', 'a1b1', 100, 'video'),
            new MatchedQuestionArrayItem(2, 'MATHS', 'en', 'a1b1', 150, 'video'),
        ];
        jest.spyOn(Utility, 'getStudentStateCode').mockReturnValue(['CG', '0.0.0.0']);
        const reorderedMatchesArray = stateWiseLanguageRelevanceDuplicatesReorder([[...matchesArray], [], []], attachment, {
            schoolBoard: 'West Bengal Board',
        }, {}, duplicateQuestionMapByTag);

        expect(reorderedMatchesArray.length).toBe(3);
        expect(reorderedMatchesArray[0].length).toBe(2);
        expect(reorderedMatchesArray[0][0]._id).toBe(1);
        expect(reorderedMatchesArray[0][0]._source.video_language).toBe('hi-en');
        expect(reorderedMatchesArray[0][1]._id).toBe(2);
        expect(reorderedMatchesArray[0][1]._source.video_language).toBe('en');
    });
});

