import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateStudentReferralDisbursement1649313724226 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE student_referral_disbursement (
            id int(11) NOT NULL AUTO_INCREMENT,
            invitor_student_id int(11) DEFAULT NULL,
            mobile varchar(100) DEFAULT NULL,
            invitee_student_id int(11) DEFAULT NULL,
            amount int(11) DEFAULT NULL,
            order_id varchar(100) DEFAULT NULL,
            source varchar(20) DEFAULT "PAYTM",
            status enum("CREATED","MARKED","INITIATED","FAILURE","CANCELLED","SUCCESS") DEFAULT "CREATED",
            partner1_txn_id varchar(100) DEFAULT NULL,
            partner1_txn_response text,
            payout_id varchar(100) DEFAULT NULL,
            payout_url varchar(255) DEFAULT NULL,
            partner2_txn_id varchar(100) DEFAULT NULL,
            partner2_txn_response text,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            payment_info_id int(11) DEFAULT NULL,
            entry_for varchar(100) DEFAULT NULL,
            PRIMARY KEY (id));`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE student_referral_disbursement`);
    }
}
