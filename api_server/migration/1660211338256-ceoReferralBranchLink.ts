import {MigrationInterface, QueryRunner} from "typeorm";

export class ceoReferralBranchLink1660211338256 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE student_referral_course_coupons ADD branch_link varchar(200) NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("alter table student_referral_course_coupons drop column branch_link");
    }

}
