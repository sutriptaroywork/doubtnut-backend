const _ = require('lodash');

const dnShortsVideosMysql = require('../../../modules/mysql/dnShortsVideos');
const dnShortsVideosRedis = require('../../../modules/redis/dnShortsVideos');
const dnShortsHelper = require('./dnShorts.helper');
const videoView = require('../../../modules/videoView');
const AnswerContainer = require('../../../modules/containers/answer');
const Data = require('../../../data/dnShorts.data');
const Playlist = require('../../../modules/playlist');
const PlaylistMysql = require('../../../modules/mysql/playlist');

async function getVideosToQC(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            page_no,
        } = req.params;
        const {
            dn_shorts_videos_type
        } = req.query;
        let isVideoToQcFound = false;
        const resultsFetchSize = 5;
        let videosFetchRetryCounter = 1;
        const data = [];
        const videosFetched = [];
        const pageCounter = typeof page_no !== 'undefined' ? parseInt(page_no) - 1 : 0;

        while (!isVideoToQcFound && videosFetchRetryCounter <= 3) {
            const offset = parseInt((videosFetchRetryCounter - 1) * resultsFetchSize) + pageCounter;
            const results = (dn_shorts_videos_type === "old") ? await dnShortsVideosMysql.getVideosToQc(db.mysql.read, resultsFetchSize, videosFetched, offset, 1) : await dnShortsVideosMysql.getVideosToQc(db.mysql.read, resultsFetchSize, videosFetched, offset, 0);
            console.log(results);
            if (!results.length) break;
            const videoIdsActionStatus = await dnShortsVideosRedis.getFetchedVideosReviewStatus(db.redis.read, results.map((x) => x.id));
            for (let i = 0; i < results.length; i++) {
                if (_.isNull(videoIdsActionStatus[i])) {
                    data.push(results[i]);
                    const promises = [];
                    promises.push(dnShortsVideosRedis.setVideosUnderReviewStatus(db.redis.write, results[i].id));
                    promises.push(dnShortsVideosRedis.getVideosCounterMetrics(db.redis.read));
                    const [__, videoCounterMetrics] = await Promise.all(promises);
                    console.log(videoCounterMetrics);
                    if (!_.isNull(videoCounterMetrics)) {
                        data[0].metrics = {
                            total: videoCounterMetrics.total,
                            total_approved: videoCounterMetrics.is_approved,
                            total_discarded: videoCounterMetrics.is_discarded,
                        };
                    }
                    isVideoToQcFound = true;
                    break;
                }
            }
            for (const video of results) {
                videosFetched.push(video.id);
            }
            videosFetchRetryCounter += 1;
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: data[0] || null,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function updateQcActionForRawVideo(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            video_id: videoId,
            approval_status: approvalStatus,
            cta_button_text: ctaButtonText,
            cta_button_navigation: ctaButtonNavigation,
            issue,
            expert_id: expertId,
            class: dnClass,
            category_id: categoryId,
            subcategory_id: subcategoryId,
        } = req.body;

        let isSkipped = 0;
        const updateObj = {};
        let questionsAnswersTableSyncNeeded = false;
        if (parseInt(approvalStatus) === 1) {
            updateObj.is_approved = 1;
            dnShortsVideosRedis.incApprovedVideosCounter(db.redis.write);
            questionsAnswersTableSyncNeeded = true;
        } else if (parseInt(approvalStatus) === -1) {
            updateObj.is_discarded = 1;
            dnShortsVideosRedis.incDiscardedVideosCounter(db.redis.write);
        } else {
            isSkipped = 1;
        }

        if (typeof issue !== 'undefined') {
            updateObj.issue = issue;
        }

        if (typeof ctaButtonText !== 'undefined') {
            updateObj.cta_button_text = ctaButtonText;
        }

        if (typeof ctaButtonNavigation !== 'undefined') {
            updateObj.cta_deeplink = ctaButtonNavigation;
        }

        if (typeof dnClass !== 'undefined') {
            updateObj.class = dnClass;
        }

        if (typeof categoryId !== 'undefined') {
            updateObj.category_id = categoryId;
        }

        if (typeof subcategoryId !== 'undefined') {
            updateObj.subcategory_id = subcategoryId;
        }

        const promises = [];
        if (!isSkipped) {
            promises.push(dnShortsVideosRedis.deleteVideosUnderReviewAfterAction(db.redis.write, videoId));
        }
        if (Object.keys(updateObj).length > 0 && !questionsAnswersTableSyncNeeded) {
            promises.push(dnShortsVideosMysql.updateVideoReviewStatus(db.mysql.write, videoId, updateObj));
        } else if (questionsAnswersTableSyncNeeded) {
            promises.push(dnShortsHelper.syncQuestionsAnswersTable(db, videoId, updateObj, expertId));
        }
        await Promise.all(promises);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: null,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getVideos(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const {
            last_id: lastId,
            question_id: questionId,
            type,
        } = req.query;
        let {
            student_id: studentId,
            student_class: studentClass
        } = req.user;

        studentClass = (studentClass === "14") ? "10" : studentClass;
        studentClass = (studentClass === "13") ? "12" : studentClass;

        let newUserNewShortsFlow = 0, oldUserShortsFlow = 0; 
        let isSavedVideosList = false;
        let lastIdNewUserSet, lastIdDnShortsVideos;
        let bookmarkedShortsVideosListData = [], arr = [];
        let [lastIdNewUser, lastIdOldUser, haveWatchedShorts, lastIdDnShortsFlow] = await Promise.all([dnShortsVideosRedis.getLastIdNewUser(db.redis.read, studentId, 0), dnShortsVideosRedis.getLastIdOldUser(db.redis.read, studentId), dnShortsVideosMysql.checkNewUser(db.mysql.read, studentId), dnShortsVideosRedis.getLastIdNewUser(db.redis.read, studentId, 1)]);
        let lastIdEvCombi, lastIdDnCombi, lastIdPcCombi, lastIdCcmCombi, lastIdEvSet, lastIdDnSet, lastIdPcSet, lastIdCcmSet, lastIdCcmClassCombi, firstIdEPMSet;
        let lastIdMCEev, lastIdMCEDn, lastIdMCECcm, lastIdMCECCMClass, epcIdArr, dnIdArr, ccmIdArr, flag, lastIdOldUserSet;
        if (_.isEmpty(haveWatchedShorts)) {
            const exp = 'shorts_new_user_check';
            const flagrResp = await dnShortsHelper.getFlagrResp(config, exp, studentId);
            if (flagrResp && flagrResp[exp] && flagrResp[exp].enabled && flagrResp[exp].payload.enabled) {
                if (flagrResp[exp].payload.name && flagrResp[exp].payload.name === "dn_shorts_enabled") {
                    newUserNewShortsFlow = 2;   
                } else if (flagrResp[exp].payload.name && flagrResp[exp].payload.name === "et_vv_flow_enabled") {
                    newUserNewShortsFlow = 1;
                } else if (flagrResp[exp].payload.name && flagrResp[exp].payload.name === "ccm_flow_enabled") {
                    newUserNewShortsFlow = 3;
                } else if (flagrResp[exp].payload.name && flagrResp[exp].payload.name === "per_comp_flow_enabled") {
                    newUserNewShortsFlow = 4;
                } else if (flagrResp[exp].payload.name && flagrResp[exp].payload.name === "ev_dn_ccm_enabled") {
                    newUserNewShortsFlow = 5;
                } else if (flagrResp[exp].payload.name && flagrResp[exp].payload.name === "com_dn_ccm_enabled") {
                    newUserNewShortsFlow = 6;
                } else if (flagrResp[exp].payload.name && flagrResp[exp].payload.name === "et_pc_mix_enabled") {
                    newUserNewShortsFlow = 7;
                } else if (flagrResp[exp].payload.name && flagrResp[exp].payload.name === "mix_categories_enabled") {
                    newUserNewShortsFlow = 8;
                } else if (flagrResp[exp].payload.name && flagrResp[exp].payload.name === "et_pc_mix_new") {
                    oldUserShortsFlow = 1;
                }
            }
        } else if (!_.isEmpty(haveWatchedShorts) && !lastIdNewUser && !lastIdOldUser){
            const exp = 'shorts_old_user_check';
            const flagrResp = await dnShortsHelper.getFlagrResp(config, exp, studentId);
            if (flagrResp && flagrResp[exp] && flagrResp[exp].enabled && flagrResp[exp].payload.enabled) {
                if (flagrResp[exp].payload.name && flagrResp[exp].payload.name === "et_pc_mix_enabled_old_user") {
                    oldUserShortsFlow = 1;   
                }
            }
        }

        if ((lastIdOldUser && lastIdOldUser.substring(0,3) === "EPM") || (oldUserShortsFlow === 1) ) {
            oldUserShortsFlow = 1;
            lastIdOldUserSet = await dnShortsVideosMysql.getLastIdOldUserSet(db.mysql.read, studentClass);
            lastIdOldUser = !lastIdOldUser ? lastIdOldUserSet[0].id - 1 : Number(lastIdOldUser.substring(3, lastIdOldUser.length));
        }

        if (lastIdDnShortsFlow || (newUserNewShortsFlow === 2)) {
            newUserNewShortsFlow = 2;
            lastIdDnShortsVideos = await dnShortsVideosMysql.getLastIdNewUserSet(db.mysql.read, 1);
            lastIdDnShortsFlow = !lastIdDnShortsFlow ? 0 : lastIdDnShortsFlow;
        } else if ((lastIdNewUser && !(["CCM", "PCR", "EDC", "CDC", "EPM", "MCE"].includes(lastIdNewUser.substring(0,3))))  || (newUserNewShortsFlow === 1) ) {
            newUserNewShortsFlow = 1;
            lastIdNewUserSet = await dnShortsVideosMysql.getLastIdNewUserSet(db.mysql.read, 0);
            lastIdNewUser = !lastIdNewUser ? 0 : lastIdNewUser;
        } else if ((lastIdNewUser && lastIdNewUser.substring(0,3) === "CCM") || (newUserNewShortsFlow === 3) ) {
            newUserNewShortsFlow = 3;
            lastIdNewUserSet = await dnShortsVideosMysql.getLastIdCCMSet(db.mysql.read, studentClass);
            lastIdNewUser = !lastIdNewUser ? 0 : Number(lastIdNewUser.substring(3, lastIdNewUser.length));
        } else if ((lastIdNewUser && lastIdNewUser.substring(0,3) === "PCR") || (newUserNewShortsFlow === 4)) {
            newUserNewShortsFlow = 4;
            lastIdNewUserSet = await dnShortsVideosMysql.getLastIdPCSet(db.mysql.read);
            lastIdNewUser = !lastIdNewUser ? 0 : Number(lastIdNewUser.substring(3, lastIdNewUser.length));
        } else if ((lastIdNewUser && lastIdNewUser.substring(0,3) === "EDC") || (newUserNewShortsFlow === 5)) {
            newUserNewShortsFlow = 5;
            [lastIdEvSet, lastIdDnSet, lastIdCcmSet, lastIdCcmClassCombi] = await Promise.all([dnShortsVideosMysql.getLastIdNewUserSet(db.mysql.read, 0), dnShortsVideosMysql.getLastIdNewUserSet(db.mysql.read, 1), dnShortsVideosMysql.getLastIdCCMSet(db.mysql.read, studentClass), dnShortsVideosRedis.getLastIdCCMClasswise(db.redis.read, studentId, studentClass)]);
            let arr = lastIdNewUser ? lastIdNewUser.split('_') : [];
            lastIdEvCombi = !arr[1] ? 0 : arr[1];
            lastIdDnCombi = !arr[2] ? 0 : arr[2];
            lastIdCcmClassCombi = !lastIdCcmClassCombi ? 0 : lastIdCcmClassCombi;
            lastIdCcmCombi = !arr[3] ? 0 : lastIdCcmClassCombi;
        } else if ((lastIdNewUser && lastIdNewUser.substring(0,3) === "CDC") || (newUserNewShortsFlow === 6)) {
            newUserNewShortsFlow = 6;
            [lastIdPcSet, lastIdDnSet, lastIdCcmSet, lastIdCcmClassCombi] = await Promise.all([dnShortsVideosMysql.getLastIdPCSet(db.mysql.read), dnShortsVideosMysql.getLastIdNewUserSet(db.mysql.read, 1), dnShortsVideosMysql.getLastIdCCMSet(db.mysql.read, studentClass), dnShortsVideosRedis.getLastIdCCMClasswise(db.redis.read, studentId, studentClass)]);
            let arr = lastIdNewUser ? lastIdNewUser.split('_') : [];
            lastIdPcCombi = !arr[1] ? 0 : arr[1];
            lastIdDnCombi = !arr[2] ? 0 : arr[2];
            lastIdCcmClassCombi = !lastIdCcmClassCombi ? 0 : lastIdCcmClassCombi;
            lastIdCcmCombi = !arr[3] ? 0 : lastIdCcmClassCombi;
        } else if ((lastIdNewUser && lastIdNewUser.substring(0,3) === "EPM") || (newUserNewShortsFlow === 7)) {
            newUserNewShortsFlow = 7;
            [lastIdNewUserSet, firstIdEPMSet] = await Promise.all([dnShortsVideosMysql.getLastIdEPMSet(db.mysql.read), dnShortsVideosMysql.getfirstIdEPMSet(db.mysql.read)]);
            lastIdNewUser = !lastIdNewUser ? firstIdEPMSet[0].id - 1 : Number(lastIdNewUser.substring(3, lastIdNewUser.length));
        } else if ((lastIdNewUser && lastIdNewUser.substring(0,3) === "MCE") || (newUserNewShortsFlow === 8)) {
            newUserNewShortsFlow = 8;
            [epcIdArr, dnIdArr, ccmIdArr, lastIdMCECCMClass] = await Promise.all([dnShortsVideosMysql.getIdsMCEevSet(db.mysql.read), dnShortsVideosMysql.getIdsMCEDnSet(db.mysql.read), dnShortsVideosMysql.getIdsMCECCMSet(db.mysql.read, studentClass), dnShortsVideosRedis.getLastIdMCECCMClasswise(db.redis.read, studentId, studentClass)]);
            let ids_arr = lastIdNewUser ? lastIdNewUser.split('_') : [];
            lastIdMCEev = !ids_arr[1] ? epcIdArr[0].id - 1: ids_arr[1];
            lastIdMCEDn = !ids_arr[2] ? dnIdArr[0].id - 1: ids_arr[2];
            lastIdMCECCMClass = !lastIdMCECCMClass ? ccmIdArr[0].id - 1 : lastIdMCECCMClass;
            lastIdMCECcm = !ids_arr[3] ? ccmIdArr[0].id - 1 : lastIdMCECCMClass;
            flag = !ids_arr.length ? 1 : Number(ids_arr[4]);
        } 

        const promises = [];

        if ((newUserNewShortsFlow === 1) && lastIdNewUserSet && Number(lastIdNewUser) < Number(lastIdNewUserSet[0].id)) {
            if (typeof questionId !== 'undefined') {
                promises.push(dnShortsVideosMysql.getVideoByQuestionId(db.mysql.read, questionId));
            }
            promises.push(dnShortsVideosMysql.getVideosNewUser(db.mysql.read, lastIdNewUser, 0));
            lastIdNewUser = (Number(lastIdNewUser) + 5).toString();
            promises.push(dnShortsVideosRedis.setLastIdNewUser(db.redis.write, studentId, lastIdNewUser, 0));
        } else if ((newUserNewShortsFlow === 2) && lastIdDnShortsVideos && Number(lastIdDnShortsFlow) <  Number(lastIdDnShortsVideos[0].id)) {
            if (typeof questionId !== 'undefined') {
                promises.push(dnShortsVideosMysql.getVideoByQuestionId(db.mysql.read, questionId));
            }
            promises.push(dnShortsVideosMysql.getVideosNewUser(db.mysql.read, lastIdDnShortsFlow, 1));
        } else if ((newUserNewShortsFlow === 3) && lastIdNewUserSet && Number(lastIdNewUser) < Number(lastIdNewUserSet[0].id)) {
            if (typeof questionId !== 'undefined') {
                promises.push(dnShortsVideosMysql.getVideoByQuestionId(db.mysql.read, questionId));
            }
            promises.push(dnShortsVideosMysql.getVideosCCMwise(db.mysql.read, studentClass, lastIdNewUser));
        } else if ((newUserNewShortsFlow === 4) && lastIdNewUserSet && Number(lastIdNewUser) < Number(lastIdNewUserSet[0].id)){
            if (typeof questionId !== 'undefined') {
                promises.push(dnShortsVideosMysql.getVideoByQuestionId(db.mysql.read, questionId));
            }
            promises.push(dnShortsVideosMysql.getVideosPCWise(db.mysql.read, lastIdNewUser));
            lastIdNewUser = (Number(lastIdNewUser) + 5).toString();
            promises.push(dnShortsVideosRedis.setLastIdPCRwise(db.redis.write, studentId, lastIdNewUser));
        } else if ((newUserNewShortsFlow === 5) && lastIdEvSet && Number(lastIdEvCombi) < Number(lastIdEvSet[0].id) && lastIdDnSet && Number(lastIdDnCombi) < Number(lastIdDnSet[0].id) && lastIdCcmSet && Number(lastIdCcmCombi) < Number(lastIdCcmSet[0].id)){
            if (typeof questionId !== 'undefined') {
                promises.push(dnShortsVideosMysql.getVideoByQuestionId(db.mysql.read, questionId));
            }
            let [evVideos, dnShortsVideos, ccmVideos] = await Promise.all([dnShortsVideosMysql.getVideosEvCombi(db.mysql.read, lastIdEvCombi), dnShortsVideosMysql.getVideosDnCombi(db.mysql.read, lastIdDnCombi), dnShortsVideosMysql.getVideosCcmCombi(db.mysql.read, studentClass, lastIdCcmCombi)])
            arr = [...evVideos, ...dnShortsVideos, ...ccmVideos];
            promises.push([]);
        } else if ((newUserNewShortsFlow === 6) && lastIdPcSet && Number(lastIdPcCombi) < Number(lastIdPcSet[0].id) && lastIdDnSet && Number(lastIdDnCombi) < Number(lastIdDnSet[0].id) && lastIdCcmSet && Number(lastIdCcmCombi) < Number(lastIdCcmSet[0].id)){
            if (typeof questionId !== 'undefined') {
                promises.push(dnShortsVideosMysql.getVideoByQuestionId(db.mysql.read, questionId));
            }
            let [pcVideos, dnShortsVideos, ccmVideos] = await Promise.all([dnShortsVideosMysql.getVideosPcCombi(db.mysql.read, lastIdPcCombi), dnShortsVideosMysql.getVideosDnCombi(db.mysql.read, lastIdDnCombi), dnShortsVideosMysql.getVideosCcmCombi(db.mysql.read, studentClass, lastIdCcmCombi)])
            arr = [...pcVideos, ...dnShortsVideos, ...ccmVideos];
            promises.push([]);
        } else if ((newUserNewShortsFlow === 7) && lastIdNewUserSet && Number(lastIdNewUser) < Number(lastIdNewUserSet[0].id)){
            if (typeof questionId !== 'undefined') {
                promises.push(dnShortsVideosMysql.getVideoByQuestionId(db.mysql.read, questionId));
            }
            promises.push(dnShortsVideosMysql.getVideosEPMWise(db.mysql.read, lastIdNewUser));
            lastIdNewUser = (Number(lastIdNewUser) + 5).toString();
            promises.push(dnShortsVideosRedis.setLastIdEPMwise(db.redis.write, studentId, lastIdNewUser));
        } else if ((newUserNewShortsFlow === 8) && epcIdArr.length && Number(lastIdMCEev) < Number(epcIdArr[epcIdArr.length - 1].id) && dnIdArr.length && Number(lastIdMCEDn) < Number(dnIdArr[dnIdArr.length -1].id) && ccmIdArr.length && Number(lastIdMCECcm) < Number(ccmIdArr[ccmIdArr.length - 1].id)){
            if (typeof questionId !== 'undefined') {
                promises.push(dnShortsVideosMysql.getVideoByQuestionId(db.mysql.read, questionId));
            }
            let [epcVideos, dnSVideos, ccVideos] = await Promise.all([dnShortsVideosMysql.getVideosMCEEVWise(db.mysql.read, lastIdMCEev, flag), dnShortsVideosMysql.getVideosMCEDnWise(db.mysql.read, lastIdMCEDn), dnShortsVideosMysql.getVideosMCECCMWise(db.mysql.read, studentClass, lastIdMCECcm)])
            if (flag === 2) {
                arr = [ccVideos[0], epcVideos[0], dnSVideos[0], ccVideos[1], epcVideos[1]];
            } else {
                arr = [...epcVideos, ...dnSVideos];
            }
            promises.push([]);
        } else if ((oldUserShortsFlow === 1) && lastIdOldUserSet.length && Number(lastIdOldUser) < Number(lastIdOldUserSet[lastIdOldUserSet.length - 1].id)){
            if (typeof questionId !== 'undefined') {
                promises.push(dnShortsVideosMysql.getVideoByQuestionId(db.mysql.read, questionId));
            }
            promises.push(dnShortsVideosMysql.getVideosOldUserEPM(db.mysql.read, lastIdOldUser));
            lastIdOldUser = (Number(lastIdOldUser) + 5).toString();
            promises.push(dnShortsVideosRedis.setLastIdOldUser(db.redis.write, studentId, lastIdOldUser));
        } else {
            let videosWatched = await dnShortsVideosRedis.getVideosWatched(db.redis.read, studentId);
            if (typeof questionId !== 'undefined') {
                promises.push(dnShortsVideosMysql.getVideoByQuestionId(db.mysql.read, questionId));
                videosWatched.push(questionId);
            }
            if (typeof type !== 'undefined' && type === Data.playlist_deeplink_type) {
                isSavedVideosList = true;
                promises.push(dnShortsVideosMysql.getSavedVideos(db.mysql.read, studentId));
            } else {
                promises.push(dnShortsVideosMysql.getVideos(db.mysql.read, videosWatched, lastId));
            }
            promises.push(PlaylistMysql.getAllActivePlaylistQuestionIds(db.mysql.read, studentId));
        }

        const resolvedPromises = await Promise.all(promises);
        const questionIdVideoData = typeof questionId !== 'undefined' ? resolvedPromises[0] : [];
        let shortVideosListData = typeof questionId !== 'undefined' ? resolvedPromises[1] : resolvedPromises[0];
        
        if (newUserNewShortsFlow === 5 || newUserNewShortsFlow === 6 || newUserNewShortsFlow === 8) {
            shortVideosListData = arr;
        }

        if (newUserNewShortsFlow === 2 && shortVideosListData && shortVideosListData.length) {
            lastIdDnShortsFlow = shortVideosListData[shortVideosListData.length - 1].id; 
            await dnShortsVideosRedis.setLastIdNewUser(db.redis.write, studentId, lastIdDnShortsFlow, 1);
        } else if (newUserNewShortsFlow === 3 && shortVideosListData && shortVideosListData.length) {
            lastIdNewUser =  shortVideosListData[shortVideosListData.length - 1].id;
            await dnShortsVideosRedis.setLastIdCCMwise(db.redis.write, studentId, lastIdNewUser); 
        }

        if (newUserNewShortsFlow === 5 && shortVideosListData && shortVideosListData.length) {
            lastIdEvCombi = (Number(lastIdEvCombi) + 3).toString();
            lastIdDnCombi = shortVideosListData[3].id; 
            lastIdCcmCombi = shortVideosListData[shortVideosListData.length - 1].id;
            await Promise.all([dnShortsVideosRedis.setLastIdNewUser(db.redis.write, studentId, `EDC_${lastIdEvCombi}_${lastIdDnCombi}_${lastIdCcmCombi}`, 0), dnShortsVideosRedis.setLastIdCCMClasswise(db.redis.write, studentId, studentClass, lastIdCcmCombi)]);
        } else if (newUserNewShortsFlow === 6 && shortVideosListData && shortVideosListData.length) {
            lastIdPcCombi = (Number(lastIdPcCombi) + 3).toString();
            lastIdDnCombi = shortVideosListData[3].id; 
            lastIdCcmCombi = shortVideosListData[shortVideosListData.length - 1].id;
            await Promise.all([dnShortsVideosRedis.setLastIdNewUser(db.redis.write, studentId, `CDC_${lastIdPcCombi}_${lastIdDnCombi}_${lastIdCcmCombi}`, 0), dnShortsVideosRedis.setLastIdCCMClasswise(db.redis.write, studentId, studentClass, lastIdCcmCombi)]);
        } else if (newUserNewShortsFlow === 8 && shortVideosListData && shortVideosListData.length) {
            lastIdMCEev = (flag === 2) ? (Number(lastIdMCEev) + 2).toString() : (Number(lastIdMCEev) + 4).toString();
            lastIdMCEDn = (Number(lastIdMCEDn) + 1).toString();
            lastIdMCECcm = (flag === 2) ? (Number(lastIdMCECcm) + 2).toString() : lastIdMCECcm;
            flag = (flag === 1) ? 2 : 1;
            await Promise.all([dnShortsVideosRedis.setLastIdNewUser(db.redis.write, studentId, `MCE_${lastIdMCEev}_${lastIdMCEDn}_${lastIdMCECcm}_${flag}`, 0), dnShortsVideosRedis.setLastIdMCECCMClasswise(db.redis.write, studentId, studentClass, lastIdMCECcm)]);
        }

        if (!newUserNewShortsFlow && !oldUserShortsFlow) {
            bookmarkedShortsVideosListData = (typeof questionId !== 'undefined') ? resolvedPromises[2] : resolvedPromises[1];
        }

        const widgets = dnShortsHelper.makeWidgets(config, [].concat(questionIdVideoData, shortVideosListData), {
            bookmarks: bookmarkedShortsVideosListData,
            deeplink_type: type,
        });
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
                increment_keys: {
                    shorts_viewed_count: 1,
                },
            },
            data: {
                widgets,
                lastId: (widgets.length > 0 && widgets[widgets.length - 1].type !== Data.videos_exhaust_widget_type && !isSavedVideosList) ? widgets[widgets.length - 1].data.id : null,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log('ERROR', e);
        next(e);
    }
}

async function updateWatchFootprint(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            question_id,
            engage_time,
            source,
        } = req.body;

        const {
            student_id: studentId,
        } = req.user;
        const questionDetails = await AnswerContainer.getByQuestionIdWithTextSolution(question_id, db);
        const videoViewObj = {
            student_id: studentId,
            question_id,
            answer_id: questionDetails[0].answer_id,
            answer_video: questionDetails[0].answer_video,
            engage_time,
            source: source || 'app',
            view_from: 'SHORTS',
        };

        const promises = [];
        promises.push(videoView.insertAnswerView(videoViewObj, db.mysql.write));
        promises.push(dnShortsVideosRedis.setVideosWatched(db.redis.write, studentId, question_id));
        await Promise.all(promises);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function bookmarkShorts(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            student_id,
            student_class,
        } = req.user;

        const {
            question_id,
            is_bookmarked,
        } = req.body;
        let playlistId;
        const playlistData = await Playlist.getShortsPlaylistByName(db.mysql.read, student_id, Data.custom_playlist_name);
        if (!_.isEmpty(playlistData)) {
            playlistId = playlistData[0].id;
        } else {
            playlistId = await dnShortsHelper.createCustomDnShortsPlaylist(db, student_id, student_class, Data.student_course);
        }

        if (String(is_bookmarked) === 'true') {
            await Playlist.removeQuestionFromPlaylist(playlistId, question_id, student_id, db.mysql.write);
        } else if (playlistId) {
            await Playlist.addQuestionInPlaylist(playlistId, question_id, student_id, db.mysql.write);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!!',
            },
            data: {},
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getDnShortTags(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            categoryId,
            type,
        } = req.body;
        let returnResponse = {};
        if (type === 'get_categories') {
            const categories = await dnShortsVideosMysql.getDnShortsCategories(
                db.mysql.read,
            );
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: categories,
            };
        }
        if (type === 'get_subcategories') {
            const subcategories = await dnShortsVideosMysql.getDnShortsSubCategories(
                db.mysql.read,
                categoryId,
            );
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: subcategories,
            };
        }
        res.status(returnResponse.meta.code).json(returnResponse);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    getVideosToQC,
    updateQcActionForRawVideo,
    getVideos,
    updateWatchFootprint,
    bookmarkShorts,
    getDnShortTags,
};
