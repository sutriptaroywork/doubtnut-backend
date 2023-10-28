import {MigrationInterface, QueryRunner} from "typeorm";

export class oneTapPostCreation1648480141287 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TABLE `one_tap_posts` ( `id` int(11) NOT NULL AUTO_INCREMENT, `img_url` varchar(255) NOT NULL, `student_class` int(11) DEFAULT NULL, `locale` varchar(55) DEFAULT NULL, `rank` int(11) NOT NULL, `min_version_code` int(11) DEFAULT NULL, `max_version_code` int(11) DEFAULT NULL, `created_at` datetime DEFAULT CURRENT_TIMESTAMP, `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP, `is_active` tinyint(4) DEFAULT \'1\', PRIMARY KEY (`id`), KEY `one_tap_posts_is_active_index` (`is_active`), KEY `one_tap_posts_max_version_code_index` (`max_version_code`), KEY `one_tap_posts_min_version_code_index` (`min_version_code`) ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE one_tap_posts");
    }

}
