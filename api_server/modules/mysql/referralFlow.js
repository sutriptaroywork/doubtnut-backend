module.exports = class referralFlow {
    // eslint-disable-next-line no-unused-vars
    static getReferalCampaignDetails(database, studentId) {
        const sql = 'select * from campaign_sid_mapping where student_id = ? and campaign like "%CEO_REFERRAL%" and is_active = 1 order by id desc';
        return database.query(sql, [studentId]);
    }

    static insertIntoContacts(database, mobile, contact, isOnDn) {
        const sql = 'insert ignore into referral_contacts (customer, contact, first_name, is_on_dn, dob, is_active) values (?, ?, ?, ?, ?, 1)';
        return database.query(sql, [mobile, contact.contact, contact.first_name, isOnDn, contact.dob]);
    }

    static updateContacts(database, mobile, contact) {
        const sql = 'UPDATE referral_contacts SET first_name = ? where customer = ? and contact = ? and is_active = 1';
        return database.query(sql, [contact.first_name, mobile, contact.contact]);
    }

    static getLastUpdateTime(database, mobile) {
        const sql = 'select max(updated_at) as updated_at from referral_contacts where customer = ? and is_active = 1';
        return database.query(sql, [mobile]);
    }

    static getContactsDataByType(database, page, count, mobile) {
        let sql = 'select id, customer, contact, first_name as name, updated_at, is_on_dn from referral_contacts where customer = ? and is_active = 1 order by name limit ? ';
        if (page) sql += 'offset ?';
        return database.query(sql, [mobile, +count, (+count) * (+page)]);
    }

    static getContactsWithMobile(database, contactMobiles, mobile) {
        const sql = 'select contact from referral_contacts where contact in (?) and customer = ? and is_active =1';
        return database.query(sql, [contactMobiles, mobile]);
    }

    static getOnDnMobiles(database, onDnMobiles) {
        const sql = 'select mobile from students where mobile in (?)';
        return database.query(sql, [onDnMobiles]);
    }
};
