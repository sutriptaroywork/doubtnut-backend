import {MigrationInterface, QueryRunner} from "typeorm";

export class campaignRedirectionMappingDnr1649935044404 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('alter table campaign_redirection_mapping add dnr_wallet boolean default 0');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('alter table campaign_redirection_mapping drop column dnr_wallet');
    }

}
