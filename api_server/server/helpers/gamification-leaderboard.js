const _ = require('lodash');

function getStudentProfile(config, i, locale, myRank, myScore, totalMarks, deepLink, page) {
    // get the test related data for the student
    const profile1 = {
        id: 1,
        ...(i !== null && { tab: i + 1 }),
        title1: (!_.isNull(myRank)) ? `${myRank + 1}` : '--',
        title2: '',
        rank: (!_.isNull(myRank)) ? `${myRank + 1}` : '-1',
        type: 'my_rank',
        bottom_text: locale === 'hi' ? 'मेरी रैंक' : 'My Rank',
        image: `${config.staticCDN}/engagement_framework/AAF76CB1-37B9-4E82-EC0F-111D94D098D2.webp`,
        title1_font_size: page === 'course_details' ? 14 : 22,
        title2_font_size: page === 'course_details' ? 12 : 16,
        bottom_text_font_size: 14,
        title1_color: '#f3754d',
        title2_color: '#f3754d',
        bottom_text_color: '#504949',
        ...(deepLink !== null && { deeplink: deepLink }),
    };
    const profile2 = {
        id: 2,
        ...(i !== null && { tab: i + 1 }),
        title1: (!_.isNull(myRank)) ? `${myScore}` : '-',
        title2: (!_.isNull(myRank)) ? `/ ${totalMarks}` : '/-',
        marks: (!_.isNull(myRank)) ? `${myScore}` : '0',
        total_marks: (!_.isNull(myRank)) ? `${totalMarks}` : '100',
        type: 'my_marks',
        bottom_text: locale === 'hi' ? 'मेरे अंक' : 'My Marks',
        image: `${config.staticCDN}/engagement_framework/12FF7F5F-08DA-B43A-176C-196911CFF449.webp`,
        title1_font_size: page === 'course_details' ? 14 : 22,
        title2_font_size: page === 'course_details' ? 12 : 16,
        bottom_text_font_size: 14,
        title1_color: '#ea4053',
        title2_color: '#ea4053',
        bottom_text_color: '#504949',
        ...(deepLink !== null && { deeplink: deepLink }),
    };
    return [profile1, profile2];
}

module.exports = {
    getStudentProfile,
};
