import { MigrationInterface, QueryRunner } from "typeorm";

export class practiceEnglishMigrations1641208740559 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const createTablePES = `CREATE TABLE practice_english_sessions (\
            id INT(255) NOT NULL AUTO_INCREMENT,\
            student_id INT(255) NOT NULL, \
            session_id VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL, \
            status TINYINT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, \
            PRIMARY KEY (id))`;

        const createTablePER = `CREATE TABLE practice_english_responses (\
            id INT(255) NOT NULL AUTO_INCREMENT, \
            question_id INT(55) NOT NULL , \
            student_id INT(255) NOT NULL , \
            input_received MEDIUMTEXT NOT NULL , \
            correct_tokens TEXT NOT NULL , \
            incorrect_tokens TEXT NOT NULL , \
            match_percent INT NOT NULL , \
            attempt_no INT(11) NOT NULL , \
            session_id VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL, \
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  \
            PRIMARY KEY (id))`;

        const createTablePEUA = `CREATE TABLE  practice_english_user_audios ( \
            id INT(255) NOT NULL AUTO_INCREMENT, \
            question_id INT(55) NOT NULL , \
            student_id INT(255) NOT NULL , \
            audio_url VARCHAR(255) NOT NULL , \
            attempt_no INT NOT NULL , \
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , \
            PRIMARY KEY (id))`;

        const createTablePET = `CREATE TABLE practice_english_transcriptions ( \
            id INT(255) NOT NULL AUTO_INCREMENT , \
            student_id INT(255) NOT NULL , \
            audio_url VARCHAR(255) NOT NULL , \
            text TEXT NOT NULL , \
            locale TEXT NOT NULL , \
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, \
            PRIMARY KEY (id))`;
        await queryRunner.query(createTablePES);
        await queryRunner.query(createTablePER);
        await queryRunner.query(createTablePEUA);
        await queryRunner.query(createTablePET);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE practice_english_sessions`);
        await queryRunner.query(`DROP TABLE practice_english_responses`);
        await queryRunner.query(`DROP TABLE practice_english_user_audios`);
        await queryRunner.query(`DROP TABLE practice_english_transcriptions`);
    }

}
