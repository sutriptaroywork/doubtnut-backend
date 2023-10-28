import {MigrationInterface, QueryRunner} from "typeorm";

export class courseBatchMappingMigration1643903969902 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE course_assortment_batch_mapping ADD display_name varchar(200) NULL");
        await queryRunner.query("ALTER TABLE course_assortment_batch_mapping ADD demo_video_thumbnail varchar(500) NULL");
        await queryRunner.query("ALTER TABLE course_assortment_batch_mapping ADD display_description varchar(500) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE course_assortment_batch_mapping DROP COLUMN display_name");
        await queryRunner.query("ALTER TABLE course_assortment_batch_mapping DROP COLUMN demo_video_thumbnail");
        await queryRunner.query("ALTER TABLE course_assortment_batch_mapping DROP COLUMN display_description");
    }

}
