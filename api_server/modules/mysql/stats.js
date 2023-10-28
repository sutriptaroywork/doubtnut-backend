const _ = require('lodash')


module.exports = class Stats {
  constructor() {
  }

  static getMostWatchedVideosByPackage(package_name,count,old_day_count,database) {

    let sql;
    if(package_name=="NCERT" || package_name=="RD SHARMA"){
    	sql = "SELECT m_class as class,question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic,ocr_text,question FROM `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') and date(timestamp)=CURDATE() order by view_count DESC LIMIT "+count;
    }
    else if(package_name==="XII BOARDS" || package_name==="JEE MAINS" || package_name==="JEE ADVANCED"){
    	package_name+=" PREVIOUS YEAR"
    	sql = "SELECT question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic,ocr_text,question FROM `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') and date(timestamp)=CURDATE() order by view_count DESC LIMIT "+count;
    }
    else{
    	sql = "SELECT question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic,ocr_text,question FROM `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') and date(timestamp)=CURDATE() order by view_count DESC LIMIT "+count;
    }
    console.log(sql)
    return database.query(sql)
  }

  static getMostWatchedVideosForFirstLevel(package_name,level1,count,old_day_count,database){
  	let sql;
  	if(package_name==="NCERT" || package_name==="RD SHARMA"){
  		sql="SELECT m_class as class,question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic,ocr_text,question FROM `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"')  && m_class='"+level1+"' && timestamp>CURRENT_DATE order by view_count DESC LIMIT "+count;
  	}
  	else if(package_name==="CENGAGE"){
  		sql="SELECT m_class as class,question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic,ocr_text,question FROM `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"')  && chapter='"+level1+"' && timestamp>CURRENT_DATE order by view_count DESC LIMIT "+count;;
  	}
  	else if(package_name==="JEE ADVANCED"){
  		package_name+=" PREVIOUS YEAR"
  		sql="SELECT distinct(b.year) as level1,a.question_id,a.answer_video,a.chapter,a.subtopic,ocr_text,question FROM (SELECT question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,4),2) as year,question_id,ocr_text,question from questions)as b on b.question_id=a.question_id WHERE year=right('"+level1+"',2)";
  	}

  	else if(package_name==="JEE MAINS"){
  		package_name+=" PREVIOUS YEAR"
  		sql="SELECT distinct(b.year) as level1,a.question_id,a.answer_video,a.chapter,a.subtopic,ocr_text,question FROM (SELECT question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,5),2) as year,question_id,ocr_text,question from questions)as b on b.question_id=a.question_id WHERE year=right('"+level1+"',2)";
  	}

  	else if(package_name==="X BOARDS"){

  		sql="SELECT distinct(b.year) as level1,a.question_id,a.answer_video,a.chapter,a.subtopic,ocr_text,question FROM (SELECT question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,6),2) as year,question_id,ocr_text,question from questions)as b on b.question_id=a.question_id WHERE year=right('"+level1+"',2)";
  	}

  	else if(package_name==="XII BOARDS"){
  		package_name+=" PREVIOUS YEAR"
  		sql="SELECT distinct(b.year) as level1,a.question_id,a.answer_video,a.chapter,a.subtopic,ocr_text,question FROM (SELECT question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,5),2) as year,question_id,ocr_text,question from questions)as b on b.question_id=a.question_id WHERE year=right('"+level1+"',2)";
  	}

  	console.log(sql)
  	return database.query(sql)
  }

  static getMostWatchedVideosForSecondLevel(package_name,level1,level2,count,old_day_count,database){
  	let sql;
  	if(package_name==="NCERT"){
  		//sql="SELECT m_class as class,question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic,ocr_text,question FROM `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"')  && m_class='"+level1+"' && chapter='"+level2+"' && timestamp>CURRENT_DATE  order by view_count DESC LIMIT "+count;
      //never use these type of queries
  	 // sql="SELECT * FROM (SELECT * FROM (SELECT questions.question_id,questions.class as q_class, questions.chapter,  questions.doubt,questions.ocr_text,questions.question,questions.matched_question,questions_meta.class,questions_meta.subtopic,questions_meta.microconcept,questions_meta.level,questions_meta.target_course,questions_meta.package,questions_meta.type,questions_meta.q_options,questions_meta.q_answer,questions_meta.diagram_type,questions_meta.concept_type,questions_meta.chapter_type,questions_meta.we_type,questions_meta.ei_type,questions_meta.aptitude_type,questions_meta.pfs_type,questions_meta.symbol_type,questions_meta.doubtnut_recommended,questions_meta.secondary_class,questions_meta.secondary_chapter,questions_meta.secondary_subtopic,questions_meta.secondary_microconcept,questions_meta.video_quality,questions_meta.audio_quality,questions_meta.language,questions_meta.ocr_quality,questions_meta.timestamp,questions_meta.is_skipped  FROM questions left join questions_meta on questions_meta.question_id=questions.question_id  WHERE questions.class="+level1+" && questions.chapter='"+level2+"' &&  questions.student_id=1 && is_answered=1  && questions_meta.is_skipped=0 ) as a left join (select GROUP_CONCAT(packages) as packages,question_id as qid_from_question_package_mapping from question_package_mapping group by question_id) as e on a.question_id = e.qid_from_question_package_mapping  order by a.doubt ASC  LIMIT 0,6) as ll left join (SELECT max(answer_id) as answer_id,question_id,answer_video FROM answers GROUP BY answer_id)as rr on ll.question_id=rr.question_id";
      sql = "select * from (select * from questions where  class="+level1+" AND chapter='"+level2+"' AND  student_id=1 AND is_answered=1 LIMIT 0,6) as a left join questions_meta as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id as qid_from_question_package_mapping from question_package_mapping group by question_id) as c on a.question_id=c.qid_from_question_package_mapping left join (SELECT max(answer_id) as answer_id,question_id as qq,answer_video FROM answers GROUP BY question_id) as d on a.question_id=d.qq"
    }

  	console.log(sql)
  	return database.query(sql)
  }

  static getFirstLevel(package_name,old_day_count,database){
  	let sql;
  	if(package_name==="NCERT" || package_name==="RD SHARMA"){
  		sql="SELECT distinct(m_class) as level1 from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"')  && m_class is not null && m_class!=''";
  	}
  	else if(package_name==="CENGAGE") {
  		sql="SELECT distinct(chapter) as level1 from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"')  && chapter is not null && chapter!=''";
  	}
  	else if(package_name==="X BOARDS"){

  		sql="SELECT distinct(b.year) as level1 FROM (SELECT distinct(chapter) as level1,question_id from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,6),2) as year,question_id from questions)as b on b.question_id=a.question_id";
  	}
  	else if(package_name==="XII BOARDS"){
  		package_name+=" PREVIOUS YEAR";
  		sql="SELECT distinct(b.year) as level1 FROM (SELECT distinct(chapter) as level1,question_id from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,5),2) as year,question_id from questions)as b on b.question_id=a.question_id";
  	}

  	else if(package_name==="JEE MAINS" ){
  		package_name+=" PREVIOUS YEAR";
  		sql="SELECT distinct(b.year) as level1 FROM (SELECT distinct(chapter) as level1,question_id from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,5),2) as year,question_id from questions)as b on b.question_id=a.question_id";
  	}

  	else if(package_name==="JEE ADVANCED"){
  		package_name+=" PREVIOUS YEAR";
  		sql="SELECT distinct(b.year) as level1 FROM (SELECT distinct(chapter) as level1,question_id from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,4),2) as year,question_id from questions)as b on b.question_id=a.question_id";
  	}
  	console.log(sql)
  	return database.query(sql)
  }

  static getSecondLevel(package_name,level1,old_day_count,database){
  	let sql;
  	if(package_name==="NCERT" || package_name==="RD SHARMA"){
  		sql="SELECT distinct(chapter) as level2 from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"')  && m_class='"+level1+"' && chapter is not null && chapter!=''";
  	}console.log(sql)
  	return database.query(sql)
  }

  	static getTopChapters(package_name,level1,database){
		let sql;
		if(package_name==="NCERT")
		{
			//sql="SELECT class, chapter, count(student_id) as count_s FROM `students_daily_problems` where class is not null and class = '"+level1+"'  group by class, chapter order by count_s DESC limit 5";
			sql="SELECT chapter,class FROM `top_viewed_chapter` WHERE class='"+level1+"' and student_id=1 and timestamp>CURRENT_DATE ORDER BY view_count DESC LIMIT 5";
		}
		else if(package_name==="RD SHARMA"){
			// sql="SELECT chapter,class FROM `top_viewed_chapter` WHERE class='"+level1+"' and student_id=(SELECT student_id from studentid_package_mapping where package='"+package_name+"') and timestamp>CURRENT_DATE ORDER BY view_count DESC LIMIT 5";
			sql="SELECT chapter, class FROM questions where class = '"+level1+"' and student_id = 4 and is_answered = 1 group by chapter order by count(question_id) DESC limit 5";
		}

		else if(package_name==="CENGAGE"){
			sql="SELECT chapter,class FROM `top_viewed_chapter` WHERE student_id=(SELECT student_id from studentid_package_mapping where package='"+package_name+"') and timestamp>CURRENT_DATE ORDER BY view_count DESC LIMIT 5";
		}
		console.log("mysql query most viewed");
		console.log(sql);
		return database.query(sql);
	}

	static getMostWatchedVideosForSecondLevelNew(package_name,level1,level2,count,old_day_count,database){
  	let sql;
  	if(package_name==="NCERT"){
      sql = "select questions_web.question_id, questions_web.class, questions_web.chapter, questions_web.student_id, questions_web.doubt, questions_web.chapter_hi, questions_web.subtopic, questions_web.subtopic_hi, questions_web.ocr_text, questions_web.ocr_text_hi, questions_web.package, questions_web.target_course, questions_web.packages, questions_web.question_timestamp, questions_web.mc_text, questions_web.mc_text_hi, questions_web.matched_question, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.student_id=1 AND questions_web.class="+level1+" AND questions_web.chapter = '"+level2+"' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.question_id DESC LIMIT 6"
    }
  	return database.query(sql)
	}

	static getMostWatchedVideosForFirstLevelNew(package_name,level1,count,old_day_count,database){
		let sql;
		if(package_name==="NCERT" || package_name==="RD SHARMA"){
			sql = "SELECT a.*, web_question_url.url_text FROM(SELECT top_viewed_video.m_class as class, top_viewed_video.question_id, top_viewed_video.answer_video, top_viewed_video.m_chapter as chapter, top_viewed_video.m_subtopic as subtopic, top_viewed_video.ocr_text, top_viewed_video.question, questions_web.matched_question FROM `top_viewed_video` left join questions_web on top_viewed_video.question_id = questions_web.question_id where top_viewed_video.student_id = (select student_id from studentid_package_mapping where package='"+package_name+"') && top_viewed_video.m_class='"+level1+"' && top_viewed_video.timestamp>CURRENT_DATE order by top_viewed_video.view_count DESC) as a LEFT JOIN web_question_url ON a.question_id = web_question_url.question_id WHERE web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' LIMIT "+count
		}
		else if(package_name==="CENGAGE"){
			sql = "SELECT a.*, web_question_url.url_text FROM(SELECT top_viewed_video.m_class as class, top_viewed_video.question_id, top_viewed_video.answer_video, top_viewed_video.m_chapter as chapter, top_viewed_video.m_subtopic as subtopic, top_viewed_video.ocr_text, top_viewed_video.question, questions_web.matched_question FROM `top_viewed_video` LEFT JOIN questions_web ON top_viewed_video.question_id = questions_web.question_id WHERE top_viewed_video.student_id = (select student_id from studentid_package_mapping where package='"+package_name+"') AND top_viewed_video.chapter = '"+level1+"' ORDER BY top_viewed_video.view_count) AS a LEFT JOIN web_question_url ON a.question_id = web_question_url.question_id WHERE web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' LIMIT "+count;
		}
		else if(package_name==="JEE ADVANCED"){
			package_name+=" PREVIOUS YEAR"
				sql = "SELECT distinct(b.year) as level1,a.question_id,a.answer_video,a.chapter,a.subtopic,b.ocr_text, b.url_text FROM (SELECT question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(questions_web.doubt,4),2) as year,questions_web.question_id,questions_web.ocr_text, web_question_url.url_text from questions_web left join web_question_url on questions_web.question_id = web_question_url.question_id WHERE web_question_url.url_text is not null and web_question_url.url_text <> '')as b on b.question_id=a.question_id WHERE b.year=right('"+level1+"',2)";
		}

		else if(package_name==="JEE MAINS"){
			package_name+=" PREVIOUS YEAR"
				sql = "SELECT distinct(b.year) as level1,a.question_id,a.answer_video,a.chapter,a.subtopic,b.ocr_text, b.url_text FROM (SELECT question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(questions_web.doubt,4),2) as year,questions_web.question_id,questions_web.ocr_text, web_question_url.url_text from questions_web left join web_question_url on questions_web.question_id = web_question_url.question_id WHERE web_question_url.url_text is not null and web_question_url.url_text <> '')as b on b.question_id=a.question_id WHERE b.year=right('"+level1+"',2)";
		}

		else if(package_name==="X BOARDS"){
				sql = "SELECT distinct(b.year) as level1,a.question_id,a.answer_video,a.chapter,a.subtopic,b.ocr_text, b.url_text FROM (SELECT question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(questions_web.doubt,4),2) as year,questions_web.question_id,questions_web.ocr_text, web_question_url.url_text from questions_web left join web_question_url on questions_web.question_id = web_question_url.question_id WHERE web_question_url.url_text is not null and web_question_url.url_text <> '')as b on b.question_id=a.question_id WHERE b.year=right('"+level1+"',2)";
		}

		else if(package_name==="XII BOARDS"){
			package_name+=" PREVIOUS YEAR"
				sql = "SELECT distinct(b.year) as level1,a.question_id,a.answer_video,a.chapter,a.subtopic,b.ocr_text, b.url_text FROM (SELECT question_id,answer_video,m_chapter as chapter,m_subtopic as subtopic from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(questions_web.doubt,4),2) as year,questions_web.question_id,questions_web.ocr_text, web_question_url.url_text from questions_web left join web_question_url on questions_web.question_id = web_question_url.question_id WHERE web_question_url.url_text is not null and web_question_url.url_text <> '')as b on b.question_id=a.question_id WHERE b.year=right('"+level1+"',2)";
		}

		console.log(sql)
		return database.query(sql)
	}

	static getTopChaptersNew(package_name,level1,database){
		let sql;
		if(package_name==="NCERT")
		{
			sql = "SELECT DISTINCT top_viewed_chapter.chapter,top_viewed_chapter.class FROM `top_viewed_chapter` LEFT JOIN questions_web ON top_viewed_chapter.chapter = questions_web.chapter WHERE top_viewed_chapter.class='"+level1+"' and top_viewed_chapter.student_id=1 and top_viewed_chapter.timestamp>CURRENT_DATE ORDER BY top_viewed_chapter.view_count DESC LIMIT 5";
		}
		else if(package_name==="RD SHARMA"){
			sql="SELECT chapter, class FROM questions_web where class = '"+level1+"' and student_id = 4 group by chapter order by count(question_id) DESC limit 5";
		}

		else if(package_name==="CENGAGE"){
			sql = "SELECT DISTINCT top_viewed_chapter.chapter,top_viewed_chapter.class FROM `top_viewed_chapter` LEFT JOIN questions_web ON top_viewed_chapter.chapter = questions_web.chapter WHERE top_viewed_chapter.student_id=(SELECT student_id from studentid_package_mapping where package='"+package_name+"') and top_viewed_chapter.timestamp>CURRENT_DATE ORDER BY top_viewed_chapter.view_count DESC LIMIT 5"
		}
		return database.query(sql);
	}

	static getFirstLevelNew(package_name,old_day_count,database){
		let sql;
		if(package_name==="NCERT" || package_name==="RD SHARMA"){
			sql = "SELECT distinct(top_viewed_video.m_class) as level1 from `top_viewed_video` LEFT JOIN questions_web ON top_viewed_video.question_id = questions_web.question_id where top_viewed_video.student_id=(select student_id from studentid_package_mapping where package='"+package_name+"')  && top_viewed_video.m_class is not null && top_viewed_video.m_class!='' ORDER BY top_viewed_video.m_class DESC"
		}
		else if(package_name==="CENGAGE") {
			sql = "SELECT distinct(top_viewed_video.chapter) as level1 from `top_viewed_video` LEFT JOIN questions_web ON top_viewed_video.question_id = questions_web.question_id where top_viewed_video.student_id=(select student_id from studentid_package_mapping where package='"+package_name+"')  && top_viewed_video.chapter is not null && top_viewed_video.chapter!=''"
		}
		else if(package_name==="X BOARDS"){
			sql = "SELECT distinct(b.year) as level1 FROM (SELECT distinct(chapter) as level1,question_id from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,6),2) as year,question_id from questions_web)as b on b.question_id=a.question_id ORDER BY b.year DESC"
		}
		else if(package_name==="XII BOARDS"){
			package_name+=" PREVIOUS YEAR";
			sql = "SELECT distinct(b.year) as level1 FROM (SELECT distinct(chapter) as level1,question_id from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,5),2) as year,question_id from questions_web)as b on b.question_id=a.question_id ORDER BY b.year DESC";
		}

		else if(package_name==="JEE MAINS" ){
			package_name+=" PREVIOUS YEAR";
			sql = "SELECT distinct(b.year) as level1 FROM (SELECT distinct(chapter) as level1,question_id from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,5),2) as year,question_id from questions_web)as b on b.question_id=a.question_id ORDER BY b.year DESC";
		}

		else if(package_name==="JEE ADVANCED"){
			package_name+=" PREVIOUS YEAR";
			sql = "SELECT distinct(b.year) as level1 FROM (SELECT distinct(chapter) as level1,question_id from `top_viewed_video` where student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') ) as a left join (SELECT right(left(doubt,4),2) as year,question_id from questions_web)as b on b.question_id=a.question_id ORDER BY b.year DESC";
		}
		return database.query(sql)
	}

	static getMostWatchedVideosByPackageNew(package_name,count,old_day_count,database) {

		let sql;
		if(package_name=="NCERT" || package_name=="RD SHARMA"){
			sql = "SELECT a.*, web_question_url.url_text FROM(SELECT top_viewed_video.m_class as class,top_viewed_video.question_id,top_viewed_video.answer_video,top_viewed_video.m_chapter as chapter,top_viewed_video.m_subtopic as subtopic,top_viewed_video.ocr_text,top_viewed_video.question FROM `top_viewed_video` LEFT JOIN questions_web ON top_viewed_video.question_id = questions_web.question_id where top_viewed_video.student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') and date(top_viewed_video.timestamp)=CURDATE() order by top_viewed_video.view_count DESC) as a LEFT JOIN web_question_url ON a.question_id = web_question_url.question_id WHERE web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' LIMIT "+count
		}
		else if(package_name==="XII BOARDS" || package_name==="JEE MAINS" || package_name==="JEE ADVANCED"){
			package_name+=" PREVIOUS YEAR"
			sql = "SELECT a.*, web_question_url.url_text FROM(SELECT top_viewed_video.question_id,top_viewed_video.answer_video,top_viewed_video.m_chapter as chapter,top_viewed_video.m_subtopic as subtopic,top_viewed_video.ocr_text,top_viewed_video.question FROM `top_viewed_video` LEFT JOIN questions_web ON top_viewed_video.question_id = questions_web.question_id where top_viewed_video.student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') and date(top_viewed_video.timestamp)=CURDATE() order by top_viewed_video.view_count DESC) as a LEFT JOIN web_question_url ON a.question_id = web_question_url.question_id WHERE web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' LIMIT "+count
		}
		else{
			sql = "SELECT a.*, web_question_url.url_text FROM(SELECT top_viewed_video.question_id,top_viewed_video.answer_video,top_viewed_video.m_chapter as chapter,top_viewed_video.m_subtopic as subtopic,top_viewed_video.ocr_text,top_viewed_video.question FROM `top_viewed_video` LEFT JOIN questions_web ON top_viewed_video.question_id = questions_web.question_id where top_viewed_video.student_id=(select student_id from studentid_package_mapping where package='"+package_name+"') and date(top_viewed_video.timestamp)=CURDATE() order by top_viewed_video.view_count DESC) as a LEFT JOIN web_question_url ON a.question_id = web_question_url.question_id WHERE web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' LIMIT "+count
		}
		return database.query(sql)
	}
  static insertQuestionStats(params,database){
      let sql = "INSERT INTO `question_ask_stats` SET ?";
      return database.query(sql,params);
  }
}
