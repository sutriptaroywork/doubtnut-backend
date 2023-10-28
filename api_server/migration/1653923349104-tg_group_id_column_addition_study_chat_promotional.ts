import {MigrationInterface, QueryRunner} from "typeorm";

export class tgGroupIdColumnAdditionStudyChatPromotional1653923349104 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE study_chat_promotional_messages ADD target_group_id INT(11) DEFAULT NULL AFTER campaign");

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE study_chat_promotional_messages DROP COLUMN target_group_id");
    }

}
