const _ = require('lodash')
const set_expiry = 1 * 60 * 60 // expiry time key 
const hash_expiry = 60 * 60 * 2  // expiry time key
// let Utility = require('./utility');
module.exports = class Pdf {
  constructor() {
  }

  static getSuperSeriesDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setSuperSeriesDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getJeeMains2019AprilDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setJeeMains2019AprilDataType(type1,student_class, data, client) {
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }


  static getNeet2019AprilDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setNeet2019AprilDataType(type1,student_class, data, client) {
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getMocktestDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setMocktestDataType(type1,student_class, data, client) {
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getJeeMainsPrevYearDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setJeeMainsPrevYearDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getJeeAdvPrevYearDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setJeeAdvPrevYearDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getFormulaSheetDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setFormulaSheetDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getCutOffListDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setCutOffListDataType(type1,student_class, data, client) {
   // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static get12PrevYearDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static set12PrevYearDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static get12SamplePaperDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static set12SamplePaperDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static get12MostImportantQuestionDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static set12MostImportantQuestionDataType(type1,student_class, data, client) {
   // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static get10BoardPrevYearDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static set10BoardPrevYearDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static get10SamplePaperDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static set10SamplePaperDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static get10MostImportantQuestionDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static set10MostImportantQuestionDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getIBPSClerkSpecialDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setIBPSClerkSpecialDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getConceptBoosterPdfDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setConceptBoosterPdfDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getNcertSolutionsPdfDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setNcertSolutionsPdfDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getClass9FoundationCourseDataType(type1,student_class, client) {
    return client.getAsync("HOMEPAGE_"+type1+"_"+student_class)
  }

  static setClass9FoundationCourseDataType(type1,student_class, data, client) {
    // return client.set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data), 'EX', 6*set_expiry)
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

}
