const _ = require('lodash');
const redis = require('../redis/library');

module.exports = class Library {
    constructor() {}

    static async fetchLandingData(db, data, locale) {
        const row_list = [];

        for (let i = 0; i < data.length; i++) {
            row_list.push(data[i].id);
        }

        if (row_list.length == 0) { return data; }

        for (let i = 0; i < data.length; i++) {
            if (data[i].name) {
                data[i].name = global.t8[locale].t(data[i].name);
            }
            if (data[i].student_course) {
                data[i].student_course = global.t8[locale].t(data[i].student_course);
            }
            if (data[i].image_url) {
                data[i].image_url = global.t8[locale].t(data[i].image_url);
            }
            if (data[i].main_description) {
                data[i].main_description = global.t8[locale].t(data[i].main_description);
            }
        }
    }

    static async translatePlaylist(db, data, locale) {
        const rowList = [];

        if (typeof data.list !== undefined && data.list != null) {
            for (let i = 0; i < data.list.length; i++) {
                rowList.push(data.list[i].id);
            }
        }

        if (typeof data.headers !== undefined && data.headers != null) {
            for (let i = 0; i < data.headers.length; i++) {
                rowList.push(data.headers[i].id);
            }
        }

        if (typeof data.filters !== undefined && data.filters != null) {
            for (let i = 0; i < data.filters.length; i++) {
                rowList.push(data.filters[i].id);
            }
        }

        if (rowList.length == 0) { return data; }

        let { list } = data;
        if (typeof data.list !== undefined && data.list != null) {
            for (let i = 0; i < list.length; i++) {
                if (list[i].name) {
                    list[i].name = global.t8[locale].t(list[i].name);
                }
                if (list[i].description) {
                    list[i].description = global.t8[locale].t(list[i].description);
                }
                if (list[i].image_url) {
                    list[i].image_url = global.t8[locale].t(list[i].image_url);
                }
            }
        }

        if (typeof data.headers !== undefined && data.headers != null) {
            list = typeof data.headers !== undefined ? data.headers : [];

            for (let i = 0; i < list.length; i++) {
                if (list[i].name) {
                    list[i].name = global.t8[locale].t(list[i].name);
                }
                if (list[i].description) {
                    list[i].description = global.t8[locale].t(list[i].description);
                }
                if (list[i].image_url) {
                    list[i].image_url = global.t8[locale].t(list[i].image_url);
                }
            }
        }

        if (typeof data.filters !== undefined && data.filters != null) {
            list = typeof data.filters !== undefined ? data.filters : [];

            for (let i = 0; i < list.length; i++) {
                if (list[i].name) {
                    list[i].name = global.t8[locale].t(list[i].name);
                }
                if (list[i].description) {
                    list[i].description = global.t8[locale].t(list[i].description);
                }
                if (list[i].image_url) {
                    list[i].image_url = global.t8[locale].t(list[i].image_url);
                }
            }
        }

        return data;
    }
};
