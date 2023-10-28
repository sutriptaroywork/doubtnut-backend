import { MigrationInterface, QueryRunner } from "typeorm"

export class dashboardUsersisDeleted1654525125836 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table dashboard_users add is_deleted tinyint DEFAULT 0 after is_active; `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table dashboard_users drop column is_deleted;`);
    }

}
