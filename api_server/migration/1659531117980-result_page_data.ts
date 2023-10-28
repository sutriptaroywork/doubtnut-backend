import {MigrationInterface, QueryRunner} from "typeorm";

export class resultPageData1659531117980 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE result_page_widget (
                id int(11) NOT NULL AUTO_INCREMENT,
                name varchar(255) DEFAULT NULL,
                student_id int(20) default null,
                roll_no int(20)   default null,
                question_id int(20) default null,
                carousel_type varchar(100) DEFAULT NULL,
                carousel_id int(20) default null,
                title text,
                boards varchar(255) default null,
                class varchar(50) DEFAULT NULL,
                year_exam varchar(20) default null,
                percentage varchar(20) default null,
                student_rank int(11) default null,
                image_url text,
                aspect_ratio varchar(11) default null,
                deeplink text,
                created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                sharing_message varchar(500) DEFAULT NULL,
                locale varchar(10) NOT NULL DEFAULT 'en',
                sample_id int(11),
                PRIMARY KEY (id),
                KEY class (class)
            ) ENGINE = InnoDB`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `Drop Table result_page_widget`
        )
    }

}
