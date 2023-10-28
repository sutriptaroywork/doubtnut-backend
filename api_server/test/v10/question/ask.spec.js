const chai = require('chai');
const chaiShallowDeepEqual = require('chai-shallow-deep-equal');
const { describe, it, before } = require('mocha');
const request = require('supertest');
const sinon = require('sinon');

const askDefaultResponse = require('./askSchema').defaultResponse;

chai.use(chaiShallowDeepEqual);
chai.use(require('chai-json-schema-ajv').create({ allErrors: true, strictNumbers: true }));

const { expect } = chai;
const { app, token } = require('../../app.spec');
const json = require('./ask.json');
const Question = require('../../../modules/question');

function test() {
    const addQuestionStub = sinon.stub(Question, 'addQuestion');

    for (let i = 0; i < json.length; i++) {
        describe('ask', () => {
            let body;
            let data;
            before(async function () {
                this.timeout(20000);
                addQuestionStub.resolves({ insertId: 99999999 + i });
                // addQuestionStub.callsFake(fn)
                body = (await request(app)
                    .post('/v10/questions/ask')
                    .set({ Authorization: `Bearer ${token}` })
                    .send(json[i].req)
                    .expect(200)
                    .expect('Content-Type', /json/)).body;
            });

            it('should have all keys', () => {
                expect(body).to.haveOwnProperty('data');
                data = body.data;
                expect(data).to.haveOwnProperty('ocr_text');
                expect(data).to.haveOwnProperty('tab');
                expect(data).to.haveOwnProperty('notification');

                // expect(data.matched_questions.filter((q) => ['video', 'text'].includes(q.resource_type))).to.shallowDeepEqual(json[i].res.matched_questions);
            });

            it('should not be handwritten', () => {
                expect(data.handwritten).to.be.equal(0);
            });

            it('should have matches count > 0', () => {
                expect(data.matched_count).to.be.greaterThan(1);
            });
            it('should have valid fields', () => {
                expect(body).to.be.jsonSchema(askDefaultResponse);
            });
        });
    }
}

test();
