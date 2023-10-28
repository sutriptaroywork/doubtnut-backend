import {MigrationInterface, QueryRunner} from "typeorm";

export class WhatsappStatsIndex1641288643199 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX entity_index
        ON whatsapp_share_stats (entity_type, entity_id)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX entity_index ON whatsapp_share_stats`);
    }

}
