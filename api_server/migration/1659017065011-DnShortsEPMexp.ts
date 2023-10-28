import { MigrationInterface, QueryRunner } from "typeorm"

export class DnShortsEPMexp1659017065011 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE dn_shorts_new_user 
            ADD column per_comp INT(11) NOT NULL AFTER engage_time/video_views,
            ADD column experiment VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL AFTER engage_time/video_views`
        );
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table dn_shorts_new_user drop column per_comp, drop column experiment");
        
    }

}
