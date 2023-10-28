require('dotenv').config({ path: '../../.env.dev' });
const {
    reorderMatchesArrayToDesiredVideoLanguageForExactMatch,
} = require('../../server/helpers/question.helper');

const MatchedQuestionArrayItem = require('../schemas/matchedQuestionsArrayItem');
const DuplicateQuestionMapByTag = require('../../modules/duplicateQuestionMap');



let duplicateQuestionMapByTag;
let matchesArray;
let reorderedMatchesArray;

const variantAttachment = {
    reorderToDesiredVideoLocaleForExactMatch:  true,
}



describe('test reorder hi-en, en counterparts if any to max video locale', () => {
    beforeEach(() => {
        duplicateQuestionMapByTag = new DuplicateQuestionMapByTag();
    });


    test('no reorder with null variant attachment', () => {
        matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'te', 'a1b1', 100),
            new MatchedQuestionArrayItem(2, 'MATHS', 'te-en', 'a1b1', 130),
            new MatchedQuestionArrayItem(3, 'MATHS', 'en', 'a1b1', 140),
            new MatchedQuestionArrayItem(4, 'MATHS', 'en', 'a1b1', 170),
        ];
        reorderedMatchesArray = [
            new MatchedQuestionArrayItem(3, 'MATHS', 'en', 'a1b1', 140),
            new MatchedQuestionArrayItem(2, 'MATHS', 'te-en', 'a1b1', 130),
            new MatchedQuestionArrayItem(1, 'MATHS', 'te', 'a1b1', 100),
            new MatchedQuestionArrayItem(4, 'MATHS', 'en', 'a1b1', 170),
        ];
        reorderMatchesArrayToDesiredVideoLanguageForExactMatch({
            matchesArray,
            attachment: null,
        }, duplicateQuestionMapByTag);
        expect(matchesArray).toEqual(matchesArray);
        expect(matchesArray.length).toBe(4);
        expect(matchesArray[0]._id).toBe(3);
        expect(matchesArray[0]._source.duration).toBe(140);
        expect(matchesArray[2]._id).toBe(1);
        expect(matchesArray[2]._source.duration).toBe(100);
    })

    test('hi-en max video reorder', () => {
        matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'te', 'a1b1', 100),
            new MatchedQuestionArrayItem(2, 'MATHS', 'te-en', 'a1b1', 200),
            new MatchedQuestionArrayItem(3, 'MATHS', 'en', 'a1b1', 140),
            new MatchedQuestionArrayItem(4, 'MATHS', 'hi-en', 'a1b1', 170),
        ];
        reorderedMatchesArray = [
            new MatchedQuestionArrayItem(4, 'MATHS', 'hi-en', 'a1b1', 170),
            new MatchedQuestionArrayItem(2, 'MATHS', 'te-en', 'a1b1', 200),
            new MatchedQuestionArrayItem(3, 'MATHS', 'en', 'a1b1', 140),
            new MatchedQuestionArrayItem(1, 'MATHS', 'te', 'a1b1', 100),
        ];
        reorderMatchesArrayToDesiredVideoLanguageForExactMatch({
            matchesArray,
            attachment: variantAttachment,
        }, duplicateQuestionMapByTag);

        expect(matchesArray).toEqual(reorderedMatchesArray);
        expect(matchesArray.length).toBe(4);
        expect(matchesArray[0]._id).toBe(reorderedMatchesArray[0]._id);
        expect(matchesArray[0]._source.video_language).toBe(reorderedMatchesArray[0]._source.video_language);

        expect(matchesArray[3]._id).toBe(reorderedMatchesArray[3]._id);
        expect(matchesArray[3]._source.video_language).toBe(reorderedMatchesArray[3]._source.video_language);
        expect(matchesArray).toEqual(reorderedMatchesArray);
    });

    test('en max video reorder with different duplicate tags', () => {
        matchesArray = [
            new MatchedQuestionArrayItem(1, 'MATHS', 'mr', 'a1b1', 100),
            new MatchedQuestionArrayItem(2, 'MATHS', 'en', 'a1b1', 200),
            new MatchedQuestionArrayItem(3, 'MATHS', 'gu', 'a1b1', 300),
            new MatchedQuestionArrayItem(4, 'MATHS', 'en', 'a2b2', 400),
        ];

        reorderedMatchesArray = [
            new MatchedQuestionArrayItem(2, 'MATHS', 'en', 'a1b1', 200),
            new MatchedQuestionArrayItem(1, 'MATHS', 'mr', 'a1b1', 100),
            new MatchedQuestionArrayItem(3, 'MATHS', 'gu', 'a1b1', 300),
            new MatchedQuestionArrayItem(4, 'MATHS', 'en', 'a2b2', 400),
        ];
        reorderMatchesArrayToDesiredVideoLanguageForExactMatch({
            matchesArray,
            variantAttachment,
        }, duplicateQuestionMapByTag);
        expect(matchesArray).toEqual(reorderedMatchesArray);
        expect(matchesArray.length).toBe(4);
        expect(matchesArray[0]._id).toBe(reorderedMatchesArray[0]._id);
        expect(matchesArray[0]._source.video_language).toBe(reorderedMatchesArray[0]._source.video_language);
        expect(matchesArray[1]._id).toBe(reorderedMatchesArray[1]._id);
        expect(matchesArray[1]._source.video_language).toBe(reorderedMatchesArray[1]._source.video_language);
    });

});
