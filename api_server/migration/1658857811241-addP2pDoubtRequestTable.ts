import { MigrationInterface, QueryRunner } from "typeorm"

export class addP2pDoubtRequestTable1658857811241 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE study_group_p2p_doubt_request (
                id int(11) NOT NULL AUTO_INCREMENT,
                scheduled_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                study_group_id varchar(55) NOT NULL,
                question_id int(55) NOT NULL,
                hour int(11) NOT NULL,
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active tinyint(1) NOT NULL DEFAULT '1',
                PRIMARY KEY (id),
                KEY study_group_id (study_group_id),
                KEY scheduled_date (scheduled_date),
                KEY hour (hour)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE study_group_p2p_doubt_request");
    }
}
