import { MigrationInterface, QueryRunner } from "typeorm"

export class createDnShortsExpTable1657632577698 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE dn_shorts_percent_completion ( 
            id INT(11) NOT NULL AUTO_INCREMENT, 
            question_id INT(11) NOT NULL , 
            category VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , 
            title VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL , 
            video_views INT(11) NOT NULL , 
            percent_shorts_completion INT(11) NOT NULL, 
            PRIMARY KEY (id)
            ) ENGINE = InnoDB`
    )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `Drop Table dn_shorts_percent_completion`
        )
    }

}
