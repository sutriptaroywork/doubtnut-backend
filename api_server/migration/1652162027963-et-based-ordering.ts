import {MigrationInterface, QueryRunner} from "typeorm";

export class etBasedOrdering1652162027963 implements MigrationInterface {

      public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER table home_caraousels add additional_check_field enum('','ET') DEFAULT NULL, add additional_check_operator enum('','>','<','=','<=','>=') DEFAULT NULL, add additional_check_value int(11) default 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`alter table home_caraousels drop column additional_check_field, drop column additional_check_operator,drop column additional_check_value`);
    }

}
