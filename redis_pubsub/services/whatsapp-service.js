// const _ = require('lodash');
const Student = require('../../api_server/modules/student')
const Question = require('../../api_server/modules/question')
const Utility = require('../../api_server/modules/utility')
const QuestionMeta = require('../../api_server/modules/containers/questionsMeta')

const request = require('request')
module.exports = class WhatsappService {
  constructor(config) {
    this.config=config
  }

  async run(message, db) {
    // console.log(message)
    // console.log('run')
    try {
      let phone_number = this.removeFirstTwoDigitMobile(message.from)
      let image_url = message.text
      let student_id, student_class = '12', app_version = "whatsapp", subject = "Mathematics",
        ques = "about to only mathematics", chapter = "DEFAULT"
      console.log(phone_number)
      console.log(image_url)

      //check mobile number exists
      let student = await Student.checkStudentExists(phone_number, db.mysql.read)
      console.log(student)
      if (student.length > 0) {
        //exists
        student_id = student[0].student_id;
      } else {
        let student_username = Utility.generateUsername(1)
        //not exist; so create new user
        let resp = await Student.addByMobile(phone_number, null, student_class, 'en', app_version, null, student_username, "w-" + phone_number, 2, db.mysql.write)
        if (typeof resp['insertId'] !== 'undefined' && resp['insertId'] !== 0) {
          student_id = resp['insertId']
        }
      }
      console.log(student_id)
      let transLateApiResp, latex, ocr, locale, latexToAscii, text;
      let visionApiResp = await Utility.visionApi(image_url)
      console.log(visionApiResp)
      console.log(visionApiResp[0]['textAnnotations'])
      if (visionApiResp[0]['fullTextAnnotation'] !== null) {
        text = visionApiResp[0]['textAnnotations'][0]['description']
        locale = visionApiResp[0]['textAnnotations'][0]['locale']
      } else {
        text = ""
      }

      if (locale !== "en" && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
        if (text !== "") {
          console.log('3.5')
          transLateApiResp = await Utility.translateApi(text)
          console.log('3.7')
          console.log("pretext")
          console.log(transLateApiResp)
          if ((typeof transLateApiResp.text !== 'undefined') && (transLateApiResp.text.length > 0)) {
            text = transLateApiResp.text
          }
        }
      }
      console.log(text)
      console.log(locale)
      if (text.length <= 85) {
        latex = await Utility.mathpixOcrForService(image_url, this.config);
        console.log("latex")
        console.log(latex)
        latex = latex.latex
        if (latex.length > 0) {
          latexToAscii = await Utility.latexToAscii(latex);
          console.log("latexToAscii")
          console.log(latexToAscii)
          latex = latexToAscii
        } else {
          latex = ""
        }
        if (text.length < 2 * latex.length) {
          ocr = latex;
        } else {
          ocr = latex + " " + text;
        }
      } else {
        ocr = text;
      }
      console.log("ocr")
      console.log(ocr)
      ocr = Utility.replaceSpecialSymbol(ocr)
      let questionToInsert = {}, promises = []
      questionToInsert["student_id"] = student_id
      questionToInsert["class"] = student_class
      questionToInsert["subject"] = subject
      questionToInsert["book"] = subject
      questionToInsert["chapter"] = chapter
      questionToInsert["question"] = ques
      questionToInsert["doubt"] = ques
      questionToInsert["locale"] = locale
      questionToInsert["ocr_text"] = ocr
      questionToInsert["ocr_done"] = 1
      questionToInsert["original_ocr_text"] = ocr
      questionToInsert['question_image'] = image_url
      promises.push(Question.addQuestion(questionToInsert, db.mysql.write))
      promises.push(db.elasticClient.findByOcr(ocr));
      let resolvedPromises = await Promise.all(promises)
      console.log(resolvedPromises[1]['hits']['hits'])
      promises = []
      let question_meta,url
      if (resolvedPromises[1]['hits']['hits'].length > 0) {
        console.log(1)
        let self = this
        resolvedPromises[1]['hits']['hits'].forEach(async function (item) {
console.log(item)
          question_meta = await QuestionMeta.getQuestionWithMeta(item['_id'], db)
          if(question_meta.length > 0){
            // question_meta[0]['chapter'] = question_meta[0]['chapter'].replace(/[^a-zA-Z ]/g, "")
            // console.log(question_meta)
            url = self.generateUrl(question_meta[0])
            self.sendMessage(message.from,url)
          }
        });
      }
      else {
        console.log(2)
        //no match found
      }

    }

    catch (e) {
      console.log(e)
    }
  }
  generateUrl(question_meta){
    let question_id = question_meta['question_id'];
    let q_class = question_meta['q_class'];
    let m_class=question_meta['class'];
    let q_chapter=question_meta['q_chapter'];
    let m_chapter=question_meta['chapter'];
    let student_id=question_meta['student_id'];

    //take class and chapter from questions table for NCERT/OtherBooks/Packages or if meta doesnt exist
    if((student_id==1) ||(student_id=4) ||(student_id=5) ||(student_id=6) ||(student_id=10)||(student_id=11) ||(student_id=13) || (student_id=14)){
      m_class= q_class;
      m_chapter=q_chapter;
    }

    if(m_class==null){
      m_class= q_class;
    }
    if(m_chapter==null){
      m_chapter= q_chapter;
    }
    if(m_chapter==null || m_chapter==""){
      m_chapter="default";
    }

    m_chapter=m_chapter.toLowerCase().replace(/[^a-zA-Z ]/g, "").replace(/ /g,"-").replace(/\//g,"-").replace(/\&/g,"and");
    // let Buffer = new Buffer(question_id);
    question_id = Buffer.from(question_id.toString()).toString('base64')
    let url_temp="https://doubtnut.com/video/class-"+ m_class+"/"+ m_chapter+"/"+ question_id;
    return url_temp
  }
  removeFirstTwoDigitMobile(phone_number) {
    if (phone_number.length > 10) {
      phone_number = phone_number.substr(2)
    }
    return phone_number
  }

  sendMessage(phone_number,text) {
    var options = {
      method: 'GET',
      url: 'https://panel.apiwha.com/send_message.php',
      qs:
        {
          apikey: this.config.wa_api_key,
          number: phone_number,
          text: text
        }
    };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      console.log(body);
    });
  }
}
