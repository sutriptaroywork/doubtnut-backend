module.exports = class QuizWeb {
    static setQuizQuestionsStaticForNotLoginedStudentsInWeb(client, studentClass, subject, chapter, language, data) {
        return client.setAsync(`QUIZ:WEB:STATIC:${studentClass}:${subject}:${chapter}:${language}`, JSON.stringify(data));
    }

    static getQuizQuestionsStaticForNotLoginedStudentsInWeb(client, studentClass, subject, chapter, language) {
        return client.getAsync(`QUIZ:WEB:STATIC:${studentClass}:${subject}:${chapter}:${language}`);
    }

    static getAvailableClasses(client) {
        return client.getAsync('QUIZ:WEB:CLASSES');
    }

    static getAvailableSubjectsFromClass(client, studentClass) {
        return client.getAsync(`QUIZ:WEB:CLASS:SUBJECTS:${studentClass}`);
    }

    static getAvailableChaptersFromSubjectClassLanguage(client, studentClass, subject, lang) {
        return client.getAsync(`QUIZ:WEB:CLASS:CHAPTERS:${studentClass}:${subject}:${lang}`);
    }

    static getAvailableLanguagesFromSubjectClass(client, studentClass, subject) {
        return client.getAsync(`QUIZ:WEB:CLASS:LANGUAGES:${studentClass}:${subject}`);
    }

    static getQuestionsForQuizWeb(client, studentClass, subject, chapter, language) {
        return client.getAsync(`QUIZ:WEB:QUESTIONS:${studentClass}:${subject}:${language}:${chapter}`);
    }

    static getAvailableSubjects(client) {
        return client.getAsync('QUIZ:WEB:SUB');
    }

    static getAvailableLanguages(client) {
        return client.getAsync('QUIZ:WEB:LANG');
    }

    static getAvailableClassesFromSubject(client, subject) {
        return client.getAsync(`QUIZ:WEB:SUB:${subject}:CLASSES`);
    }

    static getAvailableLanguagesFromSubject(client, subject) {
        return client.getAsync(`QUIZ:WEB:SUB:${subject}:LANGUAGES`);
    }

    static getAvailableClassesFromLanguage(client, lang) {
        return client.getAsync(`QUIZ:WEB:LANG:${lang}:CLASSES`);
    }

    static getAvailableSubjectsFromLanguage(client, lang) {
        return client.getAsync(`QUIZ:WEB:LANG:${lang}:SUBJECTS`);
    }
};
