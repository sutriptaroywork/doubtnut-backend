import { MigrationInterface, QueryRunner } from "typeorm"

export class DnSMigrationMixCategories1659596235955 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE dn_shorts_new_user
            ADD column source VARCHAR(255) NOT NULL AFTER experiment,
            ADD column class INT(11) NOT NULL AFTER experiment`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table dn_shorts_new_user drop column source, drop column class");

    }

}
