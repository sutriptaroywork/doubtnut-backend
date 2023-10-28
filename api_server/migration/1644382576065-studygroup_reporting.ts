import {MigrationInterface, QueryRunner} from "typeorm";

export class studygroupReporting1644382576065 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE study_group_reporting CHANGE updated_at updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE study_group_reporting CHANGE updated_at updated_at datetime DEFAULT NULL");
    }

}
