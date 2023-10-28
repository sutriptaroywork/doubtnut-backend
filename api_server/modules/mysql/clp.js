const _ = require('lodash');

module.exports = class clp {
    static getLatestChapterBySubject(database, studentClass, metaInfo, subject) {
        if (+studentClass < 13 && +studentClass > 6) {
            const sql = `select
            cd_course.assortment_id as course_assortment_id,
            cd_course.display_name as course_name,
            cd_subject.assortment_id as subject_assortment_id,
            cd_subject.display_name as subject_name,
            cd_chapter.assortment_id  as chapter_assortment_id,
            cd_chapter.display_name as chapter_name,
            cr.expert_name,
            cr.resource_type
        from
            course_details as cd_course
        inner join course_resource_mapping crm_subject on
            crm_subject.assortment_id = cd_course.assortment_id
            and cd_course.class = ?
            and cd_course.is_active = 1
            and cd_course.assortment_type = 'course'
            and cd_course.is_free = 1
            and cd_course.category_type = 'BOARDS/SCHOOL/TUITION'
            and cd_course.meta_info in (?)
            and cd_course.assortment_id in (159772, 159773, 159774, 159775, 165049, 165050, 165051, 165052, 165053, 165054, 165055, 165056, 165057, 165058, 330514, 330515, 330516, 330517, 330518, 330519, 330520, 330521, 23, 31, 324960, 324961, 344177)
        inner join course_details cd_subject on
            cd_subject.assortment_id = crm_subject.course_resource_id
            and cd_subject.display_name not in ('ALL', 'WEEKLY TEST', 'GUIDANCE', 'QUIZ', 'ANNOUNCEMENT')
            and cd_subject.is_active >0
            and cd_subject.display_name in (?)
        INNER join course_resource_mapping crm_chapter on crm_chapter.assortment_id =cd_subject.assortment_id  
        INNER join course_details cd_chapter on crm_chapter.course_resource_id = cd_chapter.assortment_id 
        INNER join course_resource_mapping crm_resource_assortment on crm_chapter.course_resource_id  =crm_resource_assortment.assortment_id
        INNER join course_resource_mapping crm_resource on crm_resource_assortment.course_resource_id  =crm_resource.assortment_id  
        INNER join course_resources cr on cr.id = crm_resource.course_resource_id and cr.resource_type in (1,4,8)`;// 100 ms
            return database.query(sql, [+studentClass, metaInfo, subject]);
        }
        const sql = `select
        cd_course.assortment_id as course_assortment_id,
        cd_course.display_name as course_name,
        cd_subject.assortment_id as subject_assortment_id,
        cd_subject.display_name as subject_name,
        cd_chapter.assortment_id  as chapter_assortment_id,
        cd_chapter.display_name as chapter_name,
        cr.expert_name,
        cr.resource_type
    from
        course_details as cd_course
    inner join course_resource_mapping crm_subject on
        crm_subject.assortment_id = cd_course.assortment_id
        and cd_course.class = ?
        and cd_course.is_active = 1
        and cd_course.assortment_type = 'course'
        and cd_course.is_free = 1
        and category_type in ('BOARDS/SCHOOL/TUITION' ,'SSC','DEFENCE/NDA/NAVY','RAILWAY','BANKING','CTET')            
        and cd_course.assortment_id in (159772, 159773, 159774, 159775, 165049, 165050, 165051, 165052, 165053, 165054, 165055, 165056, 165057, 165058, 330514, 330515, 330516, 330517, 330518, 330519, 330520, 330521, 23, 31, 324960, 324961, 344177)
    inner join course_details cd_subject on
        cd_subject.assortment_id = crm_subject.course_resource_id
        and cd_subject.display_name not in ('ALL', 'WEEKLY TEST', 'GUIDANCE', 'QUIZ', 'ANNOUNCEMENT')
        and cd_subject.is_active >0
        and cd_subject.display_name in (?)
    INNER join course_resource_mapping crm_chapter on crm_chapter.assortment_id =cd_subject.assortment_id  
    INNER join course_details cd_chapter on crm_chapter.course_resource_id = cd_chapter.assortment_id 
    INNER join course_resource_mapping crm_resource_assortment on crm_chapter.course_resource_id  =crm_resource_assortment.assortment_id
    INNER join course_resource_mapping crm_resource on crm_resource_assortment.course_resource_id  =crm_resource.assortment_id  
    INNER join course_resources cr on cr.id = crm_resource.course_resource_id and cr.resource_type in (1,4,8)`;// 100 ms
        return database.query(sql, [+studentClass, subject]);
    }

    static getChapterDataByAssortmentId(database, assortmentId) {
        const sql = `select
        expert_name,
        faculty_id,
        cd.assortment_id,
        cd.meta_info,
        cd.display_name
    from
        course_details cd
    left join course_resource_mapping crm on
        crm.assortment_id = cd.assortment_id and resource_type = 'assortment'
    left join course_resource_mapping crm2 on
        crm.course_resource_id  = crm2.assortment_id  and crm2.resource_type = 'resource'
    LEFT join course_resources cr on
        cr.id = crm2.course_resource_id
    where
        cd.assortment_id = ?`;// 30 ms
        return database.query(sql, [assortmentId]);
    }

    static getSubjectDataFromChapter(database, assortmentId) {
        const sql = 'SELECT display_name, cd.assortment_id from course_details cd left join course_resource_mapping crm on cd.assortment_id  =crm.assortment_id and crm.resource_type=\'assortment\'  where crm.course_resource_id  = ? and assortment_type =\'subject\'';// 10 ms
        return database.query(sql, [assortmentId]);
    }
};
