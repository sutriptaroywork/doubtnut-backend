import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterSrpdForRzpPayout1648119966231 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE classzoo1.student_referral_paytm_disbursement add column source varchar(20) DEFAULT "PAYTM",add column payout_id varchar(50) DEFAULT NULL, add column razorpay_url varchar(255) DEFAULT NULL, add column razorpay_response text DEFAULT NULL;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE classzoo1.student_referral_paytm_disbursement drop column source,
        drop column payout_id, drop column razorpay_url, drop column razorpay_response;`);
    }
}
