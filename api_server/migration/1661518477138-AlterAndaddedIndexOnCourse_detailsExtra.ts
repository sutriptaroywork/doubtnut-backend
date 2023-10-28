import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterAndaddedIndexOnCourseDetailsExtra1661518477138 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table course_details add index idx_combo2(assortment_type,class,is_active,is_free)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table course_details drop index idx_combo2");
    }

}
