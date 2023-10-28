import { MigrationInterface, QueryRunner } from "typeorm"

export class DnShortsMigrationSubcategoriesId1659365322621 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE dn_shorts_videos 
            ADD column channel_id VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL AFTER category,
            ADD column sub_category VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL AFTER category,
            ADD category_id VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL AFTER category`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table dn_shorts_videos drop column channel_id, drop column sub_category, drop column category_id");
    }

}
