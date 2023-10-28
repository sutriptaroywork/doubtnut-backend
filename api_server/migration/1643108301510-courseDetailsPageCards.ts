import {MigrationInterface, QueryRunner} from "typeorm";

export class courseDetailsPageCards1643108301510 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE course_detail_page_cards ADD COLUMN min_version_code INT NULL DEFAULT NULL');
        await queryRunner.query('ALTER TABLE course_detail_page_cards ADD COLUMN max_version_code INT NULL DEFAULT NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE course_detail_page_cards DROP COLUMN min_version_code');
        await queryRunner.query('ALTER TABLE course_detail_page_cards DROP COLUMN max_version_code');
    }

}
