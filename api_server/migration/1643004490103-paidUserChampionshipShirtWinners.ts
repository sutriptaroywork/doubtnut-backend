import {MigrationInterface, QueryRunner} from "typeorm";

export class paidUserChampionshipShirtWinners1643004490103 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE paid_user_championship_shirt_winners (
            id int(11) NOT NULL AUTO_INCREMENT,
            student_id int(255) NOT NULL,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            winning_date timestamp NOT NULL,
            reward text,
            is_claimed tinyint(1) DEFAULT '0',
            is_seen tinyint(1) DEFAULT '0',
            full_name text,
            mobile varchar(255) DEFAULT NULL,
            pincode varchar(10) DEFAULT NULL,
            address_line_1 text,
            address_line_2 text,
            address_line_3 text,
            city text,
            state text,
            assortment_id int(11) DEFAULT NULL,
            duration enum('weekly','monthly','yearly') DEFAULT NULL,
            rank int(11) DEFAULT NULL,
            percentage int(11) DEFAULT NULL,
            PRIMARY KEY (id)
          ) `);
        await queryRunner.query(`create index paid_user_championship_shirt_winners_student_id on paid_user_championship_shirt_winners(student_id)`);
        await queryRunner.query(`create index paid_user_championship_shirt_winners_winning_date on paid_user_championship_shirt_winners(winning_date)`);
        await queryRunner.query(`create index paid_user_championship_shirt_winners_assortment_id on paid_user_championship_shirt_winners(assortment_id)`);


    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP index paid_user_championship_shirt_winners_student_id on paid_user_championship_shirt_winners`);
        await queryRunner.query(`DROP index paid_user_championship_shirt_winners_winning_date on paid_user_championship_shirt_winners`);
        await queryRunner.query(`DROP index paid_user_championship_shirt_winners_assortment_id on paid_user_championship_shirt_winners`);
        await queryRunner.query(`DROP TABLE paid_user_championship_shirt_winners`);

    }

}
