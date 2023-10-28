const _ = require('lodash');
const nodeGeocoder = require('node-geocoder');

const data = require('../../data/data');
const Student = require('../../modules/student');
const ClassContainer = require('../../modules/containers/class');
const ClassCourseMapping = require('../../modules/classCourseMapping');
const StudentCourseMapping = require('../../modules/studentCourseMapping');
const LanguageContainer = require('../../modules/containers/language');
const StudentContainer = require('../../modules/containers/student');
const Utility = require('../../modules/utility');
const StudentMongo = require('../../modules/mongo/student');
const ClassCourseMappingContainer = require('../../modules/containers/ClassCourseMapping');
const ClassCourseMappingMysql = require('../../modules/mysql/classCourseMapping');

class OnBoaridng {
    constructor(request) {
        this.req = request;
        this.config = request.app.get('config');
        this.db = request.app.get('db');
        this.query = request.query;
        this.user = request.user;
        this.StaticData = data;
        this.sqs = request.app.get('sqs');
    }

    getUserName(studentData) {
        let userName = '';
        if (studentData[0].student_fname != undefined && studentData[0].student_fname != null && studentData[0].student_fname != '' && studentData[0].student_fname != 'undefined' && studentData[0].student_fname != 'null') {
            userName = studentData[0].student_fname;
            if (studentData[0].student_lname != undefined && studentData[0].student_lname != null && studentData[0].student_lname != '' && studentData[0].student_lname != 'undefined' && studentData[0].student_lname != 'null') {
                userName += ` ${studentData[0].student_lname}`;
            }
        } else if (studentData[0].student_lname != undefined && studentData[0].student_lname != null && studentData[0].student_lname != '' && studentData[0].student_lname != 'undefined' && studentData[0].student_lname != 'null') {
            userName = studentData[0].student_lname;
        }

        if (userName.includes(null)) {
            userName = '';
        }
        this.username = userName;
    }

    addingEmptyStep(type, locale) {
        const stepsData = {};
        stepsData.type = type;
        if (this.StaticData.middleEastCountryCodes.includes(this.user.country_code)) {
            stepsData.title = type === 'stream' ? this.StaticData.onBoardingStreamOldHeading : this.StaticData.onBoardingExamOldHeading;
        } else {
            stepsData.title = type === 'stream' ? this.StaticData.onBoardingStreamHeading(locale) : this.StaticData.onBoardingExamHeading(locale);
        }
        return stepsData;
    }

    askButtonData(returnData, locale) {
        returnData.ask_button_text = this.StaticData.askButtonText(locale);
        returnData.ask_button_active_message = this.StaticData.askButtonActiveMessage(locale);
        returnData.ask_button_inactive_message = this.StaticData.askButtonInactiveMessage(locale);
        return returnData;
    }

    updateStudentCourseMapping(ccmId) {
        const obj = {
            student_id: this.user.student_id,
            ccm_id: ccmId,
        };
        StudentCourseMapping.insertWidgetSelectionForStudent(this.db.mysql.write, obj);
    }

    async updateAltAppBoardExam(packageName, selectedClass) {
        const boardDetails = new Map([
            ['com.doubtnut.iit.jee.maths', 'CBSE'],
            ['com.doubtnut.neet.biology.ncert', 'CBSE'],
        ]);

        const examDetails = new Map([
            ['com.doubtnut.iit.jee.maths', 'IIT JEE'],
            ['com.doubtnut.neet.biology.ncert', 'NEET'],
        ]);

        const board = boardDetails.get(packageName);
        const exam = examDetails.get(packageName);

        const boardExamDataArr = [
            ClassCourseMapping.getIdByCategoryClassCourse(this.db.mysql.read, 'board', selectedClass, board),
            ClassCourseMapping.getIdByCategoryClassCourse(this.db.mysql.read, 'exam', selectedClass, exam),
        ];

        const boardExamData = await Promise.all(boardExamDataArr);
        const boardResult = boardExamData[0];
        const examResult = boardExamData[1];

        Student.deleteUserInRedis(this.user.student_id, this.db.redis.write);
        await Student.deleteBoardAndExam(this.user.student_id, this.db.mysql.write);
        this.updateStudentCourseMapping(boardResult[0].id);
        this.updateStudentCourseMapping(examResult[0].id);
    }

    async getLangText(langCode) {
        const language = await LanguageContainer.getLanguageByCode(this.db, langCode);
        let langText = 'english';
        if (language != undefined && language != {} && language.length != 0) {
            langText = language[0].language;
        }
        return langText;
    }

    async getClassListData(configData, locale) {
        let classLang = 'english';
        if (configData.langText != undefined && configData.langText === 'hindi') {
            classLang = configData.langText;
        }
        const result = await ClassContainer.getClassListNewOnBoarding(this.db, classLang);
        let temp = result.shift();
        result.push(temp);
        temp = result.shift();
        result.splice(2, 0, temp);
        const returnData = {};

        returnData.type = 'class';
        if (configData.langText !== undefined) {
            returnData.title = this.StaticData.onBoardingClassHeading(locale);
            returnData.error_message = this.StaticData.classErrorMsg(locale);
        } else {
            returnData.title = `${this.StaticData.onBoardingClassHeading('en')}\n${this.StaticData.onBoardingClassHeading('hi')}`;
            returnData.error_message = this.StaticData.classErrorMsg('en');
        }
        returnData.is_active = configData.is_active;
        returnData.is_multi_select = configData.is_multi_select;
        returnData.is_submitted = configData.is_submitted;
        returnData.image = '';
        returnData.message = '';
        returnData.step_items = result;
        returnData.step_items = returnData.step_items.map((a) => {
            if (configData.selectedClass !== undefined && !configData.dropper && a.code == configData.selectedClass) {
                a.is_active = true;
            } else if (configData.dropper && a.code === 13) {
                a.is_active = true;
            } else {
                a.is_active = false;
            }
            a.sub_title = null;
            return a;
        });

        if (configData.country_code && this.StaticData.middleEastCountryCodes.includes(configData.country_code)) {
            returnData.title = this.StaticData.onBoardingClassOldHeading;
            returnData.step_items = returnData.step_items.filter((x) => !x.title.includes('Government Exams') && !x.title.includes('सरकारी परीक्षा'));
            returnData.step_items = returnData.step_items.map((a) => {
                if (a.code === 13) {
                    a.title = 'Dropper/ Repeat Year';
                } else {
                    a.title = _.replace(a.title, /कक्षा/g, 'Class');
                }
                return a;
            });
        }

        const imageLink = `${this.config.staticCDN}${this.StaticData.classNextImage}`;
        const messageLink = `${this.StaticData.classNextMessage}\n${this.StaticData.classNextHindiMessage}`;
        returnData.progress_details = {
            image: imageLink,
            message: messageLink,
        };
        if (configData.imageShow != undefined && !configData.imageShow) {
            returnData.progress_details = null;
        }
        return returnData;
    }

    async updateMiddleEastBoardExam(selectedClass) {
        const boardDetails = await ClassCourseMapping.getIdByCategoryClassCourse(this.db.mysql.read, 'board', selectedClass, 'CBSE');

        Student.deleteUserInRedis(this.user.student_id, this.db.redis.write);
        await Student.deleteBoardAndExam(this.user.student_id, this.db.mysql.write);
        this.updateStudentCourseMapping(boardDetails[0].id);
    }

    getCollapseDetails(activePosition, configData) {
        const collapsingDetails = {
            collapsing_index: this.StaticData.collapseCount,
            collapsing_item: {
                id: 123,
                code: 'other',
                title: configData.langText === 'hindi' ? 'अन्य' : 'Other',
                sub_title: '',
                type: '',
                is_active: false,
            },
        };
        if (activePosition > this.StaticData.collapseCount) {
            collapsingDetails.collapsing_item.is_active = true;
        }
        return collapsingDetails;
    }

    async getBoardExamListData(configData, locale) {
        const returnData = {};
        let examOrdering = '';
        if (configData.type === 'exam') {
            const userStreamDetails = await ClassCourseMapping.getStudentsExamsBoardsData(this.db.mysql.read, this.user.student_id, 'stream');
            if (userStreamDetails && userStreamDetails.length > 0 && userStreamDetails[0].stream_name !== 'Science') {
                examOrdering = userStreamDetails[0].stream_name;
            }
        }

        returnData.type = configData.type;
        returnData.is_active = configData.is_active;
        returnData.is_multi_select = configData.is_multi_select;
        returnData.is_submitted = configData.is_submitted;
        returnData.image = '';
        returnData.message = '';

        const progMsg = this.StaticData.boardNextMessage(locale);
        if (configData.type === 'board') {
            returnData.title = this.StaticData.onBoardingBoardHeading(locale);
            if (['11', '12'].includes(configData.stu_class)) {
                returnData.error_message = this.StaticData.boardErrorMsg(locale);
            } else if (['9', '10'].includes(configData.stu_class)) {
                returnData.error_message = this.StaticData.boardErrorMsgFor910(locale);
            }
            returnData.step_items = await StudentContainer.getExamsBoardsDetailsLocalised(this.db, configData.stu_class, configData.type, configData.langText);
        } else {
            returnData.title = this.StaticData.onBoardingExamHeading(locale);
            returnData.error_message = this.StaticData.examErrorMsg(locale);
            returnData.step_items = await StudentContainer.getExamsBoardsDetailsLocalised(this.db, configData.stu_class, configData.type, configData.langText, examOrdering);
        }
        let count = 0;
        let activePosition = 0;
        // const boardsTitleInExam = await UtilityFlagr.getBooleanFlag(configData.xAuthToken, 'state_boards_in_exam');
        returnData.step_items = returnData.step_items.map((a) => {
            count++;
            if (configData.selectedBoard !== undefined && a.code == configData.selectedBoard) {
                activePosition = count;
                a.is_active = true;
            } else {
                a.is_active = false;
            }
            // if (configData.type === 'exam') {
            //     if (boardsTitleInExam) {
            //         if (a.title === 'स्टेट बोर्ड परीक्षा' && configData.langText === 'hindi') {
            //             a.title = this.StaticData.newBoardExamName.hi;
            //         } else if (a.title === 'BOARD EXAMS' && configData.langText !== 'hindi') {
            //             a.title = this.StaticData.newBoardExamName.en;
            //         }
            //     }
            // }
            return a;
        });

        if (configData.type === 'board' && count > this.StaticData.collapseCount) {
            returnData.collapsing_details = this.getCollapseDetails(activePosition, configData);
        }

        if (configData.type === 'board' && configData.country_code && this.StaticData.middleEastCountryCodes.includes(configData.country_code)) {
            returnData.title = this.StaticData.onBoardingBoardOldHeading;
            returnData.step_items = returnData.step_items.filter((x) => x.title.includes('CBSE') || x.title.includes('सीबीएसई'));
            returnData.step_items = returnData.step_items.map((a) => {
                a.title = 'CBSE';
                return a;
            });
            delete returnData.collapsing_details;
        } else if (configData.type === 'exam' && configData.country_code && this.StaticData.middleEastCountryCodes.includes(configData.country_code)) {
            returnData.title = this.StaticData.onBoardingExamOldHeading;
            returnData.step_items = await StudentContainer.getExamsBoardsDetailsLocalised(this.db, configData.stu_class, configData.type, 'english', examOrdering);
            returnData.step_items = returnData.step_items.map((a) => {
                if (configData.selectedBoard !== undefined && a.code == configData.selectedBoard) {
                    a.is_active = true;
                } else {
                    a.is_active = false;
                }
                return a;
            });
            delete returnData.collapsing_details;
        }

        const imageLink = `${this.config.staticCDN}${this.StaticData.boardNextImage}`;
        const messageLink = progMsg;
        returnData.progress_details = {
            image: imageLink,
            message: messageLink,
        };
        if (configData.imageShow != undefined && !configData.imageShow) {
            returnData.progress_details = null;
        }
        returnData.step_items = returnData.step_items.filter((x) => x.title !== '');
        return returnData;
    }

    async suffleBoardData(studentState, stateArr, stateArrHindi, stateCodeArr, boardList, selectedBoard) {
        let stateIndex = '';
        if (studentState.length == 2) {
            stateIndex = stateCodeArr.indexOf(studentState.toUpperCase());
        } else {
            stateIndex = stateArr.indexOf(studentState);
        }
        if (stateIndex === '') {
            stateIndex = stateArrHindi.indexOf(studentState);
        }
        if (stateIndex !== '' && stateIndex !== -1) {
            const stateDbId = this.StaticData.stateDbNameIdArr[stateIndex];
            const stateDbNameResponse = await Student.getStateNameByLocale(this.db.mysql.read, stateDbId, this.user.locale, this.user.student_class);
            if (stateDbNameResponse && stateDbNameResponse.length > 0) {
                const stateDbName = stateDbNameResponse[0].state_name;
                const newBoardList = boardList.step_items.filter((x) => x.title === stateDbName);
                if (newBoardList && newBoardList.length === 0) {
                    // add user state board on top of the board list
                    const userBoardData = this.user.locale === 'hi' ? await ClassCourseMappingMysql.getHindiCourseName(this.db.mysql.read, stateDbName, this.user.student_class) : await ClassCourseMappingMysql.getByCourseName(this.db.mysql.read, stateDbName, this.user.student_class);
                    if (userBoardData && userBoardData.length > 0) {
                        const userStateDetails = [{
                            id: userBoardData[0].id,
                            title: userBoardData[0].course,
                            type: 'board',
                            code: userBoardData[0].id,
                            is_active: false,
                            sub_title: '',
                        }];
                        if (this.user.locale === 'hi') {
                            userStateDetails[0].english_title = userBoardData[0].english_title;
                        }
                        boardList.step_items = [...userStateDetails, ...boardList.step_items];
                    }
                } else {
                    // take users board on top of the table
                    boardList.step_items = boardList.step_items.filter((x) => x.title !== stateDbName);
                    boardList.step_items = [...newBoardList, ...boardList.step_items];
                }

                if (newBoardList && newBoardList.length === 1) {
                    const modificationObj = {
                        student_id: this.user.student_id,
                        board: newBoardList[0].title,
                    };
                    Student.boardModificationRecord(this.db.mysql.write, modificationObj);
                }
                if (selectedBoard !== 0) {
                    // checking if we have a selected board but list don't have an active board
                    const trueFromBoardList = boardList.step_items.filter((x) => x.is_active);
                    if (trueFromBoardList && trueFromBoardList.length === 0) {
                        boardList.step_items.forEach((x) => {
                            if (x.id == selectedBoard) {
                                x.is_active = true;
                            }
                        });
                    }
                }
            }
        }
        return boardList;
    }

    async updateStudentCourseAndExam(ccmIds, searchType) {
        const promises = [];
        for (let i = 0; i < ccmIds.length; i++) {
            const obj = {
                student_id: this.user.student_id,
                ccm_id: ccmIds[i],
                type: searchType,
            };
            if (searchType === 'board' || searchType === 'stream') {
                /* eslint-disable no-await-in-loop */
                const dataExistRes = await ClassCourseMapping.getStudentsExamsBoardsData(this.db.mysql.read, this.user.student_id, searchType);
                if (!_.isEmpty(dataExistRes)) {
                    dataExistRes.forEach((element) => {
                        promises.push(StudentCourseMapping.deleteWidgetSelectionForStudent(this.db.mysql.write, element.table_id));
                    });
                }
            }
            if (searchType === 'stream') {
                /* eslint-disable no-await-in-loop */
                const dataExistRes = await ClassCourseMapping.getStudentsExamsBoardsData(this.db.mysql.read, this.user.student_id, 'board');
                if (!_.isEmpty(dataExistRes)) {
                    dataExistRes.forEach((element) => {
                        promises.push(StudentCourseMapping.deleteWidgetSelectionForStudent(this.db.mysql.write, element.table_id));
                    });
                }
            }
            promises.push(StudentCourseMapping.insertWidgetSelectionForStudent(this.db.mysql.write, obj));
        }
        await Promise.all(promises);
    }

    async dataUpdater(obj) {
        const studentPromise = [];
        studentPromise.push(Student.updateStudentDetails(this.db.mysql.write, obj, this.user.student_id));
        studentPromise.push(Student.deleteUserInRedis(this.user.student_id, this.db.redis.write));
        studentPromise.push(Student.deleteBoardAndExam(this.user.student_id, this.db.mysql.write));
        const userDataUpdate = await Promise.all(studentPromise);
        if (!_.isEmpty(userDataUpdate) && !_.isEmpty(userDataUpdate[0]) && userDataUpdate[0].affectedRows != undefined && userDataUpdate[0].affectedRows == 1) {
            return 1;
        }
        obj.student_id = this.user.student_id;
        Student.insertClassFailedOnboardingData(this.db.mysql.write, obj);
        return 0;
    }

    classChangeHistory(sClass) {
        const queueUrl = this.config.class_change_sqs;
        const messageData = {
            type: 'new_student_class',
            student_class: sClass,
            studentId: this.user.student_id,
        };
        StudentMongo.insertIntoClassChangeHistory(this.user.student_id, sClass, this.db.mongo.write, 'onboarding');
        Utility.sendMessageFIFO(this.sqs, queueUrl, messageData);
    }

    async storeLocale() {
        const locale = this.query.langCode;
        this.user.locale = this.query.langCode;
        const obj = { locale };
        await this.dataUpdater(obj);
        const boardsData = await ClassCourseMapping.getStudentsExamsBoardsData(this.db.mysql.read, this.user.student_id);
        if (boardsData.length > 0) {
            await Student.deleteBoardAndExam(this.user.student_id, this.db.mysql.write);
        }
    }

    async topBarDataBuilder(getCall = false) {
        const studentData = await Student.getStudentWithLocation(this.user.student_id, this.db.mysql.read);
        this.getUserName(studentData);
        const userName = this.username;
        let userImg = '';
        if (studentData[0].img_url == undefined || studentData[0].img_url == null) {
            userImg = `${this.config.staticCDN}${this.StaticData.userDefaultPic}`;
        } else {
            userImg = studentData[0].img_url;
        }

        const topbarData = {
            type: 'user_details',
            image: userImg,
            title: `Hey ${userName}`,
            message: this.StaticData.topMsg('en'),
        };
        this.returnData.is_final_submit = false;
        this.returnData.ask_question = false;

        if (this.StaticData.middleEastCountryCodes.includes(this.user.country_code)) {
            this.user.locale = 'en';
        }
        topbarData.message = this.StaticData.topMsg(this.user.locale);
        this.returnData = this.askButtonData(this.returnData, this.user.locale);
        this.returnData.steps = [];
        this.returnData.steps.push(topbarData);
    }

    makeStreamStaticData(configData) {
        const returnObj = {
            type: configData.type,
            is_active: configData.is_active,
            is_multi_select: configData.is_multi_select,
            is_submitted: configData.is_submitted,
            image: '',
            message: '',
            title: this.StaticData.onBoardingStreamHeading(this.user.locale),
            error_message: this.StaticData.streamErrorMsg(this.user.locale),
        };

        if (data.middleEastCountryCodes.includes(configData.country_code)) {
            returnObj.title = this.StaticData.onBoardingStreamOldHeading;
        }

        return returnObj;
    }

    addTrueFalseInList(itemList, matchId = 0) {
        itemList.forEach((x) => {
            if (matchId !== 0 && x.code === parseInt(matchId)) {
                x.is_active = true;
            } else {
                x.is_active = false;
            }
        });
        return itemList;
    }

    orderStreamData(streamList) {
        streamList.forEach((x) => {
            x.type = 'stream';
            if (x.id === x.parent_ccm_id) {
                x.title = this.user.locale === 'hi' ? 'विज्ञान' : x.stream_name;
                x.order_id = 1;
            } else {
                if (!x.title ) {
                    x.title = '';
                }
                x.title = this.user.locale === 'hi' ? x.title.split('-')[1].trim() : x.stream_name;
            }
        });
        streamList = _.orderBy(streamList, ['order_id'], ['asc']);
        return streamList;
    }

    getStreamDetails(configData) {
        const returnObj = this.makeStreamStaticData(configData);
        this.streamList = this.orderStreamData(this.streamList);
        returnObj.step_items = this.addTrueFalseInList(this.streamList);

        return returnObj;
    }

    async getStreamListData(configData) {
        const returnObj = this.makeStreamStaticData(configData);

        const studentStreamData = await ClassCourseMapping.getStudentsExamsBoardsData(this.db.mysql.read, this.user.student_id, configData.type);
        if (studentStreamData && studentStreamData.length > 0) {
            const localeText = configData.langText === 'hindi' ? configData.langText : 'english';
            let streamList = await ClassCourseMappingContainer.getStreamDetails(this.db, studentStreamData[0].parent_ccm_id, localeText);
            if (streamList && streamList.length > 0) {
                streamList = this.orderStreamData(streamList);
                returnObj.step_items = this.addTrueFalseInList(streamList, configData.selectedStream);
            }
        }

        return returnObj;
    }

    getLocationWithLatLong() {
        return new Promise((resolve, reject) => {
            const options = {
                provider: 'openstreetmap',
            };
            const geoCoder = nodeGeocoder(options);
            const { lat, long } = this.latLongData;

            geoCoder.reverse({ lat, lon: long })
                .then((res) => resolve(res))
                .catch((err) => {
                    console.log('here catch : ', err);
                    return resolve({});
                });
        });
    }

    async getStudentState() {
        let studentState = '';
        let lat = 0;
        let lon = 0;
        let zeroLatLong = false;
        const { 'x-client-region': clientRegion, 'x-client-region-subdivision': clientRegionSubDivision } = this.req.headers;

        if (clientRegion != undefined && clientRegionSubDivision != undefined && clientRegion === 'IN') {
            studentState = clientRegionSubDivision.substring(2);
        }

        if (studentState === '') {
            const dataFromLocationTable = await Student.getStudentLocationDetails(this.db.mysql.read, this.user.student_id);
            if (dataFromLocationTable.length > 0) {
                if (!_.isEmpty(dataFromLocationTable[0].state)) {
                    studentState = dataFromLocationTable[0].state;
                }
                if (studentState === '') {
                    lat = dataFromLocationTable[0].latitude;
                    lon = dataFromLocationTable[0].longitude;
                }
            }

            if (lat == 0 || lon == 0) {
                zeroLatLong = true;
            }

            if (dataFromLocationTable.length == 0 || zeroLatLong) {
                // const studentTableData = await Student.getStudentDataBySid(this.db.mysql.read, this.user.student_id);
                const studentTableData = await StudentContainer.getById(this.user.student_id, this.db);
                const dataFromOnboardTable = await Student.getLatLongByUdid(this.db.mysql.read, studentTableData[0].udid);
                if (dataFromOnboardTable.length > 0) {
                    lat = dataFromOnboardTable[0].latitude;
                    lon = dataFromOnboardTable[0].longitude;
                }
            }

            if (lat != 0 && lon != 0) {
                this.latLongData = {
                    lat, long: lon,
                };
                const geoCoderData = await this.getLocationWithLatLong();
                if (!_.isEmpty(geoCoderData) && !_.isEmpty(geoCoderData[0].state)) {
                    studentState = geoCoderData[0].state;
                }
            }
        }
        return studentState;
    }
}

module.exports = OnBoaridng;
