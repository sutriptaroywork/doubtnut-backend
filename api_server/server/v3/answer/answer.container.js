"use strict";
const Question = require('../../../modules/question')
const MicroconceptContainer = require('../../../modules/containers/microconcept')

module.exports = {
  getNextMicroConcept: getNextMicroConcept,
  getNextMicroConceptWithLanguage: getNextMicroConceptWithLanguage
}

async function getNextMicroConcept(mc_id, student_class, student_course, data, db) {
  let promiseResolve, promiseReject;

  try {

    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });
    let nextMicroConcept
    //console.log("nextMicroConcept")
    //console.log(data)
    //console.log(mc_id, student_class, student_course)
    let microConceptOrderData = await MicroconceptContainer.getByMcCourseMappingByClassAndCourse(mc_id, student_class, student_course, db)
    //console.log("microConceptOrderData");
    //console.log(microConceptOrderData);
    let subject = microConceptOrderData[0].subject
    let chapter_order = microConceptOrderData[0].chapter_order;
    let sub_topic_order = microConceptOrderData[0].sub_topic_order;
    let micro_concept_order = microConceptOrderData[0].micro_concept_order + 1;
    data['question_meta'] = {
      'chapter': microConceptOrderData[0].chapter,
      'subtopic': microConceptOrderData[0].subtopic
    };
    nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, sub_topic_order, micro_concept_order,subject, db)
    if (!nextMicroConcept.length > 0) {
      //get next micro concept using subtopic order
      sub_topic_order = sub_topic_order + 1;
      micro_concept_order = 1;
      nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, sub_topic_order, micro_concept_order,subject, db)
      if (!nextMicroConcept.length > 0) {
        //get next micro concept using chapter order
        chapter_order = chapter_order + 1;
        sub_topic_order = 1;
        nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrder(student_class, student_course, chapter_order, sub_topic_order, micro_concept_order,subject, db)
        data["next_microconcept"] = nextMicroConcept[0]
        promiseResolve(data)
        return promise
      } else {
        data["next_microconcept"] = nextMicroConcept[0]
        promiseResolve(data)
        return promise
      }
    } else {
      data["next_microconcept"] = nextMicroConcept[0]
      promiseResolve(data)
      return promise
    }
  } catch (e) {
    //console.log(e)
    promiseResolve(data)
    return promise
  }
}

async function getNextMicroConceptWithLanguage(mc_id, student_class, student_course, language, data, db) {
  let promiseResolve, promiseReject;

  try {

    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });
    let nextMicroConcept
    //console.log("nextMicroConcept")
    //console.log(data)
    //console.log(mc_id, student_class, student_course)
    let microConceptOrderData = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseWithLanguage(mc_id, student_class, student_course, language, db)
    //console.log("microConceptOrderData");
    //console.log(microConceptOrderData);
    let chapter_order = microConceptOrderData[0].chapter_order;
    let sub_topic_order = microConceptOrderData[0].sub_topic_order;
    let micro_concept_order = microConceptOrderData[0].micro_concept_order + 1;
    data['question_meta'] = {
      'chapter': microConceptOrderData[0].chapter,
      'chapter_display': microConceptOrderData[0].chapter_display,
      'subtopic': microConceptOrderData[0].subtopic,
      'subtopic_display': microConceptOrderData[0].subtopic_display
    };
    nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrderWithLanguage(student_class, student_course, chapter_order, sub_topic_order, micro_concept_order, language, db)
    if (!nextMicroConcept.length > 0) {
      //get next micro concept using subtopic order
      sub_topic_order = sub_topic_order + 1;
      micro_concept_order = 1;
      nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrderWithLanguage(student_class, student_course, chapter_order, sub_topic_order, micro_concept_order, language, db)
      if (!nextMicroConcept.length > 0) {
        //get next micro concept using chapter order
        chapter_order = chapter_order + 1;
        sub_topic_order = 1;
        nextMicroConcept = await MicroconceptContainer.getByMcCourseMappingByClassAndCourseAndOrderWithLanguage(student_class, student_course, chapter_order, sub_topic_order, micro_concept_order, language, db)
        data["next_microconcept"] = nextMicroConcept[0]
        promiseResolve(data)
        return promise
      } else {
        data["next_microconcept"] = nextMicroConcept[0]
        promiseResolve(data)
        return promise
      }
    } else {
      data["next_microconcept"] = nextMicroConcept[0]
      promiseResolve(data)
      return promise
    }
  } catch (e) {
    //console.log(e)
    promiseResolve(data)
    return promise
  }
}
