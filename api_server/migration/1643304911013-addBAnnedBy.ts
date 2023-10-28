import {MigrationInterface, QueryRunner} from "typeorm";

export class addBAnnedBy1643304911013 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE banned_users ADD banned_by INT(255) NULL DEFAULT NULL AFTER ban_mode");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE banned_users drop banned_by");
    }

}
