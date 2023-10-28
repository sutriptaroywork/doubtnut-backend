import {MigrationInterface, QueryRunner} from "typeorm";

export class webLandingWidgetsTableCreate1647851458574 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE web_landing_page_widgets (
            id int(11) unsigned NOT NULL AUTO_INCREMENT,
            group_id int(11) DEFAULT NULL,
            widget_type varchar(255) DEFAULT NULL,
            title varchar(255) DEFAULT NULL,
            sub_title varchar(255) DEFAULT NULL,
            image varchar(1500) DEFAULT NULL,
            question_id varchar(255) DEFAULT NULL,
            video_url varchar(1500) DEFAULT NULL,
            text varchar(1500) DEFAULT NULL,
            is_active int(11) DEFAULT '1',
            assortment_id int(11) DEFAULT NULL,
            faculty_id varchar(255) DEFAULT NULL,
            cta varchar(255) DEFAULT NULL,
            landing_url varchar(255) DEFAULT NULL,
            cta_click int(11) DEFAULT NULL,
            priority int(11) DEFAULT NULL,
            PRIMARY KEY (id)
          )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE web_landing_page_widgets");
    }

}
