import {MigrationInterface, QueryRunner} from "typeorm";

export class r2v2studentsTableCreation1645533348483 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE r2v2_students (
            student_id int(255) unsigned NOT NULL,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            is_active tinyint(4) NOT NULL DEFAULT '1',
            PRIMARY KEY (student_id)
          )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE r2v2_students");
    }

}
