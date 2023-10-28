import {MigrationInterface, QueryRunner} from "typeorm";

export class QuizNotificationData1660639844523 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE quiz_notification_data (
            id int(11) unsigned NOT NULL AUTO_INCREMENT,
            notif_day int(11) DEFAULT NULL,
            notif_type varchar(100) DEFAULT NULL,
            thumbnail varchar(255) DEFAULT NULL,
            button_text varchar(100) DEFAULT NULL,
            is_skippable tinyint(1) DEFAULT NULL,
            title varchar(100) DEFAULT NULL,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            class int(11) DEFAULT NULL,
            deeplink varchar(100) DEFAULT NULL,
            is_active tinyint(1) DEFAULT NULL,
            PRIMARY KEY (id),
            KEY idx_qzntf_dca (notif_day,is_active,class)
          ) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `drop table quiz_notification_data`
        );
    }

}
