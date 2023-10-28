/**
 * @Author: Meghna Gupta
 * @Date:   2021-10-07
 * @Email:  meghna.gupta@doubtnut.com
 * @Last modified by: Meghna Gupta
 * @Last modified date: 2021-10-07
 */

const LC = require('./languageConst');
const locationArray = Object.keys(LC.USER_LOCATION_LANGUAGE_MAPPING);
const boardsArray = Object.keys(LC.USER_BOARD_LANGUAGE_MAPPING);
function getVideoLanguageSet({userAppLocale, userLocation, userBoard, questionLocale}) {
    const videoLanguageSet = new Set(['en', 'hi-en']);
    if (userAppLocale && LC.VIDEO_LANGUAGE_SET.includes(userAppLocale)) {
        videoLanguageSet.add(userAppLocale)
        videoLanguageSet.add(`${userAppLocale}-en`)
    }
    if (questionLocale && LC.VIDEO_LANGUAGE_SET.includes(questionLocale)) {
        videoLanguageSet.add(questionLocale)
        videoLanguageSet.add(`${questionLocale}-en`)
    }
    if (userLocation) {
        let lowerCaseLocationArray = locationArray.map(v => v.toLowerCase());
        let locationIndex = lowerCaseLocationArray.indexOf(userLocation.toLowerCase());
        if (locationIndex > -1) {
            const languagesToAdd = LC.USER_LOCATION_LANGUAGE_MAPPING[locationArray[locationIndex]];
            languagesToAdd.forEach(language => {
                videoLanguageSet.add(language);
                videoLanguageSet.add(`${language}-en`);
            });            
        } 
    }
    if (userBoard) {
        if (userBoard === 'Others') {
            LC.VIDEO_LANGUAGE_SET.forEach((value) => { 
                videoLanguageSet.add(value)
                videoLanguageSet.add(`${value}-en`);
            })
        } else {
            let boardIndex = boardsArray.indexOf(userBoard);
            if (boardIndex > -1) {
                const languagesToAdd = LC.USER_BOARD_LANGUAGE_MAPPING[boardsArray[boardIndex]];
                languagesToAdd.forEach(language => {
                    videoLanguageSet.add(language);
                    videoLanguageSet.add(`${language}-en`);
                });
            }
        }
    }
    videoLanguageSet.delete('en-en');
    return Array.from(videoLanguageSet);
}

const videoLanguagesToDisplay = getVideoLanguageSet({
    userAppLocale : 'en',
    userLocation : 'Delhi',
    userBoard : 'Andhra Pradesh Board',
    questionLocale : 'gu'
})

console.log(videoLanguagesToDisplay);