module.exports = {
    members: {
        operator: '>', // You can define comparison operators here for sql query '>, <, =, >=, <='
        TOTAL_MEMBERS: 4,
    },
    createdAt: {
        operator: '>', // You can define comparison operators here for sql query '>, <, =, >=, <='
        timestamp: '2021-01-05 12:00:00',
    },
    lastSent: {
        timestamp: '2021-01-05 12:00:00',
    },
};

/** Group Guidelines  */
/*
message = {
    widget_data: {
        group_guideline: messageContent,
    },
    widget_type: 'widget_study_group_guideline',
};
messageDetails = {
    message,
    room_type: 'study_group',
    student_id: 32585989,
    created_at: currTime,
    updated_at: currTime,
    is_active: true,
    is_deleted: false,
    is_admin: false,
};
*/

/** Image With Caption */
/*
const messageDetails = {
        message: {
            widget_data: {
                child_widget: {
                    widget_data: {
                        deeplink: 'doubtnutapp://full_screen_image?ask_que_uri=https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/115C3D8E-20D2-66A8-DA98-BF18CBE5D75F.webp&title=study_group',
                        question_image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/115C3D8E-20D2-66A8-DA98-BF18CBE5D75F.webp',
                        id: 'question',
                        card_ratio: '16:9',
                    },
                    widget_type: 'widget_asked_question',
                },
                created_at: moment().valueOf(),
                student_img_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/upload_45917205_1619087619.png',
                title: 'Are Bhai ~ Ye lo !!\n30% Discount | Coupon: SASTAHAFTA\nAaj mil raha kal nahi milega\n',
                sender_detail: 'Sent by Doubtnut',
                visibility_message: '',
                widget_display_name: 'Image',
            },
            widget_type: 'widget_study_group_parent',
        },
        room_type: 'study_group',
        student_id: 32585989,
        attachment: '',
        attachment_mime_type: '',
        student_img_url: '',
};
*/
