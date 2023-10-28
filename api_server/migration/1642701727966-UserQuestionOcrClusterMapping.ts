import {MigrationInterface, QueryRunner} from "typeorm";

export class UserQuestionOcrClusterMapping1642701727966 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`create table classzoo1.user_question_ocr_cluster_mapping (
            id int(255) not null AUTO_INCREMENT, 
            cluster_type VARCHAR(255) not null, 
            cluster_description VARCHAR(255) not null, 
            video_locales VARCHAR(255) not null, 
            is_active tinyint default 0, 
            priority int(255) not null,
            PRIMARY KEY (id)
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE classzoo1.user_question_ocr_cluster_mapping");
    }

}
