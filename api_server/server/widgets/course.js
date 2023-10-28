const CourseContainerv2 = require('../../modules/containers/coursev2');
const WidgetHelper = require('./liveclass');

async function getPopularCourseWidgetData({
    db, result, carousel, config, locale, assortmentPriceMapping,
}) {
    // function written by Megha. shifting this function from v6/course/course.helper.js to use this in SRP-BNB experiment.
    const defaultCoursePrePurchaseDetails = await CourseContainerv2.getPrePurchaseCourseHighlights(db, 0, locale, 4);
    const promise = [];
    const courseFeatures = [];
    for (let i = 0; i < result.length; i++) {
        promise.push(CourseContainerv2.getPrePurchaseCourseHighlights(db, result[i].assortment_id, locale, 4));
    }
    const featuresData = await Promise.all(promise);
    for (let i = 0; i < featuresData.length; i++) {
        if (featuresData[i].length) {
            for (let j = 0; j < featuresData[i].length; j++) {
                featuresData[i][j].image_url = featuresData[i][j].image_url || `${config.cdn_url}engagement_framework/552884D3-56A5-2133-DA3A-708AB9F74DDE.webp`;
            }
            courseFeatures.push(featuresData[i]);
        } else {
            courseFeatures.push(defaultCoursePrePurchaseDetails);
        }
    }
    return WidgetHelper.getPopularCourseWidget({
        db, result, carousel, config, locale, assortmentPriceMapping, courseFeatures,
    });
}

module.exports = {
    getPopularCourseWidgetData,
};
