const _ = require('lodash')
const similar_questions_expiry = 1 * 60 * 60 * 24; // 1 day
const mc_expiry = 30 * 60 * 60 * 24; // 30 day

// let Utility = require('./utility');
module.exports = class Microconcept {
  constructor() {
  }


  static getByMcCourseMappingByClassAndCourse(microconcept_id, student_class, student_course, client) {
    return client.hgetAsync("mc_class_course", microconcept_id + "_" + student_class + "_" + student_course)
  }
  static setByMcCourseMappingByClassAndCourse(microconcept_id, student_class, student_course,mc_course_mapping, client) {
    return client.hsetAsync("mc_class_course", microconcept_id+"_"+student_class+"_"+student_course ,JSON.stringify(mc_course_mapping))

  }

  static getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, subtopic_order, microconcept_order,subject,client) {
    return client.hgetAsync("mc_class_course_order", student_class + "_" + student_course + "_" + chapter_order + "_" + subtopic_order + "_" + microconcept_order+"_"+subject)
  }

  static setByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, subtopic_order, microconcept_order,subject,mc_course_mapping, client) {
    return client.hsetAsync("mc_class_course_order", student_class + "_" + student_course + "_" + chapter_order + "_" + subtopic_order + "_" + microconcept_order+"_"+subject, JSON.stringify(mc_course_mapping))
  }

  static getSimilarQuestionsByMcId(mc_id, client) {
    return client.hgetAsync("mc_similar_"+mc_id, mc_id)
  }

  static setSimilarQuestionsByMcId(mc_id, data, client) {

    return client.multi()
      .hset("mc_similar_" + mc_id, mc_id, JSON.stringify(data))
        .expireat("mc_similar_" + mc_id, parseInt((+new Date) / 1000) + similar_questions_expiry)
        .execAsync();
  }
  static getByMcCourseMappingByClassAndCourseWithLanguage(microconcept_id, student_class, student_course,language, client) {
    return client.hgetAsync("mc_class_course", microconcept_id+"_"+student_class+"_"+student_course+"_"+language)
  }
  static setByMcCourseMappingByClassAndCourseWithLanguage(microconcept_id, student_class, student_course,language,mc_course_mapping, client) {
    return client.hsetAsync("mc_class_course", microconcept_id+"_"+student_class+"_"+student_course+"_"+language ,JSON.stringify(mc_course_mapping))
  }

  static getByMcCourseMappingByClassAndCourseAndOrderWithLanguage(student_class, student_course, chapter_order, subtopic_order, microconcept_order,language, client) {
    return client.hgetAsync("mc_class_course_order", student_class+"_"+student_course+"_"+chapter_order+"_"+subtopic_order+"_"+microconcept_order+"_"+language)
  }
  static setByMcCourseMappingByClassAndCourseAndOrderWithLanguage(student_class, student_course, chapter_order, subtopic_order, microconcept_order,language,mc_course_mapping, client) {
    return client.hsetAsync("mc_class_course_order", student_class+"_"+student_course+"_"+chapter_order+"_"+subtopic_order+"_"+microconcept_order+"_"+language,JSON.stringify(mc_course_mapping))
  }

  static getDistinctMcByClassAndCourse(chapter_class, chapter, client) {
    return client.hgetAsync("distinct_mc", chapter_class+"_"+chapter.replace(/[^A-Z0-9]/ig, "_"))
  }

  static setDistinctMcByClassAndCourse(chapter_class, chapter, data, client) {
    return client.multi()
      .hset("distinct_mc" , chapter_class+"_"+chapter.replace(/[^A-Z0-9]/ig, "_") , JSON.stringify(data))
        .expireat("distinct_mc", parseInt((+new Date) / 1000) + mc_expiry)
        .execAsync();
  }

  static getQuestionsByClassAndCourse(chapter_class, chapter, client) {
    return client.hgetAsync("questions_by_class_course", chapter_class+"_"+chapter.replace(/[^A-Z0-9]/ig, "_"))
  }

  static setQuestionsByClassAndCourse(chapter_class, chapter, data, client) {
    return client.multi()
      .hset("questions_by_class_course" , chapter_class+"_"+chapter.replace(/[^A-Z0-9]/ig, "_") , JSON.stringify(data))
        .expireat("questions_by_class_course", parseInt((+new Date) / 1000) + mc_expiry)
        .execAsync();
  }
}


