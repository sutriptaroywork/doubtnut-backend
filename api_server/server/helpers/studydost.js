/**
 * This is a helper file of student rewards module,
 * built with class based architecture, used no-sql as primary database
 * PRD: https://docs.google.com/document/d/1IpWMIPNUi9EyIciisMSLb9Tgu8GQVtqDig4Wd_e3ASs
 */

const _ = require('lodash');
const moment = require('moment');
const studyDostMysql = require('../../modules/mysql/studydost');

class StudyDostManager {
    /**
     * Reward system is a new feature where students can mark their attendance,
     * and basis their attendance marked and  being consistent on the app will
     * give them rewards. There will be 7 levels of this reward system in which
     * users will get scratch cards.
     * @constructor
     */
    constructor(req, studentClass, studentId, locale, db, config, mongoClient) {
        this.db = db;
        this.config = config;
        this.locale = locale;
        this.mongoClient = mongoClient;
        this.req = req;
        this.student_class = studentClass;
        this.student_id = studentId;
        this.studentStreakCollection = 'student_rewards';
        this.message = 'SUCCESS';
        this.popupHeading = null;
        this.popupDescription = null;
        this.toggleContent = null;
        this.is_streak_break = false;
        this.isReward = false;
        this.datesAreOnSameDay = (first, second) => first.getFullYear() === second.getFullYear()
            && first.getMonth() === second.getMonth()
            && first.getDate() === second.getDate();
        // eslint-disable-next-line no-mixed-operators
        this.daysDifferenceFromCurrent = (d) => {
            const current = moment().add(5, 'hours').add(30, 'minutes');
            d = moment(d);
            return moment(`${current.format('DD-MM-YYYY')}`, 'DD-MM-YYYY').diff(moment(`${d.format('DD-MM-YYYY')}`, 'DD-MM-YYYY'), 'days');
        };
        this.safeTrim = (content) => (_.isEmpty(content) ? content : content.trim());
        this.safeTrimAndReplace = (content, replacedText) => (_.isEmpty(content) ? content : content.trim().replace('<>', replacedText));
        this.capitalize = (s) => {
            if (typeof s !== 'string') return '';
            return s.charAt(0).toUpperCase() + s.slice(1);
        };
        this.currentDate = moment().add(5, 'hours').add(30, 'minutes').toDate();
    }

    getNowAndTodayInIST() {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const today = now.format('YYYY-MM-DD');
        return { now, today };
    }

    async isAllowedToRequest() {
        try {
            const isAlreadyRequested = await studyDostMysql.isAlreadyRequested(this.db.mysql.read, this.student_id);
            console.log(isAlreadyRequested, ' isAlreadyRequested', Boolean(isAlreadyRequested.exist), typeof isAlreadyRequested[0].exist);
            return Boolean(!parseInt(isAlreadyRequested[0].exist));
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async getStudyDostRoomId() {
        try {
            const roomId = await studyDostMysql.getStudyDostRoomId(this.db.mysql.read, this.student_id);
            console.log(roomId, ' roomId');
            if (roomId) {
                return roomId[0];
            }
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async getStudyDostName(roomId) {
        try {
            const studentNameId = roomId.student1 === this.student_id ? roomId.student2 : roomId.student1;
            let studentName = await studyDostMysql.getStudyDostName(this.db.mysql.read, studentNameId);
            if (studentName) {
                studentName = studentName[0];
            }
            let name = `${this.capitalize(studentName.student_fname)} ${this.capitalize(studentName.student_lname)}`;
            name = name.replace(/[^a-zA-Z0-9+\s]/g, '').trim();
            name = name.length > 15 ? `${name.slice(0, 15)}...` : name;

            return encodeURI(name) || 'Study%20Dost';
        } catch (e) {
            console.error(e);
            return 'Study%20Dost';
        }
    }

    async request() {
        try {
            const isAllowedToRequest = await this.isAllowedToRequest();
            const data = { image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/4D763EA8-AA87-4964-21FB-5373DFD5C9DE.webp' };
            if (isAllowedToRequest) {
                // await studyDostMysql.createRequest(this.db.mysql.write, this.student_id);
                data.description = 'You Requested For Doubtnut Buddy, We will notify you when we find Your Doubtnut Study Dost';
                data.level = 1;
                // this.matchStudents();
            } else {
                data.description = 'Find Your Doubtnut Study Dost and learn Together';
                data.cta_text = 'Request for Study Dost';
                data.level = 0;
                // this.matchStudents();
            }
            return data;
        } catch (e) {
            console.error(e);
        }
    }

    async isRoomBlocked() {
        try {
            const isRoomBlocked = await studyDostMysql.isRoomBlocked(this.db.mysql.read, this.req.query.room_id);
            return Boolean(parseInt(isRoomBlocked[0].exist));
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async blockRoom() {
        try {
            await studyDostMysql.blockRoom(this.db.mysql.write, this.req.body.room_id);
            const roomDetails = await studyDostMysql.getStudyDostStudents(this.db.mysql.read, this.req.body.room_id);
            if (roomDetails) {
                await studyDostMysql.allowRequest(this.db.mysql.write, [roomDetails[0].student1, roomDetails[0].student2]);
                await studyDostMysql.createRequest(this.db.mysql.write, this.student_id);
            }
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async getRequestedStudents() {
        const studydostStudents = await this.db.mysql.read.query('SELECT student1, student2 FROM studydost WHERE status=1')
            .then((res) => res[0]);
        console.log(studydostStudents, ' studydostStudents');
        const studydostAddedStudents = new Set();
        for (let i = 0; i < studydostStudents.length; i++) {
            studydostAddedStudents.add(studydostStudents[i].student1);
            studydostAddedStudents.add(studydostStudents[i].student2);
        }
        console.log(studydostAddedStudents, ' studydostAddedStudents');
        const sql = `SELECT s.student_id,s.gcm_reg_id,s.student_fname,s.student_lname,s.student_class,
                       s.locale,(SELECT ccm.id FROM student_course_mapping scm
                                 JOIN class_course_mapping ccm ON scm.ccm_id = ccm.id
                        WHERE scm.student_id = s.student_id
                          AND ccm.category = 'board'
                        ORDER BY scm.id DESC
                        LIMIT 1) AS ccm_id
                    FROM studydost_requests sr
                         JOIN students s ON sr.student_id = s.student_id
                    WHERE sr.status = 1 IS NOT NULL
                    AND s.student_id NOT IN (${[...studydostAddedStudents]})
                    GROUP BY s.student_id
                    ORDER BY ccm_id DESC, s.student_class DESC, s.locale`;
        console.log(sql);
        const result = await this.db.mysql.read.query(sql)
            .then((res) => res[0]);
        return result;
    }

    async matchStudents() {
        try {
            const requestedStudents = await this.getRequestedStudents();
            if (!requestedStudents.length) {
                return false;
            }
            let ccmId = null;
            const currentUserBoardCcmIdQuery = `SELECT ccm_id FROM student_course_mapping scm join class_course_mapping ccm on scm.ccm_id = ccm.id WHERE scm.student_id = ${this.student_id} AND ccm.category = 'board' LIMIT 1`;
            const currentUserBoardCcmId = await this.db.mysql.read.query(currentUserBoardCcmIdQuery)
                .then((res) => res[0]);
            console.log(currentUserBoardCcmId, ' currentUserBoardCcmId');
            if (currentUserBoardCcmId && currentUserBoardCcmId.ccm_id) {
                console.log('user has board ccm id');
                ccmId = currentUserBoardCcmId.ccm_id;
                for (let i = 0; i <= requestedStudents.length; i++) {
                    if (requestedStudents[i] && requestedStudents[i].ccm_id && ccmId === requestedStudents[i].ccm_id) {
                        console.log('exact ccm id matched!');
                        break;
                    }
                }
            }
        } catch (e) {
            console.error(e);
            return false;
        }
    }
}

module.exports = StudyDostManager;
