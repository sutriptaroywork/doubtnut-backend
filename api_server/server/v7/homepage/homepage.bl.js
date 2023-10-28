const _ = require('lodash');
const homepageContainer = require('../../../modules/containers/homepage');
const homepageMysql = require('../../../modules/mysql/homepage');
const etoosCoursehelper = require('../../v1/course/course.helper');
const Data = require('../../../data/data');
const paymentHelper = require('../../helpers/payment');

async function getEtoosAllData(db, stDetails) {
    const etoosCaraouselData = await homepageMysql.getEtoosCaraouselClassWiseData(db.mysql.read, stDetails.student_class, stDetails.version_code);
    const caraouselData = [];
    if (etoosCaraouselData && etoosCaraouselData.length) {
        const promise = [];
        for (let i = 0; i < etoosCaraouselData.length; i++) {
            if (etoosCaraouselData[i].type === 'TOP_FACULTY') {
                promise.push(homepageContainer.getEtoosTopFacultyData(db, etoosCaraouselData[i]));
            } else if (etoosCaraouselData[i].type === 'FACULTY_CHAPTER_LIST' && JSON.parse(etoosCaraouselData[i].meta_data)[0] !== 0) {
                promise.push(homepageContainer.getEtoosFacultyChapterList(db, etoosCaraouselData[i]));
            } else if (etoosCaraouselData[i].type === 'FACULTY_CHAPTER_LIST' && JSON.parse(etoosCaraouselData[i].meta_data)[0] === 0) {
                promise.push(homepageContainer.getEtoosChapterListByChapterid(db, etoosCaraouselData[i]));
            } else if (etoosCaraouselData[i].type === 'E_COURSE') {
                promise.push(homepageContainer.getEtoosECourse(db, etoosCaraouselData[i]));
            } else if (etoosCaraouselData[i].type === 'DFC') {
                promise.push(homepageContainer.getEtoosDFC(db, etoosCaraouselData[i]));
            }
        }
        const widgetData = await Promise.all(promise);
        const isVip = await paymentHelper.checkVipUser(db, stDetails.student_id);
        for (let i = 0; i < etoosCaraouselData.length; i++) {
            if (!_.isNull(etoosCaraouselData[i]) && widgetData[i].length) {
                if (etoosCaraouselData[i].type === 'TOP_FACULTY') {
                    caraouselData.push({
                        type: 'widget',
                        caraousel_order: etoosCaraouselData[i].caraousel_order,
                        widget_data: etoosCoursehelper.generateTopFacultyData({ caraouselObject: etoosCaraouselData[i], caraouselData: widgetData[i] }),
                    });
                } else if (etoosCaraouselData[i].type === 'FACULTY_CHAPTER_LIST') {
                    caraouselData.push({
                        type: 'widget',
                        caraousel_order: etoosCaraouselData[i].caraousel_order,
                        widget_data: etoosCoursehelper.generateFacultyChapterListData({ caraouselObject: etoosCaraouselData[i], caraouselData: widgetData[i] }),
                    });
                } else if (etoosCaraouselData[i].type === 'DFC') {
                    caraouselData.push({
                        type: 'widget',
                        caraousel_order: etoosCaraouselData[i].caraousel_order,
                        widget_data: etoosCoursehelper.generateDfcData({ caraouselObject: etoosCaraouselData[i], caraouselData: widgetData[i], whatsappShareMessage: Data.whatsappShareMessage }),
                    });
                } else if (etoosCaraouselData[i].type === 'E_COURSE') {
                    caraouselData.push({
                        type: 'widget',
                        caraousel_order: etoosCaraouselData[i].caraousel_order,
                        widget_data: etoosCoursehelper.generateECourseData({
                            caraouselObject: etoosCaraouselData[i], caraouselData: widgetData[i], isPremium: true, isVip,
                        }),
                    });
                }
            }
        }
    }
    return caraouselData;
}

module.exports = {
    getEtoosAllData,
};
