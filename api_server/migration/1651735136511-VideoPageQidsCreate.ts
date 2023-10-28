import {MigrationInterface, QueryRunner} from "typeorm";

export class VideoPageQidsCreate1651735136511 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE video_page_qids (
            id int(11) unsigned NOT NULL AUTO_INCREMENT,
            class int(11) DEFAULT NULL,
            locale varchar(100) DEFAULT NULL,
            subject varchar(255) DEFAULT NULL,
            ccm_ids varchar(255) DEFAULT NULL,
            is_active int(11) DEFAULT NULL,
            query text,
            query_data_limit int(11) DEFAULT '10',
            PRIMARY KEY (id)
          )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE video_page_qids");
    }

}
