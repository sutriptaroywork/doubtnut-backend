import {MigrationInterface, QueryRunner} from "typeorm";

export class HtOlympiadStudents1645642670882 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE ht_olympiad_students (
                    id INT NOT NULL AUTO_INCREMENT,
                    username VARCHAR(50) NOT NULL,
                    name VARCHAR(100) NULL,
                    email VARCHAR(255) NULL,
                    mobile VARCHAR(20) NOT NULL,
                    class INT NULL,
                    state VARCHAR(50) NULL,
                    district VARCHAR(100) NULL,
                    school_name VARCHAR(255) NULL,
                    student_id INT NOT NULL,
                    is_registered_dn TINYINT NOT NULL DEFAULT 0,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    CONSTRAINT ht_olympiad_students_pk PRIMARY KEY (id),
                    CONSTRAINT student_info UNIQUE(username,mobile)
                    )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE ht_olympiad_students");
    }

}
