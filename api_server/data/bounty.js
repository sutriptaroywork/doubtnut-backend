const config = require('../config/config');

const data = {
    page_title: 'Padhao Aur Kamao kya hai?',
    list: [
        {
            title: 'Padhao Aur Kamao kya hai?',
            list: [
                '1. Padhao Aur Kamao ek community based doubt asking and solving platform hai.',
                '2. Yaha pe aap apne unsolved doubts post kar sakte hai.',
                '3. Uske liye apako ek prize money rakhni hogi. App free mai bhi doubts post kar sakte ho.',
                '4. Uske baad aapke puche gaye questions ko koi bhi pick kar sakta hai and uska solution bana ke upload sakta hai.',
                '5. Phir aapko within 3 days mai saare video solutions mai se sabse acche solution to accpet karna hoga.',
                '6. Wo prize money phir jisne solution banai hai, usko mil jayegyi.',
                '7. Agar aapne 3 days mai solution accpet nahi kiya mai toh wo prize money doubt solvers mai distribute kar di jayegyi doubtnut processing fee katne ke baad (10%).',
                '8. Aap doubts post bhi kar sakte ho and dusro ke doubts ke submit bhi kar sakte ho.',
            ],

        },

        {
            title: 'For Asking Question',
            list: [
                '1. Padhao Aur Kamao ek community based platform hai jaha aap apne doubts puch sakte ho.',
                '2. Doubts puchne ke liye aapko doubtnut ke app se doubt ki photo leni hogi.',
                '3. Uske baad agar aapko solution nahi milta hai toh aap us doubt ko solution page se Padhao Aur Kamao page pe post kar sakte ho.',
                '4. Uske liye apako ek prize money rakhni hogi. App free mai bhi doubts post kar sakte ho.',
                '5. Yeh prize money isliye hai kyuki koi aapka doubt pick karke uska solution bana ke daal sake.',
                '6. Aap jitna accha prize money rakhnege, utna hi aapko jaldi answer milega.',
                '7. Aapka doubt jo solve karga, wo prize money usko transfer ho jayegyi (hum usme se 10% kaat lenge as our commission fees)',
                '8. Agar aapka doubt ek se jayada log solve karte hai toh prize money usse milegi jiska answer aap accept karoge.',
                '9. Apko 3 days mai solution answer accept karna hoga.',
                '10. Agar aapke question pe ek bhi solution kisi ne bana ke uplaod nahi kiya toh aapke pasie aapke pass wapas aa jayenge within 7 days mai.',
                '11. Aap apne pooche gaye doubts pe solution kabhi bhi jake accept kar sakte hai. But aap try kare ki within 3 days mai hi best answer accept kar le.',
                '12. Agar aapne DN Wallet se payment kari he to jiska solution accept hoga unhe DN Wallet me hi amount milega',
            ],

        },
        {
            title: 'For Solving',
            list: [
                '1. Aap jitne chaho video solution submit kar sakte ho.',
                '2. Video submit karne ke baad appko apna paytm no dena hoga jispe aapko prize money transfer ki jayegi',
                '3. Aap apna mobile no kabhi bhi change kar sakte ho. Uslke liye aapko payment history pe jana hoga.',
                '4. Aapne jis doubt ka solution bana ke upload kiya hoga, wo agar accept hota hai toh aapko us doubt ki prize money aapke paytm no pe transfer kar di jayegyi (10% processing fee kaatne ke baad)',
                '5. Aap Image solution bhi upload kar sakte ho. Iske liye aapko problem ko paper pe solve karke uski camera se photo leke submit solution pe click karke upload karni hogi',
            ],
        },

    ],
};

const notification = {
    more_than_5_likes: {
        title: 'Congratulations !! 5 People Have Liked Your Answer',
        message: 'Padhao Aur Kamao me or Answer karein',
        event: 'bounty_qna',
    },
    got_answer: {
        title: 'Congratulations !! Someone Answered Your Question',
        message: 'Padhao Aur Kamao me or Sawal Post karein',
        event: 'bounty_qna',
    },
    answer_accepted: {
        title: 'Congratulations !! Your Answer Has Been Accepted',
        message: 'Keep on posting more Answers',
        event: 'bounty_qna',
    },
    received_comment: {
        title: 'Aapke Padhao aur Kamao ke post pe\n kisi ne comment kiya hai',
        message: 'Padhao Aur Kamao me or Questions Post karein',
        event: 'bounty_qna',
    },
    bounty_raise: {
        title: 'Kariye is Question ko solve aur Jeete Prize Money.',
        message: 'Padhao Aur Kamao pe Sabse Pehle Sawal Banao',
        event: 'bounty_feed',
    },
    encourage_to_accept: {
        title: 'Padhao Aur Kamao pe Best Answer accpet kare.',
        message: 'Aur motivate kare jinhone aapke liye solution banaya hai..',
        event: 'bounty_qna',
    },
};

const mail_details = {
    autobotMailID: 'autobot@doubtnut.com',
    bountyMailID: 'info@doubtnut.com',
    feedbackSubject: 'BOUNTY |  Feedback  | Student ID :',
    spamSubject: 'BOUNTY | Spam | Student ID :',
    delimitter: ' | ',
};

module.exports = {
    data,
    limit: 10,
    file_size: 50,
    notification,
    mail_details,
    bounty_question_entity_type: 'bounty_question',
    bounty_answer_entity_type: 'bounty_answer',
    bounty_soln_vid: 'https://d10lpgp6xz60nq.cloudfront.net/VID20200206172451.mp4',
    bounty_ans_vid: 'https://d10lpgp6xz60nq.cloudfront.net',
    bounty_video_thumbnail: `${config.staticCDN}bounty_thumbnail_video.png`,
};
