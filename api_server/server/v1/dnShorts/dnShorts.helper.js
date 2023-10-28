const _ = require('lodash');
const Question = require('../../../modules/question');
const Answer = require('../../../modules/answer');

const dnShortsVideosMysql = require('../../../modules/mysql/dnShortsVideos');
const PlayListHelper = require('../../v2/playlist/playlist.helper');
const Playlist = require('../../../modules/playlist');
const Data = require('../../../data/dnShorts.data');
const FlagrUtility = require('../../../modules/Utility.flagr');

module.exports = class DnShortsHelper {
    static async syncQuestionsAnswersTable(db, videoId, updateObj, expertId) {
        try {
            const videoDetails = await dnShortsVideosMysql.getById(db.mysql.read, videoId).then((r) => r[0]);
            const questionsObj = {
                student_id: Data.student_id,
                question: videoDetails.title,
                ocr_text: videoDetails.title,
                original_ocr_text: videoDetails.title,
                subject: Data.subject,
                is_answered: 1,
            };

            const questionsInsertionResponse = await Question.addQuestion(questionsObj, db.mysql.write);
            const questionId = questionsInsertionResponse.insertId;
            const answersObj = {
                expert_id: expertId,
                answer_video: videoDetails.video_name,
                question_id: questionId,
                is_approved: 1,
                duration: videoDetails.duration,
            };
            const answersInsertionResponse = await Answer.addSearchedAnswer(answersObj, db.mysql.write);
            const answerId = answersInsertionResponse.insertId;
            const obj = {
                ...updateObj,
                question_id: questionId,
                answer_id: answerId,
            };
            return dnShortsVideosMysql.updateVideoReviewStatus(db.mysql.write, videoId, obj);
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    static makeWidgets(config, videosData, extraData) {
        try {
            let widgets = [];
            const bookmarks = (extraData.bookmarks && extraData.bookmarks.length > 0) ? extraData.bookmarks[0].question_ids.split(',') : [];
            for (const obj of videosData) {
                const widget = {
                    data: {
                        id: obj.id,
                        question_id: obj.question_id,
                        views: obj.views,
                        likes: obj.likes,
                        video_resource: {
                            resource: `${config.cdn_url}${Data.shorts_s3_folder}/${obj.video_name}`,
                            cdn_base_url: `${config.cdn_url}`,
                        },
                        is_bookmarked: !!bookmarks.includes(obj.question_id.toString()),
                        campaign: "dn_shorts_share", 
                        channel_id: "dn_shorts_whatsapp",
                        share_deeplink: `doubtnutapp://shorts?qid=${obj.question_id}`,
                        share_message: `${obj.title}\n${Data.share_description}`,
                        title: `${obj.title}`,
                        image_url: obj.thumbnail_url ? `${config.cdn_url}${Data.shorts_s3_folder}/${obj.thumbnail_url}` : Data.share_thumbnail,
                        share_thumbnail: obj.thumbnail_url ? `${config.cdn_url}${Data.shorts_s3_folder}/${obj.thumbnail_url}` : Data.share_thumbnail,
                    },
                    type: Data.widget_type,
                };

                if (_.get(obj, 'cta_button_text', null) && _.get(obj, 'cta_deeplink', null)) {
                    widget.button = {
                        text: obj.cta_button_text,
                        deeplink: obj.cta_deeplink,
                    };
                }
                widgets.push(widget);
            }
            if ((!widgets.length
                    || (widgets.length && widgets.length < Data.feed_videos_limit))
                    && !(typeof extraData.deeplink_type !== 'undefined' && extraData.deeplink_type === Data.custom_playlist_name)
            ) {
                widgets.push(this.getVideosExhaustWidget());
            }
            return widgets;
        } catch (e) {
            console.log(e);
            return [this.getVideosExhaustWidget()];
        }
    }

    static async createCustomDnShortsPlaylist(db, student_id, student_class = 12, student_course) {
        try {
            const params = PlayListHelper.getPlaylistCreationParams({
                playlist_name: Data.custom_playlist_name,
                student_class,
                student_course,
                student_id,
            });

            const result = await Playlist.createPlaylistNewLibrary(params, db.mysql.write);
            return result.insertId;
        } catch (e) {
            return null;
        }
    }

    static getVideosExhaustWidget() {
        return {
            data: {
                title: Data.videos_exhaust_widget_data.title,
                subtitle: Data.videos_exhaust_widget_data.subtitle,
                button: {
                    title: Data.videos_exhaust_widget_data.cta_button.title,
                    deeplink: Data.videos_exhaust_widget_data.cta_button.deeplink,
                },
            },
            type: Data.videos_exhaust_widget_type,
        };
    }

    static async getFlagrResp(config, exp, studentId) {
        try {
            const flagrResp = await FlagrUtility.getFlagrResp({
                url: `${config.microUrl}/api/app-config/flagr`,
                body: {
                    entityId: studentId.toString(),
                    capabilities: {
                        [exp]: {
                            entityId: studentId.toString(),
                        },
                    },
                },
            }, 1000);
            return flagrResp;
        } catch (e) {
            console.log(e);
            return {};
        }
    }
};
