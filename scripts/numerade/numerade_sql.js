module.exports = class NumeradeQuestion {
    static insertQuestion(db, questionData, redisBookId) {
        let sql_add_question = 'INSERT INTO nr_question SET ?';
        return db.query(sql_add_question, [questionData]);
    }
    
    static insertBook(db, bookData, redisBookId, redisClient) {
      let sql_add_book = 'INSERT INTO nr_book SET ?';
      return db.query(sql_add_book, [bookData]);
    }

    static insertChapter(db, chapterData, redisBookId, redisClient) {
        let sql_add_chapter = 'INSERT INTO nr_chapter SET ?';
        return db.query(sql_add_chapter, [chapterData]);
    }

    static insertSection(db, sectionData, redisBookId, redisClient) {
        let sql_add_section = 'INSERT INTO nr_section SET ?';
        return db.query(sql_add_section, [sectionData]);

    }
    static async createTables(db) {
        let sql_create_question_table = 'CREATE TABLE nr_question(id int AUTO_INCREMENT, url TEXT(1000), question TEXT, number int, video_url TEXT(1000), video_trans TEXT, difficulty TEXT(100), chapter_id int, section_id int, book_id int, PRIMARY KEY(id))';
        let res1 = await db.query(sql_create_question_table);
      
        let sql_create_book_table = 'CREATE TABLE nr_book(id int AUTO_INCREMENT, name TEXT(100), thumbnail TEXT(1000), isbn_num varchar(255), author TEXT(100), edition text(100), PRIMARY KEY(id))';
        let res2 = await db.query(sql_create_book_table);
      
        let sql_create_chapter_table = 'CREATE TABLE nr_chapter(id int AUTO_INCREMENT, name varchar(255) UNIQUE, book_id int, number int, number_of_sections int, number_of_questions int, PRIMARY KEY(id))';
        let res3 = await db.query(sql_create_chapter_table);
      
        let sql_create_section_table = 'CREATE TABLE nr_section(id int AUTO_INCREMENT, name TEXT, number int, number_of_questions int, chapter_id int, PRIMARY KEY(id))';
        let res4 = await db.query(sql_create_section_table);
        console.log("successfully created tables,");
    }


}