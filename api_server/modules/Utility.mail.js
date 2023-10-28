const sendgridMod = require('sendgrid');
const helperMod = require('sendgrid');
const _ = require('lodash');

module.exports = class MailUtility {
    /** *
     * send mail via sendGrid
     */
    static async sendMailViaSendGrid(config, fromMail, toMail, subject, body, ccList = []) {
        const sendgrid = sendgridMod(config.send_grid_key);
        const helper = helperMod.mail;

        const from_email = new helper.Email(fromMail);
        const to_email = new helper.Email(toMail);
        const content = new helper.Content('text/html', body);
        const mail = new helper.Mail();

        const personalization = new helper.Personalization();
        personalization.addTo(to_email);

        if (!_.isEmpty(ccList)) {
            for (let i = 0; i < ccList.length; i++) {
                personalization.addCc(new helper.Email(ccList[i]));
            }
        }
        mail.setFrom(from_email);
        mail.setSubject(subject);
        mail.addContent(content);
        mail.addPersonalization(personalization);

        const sg = sendgrid.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: mail.toJSON(),
        });

        sendgrid.API(sg);
    }
};
