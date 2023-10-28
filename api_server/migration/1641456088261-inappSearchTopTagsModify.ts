import {MigrationInterface, QueryRunner} from "typeorm";

export class inappSearchTopTagsModify1641456088261 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE inapp_search_suggestion_video  ADD locale VARCHAR(20) NULL DEFAULT NULL  AFTER question");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE inapp_search_suggestion_video DROP column locale");
    }

}
