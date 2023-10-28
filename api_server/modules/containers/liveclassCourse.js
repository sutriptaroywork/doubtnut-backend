const _ = require('lodash');
const AnswerContainer = require('./answer');
const microservice = require('../microservice');

module.exports = class liveclasscourse {
    static async getAssortmentsByResourceReferenceV1(db, resourceReference) {
        const [data, answerData] = await Promise.all([microservice.requestMicroServerWithoutAuthToken('/liveclass-course/get-assortment-by-resource-reference', {
            resource_reference: `${resourceReference}`,
        }, null, 2500), AnswerContainer.getByQuestionId(resourceReference, db)]);
        _.set(data, 'data.[0].duration', _.get(answerData, '[0].duration'));
        return data.data;
    }
};
