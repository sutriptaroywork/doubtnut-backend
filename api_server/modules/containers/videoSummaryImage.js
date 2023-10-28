const _ = require('lodash');
const FlagrUtility = require('../Utility.flagr');
const AnswerContainer = require('./answer.js');

module.exports = class Answer {
    static async videoSummaryInfo(db, config, data, student_id, question_id) {
        const exp = 'video_summary_image';
        try {
            const video_summary_image = await AnswerContainer.getVideoSummaryImage(db, question_id);

            if (!_.isEmpty(video_summary_image)) {
                const flagrResp = await FlagrUtility.getFlagrResp({
                    url: `${config.microUrl}/api/app-config/flagr`,
                    body: {
                        entityId: student_id.toString(),
                        capabilities: {
                            [exp]: {
                                entityId: student_id.toString(),
                            },
                        },
                    },
                }, 200);

                if (flagrResp && flagrResp[exp] && flagrResp[exp].enabled && flagrResp[exp].payload.enabled) {
                    data.text_solution_link = `${config.cdn_url}video_summary_image/${video_summary_image[0].image_url}`;
                }
            }
        } catch (e) {
            console.log('oh shit! its flagr again');
        }
    }
};
