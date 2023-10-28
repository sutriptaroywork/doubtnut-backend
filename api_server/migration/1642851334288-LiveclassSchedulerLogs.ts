import {MigrationInterface, QueryRunner} from "typeorm";

export class LiveclassSchedulerLogs1642851334288 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS liveclass_scheduler_logs`);
        await queryRunner.query(`CREATE TABLE liveclass_scheduler_logs (
            id int(11) unsigned NOT NULL AUTO_INCREMENT,
            question_id int(11) DEFAULT NULL,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY question_id (question_id,created_at),
            KEY created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE liveclass_scheduler_logs`);
    }

}
