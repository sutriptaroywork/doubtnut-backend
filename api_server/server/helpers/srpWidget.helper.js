// Installed packages
const _ = require('lodash');
const moment = require('moment');
const md5 = require('md5');

// Data file
const StaticData = require('../../data/data');

// Sql file
const LiveClassMySql = require('../../modules/mysql/liveclass');
const LiveClassContainer = require('../../modules/containers/liveclass');
const ClassCourseMapping = require('../../modules/classCourseMapping');
const CourseMysqlv2 = require('../../modules/mysql/coursev2');
const Question = require('../../modules/question');
const ClassCourseMappingContainer = require('../../modules/containers/ClassCourseMapping');

// Redis file
const QuestionRedis = require('../../modules/redis/question');

// DB containers
const iconsContainer = require('../../modules/containers/icons');

// Helper file
const freeClassHelper = require('./freeLiveClass');
const LiveClassHelper = require('./liveclass');
const CourseHelper = require('./course');
const CourseWidgetHelper = require('../widgets/course');
const WidgetHelper = require('../widgets/liveclass');
const CourseV2 = require('../../modules/containers/coursev2');
const AnswerHelper = require('./answer');
const SortingManager = require('./sorting.helper');
const IconsHelper = require('./icons');
const LiveclassHelperLocal = require('../v6/course/course.helper');

// utility file
const Utility = require('../../modules/utility');
const AnswerContainerv13 = require('../v13/answer/answer.container');

class SrpWidgetManager {
    constructor(request) {
        this.req = request;
        this.config = request.app.get('config');
        this.db = request.app.get('db');
        this.elasticSearchUserQuestionsInstance = request.app.get('elasticSearchUserQuestionsInstance');
        this.query = request.query;
        this.user = request.user;
        this.locale = request.user.locale;
        this.studentId = request.user.student_id;
        this.studentClass = request.user.student_class;
        this.versionCode = request.headers.version_code;
        this.xAuthToken = request.headers['x-auth-token'];
        this.pznElasticSearchInstance = request.app.get('pznElasticSearchInstance');
        this.config = request.app.get('config');
        this.settings = {
            backgroundColor: '#ffffff',
            borderColor: '#cbcbcb',
            cornerRadius: '2.0',
            borderWidth: 1,
            topIconHeight: 42,
            topIconWidth: 42,
            topIconSmallHeight: 30,
            topIconSmallWidth: 30,
            layoutConfigParent: {
                margin_top: 15,
                margin_bottom: 15,
                margin_left: 5,
                margin_right: 5,
            },
            layoutConfigZero: {
                margin_top: 0,
                margin_bottom: 0,
                margin_left: 0,
                margin_right: 0,
            },
            subjectCard: {
                type: 'widget_srp_nudge',
                parentType: 'widget_parent',
                headingOne: {
                    en: 'Best seller',
                    hi: 'लोकप्रिय',
                },
                titleColor: '#000000',
                backgroundColor: '#a9cbff',
                cornerRadius: 4.0,
                deeplinkPrefix: 'doubtnutapp://course_details?id=',
                deeplinkKota: 'doubtnutapp://course_category?category_id=Kota%20Classes',
                cta: {
                    titleColor: '#ffffff',
                    backgroundColor: '#ea532c',
                },
                layoutConfigItem: {
                    margin_top: 0,
                    margin_bottom: 12,
                    margin_left: 13,
                    margin_right: 13,
                },
            },
        };
        this.flagrVariantsArr = request.headers.flagr_variation_ids;
        this.title = {};
        this.sub_title = {};
        this.image = {};
    }

    putAdditionalStaticData(type) {
        if (type === 'FreeLive') {
            if (this.flagrFlow === 1 || this.flagrFlow === 2 || this.flagrFlow === 3) {
                switch (this.flow) {
                    case 'case 1':
                        this.title.free_live = this.user.locale === 'hi' ? StaticData.askWidget.FreeLive.title.hi : StaticData.askWidget.FreeLive.title.en;
                        this.sub_title.free_live = '';
                        this.image.free_live = `${this.config.staticCDN}${StaticData.askWidget.images.playFilm}`;
                        break;
                    case 'case 2':
                        this.title.free_live = this.user.locale === 'hi' ? StaticData.askWidget.FreeLive.title.hi : StaticData.askWidget.FreeLive.title.en;
                        this.sub_title.free_live = '';
                        this.image.free_live = `${this.config.staticCDN}${StaticData.askWidget.images.playFilm}`;
                        break;
                    case 'case 3':
                        this.title.free_live = this.user.locale === 'hi' ? StaticData.askWidget.FreeLive.title.hi : StaticData.askWidget.FreeLive.title.en;
                        this.sub_title.free_live = '';
                        this.image.free_live = `${this.config.staticCDN}${StaticData.askWidget.images.playFilm}`;
                        break;
                    case 'case 4':
                        this.title.free_live = this.user.locale === 'hi' ? StaticData.askWidget.FreeLive.title.hi : StaticData.askWidget.FreeLive.title.en;
                        this.sub_title.free_live = '';
                        this.image.free_live = `${this.config.staticCDN}${StaticData.askWidget.images.playFilm}`;
                        break;
                    default:
                        this.title.free_live = '';
                        this.sub_title.free_live = '';
                        this.image.free_live = '';
                }
            }
        } else if (type === 'SubjectCard') {
            let title = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.title.hi : StaticData.askWidget.SubjectCard.title.en;
            let subTitle = '';
            if (this.chapter == undefined || this.subject == undefined) {
                title = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.title_3.hi : StaticData.askWidget.SubjectCard.title_3.en;
                subTitle = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.title_3.hi : StaticData.askWidget.SubjectCard.title_3.en;
            } else {
                title = _.replace(title, /xxxchapterxxx/g, this.chapter);
                title = _.replace(title, /xxxsubjectxxx/g, this.subject);
            }
            if (this.flagrFlow === 1) {
                switch (this.flow) {
                    case 'case 1':
                        if (this.totalSession % 6 === 1 || this.totalSession % 6 === 3 || this.totalSession % 6 === 0) {
                            this.title.subject_card = title;
                            this.sub_title.subject_card = subTitle;
                            this.image.subject_card = `${this.config.staticCDN}${StaticData.askWidget.images.brainBook}`;
                        } else if (this.totalSession % 6 === 2 || this.totalSession % 6 === 4) {
                            this.title.subject_card = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.title_3.hi : StaticData.askWidget.SubjectCard.title_3.en;
                            this.sub_title.subject_card = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.sub_title.hi : StaticData.askWidget.SubjectCard.sub_title.en;
                            this.image.subject_card = `${this.config.staticCDN}${StaticData.askWidget.images.thinkingFace}`;
                        }
                        break;
                    case 'case 2':
                        if (this.totalSession % 4 === 1 || this.totalSession % 4 === 2 || this.totalSession % 4 === 0) {
                            this.title.subject_card = title;
                            this.sub_title.subject_card = subTitle;
                            this.image.subject_card = `${this.config.staticCDN}${StaticData.askWidget.images.brainBook}`;
                        } else if (this.totalSession % 4 === 3) {
                            this.title.subject_card = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.title_3.hi : StaticData.askWidget.SubjectCard.title_3.en;
                            this.sub_title.subject_card = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.sub_title.hi : StaticData.askWidget.SubjectCard.sub_title.en;
                            this.image.subject_card = `${this.config.staticCDN}${StaticData.askWidget.images.thinkingFace}`;
                        }
                        break;
                    case 'case 3':
                        if (this.totalSession % 6 === 1 || this.totalSession % 6 === 3 || this.totalSession % 6 === 0) {
                            this.title.subject_card = title;
                            this.sub_title.subject_card = subTitle;
                            this.image.subject_card = `${this.config.staticCDN}${StaticData.askWidget.images.brainBook}`;
                        } else if (this.totalSession % 6 === 2 || this.totalSession % 6 === 4) {
                            this.title.subject_card = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.title_3.hi : StaticData.askWidget.SubjectCard.title_3.en;
                            this.sub_title.subject_card = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.sub_title.hi : StaticData.askWidget.SubjectCard.sub_title.en;
                            this.image.subject_card = `${this.config.staticCDN}${StaticData.askWidget.images.thinkingFace}`;
                        }
                        break;
                    case 'case 4':
                        if (this.totalSession % 4 === 1 || this.totalSession % 4 === 2 || this.totalSession % 4 === 0) {
                            this.title.subject_card = title;
                            this.sub_title.subject_card = subTitle;
                            this.image.subject_card = `${this.config.staticCDN}${StaticData.askWidget.images.brainBook}`;
                        } else if (this.totalSession % 4 === 3) {
                            this.title.subject_card = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.title_3.hi : StaticData.askWidget.SubjectCard.title_3.en;
                            this.sub_title.subject_card = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.sub_title.hi : StaticData.askWidget.SubjectCard.sub_title.en;
                            this.image.subject_card = `${this.config.staticCDN}${StaticData.askWidget.images.thinkingFace}`;
                        }
                        break;
                    default:
                        this.title.subject_card = '';
                        this.sub_title.subject_card = '';
                        this.image.subject_card = '';
                }
            } else if (this.flagrFlow === 2 || this.flagrFlow === 3) {
                switch (this.flow) {
                    case 'case 1':
                        if (this.totalSession % 6 === 1 || this.totalSession % 6 === 3 || this.totalSession % 6 === 0) {
                            this.title.subject_card = title;
                            this.sub_title.subject_card = subTitle;
                            this.image.subject_card = `${this.config.staticCDN}${StaticData.askWidget.images.brainBook}`;
                        } else if (this.totalSession % 6 === 2 || this.totalSession % 6 === 4) {
                            this.title.subject_card = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.title_3.hi : StaticData.askWidget.SubjectCard.title_3.en;
                            this.sub_title.subject_card = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCard.sub_title.hi : StaticData.askWidget.SubjectCard.sub_title.en;
                            this.image.subject_card = `${this.config.staticCDN}${StaticData.askWidget.images.thinkingFace}`;
                        }
                        break;
                    case 'case 2':
                        if (this.totalSession % 4 === 0) {
                            this.title.subject_card = title;
                            this.sub_title.subject_card = subTitle;
                            this.image.subject_card = `${this.config.staticCDN}${StaticData.askWidget.images.brainBook}`;
                        }
                        break;
                    default:
                        this.title.subject_card = '';
                        this.sub_title.subject_card = '';
                        this.image.subject_card = '';
                }
            }
        } else if (type === 'SubjectCardList') {
            if (this.flagrFlow === 1 || this.flagrFlow === 2 || this.flagrFlow === 3) {
                switch (this.flow) {
                    case 'case 1':
                        this.title.subject_card_list = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCardList.title.hi : StaticData.askWidget.SubjectCardList.title.en;
                        this.sub_title.subject_card_list = StaticData.askWidget.SubjectCardList.sub_title.en;
                        this.image.subject_card_list = `${this.config.staticCDN}${StaticData.askWidget.images.booksRack}`;
                        break;
                    case 'case 2':
                        this.title.subject_card_list = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCardList.title.hi : StaticData.askWidget.SubjectCardList.title.en;
                        this.sub_title.subject_card_list = StaticData.askWidget.SubjectCardList.sub_title.en;
                        this.image.subject_card_list = `${this.config.staticCDN}${StaticData.askWidget.images.booksRack}`;
                        break;
                    case 'case 3':
                        this.title.subject_card_list = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCardList.title.hi : StaticData.askWidget.SubjectCardList.title.en;
                        this.sub_title.subject_card_list = StaticData.askWidget.SubjectCardList.sub_title.en;
                        this.image.subject_card_list = `${this.config.staticCDN}${StaticData.askWidget.images.booksRack}`;
                        break;
                    case 'case 4':
                        this.title.subject_card_list = this.user.locale === 'hi' ? StaticData.askWidget.SubjectCardList.title.hi : StaticData.askWidget.SubjectCardList.title.en;
                        this.sub_title.subject_card_list = StaticData.askWidget.SubjectCardList.sub_title.en;
                        this.image.subject_card_list = `${this.config.staticCDN}${StaticData.askWidget.images.booksRack}`;
                        break;
                    default:
                        this.title.subject_card_list = '';
                        this.sub_title.subject_card_list = '';
                        this.image.subject_card_list = '';
                }
            }
        } else if (type === 'CcmList') {
            if (this.flagrFlow === 1 || this.flagrFlow === 2 || this.flagrFlow === 3) {
                switch (this.flow) {
                    case 'case 1':
                        if (this.totalSession % 6 === 1 || this.totalSession % 6 === 3 || this.totalSession % 6 === 5) {
                            this.title.ccm_list = this.user.locale === 'hi' ? StaticData.askWidget.CcmList.title.hi : StaticData.askWidget.CcmList.title.en;
                            this.sub_title.ccm_list = '';
                            this.image.ccm_list = `${this.config.staticCDN}${StaticData.askWidget.images.winningCup}`;
                        } else if (this.totalSession % 6 === 2 || this.totalSession % 6 === 4) {
                            this.title.ccm_list = this.user.locale === 'hi' ? StaticData.askWidget.CcmList.title_2.hi : StaticData.askWidget.CcmList.title_2.en;
                            this.sub_title.ccm_list = '';
                            this.image.ccm_list = `${this.config.staticCDN}${StaticData.askWidget.images.teacher}`;
                        }
                        break;
                    case 'case 2':
                        if (this.totalSession % 4 === 2) {
                            this.title.ccm_list = this.user.locale === 'hi' ? StaticData.askWidget.CcmList.title.hi : StaticData.askWidget.CcmList.title.en;
                            this.sub_title.ccm_list = '';
                            this.image.ccm_list = `${this.config.staticCDN}${StaticData.askWidget.images.winningCup}`;
                        } else if (this.totalSession % 4 === 3) {
                            this.title.ccm_list = this.user.locale === 'hi' ? StaticData.askWidget.CcmList.title_2.hi : StaticData.askWidget.CcmList.title_2.en;
                            this.sub_title.ccm_list = '';
                            this.image.ccm_list = `${this.config.staticCDN}${StaticData.askWidget.images.teacher}`;
                        }
                        break;
                    case 'case 3':
                        if (this.totalSession % 6 === 1 || this.totalSession % 6 === 3 || this.totalSession % 6 === 5) {
                            this.title.ccm_list = this.user.locale === 'hi' ? StaticData.askWidget.CcmList.title.hi : StaticData.askWidget.CcmList.title.en;
                            this.sub_title.ccm_list = '';
                            this.image.ccm_list = `${this.config.staticCDN}${StaticData.askWidget.images.winningCup}`;
                        } else if (this.totalSession % 6 === 2 || this.totalSession % 6 === 4) {
                            this.title.ccm_list = this.user.locale === 'hi' ? StaticData.askWidget.CcmList.title_2.hi : StaticData.askWidget.CcmList.title_2.en;
                            this.sub_title.ccm_list = '';
                            this.image.ccm_list = `${this.config.staticCDN}${StaticData.askWidget.images.teacher}`;
                        }
                        break;
                    case 'case 4':
                        if (this.totalSession % 4 === 1) {
                            this.title.ccm_list = this.user.locale === 'hi' ? StaticData.askWidget.CcmList.title_2.hi : StaticData.askWidget.CcmList.title_2.en;
                            this.sub_title.ccm_list = '';
                            this.image.ccm_list = `${this.config.staticCDN}${StaticData.askWidget.images.teacher}`;
                        } else if (this.totalSession % 4 === 0) {
                            this.title.ccm_list = this.user.locale === 'hi' ? StaticData.askWidget.CcmList.title.hi : StaticData.askWidget.CcmList.title.en;
                            this.sub_title.ccm_list = '';
                            this.image.ccm_list = `${this.config.staticCDN}${StaticData.askWidget.images.winningCup}`;
                        }
                        break;
                    default:
                        this.title.ccm_list = '';
                        this.sub_title.ccm_list = '';
                        this.image.ccm_list = '';
                }
            }
        } else if (type === 'TrendingFreeLive') {
            if (this.flagrFlow === 2 || this.flagrFlow === 3) {
                switch (this.flow) {
                    case 'case 1':
                        if (this.totalSession % 6 === 5) {
                            this.title.trending_free_live = this.user.locale === 'hi' ? StaticData.askWidget.TrendingFreeLive.title.hi : StaticData.askWidget.TrendingFreeLive.title.en;
                            this.sub_title.trending_free_live = this.user.locale === 'hi' ? StaticData.askWidget.TrendingFreeLive.sub_title.hi : StaticData.askWidget.TrendingFreeLive.sub_title.en;
                            this.image.trending_free_live = `${this.config.staticCDN}${StaticData.askWidget.images.student}`;
                        }
                        break;
                    case 'case 2':
                        if (this.totalSession % 4 === 1 || this.totalSession % 4 === 3) {
                            this.title.trending_free_live = this.user.locale === 'hi' ? StaticData.askWidget.TrendingFreeLive.title_2.hi : StaticData.askWidget.TrendingFreeLive.title_2.en;
                            this.sub_title.trending_free_live = this.user.locale === 'hi' ? StaticData.askWidget.TrendingFreeLive.sub_title_2.hi : StaticData.askWidget.TrendingFreeLive.sub_title_2.en;
                            this.image.trending_free_live = `${this.config.staticCDN}${StaticData.askWidget.images.exam}`;
                        } else if (this.totalSession % 4 === 2 || this.totalSession % 4 === 4) {
                            this.title.trending_free_live = this.user.locale === 'hi' ? StaticData.askWidget.TrendingFreeLive.title.hi : StaticData.askWidget.TrendingFreeLive.title.en;
                            this.sub_title.trending_free_live = this.user.locale === 'hi' ? StaticData.askWidget.TrendingFreeLive.sub_title.hi : StaticData.askWidget.TrendingFreeLive.sub_title.en;
                            this.image.trending_free_live = `${this.config.staticCDN}${StaticData.askWidget.images.student}`;
                        }
                        break;
                    default:
                        this.title.trending_free_live = '';
                        this.sub_title.trending_free_live = '';
                        this.image.trending_free_live = '';
                }
            }
        }
    }

    makeSubjectCardResponse(list, assortmentPriceData) {
        const subject = list[0].display_name.split(' ').join('_');

        const items = [
            {
                widget_type: this.settings.subjectCard.type,
                widget_data: {
                    id: list[0].assortment_id,
                    heading1: {
                        title: this.user.locale === 'hi' ? this.settings.subjectCard.headingOne.hi : this.settings.subjectCard.headingOne.en,
                        title_color: this.settings.subjectCard.titleColor,
                        background_color: this.settings.subjectCard.backgroundColor,
                        corner_radius: this.settings.subjectCard.cornerRadius,
                    },
                    heading2: {
                        title: list[0].year_exam,
                        title_color: this.settings.subjectCard.titleColor,
                        background_color: this.settings.subjectCard.backgroundColor,
                        corner_radius: this.settings.subjectCard.cornerRadius,
                    },
                    description: `${this.user.locale === 'hi' ? 'कक्षा' : 'Class'} ${list[0].class} | ${list[0].category}`,
                    price: assortmentPriceData[list[0].assortment_id] ? `₹${CourseHelper.numberWithCommas(assortmentPriceData[list[0].assortment_id].monthly_price)}/${this.user.locale === 'hi' ? 'महीना' : 'Month'}` : '',
                    bottom_text: this.user.locale === 'hi' ? `${Math.floor(Math.random() * 2000) + 3000}${StaticData.askWidget.SubjectCard.bottom_title.hi}` : `${Math.floor(Math.random() * 8000)}${StaticData.askWidget.SubjectCard.bottom_title.en}`,
                    bottom_image: `${this.config.staticCDN}${StaticData.askWidget.images.studentsImages}`,
                    deeplink: list[0].assortment_id === 138829 ? this.settings.subjectCard.deeplinkKota : `${this.settings.subjectCard.deeplinkPrefix}${list[0].assortment_id}`,
                    card_width: '0.9',
                    card_ratio: '19:10',
                    right_half: {
                        title: list[0].display_name,
                        subtitle: `${list[0].meta_info.charAt(0).toUpperCase()}${list[0].meta_info.slice(1).toLowerCase()} ${this.user.locale === 'hi' ? 'माध्यम' : 'Medium'}`,
                        bottom_text: `${this.user.locale === 'hi' ? 'कोर्स आईडी' : 'Course ID'} #${list[0].assortment_id}`,
                        background: `${this.config.staticCDN}${StaticData.askWidget.subjectCardBg[subject.toLowerCase().split(' ').join('_')]}`,
                    },
                    cta: {
                        title: this.user.locale === 'hi' ? StaticData.askWidget.viewDetailsTitle.hi : StaticData.askWidget.viewDetailsTitle.en,
                        title_color: this.settings.subjectCard.cta.titleColor,
                        background_color: this.settings.subjectCard.cta.backgroundColor,
                        corner_radius: 12.0,
                    },
                },
                layout_config: this.settings.subjectCard.layoutConfigItem,
                extra_params: {
                    assortment_id: list[0].assortment_id.toString(),
                    page: 'SRP',
                    widget_title: this.title.subject_card,
                    card_type: 'SRP_WIDGET_SINGLE_CARD',
                },
            },
        ];

        const returnObj = {
            widget_type: this.settings.subjectCard.parentType,
            widget_data: {
                title: this.title.subject_card,
                title_text_size: 13,
                is_title_bold: true,
                remove_padding: true,
                title_text_max_line: 2,
                top_icon_width: this.settings.topIconWidth,
                top_icon_height: this.settings.topIconHeight,
                title_text_color: '#202020',
                border_color: this.settings.borderColor,
                corner_radius: this.settings.cornerRadius,
                background_color: this.settings.backgroundColor,
                border_width: this.settings.borderWidth,
                items,
            },
            layout_config: this.settings.layoutConfigParent,
        };

        if (this.sub_title.subject_card !== '') {
            returnObj.widget_data.subtitle = this.sub_title.subject_card;
            returnObj.widget_data.subtitle_text_color = '#202020';
        }

        if (this.image.subject_card !== '') {
            returnObj.widget_data.top_icon = this.image.subject_card;
        }
        return returnObj;
    }

    makeSubjectCardListResponse(list, assortmentPriceData, teacherUrl) {
        if (list.length > 0 && !_.isEmpty(assortmentPriceData[list[0].assortment_id])) {
            return {
                widget_type: 'widget_subject_course_card',
                widget_data: {
                    medium_text: `${list[0].meta_info.charAt(0).toUpperCase()}${list[0].meta_info.slice(1).toLowerCase()} ${this.user.locale === 'hi' ? 'माध्यम' : 'Medium'}`,
                    medium_text_color: '#000000',
                    medium_text_bg_color: StaticData.askWidget.subjectWiseBgForSubjectList[list[0].display_name.toLowerCase().split(' ').join('_')],
                    card_bg_color: StaticData.askWidget.subjectWiseBgForCardList[list[0].display_name.toLowerCase().split(' ').join('_')],
                    title: `${this.user.locale === 'hi' ? 'कक्षा' : 'Class'} ${list[0].class} | ${list[0].category} ${list[0].year_exam}`,
                    subject: list[0].display_name,
                    price: assortmentPriceData[list[0].assortment_id] ? `₹${CourseHelper.numberWithCommas(assortmentPriceData[list[0].assortment_id].monthly_price)}/${this.user.locale === 'hi' ? 'महीना' : 'Month'}` : '',
                    button_text: this.user.locale === 'hi' ? 'अभी खरीदें' : 'Buy Now',
                    button_color: '#ffffff',
                    button_text_color: '#eb532c',
                    faculty_image_url: teacherUrl,
                    deeplink: list[0].assortment_id === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${list[0].assortment_id}`,
                },
                layout_config: this.settings.layoutConfigZero,
                extra_params: {
                    assortment_id: list[0].assortment_id.toString(),
                    page: 'SRP',
                    widget_title: this.title.subject_card_list,
                    card_type: 'SRP_WIDGET_SUBJECT_TUITIONS_LIST',
                },
            };
        }
        return {};
    }

    async makeFreeLiveClassListResponse(widget) {
        const SortingHelper = new SortingManager(this.req);
        const studentCourseOrClassSubcriptionDetails = await SortingHelper.getSubscriptionDetails();
        widget.border_color = this.settings.borderColor;
        widget.corner_radius = this.settings.cornerRadius;
        widget.background_color = this.settings.backgroundColor;
        widget.border_width = this.settings.borderWidth;

        if (this.req.headers.version_code >= 992) {
            widget.link_text = this.user.locale === 'hi' ? 'सभी देखें' : 'View all';
            widget.is_action_button_title_bold = true;
            widget.deeplink = studentCourseOrClassSubcriptionDetails.length === 0 ? 'doubtnutapp://library_tab?tag=free_classes' : 'doubtnutapp://library_tab?tag=free_classes';
        }

        // const currentTime = moment().add('5', 'hours').add('30', 'minutes').valueOf(); // in miliseconds
        // const currentTime = moment().add('5', 'hours').add('30', 'minutes').unix(); // in seconds
        const currentMoment = moment().add('5', 'hours').add('30', 'minutes');
        widget.items.forEach((x, i) => {
            const liveMoment = moment(x.data.live_at);
            const diff = liveMoment.diff(currentMoment, 'minutes');
            let viewsText = `${Math.floor(Math.random() * 500) + 1000} ${this.user.locale === 'hi' ? 'देख रहे हैं' : 'watching'}`;
            if (diff < -Math.round(x.data.duration / 60)) {
                viewsText = `${Math.floor(Math.random() * 500) + 1000} ${this.user.locale === 'hi' ? 'ने देखा' : 'attended'}`;
            } else if (diff > Math.round(x.data.duration / 60)) {
                viewsText = `${Math.floor(Math.random() * 500) + 1000} ${this.user.locale === 'hi' ? 'की रुचि है' : 'interested'}`;
            }
            if (x.data && x.data.duration !== null && x.data.duration !== undefined && x.data.duration !== '' && x.data.duration !== '0') {
                viewsText = `${Math.floor(Math.random() * 500) + 1000} ${this.user.locale === 'hi' ? 'देख रहे हैं' : 'watching'} | ${Math.round(x.data.duration / 60)} min`;
                if (diff < -Math.round(x.data.duration / 60)) {
                    viewsText = `${Math.floor(Math.random() * 500) + 1000} ${this.user.locale === 'hi' ? 'ने देखा' : 'attended'} | ${Math.round(x.data.duration / 60)} min`;
                } else if (diff > Math.round(x.data.duration / 60)) {
                    viewsText = `${Math.floor(Math.random() * 500) + 1000} ${this.user.locale === 'hi' ? 'की रुचि है' : 'interested'} | ${Math.round(x.data.duration / 60)} min`;
                }
            }
            x.type = 'widget_child_autoplay';
            x.data.views = viewsText;
            x.data.page = 'SRP_WIDGET_LIVE';
            x.data.start_gd = StaticData.askWidget.subjectWiseBgForFreeLive[x.data.subject.toLowerCase().split(' ').join('_')];
            x.data.mid_gd = StaticData.askWidget.subjectWiseBgForFreeLive[x.data.subject.toLowerCase().split(' ').join('_')];
            x.data.end_gd = StaticData.askWidget.subjectWiseBgForFreeLive[x.data.subject.toLowerCase().split(' ').join('_')];
            x.data.color = StaticData.askWidget.subjectWiseBgForFreeLiveLecture[x.data.subject.toLowerCase().split(' ').join('_')];
            x.data.target_exam = `Lecture #${i + 1}`;
            x.data.bg_exam_tag = StaticData.askWidget.subjectWiseBgForFreeLiveLecture[x.data.subject.toLowerCase().split(' ').join('_')];
            x.data.text_color_primary = '#000000';
            x.data.text_color_title = '#000000';
            x.data.card_ratio = '8:5';
            x.data.card_width = '1.2';
            x.layout_config = {
                margin_top: 0,
                margin_bottom: 22,
                margin_left: 0,
                margin_right: 0,
            };
            x.extra_params = {
                assortment_id: x.data.assortment_id.toString(),
                page: 'SRP',
                widget_title: this.title.free_live,
                card_type: 'SRP_WIDGET_FREE_LIVE_CLASS_LIST',
            };
            x.data.title1_text_color = '#000000';
            x.data.title2_text_color = '#000000';
            delete x.data.top_title;
            delete x.data.button;
            delete x.data.image_bg_card;
        });
        const responseObj = {
            widget_type: 'widget_autoplay',
            widget_data: widget,
            layout_config: this.settings.layoutConfigParent,
        };
        if (this.sub_title.free_live !== '') {
            responseObj.widget_data.subtitle = this.sub_title.free_live;
            responseObj.widget_data.subtitle = '#202020';
        }
        if (this.image.free_live !== '') {
            responseObj.widget_data.top_icon = this.image.free_live;
            responseObj.widget_data.top_icon_width = this.settings.topIconSmallWidth;
            responseObj.widget_data.top_icon_height = this.settings.topIconSmallHeight;
        }
        responseObj.widget_data.title_text_max_line = 2;
        return responseObj;
    }

    makeCcmIdWiseCourseList(courseDetails) {
        courseDetails.data.border_color = this.settings.borderColor;
        courseDetails.data.corner_radius = this.settings.cornerRadius;
        courseDetails.data.background_color = this.settings.backgroundColor;
        courseDetails.data.border_width = this.settings.borderWidth;
        if (this.sub_title.ccm_list !== '') {
            courseDetails.data.subtitle = this.sub_title.ccm_list;
            courseDetails.data.subtitle_text_color = '#202020';
        }
        if (this.image.ccm_list !== '') {
            courseDetails.data.top_icon = this.image.ccm_list;
            courseDetails.data.top_icon_width = this.settings.topIconWidth;
            courseDetails.data.top_icon_height = this.settings.topIconHeight;
        }
        courseDetails.layout_config = this.settings.layoutConfigParent;

        const listLength = courseDetails.data.items.length;
        courseDetails.data.items.forEach((x) => {
            x.extra_params = {
                assortment_id: x.assortment_id.toString(),
                page: 'SRP',
                widget_title: this.title.ccm_list,
                card_type: 'SRP_WIDGET_COURSE_LIST',
            };
            if (listLength === 1) {
                x.card_width = '1.0';
            } else {
                x.card_width = '1.25';
            }
        });
        return courseDetails;
    }

    makeTrendingFreeClassResponse(liveClassData) {
        liveClassData.widget_data.auto_play = false;

        liveClassData.widget_data.title = this.title.trending_free_live;
        liveClassData.widget_data.title_text_size = 15;
        liveClassData.widget_data.is_title_bold = true;
        liveClassData.widget_data.title_text_max_line = 2;

        liveClassData.widget_data.border_color = '#cbcbcb';
        liveClassData.widget_data.border_width = 1;
        liveClassData.widget_data.corner_radius = '2.0';
        liveClassData.widget_data.background_color = '#ffffff';
        delete liveClassData.widget_data.bg_color;

        if (this.sub_title.trending_free_live !== '') {
            liveClassData.widget_data.subtitle = this.sub_title.trending_free_live;
            liveClassData.widget_data.subtitle_text_color = '#00000';
            liveClassData.widget_data.subtitle_text_size = 12;
        }

        if (this.image.trending_free_live !== '') {
            liveClassData.widget_data.top_icon = this.image.trending_free_live;
            liveClassData.widget_data.top_icon_width = this.settings.topIconWidth;
            liveClassData.widget_data.top_icon_height = this.settings.topIconHeight;
        }

        liveClassData.widget_data.items.forEach((x) => {
            x.data.video_resource = null;
            x.extra_params = {
                assortment_id: x.data.assortment_id.toString(),
                page: 'SRP',
                widget_title: this.title.trending_free_live,
                card_type: 'SRP_WIDGET_TRENDING_FREE_CLASS',
            };
        });

        return liveClassData;
    }

    async extractOnlyNonSubscribedCourses(getLatestAssortmentId) {
        const { student_id: studentId } = this.user;
        let allSubscribedPackages = await CourseV2.getUserActivePackages(this.db, studentId);
        if (allSubscribedPackages.length > 0) {
            allSubscribedPackages = allSubscribedPackages.map((x) => x.assortment_id);

            const allParentAssortmentList = await CourseHelper.getChildAssortmentListRecursivelyV1(this.db, allSubscribedPackages);
            allParentAssortmentList.forEach((x) => {
                allSubscribedPackages.push(x);
            });

            getLatestAssortmentId = getLatestAssortmentId.filter((x) => !allSubscribedPackages.includes(x.assortment_id));
        }

        return getLatestAssortmentId;
    }

    async extractOnlyPackageDetailsAddedCourse(getLatestAssortmentId) {
        const { student_id: studentId } = this.user;

        const packageDetailsCallArr = [];
        getLatestAssortmentId.forEach((x) => {
            packageDetailsCallArr.push(CourseHelper.getPackagesForAssortment(this.db, studentId, [x.assortment_id]));
        });

        const promiseResult = await Promise.all(packageDetailsCallArr);

        const finalPackageArr = [];
        getLatestAssortmentId.forEach((x, i) => {
            if (promiseResult[i].length) {
                finalPackageArr.push(x);
            }
        });

        return finalPackageArr;
    }

    async getLiveVideoAndAssortmentDetails(obj) {
        const cacheKey = md5(JSON.stringify({
            subject: obj.subject, student_class: obj.student_class, subject_check: obj.subject_check, category_list: obj.category_list,
        }));

        let itemList = [];
        const filteredList = await QuestionRedis.getSrpCache(this.db.redis.read, cacheKey);
        if (!_.isNull(filteredList)) {
            itemList = JSON.parse(filteredList);
        } else {
            let assortmentIdWiseCourse = await LiveClassMySql.getTypeWiseCard(this.db.mysql.read, obj.subject, obj.student_class, obj.subject_check, obj.category_list);
            if (assortmentIdWiseCourse.length > 0) {
                assortmentIdWiseCourse = await this.extractOnlyNonSubscribedCourses(assortmentIdWiseCourse);
                if (assortmentIdWiseCourse.length > 0) {
                    assortmentIdWiseCourse = await this.extractOnlyPackageDetailsAddedCourse(assortmentIdWiseCourse);
                    if (assortmentIdWiseCourse.length > 0) {
                        itemList = assortmentIdWiseCourse;
                        QuestionRedis.setSrpCache(this.db.redis.write, cacheKey, itemList);
                    }
                }
            }
        }

        if (itemList.length > 0) {
            let itemFinalList = [];
            if (obj.locale_check) {
                let localeText = this.user.locale === 'hi' ? 'HINDI' : 'ENGLISH';
                // const questionDetails = await Question.getByNewQuestionId(this.query.question_id, this.db.mysql.read);
                const { ocr_text: ocr } = this.lastAskedQuestionData[0];
                const detectedLang = Utility.checkQuestionOcrLanguages(ocr);
                if (!_.isNull(detectedLang.detectedLanguage)) {
                    localeText = detectedLang.detectedLanguage === 'hi' ? 'HINDI' : 'ENGLISH';
                }
                itemFinalList = itemList.filter((x) => x.meta_info === localeText);
                if (itemFinalList.length === 0) {
                    itemFinalList = itemList.filter((x) => x.meta_info === 'ENGLISH');
                    if (itemFinalList.length === 0) {
                        itemFinalList = itemList;
                    }
                }
            } else {
                itemFinalList = itemList;
            }

            if (obj.result_type === 'single') {
                itemFinalList = [itemFinalList[0]];
            }

            const latestAssortmentIds = itemFinalList.map((x) => x.assortment_id);

            const dataWithAssortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(this.db, latestAssortmentIds, this.user.student_id, '', '');
            return {
                result: itemFinalList,
                assortmentPriceMapping: dataWithAssortmentPriceMapping,
            };
        }
        return {};
    }

    async getRelatedData(subject, subjectCheck, localeCheck, resultType) {
        const { student_id: studentId, student_class: studentClass } = this.user;
        const studentData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(this.db, studentId, 'none');
        const studentCourseArr = studentData.map((x) => x.course);

        let categoryList = [];
        if (studentCourseArr.length > 0) {
            categoryList = await LiveClassContainer.getCategoriesByExam(this.db, studentCourseArr);
            categoryList = categoryList.map((x) => x.category);
        }

        const obj = {
            subject,
            student_class: studentClass,
            subject_check: subjectCheck,
            category_list: categoryList,
            locale_check: localeCheck,
            result_type: resultType,
        };
        return this.getLiveVideoAndAssortmentDetails(obj);
    }

    async getSubjectWiseCourseCard(resultType, internal = false, localeCheck = true, subjectCheck = true) {
        const subjectRelatedDataObj = await this.getRelatedData(this.subject, subjectCheck, localeCheck, resultType);
        if (subjectRelatedDataObj && Object.keys(subjectRelatedDataObj).length !== 0) {
            if (internal) {
                return subjectRelatedDataObj;
            }
            const filteredList = subjectRelatedDataObj.result;
            const dataWithAssortmentPriceMapping = subjectRelatedDataObj.assortmentPriceMapping;
            if (!_.isEmpty(filteredList)) {
                this.putAdditionalStaticData('SubjectCard');
                return this.makeSubjectCardResponse(filteredList, dataWithAssortmentPriceMapping);
            }
        }
        return {};
    }

    async getSubjetsCourseCardList() {
        // getting user details
        const { student_id: studentId, student_class: studentClass, locale } = this.user;

        // adding subject list array
        let subjectList = [];
        if (studentClass != 14) {
            subjectList = StaticData.askWidget.classWiseSubjectCardOrdering[studentClass][locale];
        } else {
            const ccmIdList = await ClassCourseMappingContainer.getStudentsExamsBoardsData(this.db, studentId, 'none');
            if (ccmIdList.length > 0) {
                subjectList = StaticData.askWidget.classWiseSubjectCardOrdering[studentClass][ccmIdList[0].id];
            } else {
                subjectList = StaticData.askWidget.classWiseSubjectCardOrdering[studentClass].default;
            }
            if (subjectList == undefined || subjectList.length === 0) {
                subjectList = StaticData.askWidget.classWiseSubjectCardOrdering[studentClass].default;
            }
        }

        if (_.isNull(subjectList) || (subjectList && subjectList.length === 0)) {
            subjectList = StaticData.askWidget.classWiseSubjectCardOrdering[14].default;
        }

        if (subjectList != undefined && subjectList.length > 0) {
            // making final subject list
            const subjectIndex = subjectList.findIndex((x) => x == this.subject.toUpperCase());
            if (subjectIndex > -1) {
                subjectList.splice(subjectIndex, 1);
            }
            subjectList.unshift(this.subject.toUpperCase());

            const subjectDataPromiseArr = [];
            const teacherRelatedDataArr = [];
            subjectList.forEach((x) => {
                subjectDataPromiseArr.push(this.getRelatedData(x, true, true, 'single'));
            });
            let subjectRelatedData = await Promise.all(subjectDataPromiseArr);
            subjectRelatedData = subjectRelatedData.filter((x) => x.result != undefined && x.result.length > 0);

            subjectList = [];
            subjectRelatedData.forEach((x) => {
                subjectList.push(x.result[0].display_name);
            });

            subjectList.forEach((x) => {
                teacherRelatedDataArr.push(LiveClassContainer.getTeachersBySubjectName(this.db, x));
            });
            const teacherRelatedData = await Promise.all(teacherRelatedDataArr);

            const finalItems = [];
            this.putAdditionalStaticData('SubjectCardList');
            subjectList.forEach((x, i) => {
                const dataObj = subjectRelatedData[i];
                if (dataObj && Object.keys(dataObj).length !== 0) {
                    const subjectCardObj = this.makeSubjectCardListResponse(dataObj.result, dataObj.assortmentPriceMapping, teacherRelatedData[i]);
                    if (subjectCardObj && Object.keys(subjectCardObj).length !== 0) {
                        finalItems.push(subjectCardObj);
                    }
                }
            });

            if (finalItems.length > 0) {
                const returnObj = {
                    widget_type: 'widget_parent',
                    widget_data: {
                        title: this.title.subject_card_list,
                        title_text_size: 13,
                        is_title_bold: true,
                        title_text_max_line: 2,
                        top_icon_width: this.settings.topIconWidth,
                        top_icon_height: this.settings.topIconHeight,
                        title_text_color: '#202020',
                        border_color: this.settings.borderColor,
                        corner_radius: this.settings.cornerRadius,
                        background_color: this.settings.backgroundColor,
                        show_indicator: true,
                        remove_padding: true,
                        border_width: this.settings.borderWidth,
                        indicator_margin: {
                            margin_top: 12,
                            margin_bottom: 12,
                            margin_left: 0,
                            margin_right: 0,
                        },
                        items: finalItems,
                    },
                    layout_config: this.settings.layoutConfigParent,
                };

                if (this.sub_title.subject_card_list !== '') {
                    returnObj.widget_data.subtitle = this.sub_title.subject_card_list;
                    returnObj.widget_data.subtitle_text_color = '#202020';
                }

                if (this.image.subject_card_list !== '') {
                    returnObj.widget_data.top_icon = this.image.subject_card_list;
                }
                return returnObj;
            }
        }
        return {};
    }

    async getTopicIdWiseFreeLiveClassList() {
        const { ocr_text: ocr } = this.lastAskedQuestionData[0];
        const detectedLang = Utility.checkQuestionOcrLanguages(ocr);
        const obj = {
            type: 'live',
            subject: this.subject,
            chapter: this.chapter,
            class: (this.user.student_class).toString(),
            // locale: this.user.locale,
            locale: detectedLang.detectedLanguage,
        };
        let liveClassDataList = await freeClassHelper.getDataForDailyGoal(obj);
        liveClassDataList = liveClassDataList.liveClass;
        if (liveClassDataList && Object.keys(liveClassDataList).length !== 0 && liveClassDataList.sugg && liveClassDataList.sugg.length !== 0) {
            liveClassDataList = liveClassDataList.sugg;
        } else if (this.chapterAlias !== '') {
            obj.chapter = this.chapterAlias;
            liveClassDataList = await freeClassHelper.getDataForDailyGoal(obj);
            liveClassDataList = liveClassDataList.liveClass;
            if (liveClassDataList && Object.keys(liveClassDataList).length !== 0 && liveClassDataList.sugg && liveClassDataList.sugg.length !== 0) {
                liveClassDataList = liveClassDataList.sugg;
            }
        }

        if (liveClassDataList && liveClassDataList.length > 0) {
            const qids = liveClassDataList.map((x) => x.srcId.toString());
            const liveClassData = await LiveClassHelper.getLiveclassData(this.db, qids, parseInt(this.user.student_class));

            const finalData = [];
            liveClassDataList.forEach((x) => {
                const liveDetails = liveClassData.filter((y) => y.resource_reference == x.srcId);
                if (liveDetails.length > 0) {
                    x.duration = x._extras.duration;
                    x.resource_reference = x.srcId;
                    x.assortment_id = liveDetails[0].assortment_id;
                    x.live_at = x._extras.live_at;
                    x.display = x._extras.display;
                    x.expert_name = liveDetails[0].expert_name;
                    x.expert_image = liveDetails[0].expert_image;
                    x.class = x._extras.class;
                    x.subject = x._extras.subject;
                    x.is_free = x._extras.is_free;
                    x.stream_status = liveDetails[0].stream_status;
                    x.player_type = liveDetails[0].player_type;
                    x.meta_info = liveDetails[0].meta_info;
                    x.chapter = x._extras.chapter;

                    finalData.push(x);
                }
            });

            if (finalData.length > 0) {
                this.putAdditionalStaticData('FreeLive');
                const widgetObj = {
                    data: finalData,
                    paymentCardState: { isVip: false },
                    title: this.title.free_live,
                    studentLocale: obj.locale,
                    versionCode: obj.versionCode,
                    type: 'match_mpvp',
                };
                const widget = await WidgetHelper.homepageVideoWidgetWithoutTabs(widgetObj);
                const latestLiveClassFirst = _.orderBy(widget.items, ['data.live_at'], ['desc']);
                const dataListForElastic = [];
                latestLiveClassFirst.forEach((x) => dataListForElastic.push({ id: x.data.id, chapter: x.data.chapter }));
                // this.elasticSearchUserQuestionsInstance.updateLiveClassTabs('user-questions', this.query.question_id, dataListForElastic);
                widget.items = latestLiveClassFirst;
                return this.makeFreeLiveClassListResponse(widget);
            }
        }
        return {};
    }

    async getCcmIdWiseCourseList() {
        const { result, assortmentPriceMapping } = await this.getSubjectWiseCourseCard('multiple', true, true, false);
        if (result && result.length > 0) {
            const carousel = {
                type: 'widget_course_v3',
            };
            this.putAdditionalStaticData('CcmList');
            carousel.title = this.title.ccm_list;
            const courseDetails = await CourseWidgetHelper.getPopularCourseWidgetData({
                db: this.db, result, carousel, config: this.config, locale: this.user.locale, assortmentPriceMapping,
            });
            if (courseDetails.data.items.length > 0) {
                return this.makeCcmIdWiseCourseList(courseDetails);
            }
        }
        return {};
    }

    addingCaseOneTypes() {
        if (this.totalSession % 6 === 1) {
            console.log('session 1');
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
        } else if (this.totalSession % 6 === 2) {
            console.log('session 2');
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getSubjetsCourseCardList());
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
        } else if (this.totalSession % 6 === 3) {
            console.log('session 3');
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
        } else if (this.totalSession % 6 === 4) {
            console.log('session 4');
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getSubjetsCourseCardList());
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
        } else if (this.totalSession % 6 === 5) {
            console.log('session 5');
            this.widgetDataPromiseArr.push(this.getSubjetsCourseCardList());
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
        } else if (this.totalSession % 6 === 0) {
            console.log('session 6');
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getSubjetsCourseCardList());
        }
    }

    addingCaseTwoTypes() {
        if (this.totalSession % 4 === 1) {
            console.log('session 1');
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getSubjetsCourseCardList());
        } else if (this.totalSession % 4 === 2) {
            console.log('session 2');
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
        } else if (this.totalSession % 4 === 3) {
            console.log('session 3');
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
        } else if (this.totalSession % 4 === 0) {
            console.log('session 4');
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
            this.widgetDataPromiseArr.push(this.getSubjetsCourseCardList());
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
        }
    }

    async getNkcData(ccmIdList, studentCcmData) {
        const supportedData = {
            ccm_list: ccmIdList, student_ccm: studentCcmData, student_id: this.user.student_id, student_class: this.user.student_class, locale: this.user.locale, version_code: this.req.headers.version_code,
        };

        const nkcData = await AnswerHelper.makeNkcData(this.db, supportedData);
        if (nkcData && Object.keys(nkcData).length > 0) {
            return nkcData;
        }
        return {};
    }

    async nkcdataBuilder() {
        let showNkcData = false;
        let studentCcmData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(this.db, studentId, 'none');
        studentCcmData = _.orderBy(studentCcmData, ['id'], ['asc']);
        studentCcmData.forEach((x) => {
            x.category = x.course;
        });
        const ccmIdList = studentCcmData.map((x) => x.id);
        if (ccmIdList.length > 0) {
            ccmIdList.forEach((x) => {
                if (this.allowedCcmIds.includes(parseInt(x))) {
                    showNkcData = true;
                    return false;
                }
            });
        } else {
            showNkcData = true;
        }
        if (showNkcData) {
            return this.getNkcData(ccmIdList, studentCcmData);
        }
        return {};
    }

    addingSourceToBannerDeeplink(data) {
        const items = _.get(data, 'data.items', null);
        if (!_.isEmpty(items)) {
            data.data.items = _.map(items, (item) => {
                if (item.deeplink_banner) {
                    item.deeplink_banner = item.deeplink_banner.concat('&source=SRP_WIDGET');
                }
                if (item.deeplink_button) {
                    item.deeplink_button = item.deeplink_button.concat('&source=SRP_WIDGET');
                }
                return item;
            });
        }
        return data;
    }

    async popularCoursesWidget() {
        try {
            const page = 'SRP';
            let data = {};

            const liveClassPages = ['LIVECLASS', 'LIVECLASS_NOTIFICATION', 'HOME_FEED_LIVE', 'LIVECLASS_ALERT', 'LIVECLASS_HOME', 'COURSE_DETAIL', 'COURSE_LANDING', 'COURSE_RESOURCE', 'LIVE_CLASS_MPVP', 'PAID_CONTENT_FEED', 'CHAPTER_SERIES_CAROUSAL', 'HOME_PAGE_REVISION_CLASSES', 'MPVP_CLASSES_CAROUSEL', 'MATCH_PAGE_RELATED_CLASSES', 'QA_WIDGET_LIVE', 'SRP_WIDGET_LIVE', 'LIVE_CLASS_ALL_HP', 'LIVE_CLASS_HP'];
            const [flgrResp] = await Promise.all([
                AnswerContainerv13.getAllFlagsNeededForThePage(this.xAuthToken, this.req.headers.version_code, page, liveClassPages),
            ]);

            const popularCourseCarousel = await AnswerHelper.getPopularCoursesCarousel({
                db: this.db,
                studentId: this.studentId,
                studentClass: this.studentClass,
                versionCode: this.versionCode,
                studentLocale: this.locale,
                config: this.config,
                xAuthToken: this.xAuthToken,
                page,
                eventPage: page,
                pznElasticSearchInstance: this.pznElasticSearchInstance,
                hitFlagr: false,
                prevFlagrResponse: flgrResp,
            });

            const popularCourseItems = _.get(popularCourseCarousel, 'popularCourseWidget.widget_data.data.items', null);
            const widgetPlacement = 'video_page';

            if (popularCourseItems && popularCourseItems.length && widgetPlacement === 'video_page') {
                data = {
                    delay_in_sec: StaticData.popular_courses_carousel.delay_in_sec,
                    type: 'widget_popular_course',
                    data: popularCourseCarousel.popularCourseWidget.widget_data.data,
                    extra_params: popularCourseCarousel.popularCourseWidget.widget_data.extra_params,
                };
                data.extra_params.widget_name = 'mpvp_classes_carousel';
                data.data.call_impression_api = true;
                data = this.addingSourceToBannerDeeplink(data);
            }

            return data;
        } catch (e) {
            throw new Error(e);
        }
    }

    async makeIconListWidgetForMatchPage() {
        try {
            let { locale } = this;
            if (locale !== 'en' && locale !== 'hi') {
                locale = 'other';
            }
            let flagrVariants = ['1'];
            if (this.flagrVariantsArr) {
                flagrVariants = this.flagrVariantsArr.split(',');
                flagrVariants.unshift('1');
            }
            let allIcons = await iconsContainer.getIconsByCategory(this.db, this.user.student_class, this.user.locale, 'CAMERA_PAGE_BOTTOM_SHEET', this.req.headers.version_code, flagrVariants);
            if (allIcons.length > 0) {
                const SortingHelper = new SortingManager(this.req);
                allIcons = await SortingHelper.getSortedItems(allIcons);
            }

            if (!_.isEmpty(allIcons)) {
                const items = IconsHelper.getPopularFeaturesListWidget(this.db, allIcons);
                return {
                    widget_type: 'widget_parent',
                    widget_data: {
                        title: StaticData.explore_app[locale],
                        title_text_color: '#969696',
                        is_title_bold: true,
                        title_text_max_line: 1,
                        title_text_size: 16,
                        scroll_direction: 'vertical',
                        items,
                    },
                };
            }
            return {};
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    async makeFeedbackWidget() {
        try {
            let { locale } = this;
            if (locale !== 'en' && locale !== 'hi') {
                locale = 'other';
            }
            return {
                type: 'widget_match_page_extra_feature',
                layout_config: {
                    margin_left: 16,
                    margin_right: 16,
                },
                data: {
                    id: '',
                    feature: 'book_feedback',
                    subtitle: StaticData.no_solution_pane.feedback.title[locale] || StaticData.no_solution_pane.feedback.title.other,
                    subtitle_color: '#17181f',
                    is_subtitle_bold: false,
                    cta1: {
                        title: StaticData.no_solution_pane.feedback.cta[locale] || StaticData.no_solution_pane.feedback.cta.other,
                        title_color: '#ffffff',
                        background_color: '#ea532c',
                        stroke_width: 1,
                        stroke_color: '#ea532c',
                        deeplink: 'doubtnutapp://match_page_book_feedback?source=back_press',
                    },
                },
            };
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    async makeP2pWidget() {
        try {
            let { locale } = this;
            if (locale !== 'en' && locale !== 'hi') {
                locale = 'other';
            }
            return {
                type: 'widget_match_page_extra_feature',
                layout_config: {
                    margin_left: 16,
                    margin_right: 16,
                },
                data: {
                    id: '',
                    feature: 'p2p',
                    card_stroke_color: '#979797',
                    card_corner_radius: 4.0,
                    title: StaticData.no_solution_pane.title[locale] || StaticData.no_solution_pane.title.other,
                    is_title_bold: true,
                    title_color: '#17181f',
                    subtitle: StaticData.no_solution_pane.subtitle[locale] || StaticData.no_solution_pane.subtitle.other,
                    subtitle_color: '#17181f',
                    is_subtitle_bold: false,
                    cta1: {
                        title: StaticData.no_solution_pane.cta_text[locale] || StaticData.no_solution_pane.cta_text.other,
                        title_color: '#ffffff',
                        background_color: '#ea532c',
                        stroke_width: 1,
                        stroke_color: '#ea532c',
                        action: 'p2p',
                    },
                },
            };
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    async getLiveClassDetails() {
        let finalObj = {};
        const liveCarousels = await CourseV2.getFreeLiveClassCaraousel(this.db, this.user.student_class, this.user.locale, this.req.headers.version_code, '1', 10);
        const liveClassCarousel = liveCarousels.filter((x) => x.carousel_type === 'widget_autoplay' && x.view_type === 'free_live_class_all');
        if (liveClassCarousel.length > 0) {
            const liveClassData = await LiveclassHelperLocal.getLiveClassFreeData(this.db, this.user.student_id, this.user.student_class, this.user.locale, this.req.headers.version_code, this.config, liveClassCarousel[0]);
            if (liveClassData.length > 0 && liveClassData[0].widget_data && liveClassData[0].widget_data.items && liveClassData[0].widget_data.items.length) {
                this.putAdditionalStaticData('TrendingFreeLive');
                finalObj = this.makeTrendingFreeClassResponse(liveClassData[0]);
            }
        }
        return finalObj;
    }

    addingV2CaseOneTypes() {
        if (this.totalSession % 6 === 1) {
            console.log('session 1');
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
        } else if (this.totalSession % 6 === 2) {
            console.log('session 2');
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getSubjetsCourseCardList());
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
        } else if (this.totalSession % 6 === 3) {
            console.log('session 3');
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
        } else if (this.totalSession % 6 === 4) {
            console.log('session 4');
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getSubjetsCourseCardList());
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
        } else if (this.totalSession % 6 === 5) {
            console.log('session 5');
            this.widgetDataPromiseArr.push(this.getSubjetsCourseCardList());
            this.widgetDataPromiseArr.push(this.getLiveClassDetails());
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
        } else if (this.totalSession % 6 === 0) {
            console.log('session 6');
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
            this.widgetDataPromiseArr.push(this.getSubjetsCourseCardList());
        }
    }

    addingV2CaseTwoTypes() {
        if (this.totalSession % 4 === 1) {
            console.log('session 1');
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
            this.widgetDataPromiseArr.push(this.getLiveClassDetails());
            this.widgetDataPromiseArr.push(this.getSubjetsCourseCardList());
        } else if (this.totalSession % 4 === 2) {
            console.log('session 2');
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
            this.widgetDataPromiseArr.push(this.getLiveClassDetails());
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
        } else if (this.totalSession % 4 === 3) {
            console.log('session 3');
            this.widgetDataPromiseArr.push(this.getLiveClassDetails());
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
            this.widgetDataPromiseArr.push(this.getCcmIdWiseCourseList());
        } else if (this.totalSession % 4 === 0) {
            console.log('session 4');
            this.widgetDataPromiseArr.push(this.getLiveClassDetails());
            this.widgetDataPromiseArr.push(this.getTopicIdWiseFreeLiveClassList());
            this.widgetDataPromiseArr.push(this.getSubjectWiseCourseCard('single'));
        }
    }

    async getTopicIdWiseFreeLiveClassListVideoPage() {
        const { ocr_text: ocr } = this.lastAskedQuestionData[0];
        const detectedLang = Utility.checkQuestionOcrLanguages(ocr);
        const obj = {
            type: 'live',
            subject: this.subject,
            chapter: this.chapter,
            class: (this.user.student_class).toString(),
            // locale: this.user.locale,
            locale: detectedLang.detectedLanguage,
        };
        let liveClassDataList = await freeClassHelper.getDataForDailyGoal(obj);
        liveClassDataList = liveClassDataList.liveClass;
        if (liveClassDataList && Object.keys(liveClassDataList).length !== 0 && liveClassDataList.sugg && liveClassDataList.sugg.length !== 0) {
            liveClassDataList = liveClassDataList.sugg;
        } else if (this.chapterAlias !== '') {
            obj.chapter = this.chapterAlias;
            liveClassDataList = await freeClassHelper.getDataForDailyGoal(obj);
            liveClassDataList = liveClassDataList.liveClass;
            if (liveClassDataList && Object.keys(liveClassDataList).length !== 0 && liveClassDataList.sugg && liveClassDataList.sugg.length !== 0) {
                liveClassDataList = liveClassDataList.sugg;
            }
        }

        if (liveClassDataList && liveClassDataList.length > 0) {
            const qids = liveClassDataList.map((x) => x.srcId.toString());
            const liveClassData = await LiveClassHelper.getLiveclassData(this.db, qids, parseInt(this.user.student_class));

            const finalData = [];
            liveClassDataList.forEach((x) => {
                const liveDetails = liveClassData.filter((y) => y.resource_reference == x.srcId);
                if (liveDetails.length > 0) {
                    x.duration = x._extras.duration;
                    x.resource_reference = x.srcId;
                    x.assortment_id = liveDetails[0].assortment_id;
                    x.live_at = x._extras.live_at;
                    x.display = x._extras.display;
                    x.expert_name = liveDetails[0].expert_name;
                    x.expert_image = liveDetails[0].expert_image;
                    x.class = x._extras.class;
                    x.subject = x._extras.subject;
                    x.is_free = x._extras.is_free;
                    x.stream_status = liveDetails[0].stream_status;
                    x.player_type = liveDetails[0].player_type;
                    x.meta_info = liveDetails[0].meta_info;
                    x.chapter = x._extras.chapter;

                    finalData.push(x);
                }
            });

            if (finalData.length > 0) {
                this.putAdditionalStaticData('FreeLive');
                const widgetObj = {
                    data: finalData,
                    paymentCardState: { isVip: false },
                    title: this.title.free_live,
                    studentLocale: obj.locale,
                    versionCode: obj.versionCode,
                    type: 'match_mpvp',
                };
                const widget = await WidgetHelper.homepageVideoWidgetWithoutTabs(widgetObj);
                const latestLiveClassFirst = _.orderBy(widget.items, ['data.live_at'], ['desc']);
                const dataListForElastic = [];
                latestLiveClassFirst.forEach((x) => dataListForElastic.push({ id: x.data.id, chapter: x.data.chapter }));
                // this.elasticSearchUserQuestionsInstance.updateLiveClassTabs('user-questions', this.query.question_id, dataListForElastic);
                widget.items = latestLiveClassFirst;
                return this.makeFreeLiveClassListResponse(widget);
            }
        }
        return {};
    }
}

module.exports = SrpWidgetManager;
