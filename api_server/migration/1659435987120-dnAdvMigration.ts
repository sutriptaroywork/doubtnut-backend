import {MigrationInterface, QueryRunner} from "typeorm";

export class dnAdvMigration1659435987120 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE dn_adv_vendor_banner_data (
                id int(11) NOT NULL AUTO_INCREMENT,
                feature_id int(11) DEFAULT NULL,
                ccm_id int(11) DEFAULT NULL,
                banner_url varchar(255) DEFAULT NULL,
                banner_height int(11) DEFAULT NULL,
                banner_width int(11) DEFAULT NULL,
                deeplink varchar(255) DEFAULT NULL,
                start_date timestamp NULL DEFAULT NULL,
                end_date timestamp NULL DEFAULT NULL,
                is_active tinyint(4) DEFAULT '1',
                vendor_id int(11) DEFAULT NULL,
                extra_params varchar(255) DEFAULT NULL,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_dn_adv_facse (feature_id,is_active,ccm_id,start_date,end_date),
                KEY idx_dn_adv_ase (is_active,start_date,end_date)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`
        );
        await queryRunner.query(
            `ALTER TABLE icons_latest CHANGE screen_type screen_type ENUM('','CAMERA_NAVIGATION','CAMERA_PAGE_BOTTOM_SHEET','HOME_ALL','CAMERA_EXPLORE_ALL','APP_NAVIGATION','CAMERA_CAMPAIGN','CAMERA_NAVIGATION_BUNIYAD')
            CHARACTER SET utf8
            COLLATE utf8_general_ci
            NULL
            DEFAULT ''`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE dn_adv_vendor_banner_data");
        await queryRunner.query(
            `ALTER TABLE icons_latest CHANGE screen_type screen_type ENUM('','CAMERA_NAVIGATION','CAMERA_PAGE_BOTTOM_SHEET','HOME_ALL','CAMERA_EXPLORE_ALL','APP_NAVIGATION','CAMERA_CAMPAIGN')
            CHARACTER SET utf8
            COLLATE utf8_general_ci
            NULL
            DEFAULT ''`
        );
    }

}
