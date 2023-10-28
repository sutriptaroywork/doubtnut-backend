module.exports = class Package {
    static getPackageByName(database, name) {
        const sql = `select * from student_package where name = "${name}" and type = "subscription" and is_active = 1 order by priority`;
        console.log(sql);
        return database.query(sql);
    }

    static getActivePackageForDate(database, date) {
        const sql = `select * from student_package where date(valid_on) = '${date}' and is_active = 1 and type = "subscription" and name <> 'default' order by id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getActivePackagesForDate(database, date) {
        const sql = `select * from student_package where date(valid_on) = '${date}' and is_active = 1 and type = "subscription" and name <> 'default' order by id`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackageById(database, package_id) {
        const sql = `select * from student_package where id = ${package_id} order by id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getNewPackageById(database, packageId) {
        const sql = 'select * from package where id = ? order by id desc limit 1';
        console.log(sql);
        return database.query(sql, [packageId]);
    }

    static getRenewalPackageByPackageId(database, package_id) {
        const sql = `select * from student_package where is_active = 1 and type = "renewal" and reference_package = ${package_id} order by id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getDefaultPackage(database) {
        const sql = 'select * from student_package where name = "default" and type = "subscription" and is_active = 1 order by id desc limit 1';
        console.log(sql);
        return database.query(sql);
    }

    static getDefaultPackageByDuration(database, duration_in_days) {
        const sql = `select * from student_package where name = "default" and duration_in_days = ${duration_in_days} and type = "subscription" and is_active = 1 order by id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackagesByDurationWithoutDefault(database, durationList) {
        const sql = `select * from student_package as a left join (select id as mid, is_active, course_type from student_master_package) as b on a.subcategory_id=b.mid where a.name <> "default" and a.name <> "trial" and a.type in ("subscription", "emi") and a.duration_in_days IN (${durationList.join(
            ',',
        )}) and a.is_active = 1 and a.reference_type in ('default','onlyPanel') and b.is_active=1 and a.subcategory_id=1 order by a.id`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackagesByDurationWithoutDefaultV1(
        database,
        durationList,
        course,
        categoryID,
    ) {
        const sql = `select * from student_package as a left join (select id as mid, is_active, course_type,category_id from student_master_package) as b on a.subcategory_id=b.mid where a.name <> "default" and a.name <> "trial" and a.type in ("subscription", "emi") and a.duration_in_days IN (${durationList.join(
            ',',
        )}) and a.reference_type in ('default','v3','onlyPanel') and a.is_active = 1 and b.category_id=${categoryID} and b.course_type='${course}' and a.original_amount<>-1 order by a.id`;
        console.log(sql);
        return database.query(sql);
    }

    static getDefaultPackageByAmount(database, amount) {
        const sql = `select * from student_package where name = "default" and offer_amount = ${amount} and type = "subscription" and is_active = 1 order by id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getDefaultPackages(database) {
        const sql = 'select * from student_package where name = "default" and type = "subscription" and is_active = 1 order by priority';
        console.log(sql);
        return database.query(sql);
    }

    static getPackagesByDuration(database, durationList) {
        const sql = `select * from student_package where name = "default" and type = "subscription" and duration_in_days IN (${durationList.join(
            ',',
        )}) and is_active = 1 order by priority`;
        console.log(sql);
        return database.query(sql);
    }

    static getDoubtLimitPackagesByDuration(database, durationList, country) {
        const sql = `select *, v.id as variant_id from package p join variants v on v.package_id = p.id where p.reference_type = "doubt" and p.country = "${country}" and p.duration_in_days IN (${durationList.join(
            ',',
        )}) and p.is_active = 1 order by package_order desc`;
        console.log(sql);
        return database.query(sql);
    }

    static getTrialPackagesByDuration(database, duration) {
        const sql = `select * from student_package where name = "trial" and type = "subscription" and duration_in_days = ${duration} and is_active = 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getTrialPackagesByDurationV2(database, duration, categoryID) {
        const sql = `select a.* from (select * from student_package where type = "subscription" and original_amount = -1 and reference_type='v3' and duration_in_days = ${duration} and is_active = 1) as a inner join (select * from student_master_package) as b on a.subcategory_id=b.id where b.category_id=${categoryID} and b.course_type='all'`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackagesByDuration2(database, durationList) {
        const sql = `select * from student_package where name <> "default" and name <> "trial" and type = "subscription" and reference_type = 'default' and duration_in_days IN (${durationList.join(
            ',',
        )}) and is_active = 1 order by priority`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackagesByDuration3(database, durationList) {
        const sql = `select * from student_package where name <> "default" and name <> "trial" and type IN ("subscription","emi") and reference_type = 'default' and duration_in_days IN (${durationList.join(
            ',',
        )}) and is_active = 1 and parent IS NULL order by priority`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackagesByDuration4(
        database,
        durationList,
        categoryId,
        courseType,
    ) {
        const sql = `select * from (select * from student_package where name <> "default" and name <> "trial" and type IN ("subscription","emi") and reference_type = 'default' and duration_in_days IN (${durationList.join(
            ',',
        )}) and is_active = 1 and parent IS NULL) as a join (select id as master_id,category_id from student_master_package where category_id=${categoryId} and course_type='${courseType}') as b on a.subcategory_id=b.master_id order by priority`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackagesByDaysAndCategoryIDAndCourseType(
        database,
        durationList,
        categoryId,
        courseType,
    ) {
        const sql = `select b.* from (select * from student_master_package where category_id=${categoryId} and course_type='${courseType}') as a inner join (select * from student_package where reference_type in ('default','v3') and duration_in_days IN (${durationList.join(
            ',',
        )}) and name <> "default" and name <> "trial" and is_active=1 and parent is null and type <> "emi") as b on a.id=b.subcategory_id order by b.id`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackagesByDaysAndCategoryIDAndCourseTypeEmi(
        database,
        durationList,
        categoryId,
        courseType,
    ) {
        const sql = `select b.* from (select * from student_master_package where category_id=${categoryId} and course_type='${courseType}') as a inner join (select * from student_package where reference_type in ('default','v3') and duration_in_days IN (${durationList.join(
            ',',
        )}) and name <> "default" and name <> "trial" and is_active=1 and parent is null and type="emi") as b on a.id=b.subcategory_id order by b.id`;
        console.log(sql);
        return database.query(sql);
    }

    static getLiveclassPackagesByDuration(database, durationList, courseID) {
        const sql = `select * from student_package where name <> "default" and name <> "trial" and type = "subscription" and reference_type = 'liveclass' and duration_in_days IN (${durationList.join(
            ',',
        )}) and reference_id=${courseID} and is_active = 1 order by priority`;
        console.log(sql);
        return database.query(sql);
    }

    static getDefaultRenewalPackage(database) {
        const sql = 'select * from student_package where name = "default" and type = "renewal" and is_active = 1 order by id desc limit 1';
        console.log(sql);
        return database.query(sql);
    }

    static getStudentActivePackage(database, studentId, date) {
        const sql = 'select * from student_package_subscription sps join student_package sp on sp.id = sps.student_package_id where sps.student_id = ? and sps.is_active = 1 and  date(sps.end_date) >= ? order by sps.id desc limit 1';
        console.log(sql);
        return database.query(sql, [studentId, date]);
    }

    static getStudentActivePackageDoubtLimit(database, studentId, date) {
        const sql = `select * from student_package_subscription sps join package p on p.id = sps.new_package_id where p.reference_type = "doubt" and sps.student_id = ${studentId} and sps.is_active = 1 and  date(sps.end_date) >= '${date}' order by sps.id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static setStudentInDoubtPaywall(database, studentId) {
        const sql = `INSERT IGNORE student_doubt_paywall set student_id = ${studentId}`;
        console.log(sql);
        return database.query(sql);
    }

    static getStudentDoubtPaywallCount(database) {
        const sql = 'select count(id) as count from student_doubt_paywall';
        console.log(sql);
        return database.query(sql);
    }

    static isStudentInDoubtPaywall(database, student_id) {
        const sql = `select id from student_doubt_paywall where student_id = ${student_id}`;
        console.log(sql);
        return database.query(sql);
    }

    static getStudentActivePackageByReference(
        database,
        studentId,
        date,
        referenceType,
    ) {
        const sql = `select * from student_package_subscription sps inner join (select * from student_package where reference_type='${referenceType}') as sp on sp.id = sps.student_package_id where sps.student_id = ${studentId} and sps.is_active = 1 and  date(sps.end_date) >= '${date}' order by sps.id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getStudentHasHadPackage(database, studentId) {
        const sql = `select * from student_package_subscription sps join student_package sp on sp.id = sps.student_package_id where sps.student_id = ${studentId} and sp.subcategory_id=1 order by sps.id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getStudentHasHadDoubtPackage(database, studentId, country) {
        const sql = `select * from student_package_subscription sps join package p on p.id = sps.new_package_id where sps.student_id = ${studentId} and p.reference_type = "doubt" and p.country = "${country}" order by sps.id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getDefaultDoubtPackageByCountry(database, country) {
        const sql = `select v.* from variants v join package p on p.id = v.package_id where p.reference_type = "doubt" and p.country = "${country}" and v.is_default = 1 and v.is_active = 1 and v.is_show = 1 order by v.id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getStudentHasHadPackageByCategoryID(
        database,
        studentId,
        categoryID,
    ) {
        const sql = `select * from student_package_subscription sps inner join student_package sp on sp.id = sps.student_package_id inner join (select * from student_master_package) as smp on sp.subcategory_id = smp.id where sps.student_id = ${studentId} and smp.category_id=${categoryID} order by sps.id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getAllStudentPackage(database, studentId) {
        const sql = `select * from student_package_subscription where student_id = ${studentId}`;
        console.log(sql);
        return database.query(sql);
    }

    static getAllActiveStudentPackages(database, studentId) {
        const sql = `select * from student_package_subscription where student_id = ${studentId} and is_active = 1 order by id desc`;
        console.log(sql);
        return database.query(sql);
    }

    static getAllActiveStudentDoubtPackages(database, studentId) {
        const sql = `select sps.* from student_package_subscription sps join package p on p.id = sps.new_package_id where p.reference_type = "doubt" and sps.student_id = ${studentId} and sps.is_active = 1 order by sps.id desc`;
        console.log(sql);
        return database.query(sql);
    }

    static getAllPackagesByCategory(database, categoryId) {
        const sql = `select * from (select * from student_master_package where category_id = ${categoryId}) as a left join (select id as course_id, package_id from liveclass_course) as b where a.id = b.package_id`;
        console.log(sql);
        return database.query(sql);
    }

    static getInvitePackageListByStudentId(database, studentId) {
        const sql = `select * from student_package_subscription where student_id = ${studentId} and is_active = 1 and amount = 0`;
        console.log(sql);
        return database.query(sql);
    }

    static getQuestionCountByStudentId(database, studentId, date) {
        const sql = `select count(question_id) as question_count from questions_new where student_id = '${studentId}' and  date(timestamp) = '${date}'`;
        console.log(sql);
        return database.query(sql);
    }

    static getTotalQuestionCountByStudentId(database, studentId) {
        // const sql = `select count(question_id) as question_count from questions_new where student_id = '${studentId}'`; // TODO merge both tables
        const sql = `select count(question_id) as question_count from (select question_id from questions_new where student_id = ${studentId} UNION ALL select question_id from questions where student_id = ${studentId}) tables;`;
        console.log(sql);
        return database.query(sql);
    }

    static getQuestionCountByStudentIdInHours(database, studentId, hours) {
        const sql = `select count(question_id) as question_count from questions_new where student_id = '${studentId}' and  timestamp > DATE_SUB(NOW(), INTERVAL ${hours} HOUR)`;
        console.log(sql);
        return database.query(sql);
    }

    static startSubscriptionForStudentId(database, obj) {
        const sql = 'insert into student_package_subscription SET ?';
        // console.log(sql);
        return database.query(sql, obj);
    }

    static setUserFeedback(database, obj) {
        const sql = 'insert into student_package_feedback SET ?';
        // console.log(sql);
        return database.query(sql, obj);
    }

    static setUserPackage(database, data) {
        const sql = `INSERT INTO flagr_student_info (student_id, flag_id, variant_id, data) VALUES (${data.student_id}, ${data.flag_id}, ${data.variant_id}, '${data.data}') ON DUPLICATE KEY UPDATE variant_id = ${data.variant_id}, data = '${data.data}'`;
        console.log(sql);
        return database.query(sql);
    }

    static getChildPackages(database) {
        const sql = "Select * from (select * from student_package where type='emi' and parent is NULL) as sp1 left join (select id as child_id,master_parent from student_package where type='emi') as sp2 on sp2.master_parent=sp1.id";
        console.log(sql);
        return database.query(sql);
    }

    static getFirstEmiDate(database, masterParent, studentId) {
        const sql = `Select b.start_date from (select * from student_package where master_parent=${masterParent} and emi_order=1) as a left join student_package_subscription as b on a.id=b.student_package_id and student_id=${studentId};`;
        console.log(sql);
        return database.query(sql);
    }

    static setPaymentSummary(database, data) {
        const sql = 'insert into payment_summary SET ?';
        console.log(sql);
        return database.query(sql, data);
    }

    static getPackageCategories(database) {
        const sql = 'select distinct(category_id) as filter_id, category as text from student_master_package where is_active=1;';
        console.log(sql);
        return database.query(sql);
    }

    static getCategoriesByClass(database, studentClass) {
        const sql = `select distinct(category_id) as id from liveclass_course where class=${studentClass};`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackageCategoriesByCategory(database, category) {
        const sql = `select distinct(category_id) as filter_id, category as text from student_master_package where is_active=1 and category_id in (${category.join(
            ',',
        )})`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackageSubCategories(database, categoryId) {
        const sql = `select course_type as id, package_subcategory as display from student_master_package where category_id in (${categoryId.join(
            ',',
        )}) and is_active=1;`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackageCategory(database, subcategoryId) {
        const sql = `select * from student_master_package where id=${subcategoryId};`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackageFromActiveSubscriptions(database, package_id, studentId) {
        const sql = `select a.*, b.name, b.subcategory_id, b.duration_in_days from (select * from classzoo1.payment_summary where student_id = ${studentId} AND CURRENT_DATE >= master_subscription_start_date AND CURRENT_DATE <= master_subscription_end_date and master_package_id = ${package_id}) as a LEFT JOIN student_package as b on a.master_package_id=b.id`;
        return database.query(sql);
    }

    static getPackageFromActiveSubscriptionsV1(database, packageId, studentId) {
        const sql = 'select a.*, b.name, b.assortment_id, b.duration_in_days from (select ps.*, pi.wallet_amount from classzoo1.payment_summary ps join payment_info pi on pi.partner_txn_id = ps.txn_id where ps.student_id =?  and ps.new_package_id=? and ps.next_package_id is null) as a LEFT JOIN package as b on a.new_package_id=b.id';
        return database.query(sql, [studentId, packageId]);
    }

    static getPackageFromActiveSubscriptionsV1UsingSubscriptionID(database, subscriptionId, studentId) {
        const sql = 'select a.*, b.name, b.assortment_id, b.duration_in_days, pi.id as pi_id, pi.total_amount as pi_total_amount, pi.discount as pi_discount, pi.wallet_amount as pi_wallet_amount, pi.amount as pi_amount, pi.partner_txn_id, pi.source  from (select ps.* from classzoo1.payment_summary ps where ps.student_id =?  and ps.subscription_id=? and ps.next_package_id is null) as a LEFT JOIN package as b on a.new_package_id=b.id LEFT JOIN payment_info as pi on a.txn_id=pi.partner_txn_id where (pi.status= "SUCCESS" or pi.status is null)';
        return database.query(sql, [studentId, subscriptionId]);
    }

    static getAllEmiPaymentsUsingMasterVariant(
        database,
        masterVariant,
        studentId,
    ) {
        const sql = 'select * from classzoo1.payment_summary where student_id =? AND CURRENT_DATE <= master_subscription_end_date and master_variant_id=?';
        return database.query(sql, [studentId, masterVariant]);
    }

    static getPackageByMasterParent(database, package_id) {
        const sql = `select * from student_package where master_parent = ${package_id} order by id`;
        console.log(sql);
        return database.query(sql);
    }

    static getPreviousEmiDetails(database, masterPackage, studentId) {
        const sql = `select * from payment_summary where student_id=${studentId} and master_package_id=${masterPackage};`;
        console.log(sql);
        return database.query(sql);
    }

    static getPreviousEmiDetailsByVariant(database, studentId, variantId) {
        const sql = 'select * from payment_summary where student_id=? and master_variant_id=? and emi_order=1 AND CURRENT_DATE >= master_subscription_start_date AND CURRENT_DATE <= master_subscription_end_date;';
        console.log(sql);
        return database.query(sql, [studentId, variantId]);
    }

    static getEmiCount(database, masterPackage) {
        const sql = `select count(*) as count from student_package where master_parent=${masterPackage};`;
        console.log(sql);
        return database.query(sql);
    }

    static markSubscriptionInactive(database, sid) {
        const sql = `update student_package_subscription set is_active=0 where id=${sid}`;
        console.log(sql);
        return database.query(sql);
    }

    static updateSubscriptionById(database, id, obj) {
        const sql = 'update student_package_subscription set ? where id = ?';
        return database.query(sql, [obj, id]);
    }

    static prevPaymentSummary(database, sid, studentId) {
        const sql = `select * from payment_summary where master_package_id=${sid} and student_id=${studentId} and CURRENT_DATE >= master_subscription_start_date and CURRENT_DATE <= master_subscription_end_date`;
        console.log(sql);
        return database.query(sql);
    }

    static prevPaymentSummaryFromNewPackageId(database, subscriptionID, studentId) {
        const sql = 'select * from payment_summary where subscription_id=? and student_id=?';
        console.log(sql);
        return database.query(sql, [subscriptionID, studentId]);
    }

    static updateNextPackageInPaymentSummary(database, sid, nextPackageId) {
        const sql = `update payment_summary set next_package_id=${nextPackageId} where id=${sid}`;
        console.log(sql);
        return database.query(sql);
    }

    static updateNextPackageInPaymentSummary(database, sid, nextPackageId) {
        const sql = `update payment_summary set next_package_id=${nextPackageId} where id=${sid}`;
        return database.query(sql);
    }

    static updateNextPackageInPaymentSummaryUsingSubscriptionId(database, data) {
        const sql = `update payment_summary set next_package_id=${data.next_package_id}, next_ps_id=${data.next_ps_id} where subscription_id=${data.subscriptionId}`;
        return database.query(sql);
    }

    static getPaymentSummaryFromId(database, id) {
        const sql = 'select * from payment_summary where id=? limit 1';
        return database.query(sql, [id]);
    }

    static getActiveSubscriptionPaymentSummaryFromId(database, id) {
        const sql = 'select ps.*, sps.meta_info from payment_summary ps join student_package_subscription sps on sps.id = ps.subscription_id where ps.id=? and sps.is_active =1 limit 1';
        return database.singleQueryTransaction(sql, [id]);
    }

    static getNextPackageId(database, master_package_id, emi_order) {
        const sql = `select * from student_package where master_parent=${master_package_id} and emi_order=${emi_order} limit 1`;
        return database.query(sql);
    }

    static getTrialCategory(database, master_package_id) {
        const sql = `select a.id from student_package as a left join student_master_package as b on a.subcategory_id=b.id and b.category_id=${master_package_id} where b.course_type='all' and a.original_amount=-1`;
        console.log(sql);
        return database.query(sql);
    }

    static getMasterCategory(database, package_id) {
        const sql = `select * from student_master_package where id=${package_id}`;
        console.log(sql);
        return database.query(sql);
    }

    static getLatestEmiPayment(database, studenId, master) {
        const sql = `select * from (select * from student_package_subscription where student_id=${studenId}) as a left join (select * from student_package where master_parent=${master}) as b on a.student_package_id=b.id where b.id is not null order by a.id desc;`;
        console.log(sql);
        return database.query(sql);
    }

    static similarActivePackages(database, studenId) {
        const sql = `select * from (select * from student_package_subscription where student_id=${studenId}) as a left join (select * from student_package where subcategory_id in (2,3)) as b on a.student_package_id=b.id where b.id is not null;`;
        console.log(sql);
        return database.query(sql);
    }

    static getChildPackagesFromVariant(database, variant) {
        const sql = `select a.*, b.emi_duration, b.emi_order from (select * from variants where master_parent_variant_id=${variant}) as a left join package as b on a.package_id=b.id;`;
        console.log(sql);
        return database.query(sql);
    }

    static getPackageFromVariant(database, variant) {
        const sql = `select a.*, b.emi_duration from (select * from variants where id=${variant}) as a left join package as b on a.package_id=b.id;`;
        return database.query(sql);
    }

    static getUserActivePackages(database, studentID) {
        const sql = `select * from (select * from student_package_subscription where student_id=${studentID} and start_date < now() and end_date > now() and is_active=1 order by id desc) as a left join (select * from packages) as b a.student_package_id=b.id`;
        console.log(sql);
        return database.query(sql);
    }

    static getNewPackageId(database, packageId, base_price) {
        const sql = `select * from variants where previous_package_id=${packageId} and display_price=${base_price} limit 1`;
        return database.query(sql);
    }

    static getVariantFromNewPackage(database, packageId, amount) {
        const sql = 'select * from variants where package_id=? and display_price=? limit 1';
        return database.query(sql, [packageId, amount]);
    }

    static getDefaultVariantFromNewPackage(database, packageId) {
        const sql = 'select * from variants where package_id=? and is_default=1 limit 1';
        return database.query(sql, [packageId]);
    }

    static getVariantFromMasterVariant(database, masterVariant, id) {
        const sql = 'select * from variants where master_parent_variant_id=? and id>? order by id limit 1';
        return database.query(sql, [masterVariant, id]);
    }

    static getNewPackageFromVariantId(database, variant_id) {
        const sql = `select a.id, a.base_price as original_amount, a.display_price as final_amount, a.display_price as total_amount, a.package_id, b.min_limit, b.min_limit_percentage, a.base_price-a.display_price as discount_amount, b.type, b.assortment_id , b.duration_in_days, b.name as package_name, b.emi_order, a.is_active as active_variant, b.is_active as active_package, b.country, b.reference_type from (select * from variants where id=${variant_id}) a left join package b on a.package_id=b.id where b.id is not null`;
        console.log(sql);
        return database.query(sql);
    }

    static getNewPackageWithTransliterationFromVariantId(database, variant_id) {
        const sql = 'select a.id, a.base_price as original_amount, a.display_price as final_amount, a.display_price as total_amount, a.package_id, b.min_limit, a.base_price-a.display_price as discount_amount, b.type, b.assortment_id , b.duration_in_days, b.name as package_name, b.emi_order, pnt.package_name_trans_manual, pnt.package_name_trans from (select * from variants where id= ?) a left join package b on a.package_id=b.id left join  package_name_transliterate  pnt on pnt.package_id = b.id where b.id is not null';
        return database.query(sql, [variant_id]);
    }

    static getNewPackageFromVariantIdWithCourseDetails(database, variant_id) {
        const sql = `select a.id, a.base_price as original_amount, a.display_price as final_amount, a.display_price as total_amount, a.package_id, b.min_limit, a.base_price-a.display_price as discount_amount, b.type, b.assortment_id , b.duration_in_days, b.name as package_name, b.emi_order, d.meta_info, d.display_name, d.parent  from (select * from variants where id=${variant_id}) a left join package b on a.package_id=b.id left join (select * from course_details group by assortment_id) as d on b.assortment_id=d.assortment_id where b.id is not null`;
        console.log(sql);
        return database.query(sql);
    }

    static getNewPackageFromVariantIdWithCourseDetailsv1(database, variant_id) {
        const sql = 'select a.id, a.base_price as original_amount, a.display_price as final_amount, a.display_price as total_amount, a.package_id, b.min_limit, b.min_limit_percentage, a.base_price-a.display_price as discount_amount, b.type, b.assortment_id , b.duration_in_days, b.name as package_name, b.emi_order, d.meta_info, d.display_name, d.parent, d.assortment_type, a.is_active as active_variant, b.is_active as active_package, b.reference_type from (select * from variants where id=?) a left join package b on a.package_id=b.id left join course_details as d on b.assortment_id=d.assortment_id where b.id is not null';
        console.log(sql, variant_id);
        return database.query(sql, [variant_id]);
    }

    static getCouponDetailsUsingCouponCode(
        database,
        coupon_code,
        version_code,
    ) {
        const sql = 'select * from coupons_new where coupon_code= ? and DATE(start_date) <= CURRENT_DATE and DATE(end_date) >= CURRENT_DATE and min_version_code <= ? and max_version_code >= ? and is_active=1';
        return database.query(sql, [coupon_code, version_code, version_code]);
    }

    static getCouponDetailsUsingCouponCodeForExpiryCheck(
        database,
        coupon_code,
    ) {
        const sql = 'select * from coupons_new where coupon_code=? and end_date <= CURRENT_DATE';
        return database.query(sql, [coupon_code]);
    }

    static getCouponInfo(
        database,
        coupon_code,
    ) {
        const sql = 'select * from coupons_new where coupon_code=? limit 1';
        return database.query(sql, [coupon_code]);
    }

    static getCouponPackageByCouponAndPackageID(
        database,
        coupon_code,
        package_id,
    ) {
        const sql = 'select * from coupon_course_mapping where coupon_code = ? and package_id= ? ad is_active = 1';
        console.log(sql);
        return database.query(sql, [coupon_code, package_id]);
    }

    static getCouponPackages(database, coupon_code) {
        const sql = 'select * from coupon_course_mapping where coupon_code =? and is_active = 1';
        console.log(sql);
        return database.query(sql, [coupon_code]);
    }

    static getPackageDetailsForCouponCheckByPackageId(database, package_id) {
        const sql = 'select p.id as package_id, p.assortment_id, cd.assortment_type, cd.class as course_class, cd.category_type as course_supercat, cd.meta_info as course_locale, p.is_multi_year from package p left join course_details cd on cd.assortment_id = p.assortment_id where p.id = ? limit 1';
        return database.query(sql, [package_id]);
    }

    static getGetCouponClaimedTotal(database, coupon_code) {
        const sql = 'select id, coupon_code, status, student_id from payment_info where coupon_code = ? and status=\'SUCCESS\'';
        return database.query(sql, [coupon_code]);
    }

    static getCouponClaimedTotalCount(database, coupon_code) {
        const sql = 'select * from classzoo1.payment_info_coupon_success_count where coupon_code = ?';
        return database.query(sql, [coupon_code]);
    }

    static getCouponClaimedTotalCountByStudentId(database, coupon_code, studentId) {
        const sql = 'select id, coupon_code, status, student_id from payment_info where student_id = ? and coupon_code = ? and status="SUCCESS"';
        return database.query(sql, [studentId, coupon_code]);
    }

    static getCouponTg(database, coupon_code) {
        const sql = 'select * from coupon_applicability where coupon_code = ? and is_active = 1';
        return database.query(sql, [coupon_code]);
    }

    static getTG(database, tg_id) {
        const sql = `select * from target_group where id = '${tg_id}' limit 1`;
        return database.query(sql);
    }

    static runTgSql(database, sql) {
        return database.query(sql);
    }

    static getVariantInfo(database, variantId) {
        const sql = `select * from (select * from variants where id=${variantId}) as a left join package as b on a.package_id=b.id left join (select assortment_id,start_date, assortment_type,category,class from course_details) as c on c.assortment_id=b.assortment_id where b.id is not null`;
        return database.query(sql);
    }

    static getVariantByIdAndAmount(database, variantId, amount) {
        const sql = 'select * from variants where id=? and display_price=?';
        return database.query(sql, [variantId, amount]);
    }

    static getVariantById(database, variantId) {
        const sql = 'select * from variants where id=?';
        return database.query(sql, [variantId]);
    }

    static getEmiPackageDetails(database, master_parent_variant_id, emi_order) {
        const sql = `select *, a.id as variant_id from (select * from variants where master_parent_variant_id=${master_parent_variant_id}) as a inner join package as b on a.package_id=b.id where b.emi_order= ${emi_order}`;
        return database.query(sql);
    }

    static getSubscriptionDetails(database, studentId, variantId) {
        const sql = `select * from student_package_subscription where student_id=${studentId} and variant_id=${variantId} order by id DESC limit 1`;
        return database.query(sql);
    }

    static getNextEmiPackageDetails(
        database,
        master_parent_variant_id,
        emi_order,
    ) {
        const sql = `select *, a.id as variant_id from (select * from variants where master_parent_variant_id=${master_parent_variant_id}) as a inner join package as b on a.package_id=b.id where b.emi_order > ${emi_order}`;
        return database.query(sql);
    }

    static getFlagIDKeysFromAssortmentId(database, assortmentIds, batchID) {
        const sql = "select distinct(flag_key), assortment_id from package where assortment_id in (?) and type='subscription' and is_active=1 and reference_type='v3' and flag_key is not null and batch_id=? order by duration_in_days desc";
        return database.query(sql, [assortmentIds, batchID]);
    }

    static getFlagIDKeysFromAssortmentIdWithReferralPackages(database, assortmentIds, batchID) {
        const sql = "select distinct(flag_key), assortment_id from package where assortment_id in (?) and type='subscription' and is_active=1 and reference_type in ('v3','referral') and flag_key is not null and batch_id=? order by duration_in_days desc";
        return database.query(sql, [assortmentIds, batchID]);
    }

    static getFlagIDKeysFromAssortmentIdWithAutosalesCampaign(database, assortmentIds, batchID) {
        const sql = "select distinct(flag_key), assortment_id from package where assortment_id in (?) and type='subscription' and is_active=1 and reference_type in ('v3','bnb_autosales') and flag_key is not null and batch_id=? order by duration_in_days desc";
        return database.query(sql, [assortmentIds, batchID]);
    }

    static getDefaultVariants(database, flagKey) {
        const sql = `select b.* from (select id, type from package where flag_key='${flagKey}') as a join (select id, package_id from variants where is_default=1) as b on a.id=b.package_id`;
        return database.query(sql);
    }

    static getPackageDetailsFromVariant(database, variants) {
        const sql = `select *,a.id as variant_id from (select * from variants where id in (${variants.join(
            ',',
        )})) as a left join package as b on a.package_id=b.id where b.id is not null;`;
        console.log(sql);
        return database.query(sql);
    }

    static getnextVariantId(database, emiOrder, masterPackage) {
        const sql = 'select b.id as variant_id from (select * from package where master_parent=? and emi_order=?) as a left join (select * from variants where (previous_package_id<>1 or previous_package_id is null)) as b on b.package_id=a.id where b.id is not null;';
        console.log(sql);
        return database.query(sql, [masterPackage, emiOrder]);
    }

    static getVariantDetails(database, variantId) {
        const sql = 'select *,id as variant_id from variants where id=? and (previous_package_id<>1 or previous_package_id is null) and is_show=1;';
        return database.query(sql, [variantId]);
    }

    static getDefaultVariantFromAssortmentId(database, assortmentIds, batchID) {
        const sql = 'select * from (select id, type, assortment_id, name, description, duration_in_days from package where assortment_id in (?) and flag_key is null and reference_type=\'v3\' and type=\'subscription\' and is_active=1 and batch_id=?) as a inner join (select id as variant_id, package_id, base_price, display_price from variants where is_default=1 and is_show=1) as b on a.id=b.package_id order by a.duration_in_days';
        return database.query(sql, [assortmentIds, batchID]);
    }

    static getDefaultVariantFromAssortmentIdHome(database, assortmentId) {
        const sql = 'select * from (select id, type, assortment_id, name, description, duration_in_days, flag_key, batch_id from package where assortment_id =? and is_active=1 and reference_type=\'v3\' and type=\'subscription\') as a inner join (select id as variant_id, package_id, base_price, display_price from variants where is_default=1 and is_show=1) as b on a.id=b.package_id order by a.duration_in_days';
        return database.query(sql, [assortmentId]);
    }

    static getDefaultVariantFromAssortmentReferral(database, assortmentId) {
        const sql = 'select * from (select id,reference_type, type, assortment_id, name, description, duration_in_days, flag_key, batch_id from package where assortment_id in (?) and is_active=1 and reference_type=\'referral\' and type=\'subscription\') as a inner join (select id as variant_id, package_id, base_price, display_price from variants where is_default=1 and is_show=1) as b on a.id=b.package_id order by a.duration_in_days';
        return database.query(sql, [assortmentId]);
    }

    static getDefaultVariantFromAssortmentAutosalesCampaign(database, assortmentId) {
        const sql = 'select * from (select id,reference_type, type, assortment_id, name, description, duration_in_days, flag_key, batch_id from package where assortment_id =? and is_active=1 and reference_type=\'bnb_autosales\' and type=\'subscription\') as a inner join (select id as variant_id, package_id, base_price, display_price from variants where is_default=1 and is_show=1) as b on a.id=b.package_id order by a.duration_in_days';
        return database.query(sql, [assortmentId]);
    }

    static getAllVariantFromAssortmentIdHome(database, flagKey, keyId) {
        const sql = 'select * from (select id, reference_type, type, assortment_id, name, description, duration_in_days, batch_id from package where flag_key=? and flag_key is not null and reference_type in (\'v3\', \'referral\') and type=\'subscription\' and is_active = 1) as a inner join (select id as variant_id, package_id, base_price, display_price from variants where flagr_variant_id=?) as b on a.id=b.package_id order by a.duration_in_days';
        console.log(sql);
        return database.query(sql, [flagKey, keyId]);
    }

    static getEmiVariantOfPackage(database, variantId) {
        const sql = 'select b.*, assortment_id, a.variant_id, b.id as emi_variant, a.type, b.display_price, a.total_emi from (select id, type, assortment_id, variant_id,total_emi from package where variant_id=? and type=\'emi\' and master_parent is null and reference_type=\'v3\') as a inner join (select id, package_id, display_price from variants where is_default=1) as b on a.id=b.package_id';
        console.log(sql);
        return database.query(sql, [variantId]);
    }

    static getAllActiveStudentPackagesWithPackagetDetails(
        database,
        studentId,
        studentClass,
    ) {
        const sql = `select * from (select * from student_package_subscription where is_active=1 and start_date <= CURRENT_DATE and end_date >= CURRENT_DATE and student_id= ${studentId}) as a inner join (select * , description as sub_title from package) as b on a.new_package_id= b.id inner join (select * from course_details where class=${studentClass}) as c on c.assortment_id=b.assortment_id`;
        console.log(sql);
        return database.query(sql);
    }

    static getBulkPackageDetailFromEmiPackageId(database, packageId) {
        const sql = `select * from (select variant_id from package where id=${packageId}) as a inner join (select package_id, id from variants) as b on a.variant_id=b.id inner join package as c on b.package_id=c.id`;
        return database.query(sql);
    }

    static getPackagesForPanel(database) {
        const sql = 'select * from (select id,name,duration_in_days,type,reference_type,assortment_id,emi_order,is_last,master_parent from package where is_active=1) as a inner join (select distinct assortment_id from course_details where (assortment_type = \'course\' or (assortment_type = \'subject\' and category in (\'State Boards\',\'CBSE Boards\')))) as b on a.assortment_id=b.assortment_id left join (select distinct package_id, base_price, display_price,id as variant_id,master_parent_variant_id from variants where is_show_panel <> 0) as c on a.id=c.package_id';
        return database.query(sql);
    }

    static getPackageByAssortmentIdForTrial(database, assortmentId) {
        const sql = "select * from (select * from package where assortment_id=? and reference_type='v3' and type='subscription') as p inner join (select assortment_id, start_date from course_details where assortment_id=?) as cd on cd.assortment_id=p.assortment_id order by p.id";
        return database.query(sql, [assortmentId, assortmentId]);
    }

    static getTrialEntryByAssortmentId(database, studentId, assortmentId) {
        const sql = 'select sps.* from student_package_subscription sps join package p on p.id = sps.new_package_id where sps.student_id = ? and sps.amount = -1 and p.assortment_id = ?';
        return database.singleQueryTransaction(sql, [studentId, assortmentId]);
    }

    static getAllMasterVariants(database) {
        const sql = "select v.* from (select * from package where type='emi' and master_parent is null) as p inner join variants as v on v.package_id=p.id";
        return database.query(sql);
    }

    static getActiveEmiPackageAndRemainingDays(database, studentID) {
        const sql = "select *, c.id as variant_id from (select * from student_package_subscription where student_id = ? and end_date > CURRENT_DATE() and end_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 10 DAY)) as a inner join (select * from package where type= 'emi') as b on a.new_package_id=b.id inner join (select * from variants) as c on a.new_package_id=c.package_id order by a.id desc limit 1";
        return database.query(sql, [studentID]);
    }

    static getNextPackageVariant(database, masterParent, emiOrder) {
        const sql = 'select * , b.id as variant_id from (select * from package where master_parent=? and emi_order = ? ) as a inner join (select * from variants) as b on a.id=b.package_id';
        return database.query(sql, [masterParent, emiOrder]);
    }

    static checkTrail(database, studentID) {
        const sql = `SELECT * FROM student_package_subscription where student_id =${studentID} and amount = -1`;
        return database.query(sql, [studentID]);
    }

    static getAllPaymentSummary(database, studentID) {
        const sql = `select * from payment_summary where  student_id =${studentID} order by id DESC`;
        return database.query(sql, [studentID]);
    }

    static getStudentTrailPackageDetails(database, studentID) {
        const sql = `select  sps.student_id,sps.start_date,sps.new_package_id,stu.student_fname,stu.student_email,stu.mobile, pkg.name,pkg.duration_in_days, var.base_price, var.display_price, var.id from  student_package_subscription as sps
        LEFT JOIN
        students as stu
        ON sps.student_id = stu.student_id
        LEFT JOIN
        package as pkg
        ON pkg.id = sps.student_id
        LEFT JOIN
        variants as var
        on pkg.id = var.package_id
        where  stu.student_id = ${studentID}`;
        console.log(`getStudentTrailPackageDetails${sql}`);
        return database.query(sql, [studentID]);
    }

    static getRecentHistory(database, assortmentID, batchID) {
        const sql = 'select a.*, b.subject, b.topic, b.name from (select course_resource_id,live_at, resource_type as assortment_type from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id =? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'resource\' and live_at <= NOW() and batch_id = ?) as a left join course_resources as b on a.course_resource_id=b.id where b.resource_type in (1,4,8) order by a.live_at DESC  LIMIT 20';
        console.log(sql);
        return database.query(sql, [assortmentID, batchID]);
    }

    static getCourseDetailsFromAssortmentId(database, assortmentID) {
        const sql = 'select * from course_details where assortment_id=?';
        return database.query(sql, [assortmentID]);
    }

    static getCourseResourcesDetailsFromResourceId(database, courseResourceID) {
        const sql = 'select * from course_resources where id=?';
        return database.query(sql, [courseResourceID]);
    }

    static getPackageClasses(database) {
        const sql = 'SELECT class FROM `course_details` where assortment_type = \'course\' and is_active_sales = 1 and is_free = 0 group by class';
        return database.query(sql);
    }

    static getPackageSubAssortment(database, package_class) {
        const sql = 'SELECT category_type FROM `course_details` where assortment_type = \'course\' and is_active_sales = 1 and is_free = 0 and class = ? group by category_type';
        console.log(sql);
        return database.query(sql, [package_class]);
    }

    static getPackageYear(database, package_class, category) {
        const sql = 'SELECT year_exam FROM `course_details` where assortment_type = \'course\' and is_active_sales = 1 and is_free = 0 and class = ? and category_type = ? group by year_exam';
        console.log(sql);
        return database.query(sql, [package_class, category]);
    }

    static getPackageLanguage(database, package_class, category, year) {
        const sql = 'SELECT meta_info FROM `course_details` where assortment_type = \'course\' and is_active_sales = 1 and is_free = 0 and class = ? and category_type = ? and year_exam = ? group by meta_info';
        console.log(sql);
        return database.query(sql, [package_class, category, year]);
    }

    static getPackageBoard(database, package_class, category, year, language) {
        const sql = 'SELECT category, case when category_type like \'BOARDS%\' then upper(category) else category end as category_display,sub_assortment_type FROM `course_details` where assortment_type = \'course\' and is_active_sales = 1 and is_free = 0 and class = ? and category_type like ? and year_exam = ? and meta_info = ? group by category';
        console.log(sql);
        return database.query(sql, [package_class, category, year, language]);
    }

    static getPackages(database, package_class, category, year, language, board) {
        if (board) {
            // const sql = 'select a.*, cdt.image_url as course_thumbnail, cdb.pdf_url from (SELECT assortment_id,display_name, display_image_rectangle, upper(substring_index(category,\' \',1)) as category_display,sub_assortment_type,class,is_active, is_free FROM `course_details` where assortment_type = \'course\' and is_active_sales = 1 and is_free = 0 and class = ? and category_type like ? and year_exam = ? and meta_info = ? and category = ? and category not like "ETOOS%") as a  left join course_details_thumbnails as cdt on a.assortment_id=cdt.assortment_id and a.class=cdt.class left join course_details_banners as cdb on a.assortment_id=cdb.assortment_id';
            const sql = 'select a.*, concat(pkg.name," | ", a.year_exam) as name, pkg.batch_id, cdt.image_url as course_thumbnail, cdb.pdf_url, cdm.liveclass_course_id, max(pkg.is_active) as pkg_is_active from (SELECT assortment_id,display_name, display_image_rectangle, upper(substring_index(category," ",1)) as category_display,sub_assortment_type,class,is_active, is_free, is_active_sales, year_exam, parent FROM `course_details` where assortment_type in ( "course","course_bundle")  and is_free = 0 and class = ? and category_type like ?  and meta_info = ? and category = ?  and category not like "ETOOS%") as a  left join course_details_thumbnails as cdt on a.assortment_id=cdt.assortment_id and a.class=cdt.class left join package as pkg on a.assortment_id = pkg.assortment_id left join course_details_banners as cdb on a.assortment_id=cdb.assortment_id and pkg.batch_id=cdb.batch_id  left join course_details_liveclass_course_mapping as cdm on a.assortment_id=cdm.assortment_id  group by a.assortment_id, batch_id order by a.parent, a.assortment_id DESC, pkg.batch_id';
            return database.query(sql, [package_class, category, language, board]);
        }
        // const sql = 'select a.*, cdt.image_url as course_thumbnail, cdb.pdf_url from (SELECT assortment_id,display_name, display_image_rectangle, upper(substring_index(category,\' \',1)) as category_display,sub_assortment_type,class,is_active, is_free FROM `course_details` where assortment_type = \'course\' and is_active_sales = 1 and is_free = 0 and class = ? and category_type like ? and year_exam = ? and meta_info = ? and category not like "ETOOS%") as a  left join course_details_thumbnails as cdt on a.assortment_id=cdt.assortment_id and a.class=cdt.class left join course_details_banners as cdb on a.assortment_id=cdb.assortment_id';
        const sql = 'select a.*, concat(pkg.name," | ", a.year_exam) as name, pkg.batch_id, cdt.image_url as course_thumbnail, cdb.pdf_url, cdm.liveclass_course_id,  max(pkg.is_active) as pkg_is_active from (SELECT assortment_id,display_name, display_image_rectangle, upper(substring_index(category," ",1)) as category_display,sub_assortment_type,class,is_active, is_active_sales, is_free, year_exam, parent FROM `course_details` where assortment_type in ( "course","course_bundle") and is_free = 0 and class = ? and category_type like ?  and meta_info = ? and category not like "ETOOS%") as a  left join course_details_thumbnails as cdt on a.assortment_id=cdt.assortment_id and a.class=cdt.class left join package as pkg on a.assortment_id = pkg.assortment_id left join course_details_banners as cdb on a.assortment_id=cdb.assortment_id and pkg.batch_id=cdb.batch_id  left join course_details_liveclass_course_mapping as cdm on a.assortment_id=cdm.assortment_id group by a.assortment_id, batch_id order by a.parent , a.assortment_id DESC, pkg.batch_id';
        return database.query(sql, [package_class, category, language]);
    }

    static getVariants(database, assortmentID) {
        const sql = 'SELECT a.id as package_id, a.duration_in_days,b.display_price, b.id, a.assortment_id, b.is_default, b.is_show_panel, a.batch_id, a.name, a.type from (SELECT * from package where assortment_id = ? and type in ("subscription", "emi") and master_parent is null and is_active=1 and reference_type in (\'v3\', \'onlyPanel\', \'default\')) as a left join variants as b on a.id = b.package_id where (b.is_show_panel <> 0 or b.is_show=1) order by a.duration_in_days DESC';
        return database.query(sql, [assortmentID]);
    }

    static getEMIVariants(database, assortmentID, packageID) {
        const sql = 'SELECT a.id as package_id, a.duration_in_days,b.display_price, b.id, a.assortment_id, b.is_default, b.is_show_panel, a.batch_id, a.name, case when a.type = "emi" then "emi_instalments" end as type, a.emi_order, a.emi_duration from (SELECT * from package where assortment_id = ? and master_parent = ? and type in ("emi") and is_active=1) as a left join variants as b on a.id = b.package_id where (b.is_show_panel <> 0 or b.is_show=1) order by a.emi_order ASC';
        return database.query(sql, [assortmentID, packageID]);
    }

    static getNextEMIVariant(database, assortmentID, subscriptionID) {
        const sql = 'SELECT a.id as package_id, a.duration_in_days,b.display_price, b.id, a.assortment_id, b.is_default, b.is_show_panel, a.batch_id, a.name, case when a.type = "emi" then "emi_instalments" end as type from (SELECT * from package where assortment_id = ? and parent = (select new_package_id from student_package_subscription where id = ?) and type in ("emi") and is_active=1 and reference_type in (\'v3\', \'onlyPanel\', \'default\')) as a left join variants as b on a.id = b.package_id where (b.is_show_panel <> 0 or b.is_show=1) order by a.duration_in_days DESC';
        return database.query(sql, [assortmentID, subscriptionID]);
    }

    static getVariantDetailsById(database, variantId) {
        const sql = 'SELECT a.id as package_id, a.duration_in_days,b.display_price, b.id, a.assortment_id, b.is_default, b.is_show_panel, a.batch_id, a.name, a.type from (SELECT * from variants where id = ?) as b join package as a on b.package_id = a.id  where (b.is_show_panel <> 0 or b.is_show=1) order by a.duration_in_days DESC';
        return database.query(sql, [variantId]);
    }

    static getMaxValidityPackageFromAssortmentID(database, assortmentID) {
        const sql = 'SELECT id, duration_in_days from package where assortment_id = ? and type=\'subscription\' and is_active=1 and reference_type=\'v3\' order by duration_in_days desc';
        return database.query(sql, [assortmentID]);
    }

    static getMaxValidityPackageFromAssortmentIDPanel(database, assortmentID) {
        const sql = 'SELECT id, duration_in_days from package where assortment_id = ? and type=\'subscription\' and is_active=1 and reference_type in (\'v3\', \'onlyPanel\') order by duration_in_days desc';
        return database.query(sql, [assortmentID]);
    }

    static getCourseTeachers(database, assortmentID) {
        const sql = 'select * from course_teacher_mapping where assortment_id =?';
        return database.query(sql, [assortmentID]);
    }

    static getCourseSubjects(database, assortmentID) {
        const sql = 'select * from course_subject_mapping where assortment_id =?';
        return database.query(sql, [assortmentID]);
    }

    static getCourseTestimonials(database, assortmentID) {
        const sql = 'select * from course_testimonials where assortment_id =?';
        return database.query(sql, [assortmentID]);
    }

    static getCourseDemoVideos(database, assortmentID) {
        const sql = 'select * from course_demo_videos where assortment_id =? group by assortment_id,subject_ass_id,video_ass_id';
        return database.query(sql, [assortmentID]);
    }

    static getCourseSyllabus(database, assortmentID) {
        const sql = 'select * from course_syllabus_mapping where assortment_id =? and subject is not null';
        return database.query(sql, [assortmentID]);
    }

    static getCourseSamplePDF(database, assortmentID, subject) {
        let sql = '';
        if (subject) {
            sql = 'select * from course_sample_pdf where assortment_id =? and subject=? and resource_type=2';
            return database.query(sql, [assortmentID, subject]);
        }
        sql = 'select * from course_sample_pdf where assortment_id =? and resource_type=2';
        return database.query(sql, [assortmentID]);
    }

    static getCourseTimeTable(database, assortmentID, batchID) {
        const sql = 'select * from liveclass_schedule_all where assortment_id=? and week_day_num <> 7 and batch_id=? and is_active=1';
        return database.query(sql, [assortmentID, batchID]);
    }

    static getReferrenceBooks(database, assortmentID) {
        const sql = 'select * from assortment_studentid_package_mapping where assortment_id=?';
        return database.query(sql, [assortmentID]);
    }

    static getCompetitionAnalysis(database) {
        const sql = 'SELECT comp_id, comp_name, comparison_dimension, dn_score, comp_score, summary_remarks  FROM `course_dn_vs_competition`';
        return database.query(sql);
    }

    static getWhyDoubtnut(database) {
        const sql = 'SELECT * FROM `course_dn_usp`';
        return database.query(sql);
    }

    static getCredibility(database) {
        const sql = 'SELECT * FROM `course_dn_creds` order by dimension_id';
        return database.query(sql);
    }

    static getPaymentTutorials(database) {
        const sql = 'SELECT * FROM `course_payment_tutorial`';
        return database.query(sql);
    }

    static getCourseBasicDetails(database, assortmentID) {
        const sql = 'select a.*,b.inclusions, c.batch_start_date, c.batch_end_date  from (select  meta_info, assortment_id, display_name, category, demo_video_qid from course_details where assortment_id=? limit 1) as a left join course_inclusions as b on a.assortment_id=b.assortment_id left join course_assortment_batch_mapping as c on a.assortment_id=c.assortment_id';
        return database.query(sql, [assortmentID]);
    }

    static getCourseDnSpecial(database, assortmentID) {
        const sql = 'select * from course_dn_special where assortment_id in (?, 0)';
        return database.query(sql, [assortmentID]);
    }

    static getSubjectVariants(database, assortmentID, batchAssortmentID) {
        const sql = 'SELECT distinct a.id as package_id,a.name as package_name, a.duration_in_days,b.display_price, b.id, a.assortment_id, b.is_default, b.is_show_panel,concat (c.display_name, " ",a.duration_in_days, " Days Validity") as display_name, c.display_name as display_subject from (SELECT * from package where assortment_id in (SELECT course_resource_id  FROM course_resource_mapping WHERE assortment_id = ? and name not in ("INTRODUCTION","GUIDANCE","ANNOUNCEMENT")) and type="subscription" and is_active=1 and batch_id=?) as a left join variants as b on a.id = b.package_id left join course_details as c on a.assortment_id = c.assortment_id where (b.is_show_panel <> 0 or b.is_show=1) and b.is_default = 1 order by a.duration_in_days DESC';
        return database.query(sql, [assortmentID, batchAssortmentID]);
    }

    static getTimeTablePDF(database, assortmentID, batchID) {
        const sql = 'select * from course_details_banners where assortment_id = ? and batch_id=?';
        return database.query(sql, [assortmentID, batchID]);
    }

    static updateStudentRenewalTargetGroup(database, studentId, assortmentID) {
        const sql = 'update student_renewal_target_group set is_active=0 where student_id=? and assortment_id=?';
        return database.query(sql, [studentId, assortmentID]);
    }

    static insertCRMLogging(database, obj) {
        const sql = 'insert into crm_sales_logging SET ?';
        return database.query(sql, [obj]);
    }

    static getSubjectVariantsFromAssortmentAndBatchID(database, assortmentID, batchID) {
        const sql = 'select crm.course_resource_id as assortment_id,v.id,p.name, p.duration_in_days, p.batch_id, v.display_price from (select course_resource_id from course_resource_mapping crm where assortment_id=? and resource_type=\'assortment\' and name not in ("INTRODUCTION","GUIDANCE","ANNOUNCEMENT")) as crm left join package as p on crm.course_resource_id=p.assortment_id left join variants as v on p.id=v.package_id left join (SELECT assortment_id,min(is_active_sales) as is_active_sales from course_details where is_free=0 and assortment_type =\'subject\' group by assortment_id) as cd2 on crm.course_resource_id=cd2.assortment_id where p.batch_id=? and p.is_active=1 and (v.is_show_panel <> 0 or v.is_show=1) and v.is_default=1 and p.type="subscription" order by p.duration_in_days DESC';
        return database.query(sql, [assortmentID, batchID]);
    }

    static getPackageDetailsFromPackageId(database, packageID) {
        const sql = "select * from (select * from package where id=? and reference_type='v3' and type='subscription') as p inner join course_details as cd on cd.assortment_id=p.assortment_id order by p.id";
        return database.query(sql, [packageID]);
    }

    static getAssortmentsUsingAgentIdStudentIdFromCrmLogs(database, data) {
        const sql = 'select * from crm_sales_logging where login_id=? and student_id=? order by id DESC LIMIT 1';
        return database.query(sql, [data.agent_id, data.student_id]);
    }

    static getSubscriptionDetailsWithPaymentInfoId(database, paymentInfoId) {
        const sql = 'select * from student_package_subscription where payment_info_id = ?';
        return database.query(sql, [paymentInfoId]);
    }

    static getSubscriptionDetailsWithPaymentInfoIdAndVariantId(database, paymentInfoId, variantId) {
        const sql = 'select * from student_package_subscription where payment_info_id = ? and variant_id =? ';
        return database.query(sql, [paymentInfoId, variantId]);
    }

    static getPaymentSummaryWithTxnId(database, txnId) {
        const sql = 'select * from payment_summary where txn_id = ?';
        return database.query(sql, [txnId]);
    }

    static getPaymentSummaryWithTxnIdAndVariantId(database, txnId, variantId) {
        const sql = 'select * from payment_summary where txn_id = ? and variant_id = ?';
        return database.query(sql, [txnId, variantId]);
    }

    static updatePaymentSummaryObjWithId(database, obj, id) {
        const sql = 'update payment_summary set ? where id = ?';
        return database.query(sql, [obj, id]);
    }

    static getPackageDetailsUsingSubscriptionId(database, subId) {
        const sql = 'select p.assortment_id from (select new_package_id from student_package_subscription where id = ?) as sps left join package as p on sps.new_package_id=p.id';
        return database.query(sql, [subId]);
    }

    static updateNkcQc(database, isApproved, expert_id, student_id) {
        const sql = 'update nkc_old_students set is_approved=?, approved_by=? where student_id=?';
        return database.query(sql, [isApproved, expert_id, student_id]);
    }

    static getDoubtnutPaywallUserBucketWithPackageId(database, student_id) {
        const sql = 'select * from student_doubtnut_paywall_bucket_mapping as a join dn_property as b on b.id = a.dn_property_bucket_id join doubtnut_paywall_bucket_package_mapping as c on c.dn_property_id = b.id where a.student_id = ?';
        return database.query(sql, [student_id]);
    }

    static getDoubtLimitPackagesByPackageIdsAndCountry(database, packageIds, country) {
        const sql = `select *, v.id as variant_id from package p join variants v on v.package_id = p.id where p.id IN (${packageIds.join(',')}) and p.reference_type = "doubt" and p.country = '${country}' and p.is_active = 1 order by package_order desc`;
        console.log(sql);
        return database.query(sql);
    }
};
