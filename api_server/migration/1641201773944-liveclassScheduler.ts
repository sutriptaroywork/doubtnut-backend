import {MigrationInterface, QueryRunner} from "typeorm";

export class liveclassScheduler1641201773943 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE liveclass_scheduler (
            id int(11) unsigned NOT NULL AUTO_INCREMENT,
            slots int(11) DEFAULT NULL,
            days varchar(150) DEFAULT NULL,
            video_per_subject int(11) DEFAULT NULL,
            total_videos int(11) DEFAULT NULL,
            faculty_rank varchar(11) DEFAULT NULL,
            PRIMARY KEY (id),
            KEY slots (slots),
            KEY days (days)
          ) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE liveclass_scheduler`);
    }

}
