import {MigrationInterface, QueryRunner} from "typeorm";

export class CouponArchitectureChanges1652960516890 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`create TABLE coupon_course_mapping (
            id int(11) NOT NULL AUTO_INCREMENT,
            is_active tinyint default 1,
            coupon_code varchar(100) DEFAULT NULL,
            package_id int(11) DEFAULT NULL,
            assortment_id int(11) DEFAULT NULL,
            course_class varchar(50) DEFAULT NULL,
            course_locale varchar(50) DEFAULT NULL,
            course_supercat varchar(500) DEFAULT NULL,
            course_min_original_amount decimal(10,2),
            is_multi_year tinyint default 0,
            updated_by varchar(250) not null,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            description varchar(1000) DEFAULT 'OLD'
            primary key (id),
            KEY coupon_idx (coupon_code),
            KEY package_idx (package_id),
            key time_idx (created_at, updated_at))`);
        
        await queryRunner.query(`ALTER table coupon_applicability 
            ADD column is_active tinyint default 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP table coupon_course_mapping");
        await queryRunner.query("ALTER table coupon_applicability drop column is_active");
    }

}
