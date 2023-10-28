import {MigrationInterface, QueryRunner} from "typeorm";

export class AddColumnToNewUsersNotification1643119807379 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `new_users_notifications`  ADD `text_message` VARCHAR(400) NULL DEFAULT NULL  AFTER `image`,  ADD `text_message_hindi` VARCHAR(400) NULL DEFAULT NULL  AFTER `text_message`");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `new_users_notifications` DROP `text_message`, DROP `text_message_hindi`");
    }

}
