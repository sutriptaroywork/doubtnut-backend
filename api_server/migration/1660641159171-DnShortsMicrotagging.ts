import { MigrationInterface, QueryRunner } from "typeorm"

export class DnShortsMicrotagging1660641159171 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE dn_shorts_category (
                id int(11) NOT NULL AUTO_INCREMENT,
                name varchar(250) DEFAULT NULL,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY name_idx (name),
                KEY time_idx (created_at,updated_at)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`
        );

        await queryRunner.query(
            `CREATE TABLE dn_shorts_subcategory (
                id int(11) NOT NULL AUTO_INCREMENT,
                category_id int(11) DEFAULT NULL,
                name varchar(250) DEFAULT NULL,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY category_idx (category_id),
                KEY name_idx (name),
                KEY time_idx (created_at,updated_at)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`
        );

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE dn_shorts_category");
        await queryRunner.query("DROP TABLE dn_shorts_subcategory");
    }

}
