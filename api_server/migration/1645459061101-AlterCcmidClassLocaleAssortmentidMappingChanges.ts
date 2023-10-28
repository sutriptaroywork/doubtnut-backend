import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterCcmidClassLocaleAssortmentidMappingChanges1645459061101 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE ccmid_class_locale_assortmentid_mapping ADD class int(11) NULL AFTER ccm_id");

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE ccmid_class_locale_assortmentid_mapping DROP COLUMN class");

    }


}
