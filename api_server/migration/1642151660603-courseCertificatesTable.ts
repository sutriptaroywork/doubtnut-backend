import {MigrationInterface, QueryRunner} from "typeorm";

export class courseCertificatesTable1642151660603 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`create table classzoo1.course_certificates (
            id int(255) not null AUTO_INCREMENT, 
            student_id int(255) not null, 
            course_id int(255) not null, 
            certificate VARCHAR(255) NOT NULL,
            is_deleted tinyint default 0,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, 
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, 
            PRIMARY KEY (id)
        )`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE classzoo1.course_certificates");
    }

}
