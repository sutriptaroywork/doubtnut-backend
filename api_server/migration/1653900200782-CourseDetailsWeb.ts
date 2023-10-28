import {MigrationInterface, QueryRunner} from "typeorm";

export class CourseDetailsWeb1653900200782 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE course_details CHANGE show_on_app is_show_web tinyint(4)`
                )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE course_details CHANGE is_show_web show_on_app tinyint(4)`
                )
    }

}
