const _ = require('lodash');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const clpHelper = require('./clp.helper');
const clpMysql = require('../../../modules/mysql/clp');
const freeClassListingPageContainer = require('../../../modules/containers/freeClassListingPage');
const freeClassListingPageRedis = require('../../../modules/redis/freeClassListingPage');
const freeClassListingPageText = require('../../../data/freeClassListingText');
const { freeClassListingPageSubjectOrder } = require('../../../data/data');

async function getFilterData(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentID, locale, student_class: studentClass } = req.user;
        const { type } = req.query;
        let {
            class_type: classTypeOption, medium: mediumOption, subject_flp: subjectOption, chapter: chapterOption, teacher: teacherOption, sort: sortOption,
        } = req.query;
        if (classTypeOption) {
            classTypeOption = classTypeOption.split(',');
        }
        if (teacherOption) {
            teacherOption = teacherOption.split(',');
            teacherOption = teacherOption.map((item) => +item);
        }
        const {
            assortment_id: assortmentId,
        } = req.query;
        if (Object.prototype.toString.call(sortOption) !== '[object Array]') {
            sortOption = [sortOption];
        }
        if (type === 'SORT') {
            // 'Most Popular',
            const sortOptions = ['Most Recent', 'Oldest'];
            const { data: sortWidgets, selectedItem: selectedClassType } = clpHelper.createFilterWidget('Class Type', 'class_type', sortOptions.map((item) => freeClassListingPageText.traslateText(locale, item)), sortOptions, sortOption, false, true);
            const data = {
                title: freeClassListingPageText.traslateText(locale, 'SORT'),
                filter_id: 'sort',
                list: sortWidgets.data.filter_items,
                cta: freeClassListingPageText.traslateText(locale, 'Done'),
                is_multi_select: false,
            };
            return next({ data });
        }

        if (((!mediumOption || !subjectOption || !chapterOption || !teacherOption) && assortmentId) || (type === 'CHAPTER' || type === 'SUBJECT')) {
            const chapterData = await clpMysql.getChapterDataByAssortmentId(db.mysql.read, assortmentId);
            mediumOption = chapterData[0].meta_info;
            chapterOption = `${assortmentId}`;
            teacherOption = [];

            for (let i = 0; i < chapterData.length; i++) {
                teacherOption.push(chapterData[i].faculty_id);
            }
            teacherOption = _.uniq(teacherOption);
            const subjectData = await clpMysql.getSubjectDataFromChapter(db.mysql.read, assortmentId);
            subjectOption = `${subjectData[0].display_name}`;
        }

        if (Object.prototype.toString.call(classTypeOption) !== '[object Array]') {
            classTypeOption = classTypeOption ? [classTypeOption] : [];
        }
        if (Object.prototype.toString.call(mediumOption) !== '[object Array]') {
            mediumOption = mediumOption ? [mediumOption] : [];
        }
        if (Object.prototype.toString.call(subjectOption) !== '[object Array]') {
            subjectOption = subjectOption ? [subjectOption] : [];
        }
        if (Object.prototype.toString.call(chapterOption) !== '[object Array]') {
            chapterOption = chapterOption ? [chapterOption] : [];
        }
        if (Object.prototype.toString.call(teacherOption) !== '[object Array]') {
            teacherOption = teacherOption ? [teacherOption] : [];
        }
        const classType = ['Live class', 'Upcoming class', 'Past class'];
        const classTypeIds = ['lc', 'uc', 'pc'];
        const { data: classTypeWidgets, selectedItem: selectedClassType } = clpHelper.createFilterWidget(freeClassListingPageText.traslateText(locale, 'Class Type'), 'class_type', classType.map((item) => freeClassListingPageText.traslateText(locale, item)), classTypeIds, classTypeOption, true);
        const languagesList = ['ENGLISH', 'HINDI'];
        const { data: mediumWidgets, selectedItem: selectedMedium } = clpHelper.createFilterWidget(freeClassListingPageText.traslateText(locale, 'Medium'), 'medium', languagesList.map((item) => freeClassListingPageText.traslateText(locale, item)), languagesList, mediumOption);
        const subject = await freeClassListingPageContainer.getSubjectsForLocaleAndClass(db, studentClass, selectedMedium.join());
        subject.sort((a, b) => ((freeClassListingPageSubjectOrder[studentClass].indexOf(a.toLowerCase()) === -1 ? 1000000 : freeClassListingPageSubjectOrder[studentClass].indexOf(a.toLowerCase())) - (freeClassListingPageSubjectOrder[studentClass].indexOf(b.toLowerCase()) === -1 ? 1000000 : freeClassListingPageSubjectOrder[studentClass].indexOf(b.toLowerCase()))));
        const { data: subjectWidgets, selectedItem: selectedSubject } = clpHelper.createFilterWidget(freeClassListingPageText.traslateText(locale, 'SUBJECT'), 'subject_flp', subject.map((item) => freeClassListingPageText.traslateText(locale, item)), subject, subjectOption);
        if (type === 'SUBJECT') {
            const { data: subjectWidgetsNew } = clpHelper.createFilterWidget(freeClassListingPageText.traslateText(locale, 'SUBJECT'), 'subject_flp', subject.map((item) => freeClassListingPageText.traslateText(locale, item)), subject, subjectOption, false, true);

            const data = {
                title: freeClassListingPageText.traslateText(locale, 'SUBJECT'),
                filter_id: 'subject_flp',
                list: subjectWidgetsNew.data.filter_items,
                cta: 'Done',
                deeplink: '',
                is_multi_select: false,
            };
            return next({ data });
        }
        let chapterList = _.sortBy(await freeClassListingPageContainer.getChaptersList(db, studentClass, selectedMedium, selectedSubject[0]), ['chapter_name', 'chapter_assortment_id'], ['asc', 'desc']);
        const currentChapter = chapterList.filter((item) => chapterOption.includes(item.chapter_assortment_id));

        chapterList.unshift(...currentChapter);
        const finalChaptersList = _.uniqBy(chapterList, 'chapter_name');
        chapterList = _.sortBy(finalChaptersList, ['chapter_name'], ['asc']);

        const { data: chapterWidgets, selectedItem: selectedChapter } = clpHelper.createFilterWidget(freeClassListingPageText.traslateText(locale, 'Chapter'), 'chapter', chapterList.map((item) => item.chapter_name), chapterList.map((item) => item.chapter_assortment_id), chapterOption);

        if (type === 'CHAPTER') {
            const { data: chapterWidgetsNew } = clpHelper.createFilterWidget(freeClassListingPageText.traslateText(locale, 'Chapter'), 'chapter', chapterList.map((item) => item.chapter_name), chapterList.map((item) => item.chapter_assortment_id), chapterOption, false, true);

            const data = {
                title: 'CHAPTER',
                filter_id: 'chapter',
                list: chapterWidgetsNew.data.filter_items,
                cta: 'Done',
                deeplink: '',
                is_multi_select: false,
            };
            return next({ data });
        }

        const teacherList = _.sortBy(await freeClassListingPageContainer.getTeachersListForSubject(db, studentClass, selectedMedium, selectedSubject[0], selectedChapter), ['faculty_name']);
        const teacherArr = [];
        const teacherIds = [];
        teacherList.forEach((item) => {
            teacherArr.push(item.faculty_name);
            teacherIds.push(+item.faculty_id);
        });
        const { data: teacherWidgets, selectedItem: selectedTeacher } = clpHelper.createFilterWidget(freeClassListingPageText.traslateText(locale, 'Teacher'), 'teacher', teacherArr, teacherIds, teacherOption, true);
        const widgets = [classTypeWidgets, mediumWidgets, subjectWidgets, teacherWidgets, chapterWidgets];
        // class Type
        // medium
        // subject
        // teacher
        // chapter

        const data = {
            title: freeClassListingPageText.traslateText(locale, 'Filter your results'),
            title_size: 13,
            title_color: '#b3000000',
            is_title_bold: false,
            submit_text: freeClassListingPageText.traslateText(locale, 'Apply Filter'),
            submit_text_color: '#ea532c',
            submit_text_size: 13,
            is_submit_text_bold: false,
            clear_text: freeClassListingPageText.traslateText(locale, 'Clear All Filter'),
            clear_text_color: '#000000',
            clear_text_size: 13,
            is_clear_text_bold: false,
            widgets,
        };
        return next({
            data,
        });
    } catch (err) {
        return next({ err });
    }
}
module.exports = { getFilterData };
