require('dotenv').config({ path: '../../.env.dev' });
const QuestionHelper = require('../../server/helpers/question.helper');
const config = require('../../config/config');
const Utility = require('../../modules/utility');

describe('check original ocr return values ', () => {
    test('en locale question', () => {
        const ocrResponse = QuestionHelper.getOcrResp({
            latex: {
                asciimath: 'find the value of',
                locale: 'en',
                rawOcr: 'find the value of',
            },
            ocrType: 1,
            config,
        });
        expect(ocrResponse.ocr).toBe('find the value of');
        expect(ocrResponse.original_ocr).toBe('');
    });

    test('regional locale question', () => {
        const ocrResponse = QuestionHelper.getOcrResp({
            latex: {
                asciimath: 'hello world',
                locale: 'en',
                rawOcr: 'ওহে বিশ্ব',
            },
            ocrType: 1,
            config,
        });
        expect(ocrResponse.ocr).toBe('hello world');
        expect(ocrResponse.original_ocr).toBe('ওহে বিশ্ব');
    });
});

describe('test handleViserResponse', () => {
    const viserApiResponse = {
        message: 'SUCCESS',
        result: {
            url: [
                {
                    Blurscore: 0.0,
                    Diagram: 0,
                    Diagramscore: 0.0,
                    Language: [
                        'gu',
                    ],
                    Mathscore: 0.19,
                    OCR: 'સાદા લોલકનો આવર્તકાળ "T=2 pi sqrt((E)/(g))" છे. "1mm" ચોકસાઈથી લंजાઈ માપता "10cm" મળે છે "1s" ની લધુત્તમ માપશક્તિथी "200" દોલનનો સમય "100" સેક-ડ મળે છે,તો g માં પ્રતિશતુટી....... "%"',
                    Orientation: '0',
                    Orientationscore: 1.0,
                    Printed: 1,
                    Printedscore: 0.98,
                    Score: 0.9,
                    ZMSG: 'SuccEss IMG INFO: W:852 | H:351 | R:2.43 | C:-2 | S:0 | DT: 0.04 GT: 0.47',
                },
            ],
        },
        status: 200,
    };
    jest.spyOn(Utility, 'viserMathsOcrTranslationHandler').mockImplementation((ocr_text, translate_client) => new Promise((resolve) => resolve('Period of a simple pendulum "T=2 pi sqrt((E)/(g))"  is "1mm"  Accurately measures laziness "10cm"  Get "1s"  The minimum size of "200"  Oscillation time "100"  If sec-d is found, the percentage in g is...... "%"')));
    test('regional locale ocr response keys', async () => {
        const ocrResp = await QuestionHelper.handleViserOcrResponse(viserApiResponse, {}, 0.7);
        expect(ocrResp[0].asciimath).toBe('Period of a simple pendulum "T=2 pi sqrt((E)/(g))"  is "1mm"  Accurately measures laziness "10cm"  Get "1s"  The minimum size of "200"  Oscillation time "100"  If sec-d is found, the percentage in g is...... "%"');
        expect(ocrResp[0].rawOcr).toBe('સાદા લોલકનો આવર્તકાળ "T=2 pi sqrt((E)/(g))" છे. "1mm" ચોકસાઈથી લंजાઈ માપता "10cm" મળે છે "1s" ની લધુત્તમ માપશક્તિथी "200" દોલનનો સમય "100" સેક-ડ મળે છે,તો g માં પ્રતિશતુટી....... "%"');
    });
});
