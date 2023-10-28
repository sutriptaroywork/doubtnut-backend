/*
* @Author: Xesloohc
* @Date:   2018-12-13 19:25:49
* @Last Modified by:   XesLoohc
* @Last Modified time: 2018-12-14 11:29:11
*/
//INTEGRATE L8R
//
async function getTestSections(req,res,next){
	db = req.app.get('db')
	config = req.app.get('config')

	let testId = req.params['testId']

	let testsectionsData = []

	testsectionsData = await TestSections.getActiveTestSectionByTestSeriesId(db.mysql.read,testId)

	let responseData =
		{
      "meta":
	      {
	        "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
      "data": testSectionArrayResponseFormatter(testsectionsData)
    }
  res.status(responseData.meta.code).json(responseData) 
}

async function getQuestionsByTest(req,res,next){
	db = req.app.get('db')
	config = req.app.get('config')

	let testId = req.params['testId']

	let testQuestionsData = await  TestQuestions.getAllTestQuestionsByTestId(db.mysql.read,testId)

	let responseData =
		{
      "meta":
	      {
	        "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
      "data": testQuestionsArrayResponseFormatter(testQuestionsData)
    }
}
async function getQuestionsBySection(req,res,next){
	db = req.app.get('db')
	config = req.app.get('config')

	let testId = req.params['testId']
	let sectionCode = req.params['sectionCode']

	let sectionQuestionsData =  await TestQuestions.getAllTestQuestionsByTestSectionCodeAndTestId(db.mysql.read,testId,sectionCode)

	let responseData =
		{
      "meta":
	      {
	        "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
      "data": testQuestionsArrayResponseFormatter(sectionQuestionsData)
    }
  res.status(responseData.meta.code).json(responseData)
}
async function getQuestionsBySectionWithData(req,res,next){
	db = req.app.get('db')
	config = req.app.get('config')

	let testId = req.params['testId']
	let sectionCode = req.params['sectionCode']

	let sectionQuestionsData =  await TestQuestions.getAllTestQuestionsByTestSectionCodeAndTestIdWithData(db.mysql.read,testId,sectionCode)

	let questionBankKeysString = _.join(_.keys(_.groupBy(sectionQuestionsData,'questionbank_id')),',')

	let questionOptionData =  await TestQuestions.getAllOptionsByQuestionIds(db.mysql.read,questionBankKeysString)

	questionOptionDataGrouped = _.groupBy(questionOptionData,'questionbank_id')

	let responseData =
		{
      "meta":
	      {
	        "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
      "data": testQuestionsWithDataArrayResponseFormatter(sectionQuestionsData,questionOptionDataGrouped)
    }
}