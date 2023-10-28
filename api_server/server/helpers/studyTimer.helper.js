/**
 * This is a helper file of study timer module,
 * built with class based architecture, used no-sql as primary database
 * PRD:https://docs.google.com/document/d/1wvZSF7USDHwl9YduO19g7g2Z0MW9ZgsX7ScGydC1-Fk/edit
 */

const _ = require('lodash');
const moment = require('moment');
const logger = require('../../config/winston').winstonLogger;
const studyTimerData = require('../../data/studyTimer.data');

class StudyTimerHelper {
    /*
      * @constructor
     */

    constructor(req, studentClass, studentId, locale, studentName, db, config, mongoClient) {
        this.config = config;
        this.db = db;
        this.locale = locale;
        this.mongoClient = mongoClient;
        this.req = req;
        this.xAuthToken = req.headers['x-auth-token'];
        this.studyQuotesCollection = 'study_quotes';
        this.studyMusicCollection = 'study_music';
        this.studyTimerCollection = 'study_timer_data';
        this.student_id = studentId;
        this.studentName = (studentName ? studentName.replace(/\r?\n|\r/g, ' ').replace(/ +/g, ' ') : 'Doubtnut User');
        this.message = 'Success';
        this.student_class = studentClass;
        this.groupId = null;
        this.capitalize = (s) => {
            if (typeof s !== 'string') return '';
            return s.charAt(0).toUpperCase() + s.slice(1);
        };
        this.currentDate = moment().add(5, 'hours').add(30, 'minutes').toDate();
        this.timeConvert = (n) => { // n in seconds
            if (n < 60) {
                return `${n} sec`;
            }
            const num = n / 60; // converting sec into minutes
            const hours = (num / 60);
            let rhours = Math.floor(hours);
            const minutes = (hours - rhours) * 60;
            let rminutes = Math.round(minutes);

            if (rminutes === 60) {
                rhours++;
                rminutes = 0;
            }

            if (rhours === 0 && rminutes !== 0) {
                return `${rminutes} Min`;
            }
            if (rhours !== 0 && rminutes === 0) {
                return `${rhours}Hr`;
            }
            if (rhours !== 0 && rminutes !== 0) {
                return `${rhours}Hr ${rminutes} Min`;
            }
        };
        this.formatDate = (date, month, year) => { // this function return today if date is of today,yesterday if date is of yesterday and else it return date in format 'DD MM(name of month) YYYY'
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
            ];
            const now = moment().add(5, 'hours').add(30, 'minutes').toDate();
            if (parseInt(date) === now.getDate() && parseInt(month) === (now.getMonth() + 1) && parseInt(year) === now.getFullYear()) {
                return this.locale === 'hi' ? 'आज' : 'Today';
            }
            const yesterday = moment().add(5, 'hours').add(30, 'minutes').subtract(1, 'day')
                .toDate();
            if (parseInt(date) === yesterday.getDate() && parseInt(month) === (yesterday.getMonth() + 1) && parseInt(year) === yesterday.getFullYear()) {
                return this.locale === 'hi' ? 'कल' : 'Yesterday';
            }
            return `${date}th ${monthNames[month - 1]} ${year}`;
        };
    }

    async home() {
        try {
            const goalTime = 60 * 60;
            const finalData = {
                title: this.locale === 'hi' ? `${goalTime} घंटा का लक्ष्य` : `Goal ${goalTime} for`,
                quote_time: 15,
                break_container: this.locale === 'hi' ? studyTimerData.breakContainer.hi : studyTimerData.breakContainer.en,
            };

            const quotesData = await this.mongoClient.read.collection(this.studyQuotesCollection).find({
                is_active: 1,
                locale: this.locale,
            }).sort({ position: 1 }).toArray();

            const musicData = await this.mongoClient.read.collection(this.studyMusicCollection).find({
                is_active: 1,
            }).sort({ position: 1 }).toArray();

            if (!_.isEmpty(quotesData)) {
                const quotesArray = [];
                _.forEach(quotesData, (data) => {
                    const obj = {
                        quote: data.quote,
                        author: data.author,
                    };
                    quotesArray.push(obj);
                });
                finalData.quotes = quotesArray;
            }

            if (!_.isEmpty(musicData)) {
                const musicArray = [];
                _.forEach(musicData, (data) => {
                    const obj = {
                        title: data.title,
                        audio_url: data.audio_url,
                    };
                    musicArray.push(obj);
                });
                finalData.music_list = musicArray;
            }

            return finalData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyTimerHelper', source: 'home', error: errorLog });
            throw (e);
        }
    }

    async stats() {
        try {
            const data = await this.mongoClient.read.collection(this.studyTimerCollection).aggregate([
                { $match: { studentId: this.student_id } },
            ]).sort({ created_at: -1 }).toArray();

            if (_.isEmpty(data)) {
                return this.locale === 'hi' ? studyTimerData.no_stats_container.hi : studyTimerData.no_stats_container.en;
            }
            const finalData = {
                title: `${this.locale === 'hi' ? studyTimerData.welldone.hi : studyTimerData.welldone.en}, ${this.studentName}!`,
            };

            let dateArr = [];
            let labelArr = [];
            _.forEach(data, (x) => {
                const date = moment(x.created_at).format('DD-MM-YYYY');
                dateArr.push(date);
                labelArr.push(x.label);
            });
            dateArr = _.uniq(dateArr);
            labelArr = _.uniq(labelArr);

            const dateWiseDataObj = {};
            _.forEach(dateArr, (date) => {
                const dateWiseData = [];
                _.forEach(data, (x) => {
                    if (moment(x.created_at).format('DD-MM-YYYY') === date && labelArr.includes(x.label)) {
                        dateWiseData.push(x);
                        dateWiseDataObj[`date_${date}`] = dateWiseData;
                    }
                });
            });

            const goals = [];
            _.forEach(dateArr, (date) => {
                const dateMonthYear = date.split('-');
                const items = dateWiseDataObj[`date_${date}`];
                const goal_data = [];
                const finalObj = {
                    day_text: this.formatDate(dateMonthYear[0], dateMonthYear[1], dateMonthYear[2]),
                };
                _.forEach(labelArr, async (label) => {
                    let includesLabel = false;
                    const obj = {
                        goal_title: this.locale === 'hi' ? `1 घंटा का लक्ष्य - ${label}` : `Goal 1hr for ${label}`, // for 1 have added 1hr as static
                    };
                    let totalTime = 0;
                    let breakTime = 0;
                    let totalSessions = 0;
                    let totalBreaks = 0;
                    _.forEach(items, (item) => {
                        if (label === item.label) {
                            includesLabel = true;
                            totalTime += item.total_study_time;
                            breakTime += item.total_break_time;
                            totalSessions++;
                            totalBreaks += item.number_of_breaks;
                        }
                    });
                    obj.total_time = this.timeConvert(totalTime);
                    obj.break_time = this.timeConvert(breakTime);
                    obj.total_sessions = totalSessions;
                    obj.total_breaks = totalBreaks;
                    if (includesLabel) {
                        goal_data.push(obj);
                    }
                });
                finalObj.goal_data = goal_data;
                goals.push(finalObj);
            });

            finalData.goals = goals;
            return finalData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyTimerHelper', source: 'stats', error: errorLog });
            throw (e);
        }
    }

    async result() {
        try {
            const {
                label,
                total_study_time: totalStudyTime,
                total_break_time: totalBreakTime,
                total_breaks: totalBreaks,
            } = this.req.body;
            const studentGoalDetails = {
                studentId: this.student_id,
                label,
                total_study_time: parseInt(totalStudyTime),
                total_break_time: parseInt(totalBreakTime),
                number_of_breaks: parseInt(totalBreaks),
                created_at: this.currentDate,
            };
            await this.mongoClient.write.collection(this.studyTimerCollection).insertOne(studentGoalDetails);
            return {
                message: this.message,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'StudyTimerHelper', source: 'result', error: errorLog });
            throw (e);
        }
    }
}

module.exports = StudyTimerHelper;
