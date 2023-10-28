const _ = require('lodash')
// let Utility = require('./utility');
module.exports = class StudentProperties {
    constructor() {
    }


    static getHomePageWidgetContentByType(client,widget_type, student_locale){
        return client.getAsync("HOMEPAGE_WIDGET_DATA_"+widget_type+"_"+student_locale);
    }

    static setHomePageWidgetContentByType(client, data, widget_type, student_locale){
        return client.setAsync("HOMEPAGE_WIDGET_DATA_" + widget_type + "_" + student_locale, JSON.stringify(data));
    }


    // static getById(student_id, client) {
    //     return client.hgetAsync("doubtnut_user", student_id)
    // }
    // static setById(student_id, data, client) {
    //     console.log('set question in redis')
    //     return client.hsetAsync("doubtnut_user", student_id, JSON.stringify(data))
    // }
    // static getInviteBySclass(sclass, client) {
    //     return client.hgetAsync("student_invite", sclass)
    // }

    // static setInviteBySclass(sclass, data, client) {
    //     console.log('set invite in redis')
    //     return client.hsetAsync("student_invite", sclass, JSON.stringify(data))
    // }

    // static subscribedStudentHistory(student_id, flag, limit, client) {
    //     return client.hgetAsync("similarquestions", student_id + "_" + flag + "_" + limit)
    // }
    // static setsubscribedStudentHistory(student_id, flag, limit, data, client) {
    //     console.log('set question in redis')
    //     return client.hsetAsync("similarquestions", student_id + "_" + flag + "_" + limit, JSON.stringify(data))
    // }

    // static getStudentQuestionHistoryList(student_id, limit, client) {
    //     return client.hgetAsync("similarquestions", student_id + "_" + limit)
    // }
    // static setStudentQuestionHistoryList(student_id, limit, data, client) {
    //     console.log('set question in redis')
    //     return client.hsetAsync("similarquestions", student_id + "_" + limit, JSON.stringify(data))
    // }
    // static getUserStreakCount(student_id, client) {
    //     return client.hgetAsync("video_view_streak_", student_id)
    // }
}
