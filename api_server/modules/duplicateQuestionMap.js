const _ = require('lodash');

function DuplicateQuestionMapByTag() {
    this.obj = null;

    this.getMap = () => this.obj;

    this.setMap = (obj) => {
        this.obj = obj;
    };

    this.buildMap = (matchesArray) => {
        const duplicatesMapData = {};
        const duplicatesMapMeta = {};
        try {
            for (let i = 0; i < matchesArray.length; i++) {
                const match = matchesArray[i];
                const duplicateTag = _.get(match, '_source.duplicateTag', null);
                const videoLanguage = _.get(match, '_source.video_language', 'hi-en');
                const solutionType = _.get(match, 'resource_type', 'video');
                const videoDuration = _.get(match, '_source.duration', 0);
                if (duplicateTag) {
                    if (duplicatesMapData[duplicateTag]) {
                        // < VIDEO  LANGUAGE  >
                        if (_.get(duplicatesMapData, `${duplicateTag}.video_languages.${videoLanguage}`, null)) {
                            duplicatesMapData[duplicateTag].video_languages[videoLanguage].position.push(i);
                            duplicatesMapData[duplicateTag].video_languages[videoLanguage].question_id.push(match._id);
                            duplicatesMapData[duplicateTag].video_languages[videoLanguage].duration.push(videoDuration);
                            if (videoDuration > duplicatesMapMeta[duplicateTag][videoLanguage].video_duration.max.val) {
                                duplicatesMapMeta[duplicateTag][videoLanguage].video_duration.max.val = videoDuration;
                                duplicatesMapMeta[duplicateTag][videoLanguage].video_duration.max.position = i;
                                duplicatesMapMeta[duplicateTag][videoLanguage].video_duration.max.question_id = match._id;
                            }
                        } else {
                            duplicatesMapData[duplicateTag].video_languages[videoLanguage] = {
                                position: [i],
                                question_id: [match._id],
                                duration: [videoDuration],
                            };
                            duplicatesMapMeta[duplicateTag][videoLanguage] = {
                                video_duration: {
                                    max: {
                                        position: i,
                                        question_id: match._id,
                                        val: videoDuration,
                                    },
                                },
                            };
                        }

                        // < RESOURCE TYPE >
                        if (_.get(duplicatesMapData, `${duplicateTag}.resource_types.${solutionType}`, null)) {
                            duplicatesMapData[duplicateTag].resource_types[solutionType].position.push(i);
                            duplicatesMapData[duplicateTag].resource_types[solutionType].question_id.push(match._id);
                            duplicatesMapData[duplicateTag].resource_types[solutionType].video_language.push(videoLanguage);
                        } else {
                            duplicatesMapData[duplicateTag].resource_types[solutionType] = {
                                position: [i],
                                question_id: [match._id],
                                video_language: [videoLanguage],
                            };
                        }
                    } else {
                        duplicatesMapData[duplicateTag] = {
                            video_languages: {
                                [videoLanguage]: {
                                    position: [i],
                                    question_id: [match._id],
                                    duration: [videoDuration],
                                },
                            },
                            resource_types: {
                                [solutionType]: {
                                    position: [i],
                                    question_id: [match._id],
                                    video_language: [videoLanguage],
                                },
                            },
                        };
                        duplicatesMapMeta[duplicateTag] = {
                            [videoLanguage]: {
                                video_duration: {
                                    max: {
                                        position: i,
                                        question_id: match._id,
                                        val: videoDuration,
                                    },
                                },
                            },
                        };
                    }
                }
            }
        } catch (e) {
            console.log(e);
        } finally {
            return {
                data: duplicatesMapData,
                meta: duplicatesMapMeta,
            };
        }
    };
}

module.exports = DuplicateQuestionMapByTag;
