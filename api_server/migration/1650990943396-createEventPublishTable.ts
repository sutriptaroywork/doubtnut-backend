import {MigrationInterface, QueryRunner} from "typeorm";

export class createEventPublishTable1650990943396 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        CREATE TABLE events_publishing (
          id int(11) NOT NULL AUTO_INCREMENT,
          screen_name varchar(255) NOT NULL,
          platform enum('metabase','apxor','moengage') NOT NULL,
          field_type enum('event','attribute') NOT NULL,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by varchar(100) NOT NULL,
            is_active tinyint(1) NOT NULL DEFAULT 1,
            api_endpoint enum('/v7/course/get-detail','/v3/tesla/feed') not null,
            field varchar(100) NOT NULL,
            event_name varchar(100) NOT NULL,
            PRIMARY KEY (id),
            KEY events_publish_api_endpoints (api_endpoint)
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE events_publishing");
    }
}
