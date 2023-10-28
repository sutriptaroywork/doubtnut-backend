/*
 * @Author: Abhishek Sinha
 * @Email: abhishek.sinha@doubtnut.com
 * @Date: 2019-12-09
 * @Last modified by: Abhishek Sinha
 * @Last modified time: 2019-12-09
 */

const aws = require('aws-sdk');
const moment = require('moment');
const config = require('./config');

const sqs = new aws.SQS({
    accessKeyId: config.aws_access_id,
    secretAccessKey: config.aws_secret,
    region: config.aws_region,
    signatureVersion: 'v4',
});

const eventNames = {
    apiResponseTime: 'api_response_time',
    askSuccess: 'ask_from_app_success',
    askFailure: 'ask_from_app_failure',
    payment: 'payment',
    subscription: 'subscription',
    searchVersionQuestionMapping: 'search_version_question_mapping',
    whatsappMessage: 'whatsapp_message_sent',
    whatsappMessageNetcore: 'whatsapp_message_netcore',
    whatsappNotification: 'whatsapp_notification',
    getSimilarQuestionCacheHit: 'getSimilarQuestionCacheHit',
    getSimilarQuestionCacheMiss: 'getSimilarQuestionCacheMiss',
    getPlaylistCacheHit: 'getPlaylistCacheHit',
    getPlaylistCacheMiss: 'getPlaylistCacheMiss',
    libraryGetAllCacheHit: 'libraryGetAllCacheHit',
    libraryGetAllCacheMiss: 'libraryGetAllCacheMiss',
    flagrResponseTimeout: 'flagrResponseTimeout',
    translateApiErrorResponses: 'translateApiErrorResponses',
    vvsMicroTimeout: 'vvsMicroTimeout',
    flagrResponseSuccess: 'flagrResponseSuccess',
};

/**
 * Adds telemetry to influxdb
 * @param {string} eventName Name of event, will be same as table created
 * @param {string | boolean | number} value Telemetry value to be stored
 * @param {{[name:string]:string}} tags Flat object for tags, will be indexed in db
 */
function addTelemetry(eventName, value, tags) {
    console.log(`Sending to telemetry: ${eventName}, ${value}, ${tags}`);
}

module.exports = {
    addTelemetry,
    eventNames,
};
