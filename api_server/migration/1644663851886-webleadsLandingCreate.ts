import {MigrationInterface, QueryRunner} from "typeorm";

export class webleadsLandingCreate1644663851886 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE leads_web_landing_page (
            assortment_id int(11) NOT NULL,
            mobile varchar(255) NOT NULL,
            tag varchar(255) NOT NULL,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (assortment_id,mobile,tag)
          )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE leads_web_landing_page");
    }

}
