import {MigrationInterface, QueryRunner} from "typeorm";

export class ClassSubjectLocaleFacultyidMappingChanges1645446464001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE class_subject_locale_facultyid_mapping (
            id int(11) unsigned NOT NULL AUTO_INCREMENT,
            class int(11) DEFAULT NULL,
            subject varchar(50) DEFAULT NULL,
            locale varchar(25) DEFAULT NULL,
            faculty_id int(11) DEFAULT NULL,
            is_active tinyint(1) DEFAULT '1',
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY class (class),
            KEY subject (subject),
            KEY locale (locale),
            KEY faculty_id (faculty_id),
            KEY is_active (is_active)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE class_subject_locale_facultyid_mapping");

    }

}