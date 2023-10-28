module.exports = class webLibrary {
    static getWebBooksLandingPageData(database, stClass) { // 80ms - 40ms
        const sql = "SELECT a.original_book_name as title, a.thumbnail_url as image_url, a.subject, a.class, a.video_language as medium, 0 as is_last, 'playlist' as resource_type, b.new_url_schema as web_url FROM studentid_package_details as a INNER join web_book_content_class_package_subject as b on a.student_id=b.student_id and a.class=b.class and a.subject=b.subject WHERE a.package_type in ('ncert','books','coaching') and a.is_active=1 and a.class=? and b.book_order <> 999 order by b.book_order limit 5";
        // console.log(sql);
        return database.query(sql, [stClass]);
    }

    static getWebBooksDetailsByClass(database, stClass, language) { // 15-30ms
        const sql = 'SELECT web_content FROM web_book_content_class WHERE class=? and video_language=? limit 1';
        // console.log(sql);
        return database.query(sql, [stClass, language]);
    }

    static getFilteredWebBooksData(database, stClass, medium, subject) { // 65ms to 45ms
        let sql = "SELECT a.original_book_name as title, a.thumbnail_url as image_url, a.subject, a.class, a.video_language as medium, 0 as is_last, 'playlist' as resource_type,b.new_url_schema as web_url FROM studentid_package_details as a INNER join web_book_content_class_package_subject as b on a.student_id=b.student_id and a.class=b.class and a.subject=b.subject WHERE package_type in ('ncert','books','coaching') and is_active=1 and b.book_order <> 999";
        if (stClass && subject && medium) {
            sql = `${sql} and a.class= ? and a.subject=? and a.video_language=? order by b.book_order`;
            return database.query(sql, [stClass, subject, medium]);
        }
        if (stClass && subject && !medium) {
            sql = `${sql} and a.class= ? and a.subject=? order by b.book_order`;
            return database.query(sql, [stClass, subject]);
        }
        if (stClass && medium && !subject) {
            sql = `${sql} and a.class= ? and a.video_language=? order by b.book_order`;
            return database.query(sql, [stClass, medium]);
        }
        if (stClass && !medium && !subject) {
            sql = `${sql} and a.class= ? order by b.book_order`;
            return database.query(sql, [stClass]);
        }
        sql = `${sql} order by b.book_order`;
        // console.log(sql);
        return database.query(sql);
    }

    static getWebLibraryFilters(database, stClass, medium, subject) { // 65ms to 45ms
        let sql = "SELECT a.subject, a.class, a.video_language as medium, c.video_language_full FROM studentid_package_details as a INNER join web_book_content_class_package_subject as b on a.student_id=b.student_id and a.class=b.class and a.subject=b.subject left join web_book_content_class as c on a.class=c.class and a.video_language=c.video_language WHERE package_type in ('ncert','books','coaching') and is_active=1 and b.book_order <> 999";
        if (stClass && medium && subject) {
            sql = `${sql} and a.class=? and a.video_language=? and a.subject=? order by b.book_order`;
            return database.query(sql, [stClass, medium, subject]);
        }
        if (stClass && medium && !subject) {
            sql = `${sql} and a.class=? and a.video_language=? group by a.class, a.video_language, a.subject order by b.book_order`;
            return database.query(sql, [stClass, medium]);
        }
        if (stClass && !medium && subject) {
            sql = `${sql} and a.class=? and a.subject=? group by a.class, a.video_language, a.subject order by b.book_order`;
            return database.query(sql, [stClass, subject]);
        }
        if (stClass && !medium && !subject) {
            sql = `${sql} and a.class=? group by a.class, a.video_language order by b.book_order`;
            return database.query(sql, [stClass]);
        }
        sql = `${sql} order by b.book_order`;
        return database.query(sql);
    }

    static getWebBookData(database, newUrl) { // 80ms - 50ms
        const sql = 'SELECT a.*,b.original_book_name FROM web_book_content_class_package_subject as a left join studentid_package_details as b on a.student_id=b.student_id and a.class=b.class and a.subject=b.subject WHERE a.new_url_schema=? limit 1';
        // console.log(sql);
        return database.query(sql, [newUrl]);
    }

    static getWebChapterUrlData(database, sId, stClass, subject) { // 10ms
        const sql = 'SELECT * from web_book_content_class_package_chapter where class=? and student_id=? and subject=? order by chapter_order';
        // console.log(sql);
        return database.query(sql, [stClass, sId, subject]);
    }

    static getWebBookChapterData(database, newUrl) { // 10ms - 5ms seconds
        const sql = 'SELECT a.*, b.original_book_name, c.new_url_schema from web_book_content_class_package_chapter as a left join studentid_package_details as b on a.student_id=b.student_id and a.class=b.class and a.subject=b.subject left join web_book_content_class_package_subject as c on b.student_id=c.student_id and b.class=c.class and b.subject=c.subject where a.chapter_url=?';
        // console.log(sql);
        return database.query(sql, [newUrl]);
    }

    static getWebChapterExerciseUrlData(database, sId, stClass, subject, chapter) { // 10ms - 5ms seconds
        const sql = 'SELECT * from web_book_content_class_package_exercises where student_id=? and class=? and subject=? and chapter=? order by exercise_name';
        // console.log(sql);
        return database.query(sql, [sId, stClass, subject, chapter]);
    }

    static getWebBookChapterExerciseData(database, newUrl) { // 5ms - 3ms seconds
        const sql = 'SELECT * from web_book_content_class_package_exercises where final_url=?';
        // console.log(sql);
        return database.query(sql, [newUrl]);
    }
};
