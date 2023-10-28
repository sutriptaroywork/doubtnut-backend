const flagMaps = {
    text: 'search_service_tyd_suggestions',
    voice: 'search_service_voice_versions',
};

const _ = require('lodash');

const Utility = require('../../../modules/utility');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const LanguageContainer = require('../../../modules/containers/language');
const QuestionContainer = require('../../../modules/containers/question');
const TydSuggestionsLogsMongo = require('../../../modules/mongo/tydSuggestionsLogs');
const StudentRedis = require('../../../modules/redis/student');
const Data = require('../../../data/data');

class TydSuggestions {
    static _no_translation_ocr_locales = ['en', 'hi'];

    static _max_chars_length_display = 40;

    static async getIterationAttachment(xAuthToken, source, region, versionCode, isVoiceSearch) {
        const attachmentApiCalls = [];
        let checkForDefaultIteration = false;
        if (Utility.isUsRegion(region)) {
            attachmentApiCalls.push(new Promise((resolve) => resolve(null)));
        } else if (TydSuggestions.isVoiceSearch(isVoiceSearch)) {
            attachmentApiCalls.push(UtilityFlagr.callFlagr(xAuthToken, flagMaps.voice, `${flagMaps.voice}.payload`));
        } else if (!source) {
            attachmentApiCalls.push(UtilityFlagr.callFlagr(xAuthToken, flagMaps.text, `${flagMaps.text}.payload`));
        } else {
            attachmentApiCalls.push(Utility.getIterations());
            checkForDefaultIteration = true;
        }
        let [attachmentData] = await Promise.all(attachmentApiCalls);
        if (checkForDefaultIteration) {
            const iter = JSON.parse(attachmentData);
            for (let i = 0; i < iter.length; i++) {
                if (iter[i].key === 'default') {
                    attachmentData = iter[i].attachment;
                    break;
                }
            }
        }
        if (attachmentData) {
            return this.getIterationAttachmentCorrectionByVersionCode(attachmentData, versionCode, source);
        }
        return null;
    }

    static maintainUserAttachmentInRedis(db, studentId, version) {
        StudentRedis.setUserTydSuggestionsVersion(db.redis.write, studentId, Data.tyd_version_redis_key, version);
    }

    static getIterationAttachmentCorrectionByVersionCode(attachment, versionCode, source) {
        if (versionCode > 809) {
            return attachment;
        }
        attachment.isTextAnswered = false;
        if (source && source === 'panel') {
            delete attachment.isTextAnswered;
        }
        return attachment;
    }

    static getQueryOcrLocale(attachment, ocrText, locale, source) {
        if (attachment && (attachment.handleNonEnglishQueries || attachment.checkQuestionLocale) && source !== 'panel') {
            const detectedLocale = Utility.checkQuestionOcrLanguages(ocrText).detectedLanguage;
            return detectedLocale;
        }
        if (typeof locale !== 'undefined') return locale;
        return 'en';
    }

    static maintainAttachmentForPanelRequest(attachment, source, locale) {
        if (source && source === 'panel') {
            attachment.questionLocale = locale;
        }
        return attachment;
    }

    static getSearchFieldName(locale) {
        return Utility.getFieldNameForTranslate(locale);
    }

    static async getSearchQueryOcr(attachment, ocrText, locale, translateClient) {
        if (attachment) {
            if (attachment.handleNonEnglishQueries && locale && this._no_translation_ocr_locales.indexOf(locale) === -1) {
                const translatedResponse = await Utility.translateApi2(ocrText, translateClient);
                ocrText = Utility.getTranslatedTextFromRes(translatedResponse);
            }
        }
        return ocrText;
    }

    static isVoiceSearch(isVoiceSearch) {
        return (typeof isVoiceSearch !== 'undefined' && isVoiceSearch === 1);
    }

    static isResourceTypeRequired(versionCode, source) {
        if ((versionCode > 809 && !(source && source === 'panel')) || (source && source === 'web')) {
            return true;
        }
        return false;
    }

    static async formatSuggestions(attachment, suggestions, db, config, {
        userLocale,
        source,
        versionCode,
        region,
        ocrText,
    }) {
        const ocrTextHindiPromises = [];
        const suggestionDetailsPromises = [];
        for (const suggestionObj of suggestions) {
            // ADD RESOURCE TYPE
            if (this.isResourceTypeRequired(versionCode, source)) {
                suggestionDetailsPromises.push(QuestionContainer.getByQuestionIdForCatalogQuestions(db, suggestionObj._id));
            }
            // FORMAT DISPLAY TEXT
            if (userLocale === 'hi') {
                if (attachment && attachment.hindi_display_strategy === 'ocr_text_hi') {
                    suggestionObj._source.ocr_text = suggestionObj._source.ocr_text_hi;
                } else {
                    ocrTextHindiPromises.push(QuestionContainer.getLocalisedOcrById(db, suggestionObj._id, 'hindi'));
                }
            }

            if (attachment && attachment.replaceSymbolsShortForms) {
                suggestionObj._source.ocr_text = this.formatSuggestionOcrSymbols(suggestionObj);
            }

            //  FORMAT OCR 2 HTML
            if (attachment && attachment.renderHtmlDisplay) {
                suggestionObj._source.ocr_text = this.formatHtmlRenderCardDisplay(attachment, suggestionObj, ocrText, userLocale);
            }

            // GET THUMBNAILS TO DISPLAY - ONLY FOR US APP
            if (Utility.isUsRegion(region)) {
                suggestionObj.question_thumbnail = `${config.cdn_url}question-thumbnail/en_${suggestionObj._id}.webp`;
                suggestionObj.image_url = `${config.cdn_url}question-thumbnail/en_${suggestionObj._id}.webp`;
            }
        }

        if (ocrTextHindiPromises.length || suggestionDetailsPromises.length) {
            const [suggestionDetailsResolvedPromises, resolvedPromises] = await Promise.all([Promise.all(suggestionDetailsPromises), Promise.all(ocrTextHindiPromises)]);

            for (let s = 0; s < suggestions.length; s++) {
                if (resolvedPromises.length > 0 && resolvedPromises[s].length > 0 && !_.isEmpty(resolvedPromises[s][0].hindi)) {
                    suggestions[s]._source.ocr_text = resolvedPromises[s][0].hindi;
                }
                if (suggestionDetailsResolvedPromises.length) {
                    const suggestionObj = suggestions[s];
                    const suggestionDetails = suggestionDetailsResolvedPromises[s][0];
                    suggestionObj.resource_type = (suggestionDetails.is_answered === 0 && suggestionDetails.is_text_answered === 1) ? 'text' : 'video';
                    suggestionObj.display_multiple_line = true;
                }
            }
        }

        return suggestions;
    }

    static logSuggestions(suggestions, {
        studentId, studentClass, queryOcrText, isVoiceSearch, locale, ocrText,
    }) {
        if (studentId !== Data.tyd_suggestions_logs.stdid_for_not_logging) {
            const matches = suggestions.length > 0 ? suggestions.map((x) => x._id) : [];
            const tydSuggestionsLogs = new TydSuggestionsLogsMongo({
                studentId,
                class: studentClass,
                locale,
                ocrText,
                matches,
                queryOcrText,
                isVoiceSearch,
            });
            tydSuggestionsLogs.save();
        }
    }

    static async getLanguage(db, locale) {
        const languages = await LanguageContainer.getList(db);
        const languagesMapping = Utility.getLanguageObject(languages);
        return languagesMapping[locale];
    }

    static geIndexToUse(attachment, config, region) {
        if (attachment && attachment.elasticIndexName) {
            return attachment.elasticIndexName;
        }
        return Utility.isUsRegion(region) ? config.elastic.REPO_INDEX_USA : config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
    }

    static trimOcrTextForDisplay(maxCharsToDisplay, queryOcrLength, queryOcrIndex, matchesArrayOcr) {
        try {
            const remainingChars = maxCharsToDisplay - queryOcrLength;
            if (queryOcrIndex !== -1 && remainingChars > 0) {
                const startIndex = queryOcrIndex - remainingChars / 2;
                const endIndex = queryOcrIndex + queryOcrLength + remainingChars / 2;
                switch (true) {
                    case startIndex < 0 && endIndex < matchesArrayOcr.length:
                        matchesArrayOcr = `${matchesArrayOcr.substring(0, endIndex - startIndex)}...`;
                        break;
                    case startIndex > 0 && endIndex < matchesArrayOcr.length:
                        matchesArrayOcr = `...${matchesArrayOcr.substring(startIndex, endIndex)}...`;
                        break;
                    case startIndex > 0 && endIndex > matchesArrayOcr.length:
                        matchesArrayOcr = `...${matchesArrayOcr.substring(startIndex - endIndex + matchesArrayOcr.length, matchesArrayOcr.length)}`;
                        break;
                    default:
                        break;
                }
            } else {
                matchesArrayOcr = `${matchesArrayOcr.substring(0, maxCharsToDisplay)}...`;
            }
            return matchesArrayOcr;
        } catch (e) {
            console.error(e);
            return matchesArrayOcr;
        }
    }

    static getMaxCharactersToDisplay(attachment) {
        let charsLimit = this._max_chars_length_display;
        if (attachment && attachment.maxCharsToDisplay) {
            charsLimit = attachment.maxCharsToDisplay;
        }
        return charsLimit;
    }

    static formatHtmlRenderCardDisplay(attachment, suggestion, queryOcrText, userLocale) {
        let suggestionDisplayText = _.get(suggestion, '_source.ocr_text', '');
        try {
            const queryOcrLength = queryOcrText.length;
            const maxCharsToDisplay = this.getMaxCharactersToDisplay(attachment);
            if (suggestionDisplayText.length > 0) {
                // TRIM OCR TO DISPLAY
                const queryOcrIndex = suggestionDisplayText.toLowerCase().indexOf(queryOcrText.toLowerCase());
                if (suggestionDisplayText.length > maxCharsToDisplay) {
                    suggestionDisplayText = this.trimOcrTextForDisplay(maxCharsToDisplay, queryOcrLength, queryOcrIndex, suggestionDisplayText);
                }
                // HIGHLIGHT QUERY OCR TXT IN MATCHES OCR
                suggestionDisplayText = this.highlightQueryOcrOnSuggestionText(queryOcrText, suggestionDisplayText);

                // ADD META DATA TAGS
                if (attachment && attachment.suggestionDisplayConfig) {
                    suggestionDisplayText = this.addMatchesMetaData(attachment.suggestionDisplayConfig, suggestionDisplayText, suggestion, userLocale);
                }
            }
            return suggestionDisplayText;
        } catch (e) {
            return suggestionDisplayText;
        }
    }

    static highlightQueryOcrOnSuggestionText(queryOcrText, suggestionText) {
        try {
            const queryOcrIndex = suggestionText.toLowerCase().indexOf(queryOcrText.toLowerCase());
            if (queryOcrIndex !== -1) {
                suggestionText = `${suggestionText.substring(0, queryOcrIndex)}<font color='#FFA500'><b>${suggestionText.substring(queryOcrIndex, queryOcrIndex + queryOcrText.length)}</b></font>${suggestionText.substring(queryOcrIndex + queryOcrText.length, suggestionText.length)}`;
            }
            return `<div>${suggestionText}</div>`;
        } catch (e) {
            return `<div>${suggestionText}</div>`;
        }
    }

    static getInfoToMap(_tag, _info) {
        try {
            if (_tag === 'video_language') {
                return _info.split('-')[0];
            }
            return _info;
        } catch (e) {
            console.log(e);
            return _info;
        }
    }

    static addMatchesMetaData(metaDataConfig, suggestionDisplayText, matchObj, userLocale = 'en') {
        try {
            suggestionDisplayText += '<p><small>';
            for (const metaObj of metaDataConfig.metaDataTags) {
                const _tag = metaObj.name;
                const _info = metaDataConfig.metaDataDisplayMapping[_tag][this.getInfoToMap(_tag, matchObj._source[_tag])];
                const tag = metaObj.display[userLocale] || metaObj.display.en;
                const info = _info[userLocale] || _info.en;
                suggestionDisplayText += `<span style='background-color:#FBCEB1'><font face='arial'>&nbsp;&nbsp;<strong>${tag}:</strong> ${info} &nbsp;&nbsp;</font></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`;
            }
            return `${suggestionDisplayText}</small><p>`;
        } catch (e) {
            console.log(e);
            return suggestionDisplayText;
        }
    }

    static formatSuggestionOcrSymbols(suggestion) {
        let text = _.get(suggestion, '_source.ocr_text', '');
        text = text.replace(/\^\(-\)/g, ' <sup>-</sup> ');
        text = text.replace(/\^\(\+\)/g, ' <sup>+</sup> ');
        text = text.replace(/\^\((\d|a-z)\+\)/g, ' <sup>$1+</sup> ');
        text = text.replace(/\^\((\d|a-z)-\)/g, ' <sup>$1-</sup> ');
        text = text.replace(/_\((\d|a-z)\)/g, ' <sub>$1</sub> ');
        text = text.replace(/\^\((\d|a-z)\)/g, ' <sup>$1</sup> ');
        text = text.replace(/ sqrt\(\)/g, ' √ ');
        text = text.replace(/ sqrt /g, ' √ ');
        text = text.replace(/ pi /g, ' π ');
        text = text.replace(/ :- /g, ' ÷ ');
        text = text.replace(/ xx /g, ' × ');
        text = text.replace(/ Delta /g, ' ∆ ');
        text = text.replace(/\^\(@\)/g, '°');
        text = text.replace(/\^@/g, '°');
        text = text.replace(/ lt /g, ' < ');
        text = text.replace(/ gt /g, ' > ');
        text = text.replace(/ le /g, ' <= ');
        text = text.replace(/ ge /g, ' >= ');
        text = text.replace(/ lte /g, ' <= ');
        text = text.replace(/ gte /g, ' >= ');
        text = text.replace(/ ne /g, ' ≠ ');
        text = text.replace(/@/g, '°');
        text = text.replace(/ alpha ?/g, ' α ');
        text = text.replace(/ beta /g, ' β ');
        text = text.replace(/ theta /g, ' θ ');
        text = text.replace(/ gamma /g, ' γ ');
        text = text.replace(/ delta /g, ' δ ');
        text = text.replace(/ Delta /g, ' Δ ');
        text = text.replace(/ phi /g, ' φ ');
        text = text.replace(/ omega /g, ' ω ');
        text = text.replace(/ Omega /g, ' Ω ');
        text = text.replace(/ lambda /g, ' λ ');
        text = text.replace(/ mu /g, ' μ ');
        text = text.replace(/ sum /g, ' Σ ');
        text = text.replace(/ prod /g, ' Π ');
        text = text.replace(/ vec /g, ' → ');
        text = text.replace(/ oo /g, ' ∞ ');
        text = text.replace(/ tau /g, ' τ ');
        return text;
    }
}


/**
 * @description saves the log for manual tagged to-scrape questions in mongo
 * @param {*} database 
 * @param { Object } document 
 * @returns null
 */
async function saveToScrapeEntityInMongo(database, document) {
    const collectionName = 'other-websites-crawl-queue';
    await database.mongo.write
        .collection(collectionName)
        .insertOne(document);
}


/**
 * @description creates the document to store for scraping
 * @param {*} database 
 * @param { Object } parameters 
 * @returns null
 */
async function handleAdditionToScrapingPipelineByQuestionId(database, parameters) {
    const _type = 'qid';
    const {
        question_id, 
    } = parameters;

    const document = {
        type: _type,
        qid: question_id,
    }
    await saveToScrapeEntityInMongo(database, document);
}

/**
 * @description creates the document to store for scraping
 * @param {*} database 
 * @param { Object } parameters 
 * @returns null
 */
async function handleAdditionToScrapingPipelineByUrl(database, parameters) {
    const _type = 'link';
    const {
        question_id, 
        solution_url,
    } = parameters;
    
    const document = {
        type: _type,
        qid: question_id,
        url: solution_url,
    }
    await saveToScrapeEntityInMongo(database, document);
}


/**
 * @description lookup table
 * @returns { Object }
 */
function getWebScrapingHandlersByType() {    
    const handlerByTypeMapping = {
        question_id: handleAdditionToScrapingPipelineByQuestionId,
        url: handleAdditionToScrapingPipelineByUrl,
    }
    return handlerByTypeMapping;
}


module.exports = {
    TydSuggestions,
    getWebScrapingHandlersByType,
};
