import { MigrationInterface, QueryRunner } from "typeorm"

export class ncertbookfreetable1658567753802 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE assortment_studentid_package_mapping_free_hp (
            id int(11) NOT NULL AUTO_INCREMENT,
            assortment_id int(11) DEFAULT NULL,
            student_id int(11) DEFAULT NULL,
            class int(11) DEFAULT NULL,
            subject varchar(250) DEFAULT NULL,
            thumbnail_url varchar(500) DEFAULT NULL,
            display_name varchar(500) DEFAULT NULL,
            book_type varchar(250) DEFAULT NULL,
            language varchar(100) DEFAULT NULL,
            is_active tinyint(4) NOT NULL DEFAULT '1',
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            app_deeplink varchar(300) DEFAULT NULL,
            PRIMARY KEY (id),
            KEY assortment_studentid_package_mapping_assortment_id_IDX (assortment_id,student_id,class) USING BTREE
          );`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE assortment_studentid_package_mapping_free_hp`);
    }

}
