const dailyExpiry = 60 * 60 * 24;
const flashExpiry = 60 * 1;

module.exports = class HomepageQuestionsMaster {
    static getTopicBoosterCategoryWiseData(client, widgetType, sClass, chapter) {
        return client.getAsync(`HOMEPAGE_WIDGET_QUESTIONS_${widgetType}_${sClass}_${chapter}`);
    }

    static setTopicBoosterCategoryWiseData(client, widgetType, sClass, chapter, data) {
        return client.setAsync(`HOMEPAGE_WIDGET_QUESTIONS_${widgetType}_${sClass}_${chapter}`, data, 'EX', dailyExpiry);
    }

    static getTopicBoosterByQuestionAndStudentId(client, studentId, questionId) {
        return client.getAsync(`TOPIC_BOOSTER_${studentId}_${questionId}`);
    }

    static setTopicBoosterByQuestionAndStudentId(client, studentId, questionId, data) {
        return client.setAsync(`TOPIC_BOOSTER_${studentId}_${questionId}`, data, 'EX', flashExpiry);
    }
};
