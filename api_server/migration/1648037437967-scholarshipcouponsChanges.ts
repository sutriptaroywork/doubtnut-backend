import {MigrationInterface, QueryRunner} from "typeorm";

export class scholarshipcouponsChanges1648037437967 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE scholarship_coupons ADD column description varchar(255) DEFAULT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE scholarship_coupons DROP column description");
    }

}
