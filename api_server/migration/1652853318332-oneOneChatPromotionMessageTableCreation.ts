import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateReferAndEarnTable1650987745830 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE study_chat_promotional_messages
            ( id INT(11) NOT NULL AUTO_INCREMENT ,
            type ENUM('text', 'video', 'audio', 'image') NOT NULL,
            description VARCHAR(512) DEFAULT NULL ,
            property_url VARCHAR(255) DEFAULT NULL ,
            thumbnail_url VARCHAR(255) DEFAULT NULL ,
            audio_duration INT(10)  DEFAULT NULL,
            cta_text VARCHAR(20) DEFAULT NULL,
            cta_deeplink VARCHAR(150) DEFAULT NULL,
            start_date timestamp DEFAULT NULL,
            end_date timestamp DEFAULT NULL,
            ccm_id VARCHAR(512) DEFAULT NULL,
            student_class INT(11) DEFAULT NULL,
            signup_datetime timestamp DEFAULT NULL,
            signup_datetime_operator ENUM('>', '<', '>=', '<=', '=') NOT NULL DEFAULT '>=',
            student_locale VARCHAR(55) DEFAULT NULL,
            campaign VARCHAR(150) DEFAULT NULL,
            is_active TINYINT(3) NOT NULL DEFAULT 0,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            PRIMARY KEY (id),
            KEY is_active_idx (is_active),
            KEY start_date_idx (start_date),
            KEY end_date_idx (end_date), ) `
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `Drop Table study_chat_promotional_messages`
        )
    }

}
