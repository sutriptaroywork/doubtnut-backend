const _ = require('lodash')
// let Utility = require('./utility');
const hash_expiry = 3 * 60 * 60 * 24; // 3 days
const trending_hash_expiry = 1 * 60 * 60 * 24; // 1 day
const set_expiry = 1 * 60 * 60;
module.exports = class SubjectPersonalisation {
    constructor() {
    }
    static async setPersonalisationForStudent(client, student_id, data) {
        let redisKey = student_id;
        return client.multi()
            .hset("recent-watched-video-meta", redisKey, JSON.stringify(data))
            .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
            .execAsync()
    } 

    static getQuestionMetaForPersonalisation(client,student_id){
        return client.hgetAsync("recent-watched-video-meta",student_id);
    }

// -------------- -        -       will do class wise later not as for now   - -- ------ -------- // 
// will convert to hsetAsync
    static getGeneralQuestionMetaForPersonalisation(client){
        return client.getAsync("most-watched-video-meta");
    }


    static getMostGeneralQuestionMetaForPersonalisation(client){
        return client.getAsync("most-gen-watched-video-meta");
    }

    // static async setPersonalisationForStudent(client, student_id, data) {
    //     let redisKey = student_id;
    //     return client.hset("recent-watched-video-meta", redisKey, JSON.stringify(data))
    //         .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
    //         .execAsync()
    // }

    // static getQuestionMetaForPersonalisation(student_class , subject , chapter) {
    //     return client.hgetAsync("most-watched-video-meta", student_id);
    // }


 


}
