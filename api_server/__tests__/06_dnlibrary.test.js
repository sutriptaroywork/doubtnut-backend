const { matchers } = require('jest-json-schema');
const { getExpressApp } = require('./app');
const { getTestToken } = require('./utilities');
const schema = require('./schemas/dnlibrarylandingpage');
const playlistschema = require('./schemas/dnlplaylist');
const resourceschema = require('./schemas/dnllibraryresourcepage');

expect.extend(matchers);

describe('DNlibrary', () => {
    let app;
    let jwt;

    beforeAll(async () => {
        app = await getExpressApp();
        jwt = await getTestToken(app);
    });

    test('Landing Page With Post Request Without Token', async () => {
        const response = await app()
            .post('/v7/library/getall?class=12');
        expect(response.body.meta.code).toBe(401);
        expect(response.body.meta.success).toBe(false);
        expect(response.body.meta.message).toBe('Unauthorized');
    });

    test('Landing Page With Get Request Without Token', async () => {
        const response = await app()
            .get('/v7/library/getall?class=12');
        expect(response.body.meta.code).toBe(401);
        expect(response.body.meta.success).toBe(false);
        expect(response.body.meta.message).toBe('Unauthorized');
    });

    test('Landing Page With Correct Data', async () => {
        const response = await app()
            .get('/v7/library/getall?class=8')
            .set({ 'X-Auth-Token': jwt });
        expect(response.body.meta.code).toBe(200);
        expect(response.body.meta.success).toBe(true);
        expect(response.body.meta.message).toBe('SUCCESS');
        expect(response.body).toMatchSchema(schema);
    });

    describe.each([6, 7, 8, 9, 10, 11, 12])('Landing Page Test classes for class', (librarypageclassNo) => {
        test(`Landing Page for class ${librarypageclassNo}`, async () => {
            const response = await app()
                .get(`/v7/library/getall?class=${librarypageclassNo}`)
                .set({ 'X-Auth-Token': jwt });
            expect(response.body.meta.code).toBe(200);
            expect(response.body.meta.success).toBe(true);
            expect(response.body.meta.message).toBe('SUCCESS');
            expect(response.body).toMatchSchema(schema);
        });
    });

    describe.each([10, 11, 12])('DNLibraryPlaylist Without Token', (classNo) => {
        test(`DNLibraryPlaylist Without Token for class ${classNo}`, async () => {
            const landingPageResponse = await app()
                .get(`/v7/library/getall?class=${classNo}`)
                .set({ 'X-Auth-Token': jwt });
            const datalength = landingPageResponse.body.data.length;
            for (let i = 0; i < datalength; i++) {
                const listlength = landingPageResponse.body.data[i].list.length;
                for (let j = 0; j < listlength; j++) {
                    const allIds = landingPageResponse.body.data[i].list[j].id;

                    // eslint-disable-next-line no-await-in-loop
                    const playlistResponse = await app()
                        .get(`/v7/library/getplaylist?page_no=1&id=${allIds}&student_class=${classNo}`);
                    expect(playlistResponse.body.meta.code).toBe(401);
                    expect(playlistResponse.body.meta.success).toBe(false);
                    expect(playlistResponse.body.meta.message).toBe('Unauthorized');
                }
            }
        });
    });

    describe.each([10, 11, 12])('DNLibraryPlaylist With Token', (classNo) => {
        test(`DNLibraryPlaylist With Token for class ${classNo}`, async () => {
            const landingPageResponse = await app()
                .get(`/v7/library/getall?class=${classNo}`)
                .set({ 'X-Auth-Token': jwt });
            const datalength = landingPageResponse.body.data.length;
            for (let i = 0; i < datalength; i++) {
                const listlength = landingPageResponse.body.data[i].list.length;
                for (let j = 0; j < listlength; j++) {
                    const allIds = landingPageResponse.body.data[i].list[j].id;

                    // eslint-disable-next-line no-await-in-loop
                    const playlistResponse = await app()
                        .get(`/v7/library/getplaylist?page_no=1&id=${allIds}&student_class=${classNo}`)
                        .set({ 'X-Auth-Token': jwt });
                    expect(playlistResponse.body.meta.code).toBe(200);
                    expect(playlistResponse.body.meta.success).toBe(true);
                    expect(playlistResponse.body.meta.message).toBe('SUCCESS');
                    expect(playlistResponse.body).toMatchSchema(playlistschema);
                }
            }
        });
    });

    test('DNLibraryResource for class 11', async () => {
        const landingPageResponse = await app()
            .get('/v7/library/getall?class=11')
            .set({ 'X-Auth-Token': jwt });

        const datalengthforlandingresource = landingPageResponse.body.data.length;
        for (let i = 0; i < datalengthforlandingresource; i++) {
            const listlengthforlandingresource = landingPageResponse.body.data[i].list.length;
            for (let j = 0; j < listlengthforlandingresource; j++) {
                const allLandingPageIds = landingPageResponse.body.data[i].list[j].id;

                // eslint-disable-next-line no-await-in-loop
                const playlistResponse = await app()
                    .get(`/v7/library/getplaylist?page_no=1&id=${allLandingPageIds}&student_class=11`)
                    .set({ 'X-Auth-Token': jwt });

                const datalengthforplaylistresource = playlistResponse.body.data.list.length;
                if (datalengthforplaylistresource > 0) {
                    for (let i1 = 0; i1 < datalengthforplaylistresource; i1++) {
                        const allPlaylistPageIds = playlistResponse.body.data.list[i1].id;

                        // eslint-disable-next-line no-await-in-loop
                        const resourceResponse = await app()
                            .get(`/v7/library/getresource?page_no=1&id= ${allPlaylistPageIds}`)
                            .set({ 'X-Auth-Token': jwt });
                        if (resourceResponse.body.meta) {
                            expect(resourceResponse.body.meta.code).toBe(200);
                            expect(resourceResponse.body.meta.success).toBe(true);
                            expect(resourceResponse.body.meta.message).toBe('SUCCESS');
                            expect(resourceResponse.body).toMatchSchema(resourceschema);
                        }
                    }
                }
            }
        }
    });
});
