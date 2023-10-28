import {MigrationInterface, QueryRunner} from "typeorm";

export class CcmidClassLocaleAssortmentidMappingChanges1645442918002 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE ccmid_class_locale_assortmentid_mapping (
            id int(11) unsigned NOT NULL AUTO_INCREMENT,
            ccm_id int(11) DEFAULT NULL,
            locale varchar(25) DEFAULT NULL,
            assortment_id int(11) DEFAULT NULL,
            assortment_order int(11) DEFAULT NULL,
            is_active tinyint(1) DEFAULT '1',
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY ccm_id (ccm_id),
            KEY locale (locale),
            KEY assortment_id (assortment_id),
            KEY is_active (is_active)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE ccmid_class_locale_assortmentid_mapping");
    }
}
