import { MigrationInterface, QueryRunner } from "typeorm"

export class youtubeEvent1655404318783 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE classzoo1.youtube_event ( 
            id INT(11) NOT NULL AUTO_INCREMENT , 
            assortment_id INT(11) NOT NULL , 
            resource_type char(10) NOT NULL , 
            live_at TIMESTAMP NULL DEFAULT NULL, 
            title VARCHAR(255) NULL DEFAULT NULL, 
            description VARCHAR(255) NULL DEFAULT NULL, 
            is_processed tinyint DEFAULT 0,
            is_active tinyint(1) DEFAULT 1 ,
            is_deleted tinyint(1) DEFAULT 0 ,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  
            PRIMARY KEY (id),
            KEY live_at (live_at),
            KEY is_active (is_active)
            )`);
        
        await queryRunner.query(`CREATE TABLE classzoo1.youtube_channel ( 
            id INT(11) NOT NULL AUTO_INCREMENT , 
            name VARCHAR(60) NOT NULL , 
            channel_id VARCHAR(60) NOT NULL,
            token VARCHAR(255) NULL DEFAULT NULL, 
            refresh_token VARCHAR(100) NULL DEFAULT NULL, 
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  
            PRIMARY KEY (id)
            )`);
        await queryRunner.query(`CREATE TABLE classzoo1.youtube_channel_event_map ( 
            id INT(11) NOT NULL AUTO_INCREMENT , 
            channel_id INT(11) NOT NULL,
            event_id INT(11) NULL DEFAULT NULL, 
            youtube_id VARCHAR(100) NULL DEFAULT NULL, 
            stream_key VARCHAR(100) NULL DEFAULT NULL, 
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  
            PRIMARY KEY (id),
            FOREIGN KEY (channel_id) REFERENCES youtube_channel(id),
            FOREIGN KEY (event_id) REFERENCES youtube_event(id),
            UNIQUE KEY (channel_id, event_id)
            )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE classzoo1.youtube_event`);
        await queryRunner.query(`DROP TABLE classzoo1.youtube_channel`);
        await queryRunner.query(`DROP TABLE classzoo1.youtube_channel_event_map`);
    }

}
