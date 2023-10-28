const moment = require('moment');
const { matchers } = require('jest-json-schema');
const axios = require('axios');
const fs = require('fs');
const { getExpressApp } = require('./app');
const { getTestToken } = require('./utilities');
const schema = require('./schemas/question');

expect.extend(matchers);

describe('Test question endpoints', () => {
    let app;
    let jwt;

    beforeAll(async () => {
        app = await getExpressApp();
        jwt = await getTestToken(app);
    });

    test('/v1/question/generate-question-image-upload-url - GET request', async () => {
        const response = await app().get('/v1/question/generate-question-image-upload-url');
        expect(response.status).toBe(404);
    });

    test('/v1/question/generate-question-image-upload-url - no access token', async () => {
        const response = await app().post('/v1/question/generate-question-image-upload-url');
        expect(response.status).toBe(401);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(401);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(false);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('Unauthorized');
        expect(response.body.data).toBeDefined();
        expect(response.body.data).toBe('Unauthorized');
    });

    test('/v1/question/generate-question-image-upload-url - missing extension', async () => {
        const response = await app()
            .post('/v1/question/generate-question-image-upload-url')
            .type('form')
            .set('X-Auth-Token', jwt)
            .send({
                class: '12',
                subject: 'physics',
                chapter: 'magnetism',
            });
        expect(response.status).toBe(200);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBe(200);
        expect(response.body.meta.success).toBe(true);
        expect(response.body.meta.message).toBe('signed url is ready');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.url).toBeDefined();
        expect(response.body.data.url).toContain('amazonaws.com');
        expect(response.body.data.file_name).toBeDefined();
        expect(response.body.data.file_name).toContain('upload_');
        expect(response.body.data.file_name).toContain('undefined');
        expect(response.body.data.file_name_new).toBeDefined();
        expect(response.body.data.file_name_new).toContain(moment().format('YYYY/MM/DD'));
        expect(response.body.data.file_name_new).toContain('undefined');
        expect(response.body.data.question_id).toBeDefined();
        expect(response.body.data.doubt_id).toBeDefined();
    });

    test('/v1/question/generate-question-image-upload-url', async () => {
        const response = await app()
            .post('/v1/question/generate-question-image-upload-url')
            .type('form')
            .set('X-Auth-Token', jwt)
            .send({
                class: '12',
                subject: 'physics',
                chapter: 'magnetism',
                file_ext: 'png',
            });
        expect(response.status).toBe(200);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBe(200);
        expect(response.body.meta.success).toBe(true);
        expect(response.body.meta.message).toBe('signed url is ready');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.url).toBeDefined();
        expect(response.body.data.url).toContain('amazonaws.com');
        expect(response.body.data.file_name).toBeDefined();
        expect(response.body.data.file_name).toContain('upload_');
        expect(response.body.data.file_name).toContain('png');
        expect(response.body.data.file_name_new).toBeDefined();
        expect(response.body.data.file_name_new).toContain(moment().format('YYYY/MM/DD'));
        expect(response.body.data.file_name_new).toContain('png');
        expect(response.body.data.question_id).toBeDefined();
        expect(response.body.data.doubt_id).toBeDefined();
    });

    test('/v10/questions/ask - GET request', async () => {
        const response = await app().get('/v10/questions/ask');
        expect(response.status).toBe(404);
    });

    test('/v10/questions/ask - no access token', async () => {
        const response = await app().post('/v10/questions/ask');
        expect(response.status).toBe(401);
    });

    test('/v10/questions/ask', async () => {
        const signedUrlResponse = await app()
            .post('/v1/question/generate-question-image-upload-url')
            .type('form')
            .set('X-Auth-Token', jwt)
            .send({
                class: '12',
                subject: 'physics',
                file_ext: '.png',
                content_type: 'image/png',
            });
        const question_image = signedUrlResponse.body.data.url.split('/upload')[0];
        const uploadUrl = signedUrlResponse.body.data.url;
        const filePath = `${__dirname}/question.png`;
        const image = fs.readFileSync(filePath);

        await axios.put(uploadUrl, { data: image }, { headers: { 'Content-Type': 'application/octet-stream' } });

        const askResponse = await app()
            .post('/v10/questions/ask')
            .type('form')
            .set('X-Auth-Token', jwt)
            .send({
                question_image,
                uploaded_image_name: signedUrlResponse.body.data.file_name,
                question: 'WEB',
                limit: '20',
                uploaded_image_question_id: signedUrlResponse.body.data.question_id,
            });

        expect(askResponse.status).toBe(200);
        expect(askResponse.body.meta.code).toBe(200);
        expect(askResponse.body.meta.success).toBe(true);
        expect(askResponse.body.meta.message).toBe('Success');
        expect(askResponse.body.data.matched_questions.length).toBe(askResponse.body.data.matched_count);
        expect(askResponse.body).toMatchSchema(schema);
    });
});
