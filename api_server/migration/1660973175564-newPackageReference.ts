import {MigrationInterface, QueryRunner} from "typeorm";

export class newPackageReference1660973175564 implements MigrationInterface {

    
        public async up(queryRunner: QueryRunner): Promise<void> {
            await queryRunner.query("ALTER TABLE classzoo1.package  MODIFY reference_type enum('default','v3','onlyPanel','doubt','referral','bnb_autosales') default 'v3'"); 
        }
    
        public async down(queryRunner: QueryRunner): Promise<void> {
            await queryRunner.query("ALTER TABLE classzoo1.package  MODIFY reference_type enum('default','v3','onlyPanel','doubt','referral') default 'v3'"); 
        }
    
    

}
