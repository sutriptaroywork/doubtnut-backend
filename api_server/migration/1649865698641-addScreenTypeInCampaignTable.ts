import { MigrationInterface, QueryRunner } from "typeorm"

export class addScreenTypeInCampaignTable1649865698641 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `campaign_screen_mapping` (`id` int(11) NOT NULL AUTO_INCREMENT, `campaign_id` int(11) NOT NULL, `screen_type` ENUM('Home','Profile','Online_Class','Video','Camera') NULL DEFAULT NULL, `is_active` tinyint(1) NOT NULL, `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (`id`), KEY `campaign_id` (`campaign_id`), KEY `screen_type` (`screen_type`)) ENGINE=InnoDB DEFAULT CHARSET=utf8");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE `campaign_screen_mapping`');
    }

}
