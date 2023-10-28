const moment = require('moment');

module.exports = class DnShortsVideos {
    static getVideosUnderReviewStatus(client, videoId) {
        return client.getAsync(`DN_SV_UR_${videoId}`);
    }

    static setVideosUnderReviewStatus(client, videoId) {
        return client.setAsync(`DN_SV_UR_${videoId}`, 1, 'EX', 1 * 60 * 60);
    }

    static deleteVideosUnderReviewAfterAction(client, videoId) {
        return client.delAsync(`DN_SV_UR_${videoId}`);
    }

    static async getFetchedVideosReviewStatus(client, videoIdsArray) {
        return Promise.all([...videoIdsArray.map((x) => this.getVideosUnderReviewStatus(client, x))]);
    }

    static async getVideosWatched(client, studentId) {
        return client.lrangeAsync(`DN_SHORTS_VW_${studentId}`, 0, -1);
    }

    static setVideosWatched(client, studentId, dnShortsVideoId) {
        return client.multi()
            .lpush(`DN_SHORTS_VW_${studentId}`, dnShortsVideoId)
            .expireat(`DN_SHORTS_VW_${studentId}`, moment().add(5, 'hours').add(30, 'minutes').endOf('day')
                .unix())
            .execAsync();
    }

    static setLastIdNewUser(client, studentId, lastId, flag) {
        if (flag === 0) {
            return client.setAsync(`DN_SHORTS_NU_LID_${studentId}`, lastId, 'EX', 30 * 24 * 60 * 60);
        } else if (flag  === 1) {
            return client.setAsync(`DN_SHORTS_NU_DNS_${studentId}`, lastId, 'EX', 30 * 24 * 60 * 60);
        }
    }
    
    static setLastIdCCMwise(client, studentId, lastId) {
        return client.setAsync(`DN_SHORTS_NU_LID_${studentId}`, `CCM${lastId}`, 'EX', 30 * 24 * 60 * 60);
    }

    static setLastIdCCMClasswise(client, studentId, stClass, lastId) {
        return client.setAsync(`DN_SHORTS_CCM_${studentId}_${stClass}`, `${lastId}`, 'EX', 30 * 24 * 60 * 60);
    }

    static getLastIdCCMClasswise(client, studentId, stClass) {
        return client.getAsync(`DN_SHORTS_CCM_${studentId}_${stClass}`);
    }

    static setLastIdMCECCMClasswise(client, studentId, stClass, lastId) {
        return client.setAsync(`DN_SHORTS_MCE_${studentId}_${stClass}`, `${lastId}`, 'EX', 30 * 24 * 60 * 60);
    }

    static getLastIdMCECCMClasswise(client, studentId, stClass) {
        return client.getAsync(`DN_SHORTS_MCE_${studentId}_${stClass}`);
    }

    static setLastIdPCRwise(client, studentId, lastId) {
        return client.setAsync(`DN_SHORTS_NU_LID_${studentId}`, `PCR${lastId}`, 'EX', 30 * 24 * 60 * 60);
    }

    static setLastIdEPMwise(client, studentId, lastId) {
        return client.setAsync(`DN_SHORTS_NU_LID_${studentId}`, `EPM${lastId}`, 'EX', 30 * 24 * 60 * 60);
    }

    static getLastIdNewUser(client, studentId, flag) {
        if (flag === 0) {
            return client.getAsync(`DN_SHORTS_NU_LID_${studentId}`);
        } else if (flag === 1) {
            return client.getAsync(`DN_SHORTS_NU_DNS_${studentId}`); 
        }
    }

    static getLastIdOldUser(client, studentId) {
        return client.getAsync(`DN_SHORTS_OU_LID_${studentId}`); 
    }
    
    static setLastIdOldUser(client, studentId, lastId) {
        return client.setAsync(`DN_SHORTS_OU_LID_${studentId}`, `EPM${lastId}`, 'EX', 30 * 24 * 60 * 60);
    }

    static async getVideosCounterMetrics(client) {
        return client.hgetallAsync('DN_SHORTS_QC_METRICS');
    }

    static async incApprovedVideosCounter(client) {
        return client.hincrbyAsync('DN_SHORTS_QC_METRICS', 'is_approved', 1);
    }

    static async incDiscardedVideosCounter(client) {
        return client.hincrbyAsync('DN_SHORTS_QC_METRICS', 'is_discarded', 1);
    }
};
