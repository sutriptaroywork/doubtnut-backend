const { matchers } = require('jest-json-schema');
const { getExpressApp } = require('./app');
const { getTestToken } = require('./utilities');
const coursedetailpageschema = require('./schemas/coursedetailpage');
const coursehomepageschema = require('./schemas/coursehomepage');

expect.extend(matchers);

describe.skip('Course API', () => {
    let app;
    let jwt;

    beforeAll(async () => {
        app = await getExpressApp();
        jwt = await getTestToken(app);
    });

    test('Course API Page With GET Request But Without Token', async () => {
        const response = await app()
            .get('/v6/course/home?page=1');
        expect(response.body.meta.code).toBe(401);
        expect(response.body.meta.success).toBe(false);
        expect(response.body.meta.message).toBe('Unauthorized');
    });

    test('Course API Page With Correct Data GET Request With Valid Token And Version Code', async () => {
        const response = await app()
            .get('/v6/course/home?page=1')
            .set({ 'X-Auth-Token': jwt, version_code: 890 });
        expect(response.body).toMatchSchema(coursehomepageschema);
        expect(response.body.meta.code).toBe(200);
        expect(response.body.meta.message).toBe('SUCCESS');
    });

    test('Passing Course API Home Page assortment_id To Its Related Course Detail', async () => {
        const storingassortmentid = [];
        const courseresponse = await app()
            .get('/v6/course/home?page=1')
            .set({ 'X-Auth-Token': jwt, version_code: 890 });
        const datalength = courseresponse.body.data.widgets.length;
        for (let i = 2; i < datalength; i++) {
            const listlength = courseresponse.body.data.widgets[i].data.items.length;
            for (let j = 0; j < listlength; j++) {
                const allIds = courseresponse.body.data.widgets[i].data.items[j].data.assortment_id;
                storingassortmentid.push(allIds);
            }
        }
        const relatedcourseresponse = await app()
            .get(`/v7/course/get-detail?page=1&assortment_id=${storingassortmentid[0]}`)
            .set({ 'X-Auth-Token': jwt, version_code: 938, 'User-Agent': 'SuperTest' });
        // expect(relatedcourseresponse.body.meta.code).toBe(200);
        // expect(relatedcourseresponse.body.meta.message).toBe('SUCCESS');
        // expect(relatedcourseresponse.body).toMatchSchema(coursedetailpageschema);
    });
});
