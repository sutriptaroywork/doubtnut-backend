import {MigrationInterface, QueryRunner} from "typeorm";

export class nkcoldStudentsTypeChanges1645108589180 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE nkc_old_students (
            id int(11) NOT NULL AUTO_INCREMENT,
            student_name varchar(200) NOT NULL,
            mobile varchar(255) NOT NULL,
            student_id int(255) NOT NULL,
            student_email varchar(200) DEFAULT NULL,
            old_proof_url varchar(1000) DEFAULT NULL,
            is_approved int(11) NOT NULL DEFAULT '0',
            approved_by varchar(100) DEFAULT NULL,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
          )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE nkc_old_students");
    }

}
