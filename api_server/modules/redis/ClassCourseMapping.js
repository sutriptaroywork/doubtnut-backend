module.exports = class ClassCourseMapping {
    static getList(language, client) {
        return client.hgetAsync('language_list', `${language}class_list`);
    }

    static setHomePageWidgetContentByType(client, data, widget_type, student_class, other) {
    // console.log("set question in redis");
        return client.hsetAsync('homepage_widgets', `HOMEPAGE_WIDGET_${widget_type}_${student_class}_${other}`, JSON.stringify(data));
    }

    static getHomePageWidgetContentByType(client, widget_type, student_class, other) {
        return client.hgetAsync('homepage_widgets', `HOMEPAGE_WIDGET_${widget_type}_${student_class}_${other}`);
    }

    static getStreamDetails(client, boardId, locale) {
        return client.getAsync(`stream_list_${boardId}_${locale}`);
    }

    static setStreamDetails(client, boardId, locale, data) {
        return client.setex(`stream_list_${boardId}_${locale}`, 60, data); // 1 minute
    }

    static getCcmIdFromCourseClass(client, studentClass, course) {
        course = course.replace(' ', '_');
        return client.getAsync(`ccmid_${studentClass}_${course}`);
    }

    static setCcmIdFromCourseClass(client, studentClass, data) {
        data.course = data.course.replace(' ', '_');
        return client.setAsync(`ccmid_${studentClass}_${data.course}`, JSON.stringify(data), 'Ex', 60 * 60 * 3);
    }

    //   static setListNew(language, data, client) {
    //     console.log("set question in redis");
    //     return client.hsetAsync(
    //       "language_list_new",
    //       language + "class_list",
    //       JSON.stringify(data)
    //     );
    //   }
    static getCCMDetails(client, ccmId) {
        return client.getAsync(`ccm_details:${ccmId}`);
    }

    static setCCMDetails(client, ccmId, data) {
        return client.setAsync(`ccm_details:${ccmId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24);
    }

    static getECMData(client, course) {
        return client.getAsync(`ecm:${course}`);
    }
};
