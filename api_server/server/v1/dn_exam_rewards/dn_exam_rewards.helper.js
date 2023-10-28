const puppeteer = require('puppeteer');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const base64 = require('base-64');
const dnExamHelper = require('../../../modules/mysql/dn_exam_rewards');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const Question = require('../../../modules/question');
const Answer = require('../../../modules/answer');
const AnswerMysql = require('../../../modules/mysql/answer');
const courseHelper = require('../../helpers/course');
const boardData = require('../../../data/data');

async function buildChangeExam(carouselData, db, examList, examId, locale, studentClass) {
    try {
        let flag = false;
        carouselData.tabs = [];
        const promises = [];
        for (let i = 0; i < examList.length; i++) {
            promises.push(dnExamHelper.getExamData(db.mysql.read, examList[i]));
        }
        const exams = await Promise.all(promises);
        for (let i = 0; i < exams.length; i++) {
            exams[i] = JSON.parse(JSON.stringify(exams[i]))[0];
            if (exams[i].id == examId) {
                flag = true;
                carouselData.tabs.push({ title: locale === 'hi' ? exams[i].hindi_display_name : exams[i].english_display_name, is_selected: true, examId: exams[i].id });
            } else {
                carouselData.tabs.push({ title: locale === 'hi' ? exams[i].hindi_display_name : exams[i].english_display_name, is_selected: false, examId: exams[i].id });
            }
        }

        if (flag === false && carouselData.tabs.length) {
            carouselData.tabs[0].is_selected = true;
        }
        carouselData.changeText = locale == 'hi' ? 'परीक्षा बदलें' : 'Change exam';
        return carouselData;
    } catch (e) {
        console.log(e);
        return {};
    }
}

function buildPrizeShortBanner(carouselData) {
    carouselData.banner_link = carouselData.banner_link.split('||');
    return carouselData;
}

function buildExamInfo(carouselData, examData, selectExam, locale) {
    carouselData.selectExam = selectExam;
    carouselData.registration_is_active = examData.registration_is_active;
    carouselData.application_number_is_active = examData.application_number_is_active;
    carouselData.admit_card_is_active = examData.admit_card_is_active;
    carouselData.result_is_active = examData.result_is_active;
    carouselData.faqText = locale == 'hi' ? 'सामान्य प्रश्न' : 'FAQs';
    carouselData.exampleText = locale == 'hi' ? 'उदाहरण . नीट (NEET)' : '(Eg NEET)';
    return carouselData;
}

function buildWhatsappShare(carouselData, versionCode, locale) {
    if (versionCode > 990) {
        carouselData.whatsapp_share_link = locale == 'hi' ? `doubtnutapp://share?message=आप भी बनो Doubtnut टॉपर रिवॉर्ड प्रोग्राम का हिस्सा और पाओ <इनाम> तक के इनाम जीतने का मौका
आज ही रजिस्टर करें --https://doubtnut.app.link/yWGUkCTMHob&image_url=https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/0DD28355-D096-032F-DEAD-2A403AB22D6F.webp&app_name=Whatsapp&package_name=com.whatsapp&skip_branch=true` : `doubtnutapp://share?message=Aap bhi bano Doubtnut Topper Reward program ka hissa, aur paao <reward> tak ke prizes jeetne ka mauka.
Aaj hi Register karein --https://doubtnut.app.link/yWGUkCTMHob&image_url=https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/0DD28355-D096-032F-DEAD-2A403AB22D6F.webp&app_name=Whatsapp&package_name=com.whatsapp&skip_branch=true`;
    } else {
        carouselData.whatsapp_share_message = locale == 'hi' ? `आप भी बनो Doubtnut टॉपर रिवॉर्ड प्रोग्राम का हिस्सा और पाओ <इनाम> तक के इनाम जीतने का मौका
आज ही रजिस्टर करें --https://doubtnut.app.link/yWGUkCTMHob` : `Aap bhi bano Doubtnut Topper Reward program ka hissa, aur paao <reward> tak ke prizes jeetne ka mauka.
Aaj hi Register karein --https://doubtnut.app.link/yWGUkCTMHob`;
    }
    carouselData.telegram_share_link = locale == 'hi' ? `https://t.me/share/url?url=https://tiny.doubtnut.com/8s4hxmdz&text=आप भी बनो Doubtnut टॉपर रिवॉर्ड प्रोग्राम का हिस्सा और पाओ <इनाम> तक के इनाम जीतने का मौका
आज ही रजिस्टर करें --https://doubtnut.app.link/OsnIo3YMHob` : `https://t.me/share/url?url=https://tiny.doubtnut.com/8s4hxmdz&text=Aap%20bhi%20bano%20Doubtnut%20Topper%20Reward%20program%20ka%20hissa%2C%20aur%20paao%20%3Creward%3E%20tak%20ke%20prizes%20jeetne%20ka%20mauka.%0AAaj%20hi%20Register%20karein%20--https%3A%2F%2Fdoubtnut.app.link%2FOsnIo3YMHob`;
    carouselData.telegram_share_message = locale == 'hi' ? `आप भी बनो Doubtnut टॉपर रिवॉर्ड प्रोग्राम का हिस्सा और पाओ <इनाम> तक के इनाम जीतने का मौका
आज ही रजिस्टर करें --https://doubtnut.app.link/OsnIo3YMHob` : `Aap bhi bano Doubtnut Topper Reward program ka hissa, aur paao <reward> tak ke prizes jeetne ka mauka.
Aaj hi Register karein --https://doubtnut.app.link/OsnIo3YMHob`;
    carouselData.invite_text = locale == 'hi' ? 'आमन्त्रित करें' : 'Invite';
    return carouselData;
}

async function buildResult(carouselData, db, locale = 'en', count = 3) {
    try {
        let testimonials = await dnExamHelper.getResultTesimonials(db.mysql.read, carouselData.id, locale, count + 1);
        if (testimonials.length > 3) {
            carouselData.view_more_text = locale == 'hi' ? 'और देखें' : 'View More';
            carouselData.view_less_text = locale == 'hi' ? 'कम देखें' : 'View Less';
            testimonials = testimonials.slice(0, 3);
        }
        const data = [];
        for (let i = 0; i < testimonials.length; i++) {
            const item = {};
            testimonials[i] = JSON.parse(JSON.stringify(testimonials[i]));
            item.student_exam_display_name = testimonials[i].student_exam_display_name;
            item.student_name = testimonials[i].student_name;
            item.student_photo = testimonials[i].student_photo;
            if (_.isNull(item.student_photo)) {
                item.student_photo = await dnExamHelper.getFromDNProperty(db.mysql.read, 'dn_exam_dummy_testimonial_photo', 'photo');
                item.student_photo = item.student_photo[0].value;
            }
            if (testimonials[i].marks != null) {
                item.value = locale == 'hi' ? `${testimonials[i].marks} अंक` : `${testimonials[i].marks} marks`;
            } else if (testimonials[i].district_rank != null) {
                item.value = locale == 'hi' ? `जिला पद ${testimonials[i].district_rank}` : `District Rank ${testimonials[i].district_rank}`;
            } else if (testimonials[i].state_rank != null) {
                item.value = locale == 'hi' ? `राज्य पद ${testimonials[i].state_rank}` : `State Rank ${testimonials[i].state_rank}`;
            } else if (testimonials[i].other_rank != null) {
                item.value = locale == 'hi' ? `${testimonials[i].other_rank} पद` : `${testimonials[i].other_rank} rank`;
            } else if (testimonials[i].percentage != null) {
                item.value = `${testimonials[i].percentage}%`;
            } else if (testimonials[i].percentile != null) {
                item.value = `${testimonials[i].percentile}%ile`;
            } else if (testimonials[i].AIR != null) {
                item.value = `AIR ${testimonials[i].AIR}`;
            }
            data.push(item);
        }
        carouselData.testimonials = data;
        return carouselData;
    } catch (e) {
        console.log(e);
        return {};
    }
}

async function buildVideoTextTestimonial(carouselData, db, config, locale = 'en', count = 3) {
    try {
        const testimonials = await dnExamHelper.getResultTesimonials(db.mysql.read, carouselData.id, locale, count);
        const data = [];
        for (let i = 0; i < testimonials.length; i++) {
            const item = {};
            testimonials[i] = JSON.parse(JSON.stringify(testimonials[i]));
            item.student_exam_display_name = testimonials[i].student_exam_display_name;
            item.student_name = testimonials[i].student_name;
            const values = await dnExamHelper.getQuestionData(db.mysql.read, testimonials[i].video_testimonial);
            if (values.length) {
                item.video_testimonial = `${config.cdn_video_url}${values[0].answer_video}`;
                item.text_testimonial = testimonials[i].text_testimonial;
            }
            item.testimonial_thumbnail = `${config.cdn_url}q-thumbnail/${values[0].question_image}`;
            item.value = [];
            if (testimonials[i].marks != null) {
                item.value.push(locale == 'hi' ? `${testimonials[i].marks} अंक` : `${testimonials[i].marks} marks`);
            }
            if (testimonials[i].district_rank != null) {
                item.value.push(locale == 'hi' ? `जिला पद ${testimonials[i].district_rank}` : `District Rank ${testimonials[i].district_rank}`);
            }
            if (testimonials[i].state_rank != null) {
                item.value.push(locale == 'hi' ? `राज्य पद ${testimonials[i].state_rank}` : `State Rank ${testimonials[i].state_rank}`);
            }
            if (testimonials[i].other_rank != null) {
                item.value.push(locale == 'hi' ? `${testimonials[i].other_rank} पद` : `${testimonials[i].other_rank} rank`);
            }
            if (testimonials[i].percentage != null) {
                item.value.push(`${testimonials[i].percentage}%`);
            }
            if (testimonials[i].percentile != null) {
                item.value.push(`${testimonials[i].percentile}%ile`);
            }
            if (testimonials[i].AIR != null) {
                item.value.push(`AIR ${testimonials[i].AIR}`);
            }
            if (item.length > 2) {
                item.value = item.value.slice(0, 2);
            }
            data.push(item);
        }
        carouselData.testimonials = data;
        return carouselData;
    } catch (e) {
        console.log(e);
        return {};
    }
}

async function viewMoreResult(db, carouselId, locale, config) {
    try {
        const testimonials = await dnExamHelper.getResultTesimonials(db.mysql.read, carouselId, locale, -1);
        const data = [];
        for (let i = 0; i < testimonials.length; i++) {
            const item = {};
            testimonials[i] = JSON.parse(JSON.stringify(testimonials[i]));
            item.student_exam_display_name = testimonials[i].student_exam_display_name;
            item.student_name = testimonials[i].student_name;
            item.student_photo = testimonials[i].student_photo;
            if (_.isNull(item.student_photo)) {
                item.student_photo = await dnExamHelper.getFromDNProperty(db.mysql.read, 'dn_exam_dummy_testimonial_photo', 'photo');
                item.student_photo = item.student_photo[0].value;
            }
            if (testimonials[i].marks != null) {
                item.value = locale == 'hi' ? `${testimonials[i].marks} अंक` : `${testimonials[i].marks} marks`;
            } else if (testimonials[i].district_rank != null) {
                item.value = locale == 'hi' ? `जिला पद ${testimonials[i].district_rank}` : `District Rank ${testimonials[i].district_rank}`;
            } else if (testimonials[i].state_rank != null) {
                item.value = locale == 'hi' ? `राज्य पद ${testimonials[i].state_rank}` : `State Rank ${testimonials[i].state_rank}`;
            } else if (testimonials[i].other_rank != null) {
                item.value = locale == 'hi' ? `${testimonials[i].other_rank} पद` : `${testimonials[i].other_rank} rank`;
            } else if (testimonials[i].percentage != null) {
                item.value = `${testimonials[i].percentage}%`;
            } else if (testimonials[i].percentile != null) {
                item.value = `${testimonials[i].percentile}%ile`;
            } else if (testimonials[i].AIR != null) {
                item.value = `AIR ${testimonials[i].AIR}`;
            }
            item.text_testimonial = testimonials[i].text_testimonial;
            item.state = testimonials[i].state;
            const values = await dnExamHelper.getQuestionData(db.mysql.read, testimonials[i].video_testimonial);
            if (values.length) {
                item.video_testimonial = `${config.cdn_video_url}${values[0].answer_video}`;
                item.testimonial_thumbnail = `${config.cdn_url}q-thumbnail/${values[0].question_image}`;
            }
            data.push(item);
        }
        return data;
    } catch (e) {
        console.log(e);
        return {};
    }
}

async function viewMoreVideoText(db, carouselId, locale, config) {
    try {
        const testimonials = await dnExamHelper.getResultTesimonials(db.mysql.read, carouselId, locale, -1);
        const data = [];
        for (let i = 0; i < testimonials.length; i++) {
            const item = {};
            testimonials[i] = JSON.parse(JSON.stringify(testimonials[i]));
            const values = await dnExamHelper.getQuestionData(db.mysql.read, item.video_testimonial);
            if (values.length) {
                item.testimonial_thumbnail = `${config.cdn_url}q-thumbnail/${values[0].question_image}`;
                item.video_testimonial = `${config.cdn_video_url}${values[0].answer_video}`;
            }
            item.student_name = testimonials[i].student_name;
            item.text_testimonial = testimonials[i].text_testimonial;
            item.state = testimonials[i].state;
            data.push(item);
        }
        return data;
    } catch (e) {
        console.log(e);
        return {};
    }
}

function generateWhatsappMessages(form, versionCode, studentData, reward, english_display_name, hindi_display_name, config, bannerImage, locale) {
    if (versionCode > 990) {
        form.shareLink = locale == 'hi' ? `doubtnutapp://share?message=बधाई हो ! ${studentData.student_name}
${studentData.student_name} को ${hindi_display_name} में ${studentData.all_india_rank} लाने पर Doubtnut द्वारा Rs. ${reward.cash_reward} से सम्मानित किया गया है।
अगर आप भी रोमांचक इनाम जीतना चाहते हैं तो आज ही Doubtnut टॉपर रिवॉर्ड प्रोग्राम से जुड़े
रजिस्टर करने के लिए यहां क्लिक करें-- https://doubtnut.app.link/AgGJbgnb0ob&image_url=${config.cdn_url}${bannerImage}&app_name=Whatsapp&package_name=com.whatsapp&skip_branch=true` : `doubtnutapp://share?message=Congratulations ${studentData.student_name}
${studentData.student_name} has been awarded Rs. ${reward.cash_reward} on scoring AIR ${studentData.all_india_rank} in ${english_display_name}
Agar aap bhi exciting Prizes jeetna chahte hain to aaj hi Doubtnut Topper Reward Program join karein Click here to register👉 --&https://doubtnut.app.link/AgGJbgnb0ob&image_url=${config.cdn_url}${bannerImage}&app_name=Whatsapp&package_name=com.whatsapp&skip_branch=true`;
        if (reward.merchandise_category) {
            form.shareLink = locale == 'hi' ? `doubtnutapp://share?message=बधाई हो ! ${studentData.student_name}
${studentData.student_name} को ${hindi_display_name} में ${studentData.all_india_rank} लाने पर Doubtnut द्वारा ${reward.merchandise_category} से सम्मानित किया गया है।
अगर आप भी रोमांचक इनाम जीतना चाहते हैं तो आज ही Doubtnut टॉपर रिवॉर्ड प्रोग्राम से जुड़े
रजिस्टर करने के लिए यहां क्लिक करें-- https://doubtnut.app.link/AgGJbgnb0ob&image_url=${config.cdn_url}${bannerImage}&app_name=Whatsapp&package_name=com.whatsapp&skip_branch=true` : `doubtnutapp://share?message=Congratulations ${studentData.student_name}
${studentData.student_name} has been awarded ${reward.merchandise_category} on scoring AIR ${studentData.all_india_rank} in ${english_display_name}
Agar aap bhi exciting Prizes jeetna chahte hain to aaj hi Doubtnut Topper Reward Program join karein Click here to register👉 --&https://doubtnut.app.link/AgGJbgnb0ob&image_url=${config.cdn_url}${bannerImage}&app_name=Whatsapp&package_name=com.whatsapp&skip_branch=true`;
        }
    } else {
        form.shareMessage = locale == 'hi' ? `बधाई हो ! ${studentData.student_name}
${studentData.student_name} को ${hindi_display_name} में ${studentData.all_india_rank} लाने पर Doubtnut द्वारा ${reward.merchandise_category} से सम्मानित किया गया है।
अगर आप भी रोमांचक इनाम जीतना चाहते हैं तो आज ही Doubtnut टॉपर रिवॉर्ड प्रोग्राम से जुड़े
रजिस्टर करने के लिए यहां क्लिक करें-- https://doubtnut.app.link/AgGJbgnb0ob` : `Congratulations ${studentData.student_name}
        ${studentData.student_name} has been awarded ${reward.merchandise_category} on scoring AIR ${studentData.all_india_rank} in ${english_display_name}
Agar aap bhi exciting Prizes jeetna chahte hain to aaj hi Doubtnut Topper Reward Program join karein Click here to register👉 --&https://doubtnut.app.link/AgGJbgnb0ob`;
        if (reward.cash_reward) {
            form.shareMessage = locale == 'hi' ? `बधाई हो ! ${studentData.student_name}
${studentData.student_name} को ${hindi_display_name} में ${studentData.all_india_rank} लाने पर Doubtnut द्वारा Rs. ${reward.cash_reward} से सम्मानित किया गया है।
अगर आप भी रोमांचक इनाम जीतना चाहते हैं तो आज ही Doubtnut टॉपर रिवॉर्ड प्रोग्राम से जुड़े
रजिस्टर करने के लिए यहां क्लिक करें-- https://doubtnut.app.link/AgGJbgnb0ob` : `Congratulations ${studentData.student_name}
${studentData.student_name} has been awarded Rs. ${reward.cash_reward} on scoring AIR ${studentData.all_india_rank} in ${english_display_name}
Agar aap bhi exciting Prizes jeetna chahte hain to aaj hi Doubtnut Topper Reward Program join karein Click here to register👉 --&https://doubtnut.app.link/AgGJbgnb0ob`;
        }
    }
    return form;
}

function getRegistrationSuccess(hindi_display_name, english_display_name, locale) {
    return { message: locale == 'hi' ? `Topper Reward Program ${hindi_display_name} के लिए आप सफलतापूर्वक रजिस्टर हो चुके हैं` : `You are successfully registered for ${english_display_name} Topper Reward Program`, sticky_title: locale == 'hi' ? 'Doubtnut के बेस्ट कोर्स चेक करें' : 'Check Best courses By Doubtnut' };
}

function getRegistrationForm(locale, studentData, upload_photo_video, config, hindi_display_name, english_display_name, end) {
    const form = {
        successMessage: studentData.student_photo ? getRegistrationSuccess(hindi_display_name, english_display_name, locale) : null,
        form: {
            student_name: {
                type: 'textbox', name: locale == 'hi' ? 'अपना पूरा नाम भरें' : 'Enter your full name', value: studentData.student_name, limit: 100, priority: 1, dataType: 'text',
            },
            date_of_birth: {
                type: 'date', name: locale == 'hi' ? 'अपनी जन्म की तारीख़ भरें' : 'Date of Birth', value: studentData.date_of_birth ? moment(studentData.date_of_birth).format('YYYY-MM-DD') : null, priority: 2,
            },
            student_photo: {
                type: 'image', name: locale == 'hi' ? 'अपनी फ़ोटो अपलोड करे' : 'Upload your photo', value: studentData.student_photo, cdn_url: config.cdn_url, source: 'register', priority: 3,
            },
        },
        button_text: locale == 'hi' ? 'रजिस्टर' : 'Register',
    };
    if (upload_photo_video) {
        form.form.student_photo.tutorialText = locale == 'hi' ? 'अपनी फ़ोटो कैसे अपलोड करें' : 'Apni photo kaise upload karein';
        form.form.student_photo.tutorialLink = `${config.cdn_video_url}${upload_photo_video.answer_video}`;
        form.form.student_photo.tutorialThumbnail = `${config.cdn_url}${upload_photo_video.question_image}`;
    }
    return form;
}

function getApplicationSuccess(hindi_display_name, english_display_name, locale) {
    return { message: locale == 'hi' ? `आपने ${hindi_display_name} के लिए एप्लीकेशन फॉर्म सफलतापूर्वक जमा कर दिया है` : `You  successfully uploaded your application form for ${english_display_name}\n You will be notified when result is out`, sticky_title: locale == 'hi' ? 'Doubtnut के बेस्ट कोर्स चेक करें' : 'Check Best courses By Doubtnut' };
}

function getApplicationForm(locale, studentData, upload_application_form_video, download_application_form_link, config, hindi_display_name, english_display_name, end) {
    const form = {
        successMessage: studentData.application_number ? getApplicationSuccess(hindi_display_name, english_display_name, locale) : null,
        form: {
            application_number: {
                type: 'textbox', name: locale == 'hi' ? 'आवेदन पत्र का नंबर भरें' : 'Enter Application number', value: studentData.application_number, limit: 100, priority: 4, dataType: 'alphanumeric',
            },
            application_photo_url: {
                type: 'image', name: locale == 'hi' ? 'आवेदन पत्र की फोटो अपलोड करें' : 'Upload application photo', value: studentData.application_photo_url, cdn_url: config.cdn_url, source: 'application', priority: 5,
            },
        },
        button_text: locale == 'hi' ? 'जमा कर दें' : 'Submit',
    };
    if (upload_application_form_video) {
        form.form.application_photo_url.tutorialText = locale == 'hi' ? 'आवेदन पत्र की फोटो कैसे अपलोड करें' : 'Application photo kaise upload karein';
        form.form.application_photo_url.tutorialLink = `${config.cdn_video_url}${upload_application_form_video.answer_video}`;
        form.form.application_photo_url.tutorialThumbnail = `${config.cdn_url}${upload_application_form_video.question_image}`;
    }
    if (download_application_form_link) {
        form.form.application_photo_url.downloadText = locale == 'hi' ? 'अपना आवेदन पत्र डाउनलोड करने के लिए यहां क्लिक करें' : 'Click here to download your application';
        form.form.application_photo_url.downloadLink = download_application_form_link;
    }
    return form;
}

function getAdmitSuccess(hindi_display_name, english_display_name, locale) {
    return { message: locale == 'hi' ? `आपने ${hindi_display_name} के लिए सफलतापूर्वक एडमिट कार्ड जमा कर दिया है` : `You  successfully uploaded your admit card for ${english_display_name}\n You will be notified when result is out`, sticky_title: locale == 'hi' ? 'Doubtnut के बेस्ट कोर्स चेक करें' : 'Check Best courses By Doubtnut' };
}

function getAdmitForm(locale, studentData, upload_admit_card_video, download_admit_card_link, config, hindi_display_name, english_display_name, end) {
    const form = {
        successMessage: studentData.admit_card_photo_url ? getAdmitSuccess(hindi_display_name, english_display_name, locale) : null,
        form: {
            admit_card_photo_url: {
                type: 'image', name: locale == 'hi' ? 'एडमिट कार्ड अपलोड करें' : 'Upload Admit Card', value: studentData.admit_card_photo_url, cdn_url: config.cdn_url, source: 'admit', priority: 6,
            },
        },
        button_text: locale == 'hi' ? 'जमा कर दें' : 'Submit',
    };
    if (upload_admit_card_video) {
        form.form.admit_card_photo_url.tutorialText = locale == 'hi' ? 'एडमिट कार्ड की फ़ोटो कैसे अपलोड करें' : 'Admit Card ki photo kaise upload karein';
        form.form.admit_card_photo_url.tutorialLink = `${config.cdn_video_url}${upload_admit_card_video.answer_video}`;
        form.form.admit_card_photo_url.tutorialThumbnail = `${config.cdn_url}${upload_admit_card_video.question_image}`;
    }
    if (download_admit_card_link) {
        form.form.admit_card_photo_url.downloadText = locale == 'hi' ? 'अपना एडमिट कार्ड  डाउनलोड करने के लिए यहां क्लिक करें' : 'Click here to download your Admit card';
        form.form.admit_card_photo_url.downloadLink = download_admit_card_link;
    }
    return form;
}

function getResultSuccess(hindi_display_name, english_display_name, locale) {
    return { message: locale == 'hi' ? `आपने ${hindi_display_name} के लिए सफलतापूर्वक परिणाम जमा कर दिया है` : `You have successfully submitted your Result for ${english_display_name}`, sticky_title: locale == 'hi' ? 'Doubtnut के बेस्ट कोर्स चेक करें' : 'Check Best courses By Doubtnut' };
}

function getResultForm(locale, studentData, upload_result_video, download_result_link, marksScoredAvailable, percentageAvailable, percentileAvailable, gradeAvailable, airAvailable, stateRankAvailable, districtRankAvailable, categoryAvailable, otherRankAvailable, resultVerified, config, hindi_display_name, english_display_name, end) {
    const formData = {};
    if (marksScoredAvailable) {
        formData.marks = {
            type: 'textbox', name: locale == 'hi' ? 'कुल अंक' : 'Total marks scored', value: studentData.marks, limit: 100, priority: 7, dataType: 'numeric',
        };
    }
    if (percentageAvailable) {
        formData.percentage = {
            type: 'textbox', name: locale == 'hi' ? 'अपना प्रतिशत भरें' : 'Enter your percentage', value: studentData.percentage, limit: 100, priority: 8, dataType: 'float',
        };
    }
    if (percentileAvailable) {
        formData.percentile = {
            type: 'textbox', name: locale == 'hi' ? 'अपना प्रतिशतता भरें' : 'Enter your percentile', value: studentData.percentile, limit: 100, priority: 9, dataType: 'float',
        };
    }
    if (gradeAvailable) {
        formData.grade = {
            type: 'textbox', name: locale == 'hi' ? 'अपना ग्रेड भरें' : 'Enter your grade', value: studentData.grade, limit: 100, priority: 10, dataType: 'numeric',
        };
    }
    if (airAvailable) {
        formData.all_india_rank = {
            type: 'textbox', name: locale == 'hi' ? 'अपना एआईआर/AIR भरें' : 'Enter your AIR', value: studentData.all_india_rank, limit: 100, priority: 11, dataType: 'numeric',
        };
    }
    if (stateRankAvailable) {
        formData.state_rank = {
            type: 'textbox', name: locale == 'hi' ? 'अपना राज्य रैंक भरें' : 'Enter your state rank', value: studentData.state_rank, limit: 100, priority: 12, dataType: 'numeric',
        };
    }
    if (districtRankAvailable) {
        formData.district_rank = {
            type: 'textbox', name: locale == 'hi' ? 'अपना जिला रैंक भरें' : 'Enter your district rank', value: studentData.district_rank, limit: 100, priority: 13, dataType: 'numeric',
        };
    }
    if (categoryAvailable) {
        formData.category_rank = {
            type: 'textbox', name: locale == 'hi' ? 'अपनी श्रेणी की रैंक भरें ( एसएसी, एसटी, ओबीसी, अन्य)' : 'Enter your Category rank (SC,ST,OBC, Others)', value: studentData.category_rank, limit: 100, priority: 14, dataType: 'numeric',
        };
    }
    if (otherRankAvailable) {
        formData.other_rank = {
            type: 'textbox', name: locale == 'hi' ? 'अपने अन्य रैंक भरें' : 'Enter your other Ranks', value: studentData.other_rank, limit: 100, priority: 15, dataType: 'numeric',
        };
        formData.other_rank_comment = {
            type: 'textbox', name: locale == 'hi' ? 'अन्य प्रकार की रैंक भरें' : 'Enter other Rank type', value: studentData.other_rank_comment, limit: 100, priority: 16, dataType: 'text',
        };
    }
    formData.result_photo_url = {
        type: 'image', name: locale == 'hi' ? 'अपना परिणाम अपलोड करें' : 'Upload Your Result', value: studentData.result_photo_url, cdn_url: config.cdn_url, source: 'result', priority: 17,
    };
    const form = {
        successMessage: studentData.result_photo_url ? getResultSuccess(hindi_display_name, english_display_name, locale) : null,
        button_text: locale == 'hi' ? 'जमा कर दें' : 'Submit',
        form: formData,
        resultVerified: resultVerified == 2 ? 'Upload result again' : null,

    };
    if (upload_result_video) {
        form.form.result_photo_url.tutorialText = locale == 'hi' ? 'आवेदन पत्र की फोटो कैसे अपलोड करें' : 'Result ki photo kaise upload karein';
        form.form.result_photo_url.tutorialLink = `${config.cdn_video_url}${upload_result_video.answer_video}`;
        form.form.result_photo_url.tutorialThumbnail = `${config.cdn_url}${upload_result_video.question_image}`;
    }

    if (download_result_link) {
        form.form.result_photo_url.downloadText = locale == 'hi' ? 'अपना रिजल्ट डाउनलोड करने के लिए यहां क्लिक करें' : 'Click here to download your Result';
        form.form.result_photo_url.downloadLink = download_result_link;
    }
    return form;
}

function getTestimonialSuccess(hindi_display_name, english_display_name, locale, reward, resultVerified) {
    if (resultVerified && reward && reward.merchandise_category) {
        return { message: locale == 'hi' ? 'आपने सफलतापूर्वक अपना वितरण पता अपलोड कर दिया है' : 'You have successfully Uploaded your delivery address', sticky_title: locale == 'hi' ? 'Doubtnut के बेस्ट कोर्स चेक करें' : 'Check Best courses By Doubtnut' };
    }
    if (resultVerified && reward && reward.cash_reward) {
        return { message: locale == 'hi' ? 'आपने सफलतापूर्वक अपने बैंक खाते की जानकारी अपलोड कर दी है' : 'You have successfully Uploaded your Bank Account Details', sticky_title: locale == 'hi' ? 'Doubtnut के बेस्ट कोर्स चेक करें' : 'Check Best courses By Doubtnut' };
    }
    return { message: locale == 'hi' ? `आपने ${hindi_display_name} के लिए सफलतापूर्वक अपनी वीडियो अपलोड कर दी है` : `You  successfully uploaded your video for ${english_display_name}`, sticky_title: locale == 'hi' ? 'Doubtnut के बेस्ट कोर्स चेक करें' : 'Check Best courses By Doubtnut' };
}

function getTestimonialForm(locale, studentData, upload_testimonial_video, bannerImage, hindi_display_name, english_display_name, reward, config, end, versionCode) {
    if (studentData.video_testimonial_qid && studentData.result_verified) {
        if (studentData.is_address_filled && ((studentData.shirt_size && studentData.mobile && studentData.address_line_1 && studentData.address_line_2 && studentData.address_line_3 && studentData.city && studentData.state && studentData.pincode) || (studentData.account_holder_name && studentData.account_number && studentData.IFSC_code))) {
            let form = {
                successMessage: getTestimonialSuccess(hindi_display_name, english_display_name, locale, reward, 1),
                bannerImage: `${config.cdn_url}${bannerImage}`,
                bannerText: locale == 'hi' ? 'अपने दोस्तों और परिवार के साथ शेयर करें' : 'Share with Friends and family',
            };
            form = generateWhatsappMessages(form, versionCode, studentData, reward, english_display_name, hindi_display_name, config, bannerImage, locale);
            return form;
        }
        if (reward.merchandise_category) {
            let form = {
                successMessage: studentData.shirt_size ? getTestimonialSuccess(hindi_display_name, english_display_name, locale, reward, studentData.result_verified) : null,
                form: {
                    shirt_size: {
                        type: 'options', name: locale == 'hi' ? 'अपना size भरें' : 'Enter your Size', value: studentData.shirt_size, options: ['S', 'M', 'L', 'XL'], priority: 18,
                    },
                    address_student_name: {
                        type: 'textbox', name: locale == 'hi' ? 'अपना पूरा नाम भरें' : 'Enter your Full Name', value: studentData.address_student_name, limit: 100, priority: 19, dataType: 'text',
                    },
                    mobile: {
                        type: 'textbox', name: locale == 'hi' ? 'अपना मोबाइल नंबर भरें' : 'Enter your Mobile number', value: studentData.mobile, limit: 10, priority: 20, dataType: 'numeric',
                    },
                    address_line_1: {
                        type: 'textbox', name: locale == 'hi' ? 'मकान नंबर, बिल्डिंग/भवन का नाम' : 'Flat House no. ,Building name', value: studentData.address_line_1, limit: 100, priority: 21, dataType: 'text',
                    },
                    address_line_2: {
                        type: 'textbox', name: locale == 'hi' ? 'गली, सेक्टर, गांव' : 'Area Street , Sector , Village', value: studentData.address_line_2, limit: 100, priority: 22, dataType: 'text',
                    },
                    address_line_3: {
                        type: 'textbox', name: locale == 'hi' ? 'भूमि चिन' : 'Landmark', value: studentData.address_line_3, limit: 100, priority: 23, dataType: 'text',
                    },
                    city: {
                        type: 'textbox', name: locale == 'hi' ? 'कस्बा/शहर/गांव' : 'Town/City/Village', value: studentData.city, limit: 100, priority: 24, dataType: 'text',
                    },
                    state: {
                        type: 'textbox', name: locale == 'hi' ? 'राज्य चुनें' : 'Select State', value: studentData.state, limit: 100, priority: 25, dataType: 'text',
                    },
                    pincode: {
                        type: 'textbox', name: locale == 'hi' ? 'अपना पिनकोड भरें' : 'Enter your Pincode', value: studentData.pincode, limit: 100, priority: 26, dataType: 'numeric',
                    },
                },
                bannerImage: `${config.cdn_url}${bannerImage}`,
                bannerText: locale == 'hi' ? 'अपने दोस्तों और परिवार के साथ शेयर करें' : 'Share with Friends and family',
                title: 'Select your shirt size',
                congratsMessage: 'Congratulations',
                button_text: locale == 'hi' ? 'जमा कर दें' : 'Submit',
            };
            form = generateWhatsappMessages(form, versionCode, studentData, reward, english_display_name, hindi_display_name, config, bannerImage, locale);
            return form;
        }
        if (reward.cash_reward) {
            let form = {
                successMessage: studentData.video_testimonial_qid && studentData.account_holder_name ? getTestimonialSuccess(hindi_display_name, english_display_name, locale, reward, studentData.result_verified) : null,
                form: {
                    account_holder_name: {
                        type: 'textbox', name: locale == 'hi' ? 'खाताधारक का नाम' : 'Account holder name', value: studentData.account_holder_name, limit: 100, priority: 27, dataType: 'alphanumeric',
                    },
                    account_number: {
                        type: 'textbox', name: locale == 'hi' ? 'खाता नंबर' : 'Account number', value: studentData.account_number, limit: 100, priority: 28, dataType: 'alphanumeric',
                    },
                    IFSC_code: {
                        type: 'textbox', name: locale == 'hi' ? 'बैंक का आईएफएससी/IFSC code' : 'Bank IFSC code', value: studentData.IFSC_code, limit: 100, priority: 29, dataType: 'alphanumeric',
                    },
                },
                bannerImage: `${config.cdn_url}${bannerImage}`,
                bannerText: locale == 'hi' ? 'अपने दोस्तों और परिवार के साथ शेयर करें' : 'Share with Friends and family',
                shareMessage: `${studentData.student_name} has been awarded ${reward.cash_reward} cash on scoring AIR ${studentData.all_india_rank} in ${english_display_name}`,
                congratsMessage: 'Congratulations',
                button_text: locale == 'hi' ? 'जमा कर दें' : 'Submit',
            };
            form = generateWhatsappMessages(form, versionCode, studentData, reward, english_display_name, hindi_display_name, config, bannerImage, locale);
            return form;
        }
    }
    const form = {
        successMessage: studentData.video_testimonial_qid ? getTestimonialSuccess(hindi_display_name, english_display_name, locale, reward, studentData.result_verified) : null,
        form: {
            video_testimonial_qid: {
                type: 'video', name: locale == 'hi' ? 'अन्य छात्रों के लिए अपना वीडियो अपलोड करें' : 'Upload your video for other students', value: studentData.video_testimonial_qid, cdn_url: config.cdn_video_url, source: 'testimonial', tutorialText: locale == 'hi' ? 'अपनी वीडियो कैसे अपलोड करें' : 'Apni video kaise upload karein', priority: 30,
            },
            text_testimonial: {
                type: 'text', name: locale == 'hi' ? 'Doubtnut के साथ आपका अनुभव कैसा रहा, लिखें' : 'Write down your experience with Doubtnut', value: studentData.text_testimonial, limit: 500, priority: 31,
            },
        },
        button_text: locale == 'hi' ? 'जमा कर दें' : 'Submit',
    };
    if (upload_testimonial_video) {
        form.form.video_testimonial_qid.tutorialThumbnail = `${config.cdn_url}${upload_testimonial_video.question_image}`;
        form.form.video_testimonial_qid.tutorialLink = `${config.cdn_video_url}${upload_testimonial_video.answer_video}`;
    }
    return form;
}

function mergeTabs(tabs, a, b) {
    if (tabs[a] == null || tabs[b] == null) {
        if (tabs[a] == null) {
            tabs.splice(a, 1);
        }
        b--;
        if (tabs[b] == null) {
            tabs.splice(b, 1);
        }
        return tabs;
    }
    if (tabs[a] && tabs[b]) {
        tabs[b].form.form = { ...tabs[a].form.form, ...tabs[b].form.form };
        // tabs[b].isSelected = tabs[a].isSelected;
        tabs.splice(a, 1);
    }
    return tabs;
}

async function replaceTemp(template, config, data, reward, examData) {
    template = template.replace('studentName', data.student_name).replace('examName', examData.english_display_name).replace('examName', examData.english_display_name).replace('studentPercentile', data.percentile)
        .replace('studentAIR', data.all_india_rank)
        .replace('studentPhoto', `${config.cdn_url}${data.student_photo}`);
    if (reward.cash_reward) {
        template = template.replace('studentReward', `${reward.cash_reward} cash`);
    } else {
        template = template.replace('studentReward', reward.merchandise_category);
    }
    return template;
}

async function addResource(db, videoTestimonial, studentClass) {
    try {
        let resource = '';
        let answerId = 0;
        let questionId = 0;
        let videoType = 'BLOB';
        const question = {};
        question.student_id = 81;
        question.class = studentClass;
        question.subject = '';
        question.question = '';
        question.ocr_text = 'DN_EXAM_REWARD_VIDEO';
        question.original_ocr_text = 'DN_EXAM_REWARD_VIDEO';
        question.book = 'DN_EXAM_REWARDS';
        question.chapter = '';
        question.is_answered = 0;
        question.doubt = videoTestimonial;
        const questionResult = await Question.addQuestion(question, db.mysql.write);
        questionId = questionResult.insertId;
        // generate answer
        const answer = {};
        answer.expert_id = 81;
        answer.question_id = questionId.toString();
        answer.answer_video = question.doubt;
        answer.youtube_id = '';
        // generate answer
        const answerResult = await Answer.addSearchedAnswer(answer, db.mysql.write);
        answerId = answerResult.insertId;
        videoType = 'BLOB';
        resource = videoTestimonial;
        const answerVideoResource = {
            answer_id: answerId,
            resource,
            resource_type: videoType,
            resource_order: 1,
            is_active: 1,
        };
        await AnswerMysql.addAnswerVideoResource(db.mysql.write, answerVideoResource);

        return questionId;
    } catch (e) {
        console.log(e);
    }
}

function getStudentEmptyData(studentId) {
    return {
        student_id: studentId,
        student_name: null,
        address_student_name: null,
        student_photo: null,
        student_photo_verified: null,
        date_of_birth: null,
        address_line_1: null,
        address_line_2: null,
        address_line_3: null,
        account_number: null,
        account_holder_name: null,
        IFSC_code: null,
        shirt_size: null,
        dn_exam_id: null,
        application_number: null,
        application_photo_url: null,
        application_verified: null,
        application_reject_reason: null,
        admit_card_photo_url: null,
        admit_card_verified: null,
        admit_card_reject_reason: null,
        result_photo_url: null,
        marks: null,
        percentage: null,
        percentile: null,
        grade: null,
        all_india_rank: null,
        state_rank: null,
        district_rank: null,
        category_rank: null,
        other_rank: null,
        other_rank_comment: null,
        result_verified: null,
        result_reject_reason: null,
        text_testimonial: null,
        video_testimonial_qid: null,
        testimonial_verified: null,
        testimonial_reject_reason: null,
        rewards: null,
        testimonial_is_show: null,
        result_image: null,
    };
}

function uploadSpecificImageToS3(s3, upload, file) {
    s3.putObject({
        Bucket: 'doubtnut-static',
        Key: file,
        Body: upload,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
    // eslint-disable-next-line no-unused-vars
    }, (err, resp) => {
        if (err) {
            console.log(err);
        }
    });
}

async function generateTemplateImage(s3, config, filename, data, examData, reward) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    let template = await fs.readFileAsync(reward.share_result_template, 'utf8');
    template = await replaceTemp(template, config, data, reward, examData);
    await page.setContent(template);
    await page.setViewport({
        width: 800,
        height: 500,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const image = await page.screenshot({ type: 'jpeg' });
    await page.close();
    await browser.close();
    uploadSpecificImageToS3(s3, image, filename);
}

async function getCourseData(db, studentClass, config, versionCode, studentId, locale, xAuthToken) {
    const page = 'SCHOLARSHIP_PAGE';
    const assortmentList = [];
    const studentCcmAssortments = [];
    let data = [];
    const assortmentID = [];

    let studentCcmData = await CourseMysqlV2.getCoursesClassCourseMapping(db.mysql.read, studentId);
    studentCcmData = studentCcmData.filter((item) => boardData.boards.includes(item.course));
    const assortment1 = await courseHelper.getAssortmentByCategory(db, studentCcmData, studentClass, locale);
    assortmentID.push(assortment1.toString());
    const locale2 = (locale === 'hi') ? 'en' : 'hi';
    const assortment2 = await courseHelper.getAssortmentByCategory(db, studentCcmData, studentClass, locale2);
    assortmentID.push(assortment2.toString());
    data = await CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, assortmentID, studentClass);
    const courseAssortment = [];
    const subjectAssortment = [];
    let subjectCourses = [];
    if (data && data[0]) {
        data.forEach((item) => {
            courseAssortment.push(item.assortment_id);
        });
        for (let i = 0; i < courseAssortment.length; i++) {
            if (courseAssortment[i] !== 248266 && courseAssortment[i] !== 248265 && courseAssortment[i] !== 273538 && courseAssortment[i] !== 273539 && !data[i].created_by.includes('ETOOS')) {
                // eslint-disable-next-line no-await-in-loop
                const subjects = await CourseMysqlV2.getSubjectsListByCourseAssortmentRecommendationWidget(db.mysql.read, courseAssortment[i]);
                subjectCourses = subjectCourses.concat(subjects);
            }
        }
        subjectCourses.forEach((item) => {
            subjectAssortment.push(item.assortment_id);
        });
        data = data.concat(subjectCourses);
    }
    data.forEach((item) => {
        studentCcmAssortments.push(item);
    });
    studentCcmAssortments.forEach((item) => assortmentList.push(item.assortment_id));
    const assortmentPriceMapping = await courseHelper.generateAssortmentVariantMapping(db, assortmentList, studentId, true, xAuthToken);
    const promises = [];
    for (const value of studentCcmAssortments) {
        const paymentCardState = {
            isVip: false,
            isTrial: false,
        };
        if ((value.assortment_type === 'course' || value.assortment_type === 'class' || value.assortment_type === 'subject') && assortmentPriceMapping[value.assortment_id]) {
            const setWidth = true;
            promises.push(courseHelper.generateAssortmentObject({
                data: value,
                config,
                paymentCardState,
                assortmentPriceMapping,
                db,
                setWidth,
                versionCode,
                assortmentFlagrResponse: null,
                locale,
                category: null,
                page,
                eventPage: null,
                studentId,
            }));
        }
    }
    const courses = await Promise.all(promises);
    const popularCourseData = { items: courses };
    for (const value of popularCourseData.items) {
        if (courseAssortment.includes(value.data.assortment_id)) {
            value.tab = 'Course';
        } else if (subjectAssortment.includes(value.data.assortment_id)) {
            value.tab = 'Subject';
        }
    }
    return popularCourseData.items.filter((item) => Boolean(item));
}

async function generateResult(db, studentData, examId) {
    let scoreAvailable = await dnExamHelper.getAvailableBuckets(db.mysql.read, examId);
    if (scoreAvailable.length) {
        scoreAvailable = JSON.parse(JSON.stringify(scoreAvailable[0]));
    } else {
        return [];
    }
    let reward = [];
    if (scoreAvailable.all_india_rank_lower) {
        reward = await dnExamHelper.getStudentReward(db.mysql.read, studentData.studentId, examId, 0);
    } else if (scoreAvailable.state_rank_lower) {
        reward = await dnExamHelper.getStudentReward(db.mysql.read, studentData.studentId, examId, 1);
    } else if (scoreAvailable.district_rank_lower) {
        reward = await dnExamHelper.getStudentReward(db.mysql.read, studentData.studentId, examId, 2);
    } else if (scoreAvailable.marks_lower) {
        reward = await dnExamHelper.getStudentReward(db.mysql.read, studentData.studentId, examId, 3);
    } else if (scoreAvailable.percentile_lower) {
        reward = await dnExamHelper.getStudentReward(db.mysql.read, studentData.studentId, examId, 4);
    } else if (scoreAvailable.percentage_lower) {
        reward = await dnExamHelper.getStudentReward(db.mysql.read, studentData.studentId, examId, 5);
    }
    return reward;
}

async function getTabs(db, end, locale, studentData, examData, config, versionCode) {
    let airAvailable = false;
    let stateRankAvailable = false;
    let districtRankAvailable = false;
    let otherRankAvailable = false;
    let categoryAvailable = false;
    if (examData.rank_available) {
        const ranks = examData.rank_available.split(',');
        for (let i = 0; i < ranks.length; i++) {
            if (ranks[i] == 'AIR') {
                airAvailable = true;
            }
            if (ranks[i] == 'DISTRICT') {
                districtRankAvailable = true;
            }
            if (ranks[i] == 'STATE') {
                stateRankAvailable = true;
            }
            if (ranks[i] == 'OTHER') {
                otherRankAvailable = true;
            }
            if (ranks[i] == 'CATEGORY') {
                categoryAvailable = true;
            }
        }
    }
    let reward = null;
    if (studentData.result_verified) {
        studentData.studentId = studentData.student_id;
        reward = await generateResult(db, studentData, examData.id);
        if (reward.length) {
            reward = JSON.parse(JSON.stringify(reward[0]));
        }
    }
    const tabs = [];
    const errorMessages = [];
    if (studentData.student_photo || examData.registration_is_active) {
        let uploadPhotoVideo = await dnExamHelper.getQuestionData(db.mysql.read, examData.upload_photo_video);
        if (uploadPhotoVideo.length) {
            uploadPhotoVideo = uploadPhotoVideo[0];
        } else {
            uploadPhotoVideo = null;
        }
        tabs.push({
            title: locale == 'hi' ? 'रजिस्टर' : 'Register', form: getRegistrationForm(locale, studentData, uploadPhotoVideo, config, examData.hindi_display_name, examData.english_display_name, end), isSelected: false, is_edit: !studentData.result_verified,
        });
    } else {
        tabs.push(null);
    }
    if (studentData.application_number || examData.application_number_is_active) {
        let uploadApplicationFormVideo = await dnExamHelper.getQuestionData(db.mysql.read, examData.upload_application_form_video);
        if (uploadApplicationFormVideo.length) {
            uploadApplicationFormVideo = uploadApplicationFormVideo[0];
        } else {
            uploadApplicationFormVideo = null;
        }
        tabs.push({
            title: locale == 'hi' ? 'एप्लीकेशन फॉर्म अपलोड करें' : 'Upload Application Form', form: getApplicationForm(locale, studentData, uploadApplicationFormVideo, examData.download_application_form_link, config, examData.hindi_display_name, examData.english_display_name, end), isSelected: false, is_edit: !studentData.result_verified,
        });
        errorMessages.push(locale == 'hi' ? `आपका ${examData.hindi_display_name} का एप्लीकेशन फॉर्म अभी नहीं आया है\nआप एप्लीकेशन फॉर्म तभी अपलोड कर सकते हैं जब वह आ गया हो` : `Your Application is not out yet for ${examData.english_display_name}\nYou Can only Upload Application form when it is out`);
    } else {
        tabs.push(null);
        errorMessages.push(null);
    }
    if (studentData.admit_card_photo_url || examData.admit_card_is_active) {
        let uploadAdmitCardVideo = await dnExamHelper.getQuestionData(db.mysql.read, examData.upload_admit_card_video);
        if (uploadAdmitCardVideo.length) {
            uploadAdmitCardVideo = uploadAdmitCardVideo[0];
        } else {
            uploadAdmitCardVideo = null;
        }
        tabs.push({
            title: locale == 'hi' ? 'एडमिट कार्ड  अपलोड करें' : 'Upload Admit Card', form: getAdmitForm(locale, studentData, uploadAdmitCardVideo, examData.download_admit_card_link, config, examData.hindi_display_name, examData.english_display_name, end), isSelected: false, is_edit: !studentData.result_verified,
        });
        errorMessages.push(locale == 'hi' ? `आपका ${examData.hindi_display_name} का प्रवेश पत्र अभी नहीं आया है\nआप प्रवेश पत्र तभी अपलोड कर सकते हैं जब वह आ जायेगा` : `Your Admit Card is not out yet for ${examData.english_display_name}\n You Can only Upload Admit card when it is out`);
    } else {
        tabs.push(null);
        errorMessages.push(null);
    }
    if (studentData.result_photo_url || examData.result_is_active) {
        let uploadResultVideo = await dnExamHelper.getQuestionData(db.mysql.read, examData.upload_result_video);
        if (uploadResultVideo.length) {
            uploadResultVideo = uploadResultVideo[0];
        } else {
            uploadResultVideo = null;
        }
        tabs.push({
            title: locale == 'hi' ? 'परीणाम अपलोड करें' : 'Upload Result', form: getResultForm(locale, studentData, uploadResultVideo, examData.download_result_link, examData.marks_scored_available, examData.percentage_available, examData.percentile_available, examData.grade_available, airAvailable, stateRankAvailable, districtRankAvailable, categoryAvailable, otherRankAvailable, studentData.result_verified, config, examData.hindi_display_name, examData.english_display_name, end), isSelected: false, is_edit: !studentData.result_verified,
        });
        errorMessages.push(locale == 'hi' ? `आपका ${examData.hindi_display_name} का परिणाम अभी घोषित नहीं हुआ है\nआप अपनी वीडियो तभी अपलोड कर सकते हैं जब आपका परिणाम घोषित हो जायेगा` : `Your Result is not out yet for ${examData.english_display_name}\nYou Can only Upload your Video After your result is out`);
    } else {
        tabs.push(null);
        errorMessages.push(null);
    }
    let uploadTestimonialVideo = await dnExamHelper.getQuestionData(db.mysql.read, examData.upload_testimonial_video);
    if (uploadTestimonialVideo.length) {
        uploadTestimonialVideo = uploadTestimonialVideo[0];
    } else {
        uploadTestimonialVideo = null;
    }
    if (studentData.video_testimonial_qid) {
        const data = await dnExamHelper.getQuestionData(db.mysql.read, studentData.video_testimonial_qid);
        if (data.length) {
            studentData.video_testimonial_qid = data[0].answer_video;
        }
    }
    tabs.push({
        title: locale == 'hi' ? 'प्रशंसापत्र वीडियो अपलोड करें' : 'Upload Testimonial video', form: getTestimonialForm(locale, studentData, uploadTestimonialVideo, studentData.result_image, examData.hindi_display_name, examData.english_display_name, reward, config, end, versionCode), isSelected: false, is_edit: true,
    });
    errorMessages.push(locale == 'hi' ? 'आप अपनी वीडियो तभी अपलोड कर सकते हैं जब आपका परिणाम घोषित हो जायेगा' : 'You Can only Upload your Video after your result is out');

    if (end <= tabs.length && tabs[end - 1] != null) {
        tabs[end - 1].isSelected = true;
    }
    if (studentData.video_testimonial_qid && tabs[tabs.length - 1] != null) {
        tabs[tabs.length - 1].isSelected = false;
        if (reward) {
            tabs[tabs.length - 1].isSelected = true;
        }
    }

    for (let i = end; i < tabs.length; i++) {
        if (tabs[i]) {
            delete tabs[i].form;
            tabs[i].errorMessage = errorMessages[i - 1];
            tabs[i].is_edit = false;
        }
    }
    if (studentData.video_testimonial_qid && (studentData.address_student_name || studentData.account_holder_name)) {
        tabs[tabs.length - 1].isSelected = false;
    }

    if (!studentData.is_registration_filled) {
        tabs[0].isSelected = true;
    }

    if (!studentData.is_address_filled && studentData.video_testimonial_qid) {
        tabs[tabs.length - 1].isSelected = true;
        tabs[tabs.length - 1].is_edit = true;
    }
    return tabs;
}

async function redirect(studentClass, versionCode, locale, xAuthToken) {
    try {
        let link;
        if (versionCode < 991) {
            const auth = base64.encode(xAuthToken);
            link = `doubtnutapp://external_url?url=https://app.doubtnut.com/DNER/homepage?token=${auth}?studentClass=${studentClass}?locale=${locale}?versionCode=990`;
        } else {
            const auth = base64.encode(xAuthToken);
            link = `doubtnutapp://web_view?chrome_custom_tab=false&url=https://app.doubtnut.com/DNER/homepage?token=${auth}?studentClass=${studentClass}?locale=${locale}?versionCode=${versionCode}`;
        }
        return link;
    } catch (e) {
        console.log(e);
    }
}

function postformActive(form) {
    let active = false;
    let empty = false;
    // eslint-disable-next-line guard-for-in
    for (const key in form) {
        if (!active && !(_.isUndefined(form[key].value) || _.isNull(form[key].value))) {
            active = true;
        }
        if (!empty && active && (_.isUndefined(form[key].value) || _.isNull(form[key].value))) {
            empty = true;
            return true;
        }
    }
    const key = Object.keys(form)[0];
    if (!active && !(_.isUndefined(form[key].value) || _.isNull(form[key].value))) {
        active = true;
    }
    if (!empty && active && (_.isUndefined(form[key].value) || _.isNull(form[key].value))) {
        empty = true;
        return true;
    }
    return false;
}

function getBannerWidget(deeplink, banner, config) {
    return {
        type: 'promo_list',
        data: {
            items: [
                {
                    id: 2500,
                    image_url: `${banner}`,
                    deeplink,
                },
            ],
            margin: true,
        },
        layout_config: {
            margin_top: 14,
            margin_left: 16,
            margin_right: 16,
            margin_bottom: 0,
        },
    };
}

function getVideoResources(resource, config) {
    const videoDetails = {
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
                    question_id: '',
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
                },
                extra_params: {
                    source: '',
                },
            },
        ],
    };
    videoDetails.items[0].data.image_bg_card = `${config.cdn_url}q-thumbnail${resource.question_image}`;
    videoDetails.items[0].data.video_resource = {
        resource: `${config.cdn_video_url}${resource.answer_video}`,
        video_resource: `${config.cdn_video_url}${resource.answer_video}`,
        timeout: 4,
        drm_scheme: 'widevine',
        media_type: 'BLOB',
        drop_down_list: [],
        drm_license_url: '',
        offset: null,
    };
    return {
        type: 'widget_autoplay',
        data: videoDetails,
    };
}

function startWidget(deeplink, locale) {
    const startText = locale == 'hi' ? 'अभी पंजीकरण करें' : 'Register now';
    const data = {
        type: 'widget_button_border',
        data: {
            text_one: startText,
            text_one_size: '20',
            text_one_color: '#ffffff',
            bg_color: '#ea532c',
            bg_stroke_color: '#ea532c',
            assortment_id: '',
            deep_link: deeplink,
            corner_radius: '4.0',
            elevation: '4.0',
            min_height: '49',
        },
        layout_config: {
            margin_top: 0,
            margin_left: 0,
            margin_right: 0,
            margin_bottom: 0,
        },
    };
    return data;
}

function getFaqFinalWidget(faqWidget) {
    faqWidget.data.bg_color = '#ddeaff';
    faqWidget.layout_config = {
        margin_top: 24,
        margin_left: 0,
        margin_right: 0,
        margin_bottom: 0,
    };
    return faqWidget;
}

function generateFAQ(faqWidget) {
    const data = [];
    for (let i = 0; i < faqWidget.length; i++) {
        data.push({
            title: faqWidget[i].question,
            description: faqWidget[i].answer,
            toggle: true,
        });
    }
    return data;
}

async function getExamRewardsLandingPage(db, studentClass, versionCode, locale, xAuthToken, config) {
    const page = [];
    const promises = [];
    promises.push(dnExamHelper.getFromDNProperty(db.mysql.read, 'dn_exam_dummy_page_faq', 'bucket'));
    promises.push(dnExamHelper.getFromDNProperty(db.mysql.read, 'dn_exam_dummy_page_video', 'video_resource'));
    promises.push(dnExamHelper.getFromDNProperty(db.mysql.read, 'dn_exam_dummy_page_banner', 'banner'));
    let [bucket, resource, banner] = await Promise.all(promises);
    bucket = bucket[0].value.split(',');
    bucket = locale == 'hi' ? bucket[1] : bucket[0];
    resource = resource[0].value.split(',');
    resource = locale == 'hi' ? resource[1] : resource[0];
    banner = banner[0].value.split(',');
    banner = locale == 'hi' ? banner[1] : banner[0];
    resource = await dnExamHelper.getQuestionData(db.mysql.read, resource);
    resource = resource[0];
    const deeplink = await redirect(studentClass, versionCode, locale, xAuthToken);
    page.push(getBannerWidget(deeplink, banner, config));
    const faqData = await dnExamHelper.getFAQData(db.mysql.read, bucket, locale);
    const faqWidget = generateFAQ(faqData);
    const faq = {
        type: 'course_faqs',
        data: {
            title: locale == 'hi' ? 'सामान्य प्रश्न' : 'FAQs',
            toggle: true,
            items: faqWidget,
        },
    };
    if (faq && faq.data && faq.data.items && faq.data.items.length) {
        const faqFinalWidget = getFaqFinalWidget(faq);
        page.push(faqFinalWidget);
    }
    return { page, sticky: getVideoResources(resource, config), footy: startWidget(deeplink, locale) };
}
module.exports = {
    buildChangeExam,
    buildPrizeShortBanner,
    buildExamInfo,
    buildWhatsappShare,
    buildResult,
    viewMoreResult,
    viewMoreVideoText,
    getRegistrationForm,
    getRegistrationSuccess,
    getApplicationForm,
    getApplicationSuccess,
    getAdmitSuccess,
    getResultForm,
    getResultSuccess,
    getTestimonialForm,
    getTestimonialSuccess,
    getTabs,
    mergeTabs,
    replaceTemp,
    addResource,
    getStudentEmptyData,
    uploadSpecificImageToS3,
    generateTemplateImage,
    getCourseData,
    generateResult,
    buildVideoTextTestimonial,
    redirect,
    postformActive,
    getExamRewardsLandingPage,
    generateWhatsappMessages,
};
