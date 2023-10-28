const _ = require('lodash');

const QuestionHelper = require('../../helpers/question.helper');
const data = require('../../../data/data');

function formatFilterFacet(facet_obj) {
    // const facet_complete_obj = {
    //     class: data.advanceSearchStaticFacets.class,
    //     video_language_display: data.advanceSearchStaticFacets.video_language_display,
    //     video_language: data.advanceSearchStaticFacets.video_language_display,
    // };

    return facet_obj;

    // DISABLE _KEYS VERSION
    // let static_facet_obj = facet_complete_obj[facet_obj.facetType];
    // console.log(facet_obj.facetType)
    // console.log(static_facet_obj);
    // for(let i=0;i < facet_obj.data.length; i ++){
    //     static_facet_obj = { ...static_facet_obj,
    //                             data : static_facet_obj.data.map((elem) => {
    //                                     if(elem.display === facet_obj.data[i]['display']){
    //                                         return { ...elem , selectable : true, isSelected : facet_obj.data[i]['isSelected']}
    //                                     }else{
    //                                         return {...elem};
    //                                     }
    //                             }),
    //                             isSelected : facet_obj['isSelected']
    //     }

    // }
    // return static_facet_obj;
}

function formatResearchFacets(facet_obj) {
    facet_obj.data = facet_obj.data.map((obj) => ({
        ...obj,
        selectable: true,
    }));
    return facet_obj;
}

async function buildFacets(elasticSearchInstance, index, questionIds, locale) {
    try {
        const qidsMeta = await QuestionHelper.getMetaForTabs(elasticSearchInstance, index, questionIds);
        const facets = _.chain(qidsMeta.docs.map((x) => {
            if (!x.found) {
                return;
            }
            const localeKey = locale === 'hi' ? 'hindi_chapter_alias' : 'chapter_alias';
            const chapterAlias = x._source[localeKey] || x._source.chapter_alias || x._source.chapter;
            if (!chapterAlias) {
                return;
            }
            const { subject, chapter } = x._source;
            return {
                chapterAlias,
                chapter,
                subject,
            };
        })).filter(Boolean)
            .groupBy((x) => x.chapterAlias)
            .map((value, key) => ({
                chapterAlias: key,
                data: _.uniqBy(value, (x) => x.chapter),
                count: value.length,
                isSelected: false,
            }))
            .orderBy((x) => x.count, 'desc')
            .value()
            // .filter((x) => x.count > data.topicTabMinShowCount)
            .slice(0, data.topicTabsCount);
        if (facets.length < 2) {
            return;
        }
        return facets;
    } catch (e) {
        // let errorLog = e;
        // if (!_.isObject(errorLog)) {
        //     errorLog = JSON.stringify(errorLog);
        // }
        // logger.error({ tag: 'ask', source: 'buildFacets', error: errorLog });
        console.error(e);
    }
}

function handleClassFecet(dataFacets) {
    const bucket1Arr = ['6', '7', '8'];
    const bucket2Arr = ['9', '10'];
    const bucket3Arr = ['11', '12'];
    const displayBucket1 = '6-7-8';
    const displayBucket2 = '9-10';
    const displayBucket3 = '11-12';
    let flag1 = 0;
    let flag2 = 0;
    let flag3 = 0;
    const newDataFacets = dataFacets.map((x) => {
        if (bucket1Arr.includes(x.data[0]) && !flag1) {
            flag1++;
            return { display: displayBucket1, isSelected: false, data: bucket1Arr };
        }
        if (bucket2Arr.includes(x.data[0]) && !flag2) {
            flag2++;
            return { display: displayBucket2, isSelected: false, data: bucket2Arr };
        }
        if (bucket3Arr.includes(x.data[0]) && !flag3) {
            flag3++;
            return { display: displayBucket3, isSelected: false, data: bucket3Arr };
        }
        return null;
    }).filter(Boolean);
    return dataFacets.concat(newDataFacets);
}

function handleChapterFecet(qidsMeta, locale) {
    const dataFacetsReturn = _.chain(qidsMeta.docs.map((x) => {
        if (!x.found) {
            return;
        }
        const localeKey = locale === 'hi' ? 'hindi_chapter_alias' : 'chapter_alias';
        const chapterAlias = x._source[localeKey] || x._source.chapter_alias || x._source.chapter;
        if (!chapterAlias) {
            return;
        }
        const { chapter } = x._source;
        return {
            chapterAlias,
            chapter,
        };
    })).filter(Boolean)
        .groupBy((x) => x.chapterAlias)
        .map((value, key) => ({
            display: key,
            isSelected: false,
            data: _.uniqBy(value, (x) => x.chapter).map((y) => y.chapter),
            count: value.length,
        }))
        .orderBy((x) => x.count, 'desc')
        .value()
        // .filter((x) => x.count > data.topicTabMinShowCount)
        .slice(0, data.topicTabsCount);
    return dataFacetsReturn;
}

function handleOtherFacets(qidsMeta, filterVal) {
    const dataFacetsReturn = _.chain(qidsMeta.docs.map((x) => {
        if (!x.found) {
            return;
        }
        let filter = filterVal;
        filter = x._source[filter];
        if (!filter) {
            return;
        }
        return {
            filter,
        };
    }).filter(Boolean))
        .groupBy((x) => x.filter)
        .map((value, key) => ({
            display: key,
            isSelected: false,
            data: _.uniqBy(value, (x) => x.filter).map((y) => y.filter),
            count: value.length,
        }))
        .orderBy((x) => x.count, 'desc')
        .value()
        // .filter((x) => x.count > data.topicTabMinShowCount)
        .slice(0, data.topicTabsCount);
    return dataFacetsReturn;
}

function makeFacets(filterArray, filterDisplayArray, filterDisplayHindiArray, qidsMeta, locale) {
    const returnFacetsList = [];
    for (let i = 0; i < filterArray.length; i++) {
        const facetsDataNew = {
            facetType: filterArray[i],
            display: locale === 'hi' ? filterDisplayHindiArray[i] : filterDisplayArray[i],
            local: false,
            isSelected: false,
            isMultiSelect: false,
            upperFocussed: filterArray[i] === 'video_language_display',
            showDisplayText: true,
        };
        let dataFacets;
        if (filterArray[i] === 'chapter') {
            dataFacets = handleChapterFecet(qidsMeta, locale);
        } else {
            dataFacets = handleOtherFacets(qidsMeta, filterArray[i]);
        }

        dataFacets = dataFacets.map((x) => {
            if (filterArray[i] === 'subject' && locale === 'hi') {
                return { display: _.isEmpty(data.subjectHindi[x.display]) ? 'अन्य' : data.subjectHindi[x.display], isSelected: x.isSelected, data: x.data };
            }
            x.display = x.display.toLowerCase().replace(/\b[a-z](?=[a-z]{2})/g, (letter) => letter.toUpperCase());
            return {
                display: x.display, isSelected: x.isSelected, data: x.data,
            };
        });

        if (filterArray[i] === 'class') {
            dataFacets = handleClassFecet(dataFacets);
        }
        if (filterArray[i] === 'video_language_display') {
            dataFacets.map((x) => {
                x.type = data.languageObjectNew[x.data[0].toLowerCase()];
                const display_key = x.display;
                if (typeof data.languageObjectElasticMapping[display_key.toLowerCase()] !== 'undefined') {
                    x.display = data.languageObjectElasticMapping[display_key.toLowerCase()];
                }
            });
            // const allLanguageData = _.uniq(_.flatten(dataFacets.map((x) => x.data)));
            // const obj = {
            //     display: 'All Languages', isSelected: false, data: allLanguageData, isAll: true,
            // };
            // dataFacets.splice(0, 0, obj);
        }

        if (dataFacets.filter((x) => !x.isAll).length > 1) {
            facetsDataNew.data = dataFacets;
            returnFacetsList.push(facetsDataNew);
        }
    }
    return returnFacetsList;
}

async function buildFacetsV2(elasticSearchInstance, index, questionIds, locale) {
    try {
        if (!questionIds.length) {
            return [];
        }
        const blacklisted_displayNames = {
            chapter: ['Default', 'default', 'DEFAULT', 'NONE', 'None'],
            class: ['6.0', '7.0', '8.0', '9.0', '10.0', '11.0', '12.0', '13.0', '14.0'],
            subject: ['About to Mathematics'],
        };
        const qidsMeta = await QuestionHelper.getMetaForTabs(elasticSearchInstance, index, questionIds);
        qidsMeta.docs = qidsMeta.docs.filter((x) => x.found
                && x._source
                && x._source.chapter
                && !blacklisted_displayNames.chapter.includes(x._source.chapter)
                && !blacklisted_displayNames.chapter.includes(x._source.chapter_alias)
                && x._source.subject
                && !blacklisted_displayNames.subject.includes(x._source.subject)
                && x._source.class
                && !blacklisted_displayNames.class.includes(x._source.class));
        const filterArray = ['chapter', 'subject', 'class', 'video_language_display'];
        const filterDisplayArray = ['Topic', 'Subject', 'Class', 'Language'];
        const filterDisplayHindiArray = ['उप-विषय', 'विषय', 'वर्ग', 'भाषा'];
        return makeFacets(filterArray, filterDisplayArray, filterDisplayHindiArray, qidsMeta, locale);
    } catch (e) {
        // let errorLog = e;
        // if (!_.isObject(errorLog)) {
        //     errorLog = JSON.stringify(errorLog);
        // }
        // logger.error({ tag: 'ask', source: 'buildFacets', error: errorLog });
        console.error(e);
        return [];
    }
}

async function getFacetsByVersionCode(xAuthToken, config, versionCode, UtilityFlagr, elasticSearchInstance, matchesArray, userLocale) {
    try {
        let facets = [];
        let advanceSearchFilterElasticIndex = config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS;
        if (versionCode > 723) {
            if (versionCode >= 740) {
                const advanceSearchFlagrData = { xAuthToken, body: { capabilities: { 'advance-search-language-filter': {} } } };
                const advanceSearchFlagrResponse = await UtilityFlagr.getFlagrResp(advanceSearchFlagrData, 150);

                if (!_.isEmpty(advanceSearchFlagrResponse) && advanceSearchFlagrResponse['advance-search-language-filter'].enabled && advanceSearchFlagrResponse['advance-search-language-filter'].payload.enabled) {
                    advanceSearchFilterElasticIndex = advanceSearchFlagrResponse['advance-search-language-filter'].payload.elasticIndexName;
                    facets = await buildFacetsV2(elasticSearchInstance, advanceSearchFilterElasticIndex, matchesArray.map((x) => x._id), userLocale);
                } else {
                    facets = await buildFacetsV2(elasticSearchInstance, advanceSearchFilterElasticIndex, matchesArray.map((x) => x._id), userLocale);
                }
            } else {
                facets = await buildFacetsV2(elasticSearchInstance, config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, matchesArray.map((x) => x._id), userLocale);
            }
        } else {
            facets = await buildFacets(elasticSearchInstance, config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, matchesArray.map((x) => x._id), userLocale);
        }
        return facets;
    } catch (e) {
        console.error(e);
        return [];
    }
}

module.exports = {
    buildFacets, buildFacetsV2, getFacetsByVersionCode, formatFilterFacet, formatResearchFacets,
};
