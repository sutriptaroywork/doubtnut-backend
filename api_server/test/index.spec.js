const { it, describe } = require('mocha');
const { expect, assert } = require('chai');
const request = require('supertest');
const { app } = require('./app.spec');

describe('health check', () => {
    /**
     * Assert style
     */
    describe('v1', async () => {
        it('should return OK2', (done) => {
            request(app)
                .get('/v1/health-check')
                .expect(200)
                .expect('Content-Type', /text/)
                .end((err, res) => {
                    if (err) {
                        return done(err);
                    }
                    assert.equal(res.text, 'OK2');
                    done();
                });
        });
    });

    /**
     * BDD style
     */
    describe('v2', async () => {
        it('should return OK', async () => {
            const res = await request(app).get('/v2/health-check').expect(200).expect('Content-Type', /text/);
            expect(res.text).to.be.equal('OK');
        });
    });
});

require('./v9/index.spec');
require('./helpers/index.spec');
require('./modules/index.spec');
