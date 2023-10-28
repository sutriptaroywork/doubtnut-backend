import {MigrationInterface, QueryRunner} from "typeorm";

export class weeklyTeacherLeaderboardCreate1646331657363 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE teacher_leaderboard_weekly (
            teacher_id int(11) NOT NULL,
            weekly_start_date varchar(255) NOT NULL DEFAULT '',
            fname varchar(255) DEFAULT NULL,
            lname varchar(255) DEFAULT NULL,
            img_url varchar(256) DEFAULT NULL,
            vv int(11) DEFAULT NULL,
            vv_normalized float DEFAULT NULL,
            et int(11) DEFAULT NULL,
            et_normalized float DEFAULT NULL,
            et_by_vv float DEFAULT NULL,
            et_by_vv_normalized float DEFAULT NULL,
            score float DEFAULT NULL,
            rank int(11) DEFAULT NULL,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (teacher_id,weekly_start_date)
          )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE teacher_leaderboard_weekly");
    }

}
