const twoHours = 60 * 60 * 2;
module.exports = class QuizWA {
    static getAvailableClasses(client) {
        return client.getAsync('QUIZ:WA:CLASSES');
    }

    static getAvailableSubjectsFromClass(client, studentClass) {
        return client.getAsync(`QUIZ:WA:CLASS:SUBJECTS:${studentClass}`);
    }

    static getAvailableChaptersFromSubjectClassLanguage(client, studentClass, subject, lang) {
        return client.getAsync(`QUIZ:WA:CLASS:CHAPTERS:${studentClass}:${subject}:${lang}`);
    }

    static getAvailableLanguagesFromSubjectClass(client, studentClass, subject) {
        return client.getAsync(`QUIZ:WA:CLASS:LANGUAGES:${studentClass}:${subject}`);
    }

    static getQuestionsForQuizWeb(client, studentClass, subject, chapter, language) {
        return client.getAsync(`QUIZ:WA:QUESTIONS:${studentClass}:${subject}:${language}:${chapter}`);
    }

    static getAvailableSubjects(client) {
        return client.getAsync('QUIZ:WA:SUB');
    }

    static getAvailableLanguages(client) {
        return client.getAsync('QUIZ:WA:LANG');
    }

    static getAvailableLanguagesForClass(client, classKey) {
        return client.getAsync(`QUIZ:WA:CLASS:${classKey}:LANGUAGES`);
    }

    static getAvailableClassesFromSubject(client, subject) {
        return client.getAsync(`QUIZ:WA:SUB:${subject}:CLASSES`);
    }

    static getAvailableLanguagesFromSubject(client, subject) {
        return client.getAsync(`QUIZ:WA:SUB:${subject}:LANGUAGES`);
    }

    static getAvailableClassesFromLanguage(client, lang) {
        return client.getAsync(`QUIZ:WA:LANG:${lang}:CLASSES`);
    }

    static getAvailableSubjectsFromLanguageAndClass(client, lang, classKey) {
        return client.getAsync(`QUIZ:WA:CLASS:${classKey}:LANG:${lang}:SUBJECTS`);
    }

    static getAvailableSubjectsFromLanguage(client, lang) {
        return client.getAsync(`QUIZ:WA:LANG:${lang}:SUBJECTS`);
    }

    static setActiveSessionId(client, sessionId, studentId) {
        return client.setAsync(`QUIZ:WA:SESSIONID:${studentId}`, sessionId, 'EX', twoHours);
    }

    static getActiveSessionId(client, studentId) {
        return client.getAsync(`QUIZ:WA:SESSIONID:${studentId}`);
    }
};
