import {MigrationInterface, QueryRunner} from "typeorm";

export class booksDetailsTableMigration1655872345445 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE books_details (
            id INT(11) NOT NULL AUTO_INCREMENT,
            book_name VARCHAR(255) DEFAULT NULL ,
            book_img_url VARCHAR(255) DEFAULT NULL ,
            student_class INT(11) DEFAULT NULL ,
            locale VARCHAR(10) DEFAULT NULL ,
            subject VARCHAR(100) DEFAULT NULL ,
            chapter_name VARCHAR(255) DEFAULT NULL ,
            book_playlist_id INT(11) DEFAULT NULL ,
            chapter_playlist_id INT(11) DEFAULT NULL ,
            exercise_playlist_id INT(11) DEFAULT NULL ,
            exercise_name VARCHAR(100) DEFAULT NULL ,
            question_id INT(11) DEFAULT NULL ,
            exercise_questions_array_id VARCHAR(255) DEFAULT NULL ,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY student_class_idx (student_class),
            KEY locale_idx (locale),
            KEY book_playlist_id_idx (book_playlist_id),
            KEY chapter_playlist_id_idx (chapter_playlist_id),
            KEY exercise_playlist_id_idx (exercise_playlist_id),
            KEY question_id_idx (question_id),
    )`
    )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `Drop Table books_details`
        )
    }

}
