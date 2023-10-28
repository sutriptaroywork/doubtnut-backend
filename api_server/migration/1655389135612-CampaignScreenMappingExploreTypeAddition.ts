import {MigrationInterface, QueryRunner} from "typeorm";

export class CampaignScreenMappingExploreTypeAddition1655389135612 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE campaign_screen_mapping CHANGE screen_type screen_type ENUM('Home','Profile','Online_Class','Video','Camera','Feed','SRP','Explore') DEFAULT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE campaign_screen_mapping CHANGE screen_type screen_type ENUM('Home','Profile','Online_Class','Video','Camera','Feed','SRP') DEFAULT NULL");
    }

}
