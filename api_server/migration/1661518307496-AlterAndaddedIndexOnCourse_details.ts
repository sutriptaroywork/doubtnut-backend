import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterAndaddedIndexOnCourseDetails1661518307496 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table course_details add index idx_assortment_type_is_active_is_free(assortment_type,is_active,is_free)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table course_details drop index idx_assortment_type_is_active_is_free");
    }

}
