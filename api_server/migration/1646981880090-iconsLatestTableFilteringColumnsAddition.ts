import {MigrationInterface, QueryRunner} from "typeorm";

export class iconsLatestTableFilteringColumnsAddition1646981880090 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE icons_latest ADD title_color VARCHAR(15) NOT NULL DEFAULT '#ffffff' AFTER title,
        ADD description VARCHAR(255) NULL DEFAULT NULL AFTER title_color,
        ADD description_color VARCHAR(15) NULL DEFAULT '#ffffff' AFTER description,
        ADD locale VARCHAR(15) NULL DEFAULT 'en' AFTER class,
        ADD screen_type ENUM('','CAMERA_NAVIGATION','CAMERA_PAGE_BOTTOM_SHEET','HOME_ALL') NULL DEFAULT '' AFTER new_link,
        ADD filter_type ENUM('','subscription','ccm_id') NOT NULL DEFAULT '' AFTER screen_type,
        ADD filter_value VARCHAR(255) NOT NULL DEFAULT '' AFTER filter_type,
        ADD secondary_filter_type ENUM('','subscription','ccm_id') NOT NULL DEFAULT '' AFTER filter_value,
        ADD secondary_filter_value VARCHAR(255) NOT NULL DEFAULT '' AFTER secondary_filter_type
`);
        await queryRunner.query(`create index screen_type on icons_latest(screen_type)`);
        await queryRunner.query(`create index locale on icons_latest(locale)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table icons_latest drop column title_color,
        drop column description,drop column description_color,
        drop column locale,drop column screen_type,
        drop column filter_type,drop column filter_value,
        drop column secondary_filter_type,drop column secondary_filter_value`
        );
        await queryRunner.query(`drop index screen_type on icons_latest`);
        await queryRunner.query(`drop index locale on icons_latest`);
    }
}
