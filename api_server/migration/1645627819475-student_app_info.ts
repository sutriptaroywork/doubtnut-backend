import {MigrationInterface, QueryRunner} from "typeorm";

export class studentAppInfo1645627819475 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE student_app_info (
              id int(11) unsigned NOT NULL AUTO_INCREMENT,
              student_id INT(11) NOT NULL ,
              gcm_reg_id VARCHAR(255)  DEFAULT NULL ,
              gaid VARCHAR(255)  DEFAULT NULL ,
              udid VARCHAR(150)  DEFAULT NULL ,
              package_name ENUM('com.doubtnut.iit.jee.maths','com.doubtnut.neet.biology.ncert') NOT NULL,
              created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              CONSTRAINT UC_student_id_package_name UNIQUE (student_id,package_name),
              PRIMARY KEY (id))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE student_app_info");
    }

}
