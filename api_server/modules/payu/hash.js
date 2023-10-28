const crypto = require('crypto');

function generateHash(text) {
    const cryp = crypto.createHash('sha512');
    cryp.update(text);
    return cryp.digest('hex');
}

function validateHash(text, hash) {
    const calchash = generateHash(text);
    return calchash === hash;
}

module.exports = {
    generateHash,
    validateHash,
};
