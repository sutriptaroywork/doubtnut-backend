const _ = require('lodash');
const QuestionContainer = require('../../../modules/containers/question');

async function getBookName(req, res, next) {
    const db = req.app.get('db');
    let flag;
    let data;
    const limit = 10;
    try {
        // const classList = [6, 7, 8, 9, 10];
        const studentClass = req.body.class;
        // const studentSubject = ['MATHS', 'PHYSICS', 'CHEMISTRY'];
        const stuSubject = req.body.subject;
        const { page } = req.body;
        const stuChapter = req.body.chapter;
        // const book = 'All';
        const bookName = req.body.book;
        if (_.isEmpty(studentClass) && _.isEmpty(stuSubject) && _.isEmpty(bookName) && _.isEmpty(stuChapter) && _.isEmpty(page)) {
            // data = {
            //     class: classList,
            // };
            const classList = await QuestionContainer.getDistinctClassList(db);
            const stdClass = [];
            if (classList.length > 0) {
                for (let i = 0; i < classList.length; i++) {
                    stdClass.push(classList[i].class);
                }
                data = {
                    class: stdClass,
                };
            }
        } else if (!_.isEmpty(studentClass) && _.isEmpty(stuSubject) && _.isEmpty(bookName) && _.isEmpty(stuChapter) && _.isEmpty(page)) {
            const subjectList = await QuestionContainer.getDistinctSubjectList(db, studentClass);
            const subject = [];
            if (subjectList.length > 0) {
                for (let i = 0; i < subjectList.length; i++) {
                    subject.push(subjectList[i].subject);
                }
                data = {
                    subject,
                };
            } else {
                flag = 1;
            }
        } else if (!_.isEmpty(studentClass) && !_.isEmpty(stuSubject) && _.isEmpty(bookName) && _.isEmpty(stuChapter) && !_.isEmpty(page)) {
            const books = await QuestionContainer.getDistinctBookList(db, studentClass, stuSubject, limit, page);
            const book = [];
            if (books.length > 0) {
                for (let i = 0; i < books.length; i++) {
                    book.push(books[i].package);
                }
                data = {
                    book,
                };
            } else {
                flag = 1;
            }
            // data = {
            //     book,
            // };
        } else if (!_.isEmpty(studentClass) && !_.isEmpty(stuSubject) && !_.isEmpty(bookName) && _.isEmpty(stuChapter) && !_.isEmpty(page)) {
            const chapterList = await QuestionContainer.getDistinctChapterList(db, studentClass, stuSubject, bookName, limit, page);
            const chapter = [];
            if (chapterList.length > 0) {
                for (let i = 0; i < chapterList.length; i++) {
                    chapter.push(chapterList[i].chapter);
                }
                data = {
                    chapter,
                };
            } else {
                flag = 1;
            }
        } else {
            flag = 1;
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        if (flag == 1) {
            responseData.meta.code = 403;
            responseData.meta.success = false;
            responseData.meta.message = 'No data';
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        const responseData2 = {
            meta: {
                code: 403,
                success: false,
                message: 'Something is wrong.',
            },
        };
        res.status(responseData2.meta.code).json(responseData2);
        next(error);
    }
}

module.exports = {
    getBookName,
};
