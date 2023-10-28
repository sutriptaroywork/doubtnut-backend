const _ = require('lodash');

const bluebird = require('bluebird');
const mongoose = require('mongoose');
const data = require('../../../data/data');
const ClassCourseMapping = require('../../../modules/classCourseMapping');
const ClassCourseMappingContainer = require('../../../modules/containers/ClassCourseMapping');
const StudentMongo = require('../../../modules/mongo/student');
const StudentHelper = require('../../helpers/student.helper');
const StudentMySql = require('../../../modules/mysql/student');
const OnBoaridng = require('../../helpers/onboarding');

require('../../../modules/mongo/comment');

bluebird.promisifyAll(mongoose);

async function postStudentOnboarding(req, res, next) {
    try {
        const db = req.app.get('db');

        const { type, code } = req.body;
        const { version_code: versionCode, 'x-auth-token': xAuthToken } = req.headers;
        const { locale, student_id: studentId, student_class: studentClass } = req.user;

        // for alt app storing package name
        const { package_name: packageName } = req.headers;

        const onBoaridng = new OnBoaridng(req);
        onBoaridng.returnData = {};

        let langText = 'english';
        let gotError = 0;

        await onBoaridng.topBarDataBuilder();

        let studentState = '';
        const { stateArr, stateArrHindi, stateCodeArr } = data;
        const boardShow = true;
        if ((type !== 'exam') && boardShow) {
            studentState = await onBoaridng.getStudentState();
        }

        if (type === 'class') {
            if (studentClass !== code[0]) {
                // need to trigger a SQS and pass "code[0]" as new class value in "data" part.
                onBoaridng.classChangeHistory(code[0]);
            }

            const obj = { student_class: code[0] };
            const updateStatus = await onBoaridng.dataUpdater(obj);

            if (StudentHelper.isAltApp(packageName)) {
                onBoaridng.updateAltAppBoardExam(packageName, code[0]);
                onBoaridng.returnData.is_final_submit = true;
            } else if (updateStatus) {
                let configData;
                langText = await onBoaridng.getLangText(locale);
                configData = {
                    langText, selectedClass: code[0], is_active: false, is_multi_select: false, is_submitted: true, country_code: req.user.country_code, imageShow: false,
                };
                onBoaridng.returnData.steps.push(await onBoaridng.getClassListData(configData, locale));

                if (data.middleEastCountryCodes.includes(req.user.country_code)) {
                    const userPin = await StudentMySql.getPin(db.mysql.read, req.user.mobile, false);
                    if (userPin.length === 0) {
                        StudentMySql.storePin(db.mysql.write, {
                            mobile: req.user.mobile,
                            pin: Math.round((Math.random() * (9999 - 1000)) + 1000),
                        });
                    }
                }
                const sclass = code[0];
                if (['6', '7', '8'].includes(sclass)) {
                    if (data.middleEastCountryCodes.includes(req.user.country_code)) {
                        onBoaridng.updateMiddleEastBoardExam(code[0]);
                    }
                    onBoaridng.returnData.is_final_submit = true;
                } else if (['13', '14'].includes(sclass)) {
                    configData = {
                        langText, is_active: true, is_multi_select: true, is_submitted: false, stu_class: sclass, type: 'exam', versionCode, xAuthToken, country_code: req.user.country_code, imageShow: false,
                    };
                    if (sclass == 13) {
                        configData.stu_class = 13;
                    }

                    onBoaridng.returnData.steps.push(await onBoaridng.getBoardExamListData(configData, locale));
                    onBoaridng.returnData.ask_question = true;
                    if (data.middleEastCountryCodes.includes(req.user.country_code)) {
                        onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, 'en');
                    } else {
                        onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, locale);
                    }
                } else if (['9', '10', '11', '12'].includes(sclass)) {
                    configData = {
                        langText, is_active: true, is_multi_select: false, is_submitted: false, stu_class: sclass, type: 'board', country_code: req.user.country_code, imageShow: false,
                    };

                    let boardList = await onBoaridng.getBoardExamListData(configData, locale);
                    if (studentState != '' && (stateArr.includes(studentState) || stateArrHindi.includes(studentState) || stateCodeArr.includes(studentState))) {
                        boardList = await onBoaridng.suffleBoardData(studentState, stateArr, stateArrHindi, stateCodeArr, boardList, 0);
                    }
                    onBoaridng.returnData.steps.push(boardList);

                    if (['11', '12'].includes(sclass)) {
                        // adding stream empty step
                        onBoaridng.returnData.steps.push(onBoaridng.addingEmptyStep('stream', locale));

                        // adding exam empty step
                        onBoaridng.returnData.steps.push(onBoaridng.addingEmptyStep('exam', locale));
                    } else {
                        onBoaridng.returnData.ask_question = true;
                        if (data.middleEastCountryCodes.includes(req.user.country_code)) {
                            onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, 'en');
                        } else {
                            onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, locale);
                        }
                    }
                }
            } else {
                gotError = 1;
            }
        } else if (type === 'board' || type === 'stream') {
            await onBoaridng.updateStudentCourseAndExam(code, type);

            // storing board change data in mongo
            await StudentMongo.insertIntoBoardChangeHistory(req.user.studentId, req.body.title[0], db.mongo.write, 'onboarding');

            const sclass = studentClass;
            if (locale && locale != '' && locale != null) {
                langText = await onBoaridng.getLangText(locale);
            }

            if (['9', '10'].includes(sclass)) {
                onBoaridng.returnData.is_final_submit = true;
            } else {
                let configData = {
                    selectedClass: studentClass, is_active: false, is_multi_select: false, is_submitted: true, langText, country_code: req.user.country_code, imageShow: false,
                };
                if (req.user.isDropper) {
                    configData.dropper = 1;
                } else {
                    configData.dropper = 0;
                }
                onBoaridng.returnData.steps.push(await onBoaridng.getClassListData(configData, locale));

                configData = {
                    langText, is_active: false, is_multi_select: false, is_submitted: true, stu_class: sclass, type: 'board', selectedBoard: code[0], imageShow: false, country_code: req.user.country_code,
                };

                if (type === 'stream') {
                    const studentBoardsData = await ClassCourseMapping.getStudentsExamsBoardsData(db.mysql.read, studentId, 'board');
                    if (studentBoardsData && studentBoardsData.length > 0) {
                        configData.selectedBoard = studentBoardsData[0].id;
                    }
                }

                let boardList = await onBoaridng.getBoardExamListData(configData, locale);
                if (studentState != '' && (stateArr.includes(studentState) || stateArrHindi.includes(studentState) || stateCodeArr.includes(studentState))) {
                    let selectedBoardCcm = code[0];
                    if (type === 'stream') {
                        const streamData = await ClassCourseMapping.getBoardFromCcmId(db.mysql.read, code[0]);
                        if (streamData && streamData.length > 0) {
                            selectedBoardCcm = streamData[0].parent_ccm_id;
                        }
                    }
                    boardList = await onBoaridng.suffleBoardData(studentState, stateArr, stateArrHindi, stateCodeArr, boardList, selectedBoardCcm);
                }
                onBoaridng.returnData.steps.push(boardList);

                let streamExist = false;
                if (type === 'board') {
                    const localeText = langText === 'hindi' ? langText : 'english';
                    const streamList = await ClassCourseMappingContainer.getStreamDetails(db, code[0], localeText);
                    if (streamList && streamList.length > 1) {
                        streamExist = true;
                        onBoaridng.streamList = streamList;
                        configData = {
                            type: 'stream', is_active: true, is_multi_select: false, is_submitted: false, country_code: req.user.country_code,
                        };
                        onBoaridng.returnData.steps.push(onBoaridng.getStreamDetails(configData));
                        onBoaridng.returnData.ask_question = false;

                        // adding exam empty step
                        onBoaridng.returnData.steps.push(onBoaridng.addingEmptyStep('exam', locale));
                    }
                }

                if (type === 'stream') {
                    configData = {
                        langText, is_active: false, is_multi_select: false, is_submitted: true, stu_class: sclass, type: 'stream', selectedStream: code[0], imageShow: false, country_code: req.user.country_code,
                    };

                    const streamList = await onBoaridng.getStreamListData(configData);
                    onBoaridng.returnData.steps.push(streamList);
                }

                if (!streamExist) {
                    configData = {
                        langText, is_active: true, is_multi_select: true, is_submitted: false, stu_class: sclass, type: 'exam', versionCode, xAuthToken, country_code: req.user.country_code, imageShow: false,
                    };
                    if (req.user.isDropper) {
                        configData.stu_class = 13;
                    }
                    onBoaridng.returnData.steps.push(await onBoaridng.getBoardExamListData(configData, locale));
                    onBoaridng.returnData.ask_question = true;

                    if (data.middleEastCountryCodes.includes(req.user.country_code)) {
                        onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, 'en');
                    } else {
                        onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, locale);
                    }
                }
            }
        } else if (type === 'exam') {
            await onBoaridng.updateStudentCourseAndExam(code, type);
            onBoaridng.returnData.is_final_submit = true;
        }
        if (!gotError) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: onBoaridng.returnData,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 404,
                    success: false,
                    message: 'FAILED',
                },
                data: 'Cann\'t update',
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        next(e);
    }
}

async function getStudentOnboardingResponse(req, type, code, config, versionCode) {
    const db = req.app.get('db');
    const classGrp1 = ['6', '7', '8'];
    const { student_id: studentId } = req.user;
    let { student_class: studentClass } = req.user;
    if (!_.isEmpty(studentClass)) {
        studentClass = studentClass.toString();
    }
    let { locale } = req.user;
    const { 'x-auth-token': xAuthToken } = req.headers;

    const onBoaridng = new OnBoaridng(req);
    onBoaridng.returnData = {};

    if (!_.isEmpty(req.query.langCode)) {
        // update locale into students table
        locale = req.query.langCode;
        await onBoaridng.storeLocale();
    }

    await onBoaridng.topBarDataBuilder(true);

    let langText = 'english';

    // if type is selected
    // if (type === 'class') {
    //     let langCode;
    //     let configData = {};

    //     if (langCode && langCode != '' && langCode != null) {
    //         langText = await onBoaridng.getLangText(langCode);
    //     }
    //     configData = {
    //         langText, is_active: true, is_multi_select: false, is_submitted: false, country_code: req.user.country_code, imageShow: false,
    //     };
    //     if (code != undefined) {
    //         configData.selectedClass = code;
    //     }
    //     onBoaridng.returnData.steps.push(await onBoaridng.getClassListData(configData));

    //     if (_.includes(classGrp1, code)) {
    //         onBoaridng.returnData.ask_question = true;
    //         if (data.middleEastCountryCodes.includes(req.user.country_code)) {
    //             onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, 'english');
    //         } else {
    //             onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, langText);
    //         }
    //     }

    //     stepsData = {};
    //     if (!req.user.isDropper && (['9', '10', '11', '12'].includes(code))) {
    //         stepsData = {};
    //         stepsData.type = 'board';
    //         if (langText === 'hindi' && !data.middleEastCountryCodes.includes(req.user.country_code)) {
    //             stepsData.title = data.onBoardingBoardHindiHeading;
    //         } else if (data.middleEastCountryCodes.includes(req.user.country_code)) {
    //             stepsData.title = data.onBoardingBoardOldHeading;
    //         } else {
    //             stepsData.title = data.onBoardingBoardHeading;
    //         }
    //         onBoaridng.returnData.steps.push(stepsData);
    //     }
    //     if (['11', '12', '14'].includes(code) || req.user.isDropper) {
    //         stepsData = {};
    //         stepsData.type = 'exam';
    //         if (langText === 'hindi' && !data.middleEastCountryCodes.includes(req.user.country_code)) {
    //             stepsData.title = data.onBoardingExamHindiHeading;
    //         } else if (data.middleEastCountryCodes.includes(req.user.country_code)) {
    //             stepsData.title = data.onBoardingExamOldHeading;
    //         } else {
    //             stepsData.title = data.onBoardingExamHeading;
    //         }
    //         onBoaridng.returnData.steps.push(stepsData);
    //     }
    //     return onBoaridng.returnData;
    // }

    let studentState = '';
    const { stateArr, stateArrHindi, stateCodeArr } = data;
    const boardShow = true;
    if (boardShow) {
        studentState = await onBoaridng.getStudentState();
    }

    // if (type === 'board' || type === 'stream') {
    //     const sclass = studentClass;
    //     if (locale && locale != '' && locale != null) {
    //         langText = await onBoaridng.getLangText(locale);
    //     }
    //     let configData = {
    //         selectedClass: sclass, is_active: false, is_multi_select: false, is_submitted: true, langText, country_code: req.user.country_code, imageShow: false,
    //     };

    //     if (req.user.isDropper) {
    //         configData.dropper = 1;
    //     } else {
    //         configData.dropper = 0;
    //     }
    //     onBoaridng.returnData.steps.push(await onBoaridng.getClassListData(configData));

    //     configData = {
    //         langText, is_active: true, is_multi_select: false, is_submitted: false, stu_class: sclass, type: 'board', selectedBoard: code, country_code: req.user.country_code, imageShow: false,
    //     };

    //     let boardList = await onBoaridng.getBoardExamListData(configData);
    //     if (studentState != '' && (stateArr.includes(studentState) || stateCodeArr.includes(studentState))) {
    //         boardList = await onBoaridng.suffleBoardData(studentState, stateArr, stateCodeArr, boardList, 0);
    //     }
    //     onBoaridng.returnData.steps.push(boardList);

    //     if (['9', '10'].includes(sclass)) {
    //         onBoaridng.returnData.ask_question = true;
    //         if (data.middleEastCountryCodes.includes(req.user.country_code)) {
    //             onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, 'english');
    //         } else {
    //             onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, langText);
    //         }
    //     }

    //     if (['11', '12'].includes(sclass)) {
    //         let streamExist = false;
    //         if (type === 'board') {
    //             const localeText = langText === 'hi' ? langText : 'english';
    //             const streamList = await ClassCourseMappingContainer.getStreamDetails(db, code, localeText);
    //             if (streamList && streamList.length > 0) {
    //                 streamExist = true;
    //                 onBoaridng.streamList = streamList;
    //             }
    //         }

    //         if (streamExist) {
    //             configData = {
    //                 type: 'stream', is_active: true, is_multi_select: false, is_submitted: false,
    //             };
    //             onBoaridng.returnData.ask_question = false;
    //             onBoaridng.returnData.steps.push(onBoaridng.getStreamDetails(configData));
    //         }
    //         stepsData = {};
    //         stepsData.type = 'exam';
    //         if (langText === 'hindi' && !data.middleEastCountryCodes.includes(req.user.country_code)) {
    //             stepsData.title = data.onBoardingExamHindiHeading;
    //         } else if (data.middleEastCountryCodes.includes(req.user.country_code)) {
    //             stepsData.title = data.onBoardingExamOldHeading;
    //         } else {
    //             stepsData.title = data.onBoardingExamHeading;
    //         }
    //         onBoaridng.returnData.steps.push(stepsData);
    //     }
    //     return onBoaridng.returnData;
    // }

    // if class is not selected
    // Return the class list depending on the language ---> Return the class list in English
    if (!req.user.student_class) {
        let configData = {};
        let langCode;
        if (langCode && langCode != '' && langCode != null) {
            langText = await onBoaridng.getLangText(langCode);
        }
        configData = {
            langText, is_active: true, is_multi_select: false, is_submitted: false, country_code: req.user.country_code, imageShow: false,
        };

        if (req.user.isDropper) {
            configData.dropper = 1;
        } else {
            configData.dropper = 0;
        }
        onBoaridng.returnData.steps.push(await onBoaridng.getClassListData(configData, langCode));
        return onBoaridng.returnData;
    }

    if (_.includes(classGrp1, studentClass)) {
        onBoaridng.returnData.is_final_submit = true;
        onBoaridng.returnData.ask_question = false;
        onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, 'en');
        return onBoaridng.returnData;
    }

    if (locale && locale != '' && locale != null) {
        langText = await onBoaridng.getLangText(locale);
    }
    let boardFlag = 0;

    if (!req.user.isDropper && (['9', '10', '11', '12'].includes(studentClass))) {
        const boardsData = await ClassCourseMapping.getStudentsExamsBoardsData(db.mysql.read, studentId, 'board');
        // If board is selected, return it
        if (boardsData.length > 0 && (['11', '12'].includes(studentClass))) {
            boardFlag = 1;
        } else if (boardsData.length > 0 && (['9', '10'].includes(studentClass))) {
            onBoaridng.returnData.is_final_submit = true;
            onBoaridng.returnData.ask_question = false;
            if (data.middleEastCountryCodes.includes(req.user.country_code)) {
                onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, 'en');
            } else {
                onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, locale);
            }
            return onBoaridng.returnData;
        } else {
            const sclass = studentClass;
            let configData = {
                selectedClass: sclass, is_active: false, is_multi_select: false, is_submitted: true, langText, country_code: req.user.country_code, imageShow: false,
            };

            if (req.user.isDropper) {
                configData.dropper = 1;
            } else {
                configData.dropper = 0;
            }

            onBoaridng.returnData.steps.push(await onBoaridng.getClassListData(configData, locale));

            configData = {
                langText, is_active: true, is_multi_select: false, is_submitted: false, stu_class: sclass, type: 'board', country_code: req.user.country_code, imageShow: false,
            };

            let boardList = await onBoaridng.getBoardExamListData(configData, locale);
            if (studentState != '' && (stateArr.includes(studentState) || stateArrHindi.includes(studentState) || stateCodeArr.includes(studentState))) {
                boardList = await onBoaridng.suffleBoardData(studentState, stateArr, stateArrHindi, stateCodeArr, boardList, 0);
            }
            onBoaridng.returnData.steps.push(boardList);
            if (studentClass == 11 || studentClass == 12) {
                // adding stream empty step
                onBoaridng.returnData.steps.push(onBoaridng.addingEmptyStep('stream', locale));
                // adding exam empty step
                onBoaridng.returnData.steps.push(onBoaridng.addingEmptyStep('exam', locale));
            } else if (studentClass == 9 || studentClass == 10) {
                onBoaridng.returnData.ask_question = true;
                if (data.middleEastCountryCodes.includes(req.user.country_code)) {
                    onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, 'en');
                } else {
                    onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, locale);
                }
            }
            return onBoaridng.returnData;
        }
    }

    if (req.user.isDropper || studentClass == 14 || boardFlag) {
        let checkExam = false;
        if (boardFlag) {
            let streamExist = false;
            const studentStreamData = await ClassCourseMapping.getStudentsExamsBoardsData(db.mysql.read, studentId, 'stream');
            if (studentStreamData && studentStreamData.length > 0) {
                checkExam = true;
            } else {
                const studentBoardsData = await ClassCourseMapping.getStudentsExamsBoardsData(db.mysql.read, studentId, 'board');
                if (studentBoardsData && studentBoardsData.length > 0) {
                    const localeText = langText === 'hi' ? langText : 'english';
                    const streamList = await ClassCourseMappingContainer.getStreamDetails(db, studentBoardsData[0].id, localeText);
                    if (streamList && streamList.length > 1) {
                        streamExist = true;
                        onBoaridng.streamList = streamList;
                    } else {
                        checkExam = true;
                    }
                }

                if (streamExist) {
                    const configData = {
                        type: 'stream', is_active: true, is_multi_select: false, is_submitted: false,
                    };
                    onBoaridng.returnData.ask_question = false;
                    onBoaridng.returnData.steps.push(onBoaridng.getStreamDetails(configData));

                    // adding exam empty step
                    onBoaridng.returnData.steps.push(onBoaridng.addingEmptyStep('exam', locale));
                }
            }
        } else {
            checkExam = true;
        }

        if (checkExam) {
            const examsData = await ClassCourseMapping.getStudentsExamsBoardsData(db.mysql.read, studentId, 'exam');
            // exam is selected, just return it
            if (examsData.length > 0) {
                onBoaridng.returnData.is_final_submit = true;
                onBoaridng.returnData.ask_question = false;
                if (data.middleEastCountryCodes.includes(req.user.country_code)) {
                    onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, 'en');
                } else {
                    onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, locale);
                }
                return onBoaridng.returnData;
            }
            // else return the list of exams
            let sclass = studentClass;
            if (req.user.isDropper) {
                sclass = 13;
            }
            let configData = {
                selectedClass: sclass, is_active: false, is_multi_select: false, is_submitted: true, langText, country_code: req.user.country_code, imageShow: false,
            };

            if (req.user.isDropper) {
                configData.dropper = 1;
            } else {
                configData.dropper = 0;
            }
            onBoaridng.returnData.steps.push(await onBoaridng.getClassListData(configData, locale));

            if (boardFlag) {
                const boardsData = await ClassCourseMapping.getStudentsExamsBoardsData(db.mysql.read, studentId, 'board');

                configData = {
                    langText, is_active: false, is_multi_select: false, is_submitted: true, stu_class: sclass, type: 'board', selectedBoard: boardsData[0].id, country_code: req.user.country_code, imageShow: false,
                };

                let boardList = await onBoaridng.getBoardExamListData(configData, locale);
                if (studentState != '' && (stateArr.includes(studentState) || stateArrHindi.includes(studentState) || stateCodeArr.includes(studentState))) {
                    boardList = await onBoaridng.suffleBoardData(studentState, stateArr, stateArrHindi, stateCodeArr, boardList, boardsData[0].id);
                }
                onBoaridng.returnData.steps.push(boardList);
            }
            configData = {
                langText, is_active: true, is_multi_select: true, is_submitted: false, stu_class: sclass, type: 'exam', versionCode, xAuthToken, imageShow: false,
            };

            configData.country_code = req.user.country_code;
            onBoaridng.returnData.steps.push(await onBoaridng.getBoardExamListData(configData, locale));
            onBoaridng.returnData.ask_question = true;
            if (data.middleEastCountryCodes.includes(req.user.country_code)) {
                onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, 'en');
            } else {
                onBoaridng.returnData = await onBoaridng.askButtonData(onBoaridng.returnData, locale);
            }
        }
        return onBoaridng.returnData;
    }
}

async function getStudentOnboarding(req, res, next) {
    try {
        const config = req.app.get('config');
        const { type, code } = req.query;
        const { version_code: versionCode } = req.headers;
        const returnData = await getStudentOnboardingResponse(req, type, code, config, versionCode);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: returnData,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    postStudentOnboarding,
    getStudentOnboarding,
};
