const rp = require('request-promise');
const config = require('../config/config');
const SlackUtility = require('./Utility.Slack');

module.exports = class whatsapp_optins {
    static insertNum(phoneNum, source, database) {
        const sql = 'INSERT IGNORE INTO `whatsapp_optins`(`phone`, `source`) VALUES (?, ?)';
        return database.query(sql, [phoneNum, source]);
    }

    static checkWhatsappOptin(phoneNum, database, isTransactional = 0) {
        const sql = 'SELECT * from whatsapp_optins where phone = ?';
        if (isTransactional) {
            return database.singleQueryTransaction(sql, [phoneNum]);
        }
        return database.query(sql, [phoneNum]);
    }

    static _sendTextMessage(mobile, studentID, message, campaign, hsmData) {
        const options = {
            method: 'PUT',
            url: `${config.microUrl}/api/whatsapp/send-text-msg`,
            headers:
        { 'Content-Type': 'application/json' },
            body: {
                phone: `91${mobile}`,
                studentId: studentID,
                text: message,
                preview: true,
                fallbackToHSM: true,
                campaign,
                hsmData,
            },
            json: true,
        };
        console.log('options');
        console.log(options);
        return rp(options);
    }

    static async sendCoursePurchaseTextMsg(mobile, studentID, message, hsmData, sources, action, footerText) {
        const options = {
            method: 'PUT',
            url: `${config.microUrl}/api/whatsapp/send-text-msg`,
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                phone: `91${mobile}`,
                studentId: studentID,
                text: message,
                replyType: 'BUTTONS',
                footer: footerText,
                action,
                preview: false,
                sources,
                bulk: false,
                fallbackToHSM: true,
                hsmData,
            },
            json: true,
        };
        console.log('whatsapp options', JSON.stringify(options));
        const slackMessageBlock = [{
            type: 'section',
            text: { type: 'mrkdwn', text: `*CEO Post Purchase Whatsapp Message Triigered From Payments* :\n\`\`\`${JSON.stringify([{ phone: options.body.phone, studentId: options.body.studentId, hsmData: options.body.hsmData }].map((obj) => obj))}\`\`\`` },
        }];
        SlackUtility.sendMessage('#post-purchase-ceo-whatsapp', slackMessageBlock, 'xoxb-534514142867-3856901320211-8TKXWTSTI1F6MfkbI3tbcPAN');
        return rp(options);
    }

    static async send(db, mobile, templateID, studentID, attributes, message, campaign) {
        try {
            const sourceDetails = await this.checkWhatsappOptin(mobile, db.mysql.read);
            if (sourceDetails.length > 0) {
                const sources = {};
                sourceDetails.map((item) => {
                    if (item.source == 10) {
                        sources['8400400400'] = message;
                    }
                    if (item.source == 11) {
                        sources['6003008001'] = templateID;
                    }
                    return true;
                });
                const hsmData = {
                    sources,
                    attributes,
                };
                await this._sendTextMessage(mobile, studentID, message, campaign, hsmData);
            }
        } catch (e) {
            console.log(e);
        }
    }
};
