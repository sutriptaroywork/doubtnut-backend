const { matchers } = require('jest-json-schema');
const { getExpressApp } = require('./app');
const { getTestToken } = require('./utilities');
const schema = require('./schemas/onboarding');

expect.extend(matchers);

describe('Onboarding endpoints', () => {
    let app;
    let jwt;

    beforeAll(async () => {
        app = await getExpressApp();
        jwt = await getTestToken(app);
    });

    test('/v5/onboarding - no access of token', async () => {
        const response = await app().post('/v5/student/post-student-onboarding');
        expect(response.status).toBe(401);
        expect(response.body.meta.code).toBe(401);
        expect(response.body.meta.success).toBe(false);
        expect(response.body.meta.message).toBe('Unauthorized');
        expect(response.body.data).toBe('Unauthorized');
    });

    test('/v5/onboarding - giving token access', async () => {
        const response = await app()
            .post('/v5/student/post-student-onboarding')
            .set('X-Auth-Token', jwt);
        expect(response.status).toBe(200);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.code).toBeDefined();
        expect(response.body.meta.code).toBe(200);
        expect(response.body.meta.success).toBeDefined();
        expect(response.body.meta.success).toBe(true);
        expect(response.body.meta.message).toBeDefined();
        expect(response.body.meta.message).toBe('SUCCESS');
        expect(response.body.data).toBeDefined();
    });

    describe.each([6, 7, 8])('Test classes passing class', (classNo) => {
        test(`Test is submit passing class for class ${classNo}`, async () => {
            const response = await app()
                .post('/v5/student/post-student-onboarding')
                .set({ 'X-Auth-Token': jwt, version_code: 946 })
                .type('form')
                .send({
                    code: [classNo],
                    variant: 2,
                    title: [`Class ${classNo}`],
                    type: 'class',
                });

            expect(response.body).toMatchSchema(schema);
            const userDetails = response.body.data.steps.findIndex((element) => element.type === 'user_details')
            const stepClass = response.body.data.steps.findIndex((element) => element.type === 'class')
            expect(response.body.data.steps).toHaveLength(2);
            expect(response.body.data.steps[userDetails].type).toBe('user_details');
            expect(response.body.data.steps[stepClass].type).toBe('class');
            expect(response.body.data.is_final_submit).toBe(true);
        });
    });

    describe.each([9, 10])('Test classes passing class', (classNo) => {
        test(`Test is submit passing class for class ${classNo}`, async () => {
            const response = await app()
                .post('/v5/student/post-student-onboarding')
                .set({ 'X-Auth-Token': jwt, version_code: 946 })
                .type('form')
                .send({
                    code: [classNo],
                    variant: 2,
                    title: [`Class ${classNo}`],
                    type: 'class',
                });

            expect(response.body).toMatchSchema(schema);
            const userDetails = response.body.data.steps.findIndex((element) => element.type === 'user_details')
            const stepClass = response.body.data.steps.findIndex((element) => element.type === 'class')
            const board = response.body.data.steps.findIndex((element) => element.type === 'board')
            expect(response.body.data.steps).toHaveLength(3);
            expect(response.body.data.steps[userDetails].type).toBe('user_details');
            expect(response.body.data.steps[stepClass].type).toBe('class');
            expect(response.body.data.steps[board].type).toBe('board');
            expect(response.body.data.is_final_submit).toBe(false);
        });
    });

    describe.each([11, 12])('Test classes passing class', (classNo) => {
        test(`Test is submit passing class for class ${classNo}`, async () => {
            const response = await app()
                .post('/v5/student/post-student-onboarding')
                .set({ 'X-Auth-Token': jwt, version_code: 946 })
                .type('form')
                .send({
                    code: [classNo],
                    variant: 2,
                    title: [`Class ${classNo}`],
                    type: 'class',
                });

            expect(response.body).toMatchSchema(schema);
            const userDetails = response.body.data.steps.findIndex((element) => element.type === 'user_details')
            const stepClass = response.body.data.steps.findIndex((element) => element.type === 'class')
            const board = response.body.data.steps.findIndex((element) => element.type === 'board')
            const exam = response.body.data.steps.findIndex((element) => element.type === 'exam')
            expect(response.body.data.steps).toHaveLength(4);
            expect(response.body.data.steps[userDetails].type).toBe('user_details');
            expect(response.body.data.steps[stepClass].type).toBe('class');
            expect(response.body.data.steps[board].type).toBe('board');
            expect(response.body.data.steps[exam].type).toBe('exam');
            expect(response.body.data.is_final_submit).toBe(false);
        });
    });

    describe.each([13, 14])('Test classes passing class', (classNo) => {
        test(`Test is submit passing class for class ${classNo}`, async () => {
            const response = await app()
                .post('/v5/student/post-student-onboarding')
                .set({ 'X-Auth-Token': jwt, version_code: 946 })
                .type('form')
                .send({
                    code: [classNo],
                    variant: 2,
                    title: [`Class ${classNo}`],
                    type: 'class',
                });

            expect(response.body).toMatchSchema(schema);
            const userDetails = response.body.data.steps.findIndex((element) => element.type === 'user_details')
            const stepClass = response.body.data.steps.findIndex((element) => element.type === 'class')
            const exam = response.body.data.steps.findIndex((element) => element.type === 'exam')
            expect(response.body.data.steps).toHaveLength(3);
            expect(response.body.data.steps[userDetails].type).toBe('user_details');
            expect(response.body.data.steps[stepClass].type).toBe('class');
            expect(response.body.data.steps[exam].type).toBe('exam');
            expect(response.body.data.is_final_submit).toBe(false);
        });
    });

    describe.each([11101, 11201, 11301])('Test classes passing exam', (examClassNo) => {
        test('Test is submit passing exam for IIT JEE', async () => {
            const response = await app()
                .post('/v5/student/post-student-onboarding')
                .set({ 'X-Auth-Token': jwt, version_code: 946 })
                .type('form')
                .send({
                    code: [examClassNo],
                    variant: 2,
                    title: ['IIT JEE'],
                    type: 'exam',
                });

            expect(response.body).toMatchSchema(schema);
            const userDetails = response.body.data.steps.findIndex((element) => element.type === 'user_details')
            expect(response.body.data.steps).toHaveLength(1);
            expect(response.body.data.steps[userDetails].type).toBe('user_details');
            expect(response.body.data.is_final_submit).toBe(true);
        });
    });

    describe.each([9, 10])('Test classes passing board', (classNo) => {
        test(`Test is submit passing board for class ${classNo}`, async () => {
            const classResponse = await app()
                .post('/v5/student/post-student-onboarding')
                .set({ 'X-Auth-Token': jwt, version_code: 946 })
                .type('form')
                .send({
                    code: [classNo],
                    variant: 2,
                    title: [`Class ${classNo}`],
                    type: 'class',
                });

            const result = classResponse.body.data.steps.find((element) => element.type === 'class');
            const result2 = result.step_items.find((element) => element.title === `Class ${classNo}`);

            const boardResponse = await app()
                .post('/v5/student/post-student-onboarding')
                .set({ 'X-Auth-Token': jwt, version_code: 946 })
                .type('form')
                .send({
                    code: [result2.code],
                    variant: 2,
                    title: ['CBSE'],
                    type: 'board',
                });
            expect(boardResponse.body.data.is_final_submit).toBe(true);
        });
    });
});
