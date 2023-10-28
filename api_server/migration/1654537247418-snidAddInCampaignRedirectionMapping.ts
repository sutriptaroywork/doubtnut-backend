import {MigrationInterface, QueryRunner} from "typeorm";

export class snidAddInCampaignRedirectionMapping1654537247418 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE campaign_redirection_mapping  ADD s_n_id VARCHAR(250) NOT NULL DEFAULT 'all'  AFTER description`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE campaign_redirection_mapping DROP s_n_id`);
    }
}
