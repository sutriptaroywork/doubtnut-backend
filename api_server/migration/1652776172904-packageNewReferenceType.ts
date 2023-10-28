import { MigrationInterface, QueryRunner } from "typeorm"

export class packageNewReferenceType1652776172904 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE classzoo1.package  MODIFY reference_type enum('default','v3','onlyPanel','doubt','referral') default 'v3'"); 
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE classzoo1.package  MODIFY reference_type enum('default','v3','onlyPanel','doubt') default 'v3'"); 
    }

}
