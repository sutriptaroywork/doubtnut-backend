import {MigrationInterface, QueryRunner} from "typeorm";

export class inAppSearchTopTagsDataSizeInc1641989263161 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `inapp_search_top_tags` CHANGE `data` `data` VARCHAR(4000) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `inapp_search_top_tags` CHANGE `data` `data` VARCHAR(2500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;");
    }

}
