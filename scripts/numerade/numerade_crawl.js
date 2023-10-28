//require('dotenv').config({path : __dirname + '/../../api_server/.env.dev'})
require('dotenv').config({path : __dirname + '/../../api_server/.env'})

const config = require(__dirname+'/../../api_server/config/config')
const database = require('../../api_server/config/database')
const conWrite = config.mysql_write;
const db = new database(conWrite)

const axios = require('axios');
const { parse } = require('node-html-parser');
const domain ='https://www.numerade.com';
const redis = require('redis');
const sqlQueries = require('./numerade_sql.js');
const fs = require('fs');
// const redisClient = redis.createClient();
const { Parser } = require('json2csv');
const json2csvParser = new Parser();

//const redisClient = redis.createClient({legacyMode: false});
const redisClient = redis.createClient({legacyMode: true});

console.log(redisClient);

redisClient.on("connect", async function() {
    console.log("Redis client connected successfully");
  
}); 
redisClient.on("error", function (err){
	console.log("Error" + err);
});

redisClient.connect();

async function getHtml(url, timeout = 10000) {
    try {
      console.log('hitting url---', url);
        const { data }  = await axios({
            method: 'GET',
            url,
            timeout,

        });
        return data;
    } catch (e) {
      console.error( "!!!!!!!!!!!!!!!!!!!!!!!! failed to request this url:", url);
      throw new Error(e);
    }
}


async function getBooksHtml(href, page) {
    const bookHtml = await getHtml(`${domain}${href}&page=${page}`);
    const root = parse(bookHtml);
    const bookCards = root.querySelectorAll('.book-card');
    if (page == 1) {
        const lastPage = root.querySelectorAll('.assigned-header a');
        lastPageURL = lastPage[lastPage.length -2].getAttribute('href');
    }
    if (lastPageURL !== `${href}&page=${page}`) {
        bookCards.map((e) => {
            bookCardArray.push(e);
        })
        page++;
        await getBooksHtml(href, page);
    } else {
        console.log('hi')
        bookCards.map((e) => {
            bookCardArray.push(e)
        })
        return bookCardArray;
    }
}

function sanitizeString(str) {
  str = str.replace(/\s/g,'')
  let bad_index = -1;
  for (let i = str.length-1; i >= 0; i--) {
    if (str[i] == ',') {

      if ((str[i-1] == '}' || str[i-1] == ']') && (str[i+1] == '}' || str[i+1] == ']')) {
        bad_index = i;
        break;
      }
    }
  }
  if (bad_index !== -1) {
    str = str.substring(0, bad_index) + str.substring(bad_index+1);
  }
  return str;
}
async function getSectionHtml(link, {bookId, insertedBookId},{insertedChapterId}, {sectionNumber, sectionName}) {
  console.log("entered  getSectionHtml");

      const questionHtml = await getHtml(`${domain}${link}`);
      // try {
      const root = parse(questionHtml);
      const problems = root.querySelectorAll('.chapter-question__text-c');
      let problemStartPoint = await redisClient.HGET(bookId, 'problem');
      problemStartPoint = parseInt(problemStartPoint, 10);
      console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ in getQuestionLinksFromSection:", problems.length, `${domain}${link}`);
      let numOfProblemsInSection = problems.length;

      let sectionData = {
        name: sectionName,
        number: sectionNumber,
        number_of_questions: numOfProblemsInSection,
        chapter_id: insertedChapterId
      };

      let insertedSectionId;
    let lastInsertedSectionId = await redisClient.HGET(bookId, 'lastInsertedSectionId');
    if (lastInsertedSectionId && Number(lastInsertedSectionId) >= 1) {
        console.log("Section already inserted into DB,", Number(lastInsertedSectionId));
        insertedSectionId = Number(lastInsertedSectionId);
    } else {
      let sqlResp = await await sqlQueries.insertSection(db, sectionData, bookId, redisClient);
      insertedSectionId = sqlResp.insertId;
    }
    console.log(insertedSectionId);

      if (typeof(insertedSectionId) != 'number') {
        throw new Error(insertedSectionId);
      }
      await redisClient.HSET(bookId, 'lastInsertedSectionId', insertedSectionId);
      console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ section successfully added question to db:", insertedSectionId);
      console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ problemStartPoint:", problemStartPoint);

      for (let i = problemStartPoint; i < numOfProblemsInSection; i += 5) {
      // for (let i = problemStartPoint; i < Math.min(15, numOfProblemsInSection); i += 5) {

        let questionPromises = [];
        let problemNumbers = [];
        let lastScrapedProblemNumber = Number(problemStartPoint);
        for (let j = i; j < Math.min(i+5, numOfProblemsInSection); j++) {
            let problemNumber;
            const problemLink = problems[j].querySelector('a').getAttribute('href');
            problemNumber = problems[j].querySelector('.chapter-question__text__problem').innerHTML;
            problemNumber = Number(problemNumber.split(/(\s+)/).filter( e => e.trim().length > 0)[1]);
            try {
              const questionHtml = await getHtml(`${domain}${problemLink}`);
              const root = parse(questionHtml);
  
              const scripts = root.querySelectorAll('script[type="application/ld+json"]');
              let video_trans = root.querySelectorAll('.qd-transcript-text');
              if (video_trans.length > 0) {
                video_trans = video_trans[0].innerHTML;
              } else {
                video_trans = '';
              }
              const difficulty = root.querySelectorAll('.qd-problem-difficulty')[0].innerHTML;
  
              let questionDataObject = JSON.parse(sanitizeString(scripts[0].innerHTML));
              let videoDataObject = JSON.parse(scripts[1].innerHTML);
              var q_text = questionDataObject.mainEntity.text;
              var vid_url = videoDataObject.contentURL;
              let question_data = {
                url: problemLink,
                question: q_text,
                number: problemNumber,
                video_url: vid_url,
                video_trans: video_trans,
                difficulty: difficulty,
                chapter_id: insertedChapterId,
                section_id: insertedSectionId,
                book_id: insertedBookId
              };
              // const insertedQuestionId = await sqlQueries.insertQuestion(db, question_data);
              questionPromises.push(sqlQueries.insertQuestion(db, question_data, bookId));
            } catch(e) {
                console.log("!!!!!!!!!!!!!! error scraping the question:", problemLink, e);
                let corruptedBookData = {
                  url: problemLink,
                  number: problemNumber,
                  chapter_id: insertedChapterId,
                  section_id: insertedSectionId,
                  book_id: insertedBookId
                };
                corruptedBookData = json2csvParser.parse(corruptedBookData);
                fs.appendFile('numerade/corruptedBooks.csv', corruptedBookData + '\n', function (err) {
                  if (err) throw err;
                });
    
            }
            lastScrapedProblemNumber = problemNumber;
            // problemNumbers.push(question_data.number);
        }
        let insertedQuestionIds = await Promise.all(questionPromises);
        for (let k = 0; k < insertedQuestionIds.length; k++) {
          if (typeof(insertedQuestionIds[k].insertId) !== 'number') {
            throw new Error(insertedQuestionIds[k]);
          }
        } 
        if (typeof(lastScrapedProblemNumber) != 'number') {
          lastScrapedProblemNumber = i + 5;
        }
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ questions successfully added question to db:");

        redisClient.HSET(bookId, 'problem', Math.min(lastScrapedProblemNumber, numOfProblemsInSection));


      }

}

// async function getChapterHtml(link, {bookId, insertedBookId}, {chapterNumber},{numOfQuestions});

async function getChapterHtml(link, {bookId, insertedBookId}, {chapterNumber},{numOfQuestions}) {

    console.log("entered  getChapterHtml");
    const chapterHtml = await getHtml(`${domain}${link}`);
      const root = parse(chapterHtml);
      const sections = root.querySelectorAll('select');
      const chapterName = link.split('/')[3];
      let numOfSections = 1;
      let chapterData = {
        name:chapterName,
        book_id: insertedBookId,
        number: chapterNumber,
        number_of_sections: numOfSections,
        number_of_questions: numOfQuestions,
      };

      if (sections.length >= 1) {
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$4 found a chapter with multiple sections, link:", link);
        const options = sections[0].querySelectorAll('option');
        let sectionStartPoint = await redisClient.HGET(bookId, 'section');
        sectionStartPoint = parseInt(sectionStartPoint, 10);
        numOfSections = options.length - 1;
        chapterData.number_of_sections = numOfSections;

        let insertedChapterId;
    let lastInsertedChapterId = await redisClient.HGET(bookId, 'lastInsertedChapterId');
    if (lastInsertedChapterId && Number(lastInsertedChapterId) >= 1) {
        console.log("Chapter already inserted into DB,", Number(lastInsertedChapterId));
        insertedChapterId = Number(lastInsertedChapterId);
    } else {
      let sqlResp = await sqlQueries.insertChapter(db, chapterData, bookId, redisClient);
      insertedChapterId = sqlResp.insertId;
    }
    console.log(insertedChapterId);

        
        if (typeof(insertedChapterId) !== 'number') {
          throw new Error(insertedChapterId);
        } 
        await redisClient.HSET(bookId, 'lastInsertedChapterId', insertedChapterId);
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ chapter addded successfully to db:", chapterData.name, "ID:", insertedChapterId);

        for (let i = sectionStartPoint; i < options.length; i++) {
            const sectionLink = options[i].getAttribute('value');
            const sectionName = options[i].innerHTML;
            console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$4  sections link:", sectionLink, " ,Name:", sectionName);
            await getSectionHtml(link + sectionLink, bookId, i, insertedChapterId, sectionName, insertedBookId);
            redisClient.HSET(bookId, 'section', Number(i)+1);
            await redisClient.HSET(bookId, 'problem', 0);
            await redisClient.HDEL(bookId, 'lastInsertedSectionId');
        }
      } else {

        let insertedChapterId;
        let lastInsertedChapterId = await redisClient.HGET(bookId, 'lastInsertedChapterId');
        if (lastInsertedChapterId && Number(lastInsertedChapterId) >= 1) {
            console.log("Chapter already inserted into DB,", Number(lastInsertedChapterId));
            insertedChapterId = Number(lastInsertedChapterId);
        } else {
          let sqlResp = await sqlQueries.insertChapter(db, chapterData, bookId, redisClient);
          insertedChapterId = sqlResp.insertId;
        }
        console.log(insertedChapterId);

        if (typeof(insertedChapterId) !== 'number') {
          throw new Error(insertedChapterId);
        } 
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ chapter addded successfully to db:", chapterData.name, "ID:", insertedChapterId);
        await redisClient.HSET(bookId, 'lastInsertedChapterId', insertedChapterId);
        let sectionNumber = 1;
        let sectionName = "None";
        await getSectionHtml(link, {bookId, insertedBookId},{insertedChapterId}, {sectionNumber, sectionName})
        await redisClient.HSET(bookId, 'problem', 0);
        await redisClient.HDEL(bookId, 'lastInsertedSectionId');
      }


}


async function getBookHtml(bookCardLink, bookId) {
    // const bookCardLink  = root.querySelector('a');
    //next page
    const nextPage = bookCardLink.getAttribute('href');
    let bookThumbnail;
    //book thumbnail
    if (!bookCardLink.querySelector('.book-pic__img').getAttribute('src').includes('/static/lazyload')) {
        bookThumbnail = bookCardLink.querySelector('.book-pic__img').getAttribute('src');

    } else {
        bookThumbnail = bookCardLink.querySelector('.book-pic__img').getAttribute('data-src');
    }
    const edition = bookCardLink.querySelector('.book-card__sub').innerText.trim();
    const chapter = bookCardLink.querySelector('.book-card__question').innerText;
    const author = bookCardLink.querySelector('.book-card__meta-author').innerText;
    let isbn = bookCardLink.querySelector('.book-card__isbn');
    if (isbn != null) {
      isbn = isbn.innerText;
    } else {
      isbn = '';
    }
    const noQuestions = bookCardLink.querySelector('.book-card__num-questions').innerText;
    let book_data = {
      name: nextPage.split('/')[2],
      thumbnail: bookThumbnail,
      isbn_num: isbn,
      author: author,
      edition: edition,
    };
    let insertedBookId;
    let lastInsertedBookId = await redisClient.HGET(bookId, 'lastInsertedBookId');
    if (lastInsertedBookId && Number(lastInsertedBookId) >= 1) {
        console.log("Book already inserted into DB,", Number(lastInsertedBookId));
        insertedBookId = Number(lastInsertedBookId);
    } else {
      let sqlResp = await sqlQueries.insertBook(db, book_data, bookId, redisClient);
      insertedBookId = sqlResp.insertId;
    }
    console.log(insertedBookId);
    // insertedBookId.catch((err)=> {
    //   throw new Error(err);
    // });
    if (typeof(insertedBookId) !== 'number') {
      throw new Error(insertedBookId);
    } 
    await redisClient.HSET(bookId, 'lastInsertedBookId', insertedBookId);
    console.log("******************************** book addded successfully added question to db:", book_data.name, "ID:", insertedBookId);


    const html = await getHtml(`${domain}${nextPage}`);
    const chapterRoot = parse(html);
    const allChapters = chapterRoot.querySelectorAll('.book-chapters__chapter');
    console.log("******************************** in getChaptersHtml allChapters:", allChapters.length);
    let chapterStartPoint = await redisClient.HGET(bookId, 'chapter');
    chapterStartPoint = parseInt(chapterStartPoint, 10);
    console.log("***************************** chapterStartPoint,", chapterStartPoint);
    for (let i = chapterStartPoint; i < allChapters.length; i++) {
      const chapterLink = allChapters[i].querySelector('a').getAttribute('href');
      let chapterNumber = allChapters[i].querySelectorAll('.book-chapters__chapter-card__chapter-num')[0].innerHTML.trim();
       chapterNumber = Number(chapterNumber);
      let numOfQuestions = allChapters[i].querySelectorAll('.book-chapters__chapter-card__meta-questions')[0].innerHTML;
      numOfQuestions = Number(numOfQuestions.split(/(\s+)/).filter( e => e.trim().length > 0)[0]);
      // console.log("******************************** in getChaptersHtml inner :  ", questionsLink, "chapter number:", Number(chapterNumber));
      await getChapterHtml(chapterLink, {bookId, insertedBookId}, {chapterNumber}, {numOfQuestions});
      // await redisClient.HSET(bookId, {'chapter':Number(i)+1, 'section':1, 'problem':0, 'completed':0});
      await redisClient.HSET(bookId, 'chapter', Number(i)+1);
      await redisClient.HSET(bookId, 'section', 1);
      await redisClient.HSET(bookId, 'problem', 0);
      await redisClient.HSET(bookId, 'completed', 0);
      await redisClient.HDEL(bookId, 'lastInsertedChapterId');
    }
}

let bookCardArray = [];
let lastPageURL='';

async function main(url)  {

    try {
        const html = await getHtml(url);
        const root = parse(html);
        const subjectCards = root.querySelectorAll('.books-card-c > a');
        for(let i=0; i< subjectCards.length;i++) {
            const href = subjectCards[i].getAttribute('href');
            const subject = href.replace('/books/search/?q=', '');
            await getBooksHtml(href,1);
            console.log("*************************** in getQuestion length: ", bookCardArray.length);
            for (let i=0; i < bookCardArray.length; i++) {
                const bookHtml = parse(bookCardArray[i]);
                const bookCardLink  = bookHtml.querySelector('a');
                let bookId = "numerade" + bookCardLink.getAttribute('href');

                let isBookCompleted = await redisClient.HGET(bookId, 'completed');
                if (isBookCompleted != 1) {
                  let isBookVisited = await redisClient.exists(bookId);
                  if (!isBookVisited) {
                    console.log("**************************** book checkpoint doesn't exist, creating...")
                    await redisClient.HSET(bookId, 'chapter', 0);
                    await redisClient.HSET(bookId, 'section', 1);
                    await redisClient.HSET(bookId, 'problem', 0);
                    await redisClient.HSET(bookId, 'completed', 0);
                  }
                  await getBookHtml(bookCardLink, bookId);
                  await redisClient.HDEL(bookId, 'lastInsertedBookId');
                  redisClient.HSET(bookId, 'completed', 1);
                } 
            }
            bookCardArray = [];
            lastPageURL='';
        }
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

main(`${domain}/books/`)
