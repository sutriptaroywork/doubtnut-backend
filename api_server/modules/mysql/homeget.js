const _ = require('lodash')
let limit = 9
module.exports = class Homeget {
  constructor() {
  }
	static getNcertBrowseQuestions(database) {
    	let sql = "select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id WHERE student_id=1 and is_answered=1  LIMIT "+limit
    	return database.query(sql);
  	}
   	static getRDsharmaBrowseQuestions(database) {
    
    	let sql = "select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id=4 and doubt like '%RD%' and is_answered=1  LIMIT "+limit
    	return database.query(sql);
	  }
	  
	static getCbseQuestions(database) {
    	let sql = "SELECT questions.question_id,questions.class as class_id,questions.chapter as chapter_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question,questions_meta.* FROM `questions` INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id WHERE questions.student_id = 98 AND questions.ocr_text LIKE '%CBSE%' AND questions.is_answered=1 ORDER BY questions.question_id DESC LIMIT "+limit
    	return database.query(sql);
  	}

	static getCengageBrowseQuestions(database) {
	    
		// let sql = "select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id=5 and doubt not like '%RD%' and is_answered=1  LIMIT "+limit
		let sql = "Select subtopic_cen.chapter, questions.question_id,questions.class as q_class, questions.doubt,questions.ocr_text,questions.question,questions.matched_question,questions_meta.class,questions_meta.subtopic,questions_meta.microconcept,questions_meta.level,questions_meta.target_course,questions_meta.package,questions_meta.type,questions_meta.q_options,questions_meta.q_answer,questions_meta.diagram_type,questions_meta.concept_type,questions_meta.chapter_type,questions_meta.we_type,questions_meta.ei_type,questions_meta.aptitude_type,questions_meta.pfs_type,questions_meta.symbol_type,questions_meta.doubtnut_recommended,questions_meta.secondary_class,questions_meta.secondary_chapter,questions_meta.secondary_subtopic,questions_meta.secondary_microconcept,questions_meta.video_quality,questions_meta.audio_quality,questions_meta.language,questions_meta.ocr_quality,questions_meta.timestamp,questions_meta.is_skipped from (Select * from questions where student_id = 5 and is_answered = 1) as questions left join questions_meta on questions.question_id = questions_meta.question_id left join subtopic_cen on questions.doubt=subtopic_cen.code LIMIT 10";
	    return database.query(sql);
  	}

  	static getTenthBoardsBrowseQuestions(database) {

	    let sql = "select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id WHERE student_id=9 and is_answered=1   LIMIT "+limit
	    return database.query(sql);
  	}

  	static getBoardsBrowseQuestions(database) {
	    let sql = "select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id=2 and is_answered=1  LIMIT "+limit
	    return database.query(sql);
  	}

	static getJeeMainsQuestions(database){
    	let sql = "select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question ,questions_meta.* FROM questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id=3 and doubt LIKE 'JM_18%' and is_answered=1 ORDER BY questions.doubt ASC  LIMIT "+limit
    	return database.query(sql);
  	}

  	static getJeeAdvancedBrowseQuestions(database) {
    	let sql = "select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question ,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id=8 and doubt LIKE 'JA%' and is_answered=1  LIMIT "+limit
    	return database.query(sql);
  	}

  	static getJeeBrowseQuestions(database) {
    	sql = "SELECT questions.question_id,questions.ocr_text,questions.question,questions.matched_question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id = 3 AND doubt LIKE 'JM_18%' and is_answered=1 ORDER BY `doubt` ASC LIMIT "+limit
    	return database.query(sql);
  	}

  	static getMostWatchedQuestions(database){
    	let sql="SELECT * FROM (SELECT a.question_id,b.ocr_text,b.matched_question,b.question FROM (SELECT question_id, COUNT(view_id) as total_views FROM video_view_stats GROUP BY question_id ORDER BY total_views DESC LIMIT 10) as a LEFT JOIN (SELECT question_id,ocr_text,question,matched_question FROM questions) as b on b.question_id=a.question_id) as c INNER JOIN questions_meta on questions_meta.question_id=c.question_id LIMIT 10";
    	return database.query(sql);
	}
	  
	static getNcertBrowseQuestionsLocalisation(locale_val, database) {
		let sql = "";
		if(locale_val == 'hindi')
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
		else
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
    	return database.query(sql);
  	}
   	static getRDsharmaBrowseQuestionsLocalisation(locale_val, database) {
		let sql = ""
		if(locale_val == 'hindi')
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
		else
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
    	return database.query(sql);
	  }
	  
	static getCbseQuestionsLocalisation(database) {
		let sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=98 AND questions_web.ocr_text LIKE '%CBSE%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
    	return database.query(sql);
  	}

	static getCengageBrowseQuestionsLocalisation(locale_val, database) {
		let sql = ""
		if(locale_val == 'hindi')
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
		else
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
	    return database.query(sql);
  	}

  	static getTenthBoardsBrowseQuestionsLocalisation(locale_val, database) {
		let sql = ""
		if(locale_val == 'hindi')
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=9 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
		else
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=9 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
	    return database.query(sql);
  	}

  	static getBoardsBrowseQuestionsLocalisation(locale_val, database) {
		let sql = ""
		if(locale_val == 'hindi')
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=2 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
		else
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=2 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
	    return database.query(sql);
  	}

	static getJeeMainsQuestionsLocalisation(locale_val, database){
		let sql = ""
		if(locale_val == 'hindi')
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 and doubt LIKE 'JM_18%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
		else
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 and doubt LIKE 'JM_18%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
    	return database.query(sql);
  	}

  	static getJeeAdvancedBrowseQuestionsLocalisation(locale_val, database) {
		let sql = ""
		if(locale_val == 'hindi')
		{
			sql = "select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=8 and questions_web.subject like '%math%' and doubt LIKE 'JA%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
		else
		{
			sql = "select questions_web.question_id, questions_web.subject , questions_web.student_id, questions_web.doubt, questions_web.class, questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=8 and questions_web.subject like '%math%' and doubt LIKE 'JA%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY RAND() LIMIT 10"
		}
    	return database.query(sql);
	}
	  
	  static getPhysicsQuestionsLocalisation(locale_val, database) {
		let sql = ""
		if(locale_val == 'hindi')
		{
			sql = "SELECT a.question_id, a.student_id, a.doubt, a.class, a.chapter_hi as chapter, a.subtopic_hi as subtopic, a.ocr_text_hi as ocr_text, a.package, a.target_course, a.matched_question, a.packages, b.url_text FROM `questions_web` AS a LEFT JOIN web_question_url AS b ON a.question_id = b.question_id WHERE a.subject LIKE 'phy%' AND is_answered = 1 AND b.canonical_url IS NOT NULL AND b.canonical_url <> '' ORDER BY RAND() LIMIT 10"
		}
		else
		{
			sql = "SELECT a.question_id, a.student_id, a.doubt, a.class, a.chapter, a.subtopic, a.ocr_text, a.package, a.target_course, a.matched_question, a.packages, b.url_text FROM `questions_web` AS a LEFT JOIN web_question_url AS b ON a.question_id = b.question_id WHERE a.subject LIKE 'phy%' AND is_answered = 1 AND b.canonical_url IS NOT NULL AND b.canonical_url <> '' ORDER BY RAND() LIMIT 10"
		}
    	return database.query(sql);
	}
	
	static getChemistryQuestionsLocalisation(locale_val, database) {
		let sql = ""
		if(locale_val == 'hindi')
		{
			sql = "SELECT a.question_id, a.student_id, a.doubt, a.class, a.chapter_hi as chapter, a.subtopic_hi as subtopic, a.ocr_text_hi as ocr_text, a.package, a.target_course, a.matched_question, a.packages, b.url_text FROM `questions_web` AS a LEFT JOIN web_question_url AS b ON a.question_id = b.question_id WHERE a.subject LIKE 'chem%' AND is_answered = 1 AND b.canonical_url IS NOT NULL AND b.canonical_url <> '' ORDER BY RAND() LIMIT 10"
		}
		else
		{
			sql = "SELECT a.question_id, a.student_id, a.doubt, a.class, a.chapter, a.subtopic, a.ocr_text, a.package, a.target_course, a.matched_question, a.packages, b.url_text FROM `questions_web` AS a LEFT JOIN web_question_url AS b ON a.question_id = b.question_id WHERE a.subject LIKE 'chem%' AND is_answered = 1 AND b.canonical_url IS NOT NULL AND b.canonical_url <> '' ORDER BY RAND() LIMIT 10"
		}
    	return database.query(sql);
	}

	static getBiologyQuestionsLocalisation(locale_val, database) {
		let sql = ""
		if(locale_val == 'hindi')
		{
			sql = "SELECT c.*, d.url_text FROM (SELECT a.question_id, a.student_id, a.doubt, a.class, a.chapter_hi as chapter, a.subtopic_hi as subtopic, a.ocr_text_hi as ocr_text, a.package, a.target_course, a.matched_question, a.packages FROM `questions_web` AS a LEFT JOIN answers AS b ON a.question_id = b.question_id WHERE a.subject LIKE 'bio%' AND is_answered = 1 ORDER BY RAND() LIMIT 10) AS c LEFT JOIN web_question_url AS d ON c.question_id = d.question_id WHERE d.canonical_url IS NOT NULL AND d.canonical_url <> ''"
		}
		else
		{
			sql = "SELECT c.*, d.url_text FROM (SELECT a.question_id, a.student_id, a.doubt, a.class, a.chapter, a.subtopic, a.ocr_text, a.package, a.target_course, a.matched_question, a.packages FROM `questions_web` AS a LEFT JOIN answers AS b ON a.question_id = b.question_id WHERE a.subject LIKE 'bio%' AND is_answered = 1 ORDER BY RAND() LIMIT 10) AS c LEFT JOIN web_question_url AS d ON c.question_id = d.question_id WHERE d.canonical_url IS NOT NULL AND d.canonical_url <> ''"
		}
    	return database.query(sql);
	}
}
