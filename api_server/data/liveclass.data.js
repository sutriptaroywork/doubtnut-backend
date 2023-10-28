const config = require('../config/config');
const { autoScrollTime } = require('./data');

module.exports = {
    paymentButtonText: 'BUY NOW',
    collapseTitle: 'About this course',
    packageDetailsInvludes: ['Live Classes & Course Videos', 'Course Notes, Assignments and Doubts'],
    packageeSubjects: 'Physics, Biology, Maths, Chemistry',
    freeClassButtonText: 'GO TO COURSE',
    resourcePageButtonText: 'GO TO CHAPTER',
    notifyButtonText: 'Notify Me',
    upgradePlanText: 'UPGRADE PLAN',
    courseImage(cdnUrl) {
        return `${cdnUrl}liveclass/course_home.png`;
    },
    allSubjectText: 'Daily Live Classes',
    subjects: 'ENGLISH | HINDI | PHYSICS | CHEMISTRY | BIOLOGY | MATHS',
    reminderCardTitle1: 'Sign up for any course',
    reminderCardTitle2: 'Pocket-friendly courses to score in 2021 board exams!',
    reminderCardButtonText: 'REMIND ME FOR CLASS',
    whatsAppShare: 'Some whatsapp Message https://doubtnut.app.link/4N5lAraap7',
    liveclassDefaultFaculty: 'Doubtnut Admin',
    liveQuizContestParams: {
        X: 1,
        Y: 2,
        Z: 3,
    },
    getLeaderBoardTitle(offset, date = null) {
        // if (offset === 0) {
        //     return 'AAJ KA LEADER BOARD';
        // }
        return `TOP 100 SCORER[${date}]`;
    },
    getContestWinnerTitle(offset, date = null) {
        // if (offset === 0) {
        //     return 'AAJ KE WINNERS';
        // }
        return `LUCKY DRAW WINNERS [${date}]`;
    },
    getCourseText(text) {
        const obj = {
            vod: 'RECORDED LECTURES',
            course: 'DAILY CLASSES',
        };
        return obj[text];
    },
    contestBanner: `${config.staticCDN}engagement_framework/AC492B4F-C875-B5A7-C13C-7F8A57C2D13A.webp`,
    getContestBanner(cdnUrl) {
        return `${cdnUrl}engagement_framework/70A78708-2899-601A-7954-D8DF9D97D9CB.webp`;
    },
    subjectColor: '#0E2B6D',
    getDescriptionByCourseId(id) {
        const obj = {
            10: '•IIT-JEE course for class 12th students\n•Regular online bilingual video lectures by faculty of VMC\n•Guidance & Mentorship provided by IITians\n•Quick doubts solving\n•In depth study material along with lecture notes\n•strategy classes Workbook and tests provided',
            11: '•IIT-JEE course for class 11th students\n•Regular online bilingual video lectures by faculty of VMC\n•Guidance & Mentorship provided by IITians\n•Quick doubts solving\n•In depth study material along with lecture notes\n•strategy classes Workbook and tests provided',
            12: '•IIT-JEE course for class 12th students\n•Regular online bilingual video lectures by faculty of VMC\n•Guidance & Mentorship provided by IITians\n•Quick doubts solving\n•In depth study material along with lecture notes\n•Strategy classes, Workbook and tests provided',
            13: '•NEET course for class 11th students\n•Regular online bilingual video lectures by faculty of VMC\n•Guidance & Mentorship provided by experts\n•Quick doubts solving\n•In depth study material along with lecture notes\n•Strategy classes, Workbook and tests provided',
            14: '•NEET course for class 12th students\n•Regular online bilingual video lectures by faculty of VMC\n•Guidance & Mentorship provided by experts\n•Quick doubts solving\n•In depth study material along with lecture notes\n•Strategy classes, Workbook and tests provided',
            19: '•IIT-JEE course for class 11th students\n•Regular online bilingual video lectures by faculty of VMC\n•Guidance & Mentorship provided by IITians\n•Quick doubts solving\n•In depth study material along with lecture notes\n•Strategy classes, Workbook and tests provided',
            26: '•IIT-JEE course for class 11th students\n•Regular online bilingual video lectures by faculty of VMC\n•Guidance & Mentorship provided by IITians\n•Quick doubts solving\n•In depth study material along with lecture notes\n•Strategy classes, Workbook and tests provided',
        };
        if (obj[id]) {
            return obj[id];
        }
        return '';
    },
    getBannerByEcm(ecmId, course, _config, caraouselObject) {
        const data = {
            13: {
                course: [
                    { image_url: `${config.staticCDN}liveclass/Jee_Daily_Banner_5.png`, deeplink: 'doubtnutapp://course_details?id=26' },
                    { image_url: `${config.staticCDN}liveclass/Jee_Daily_Banner_6.png`, deeplink: 'doubtnutapp://course_details?id=26' },
                    { image_url: `${config.staticCDN}liveclass/Jee_Daily_Banner_1.png`, deeplink: '' },
                    { image_url: `${config.staticCDN}liveclass/Jee_Daily_Banner_2.png`, deeplink: '' },
                    { image_url: `${config.staticCDN}liveclass/Jee_Daily_Banner_3.png`, deeplink: '' },
                ],
                vod: [
                    { image_url: `${config.staticCDN}liveclass/Jee_recorded_Banner_1.png`, deeplink: '' },
                    { image_url: `${config.staticCDN}liveclass/Jee_recorded_Banner_2.png`, deeplink: '' },
                    { image_url: `${config.staticCDN}liveclass/Jee_recorded_Banner_3.png`, deeplink: '' },
                ],
            },
            14: {
                course: [
                    { image_url: `${config.staticCDN}liveclass/Neet_Daily_Banner_1.png`, deeplink: '' },
                    { image_url: `${config.staticCDN}liveclass/Neet_Daily_Banner_2.png`, deeplink: '' },
                    { image_url: `${config.staticCDN}liveclass/Neet_Daily_Banner_3.png`, deeplink: '' },
                ],
                vod: [
                    { image_url: `${config.staticCDN}liveclass/Neet_Recorded_Banner_1.png`, deeplink: '' },
                    { image_url: `${config.staticCDN}liveclass/Neet_Recorded_Banner_2.png`, deeplink: '' },
                    { image_url: `${config.staticCDN}liveclass/Neet_Recorded_Banner_3.png`, deeplink: '' },
                ],
            },
            3: {
                course: [
                    { image_url: `${config.staticCDN}images/22_20200914_live_class_launch_banner.webp`, deeplink: 'doubtnutapp://course_details?id=22' },
                    { image_url: `${config.staticCDN}images/22_20200914_live_class_launch_timetable.webp`, deeplink: '' },
                ],
            },
            0: {
                course: [
                    { image_url: `${config.staticCDN}liveclass/Boards_Banner_1.png`, deeplink: '' },
                    { image_url: `${config.staticCDN}liveclass/Boards_Banner_2.png`, deeplink: '' },
                ],
            },
        };
        const obj = {
            type: caraouselObject.data_type,
            data: {
                items: data[ecmId][course],
                ratio: ecmId === 3 ? '16:9' : '14:5',
            },
        };
        if (caraouselObject.data_type === 'promo_list') {
            obj.data.auto_scroll_time_in_sec = autoScrollTime;
        }
        return obj;
    },
    getSalesBannerByEcm(paymentCardState, categoryID, course, _config, caraouselObject, id, studentID) {
        let image;
        const base64StudentId = Buffer.from(studentID.toString()).toString('base64');
        if (!paymentCardState.isTrial && !paymentCardState.expiredTrial) {
            image = `${config.staticCDN}liveclass/Jee_Sales_Try_Now.png`;
        } else {
            image = `${config.staticCDN}liveclass/Jee_Sales_Buy_Now.png`;
        }
        const payDetails = {
            page_ref: 'home',
            category_id: categoryID,
        };
        const data = {
            1: [
                {
                    image_url: image,
                    deeplink: `doubtnutapp://vip?page_type=buy&course_type=${course}&category_id=${categoryID}&payment_details=${JSON.stringify(payDetails)}`,
                },
            ],
            2: [
                {
                    image_url: `${config.staticCDN}liveclass/Contest_Banner_2.png`,
                    deeplink: 'doubtnutapp://video?qid=386637762&page=LIVECLASS_HOME',
                },
                {
                    image_url: `${config.staticCDN}liveclass/Contest_Banner_1.png`,
                    deeplink: `doubtnutapp://external_url?url=https://doubtnut.com/contest-result?student_id=${base64StudentId}`,
                },
                // {
                //     image_url: `${config.staticCDN}engagement_framework/6A732E9A-9475-D607-7297-5F0BEDDDFAF8.webp`,
                //     deeplink: '',
                // },
            ],
        };
        const obj = {
            type: caraouselObject.data_type,
            data: {
                items: data[id],
                ratio: id === 2 ? '16:9' : '9:4',
            },
        };
        if (caraouselObject.data_type === 'promo_list') {
            obj.data.auto_scroll_time_in_sec = autoScrollTime;
        }
        return obj;
    },
    fermiTencent: 'https://sqs.ap-south-1.amazonaws.com/942682721582/FERMI_TENCENT_LC',
    socketAppVersion: 778,
    videoAlltypeHandlingVersionCode: 794,
    statusMap: {
        0: 'future',
        1: 'live',
        2: 'past',
    },
    newSchemaVersionCode: 778,
    progressMe: 'Time to step up',
    progressOthers: 'Aapke dosto ne aapse zyada lectures attend kare hai',
    testIconUrl(free) {
        if (free) {
            return `${config.staticCDN}engagement_framework/E2DAC3EB-81AB-D1D3-77A1-C956B710DE05.webp`;
        }
        return `${config.staticCDN}engagement_framework/AC492255-E3BE-E698-29C1-9530A683A01C.webp`;
    },
    pdfIconUrl(free) {
        if (free) {
            return `${config.staticCDN}engagement_framework/427EC926-9359-719B-F8FD-33CDDB5D4BFB.webp`;
        }
        return `${config.staticCDN}engagement_framework/C4F24779-9BA7-0584-F1F7-B222953E0FC8.webp`;
    },
    videoIconUrl(free) {
        if (free) {
            return `${config.staticCDN}engagement_framework/0DA17F67-8D9C-602E-648D-8E4982FDD14E.webp`;
        }
        return `${config.staticCDN}engagement_framework/01BC082B-C40D-F19E-6E31-99278AD7C23B.webp`;
    },
    purchasePlansBg(free) {
        if (free) {
            return `${config.staticCDN}engagement_framework/3926AA53-D011-5912-BED7-78CF65811ADA.webp`;
        }
        return `${config.staticCDN}engagement_framework/6DBB0E64-72E0-2C94-3110-999984FD66B1.webp`;
    },
    scratchCardImage() {
        return `${config.staticCDN}engagement_framework/8B41DFFB-630E-6ADE-7E99-CB07622C16AB.webp`;
    },
    salesTimerCardImage() {
        return `${config.staticCDN}engagement_framework/CF20BE23-049E-2CEE-80CB-75F1767AB735.webp`;
    },
    salesTimerCardImage2() {
        return `${config.staticCDN}engagement_framework/D7D01961-8C64-0C9A-6773-9B3932ED33C0.webp`;
    },
    emiReminderImage(locale) {
        if (locale === 'hi') {
            return `${config.staticCDN}engagement_framework/CB6C8ADB-3B6B-77F9-BAAD-8B0281C4D8EB.webp`;
        }
        return `${config.staticCDN}engagement_framework/887FCA01-A68C-D253-8941-9D6298EC66A8.webp`;
    },
    videoWatchThreshold: 3,
    videoLeaveQueueUrl: 'https://sqs.ap-south-1.amazonaws.com/942682721582/video-leave',
    getBgImage(subject) {
        const obj = {
            physics: `${config.staticCDN}engagement_framework/65F1C900-A6C1-02EE-72D3-72BA36BE1F93.webp`,
            maths: `${config.staticCDN}engagement_framework/094FA1C2-0C6D-A8BE-F3DD-8E10D74EB0AE.webp`,
            biology: `${config.staticCDN}engagement_framework/9B437CC2-2FC2-67DC-33FA-C36484B24E5F.webp`,
            chemistry: `${config.staticCDN}engagement_framework/8A5867C6-E0C4-EABB-A0FB-A109429FE31C.webp`,
        };
        if (!obj[subject]) {
            return `${config.staticCDN}engagement_framework/097C25AB-880C-8552-0191-B31B77B6DA1A.webp`;
        }
        return obj[subject];
    },
    getBgImageForLiveCarousel(subject) {
        const obj = {
            physics: `${config.staticCDN}engagement_framework/5EF641EB-3545-EAD3-2F24-32AC07402186.webp`,
            maths: `${config.staticCDN}engagement_framework/152C1DFF-0DC6-52BD-3809-19C36C5925DD.webp`,
            biology: `${config.staticCDN}engagement_framework/B128A51A-6093-986A-B955-3A30640BB730.webp`,
            chemistry: `${config.staticCDN}engagement_framework/04299465-B3B8-4DCD-1D4C-5D984AD989CF.webp`,
            science: `${config.staticCDN}engagement_framework/2B3018C6-3713-D917-8D34-932C9BD243BD.webp`,
            'social science': `${config.staticCDN}engagement_framework/66DF8F45-FE69-71E1-0B79-B3D7A40ECF25.webp`,
            reasoning: `${config.staticCDN}engagement_framework/F0BEF98A-AB68-2F5A-EBBB-3AFD8779E22A.webp`,
            botany: `${config.staticCDN}engagement_framework/CC318456-A292-46AA-BE40-B7BC4069F9AD.webp`,
            english: `${config.staticCDN}engagement_framework/1372A484-3EF4-F831-BCCA-6AC81EB13D17.webp`,
            'english grammar': `${config.staticCDN}engagement_framework/1372A484-3EF4-F831-BCCA-6AC81EB13D17.webp`,
            'political science': `${config.staticCDN}engagement_framework/2B2ABD6C-E9B9-01D7-FA0F-DF3C56BFD91A.webp`,
            history: `${config.staticCDN}engagement_framework/1297ABB4-D163-A1D0-41B8-8E21376E38BD.webp`,
            geography: `${config.staticCDN}engagement_framework/FA091DD6-2DD2-1E5F-FADE-78D9DC343FE6.webp`,
            guidance: `${config.staticCDN}engagement_framework/5F264B82-DCCF-1EA0-F096-44DCF93D0EEE.webp`,
        };
        if (!obj[subject]) {
            return `${config.staticCDN}engagement_framework/DBA03800-0D76-0DA3-B032-721F6E3F6883.webp`;
        }
        return obj[subject];
    },
    courseThumnails: [
        `${config.staticCDN}engagement_framework/138802C0-774C-BB7B-BD3F-C6ED9ABDC755.webp`,
        `${config.staticCDN}engagement_framework/71D0890F-318A-E2A7-20FD-82A81887DF64.webp`,
        `${config.staticCDN}engagement_framework/5D8D3F76-8A04-BFA2-9A42-B5EB6564CBBA.webp`,
        `${config.staticCDN}engagement_framework/FB97E504-F747-79BA-6A90-F356C38A226C.webp`],
    categoryPriority: {
        'IIT JEE': 3,
        NEET: 4,
        'CBSE Boards': 1,
        'State Boards': 2,
        'Govt. Exams': 5,
    },
    examCategoryMapping: {
        ACT: null,
        'Andhra Pradesh Board': 'State Boards',
        'BANK PO': 'Govt. Exams',
        'BANKING AND INSURANCE': 'Govt. Exams',
        'Bihar Board': 'Bihar Board',
        BITSAT: 'IIT JEE',
        'BOARD EXAMS': 'CBSE Boards',
        CBSE: 'CBSE Boards',
        'Chhattisgarh Board': 'Chhattisgarh Board',
        DEFENCE: 'NAVY SSR & AA',
        SSC: 'SSC GD',
        'Delhi Board': 'State Boards',
        DU: 'Govt. Exams',
        ENGINEERING: 'IIT JEE',
        FOUNDATION: 'IIT JEE',
        'Civil Services': 'Civil Services',
        'Gujarat Board': 'Gujarat Board',
        'Haryana Board': 'Haryana Board',
        'Himachal Pradesh Board': 'Himachal Board',
        ICSE: 'State Boards',
        'IIT JEE': 'IIT JEE',
        'Jharkhand Board': 'Jharkhand Board',
        JNU: 'State Boards',
        'Karnataka Board': 'State Boards',
        'Kerala Board': 'State Boards',
        KVPY: 'IIT JEE',
        'Madhya Pradesh Board': 'MP Board',
        'Maharashtra Board': 'Maharashtra Board',
        NDA: 'NDA',
        NEET: 'NEET',
        'Nepal Board': 'State Boards',
        NTSE: 'IIT JEE',
        'Odisha Board': 'State Boards',
        'OTHER EXAM': 'For All',
        'Other State Board': 'State Boards',
        'Punjab Board': 'State Boards',
        RAILWAYS: 'Railways',
        'Rajasthan Board': 'Rajasthan Board',
        SAT: null,
        'SCHOOL/BOARD EXAM': 'CBSE Boards',
        'SSC CGL': 'Govt. Exams',
        'Tamil Nadu Board': 'State Boards',
        TEACHING: 'Teaching',
        'Telangana Board': 'State Boards',
        'UP Board': 'UP Board',
        UPSC: 'Govt. Exams',
        'Uttarakhand Board': 'Uttarakhand Board',
        VITEEE: 'IIT JEE',
        WBJEE: 'IIT JEE',
        'West Bengal Board': 'State Boards',
        'State Police': 'State Police',
        IT: 'IT',
        CUET: 'CUET',
    },
    testExamCategoryMapping: {
        ACT: null,
        'Andhra Pradesh Board': 'State Boards',
        'BANK PO': 'Govt. Exams',
        'BANKING AND INSURANCE': 'Govt. Exams',
        'Bihar Board': 'Bihar Board',
        BITSAT: 'IIT JEE',
        'BOARD EXAMS': 'CBSE Boards',
        CBSE: 'CBSE Boards',
        'Chhattisgarh Board': 'Chhattisgarh Board',
        DEFENCE: 'Defense',
        SSC: 'SSC GD',
        'Delhi Board': 'State Boards',
        DU: 'Govt. Exams',
        ENGINEERING: 'IIT JEE',
        FOUNDATION: 'IIT JEE',
        'Civil Services': 'Civil Services',
        'Gujarat Board': 'Gujarat Board',
        'Haryana Board': 'Haryana Board',
        'Himachal Pradesh Board': 'Himachal Board',
        ICSE: 'State Boards',
        'IIT JEE': 'IIT JEE',
        'Jharkhand Board': 'Jharkhand Board',
        JNU: 'State Boards',
        'Karnataka Board': 'State Boards',
        'Kerala Board': 'State Boards',
        KVPY: 'IIT JEE',
        'Madhya Pradesh Board': 'MP Board',
        'Maharashtra Board': 'Maharashtra Board',
        NDA: 'NDA',
        NEET: 'NEET',
        'Nepal Board': 'State Boards',
        NTSE: 'IIT JEE',
        'Odisha Board': 'State Boards',
        'OTHER EXAM': 'For All',
        'Other State Board': 'State Boards',
        'Punjab Board': 'State Boards',
        RAILWAYS: 'Railways',
        'Rajasthan Board': 'Rajasthan Board',
        SAT: null,
        'SCHOOL/BOARD EXAM': 'CBSE Boards',
        'SSC CGL': 'Govt. Exams',
        'Tamil Nadu Board': 'State Boards',
        TEACHING: 'Teaching',
        'Telangana Board': 'State Boards',
        'UP Board': 'UP Board',
        UPSC: 'Govt. Exams',
        'Uttarakhand Board': 'Uttarakhand Board',
        VITEEE: 'IIT JEE',
        WBJEE: 'IIT JEE',
        'West Bengal Board': 'State Boards',
        'State Police': 'State Police',
        IT: 'IT',
        'JEE ADVANCE': 'IIT JEE',
        'JEE ADVANCED': 'IIT JEE',
        'JEE MAIN': 'IIT JEE',
    },
    getCourseMediumByLocale: {
        HINDI: 'हिंदी माध्यम',
        ENGLISH: 'अंग्रेज़ी माध्यम',
    },
    getcategoryIcons(category, versionCode) {
        const obj = {
            'State Boards': `${config.staticCDN}engagement_framework/7150360C-D0EC-9F34-7728-E9CBAC87F644.webp`,
            'UP Board': `${config.staticCDN}engagement_framework/1CE40272-2E13-75FC-9C65-7B5773B0AC88.webp`,
            'MP Board': `${config.staticCDN}engagement_framework/A86CF0BB-A876-35C5-C8BD-F0DC92FA31E8.webp`,
            'Rajasthan Board': `${config.staticCDN}engagement_framework/52049462-81BC-51D1-0970-A0857FEE761B.webp`,
            'Jharkhand Board': `${config.staticCDN}engagement_framework/634E0200-7BD5-3BD4-06BF-0545665DB165.webp`,
            'Chattisgarh Board': `${config.staticCDN}engagement_framework/E4E363FE-1967-2702-39DF-DA4445E76D93.webp`,
            'Uttarakhand Board': `${config.staticCDN}engagement_framework/D7E168D2-998B-D7BF-1F80-7B91B49B6E77.webp`,
            'Haryana Board': `${config.staticCDN}engagement_framework/36F38227-AA18-EDC0-6D64-E65942130378.webp`,
            'Himachal Board': `${config.staticCDN}engagement_framework/C404B51A-4A66-3DDA-71ED-7C68008FBAC5.webp`,
            'Maharashtra Board': `${config.staticCDN}engagement_framework/96FF6E5D-5CF2-82B2-0E0A-BC511ABECF91.webp`,
            'Gujarat Board': `${config.staticCDN}engagement_framework/06731EE4-044F-33D7-8DB3-FE6E13680372.webp`,
            'Bihar Board': `${config.staticCDN}engagement_framework/B46371FB-2B41-FD00-3AAE-2BEB5B5DDE11.webp`,
            IT: `${config.staticCDN}images/c14_category_it.webp`,
            Defence: `${config.staticCDN}images/c14_category_defence.webp`,
            SSC: `${config.staticCDN}images/c14_category_ssc.webp`,
            Teaching: `${config.staticCDN}images/c14_category_teaching.webp`,
            'Civil Services': `${config.staticCDN}images/c14_category_civilservices.webp`,
            'For All': `${config.staticCDN}images/c14_category_all.webp`,
            Railways: `${config.staticCDN}images/c14_category_railways.webp`,
            'State Police': `${config.staticCDN}images/c14_category_statepolice.webp`,
            'Other Boards': `${config.staticCDN}engagement_framework/7150360C-D0EC-9F34-7728-E9CBAC87F644.webp`,
        };
        const newIcons = {
            'State Boards': `${config.staticCDN}engagement_framework/7150360C-D0EC-9F34-7728-E9CBAC87F644.webp`,
            'UP Board': `${config.staticCDN}engagement_framework/DE6F3A9C-FDE8-6ECD-164B-D59F12B3DAA4.webp`,
            'MP Board': `${config.staticCDN}engagement_framework/DBB01166-ECA9-AADD-55EE-6B9D2A2201D3.webp`,
            'Rajasthan Board': `${config.staticCDN}engagement_framework/C6BFBDF6-CD68-8988-CF14-9006D2273F14.webp`,
            'Jharkhand Board': `${config.staticCDN}engagement_framework/79E85E37-46D2-5E2A-7F03-EC39D54A190D.webp`,
            'Chattisgarh Board': `${config.staticCDN}engagement_framework/5E3B2B7B-3AEF-7F37-0AD8-7428B9765C3B.webp`,
            'Uttarakhand Board': `${config.staticCDN}engagement_framework/96656B57-301E-2320-29B1-17A7D517BBAA.webp`,
            'Haryana Board': `${config.staticCDN}engagement_framework/ADF0DA4A-09C0-CE94-3BD1-197CE1F8B797.webp`,
            'Himachal Board': `${config.staticCDN}engagement_framework/0C2F7F9F-5E46-7654-A9A5-6903732E1C02.webp`,
            'Maharashtra Board': `${config.staticCDN}engagement_framework/83CE700A-F57E-5632-2604-B54B10E7B196.webp`,
            'Gujarat Board': `${config.staticCDN}engagement_framework/D0B97DBB-4D30-E97C-4FCE-A3F643A6C213.webp`,
            'Bihar Board': `${config.staticCDN}engagement_framework/48D6ACDA-C858-5B1D-3403-F2FA9F65FB8C.webp`,
            IT: `${config.staticCDN}engagement_framework/ED2B39A4-5E24-0828-2C97-1FCD7D02CC3B.webp`,
            Defence: `${config.staticCDN}engagement_framework/6D6F36FD-70E0-C06A-4099-E4157651EA62.webp`,
            SSC: `${config.staticCDN}engagement_framework/5D355396-A6EE-F66B-F8CC-7D5C629E00F1.webp`,
            Teaching: `${config.staticCDN}engagement_framework/A5658B88-1F03-146A-0607-5490F0560EB6.webp`,
            'Civil Services': `${config.staticCDN}engagement_framework/663DC12E-D401-21E1-367F-E7C51FEE2789.webp`,
            'For All': `${config.staticCDN}engagement_framework/072775C0-1287-AAEC-E0BE-BF00C7320C0E.webp`,
            Railways: `${config.staticCDN}engagement_framework/078B5398-6B1D-6753-7F9D-0AAD93D23ED7.webp`,
            'State Police': `${config.staticCDN}engagement_framework/123C76E7-ACDA-2A99-BF91-C0A7BA80507A.webp`,
            NDA: `${config.staticCDN}engagement_framework/343932A9-5E32-4123-742C-3F2CFB0BE3A3.webp`,
            'IIT JEE': `${config.staticCDN}engagement_framework/19A7B223-244D-A780-65DF-7ED6018C81BE.webp`,
            NEET: `${config.staticCDN}engagement_framework/7123A15D-A3F7-7718-0EBE-18A806944933.webp`,
            'CBSE Boards': `${config.staticCDN}engagement_framework/A92B998A-BE30-9EB0-4C67-5790509D23B5.webp`,
            'CBSE Board': `${config.staticCDN}engagement_framework/A92B998A-BE30-9EB0-4C67-5790509D23B5.webp`,
            'Kota Classes': `${config.staticCDN}engagement_framework/5869509F-22AA-AF7A-F579-9891E9AAE23F.webp`,
            'Other Boards': `${config.staticCDN}engagement_framework/0A587375-F3B1-FCBD-D195-DEC98811CC5F.webp`,
            'Spoken English': `${config.staticCDN}engagement_framework/5071407E-F4DD-8418-9005-911FB9598512.webp`,
        };
        return versionCode > 934 ? newIcons[category] || `${config.staticCDN}engagement_framework/798806B1-0E7C-B5FC-D241-F6FBA613E406.webp` : obj[category] || `${config.staticCDN}engagement_framework/7150360C-D0EC-9F34-7728-E9CBAC87F644.webp`;
    },
    referralBannerEn: `${config.staticCDN}engagement_framework/44F1556D-8745-A422-E5AB-9B30D3950369.webp`,
    referralBannerHi: `${config.staticCDN}engagement_framework/15506A12-C4CB-49AA-01D7-074C18FB24A1.webp`,
    referralBanner: `${config.staticCDN}engagement_framework/refer.webp`,
    referralDiscountBannerHome: `${config.staticCDN}engagement_framework/referral_discount.webp`,
    referralDiscountBannerHomeDeeplink: 'doubtnutapp://course_details?id=xxxx',
    referralDiscountBannerHomeVideoLink: `${config.staticCDN}referral-video/special-offer-480.mp4`,
    referralInstallDiscountBannerHome: `${config.staticCDN}engagement_framework/referral_doubts_100.webp`,
    campaignHoliBanner: `${config.staticCDN}engagement_framework/A1DD4A96-395A-CB31-EA6A-6C980062C971.webp`,
    getShareMessageFree(courseDetail, locale) {
        if (locale === 'HINDI') {
            const str = `मैं तो *${courseDetail}* की पढाई यहीं से कर रहा हूँ, यहाँ *डेली क्लास, डाउट सलूशन, टेस्ट सिरीज़* और बहुत कुछ है! 🤩\nआज ही इस कोर्स का हिस्सा बनें!⬇️ \nलिंक - `;
            return str;
        }
        const str = `Main toh *${courseDetail}* ki padhai yahin se kar raha hoon, yahan *DAILY CLASS , DOUBT SOLUTION ,TEST SERIES* aur bahut kuch hai! 🤩\nAaj hi iss Course ka hissa banein! ⬇️ \nLink - `;
        return str;
    },
    getShareMessagePaid(courseDetail, locale) {
        if (locale === 'HINDI') {
            const str = `मैं तो *${courseDetail}* की पढ़ाई यहीं से कर रहा हूँ, यहाँ *डेली क्लास, डाउट सलूशन, टेस्ट सिरीज़* और बहुत कुछ है! 🤩 तुम भी लो आज ही ये कोर्सI \nइस लिंक⬇️ से अभी खरीदो और पाओ *₹500/ -* की छूट तुरंतl \nलिंक -`;
            return str;
        }
        const str = `Main toh *${courseDetail}* ki padhai yahin se kar raha hoon, yahan *DAILY CLASS , DOUBT SOLUTION ,TEST SERIES* aur bahut kuch hai! 🤩 Tum bhi lo aaj hi ye course.\nIss link ⬇️ se abhi khareedo aur pao *₹500/ -* ka discount turant. \nLink -`;
        return str;
    },
    adsArray1: ['1', '0', '1', '0'],
    adsArray2: ['0', '1', '0', '1'],
    adsArray3: ['0', '1', '1'],
    adsArray4: ['0', '0', '1', '1'],
    adsArray5: ['1', '0', '0'],
    adsArray6: ['0', '0'],
    adsArray7: ['0', '1', '0', '1', '0', '0', '1', '0', '0', '1', '0', '0', '0', '1', '0', '0', '0', '1', '0', '0', '0', '0', '1', '0', '0', '0', '0', '1'],
    dailyAdsLimit: 2,
    IdCourseCardsMapping: {
        1: 'faq',
        2: 'recent',
        3: 'notes',
        4: 'homework',
        5: 'books',
        6: 'test',
        7: 'prev_years',
        8: 'upcoming',
    },
    coursePageSubjectBackground: {
        GUIDANCE: `${config.staticCDN}engagement_framework/C83D1748-9F4E-C43B-7A2D-8F225ADAB76D.webp`,
        REASONING: `${config.staticCDN}engagement_framework/D13F180F-D97D-B704-0443-27480C7F192A.webp`,
        CHEMISTRY: `${config.staticCDN}engagement_framework/0B7115F0-A47A-55EA-0091-1266BCAC5663.webp`,
        BIOLOGY: `${config.staticCDN}engagement_framework/1818FF85-4601-A33B-D250-06843A675746.webp`,
        ENGLISH: `${config.staticCDN}engagement_framework/D7D20F29-ACED-7F7D-97D9-723494C20E8C.webp`,
        MATHS: `${config.staticCDN}engagement_framework/FFCC7503-0C6A-E85C-FFDB-05C307FA7C24.webp`,
        MATHEMATICS: `${config.staticCDN}engagement_framework/FFCC7503-0C6A-E85C-FFDB-05C307FA7C24.webp`,
        SCIENCE: `${config.staticCDN}engagement_framework/3628F583-EB18-8468-C6FE-E424B998FE3B.webp`,
        PHYSICS: `${config.staticCDN}engagement_framework/EFC6FB84-158F-EB33-6D25-9345AB8770FE.webp`,
        SOCIAL: `${config.staticCDN}engagement_framework/858A340C-FF9E-D0C1-B7B4-F1A90B9E2A3E.webp`,
        ECONOMICS: `${config.staticCDN}engagement_framework/858A340C-FF9E-D0C1-B7B4-F1A90B9E2A3E.webp`,
        AGRICULTURE: `${config.staticCDN}engagement_framework/4C668CF5-CB51-15FC-7D05-3BE6A1E9C23B.webp}`,
        EDUCATION: `${config.staticCDN}engagement_framework/C83D1748-9F4E-C43B-7A2D-8F225ADAB76D.webp`,
        HISTORY: `${config.staticCDN}engagement_framework/858A340C-FF9E-D0C1-B7B4-F1A90B9E2A3E.webp`,
        GEOGRAPHY: `${config.staticCDN}engagement_framework/858A340C-FF9E-D0C1-B7B4-F1A90B9E2A3E.webp`,
        BOTANY: `${config.staticCDN}engagement_framework/4C668CF5-CB51-15FC-7D05-3BE6A1E9C23B.webp}`,
        POLITY: `${config.staticCDN}engagement_framework/0B7115F0-A47A-55EA-0091-1266BCAC5663.webp`,
        COMPUTER: `${config.staticCDN}engagement_framework/4C668CF5-CB51-15FC-7D05-3BE6A1E9C23B.webp`,
        HINDI: `${config.staticCDN}engagement_framework/1818FF85-4601-A33B-D250-06843A675746.webp`,
        'ENGLISH GRAMMAR': `${config.staticCDN}engagement_framework/D7D20F29-ACED-7F7D-97D9-723494C20E8C.webp`,
        'SOCIAL SCIENCE': `${config.staticCDN}engagement_framework/858A340C-FF9E-D0C1-B7B4-F1A90B9E2A3E.webp`,
        'GENERAL SCIENCE': `${config.staticCDN}engagement_framework/3214A261-A340-83E7-50A9-CC58C2738052.webp`,
        'GENERAL KNOWLEDGE': `${config.staticCDN}engagement_framework/413785B8-EB45-41EC-B63A-CCF74957A07D.webp`,
        'STATIC GK': `${config.staticCDN}engagement_framework/413785B8-EB45-41EC-B63A-CCF74957A07D.webp`,
        'ENVIRONMENTAL STUDIES': `${config.staticCDN}engagement_framework/0351D987-960D-4570-011F-F74D8865A426.webp`,
        'ENVIRONMENT STUDIES': `${config.staticCDN}engagement_framework/0351D987-960D-4570-011F-F74D8865A426.webp`,
        'GENERAL POLITY': `${config.staticCDN}engagement_framework/0B7115F0-A47A-55EA-0091-1266BCAC5663.webp`,
        'TECHNICAL MATHS': `${config.staticCDN}engagement_framework/FFCC7503-0C6A-E85C-FFDB-05C307FA7C24.webp`,
        'ARITHMETIC MATH': `${config.staticCDN}engagement_framework/FFCC7503-0C6A-E85C-FFDB-05C307FA7C24.webp`,
        'CHILD DEVELOPMENT AND PEDAGOGY': `${config.staticCDN}engagement_framework/DDD8E321-3906-4FAE-99D0-B33D869F5BD9.webp`,
        ALL: `${config.staticCDN}engagement_framework/413785B8-EB45-41EC-B63A-CCF74957A07D.webp`,
    },
    defaultThumbnailsForBooks: {
        GUIDANCE: `${config.staticCDN}engagement_framework/25602509-A5F3-D0D4-B688-836ADEFCFC8A.webp`,
        REASONING: `${config.staticCDN}engagement_framework/CC3DEDF2-ECB0-52F2-8012-F95E09468EC3.webp`,
        CHEMISTRY: `${config.staticCDN}engagement_framework/5E35F3BA-21EC-63FC-EEE9-E00F5A374B95.webp`,
        BIOLOGY: `${config.staticCDN}engagement_framework/9A64856A-CC1D-14B2-8F75-0FAF305DE469.webp`,
        ENGLISH: `${config.staticCDN}engagement_framework/B48377D5-BCC9-A467-E865-F541517B0AC1.webp`,
        MATHS: `${config.staticCDN}engagement_framework/D9448A41-694E-884C-4A41-57DDF92917E8.webp`,
        MATHEMATICS: `${config.staticCDN}engagement_framework/D9448A41-694E-884C-4A41-57DDF92917E8.webp`,
        SCIENCE: `${config.staticCDN}engagement_framework/5A0FCF7B-F653-4FDE-6C92-C7EF0207014D.webp`,
        PHYSICS: `${config.staticCDN}engagement_framework/755C6EA4-766B-C0A7-DE06-E64025589300.webp`,
        SOCIAL: `${config.staticCDN}engagement_framework/620AB3C0-7D22-22A8-E63A-986091F451B2.webp`,
        ECONOMICS: `${config.staticCDN}engagement_framework/620AB3C0-7D22-22A8-E63A-986091F451B2.webp`,
        AGRICULTURE: `${config.staticCDN}engagement_framework/8D57AD1B-A3D4-8498-31DE-611FC4BE6661.webp`,
        EDUCATION: `${config.staticCDN}engagement_framework/25602509-A5F3-D0D4-B688-836ADEFCFC8A.webp`,
        HISTORY: `${config.staticCDN}engagement_framework/620AB3C0-7D22-22A8-E63A-986091F451B2.webp`,
        GEOGRAPHY: `${config.staticCDN}engagement_framework/620AB3C0-7D22-22A8-E63A-986091F451B2.webp`,
        BOTANY: `${config.staticCDN}engagement_framework/8D57AD1B-A3D4-8498-31DE-611FC4BE6661.webp`,
        POLITY: `${config.staticCDN}engagement_framework/5E35F3BA-21EC-63FC-EEE9-E00F5A374B95.webp`,
        COMPUTER: `${config.staticCDN}engagement_framework/8D57AD1B-A3D4-8498-31DE-611FC4BE6661.webp`,
        HINDI: `${config.staticCDN}engagement_framework/9A64856A-CC1D-14B2-8F75-0FAF305DE469.webp`,
        'ENGLISH GRAMMAR': `${config.staticCDN}engagement_framework/B48377D5-BCC9-A467-E865-F541517B0AC1.webp`,
        'SOCIAL SCIENCE': `${config.staticCDN}engagement_framework/620AB3C0-7D22-22A8-E63A-986091F451B2.webp`,
        'GENERAL SCIENCE': `${config.staticCDN}engagement_framework/B773A31C-BB3C-6941-EB24-49083EF1BD0D.webp`,
        'GENERAL KNOWLEDGE': `${config.staticCDN}engagement_framework/CE5A43E2-4B57-81E3-5611-EEC91C785260.webp`,
        'STATIC GK': `${config.staticCDN}engagement_framework/CE5A43E2-4B57-81E3-5611-EEC91C785260.webp`,
        'ENVIRONMENTAL STUDIES': `${config.staticCDN}engagement_framework/733D0CCE-91C4-C154-832E-F3C962B6CA33.webp`,
        'ENVIRONMENT STUDIES': `${config.staticCDN}engagement_framework/733D0CCE-91C4-C154-832E-F3C962B6CA33.webp`,
        'GENERAL POLITY': `${config.staticCDN}engagement_framework/0B7115F0-A47A-55EA-0091-1266BCAC5663.webp`,
        'TECHNICAL MATHS': `${config.staticCDN}engagement_framework/D9448A41-694E-884C-4A41-57DDF92917E8.webp`,
        'ARITHMETIC MATH': `${config.staticCDN}engagement_framework/D9448A41-694E-884C-4A41-57DDF92917E8.webp`,
        'CHILD DEVELOPMENT AND PEDAGOGY': `${config.staticCDN}engagement_framework/78FA6150-202B-E34D-81E6-1BD34ABED21F.webp`,
        ALL: `${config.staticCDN}engagement_framework/CE5A43E2-4B57-81E3-5611-EEC91C785260.webp`,
    },
    exampurAssortmentBanners: {
        113299: { en: 358, hi: 359 },
        113284: { en: 360, hi: 361 },
        113285: { en: 362, hi: 363 },
        113286: { en: 364, hi: 365 },
        113288: { en: 366, hi: 367 },
        113289: { en: 368, hi: 369 },
        113290: { en: 370, hi: 371 },
        113291: { en: 372, hi: 373 },
        113294: { en: 374, hi: 375 },
        113296: { en: 376, hi: 377 },
        113297: { en: 378, hi: 379 },
        113298: { en: 380, hi: 381 },
    },
    monthArr: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthArrHi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
    week: ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'],
    notesFilterHindi: {
        All: 'सभी नोट्स',
        'Types of Notes': 'नोट्स के प्रकार',
        Homework: 'होमवर्क',
        'Lecture Notes': 'लेक्चर नोट्स',
        Module: 'बुकलेट',
        Notes: 'नोट्स',
        Practice: 'अभ्यास',
        'Reference Books': 'अतिरक्त पाठ्य पुस्तिकायें',
        'Teacher Notes': 'टीचर नोट्स',
        'Teacher Slides': 'टीचर स्लाइड्स',
        Theory: 'सिद्धांत',
        Workbook: 'वर्कबुक',
    },
    completedText(locale) {
        return locale === 'hi' ? 'पूरा हुआ' : 'Completed';
    },
    pendingText(locale) {
        return locale === 'hi' ? 'बचा है' : 'Pending';
    },
    englishHindiExamMapping: {
        SSC: ['SSC', 'SSC (कर्मचारी चयन आयोग)'],
        TEACHING: ['TEACHING', 'टीचिंग'],
        RAILWAYS: ['RAILWAYS', 'रेलवे'],
        'STATE POLICE': ['STATE POLICE', 'स्टेट पुलिस'],
        DEFENCE: ['DEFENCE', 'डिफेन्स'],
        'IT + OTHERS': ['IT + OTHERS', 'आई.टी. + अन्य'],
        'CIVIL SERVICES': ['CIVIL SERVICES', 'सिविल सर्विसेज़'],
    },
    localeMapping: {
        hi: 'HINDI',
        en: 'ENGLISH',
    },
    subjectLocaleMapping: {
        BIOLOGY: {
            hi: 'जीव विज्ञान',
        },
        CHEMISTRY: {
            hi: 'रसायन विज्ञान',
        },
        'CHILD DEVELOPMENT AND PED': {
            hi: 'बालविकास एवं शिक्षा मनोविज्ञान',
        },
        ENGLISH: {
            hi: 'अंग्रेज़ी',
        },
        'ENGLISH GRAMMAR': {
            hi: 'अंगेज़ी (व्याकरण)',
        },
        'ENGLISH(UP BOARD)': {
            hi: 'अंग्रेज़ी (यू.पी. बोर्ड)',
        },
        'ENVIRONMENTAL STUDIES': {
            hi: 'वातावरण अध्ययन',
        },
        'GENERAL SCIENCE': {
            hi: 'सामान्य विज्ञान',
        },
        MATHS: {
            hi: 'गणित',
        },
        PHYSICS: {
            hi: 'भौतिक विज्ञान',
        },
        'PHYSICS - GS': {
            hi: 'भौतिक विज्ञान - GS',
        },
        'PHYSICS - SY': {
            hi: 'भौतिक विज्ञान - SY',
        },
        REASONING: {
            hi: 'तर्क',
        },
        SCIENCE: {
            hi: 'विज्ञान',
        },
        'SOCIAL SCIENCE': {
            hi: 'सामाजिक विज्ञान',
        },
    },
    referralPaytmCourseDetailsBanner: `${config.staticCDN}engagement_framework/paytm_referral_image_rectangle.webp`,
    referralPaytmHomePageBanner: `${config.staticCDN}engagement_framework/paytm_referral_home_page_new.webp`,
    englishMediumTeachingDetails: [
        'Teachers will teach in: Hinglish',
        'Teachers will write in: English',
        'Notes will be in: English',
        'Reference Books will be in: Hinglish',
        'Homework will be in: English',
    ],
    hindiMediumTeachingDetails: [
        'Teachers will teach in: Hinglish',
        'Teachers will write in: Hindi',
        'Notes will be in: Hindi',
        'Reference Books will be in: Hinglish',
        'Homework will be in: Hindi',
    ],
    topSellingSubjectIcons(subject) {
        const obj = {
            MATHS: `${config.cdn_url}engagement_framework/B1F6833A-206B-C036-FCE9-49036E85E005.webp`,
            PHYSICS: `${config.cdn_url}engagement_framework/B5440B60-92A2-FE01-5461-6A619C81F89A.webp`,
            CHEMISTRY: `${config.cdn_url}engagement_framework/D2B83FE6-F53F-02D0-9A49-1889859A7413.webp`,
            BIOLOGY: `${config.cdn_url}engagement_framework/2AB492DE-A223-D5D0-7D97-DEA98848EB20.webp`,
            ENGLISH: `${config.cdn_url}engagement_framework/23921DF3-1666-21C1-6168-50B37AB615C3.webp`,
            'ENGLISH GRAMMAR': `${config.cdn_url}engagement_framework/844CDF5E-CD11-1D82-8361-78CE2D662F1C.webp`,
            'POLITICAL SCIENCE': `${config.cdn_url}engagement_framework/2A7E7C50-E45F-816A-33E0-1B26D4643C98.webp`,
            'GENERAL KNOWLEDGE': `${config.cdn_url}engagement_framework/C9B78F30-E8D8-FD34-3B2E-250C77DDF3D7.webp`,
            GEOGRAPHY: `${config.cdn_url}engagement_framework/5622B832-981F-8AA7-DB75-82BAE7A1458A.webp`,
            BOTANY: `${config.cdn_url}engagement_framework/6699097C-3C02-185A-C4B2-D175808C04A7.webp`,
            SCIENCE: `${config.cdn_url}engagement_framework/41E7D0F0-EBAB-0F78-0DCC-E897C9530A77.webp`,
            'SOCIAL SCIENCE': `${config.cdn_url}engagement_framework/666C7E8E-DE85-C098-7EA9-25908AB71316.webp`,
        };
        return obj[subject] || `${config.cdn_url}engagement_framework/1F043ABC-7EC5-9249-08AF-E541802989CF.webp`;
    },
    topSellingSubjectDisabledIcons(subject) {
        const obj = {
            MATHS: `${config.cdn_url}engagement_framework/maths_grey.webp`,
            PHYSICS: `${config.cdn_url}engagement_framework/physics_grey.webp`,
            CHEMISTRY: `${config.cdn_url}engagement_framework/chemistry_grey.webp`,
            BIOLOGY: `${config.cdn_url}engagement_framework/biology_grey.webp`,
            ENGLISH: `${config.cdn_url}engagement_framework/english_grey.webp`,
            'ENGLISH GRAMMAR': `${config.cdn_url}engagement_framework/english_grammar_grey.webp`,
            'POLITICAL SCIENCE': `${config.cdn_url}engagement_framewok/political_science_grey.webp`,
            'GENERAL KNOWLEDGE': `${config.cdn_url}engagement_framework/general_knowledge_grey.webp`,
            GEOGRAPHY: `${config.cdn_url}engagement_framework/geography_grey.webp`,
            BOTANY: `${config.cdn_url}engagement_framework/botany_grey.webp`,
            SCIENCE: `${config.cdn_url}engagement_framework/science_grey.webp`,
            'SOCIAL SCIENCE': `${config.cdn_url}engagement_framework/social_science_grey.webp`,
        };
        return obj[subject] || `${config.cdn_url}engagement_framework/fallback_grey.webp`;
    },
    popularCoursesCardColors(i) {
        const arr = ['#FFBE99', '#99C8FF', '#C791FF', '#F68B57', '#FF7282', '#05C789', '#EDD247', '#4CA4E3', '#C9FFC5', '#CF7D4A'];
        return arr[i % 10];
    },
    widgetAutoplayColors(subject) {
        const mapping = {
            maths: { bg: '#D5EDFF', tag: '#4CA4E3' },
            physics: { bg: '#DFCCFF', tag: '#854CE3' },
            biology: { bg: '#DAFFF2', tag: '#2DCA91' },
            chemistry: { bg: '#FCCBBC', tag: '#F3754D' },
            science: { bg: '#C7F7F3', tag: '#066666' },
            english: { bg: '#FDCCFF', tag: '#9F4DA2' },
            'social science': { bg: '#B0D2FF', tag: '#1C57A5' },
            'english grammar': { bg: '#FFD5C0', tag: '#F68B57' },
            'general science': { bg: '#FFEDD2', tag: '#583D13' },
            computer: { bg: '#FFEFB7', tag: '#FFD747' },
            reasoning: { bg: '#FCB4FF', tag: '#720F76' },
            geography: { bg: '#98D2FF', tag: '#4796D3' },
            'general awareness': { bg: '#FCAAFF', tag: '#8B0090' },
            'political science': { bg: '#FF9898', tag: '#C71F1F' },
            pollity: { bg: '#FF9898', tag: '#C71F1F' },
            history: { bg: '#9E8968', tag: '#583D13' },
            economics: { bg: '#FFB88C', tag: '#CF7D4A' },
            sst: { bg: '#B0D2FF', tag: '#1C57A5' },
        };
        if (typeof mapping[subject] === 'undefined') {
            return { bg: '#E5E5E5', tag: '#797979' };
        }
        return mapping[subject];
    },
    bgImageLiveTrending(subject) {
        const mapping = {
            MATHS: `${config.cdn_url}engagement_framework/5FBCEFF9-3947-C290-F3D3-4375BD2CEE8C.webp`,
            SCIENCE: `${config.cdn_url}engagement_framework/4E23EC63-2BFB-A8E2-3101-68193E98390A.webp`,
            ENGLISH: `${config.cdn_url}engagement_framework/560D60D0-B2D0-ADD4-3B75-43A1B6238E8C.webp`,
            'SOCIAL SCIENCE': `${config.cdn_url}engagement_framework/2EE2C432-952D-053D-B7CA-D78AB1454038.webp`,
            'ENGLISH GRAMMAR': `${config.cdn_url}engagement_framework/B5883A81-FD6E-C8FE-5640-F1AAADCF1AF9.webp`,
            PHYSICS: `${config.cdn_url}engagement_framework/4B7CFAE9-959F-2DEC-3804-F38C38416C0C.webp`,
            CHEMISTRY: `${config.cdn_url}engagement_framework/37A99B6D-0785-05C2-1765-39FE02B3B071.webp`,
            BIOLOGY: `${config.cdn_url}engagement_framework/607CF935-5E35-EF85-6D81-7324DFEA6FA8.webp`,
            REASONING: `${config.cdn_url}engagement_framework/16187F52-37A5-1D48-85C7-74AA7EE37414.webp`,
            POLITY: `${config.cdn_url}engagement_framework/FCE4E99F-CDE2-44EA-EB6C-8FE02B98FF2D.webp`,
            HISTORY: `${config.cdn_url}engagement_framework/9682EB31-D9EB-0C79-E629-702786771825.webp`,
            GEOGRAPHY: `${config.cdn_url}engagement_framework/488A628F-AF8D-7AE9-321C-AE46C2947E6C.webp`,
            ECONOMICS: `${config.cdn_url}engagement_framework/FEE8FA40-218B-9A70-419B-6FF2BA3DB406.webp`,
        };
        if (typeof mapping[subject] === 'undefined') {
            return `${config.cdn_url}engagement_framework/ACDE98B7-A8B7-3D19-B85A-108646B6CF87.webp`;
        }
        return mapping[subject];
    },
    newClpPdf: `${config.cdn_url}engagement_framework/3B08ACFA-3E6F-6840-090A-539ECAD8D154.webp`,
    newClpMock: `${config.cdn_url}engagement_framework/8F6B6028-491D-61E4-EEFE-303358E246E7.webp`,
    newClpClasses: `${config.cdn_url}engagement_framework/436839A1-A9D1-A8F0-2841-A92550F5083B.webp`,
};
