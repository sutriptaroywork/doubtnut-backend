module.exports = class Translation {
    static translate(text, locale, obj) {
        if (typeof obj[text.toUpperCase()] === 'undefined' || typeof obj[text.toUpperCase()][locale] === 'undefined') {
            return text;
        }
        return obj[text.toUpperCase()][locale];
    }
};
