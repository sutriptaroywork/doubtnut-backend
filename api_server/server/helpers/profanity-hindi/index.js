const _ = require('lodash');
// const fs = require('fs');
// const path = require('path');
const hindiBadWords = require('./data/hindi-bad-words');
const englishBadWords = require('./data/english-bad-words');

const userDefinedWords = {};
let badWordsDictionary = {};

// const directoryPath = path.join(__dirname, 'data/');

const profanity = {};

profanity.maskBadWords = (message, maskWith) => {
    if (!message || typeof message !== 'string') {
        throw new Error('message passed to the function must be a string');
    }
    return message.split(' ').map((word) => {
        if (profanity.isMessageDirty(word)) {
            if (maskWith && typeof maskWith === 'string') {
                return word.replace(/./g, maskWith);
            }
            return word.replace(/./g, '*');
        }
        return word;
    }).join(' ');
};

profanity.isMessageDirty = (message) => {
    if (!message || typeof message !== 'string') {
        throw new Error('message passed to the function must be a string');
    }
    const messageWords = message.split(' ');
    badWordsDictionary = _.merge(hindiBadWords, englishBadWords, userDefinedWords);
    badWordsDictionary = _.transform(badWordsDictionary, (result, val, key) => {
        result[key.toLowerCase()] = val;
    });
    let flag = false;
    for (let i = 0; i < messageWords.length; i++) {
        if (_.has(badWordsDictionary, messageWords[i].trim().toLowerCase())) {
            flag = true;
            break;
        }
    }
    return flag;
};

const alreadyExists = (word, wordList) => {
    if (!word || !wordList) return false;
    return !!(_.has(wordList, word));
};

profanity.addWords = (wordList) => {
    // fs.readFile(`${directoryPath}userDefinedWords.json`, (err, data) => {
    //     if (err) {
    //         throw err;
    //         return;
    //     }
    //     const temp1 = JSON.parse(data);
    //     for (let i = 0; i < wordList.length; i++) {
    //         if (!temp1.hasOwnProperty(wordList[i])) {
    //             temp1[wordList[i]] = 1;
    //         }
    //     }
    //     const temp2 = JSON.stringify(temp1);
    //     fs.writeFile(`${directoryPath}userDefinedWords.json`, temp2, (err) => {
    //         if (err) throw err;
    //         console.log('Data written to file');
    //     });
    // });
    if (!wordList) return badWordsDictionary;
    if (typeof wordList === 'string' && !alreadyExists(wordList, badWordsDictionary)) {
        userDefinedWords[wordList.trim()] = 1;
    }
    if (wordList.constructor === Array) {
        wordList.map((word) => {
            if (typeof word === 'string' && !(alreadyExists(word, badWordsDictionary))) {
                userDefinedWords[word.trim()] = 1;
            }
            return true;
        });
    }
    // const temp2 = JSON.stringify(userDefinedWords);
    // fs.writeFile(`${directoryPath}userDefinedWords.json`, userDefinedWords, (err) => {
    //     if (err) throw err;
    //     console.log('Data written to file');
    // });
    badWordsDictionary = _.merge(badWordsDictionary, userDefinedWords);
    return badWordsDictionary;
};

profanity.removeWords = (wordList) => {
    if (!wordList) return badWordsDictionary;
    if (typeof wordList === 'string' && alreadyExists(wordList, badWordsDictionary)) delete badWordsDictionary[wordList.trim()];
    if (wordList.constructor === Array) {
        wordList.map((word) => {
            if (typeof word === 'string' && alreadyExists(word, badWordsDictionary)) delete badWordsDictionary[word.trim()];
            return true;
        });
    }
    return badWordsDictionary;
};

profanity.addWords(require('./data/bad-words'));

module.exports = profanity;
