import {MigrationInterface, QueryRunner} from "typeorm";

export class courseTeacherMappingAddExperience1641408239110 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE course_teacher_mapping ADD experience TINYINT DEFAULT 1 NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE course_teacher_mapping DROP COLUMN experience`);
    }

}
