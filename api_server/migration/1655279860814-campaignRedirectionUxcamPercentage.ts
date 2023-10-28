import {MigrationInterface, QueryRunner} from "typeorm";

export class campaignRedirectionUxcamPercentage1655279860814 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE campaign_redirection_mapping  ADD uxcam_percentage int(11) NOT NULL DEFAULT 100`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table campaign_sid_mapping drop column uxcam_percentage`);

    }

}
