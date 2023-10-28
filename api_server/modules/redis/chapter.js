const _ = require('lodash');

const hash_expiry = 60 * 60 * 24 * 30; // 60 days
// let Utility = require('./utility');
module.exports = class Language {
    static getListWithClass(client, student_class, student_course, language) {
        return client.hgetAsync('chapter', `${student_class}_${student_course}_${language}`);
    }

    static setListWithClass(client, student_class, student_course, language, data) {
        return client.hsetAsync('chapter', `${student_class}_${student_course}_${language}`, JSON.stringify(data));
    }

    static getConceptBoosterDataWithClass(type1, client, student_class, student_course, language) {
        return client.getAsync(`HOMEPAGE_${type1}_${student_class}_${student_course}_${language}`);
    }

    static setConceptBoosterDataWithClass(type1, client, data, student_class, student_course, language) {
    // console.log(data);
    // return client.set("HOMEPAGE_"+type1+"_"+student_class+"_"+student_course+"_"+language,JSON.stringify(data), 'Ex', set_expiry)
        return client.multi()
            .set(`HOMEPAGE_${type1}_${student_class}_${student_course}_${language}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_${type1}_${student_class}_${student_course}_${language}`, parseInt((+new Date()) / 1000) + hash_expiry)
            .execAsync();
    }

    static getDetails(client, student_class, student_course, chapter, language) {
        return client.hgetAsync('chapter_details', `${student_class}_${student_course}_${chapter}_${language}`);
    }

    static setDetails(client, student_class, student_course, chapter, language, data) {
        return client.hsetAsync('chapter_details', `${student_class}_${student_course}_${chapter}_${language}`, JSON.stringify(data));
    }

    static getSubtopicDetails(client, student_class, student_course, chapter, subtopic, language) {
        return client.hgetAsync('chapter_details', `${student_class}_${student_course}_${chapter}_${subtopic}_${language}`);
    }

    static setSubtopicDetails(client, student_class, student_course, chapter, subtopic, language, data) {
        return client.hsetAsync('chapter_details', `${student_class}_${student_course}_${chapter}_${subtopic}_${language}`, JSON.stringify(data));
    }

    static getChapterStats(client, student_class, student_course, chapter, language) {
        return client.hgetAsync('chapter_stats', `${student_class}_${student_course}_${chapter}_${language}`);
    }

    static setChapterStats(client, student_class, student_course, chapter, language, data) {
        return client.hsetAsync('chapter_stats', `${student_class}_${student_course}_${chapter}_${language}`, JSON.stringify(data));
    }

    static getDistinctChapter(course, class1, client) {
        return client.hgetAsync('web_chapter', `${course}_${class1}`);
    }

    static setDistinctChapter(course, class1, data, client) {
        return client.hsetAsync('web_chapter', `${course}_${class1}`, JSON.stringify(data));
    }

    static setDistSubtopics(course, chapter, data, client) {
        return client.hsetAsync('web_subchapter', `${course}_${chapter}`, JSON.stringify(data));
    }

    static getDistSubtopics(course, chapter, client) {
        return client.hgetAsync('web_subchapter', `${course}_${chapter}`);
    }

    static getDistClasses(course, client) {
        return client.hgetAsync('web_class', course);
    }

    static setDistClasses(course, data, client) {
        return client.hsetAsync('web_class', course, JSON.stringify(data));
    }

    static setDistExercises(course, sclass, chapter, data, client) {
        return client.hsetAsync('web_exercise', `${sclass}_${course}_${chapter}`, JSON.stringify(data));
    }

    static getDistExercises(course, sclass, chapter, client) {
        return client.hgetAsync('web_exercise', `${sclass}_${course}_${chapter}`);
    }

    static setDistSubtopicsForMostWatched(course, sclass, chapter, data, client) {
        return client.hsetAsync('web_subtopic', `${sclass}_${course}_${chapter}`, JSON.stringify(data));
    }

    static getDistSubtopicsForMostWatched(course, sclass, chapter, client) {
        return client.hgetAsync('web_subtopic', `${sclass}_${course}_${chapter}`);
    }

    static getDistYears(exam, client) {
  	const redisKey = exam.split(' ').join('_');
        return client.hgetAsync('web_year', redisKey);
    }

    static setDistYears(exam, data, client) {
  	const redisKey = exam.split(' ').join('_');
        return client.hsetAsync('web_year', redisKey, JSON.stringify(data));
    }

    static getDistClassesForStudyMaterial(exam, client) {
  	const redisKey = exam.split(' ').join('_');
        return client.hgetAsync('web_exam_class', redisKey);
    }

    static setDistClassesForStudyMaterial(exam, data, client) {
        const redisKey = exam.split(' ').join('_');
        return client.hsetAsync('web_exam_class', redisKey, JSON.stringify(data));
    }

    static setDistChaptersForStudyMaterial(study, sclass, data, client) {
        const redisKey = `${study.split(' ').join('_')}_${sclass}`;
        return client.hsetAsync('web_study_chapter', redisKey, JSON.stringify(data));
    }

    static getDistChaptersForStudyMaterial(study, sclass, client) {
        const redisKey = `${study.split(' ').join('_')}_${sclass}`;
        return client.hgetAsync('web_study_chapter', redisKey);
    }

    static setCodeByChapter(chapter, data, client) {
        const redisKey = chapter.split(' ').join('_');
        return client.hsetAsync('web_study_code_chapter', redisKey, JSON.stringify(data));
    }

    static getCodeByChapter(chapter, client) {
        const redisKey = chapter.split(' ').join('_');
        return client.hgetAsync('web_study_code_chapter', redisKey);
    }

    static getDistinctChapterLocalised(locale_val, version, course, class1, client) {
        let rediskey = `${course}_${class1}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hgetAsync('web_chapter', rediskey);
    }

    static setDistinctChapterLocalised(locale_val, version, course, class1, data, client) {
        let rediskey = `${course}_${class1}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hsetAsync('web_chapter', rediskey, JSON.stringify(data));
    }

    static getDistSubtopicsLocalised(locale_val, version, course, chapter, client) {
        let rediskey = `${course}_${chapter}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hgetAsync('web_subchapter', rediskey);
    }

    static setDistSubtopicsLocalised(locale_val, version, course, chapter, data, client) {
        let rediskey = `${course}_${chapter}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hsetAsync('web_subchapter', rediskey, JSON.stringify(data));
    }

    static getDistClassesLocalised(locale_val, version, course, client) {
        let rediskey = `${course}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hgetAsync('web_class', rediskey);
    }

    static setDistClassesLocalised(locale_val, version, course, data, client) {
        let rediskey = `${course}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hsetAsync('web_class', rediskey, JSON.stringify(data));
    }

    static setDistExercisesLocalised(locale_val, version, course, sclass, chapter, data, client) {
        let rediskey = `${sclass}_${course}_${chapter}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hsetAsync('web_exercise', rediskey, JSON.stringify(data));
    }

    static getDistExercisesLocalised(locale_val, version, course, sclass, chapter, client) {
        let rediskey = `${sclass}_${course}_${chapter}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hgetAsync('web_exercise', rediskey);
    }

    static getDistYearsLocalised(version, exam, client) {
        const redisKey = `${exam.split(' ').join('_')}_${version}`;
        return client.hgetAsync('web_year', redisKey);
    }

    static setDistYearsLocalised(version, exam, data, client) {
        const redisKey = `${exam.split(' ').join('_')}_${version}`;
        return client.hsetAsync('web_year', redisKey, JSON.stringify(data));
    }

    static getDistClassesForStudyMaterialLocalised(version, exam, client) {
  	const redisKey = `${exam.split(' ').join('_')}_${version}`;
        return client.hgetAsync('web_exam_class', redisKey);
    }

    static setDistClassesForStudyMaterialLocalised(version, exam, data, client) {
        const redisKey = `${exam.split(' ').join('_')}_${version}`;
        return client.hsetAsync('web_exam_class', redisKey, JSON.stringify(data));
    }

    static setDistChaptersForStudyMaterialLocalised(locale_val, version, study, sclass, data, client) {
        const redisKey = `${study.split(' ').join('_')}_${sclass}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hsetAsync('web_study_chapter', redisKey, JSON.stringify(data));
    }

    static getDistChaptersForStudyMaterialLocalised(locale_val, version, study, sclass, client) {
        const redisKey = `${study.split(' ').join('_')}_${sclass}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hgetAsync('web_study_chapter', redisKey);
    }

    static setDistSubtopicsForMostWatchedNew(course, sclass, chapter, data, client) {
        return client.hsetAsync('web_subtopic', `${sclass}_${course}_${chapter}_v3`, JSON.stringify(data));
    }

    static getDistSubtopicsForMostWatchedNew(course, sclass, chapter, client) {
        return client.hgetAsync('web_subtopic', `${sclass}_${course}_${chapter}_v3`);
    }

    static setDistChaptersOfContent(locale_val, version, study, sclass, data, client) {
        const redisKey = `${study.split(' ').join('_')}_${sclass}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hsetAsync('web_listing_content_chapter', redisKey, JSON.stringify(data));
    }

    static getDistChaptersOfContent(locale_val, version, study, sclass, client) {
        const redisKey = `${study.split(' ').join('_')}_${sclass}_${version}`;
        if (locale_val != '') {
            rediskey += `_${locale_val}`;
        }
        return client.hgetAsync('web_listing_content_chapter', redisKey);
    }
};
