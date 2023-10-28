const _ = require('lodash');
const Package = require('../../modules/mysql/package');
const CourseContainer = require('../../modules/containers/coursev2');
const liveclassData = require('../../data/liveclass.data');
const CourseV2Container = require('../../modules/containers/coursev2');
const ClassCourseMappingContainer = require('../../modules/containers/ClassCourseMapping');
const CcmContainer = require('../../modules/containers/ClassCourseMapping')

async function targetGroupCheck({
    db, studentId, tgID, studentClass, locale, adType,
}) {
    const targetGroupInfo = await CourseContainer.getTG(db, tgID);

    if (targetGroupInfo.length === 0) {
        return false;
    }

    const studentCCM = await CcmContainer.getStudentsExamsBoardsData(db, studentId);

    if (targetGroupInfo[0].sql == null && (targetGroupInfo[0].user_class == studentClass || targetGroupInfo[0].user_class == null) && (targetGroupInfo[0].user_locale == locale || targetGroupInfo[0].user_locale == null)) {
        if (targetGroupInfo[0].user_exam == null) {
            return true;
        }
        if (targetGroupInfo[0].user_exam != null) {
            let ccmExists = false;
            const examArray = targetGroupInfo[0].user_exam.split(',');
            for (let k = 0; k < studentCCM.length; k++) {
                if (examArray.includes(studentCCM[k].id.toString())) {
                    ccmExists = true;
                    break;
                }
            }
            if (ccmExists) {
                return true;
            }
        }
    } else if (targetGroupInfo[0].sql != null) {
        if (targetGroupInfo[0].fetch_from_cache == 0) {
            return false;
        }
        if (targetGroupInfo[0].fetch_from_cache == 1) {
            if (adType === 'renewal' && targetGroupInfo[0].user_locale !== locale) {
                return false;
            }
            const isMember = await db.redis.read.sismemberAsync(`target_group_${tgID}`, studentId);
            if (isMember) {
                return true;
            }
        }
    }
    return false;

    /*
    else if (targetGroupInfo[0].sql != null) {
        if (targetGroupInfo[0].sql[targetGroupInfo[0].sql.length - 1] === ';') {
            targetGroupInfo[0].sql = targetGroupInfo[0].sql.slice(0, targetGroupInfo[0].sql.length - 1);
        }
        if (targetGroupInfo[0].sql.split(' ').includes('where')) {
            targetGroupInfo[0].sql = `${targetGroupInfo[0].sql} and student_id=${studentId}`;
        } else {
            targetGroupInfo[0].sql = `${targetGroupInfo[0].sql} where student_id=${studentId}`;
        }
        const res = await Package.runTgSql(db.mysql.read, targetGroupInfo[0].sql);
        const a = _.find(res, ['student_id', studentId]);
        if (_.isObject(a)) {
            tgCheck = true;
        }
        // * Check if user locale is same as target group locale, if not then make it false, since queries are same for both locales
        if (adType === 'renewal' && targetGroupInfo[0].user_locale !== locale) {
            tgCheck = false;
        }
    }
    return tgCheck;
    */
}

function getCategoryByStudentCCM(studentCcmData, type) {
    let finalCategory = null;
    const examCategory = [];
    let priority = 10000;
    for (let i = 0; i < studentCcmData.length; i++) {
        const category = liveclassData.examCategoryMapping[studentCcmData[i].course];
        if (type === 'IIT JEE' && category === 'IIT JEE') {
            examCategory.push(category);
        }
        if (type === 'NEET' && category === 'NEET') {
            examCategory.push(category);
        }
        if (type === 'BOARDS' && !(category === 'IIT JEE' || category === 'NEET')) {
            examCategory.push(category);
        }
    }
    if ((type === 'NEET' || type === 'IIT JEE') && examCategory.length === 0 && studentCcmData.length > 0) {
        studentCcmData = studentCcmData.filter((item) => item.course === 'IIT JEE' || item.course === 'NEET');
        if (studentCcmData && studentCcmData[0]) {
            examCategory.push(studentCcmData[0].course);
        }
    }
    for (let i = 0; i < examCategory.length; i++) {
        const selected = examCategory[i];
        const examPriority = liveclassData.categoryPriority[selected] || 1;
        if (examPriority < priority) {
            finalCategory = selected;
            priority = examPriority;
        }
    }
    return finalCategory;
}

async function targetGroupSubject({
    db, studentId, studentClass, type, localeSubject, subject,
}) {
    let subjectAssortment;
    const studentCcmData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db, studentId);
    const defaultCategory = +studentClass === 14 ? 'Defence' : 'CBSE Boards';
    let category = getCategoryByStudentCCM(studentCcmData, type) || defaultCategory;
    if (category !== 'Defence' && _.includes([14], parseInt(studentClass))) {
        category = 'Defence';
    }
    if (category !== 'State Boards' && _.includes([6, 7, 8], parseInt(studentClass))) {
        category = 'CBSE Boards';
    }
    let subjectChange;
    if ((subject === 'CHEMISTRY' || subject === 'PHYSICS' || subject === 'BIOLOGY') && _.includes([6, 7, 8, 9, 10], parseInt(studentClass))) {
        subjectChange = 'SCIENCE';
    }
    const categ = category.split(' ').join('');
    let categoryAssortments = await CourseV2Container.getCoursesList(db, categ, category, studentClass);
    let categoryAssortmentsByLocale = [];
    if (localeSubject === 'hi') {
        categoryAssortmentsByLocale = categoryAssortments.filter((e) => e.meta_info === 'HINDI');
    } else {
        categoryAssortmentsByLocale = categoryAssortments.filter((e) => e.meta_info === 'ENGLISH');
    }
    categoryAssortments = categoryAssortmentsByLocale.length ? categoryAssortmentsByLocale : categoryAssortments;
    let courseAssortment;
    if (categoryAssortments && categoryAssortments[0]) {
        courseAssortment = categoryAssortments[0].assortment_id;
        if (categoryAssortments) {
            if (subjectChange) {
                subjectAssortment = await CourseV2Container.getAssortmentSubject(db, courseAssortment, subjectChange);
            } else {
                subjectAssortment = await CourseV2Container.getAssortmentSubject(db, courseAssortment, subject);
            }
        }
    }
    return [subjectAssortment, courseAssortment];
}

async function targetGroupCheckAds({
    db, studentId, tgID, studentClass, locale, adType, studentCCM,
}) {
    const targetGroupInfo = await CourseContainer.getTGAds(db, tgID);
    if (targetGroupInfo.length === 0) {
        return false;
    }

    if (targetGroupInfo[0].sql == null && (targetGroupInfo[0].user_class == studentClass || targetGroupInfo[0].user_class == null) && (targetGroupInfo[0].user_locale == locale || targetGroupInfo[0].user_locale == null)) {
        if (targetGroupInfo[0].user_exam == null) {
            return true;
        }
        if (targetGroupInfo[0].user_exam != null) {
            let ccmExists = false;
            const examArray = targetGroupInfo[0].user_exam.split(',');
            for (let k = 0; k < studentCCM.length; k++) {
                if (examArray.includes(studentCCM[k].toString())) {
                    ccmExists = true;
                    break;
                }
            }
            if (ccmExists) {
                return true;
            }
        }
    } else if (targetGroupInfo[0].sql != null) {
        if (targetGroupInfo[0].fetch_from_cache == 0) {
            return false;
        }
        if (targetGroupInfo[0].fetch_from_cache == 1) {
            if (adType === 'renewal' && targetGroupInfo[0].user_locale !== locale) {
                return false;
            }
            const isMember = await db.redis.read.sismemberAsync(`target_group_${tgID}`, studentId);
            if (isMember) {
                return true;
            }
        }
    }
    return false;
}

module.exports = {
    targetGroupCheck,
    targetGroupSubject,
    targetGroupCheckAds,
};
