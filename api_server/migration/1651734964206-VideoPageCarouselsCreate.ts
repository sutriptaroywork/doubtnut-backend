import {MigrationInterface, QueryRunner} from "typeorm";

export class VideoPageCarouselsCreate1651734964206 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE video_page_carousels (
            id int(11) unsigned NOT NULL AUTO_INCREMENT,
            carousel_type varchar(100) DEFAULT NULL,
            view_type varchar(100) DEFAULT NULL,
            carousel_order int(11) DEFAULT NULL,
            scroll_type varchar(100) DEFAULT NULL,
            scroll_size varchar(50) DEFAULT NULL,
            query text,
            query_data_limit int(11) NOT NULL DEFAULT '10',
            is_active int(11) DEFAULT NULL,
            class int(11) DEFAULT NULL,
            locale varchar(100) DEFAULT NULL,
            ccm_ids varchar(255) DEFAULT NULL,
            min_version_code int(11) DEFAULT NULL,
            max_version_code int(11) DEFAULT NULL,
            flagVariant int(11) DEFAULT NULL,
            title text,
            title_hindi text,
            subtitle text,
            subtitle_hindi text,
            user_type enum('ALL','FREE','VIP') DEFAULT 'ALL',
            et_greater_than int(11) DEFAULT '0',
            et_less_than int(11) DEFAULT NULL,
            subject_filter varchar(1024) DEFAULT NULL,
            page varchar(255) DEFAULT NULL,
            PRIMARY KEY (id)
          )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE video_page_carousels");
    }

}
