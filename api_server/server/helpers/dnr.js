const _ = require('lodash');
const moment = require('moment');
const Question = require('../../modules/question');
const StudentRedis = require('../../modules/redis/student');
const inst = require('../../modules/axiosInstances');
const config = require('../../config/config');

module.exports = class DNRHelper {
    constructor(db, xAuthToken, studentId, viewId) {
        this.DNR_VV_ENGAGE_TIME_WA = 10;
        this.maxInactivePeriod = 30; // days
        this.maxRewardCount = 5;
        this.db = db;
        this.daysDifference = (date1, date2) => {
            date1 = moment(date1);
            date2 = moment(date2);
            return moment(`${date1.format('DD-MM-YYYY')}`, 'DD-MM-YYYY').diff(moment(`${date2.format('DD-MM-YYYY')}`, 'DD-MM-YYYY'), 'days');
        };
        this.claimRewardEndpoint = '/api/dnr/claim-whatsapp-reward';
        this.rewardType = 'whatsapp_video_view';
        this.student_id = parseInt(studentId);
        this.xAuthToken = process.env.NODE_ENV === 'production' ? xAuthToken : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ODE2OTIyMTQsImlhdCI6MTY0MTM3NTI5MCwiZXhwIjoxNzA0NDQ3MjkwfQ.q9P4b0FtDMKAcEVYZsl_EcBreHShu15WOEWWJ25TZQc';
        this.versionCode = 955;
        this.view_id = viewId;
    }

    async checkVideoRewardEligibility(engageTime, questionId) {
        try {
            let isEligible = false;
            let message = 'engage time is less than specified engage time';
            if (engageTime >= this.DNR_VV_ENGAGE_TIME_WA) {
                const questionData = await Question.getDoubtByNewQuestionId(questionId, this.db.mysql.read);
                console.log('questionData ', questionData);
                message = 'question not asked from whatsapp';
                if (!_.isEmpty(questionData) && questionData[0].doubt === 'WHATSAPP') {
                    const vvsData = await Question.getLastViewedWAQuestionIdByViewId(this.student_id, this.view_id, this.db.mysql.read);
                    console.log('vvsData ', vvsData);
                    message = 'video watched as same question from before';
                    if (_.isEmpty(vvsData) || vvsData[0].question_id !== questionId) {
                        message = 'Video is eligible to be rewarded';
                        isEligible = true;
                    }
                }
            }
            return {
                message,
                is_eligible: isEligible,
            };
        } catch (e) {
            console.error(e);
            return {
                message: e,
                is_eligible: false,
            };
        }
    }

    async claimDNR({ questionId, engageTime }, timeout = 2000) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'x-auth-token': this.xAuthToken,
                version_code: this.versionCode,
            };

            const { data } = await inst.configMicroInst({
                method: 'POST',
                url: `${config.microUrl}${this.claimRewardEndpoint}`,
                timeout,
                headers,
                data: {
                    type: this.rewardType,
                    student_id: this.student_id,
                    question_id: questionId,
                    engage_time: engageTime,
                    view_id: this.view_id,
                },
            });
            return data;
        } catch (e) {
            console.error(e);
            throw (e);
        }
    }

    updateRewardCache(studentId, data) {
        return StudentRedis.setWhatsAppLastDNRData(this.db.redis.write, studentId, data);
    }

    /**
     * update reward_count += 1 and last_video_view_timestamp = CURR_TIME
     * IF NO:
     *      check LAST_WA_QID:${studentId} is not equal to question_id
     *      call claim reward service, IF reward_count == 5: call dnr service to remove milestone for that user.
     */
    async rewardUser({
        updatedRewardCount, updatedLastVVTime, questionId, engageTime,
    }) {
        try {
            // call dnr reward service
            const dnrClaimResp = await this.claimDNR({ questionId, engageTime });
            console.log('dnrClaimResp ', dnrClaimResp);

            if (dnrClaimResp && dnrClaimResp.data.is_rewarded) {
                // update reward_count += 1 and last_video_view_timestamp = CURR_TIME
                this.updateRewardCache(this.student_id, {
                    last_video_view_timestamp: updatedLastVVTime,
                    reward_count: updatedRewardCount,
                });

                return { is_rewarded: true };
            }
            return { is_rewarded: false };
        } catch (e) {
            console.error(e);
            throw (e);
        }
    }

    async processRewardWithCache({ whatsappDNRData, questionId, engageTime }) {
        try {
            let isRewarded = false;
            const currTime = moment().add(5, 'hours').add(30, 'minutes').toDate();
            const dayDiff = this.daysDifference(currTime, whatsappDNRData.last_video_view_timestamp);
            if (dayDiff < this.maxInactivePeriod) {
                if (whatsappDNRData.reward_count <= this.maxRewardCount) {
                    const rewardStatus = await this.rewardUser({
                        updatedRewardCount: whatsappDNRData.reward_count + 1,
                        updatedLastVVTime: currTime,
                        questionId,
                        engageTime,
                    });
                    isRewarded = rewardStatus.is_rewarded;
                } else {
                    // update last_video_view_timestamp = CURR_TIME
                    this.updateRewardCache(this.student_id, {
                        last_video_view_timestamp: currTime,
                        reward_count: whatsappDNRData.reward_count,
                    });
                }
            } else {
                const rewardStatus = await this.rewardUser({
                    updatedRewardCount: 1,
                    updatedLastVVTime: currTime,
                    questionId,
                    engageTime,
                });
                isRewarded = rewardStatus.is_rewarded;
            }
            return { is_rewarded: isRewarded };
        } catch (e) {
            console.error(e);
            throw (e);
        }
    }

    async processRewardWithoutCache({ questionId, engageTime }) {
        try {
            let isRewarded = false;
            const questionData = await Question.getSecondLastViewedWAQuestionId(this.student_id, questionId, this.DNR_VV_ENGAGE_TIME_WA, this.db.mysql.read);
            const currTime = moment().add(5, 'hours').add(30, 'minutes').toDate();
            let lastVVTime = moment().add(5, 'hours').add(30, 'minutes').subtract(30, 'days')
                .toDate();
            if (!_.isEmpty(questionData)) {
                lastVVTime = questionData[0].created_at;
            }

            const dayDiff = this.daysDifference(currTime, lastVVTime);
            console.log('dayDiff ', dayDiff);
            if (dayDiff < this.maxInactivePeriod) {
                // update last_video_view_timestamp = CURR_TIME
                this.updateRewardCache(this.student_id, {
                    last_video_view_timestamp: currTime,
                    reward_count: 1,
                });
            } else {
                const rewardStatus = await this.rewardUser({
                    updatedRewardCount: 1,
                    updatedLastVVTime: currTime,
                    questionId,
                    engageTime,
                });
                isRewarded = rewardStatus.is_rewarded;
            }
            return { is_rewarded: isRewarded };
        } catch (e) {
            console.error(e);
            throw (e);
        }
    }

    async processReward({ questionId, engageTime }) {
        try {
            let isRewarded = false;
            if (isNaN(questionId)) {
                return {
                    message: 'NaN question id',
                    is_rewarded: false,
                };
            }
            const isVideoEligibleForReward = await this.checkVideoRewardEligibility(engageTime, questionId);
            console.log('isVideoEligibleForReward ', isVideoEligibleForReward);
            if (!isVideoEligibleForReward.is_eligible) {
                return {
                    message: isVideoEligibleForReward.message,
                    is_rewarded: isRewarded,
                };
            }

            const whatsappDNRData = await StudentRedis.getWhatsAppLastDNRData(this.db.redis.read, this.student_id);
            console.log('whatsappDNRData ', whatsappDNRData);
            if (!_.isNull(whatsappDNRData)) {
                isRewarded = await this.processRewardWithCache({
                    whatsappDNRData: JSON.parse(whatsappDNRData),
                    questionId,
                    engageTime,
                });
            } else {
                isRewarded = await this.processRewardWithoutCache({ questionId, engageTime });
            }
            return {
                message: 'Eligibility criteria met',
                is_rewarded: isRewarded.is_rewarded,
            };
        } catch (e) {
            console.error(e);
            throw (e);
        }
    }
};
