// const _ = require('lodash')
// const Utility = require('./utility');
// const StudentCourseMapping = require('./studentCourseMapping.js');

module.exports = class PersonalisedSubjectsMapping {
    // a kind of utility function
    static async getAvailableSubjectsToPersonalise(database) {
        // disabled for the subject personalisation code
        // const ccmIds = await StudentCourseMapping.getCcmIdsActiveForSubjectPersonalisation(database, studentId);
        const generatedSqlQuery = 'select id,image_url,subject,display,type from homepage_subjects';
        // let generated_sql_query = Utility.getQueryForSubjectPersonalisation(ccm_ids);
        return database.query(generatedSqlQuery);
    }
};
