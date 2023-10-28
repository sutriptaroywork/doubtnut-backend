const locales = ['en', 'hi', 'bn', 'gu', 'kn', 'ml', 'mr', 'ne', 'pa', 'ta', 'te', 'ur'];

const localeArray = [];
for (let i = 0; i < locales.length; i++) {
    localeArray.push({
        locale: locales[i],
        namespace: (locales[i] === 'hi' || locales[i] === 'en') ? ['translation', 'asset', 'exception', 'other'] : ['translation', 'asset'],
    });
}

module.exports = {
    localeArray,
};
