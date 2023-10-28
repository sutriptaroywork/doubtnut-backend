import { MigrationInterface, QueryRunner } from "typeorm"

export class courseAdvView1659707114830 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE course_ads_view_stats_1 (
                uuid varchar(200) NOT NULL,
                ad_id int(11) NOT NULL,
                student_id int(11) NOT NULL,
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                is_LF int(11) NOT NULL DEFAULT '0',
                updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (uuid),
                KEY ad_id (ad_id),
                KEY student_id (student_id),
                KEY created_at (created_at),
                KEY is_LF (is_LF),
                KEY idx_student_id_is_LF (student_id,is_LF)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`
        );
        await queryRunner.query(
        `CREATE TABLE course_ads_engagetime_stats_1 (
            uuid varchar(200) NOT NULL DEFAULT '',
            engage_time int(11) NOT NULL,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (uuid),
            KEY created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`
        );
        await queryRunner.query(
            `create index idx_campaign_redirection_des on campaign_redirection_mapping (description);`
        );
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("drop table course_ads_view_stats_1");
        await queryRunner.query("drop table course_ads_engagetime_stats_1");
        await queryRunner.query("drop index idx_campaign_redirection_des on campaign_redirection_mapping");
    }

}
