import {MigrationInterface, QueryRunner} from "typeorm";

export class campaignSidMappingMigration1654262931983 implements MigrationInterface {

  
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER table campaign_sid_mapping add event_timestamp  timestamp DEFAULT null, add hook_timestamp timestamp DEFAULT null`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table campaign_sid_mapping drop column event_timestamp, drop column hook_timestamp`);

    }


}
