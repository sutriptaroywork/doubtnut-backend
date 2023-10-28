const _ = require('lodash');
const resultHelper = require('./result.helper');
const { getCourses } = require('../../v3/tesla/feed.helper');

async function testimonialWidgetVideo({ carousel, db, config }) {
    let video = [];
    if (!carousel.secondary_data) {
        return undefined;
    }
    video = await resultHelper.getVideoByQuestionId(db, carousel.secondary_data, config);
    return {
        type: 'widget_autoplay',
        data: {
            scroll_direction: 'vertical',
            auto_play: true,
            default_mute: false,
            auto_play_initiation: 100,
            items: [
                {
                    type: 'course_video',
                    data: {
                        title1: '',
                        state: 2,
                        disable_click: true,
                        title2: '',
                        top_title1: '',
                        question_id: carousel.secondary_data,
                        subject: '',
                        color: '',
                        page: '',
                        image_url: '',
                        live_at: 0,
                        live_date: '',
                        is_live: true,
                        card_width: '1',
                        card_ratio: '16:9',
                        auto_play: true,
                        default_mute: false,
                        auto_play_initiation: 100,
                        top_title: '',
                        image_bg_card: carousel.image_url,
                        video_resource: video[0],
                    },
                    extra_params: {
                        source: '',
                    },
                },
            ],
        },
    };
}

async function getResultStats({ db, carousel }) {
    if (!carousel.secondary_data) {
        return undefined;
    }
    const resultIds = carousel.secondary_data.split(',').map((id) => parseInt(id.trim()));
    const resultStatsData = await resultHelper.getResultDataById(db.mysql.read, resultIds);

    const resultStatsItems = resultStatsData.map((eachData) => ({
        id: 'SCHOLARSHIP_REGISTERED_BANNER',
        deeplink: eachData.deeplink,
        image_url: eachData.image_url,
    }));

    const obj = {
        widget_type: 'carousel_list',
        widget_data: {
            title: '',
            auto_scroll_time_in_sec: 3,
            full_width_cards: true,
            items: resultStatsItems,
        },
        layout_config: {
            margin_top: 2,
            margin_left: 0,
            margin_right: 0,
            margin_bottom: 0,
        },
        order: carousel.carousel_order,
    };
    return obj;
}

async function getToppersTestimonial({ carousel, db, config }) {
    if (!carousel.secondary_data) {
        return undefined;
    }
    const resultIds = carousel.secondary_data.split(',').map((id) => parseInt(id.trim()));
    const testimonialData = await resultHelper.getResultDataById(db.mysql.read, resultIds);
    const testimonials = await Promise.all(testimonialData.map((eachData) => resultHelper
        .getToppersTestimonialEach({
            eachData, db, config, carousel,
        })));

    const testimonialWidget = {
        widget_type: 'widget_toppers',
        widget_data: {
            title: 'Hear from Our Toppers',
            title_text_color: '#504949',
            title_text_size: '16',
            items: testimonials,
        },
        layout_config: {
            margin_top: 15,
            margin_left: 16,
            margin_right: 16,
            margin_bottom: 0,
        },
    };

    return testimonialWidget;
}

async function getBnbCarousel({
    carousel, studentId, locale, db, studentClass, versionCode, pznElasticSearchInstance, config,
}) {
    const coursesData = await getCourses(carousel, studentId, [], studentClass, locale, db, '', [], versionCode, [], [], '', pznElasticSearchInstance);
    let coursesItems = [];
    if (_.get(coursesData, 'widget_data.items', false)) {
        coursesItems = await Promise.all(coursesData.widget_data.items.map((courseDataItem) => resultHelper.getBnbData({
            db, carousel, courseDataItem, config,
        })));
    }

    const getCoursesWidget = {
        widget_type: 'widget_excel_courses_widget',
        widget_data: {
            title: 'Learn From our Courses and Excel in Exams!',
            title_text_color: '#504949',
            title_text_size: '15',
            items: coursesItems,
        },
        layout_config: {
            margin_top: 15,
            margin_left: 16,
            margin_right: 16,
            margin_bottom: 0,
        },
    };

    return getCoursesWidget;
}

async function getMoreToppersTestimonial({ carousel, db, config }) {
    if (!carousel.secondary_data) {
        return undefined;
    }
    const resultIds = carousel.secondary_data.split(',').map((id) => parseInt(id.trim()));
    const imagesData = await resultHelper.getResultDataById(db.mysql.read, resultIds);
    const bg_color = ['#5342d1', '#a28e25', '#c63636'];
    let color = 0;
    const imagesWidgetData = imagesData.map((eachData) => ({
        image1_url: eachData.image_url,
        image2_url: `${config.cdn_url}engagement_framework/FB0DA6C7-124B-1BCC-1053-3C95F8787337.webp`,
        name: eachData.name,
        name_size: '13',
        name_color: '#ffffff',
        roll: `Roll No:${eachData.roll_no}`,
        roll_size: '10',
        roll_color: '#ffffff',
        exam: `${eachData.title} ${eachData.year_exam}`,
        exam_size: '10',
        exam_color: '#ffffff',
        percentage: `${eachData.percentage} | Rank ${eachData.student_rank}`,
        percentage_size: '10',
        percentage_color: '#504949',
        icon_url: `${config.cdn_url}engagement_framework/179B60BA-B6A9-D228-FD76-3E03E5391ADD.webp`,
        id: `DN Id : ${eachData.student_id}`,
        id_size: '8',
        id_color: '#ffffff',
        background_color: '#a28e25',
        deeplink: '',
    }));
    for (let i = 0; i < imagesWidgetData.length; i++) {
        let bgColor = bg_color[color];
        if (i % 2 === 0) {
            color += 1;
            if (color >= bg_color.length) {
                color = 0;
            }
            bgColor = bg_color[color];
        }
        imagesWidgetData[i].background_color = bgColor;
    }
    const moreTestimonialWidget = {
        widget_type: 'widget_more_testimonials',
        widget_data: {
            title: 'Our Doubtnut Lions Roared in Exams',
            title_text_color: '#504949',
            title_text_size: '16',
            items: imagesWidgetData,
        },
        layout_config: {
            margin_top: 15,
            margin_left: 16,
            margin_right: 16,
            margin_bottom: 0,
        },
    };
    return moreTestimonialWidget;
}

const resultMapping = {
    testimonial_videos: testimonialWidgetVideo,
    result_stats: getResultStats,
    toppers_testimonial_video: getToppersTestimonial,
    bnb_carousels: getBnbCarousel,
    more_testimonials: getMoreToppersTestimonial,
};

async function resultPage(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { page } = req.query; // query will contain page, type and source
        const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
        const { student_id: studentId } = req.user;
        const { student_class: studentClass } = req.user;
        const { locale } = req.user;
        let { version_code: versionCode } = req.headers;
        if (!versionCode) {
            versionCode = 1000;
        }
        const pageTableMapping = {
            result: 'result_page_widgets', // if new table is added we make entry here
        };

        const carouselArray = await resultHelper.getResultPageData(db.mysql.read, studentClass, locale, pageTableMapping[page], config);
        const carouselsPromises = [];
        for (const carousel of carouselArray) {
            try {
                carouselsPromises.push(resultMapping[carousel.type]({
                    carousel, studentId, locale, db, config, studentClass, versionCode, pznElasticSearchInstance,
                }));
            } catch (err) {
                console.log(err);
            }
        }
        let carouselData = await Promise.allSettled(carouselsPromises);
        carouselData = carouselData.map((x) => x.value).filter((x) => {
            if (x) {
                return true;
            }
            return false;
        });

        const data = {
            title: 'Doubtnut Results 2022',
            title_text_size: '16',
            title_text_color: '#000000',
            widgets: carouselData,
            bottom_data: {
                title: 'I am interested in courses',
                title_text_size: '16',
                title_text_color: '#ffffff',
                bg_color: '#ea532c',
                deeplink: 'doubtnutapp://dialer?mobile=01247158250',
            },
        };

        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

module.exports = { resultPage };
