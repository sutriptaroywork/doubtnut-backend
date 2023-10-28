import { MigrationInterface, QueryRunner } from "typeorm"

export class recommendedtables1659613377167 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE classzoo1.recommendation_chapter ( 
            id INT(11) NOT NULL AUTO_INCREMENT , 
            class VARCHAR(255) NOT NULL, 
            locale VARCHAR(255) NOT NULL DEFAULT "en", 
            category VARCHAR(255)  NOT NULL DEFAULT "BOARDS",
            subject VARCHAR(255)  NOT NULL,
            master_chapter VARCHAR(255)  NOT NULL,
            chapter_order int(11)  NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  
            PRIMARY KEY (id),
            KEY search_key (class, locale, category, subject)
            )`);
        await queryRunner.query(`CREATE TABLE classzoo1.recommendation_chapter_video ( 
            id INT(11) NOT NULL AUTO_INCREMENT , 
            chapter_id INT(11) NOT NULL, 
            chapter VARCHAR(255) NOT NULL, 
            topic VARCHAR(255)  NOT NULL,
            resource_reference VARCHAR(255) NOT NULL, 
            video_order int(11)  NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  
            PRIMARY KEY (id),
            FOREIGN KEY (chapter_id) REFERENCES recommendation_chapter(id)
            )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE classzoo1.recommendation_chapter`);
        await queryRunner.query(`DROP TABLE classzoo1.recommendation_chapter_video`);
    }

}
