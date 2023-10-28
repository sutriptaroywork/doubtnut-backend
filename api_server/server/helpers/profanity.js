const { vision } = require('googleapis/build/src/apis/vision');
const badWordsData = require('./profanity-hindi/data/bad-words');

async function isWordProfane(inputKeyword) {
    inputKeyword = inputKeyword.replace(RegExp('[~`!@#$%^&()_={}[\\]:;,.<>+\\/?-]', 'gi'), '').trim().replace(/ +/g, ' ').toLowerCase();
    for (const word of badWordsData.highlyRestrictedProfaneKeywords) {
        if (RegExp(`^.*${word}.*$`, 'gi').test(inputKeyword)) {
            console.log('word => ', inputKeyword);
            return true;
        }
    }
    return false;
}

async function isImageProfane(imageUri) {
    try {
        let isProfaned = false;
        const client = new vision.ImageAnnotatorClient();
        const request = {
            image: {
                source: { imageUri },
            },
        };
        const checkedImage = await client.safeSearchDetection(request);
        if (checkedImage[0].safeSearchAnnotation && this.settings.profaneStatus.isDefined(checkedImage[0].safeSearchAnnotation.adult)) {
            // Image is profane
            isProfaned = true;
        }
        return isProfaned;
    } catch (e) {
        this.logger.error(e);
        return false;
    }
}

module.exports = {
    isWordProfane,
    isImageProfane,
};
