import {MigrationInterface, QueryRunner} from "typeorm";

export class monthlyTeacherLeaderboardCreate1646331608241 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE teacher_leaderboard_monthly (
            teacher_id int(11) NOT NULL,
            year_monthly varchar(255) NOT NULL DEFAULT '',
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
            is_eligible_payment tinyint(11) DEFAULT NULL,
            rank_payment int(11) DEFAULT NULL,
            rank int(11) DEFAULT NULL,
            week1_monthly int(11) DEFAULT NULL,
            week2_monthly int(11) DEFAULT NULL,
            week3_monthly int(11) DEFAULT NULL,
            week4_monthly int(11) DEFAULT NULL,
            videos_uploaded_monthly int(11) DEFAULT NULL,
            total_payment_amount int(11) DEFAULT NULL,
            employee_id int(11) DEFAULT NULL,
            is_paid tinyint(11) DEFAULT '0',
            paid_amount int(11) DEFAULT NULL,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (teacher_id,year_monthly)
          )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE teacher_leaderboard_monthly");
    }

}
