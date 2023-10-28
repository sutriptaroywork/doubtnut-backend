import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterForResellerPanel1650535924561 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table classzoo1.reseller_info add column is_active tinyint(1) DEFAULT 1, add column pin varchar(4) default null after updated_at;");
        await queryRunner.query("alter table classzoo1.coupon_reseller_mapping add column variant_id varchar(20) default null after package_id;");
        await queryRunner.query("alter table classzoo1.coupon_reseller_mapping add column is_direct_activation tinyint(1) DEFAULT 0;");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table classzoo1.reseller_info drop column is_active, drop column pin;");
        await queryRunner.query("alter table classzoo1.coupon_reseller_mapping drop column variant_id;");
        await queryRunner.query("alter table classzoo1.coupon_reseller_mapping drop column is_direct_activation;");
    }
}
