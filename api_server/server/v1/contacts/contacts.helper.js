const _ = require('lodash');
const referralSql = require('../../../modules/mysql/referralFlow');

async function getContactsData(db, isOnDn, page, count, mobile, locale) {
    const data = [];
    const contactsData = await referralSql.getContactsDataByType(db.mysql.read, page, count, mobile);

    const onDn = locale == 'hi' ? [{ type: 'title', title: 'Doubtnut से जुड़े हुए दोस्त' }] : [{ type: 'title', title: 'Friends on Doubtnut' }];
    const notOnDn = locale == 'hi' ? [{ type: 'title', title: 'सभी दोस्त' }] : [{ type: 'title', title: 'Friends who might like Doubtnut' }];
    contactsData.map((x) => {
        if (x.is_on_dn && (_.isEmpty(isOnDn) || isOnDn == true)) { x.type = 'on_dn'; onDn.push(x); } else if (_.isEmpty(isOnDn) || isOnDn == false) { x.type = 'not_on_dn'; notOnDn.push(x); }
    });
    if (onDn.length > 1) {
        data.push(...onDn);
    }
    if (notOnDn.length > 1) {
        data.push(...notOnDn);
    }
    return data;
}

async function insertIntoContacts(db, contacts, mobile) {
    try {
        const contactMobiles = [];
        for (let i = 0; i < contacts.length; i++) {
            contacts[i].contact = contacts[i].contact.toString().replace('+91', '').replace('-', '');
            contactMobiles.push(contacts[i].contact);
        }
        if (!_.isEmpty(contactMobiles)) {
            let existingMobiles = await referralSql.getContactsWithMobile(db.mysql.read, contactMobiles, mobile);
            existingMobiles = existingMobiles.map((x) => x.contact);
            let onDnMobiles = [];
            onDnMobiles = await referralSql.getOnDnMobiles(db.mysql.read, contactMobiles);
            onDnMobiles = onDnMobiles.map((x) => x.mobile);
            for (let i = 0; i < contacts.length; i++) {
                const subContact = contacts[i];
                subContact.first_name = contacts[i].name;
                subContact.id = null;
                if (existingMobiles.includes(subContact.contact.toString())) {
                    await referralSql.updateContacts(db.mysql.write, mobile, subContact)
                } else {
                    const isOnDn = onDnMobiles.includes(subContact.contact.toString());
                    if (_.isEmpty(contacts[i].dob)) {
                        contacts[i].dob = null;
                    }
                    await referralSql.insertIntoContacts(db.mysql.write, mobile, subContact, isOnDn);
                }
            }
        }
        return;
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
    getContactsData,
    insertIntoContacts,
};
