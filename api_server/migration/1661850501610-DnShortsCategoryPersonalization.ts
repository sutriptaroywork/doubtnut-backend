import { MigrationInterface, QueryRunner } from "typeorm"

export class DnShortsCategoryPersonalization1661850501610 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE dn_shorts_student_category_mapping (
                id INT(11) NOT NULL AUTO_INCREMENT, 
                student_id INT(11) NOT NULL , 
                category_id INT(11) NOT NULL , 
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , 
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
                PRIMARY KEY (id)) ENGINE = InnoDB;`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE dn_shorts_student_category_mapping`);
    }

}
