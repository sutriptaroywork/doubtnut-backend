import {MigrationInterface, QueryRunner} from "typeorm";

export class googleAdsMigration1662635809790 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const sql = `CREATE TABLE google_ads_details (
            id INT(255) NOT NULL AUTO_INCREMENT,
            page VARCHAR(100) DEFAULT NULL,
            type VARCHAR(100) DEFAULT NULL,
            ads_url VARCHAR(2500) DEFAULT NULL,
            cust_params VARCHAR(2500) DEFAULT NULL,
            start_date timestamp NULL DEFAULT NULL,
            end_date timestamp NULL DEFAULT NULL,
            is_active tinyint(4) DEFAULT '0',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id))`;
        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE google_ads_details`);
    }

}
