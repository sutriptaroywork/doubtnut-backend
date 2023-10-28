const _ = require('lodash');
const staticData = require('../../../data/data');
const LanguageContainer = require('../../../modules/containers/language');
const Utility = require('../../../modules/utility');
const QuestionContainer = require('../../../modules/containers/question');
const mysqlQuestionContainer = require('../../../modules/mysql/question');

function getResponseStructure(ocr_text) {
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: {
            answer_id: '',
            expert_id: '',
            question_id: '',
            question: '',
            doubt: '',
            video_name: '',
            answer_video: '',
            fallback_answer_video: '',
            hls_timeout: 0,
            answer_rating: '',
            answer_feedback: '',
            thumbnail_image: '',
            isLiked: true,
            isDisliked: false,
            isPlaylistAdded: false,
            isBookmarked: false,
            view_id: '',
            title: '',
            weburl: '',
            description: '',
            type: '',
            id: '',
            likes_count: 0,
            dislikes_count: 0,
            share_count: 0,
            resource_type: '',
            is_shareable: false,
            ocr_text,
        },
    };
    return responseData;
}

async function advancedSearchWithFilter(staticParams, studentId, ocr, filter) {
    const chapters = filter.map((x) => x.chapter);
    const [elasticResult, languagesArrays] = await Promise.all([
        staticParams.elasticSearchInstance.findByOcrUsingIndexWithFilter(staticParams.config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, ocr, { chapters }),
        LanguageContainer.getList(staticParams.db),
    ]);
    const languagesObj = Utility.getLanguageObject(languagesArrays);
    const stLangCode = 'en';
    let language = languagesObj[stLangCode];
    if (typeof language === 'undefined') {
        language = 'english';
    }

    let matchesArray = elasticResult.hits ? elasticResult.hits.hits : [];
    matchesArray = await QuestionContainer.getQuestionStatsNew(matchesArray, staticParams.config, [staticData.color.white], language, stLangCode, {}, {}, staticParams.db, studentId, staticParams.xAuthToken, staticParams.versionCode);
    return matchesArray;
}

async function advancedSearchWithFilterV3(staticParams, studentId, ocr, filter, locale) {
    // let advanceSearchFilterVariant =await FlaggrUitlity.getVariantAttachment(null,{},87);
    const [elasticResult, languagesArrays] = await Promise.all([
        staticParams.elasticSearchInstance.findByOcrUsingIndexWithFilterV3(staticParams.config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, ocr, filter),
        LanguageContainer.getList(staticParams.db),
    ]);
    const languagesObj = Utility.getLanguageObject(languagesArrays);
    const stLangCode = 'en';
    let language = languagesObj[stLangCode];
    if (typeof language === 'undefined') {
        language = 'english';
    }
    let matchesArray = elasticResult.hits ? elasticResult.hits.hits : [];
    if (matchesArray && matchesArray.length > 0) {
        matchesArray = await QuestionContainer.getQuestionStatsNew(matchesArray, staticParams.config, [staticData.color.white], language, stLangCode, {}, {}, staticParams.db, studentId, staticParams.xAuthToken, staticParams.versionCode);
    }
    let flag = 0;
    filter.forEach((x) => {
        if (x.terms.video_language_display) {
            flag++;
        }
    });
    if (locale && locale != 'en' && flag === 0) {
        for (let i = 0; i < matchesArray.length; i++) {
            const lang = staticData.languageObject[locale];
            // eslint-disable-next-line no-await-in-loop
            const localizedQuestion = await mysqlQuestionContainer.getLocalisedQuestion(matchesArray[i]._id, lang, staticParams.db.mysql.read);
            if (localizedQuestion.length === 1 && !_.isEmpty(localizedQuestion[0][lang])) {
                matchesArray[i]._source.ocr_text = localizedQuestion[0][lang];
            }
        }
    }
    return matchesArray;
}

function pushFacetCard(matchArray, facets, position) {
    if ((!position && position !== 0) || position < 0 || !facets) {
        return;
    }
    const card = {
        _index: null,
        _type: null,
        _id: null,
        _score: 1,
        _source: {
            ocr_text: null,
            bg_color: staticData.color.white,
            isLiked: false,
            duration: 0,
            views: null,
            share_message: null,
        },
        resource_type: 'facet',
        is_locked: 0,
        question_thumbnail: null,
        facets,
    };
    facets.sort((a, b) => a.isSelected || b.isSelected);
    matchArray.splice(position, 0, card);
}

function pushFacetCardV3(matchArray, facets, position) {
    if ((!position && position !== 0) || position < 0 || !facets) {
        return;
    }
    const card = {
        _index: null,
        _type: null,
        _id: null,
        _score: 1,
        _source: {
            ocr_text: null,
            bg_color: staticData.color.white,
            isLiked: false,
            duration: 0,
            views: null,
            share_message: null,
        },
        resource_type: 'facets_v2',
        is_locked: 0,
        question_thumbnail: null,
        facets_v2: facets,
    };
    facets.sort((a, b) => a.isSelected || b.isSelected);
    matchArray.splice(position, 0, card);
}

function pushBountyCard(matchesArray, isBounty) {
    const obj = {
        resource_type: 'bounty',
        title: 'Padhao Aur Kamao Kya Hai ?',
        text: 'Padhao Aur Kamao',
        button_text: 'Post Your Doubts',
    };
    if (isBounty == 'bounty') {
        matchesArray.splice(4, 0, obj);
    } else {
        matchesArray.push(obj);
    }
    return matchesArray;
}

async function handleYoutubeSearchPage(db, youtubeQid, youtube_id, parent_id, student_id, ocr_text, Question) {
    const youtubeData = {
        youtube_id,
        is_show: 1,
        is_click: 1,
    };
    const isFirstVideoWatched = await Question.getYoutubeStats(db.mysql.read, youtubeQid);
    if (isFirstVideoWatched && isFirstVideoWatched[0] && isFirstVideoWatched[0].is_click) {
        youtubeData.question_id = parent_id;
        youtubeData.student_id = student_id;
        await Question.insertYoutubeStats(db.mysql.write, youtubeData);
    } else {
        await Question.updateYoutubeStats(db.mysql.write, youtubeData, youtubeQid);
    }
    const responseData = getResponseStructure(ocr_text);
    responseData.data.is_youtube = true;
    responseData.data.youtube_id = youtube_id;
    return responseData;
}

async function handleWolframSolution(config, parent_id, ocr_text, html, _Utility, sqs, sns, matchedQuestionSnsUrl, QuestionHelper) {
    const event = { data: parent_id, type: 'mongoUpdate' };
    setTimeout(Utility.sendMessage, 3000, sqs, config.elasticsearch_sqs, event);
    QuestionHelper.sendSnsMessage({
        type: 'matched-question',
        sns,
        qid: parent_id,
        UtilityModule: Utility,
        matchedQuestionSnsUrl,
        config,
    });
    const responseData = getResponseStructure(ocr_text);
    responseData.data.resource_type = 'dynamic_text';
    responseData.data.resource_data = html;
    return responseData;
}

function doesMatchAdvanceSearchFilterCriterion(unfiltered_arr_obj, filter_criterion) {
    let flag = 0;
    for (let j = 0; j < filter_criterion.length; j++) {
        for (let m = 0; m < filter_criterion[j].data.length; m++) {
            if(filter_criterion[j].facetType =='class'){
                if (filter_criterion[j].isSelected && filter_criterion[j].data[m].isSelected && (filter_criterion[j].data[m].data.indexOf(parseInt(unfiltered_arr_obj[filter_criterion[j].facetType])) > -1 || filter_criterion[j].data[m].data.indexOf(unfiltered_arr_obj[filter_criterion[j].facetType]) > -1 )) {
                    flag += 1;
                }
            }else{
                if (filter_criterion[j].isSelected && filter_criterion[j].data[m].isSelected && filter_criterion[j].data[m].data.indexOf(unfiltered_arr_obj[filter_criterion[j].facetType]) > -1) {
                    flag += 1;
                }
            }
        }
    }
    if(flag >= filter_criterion.length){
        return true;
    }
    return false;
}

function getDataSelectionRestored(prev_selected_facet_arr, next_selected_facet_arr) {
    const prev_selected_facet_obj = prev_selected_facet_arr.filter((x) => x.isSelected);
    for (let i = 0; i < next_selected_facet_arr.length; i++) {
        if (prev_selected_facet_obj && (prev_selected_facet_obj[0].display == next_selected_facet_arr[i].display)) {
            next_selected_facet_arr[i].isSelected = 1;
        }
    }
    return next_selected_facet_arr;
}

function getSelectedFacetRestored(prevFacets, nextFacets = []) {
    const facets = [];
    if (nextFacets.length === 0) {
        for (let m = 0; m < prevFacets.length; m++) {
            if (prevFacets[m].isSelected) {
                facets.push(prevFacets[m]);
            }
        }
        return facets;
    }
    const research_facets_types = ['chapter', 'class'];
    const filter_facets_types = ['video_language_display', 'video_language', 'subject'];
    const nextFacetTypesList = nextFacets.map((x) => x.facetType);
    for (let i = 0; i < prevFacets.length; i++) {
        if (prevFacets[i].isSelected && research_facets_types.includes(prevFacets[i].facetType) && !nextFacetTypesList.includes(prevFacets[i].facetType)) {
            nextFacets.push(prevFacets[i]);
        } else if (prevFacets[i].isSelected && filter_facets_types.includes(prevFacets[i].facetType) && !nextFacetTypesList.includes(prevFacets[i].facetType)) {
            nextFacets.push({ ...prevFacets[i], data: prevFacets[i].data.filter((x) => x.isSelected) });
        } else if (prevFacets[i].isSelected && nextFacetTypesList.includes(prevFacets[i].facetType)) {
            console.log('nothing to do');
            for (let k = 0; k < nextFacets.length; k++) {
                if (nextFacets[k].facetType == prevFacets[i].facetType) {
                    nextFacets[k] = { ...nextFacets[k], isSelected: true, data: prevFacets[i].data.filter((x) => x.isSelected) };
                }
            }
        }
    }
    return nextFacets;
}

module.exports = {
    advancedSearchWithFilter,
    pushFacetCard,
    pushBountyCard,
    advancedSearchWithFilterV3,
    pushFacetCardV3,
    handleYoutubeSearchPage,
    handleWolframSolution,
    doesMatchAdvanceSearchFilterCriterion,
    getSelectedFacetRestored,
};
