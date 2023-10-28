/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- Table structure for table `TABLE 277`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admins` (
  `admin_id` int(255) NOT NULL AUTO_INCREMENT,
  `admin_image` varchar(100) DEFAULT NULL,
  `admin_fname` varchar(255) NOT NULL,
  `admin_lname` varchar(255) NOT NULL,
  `admin_username` varchar(255) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `last_login_ip` varchar(255) DEFAULT NULL,
  `last_login_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reset_code` varchar(255) NOT NULL,
  `admin_email` varchar(255) NOT NULL,
  `admin_role` varchar(255) NOT NULL,
  PRIMARY KEY (`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `answer_farm`
--

DROP TABLE IF EXISTS `answer_farm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `answer_farm` (
  `answer_id` int(12) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `one_minute` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`answer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `answer_transcript`
--

DROP TABLE IF EXISTS `answer_transcript`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `answer_transcript` (
  `answer_id` int(11) DEFAULT NULL,
  `transcript_duration_60` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `answer_id_UNIQUE` (`answer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=106214 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `answer_video_resources`
--

DROP TABLE IF EXISTS `answer_video_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `answer_video_resources` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `answer_id` int(10) unsigned NOT NULL,
  `resource` varchar(256) NOT NULL,
  `resource_type` enum('BLOB','DASH','HLS','YOUTUBE','RTMP') NOT NULL,
  `resource_order` smallint(6) NOT NULL DEFAULT '0',
  `vdo_cipher_id` varchar(32) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `video_offset` int(11) DEFAULT NULL,
  `filesize_bytes` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `answer_video_resources_UN` (`answer_id`,`resource_type`,`resource_order`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=11284693 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `answer_video_resources_missing_blob`
--

DROP TABLE IF EXISTS `answer_video_resources_missing_blob`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `answer_video_resources_missing_blob` (
  `question_id` int(55) NOT NULL,
  `resource_type` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `resource_order` int(1) NOT NULL DEFAULT '0',
  `resource` varchar(255) CHARACTER SET latin1 NOT NULL,
  `is_active` int(1) NOT NULL DEFAULT '0',
  `answer_id` int(10) unsigned,
  `student_id` int(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `answers`
--

DROP TABLE IF EXISTS `answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `answers` (
  `answer_id` int(11) NOT NULL AUTO_INCREMENT,
  `expert_id` int(55) NOT NULL,
  `question_id` int(55) NOT NULL,
  `answer_video` varchar(255) NOT NULL,
  `is_approved` tinyint(4) DEFAULT '1',
  `answer_rating` varchar(255) NOT NULL DEFAULT '1',
  `answer_feedback` varchar(255) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `youtube_id` varchar(256) DEFAULT NULL,
  `duration` varchar(10) DEFAULT NULL,
  `isDuplicate` tinyint(4) DEFAULT NULL,
  `review_expert_id` int(11) DEFAULT NULL,
  `is_reviewed` tinyint(4) DEFAULT '1',
  `is_positive_review` tinyint(4) DEFAULT '1',
  `vdo_cipher_id` varchar(200) DEFAULT NULL,
  `is_vdo_ready` tinyint(4) NOT NULL DEFAULT '0',
  `aspect_ratio` varchar(45) DEFAULT '16:9',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `screenshot` varchar(100) DEFAULT NULL,
  `filesize_bytes` int(10) unsigned NOT NULL,
  PRIMARY KEY (`answer_id`),
  KEY `question_id` (`question_id`),
  KEY `answer_video` (`answer_video`),
  KEY `timestamp` (`timestamp`),
  KEY `expert_id` (`expert_id`),
  KEY `answer_rating` (`answer_rating`)
) ENGINE=InnoDB AUTO_INCREMENT=13501587 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `answers_offset`
--

DROP TABLE IF EXISTS `answers_offset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `answers_offset` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(100) DEFAULT NULL,
  `offset` int(15) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `answers_yt_recovery`
--

DROP TABLE IF EXISTS `answers_yt_recovery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `answers_yt_recovery` (
  `answer_video` varchar(255) CHARACTER SET latin1 NOT NULL,
  `youtube_id` varchar(256) CHARACTER SET latin1 NOT NULL,
  PRIMARY KEY (`answer_video`,`youtube_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `app_banned_users`
--

DROP TABLE IF EXISTS `app_banned_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_banned_users` (
  `student_id` varchar(100) NOT NULL,
  `ban_till` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `app_banners`
--

DROP TABLE IF EXISTS `app_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description` text NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `action_activity` text NOT NULL,
  `action_data` varchar(200) DEFAULT NULL,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `class` varchar(10) DEFAULT NULL,
  `image_url_new` varchar(200) DEFAULT NULL,
  `button_text` varchar(200) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `page_type` varchar(100) DEFAULT NULL,
  `banner_order` int(25) DEFAULT NULL,
  `position` int(11) DEFAULT NULL,
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `flag_variant` int(11) NOT NULL DEFAULT '-1',
  `target_group_id` int(11) DEFAULT NULL,
  `target_category` varchar(20) DEFAULT NULL,
  `locale` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `is_active` (`is_active`),
  KEY `type` (`type`),
  KEY `banner_order` (`banner_order`),
  KEY `flag_variant` (`flag_variant`),
  KEY `target_group_id` (`target_group_id`),
  KEY `start_date` (`start_date`),
  KEY `end_date` (`end_date`),
  KEY `app_banners_locale` (`locale`),
  KEY `app_banners_target_category` (`target_category`)
) ENGINE=InnoDB AUTO_INCREMENT=1463 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `app_config`
--

DROP TABLE IF EXISTS `app_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trial_period` int(4) NOT NULL,
  `free_search` tinyint(4) DEFAULT NULL,
  `tax` varchar(10) NOT NULL DEFAULT '18',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `app_configuration`
--

DROP TABLE IF EXISTS `app_configuration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_configuration` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key_name` varchar(250) NOT NULL,
  `key_value` varchar(2000) NOT NULL,
  `class` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `key_hindi_value` varchar(2000) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `key_name` (`key_name`),
  KEY `class` (`class`),
  KEY `created_at` (`created_at`),
  KEY `updated_at` (`updated_at`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `app_constants`
--

DROP TABLE IF EXISTS `app_constants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_constants` (
  `id` int(11) NOT NULL,
  `constant_key` varchar(50) NOT NULL,
  `value` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `region` varchar(45) DEFAULT 'IN',
  PRIMARY KEY (`id`),
  KEY `costant_key` (`constant_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `app_feedbacks`
--

DROP TABLE IF EXISTS `app_feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_feedbacks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `feedback_type` varchar(20) DEFAULT NULL,
  `feedback_resource` varchar(20) DEFAULT NULL,
  `heading` varchar(200) DEFAULT NULL,
  `question` varchar(200) DEFAULT NULL,
  `options` varchar(3000) DEFAULT NULL,
  `submit_text` varchar(200) DEFAULT NULL,
  `activity` varchar(20) DEFAULT NULL,
  `when_to_show` varchar(10) DEFAULT NULL,
  `days` varchar(2) DEFAULT NULL,
  `isActive` tinyint(4) NOT NULL DEFAULT '1',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `isActive` (`isActive`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `app_feedbacks_response`
--

DROP TABLE IF EXISTS `app_feedbacks_response`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_feedbacks_response` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `feedback_id` int(11) DEFAULT NULL,
  `question_id` varchar(25) DEFAULT NULL,
  `options` varchar(500) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=760978 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `app_version_code`
--

DROP TABLE IF EXISTS `app_version_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_version_code` (
  `version_name` varchar(10) NOT NULL,
  `version_code` int(11) NOT NULL,
  PRIMARY KEY (`version_code`),
  UNIQUE KEY `version_name` (`version_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `app_version_released`
--

DROP TABLE IF EXISTS `app_version_released`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_version_released` (
  `rel_id` int(11) NOT NULL AUTO_INCREMENT,
  `version` varchar(10) NOT NULL,
  `date_released` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `not_supported_till` int(10) NOT NULL,
  PRIMARY KEY (`rel_id`)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `appx_sync`
--

DROP TABLE IF EXISTS `appx_sync`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appx_sync` (
  `sync_id` int(11) NOT NULL AUTO_INCREMENT,
  `id` int(11) NOT NULL,
  `Title` varchar(87) NOT NULL,
  `material_type` varchar(5) NOT NULL,
  `file_link` varchar(200) NOT NULL,
  `thumbnail` varchar(82) NOT NULL,
  `status` int(11) NOT NULL,
  `exam` varchar(12) NOT NULL,
  `subject` varchar(23) NOT NULL,
  `topic` varchar(20) NOT NULL,
  `date_and_time` varchar(22) NOT NULL,
  `course_id` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `faculty_name` varchar(45) NOT NULL,
  `faculty_image` varchar(255) NOT NULL,
  `is_processed` tinyint(1) NOT NULL,
  `question_id` int(11) NOT NULL,
  `appx_course_id` int(11) DEFAULT NULL,
  `liveclass_course_id` int(11) DEFAULT NULL,
  `old_detail_id` int(11) DEFAULT NULL,
  `strtotime` int(11) DEFAULT NULL,
  PRIMARY KEY (`sync_id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5868 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assortment_notes_mapping`
--

DROP TABLE IF EXISTS `assortment_notes_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assortment_notes_mapping` (
  `assortment_id` int(11) NOT NULL,
  `exam_board` varchar(100) NOT NULL,
  `notes_class` int(11) NOT NULL,
  `liveclass_course_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`assortment_id`),
  KEY `exam_board` (`exam_board`,`notes_class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assortment_studentid_package_mapping`
--

DROP TABLE IF EXISTS `assortment_studentid_package_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assortment_studentid_package_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `subject` varchar(250) DEFAULT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `display_name` varchar(500) DEFAULT NULL,
  `book_type` varchar(250) DEFAULT NULL,
  `language` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `app_deeplink` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assortment_studentid_package_mapping_assortment_id_IDX` (`assortment_id`,`student_id`,`class`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=8879 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audio_repo`
--

DROP TABLE IF EXISTS `audio_repo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audio_repo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(45) DEFAULT NULL,
  `entity_id` int(11) DEFAULT '0',
  `text` varchar(1000) DEFAULT NULL,
  `url` varchar(200) DEFAULT NULL,
  `meta_text` varchar(1000) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `a_r_entity_type_id` (`entity_type`,`entity_id`)
) ENGINE=InnoDB AUTO_INCREMENT=262 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissi_permission_id_84c5c92e_fk_auth_permission_id` (`permission_id`),
  CONSTRAINT `auth_group_permissi_permission_id_84c5c92e_fk_auth_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permissi_content_type_id_2f476e4b_fk_django_content_type_id` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(30) NOT NULL,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_perm_permission_id_1fbb5f2c_fk_auth_permission_id` (`permission_id`),
  CONSTRAINT `auth_user_user_perm_permission_id_1fbb5f2c_fk_auth_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auto_play_srp_views`
--

DROP TABLE IF EXISTS `auto_play_srp_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auto_play_srp_views` (
  `view_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(25) NOT NULL,
  `question_id` int(25) NOT NULL,
  `answer_id` int(25) NOT NULL,
  `answer_video` varchar(255) NOT NULL,
  `video_time` int(128) NOT NULL,
  `engage_time` int(255) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `is_back` tinyint(1) NOT NULL,
  `ip_address` varchar(25) NOT NULL,
  `view_from` enum('Auto SRP') NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`view_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42476729 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bank_name_ifsc_mapping`
--

DROP TABLE IF EXISTS `bank_name_ifsc_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bank_name_ifsc_mapping` (
  `ifsc_prefix` varchar(4) NOT NULL,
  `bank_name` varchar(500) NOT NULL,
  PRIMARY KEY (`ifsc_prefix`),
  KEY `ifsc_prefix` (`ifsc_prefix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `banned_users`
--

DROP TABLE IF EXISTS `banned_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banned_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `app_module` varchar(255) NOT NULL,
  `ban_type` varchar(255) NOT NULL,
  `ban_till` timestamp NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `ban_mode` enum('AUTO','MANUAL') NOT NULL DEFAULT 'AUTO',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_at` (`created_at`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39831 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bbps_student_course_mapping`
--

DROP TABLE IF EXISTS `bbps_student_course_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bbps_student_course_mapping` (
  `id` int(11) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `student_id` int(11) NOT NULL,
  `variant_id` int(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `blog`
--

DROP TABLE IF EXISTS `blog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `category` varchar(100) NOT NULL,
  `tags` varchar(255) NOT NULL,
  `image` varchar(255) NOT NULL,
  `meta_description` varchar(255) NOT NULL,
  `meta_keywords` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `url_slug` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `created_at` (`created_at`),
  KEY `category` (`category`),
  KEY `tags` (`tags`)
) ENGINE=InnoDB AUTO_INCREMENT=977 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bnb_clickers`
--

DROP TABLE IF EXISTS `bnb_clickers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bnb_clickers` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `is_sent` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `meta_info` varchar(255) DEFAULT NULL,
  `is_hindi_notif_sent` int(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `composite_index` (`is_active`,`is_sent`,`created_at`),
  KEY `meta_info` (`meta_info`),
  KEY `is_hindi_notif_sent` (`is_hindi_notif_sent`)
) ENGINE=InnoDB AUTO_INCREMENT=1201636 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `board_modification`
--

DROP TABLE IF EXISTS `board_modification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `board_modification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) NOT NULL,
  `board` varchar(255) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=195430 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `boards_previous_year`
--

DROP TABLE IF EXISTS `boards_previous_year`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `boards_previous_year` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `state_board` varchar(255) NOT NULL,
  `class` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `year_chapter` varchar(255) NOT NULL,
  `locale` varchar(10) NOT NULL DEFAULT 'hi',
  `doubt` varchar(255) NOT NULL,
  `section` varchar(255) DEFAULT NULL,
  `is_done` int(11) DEFAULT '0',
  `html_name` varchar(500) DEFAULT NULL,
  `chapter_english` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `student_id` int(11) DEFAULT NULL,
  `pdf_url` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `state_board` (`state_board`,`class`,`subject`,`year_chapter`),
  KEY `is_done` (`is_done`),
  KEY `student_id` (`student_id`),
  KEY `pdf_url` (`pdf_url`(1024))
) ENGINE=InnoDB AUTO_INCREMENT=106508 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `boards_previous_year_course_mapping`
--

DROP TABLE IF EXISTS `boards_previous_year_course_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `boards_previous_year_course_mapping` (
  `state_board` varchar(255) NOT NULL,
  `class` int(11) NOT NULL,
  `assortment_id` int(11) NOT NULL,
  `liveclass_course_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`state_board`,`class`,`assortment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `book_class_mapping`
--

DROP TABLE IF EXISTS `book_class_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `book_class_mapping` (
  `student_id` int(11) NOT NULL,
  `book` varchar(255) NOT NULL,
  `class` varchar(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `book_images`
--

DROP TABLE IF EXISTS `book_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `book_images` (
  `question_id` int(55) NOT NULL DEFAULT '0',
  `student_id` int(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `book` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `ocr_text` text,
  `is_answered` int(55) NOT NULL DEFAULT '0',
  `is_text_answered` tinyint(4) DEFAULT '0',
  `image_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `book_index_match`
--

DROP TABLE IF EXISTS `book_index_match`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `book_index_match` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `language` varchar(100) NOT NULL,
  `subject` varchar(200) NOT NULL,
  `chapter` varchar(1000) NOT NULL,
  `question_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `book_meta`
--

DROP TABLE IF EXISTS `book_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `book_meta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `doubt` varchar(200) NOT NULL,
  `subject` varchar(200) NOT NULL,
  `book_meta` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `doubt` (`doubt`),
  KEY `subject` (`subject`),
  KEY `question_id` (`question_id`),
  KEY `book_meta` (`book_meta`)
) ENGINE=InnoDB AUTO_INCREMENT=1098599 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `book_meta_new`
--

DROP TABLE IF EXISTS `book_meta_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `book_meta_new` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `doubt` varchar(200) NOT NULL,
  `subject` varchar(200) NOT NULL,
  `book_meta` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=107778 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `book_questions_details`
--

DROP TABLE IF EXISTS `book_questions_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `book_questions_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_playlist_id` int(11) NOT NULL,
  `tab_playlist_id` int(11) NOT NULL,
  `book_playlist_id` int(11) NOT NULL,
  `chapter_playlist_id` int(11) NOT NULL,
  `exercise_playlist_id` int(11) NOT NULL,
  `student_class` int(11) NOT NULL,
  `question_id` int(55) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `book_playlist_id` (`book_playlist_id`)
) ENGINE=InnoDB AUTO_INCREMENT=404618 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `book_type_update`
--

DROP TABLE IF EXISTS `book_type_update`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `book_type_update` (
  `student_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `subject` varchar(50) NOT NULL,
  `chapter` varchar(100) NOT NULL,
  `doubt` varchar(100) NOT NULL,
  `new_type` varchar(200) NOT NULL,
  `doubt_type` int(11) NOT NULL DEFAULT '1',
  `question_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `books` (
  `book_id` int(11) NOT NULL AUTO_INCREMENT,
  `class_name` varchar(255) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `book_name` varchar(255) NOT NULL,
  PRIMARY KEY (`book_id`)
) ENGINE=InnoDB AUTO_INCREMENT=102 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bounty_answer_detail`
--

DROP TABLE IF EXISTS `bounty_answer_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bounty_answer_detail` (
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `student_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL AUTO_INCREMENT,
  `bounty_id` int(11) NOT NULL,
  `acceptance_flag` int(11) NOT NULL,
  `answer_video` varchar(250) NOT NULL,
  `bounty_earned` int(11) NOT NULL,
  `is_delete` tinyint(4) NOT NULL,
  `entity_type` varchar(30) NOT NULL,
  `answer_thumbnail` varchar(100) DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `temp1` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`answer_id`),
  KEY `student_id` (`student_id`),
  KEY `bounty_id` (`bounty_id`),
  KEY `bounty_earned` (`bounty_earned`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=518855 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bounty_answer_quality_check`
--

DROP TABLE IF EXISTS `bounty_answer_quality_check`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bounty_answer_quality_check` (
  `answer_id` int(11) NOT NULL,
  `bounty_id` int(11) NOT NULL,
  `vote` tinyint(3) NOT NULL,
  `student_id` int(11) NOT NULL,
  UNIQUE KEY `bounty_vote` (`student_id`,`answer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bounty_book_marking`
--

DROP TABLE IF EXISTS `bounty_book_marking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bounty_book_marking` (
  `bounty_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `bounty_amount` int(11) NOT NULL,
  `is_bookmark` tinyint(4) NOT NULL,
  `bookmark_id` int(11) NOT NULL AUTO_INCREMENT,
  UNIQUE KEY `student_bounty` (`student_id`,`bounty_id`),
  KEY `bookmark_id` (`bookmark_id`)
) ENGINE=InnoDB AUTO_INCREMENT=115343 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bounty_disbursement`
--

DROP TABLE IF EXISTS `bounty_disbursement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bounty_disbursement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `student_id` int(11) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `bounty_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL DEFAULT '0',
  `amount_to_disburse` decimal(10,2) NOT NULL,
  `order_id` varchar(200) NOT NULL DEFAULT '0',
  `is_disbursed` int(11) NOT NULL,
  `type` varchar(20) NOT NULL,
  `status` varchar(45) DEFAULT NULL,
  `partner_txn_id` varchar(45) DEFAULT NULL,
  `partner_txn_response` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bounty_id` (`bounty_id`),
  KEY `answer_id` (`answer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=58105 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bounty_feedback`
--

DROP TABLE IF EXISTS `bounty_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bounty_feedback` (
  `student_id` int(11) NOT NULL,
  `feedback` text NOT NULL,
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bounty_post_detail`
--

DROP TABLE IF EXISTS `bounty_post_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bounty_post_detail` (
  `bounty_id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_delete` tinyint(4) NOT NULL,
  `is_active` tinyint(4) NOT NULL,
  `question_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `student_img` varchar(200) NOT NULL,
  `bounty_ques_img` varchar(220) NOT NULL,
  `description` varchar(250) NOT NULL,
  `bounty_amount` smallint(6) NOT NULL,
  `expired_at` timestamp NOT NULL,
  `is_answered` tinyint(11) NOT NULL,
  `question_subject` varchar(30) NOT NULL,
  `student_class` tinyint(4) NOT NULL,
  `chapter` varchar(50) NOT NULL,
  `exam` varchar(200) NOT NULL,
  `is_accepted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`bounty_id`),
  KEY `student_id` (`student_id`),
  KEY `bounty_amount` (`bounty_amount`),
  KEY `student_class` (`student_class`),
  KEY `exam` (`exam`),
  KEY `question_subject_idx` (`question_subject`),
  KEY `is_active_idx` (`is_active`),
  KEY `comp_s_c_a_idx` (`chapter`,`question_subject`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=1839597 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bounty_qc`
--

DROP TABLE IF EXISTS `bounty_qc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bounty_qc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `bounty_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `entity_type` varchar(30) NOT NULL,
  `status` int(11) NOT NULL,
  `expert_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `brainly_answers`
--

DROP TABLE IF EXISTS `brainly_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `brainly_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `brainly_id` int(11) DEFAULT NULL,
  `url` varchar(200) DEFAULT NULL,
  `answer` text,
  `isVerified` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `brainly_id` (`brainly_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1061493 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `brainly_id_questions`
--

DROP TABLE IF EXISTS `brainly_id_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `brainly_id_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(2500) DEFAULT NULL,
  `ocr_text_en` varchar(3000) NOT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `answer` varchar(2500) DEFAULT NULL,
  `canonical_url` varchar(2700) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=89546 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `brainly_scrapped_questions`
--

DROP TABLE IF EXISTS `brainly_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `brainly_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(1500) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `answer` varchar(1500) DEFAULT NULL,
  `canonical_url` varchar(1500) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=274 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `brainly_url_subject`
--

DROP TABLE IF EXISTS `brainly_url_subject`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `brainly_url_subject` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(500) DEFAULT NULL,
  `subject` varchar(400) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22954 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `brainlydotcom_scrapped_questions`
--

DROP TABLE IF EXISTS `brainlydotcom_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `brainlydotcom_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(2000) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `source_id` varchar(50) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6604 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branch_data_test`
--

DROP TABLE IF EXISTS `branch_data_test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branch_data_test` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event` varchar(30) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `latd_campaign` varchar(100) NOT NULL DEFAULT '0',
  `latd_feature` varchar(100) DEFAULT '0',
  `advertising_partner_name` varchar(100) NOT NULL DEFAULT '0',
  `aaid` varchar(100) NOT NULL DEFAULT '0',
  `referred_udid` varchar(100) NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `aaid` (`aaid`,`referred_udid`),
  KEY `latd_campaign` (`latd_campaign`),
  KEY `latd_feature` (`latd_feature`),
  KEY `advertising_partner_name` (`advertising_partner_name`),
  KEY `created_at` (`created_at`),
  KEY `event` (`event`)
) ENGINE=InnoDB AUTO_INCREMENT=123341 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branch_data_udid`
--

DROP TABLE IF EXISTS `branch_data_udid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branch_data_udid` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `aaid` varchar(100) NOT NULL DEFAULT '0',
  `referred_udid` varchar(50) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `aaid` (`aaid`,`referred_udid`)
) ENGINE=InnoDB AUTO_INCREMENT=463068 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branch_deeplink_tracker`
--

DROP TABLE IF EXISTS `branch_deeplink_tracker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branch_deeplink_tracker` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `campaign` varchar(255) NOT NULL,
  `channel` varchar(255) NOT NULL,
  `feature` varchar(255) NOT NULL,
  `stage` varchar(255) NOT NULL,
  `qid` int(11) DEFAULT NULL,
  `sid` int(11) NOT NULL,
  `fallback` int(11) DEFAULT NULL,
  `branch_url` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1857 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branch_events_2020`
--

DROP TABLE IF EXISTS `branch_events_2020`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branch_events_2020` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `os` varchar(50) NOT NULL,
  `os_version` varchar(50) NOT NULL,
  `environment` varchar(50) NOT NULL,
  `platform` varchar(50) NOT NULL,
  `aaid` varchar(100) NOT NULL,
  `limit_ad_tracking` tinyint(1) NOT NULL DEFAULT '0',
  `user_agent` varchar(100) NOT NULL,
  `ip` varchar(50) NOT NULL,
  `referred_udid` varchar(55) NOT NULL,
  `country` varchar(50) NOT NULL,
  `language` varchar(50) NOT NULL,
  `sdk_version` varchar(50) NOT NULL,
  `app_version` varchar(50) NOT NULL,
  `brand` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `geo_dma_code` varchar(50) NOT NULL,
  `geo_country_code` varchar(50) NOT NULL,
  `latd_id` varchar(50) NOT NULL,
  `latd_$3p` varchar(50) NOT NULL,
  `latd_campaign` varchar(50) NOT NULL,
  `latd_channel` varchar(50) NOT NULL,
  `latd_feature` varchar(50) NOT NULL,
  `latd_stage` varchar(50) NOT NULL,
  `latd_url` varchar(75) NOT NULL,
  `latd_marketing` tinyint(1) NOT NULL,
  `advertising_partner_name` varchar(50) NOT NULL,
  `latd_branch_ad_format` varchar(50) NOT NULL,
  `campaign_id` varchar(50) NOT NULL,
  `click_timestamp` bigint(25) NOT NULL,
  `latd_via_features` varchar(50) NOT NULL,
  `secondary_publisher` varchar(50) NOT NULL,
  `timestamp` bigint(25) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `question_id` varchar(50) NOT NULL,
  `referrer_student_id` varchar(50) NOT NULL,
  `latd_tags` varchar(100) NOT NULL,
  `creation_source` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `aaid` (`aaid`),
  KEY `referred_udid` (`referred_udid`),
  KEY `latd_campaign` (`latd_campaign`),
  KEY `name_2` (`created_at`,`name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=285089567 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branch_events_US`
--

DROP TABLE IF EXISTS `branch_events_US`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branch_events_US` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `os` varchar(50) NOT NULL,
  `os_version` varchar(50) NOT NULL,
  `environment` varchar(50) NOT NULL,
  `platform` varchar(50) NOT NULL,
  `aaid` varchar(100) NOT NULL,
  `limit_ad_tracking` tinyint(1) NOT NULL DEFAULT '0',
  `user_agent` varchar(100) NOT NULL,
  `ip` varchar(50) NOT NULL,
  `referred_udid` varchar(55) NOT NULL,
  `country` varchar(50) NOT NULL,
  `language` varchar(50) NOT NULL,
  `sdk_version` varchar(50) NOT NULL,
  `app_version` varchar(50) NOT NULL,
  `brand` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `geo_dma_code` varchar(50) NOT NULL,
  `geo_country_code` varchar(50) NOT NULL,
  `latd_id` varchar(50) NOT NULL,
  `latd_$3p` varchar(50) NOT NULL,
  `latd_campaign` varchar(50) NOT NULL,
  `latd_channel` varchar(50) NOT NULL,
  `latd_feature` varchar(50) NOT NULL,
  `latd_stage` varchar(50) NOT NULL,
  `latd_url` varchar(75) NOT NULL,
  `latd_marketing` tinyint(1) NOT NULL,
  `advertising_partner_name` varchar(50) NOT NULL,
  `latd_branch_ad_format` varchar(50) NOT NULL,
  `campaign_id` varchar(50) NOT NULL,
  `click_timestamp` bigint(25) NOT NULL,
  `latd_via_features` varchar(50) NOT NULL,
  `secondary_publisher` varchar(50) NOT NULL,
  `timestamp` bigint(25) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `question_id` varchar(50) NOT NULL,
  `referrer_student_id` varchar(50) NOT NULL,
  `latd_tags` varchar(100) NOT NULL,
  `creation_source` tinyint(4) NOT NULL,
  `custom_data` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aaid` (`aaid`),
  KEY `referred_udid` (`referred_udid`),
  KEY `latd_campaign` (`latd_campaign`),
  KEY `name_2` (`created_at`,`name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=65006 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branch_events_install`
--

DROP TABLE IF EXISTS `branch_events_install`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branch_events_install` (
  `id` int(11) NOT NULL DEFAULT '0',
  `name` varchar(50) NOT NULL,
  `os` varchar(50) NOT NULL,
  `os_version` varchar(50) NOT NULL,
  `environment` varchar(50) NOT NULL,
  `platform` varchar(50) NOT NULL,
  `aaid` varchar(100) NOT NULL,
  `limit_ad_tracking` tinyint(1) NOT NULL DEFAULT '0',
  `user_agent` varchar(100) NOT NULL,
  `ip` varchar(50) NOT NULL,
  `referred_udid` varchar(55) NOT NULL,
  `country` varchar(50) NOT NULL,
  `language` varchar(50) NOT NULL,
  `sdk_version` varchar(50) NOT NULL,
  `app_version` varchar(50) NOT NULL,
  `brand` varchar(50) NOT NULL,
  `model` varchar(50) NOT NULL,
  `geo_dma_code` varchar(50) NOT NULL,
  `geo_country_code` varchar(50) NOT NULL,
  `latd_id` varchar(50) NOT NULL,
  `latd_$3p` varchar(50) NOT NULL,
  `latd_campaign` varchar(50) NOT NULL,
  `latd_channel` varchar(50) NOT NULL,
  `latd_feature` varchar(50) NOT NULL,
  `latd_stage` varchar(50) NOT NULL,
  `latd_url` varchar(75) NOT NULL,
  `latd_marketing` tinyint(1) NOT NULL,
  `advertising_partner_name` varchar(50) NOT NULL,
  `latd_branch_ad_format` varchar(50) NOT NULL,
  `campaign_id` varchar(50) NOT NULL,
  `click_timestamp` bigint(25) NOT NULL,
  `latd_via_features` varchar(50) NOT NULL,
  `secondary_publisher` varchar(50) NOT NULL,
  `timestamp` bigint(25) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `question_id` varchar(50) NOT NULL,
  `referrer_student_id` varchar(50) NOT NULL,
  `latd_tags` varchar(100) NOT NULL,
  `creation_source` tinyint(4) NOT NULL,
  KEY `referred_udid` (`referred_udid`),
  KEY `created_at` (`created_at`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branch_install_1`
--

DROP TABLE IF EXISTS `branch_install_1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branch_install_1` (
  `referred_udid` varchar(255) NOT NULL,
  `latd_campaign` varchar(255) NOT NULL,
  `created_at` date NOT NULL,
  `branch_name` varchar(255) NOT NULL,
  KEY `referred_udid` (`referred_udid`),
  KEY `latd_campaign` (`latd_campaign`),
  KEY `branch_name` (`branch_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `byju_scrapped_questions`
--

DROP TABLE IF EXISTS `byju_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `byju_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(200) DEFAULT NULL,
  `option1` varchar(50) DEFAULT NULL,
  `option2` varchar(50) DEFAULT NULL,
  `option3` varchar(50) DEFAULT NULL,
  `option4` varchar(50) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `answer` varchar(100) DEFAULT NULL,
  `source_id` varchar(200) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `campaign_redirection_mapping`
--

DROP TABLE IF EXISTS `campaign_redirection_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `campaign_redirection_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `campaign` varchar(150) DEFAULT NULL,
  `deeplink` varchar(150) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sticky_notification_id` int(11) DEFAULT NULL,
  `assortment_id` int(11) DEFAULT NULL,
  `wallet_credit` tinyint(1) DEFAULT '0',
  `uxcam_enable` int(11) DEFAULT NULL,
  `assortment_id_arr` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `campaign` (`campaign`,`is_active`),
  KEY `wallet_credit` (`wallet_credit`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `campaign_students`
--

DROP TABLE IF EXISTS `campaign_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `campaign_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `campaign_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `rating` int(2) DEFAULT NULL,
  `time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `campaign_id` (`campaign_id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11490488 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `campaign_types`
--

DROP TABLE IF EXISTS `campaign_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `campaign_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(256) NOT NULL,
  `description` varchar(500) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question` varchar(500) NOT NULL,
  `type` varchar(256) NOT NULL,
  `query` varchar(500) NOT NULL,
  `start` date NOT NULL,
  `end` date NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `start` (`start`),
  KEY `end` (`end`)
) ENGINE=InnoDB AUTO_INCREMENT=615 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `category_supercategory`
--

DROP TABLE IF EXISTS `category_supercategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category_supercategory` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `category` varchar(50) DEFAULT NULL,
  `super_category` varchar(75) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ccm_ecm_mapping`
--

DROP TABLE IF EXISTS `ccm_ecm_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ccm_ecm_mapping` (
  `ccm_id` int(11) DEFAULT NULL,
  `ecm_id` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `assortment_id` int(11) NOT NULL,
  `carousel_order` int(11) DEFAULT '10',
  UNIQUE KEY `ccm_id` (`ccm_id`,`ecm_id`,`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ccm_ecm_mapping_2`
--

DROP TABLE IF EXISTS `ccm_ecm_mapping_2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ccm_ecm_mapping_2` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ccm_id` int(11) DEFAULT NULL,
  `ecm_id` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `assortment_id` int(11) NOT NULL,
  `carousel_order` int(11) DEFAULT '10',
  `is_show_home` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ccm_id` (`ccm_id`,`ecm_id`,`class`)
) ENGINE=InnoDB AUTO_INCREMENT=1115 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ccm_lc_course_mapping`
--

DROP TABLE IF EXISTS `ccm_lc_course_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ccm_lc_course_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `ccm_id` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `course` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `locale` varchar(255) DEFAULT NULL,
  `free_liveclass_course_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ccm_lc_course_mapping_ccm_id` (`ccm_id`),
  KEY `ccm_lc_course_mapping_free_liveclass_course_id` (`free_liveclass_course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ccmid_book_mapping`
--

DROP TABLE IF EXISTS `ccmid_book_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ccmid_book_mapping` (
  `ccmid` int(11) DEFAULT NULL,
  `bookname` text,
  `book_student_id` int(11) DEFAULT NULL,
  `creation_time` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ccmid_liveclass`
--

DROP TABLE IF EXISTS `ccmid_liveclass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ccmid_liveclass` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_class` int(11) DEFAULT NULL,
  `question_subject` varchar(50) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `view_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=212 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `celery_taskmeta`
--

DROP TABLE IF EXISTS `celery_taskmeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `celery_taskmeta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL,
  `result` longtext,
  `date_done` datetime(6) NOT NULL,
  `traceback` longtext,
  `hidden` tinyint(1) NOT NULL,
  `meta` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `task_id` (`task_id`),
  KEY `celery_taskmeta_662f707d` (`hidden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `celery_tasksetmeta`
--

DROP TABLE IF EXISTS `celery_tasksetmeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `celery_tasksetmeta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `taskset_id` varchar(255) NOT NULL,
  `result` longtext NOT NULL,
  `date_done` datetime(6) NOT NULL,
  `hidden` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `taskset_id` (`taskset_id`),
  KEY `celery_tasksetmeta_662f707d` (`hidden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `channels`
--

DROP TABLE IF EXISTS `channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `channels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ccm_id` varchar(20) NOT NULL,
  `type` varchar(100) NOT NULL,
  `data_type` varchar(50) NOT NULL,
  `class` varchar(10) NOT NULL,
  `title` varchar(200) NOT NULL,
  `hindi_title` varchar(200) NOT NULL,
  `deeplink` varchar(200) NOT NULL,
  `mapped_playlist_id` int(11) NOT NULL DEFAULT '0',
  `min_version_code` int(11) NOT NULL,
  `max_version_code` int(11) NOT NULL,
  `flag_variant_id` int(11) NOT NULL,
  `is_active` tinyint(4) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `item_order` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `ccm_id` (`ccm_id`),
  KEY `type` (`type`),
  KEY `title` (`title`),
  KEY `min_version_code` (`min_version_code`),
  KEY `flag_variant_id` (`flag_variant_id`),
  KEY `is_active` (`is_active`),
  KEY `max_version_code` (`max_version_code`),
  KEY `class` (`class`),
  KEY `item_order` (`item_order`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chapter_alias_all_lang`
--

DROP TABLE IF EXISTS `chapter_alias_all_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chapter_alias_all_lang` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `chapter` varchar(1024) NOT NULL,
  `chapter_alias` varchar(1024) NOT NULL,
  `hindi_chapter_alias` varchar(1024) NOT NULL,
  `translated_by` enum('MANUAL','GOOGLE') NOT NULL,
  `chapter_trans` varchar(500) DEFAULT NULL,
  `chapter_alias_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class_subject` (`class`,`subject`),
  KEY `chapter` (`chapter`),
  KEY `chapter_trans` (`chapter_trans`),
  KEY `idx_subject` (`subject`),
  KEY `idx_class_subject` (`class`,`subject`(25)),
  KEY `chapter_alias_url` (`chapter_alias_url`)
) ENGINE=InnoDB AUTO_INCREMENT=13622 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chapter_alias_long_form`
--

DROP TABLE IF EXISTS `chapter_alias_long_form`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chapter_alias_long_form` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liveclass_course_id` int(11) NOT NULL,
  `course_assortment_id` int(11) NOT NULL,
  `subject_assortment_id` int(11) NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `chapter_assortment_id` int(11) NOT NULL,
  `chapter_name` varchar(100) NOT NULL,
  `chapter_alias` varchar(100) NOT NULL,
  `vendor_id` tinyint(4) NOT NULL,
  `type` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chapter_aliases`
--

DROP TABLE IF EXISTS `chapter_aliases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chapter_aliases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` varchar(50) NOT NULL,
  `subject` varchar(50) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `chapter_aliases` varchar(500) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1906 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chapter_aliases_new`
--

DROP TABLE IF EXISTS `chapter_aliases_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chapter_aliases_new` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` varchar(50) NOT NULL,
  `subject` varchar(50) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `chapter_aliases` varchar(500) NOT NULL,
  `master_chapter_aliases` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class` (`class`,`subject`,`chapter`,`chapter_aliases`)
) ENGINE=InnoDB AUTO_INCREMENT=3583 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chapter_pdf_details`
--

DROP TABLE IF EXISTS `chapter_pdf_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chapter_pdf_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `subject` varchar(250) DEFAULT NULL,
  `chapter` varchar(500) DEFAULT NULL,
  `chapter_order` int(11) NOT NULL,
  `pdf_url` varchar(500) DEFAULT NULL,
  `is_pdf_ready` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27303 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chegg_scrapped_questions`
--

DROP TABLE IF EXISTS `chegg_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chegg_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(4500) DEFAULT NULL,
  `image_url` varchar(250) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `answer` varchar(5500) DEFAULT NULL,
  `canonical_url` varchar(2500) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=544874 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chemistry_chapter_name`
--

DROP TABLE IF EXISTS `chemistry_chapter_name`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chemistry_chapter_name` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `subject` varchar(20) NOT NULL,
  `chapter_name` varchar(500) NOT NULL,
  `is_organic` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7620 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chemistry_chapter_words`
--

DROP TABLE IF EXISTS `chemistry_chapter_words`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chemistry_chapter_words` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `string_word` varchar(255) DEFAULT NULL,
  `is_organic` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `string_word` (`string_word`),
  KEY `is_organic` (`is_organic`)
) ENGINE=InnoDB AUTO_INCREMENT=5541 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `city_tier_mapping`
--

DROP TABLE IF EXISTS `city_tier_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `city_tier_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `city` varchar(100) DEFAULT NULL,
  `tier` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `city` (`city`)
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class9to12_vv1to20_hi_freetrial`
--

DROP TABLE IF EXISTS `class9to12_vv1to20_hi_freetrial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class9to12_vv1to20_hi_freetrial` (
  `student_id` int(11) DEFAULT NULL,
  `student_class` varchar(255) DEFAULT NULL,
  `locale` varchar(255) DEFAULT NULL,
  `et_sec` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_attendance`
--

DROP TABLE IF EXISTS `class_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_attendance` (
  `class_attendance_id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` varchar(255) NOT NULL,
  `student_id` varchar(255) NOT NULL,
  `student_attendance` varchar(255) NOT NULL,
  `absence_remarks` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`class_attendance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_chapter_image_mapping`
--

DROP TABLE IF EXISTS `class_chapter_image_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_chapter_image_mapping` (
  `class` int(11) DEFAULT NULL,
  `course` varchar(255) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `chapter_display` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `path_image` varchar(255) DEFAULT NULL,
  `chapter_order` int(11) NOT NULL,
  UNIQUE KEY `class` (`class`,`course`,`chapter`),
  KEY `chapter_order` (`chapter_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_chapter_topic`
--

DROP TABLE IF EXISTS `class_chapter_topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_chapter_topic` (
  `class_chapter_topic_id` int(11) NOT NULL AUTO_INCREMENT,
  `class_name` varchar(255) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `unit` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `topic` varchar(255) NOT NULL,
  `exercise` varchar(255) NOT NULL,
  `term` varchar(255) NOT NULL,
  PRIMARY KEY (`class_chapter_topic_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1181 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_course_mapping`
--

DROP TABLE IF EXISTS `class_course_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_course_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `course` varchar(100) NOT NULL,
  `category` enum('exam','board','other-exam','other-board') NOT NULL,
  `other` int(11) NOT NULL DEFAULT '0',
  `course_id` int(11) DEFAULT NULL,
  `priority` int(11) DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `personalisation_active` tinyint(1) NOT NULL DEFAULT '0',
  `sub_personalisation_active` int(11) NOT NULL DEFAULT '0',
  `on_boarding_status` tinyint(4) NOT NULL DEFAULT '0',
  `course_meta` varchar(250) DEFAULT NULL,
  `region` varchar(45) DEFAULT 'IN',
  PRIMARY KEY (`id`),
  KEY `class` (`class`),
  KEY `course` (`course`),
  KEY `category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=13439 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_display_mapping`
--

DROP TABLE IF EXISTS `class_display_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_display_mapping` (
  `class` int(55) NOT NULL,
  `english` varchar(255) DEFAULT NULL,
  `hindi` varchar(255) DEFAULT NULL,
  `bengali` varchar(255) DEFAULT NULL,
  `gujarati` varchar(255) DEFAULT NULL,
  `kannada` varchar(255) DEFAULT NULL,
  `malayalam` varchar(255) DEFAULT NULL,
  `marathi` varchar(255) DEFAULT NULL,
  `nepali` varchar(255) DEFAULT NULL,
  `punjabi` varchar(255) DEFAULT NULL,
  `Tamil` varchar(255) DEFAULT NULL,
  `Telugu` varchar(255) DEFAULT NULL,
  `Urdu` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`class`),
  KEY `class` (`class`,`english`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_failed_onboarding`
--

DROP TABLE IF EXISTS `class_failed_onboarding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_failed_onboarding` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) NOT NULL,
  `student_class` int(11) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_feedback`
--

DROP TABLE IF EXISTS `class_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_feedback` (
  `class_feedback_id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` varchar(255) NOT NULL,
  `student_id` varchar(255) NOT NULL,
  `student_feedback_score` float NOT NULL,
  `student_comment` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`class_feedback_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_schedule`
--

DROP TABLE IF EXISTS `class_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_schedule` (
  `class_schedule_id` int(11) NOT NULL AUTO_INCREMENT,
  `class_name` varchar(255) NOT NULL,
  `course_id` int(255) NOT NULL,
  `course_class_num` int(11) NOT NULL,
  `instructor_id` varchar(255) NOT NULL,
  `facility_id` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `time_from` varchar(255) DEFAULT NULL,
  `class_duration` varchar(255) NOT NULL,
  `time_to` varchar(255) DEFAULT NULL,
  `repeat_class` varchar(255) NOT NULL,
  PRIMARY KEY (`class_schedule_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_subject_mapping`
--

DROP TABLE IF EXISTS `class_subject_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_subject_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `subject_order` int(11) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_syllabus_mapping`
--

DROP TABLE IF EXISTS `class_syllabus_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_syllabus_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `year_exam` varchar(10) DEFAULT NULL,
  `meta_info` varchar(100) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `book` varchar(100) DEFAULT NULL,
  `chapter_order` int(11) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `course_type` varchar(20) DEFAULT NULL,
  `class_type` varchar(20) DEFAULT NULL,
  `current_status` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `subject_display` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `book` (`book`),
  KEY `subject_display` (`subject_display`)
) ENGINE=InnoDB AUTO_INCREMENT=33384 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_topic`
--

DROP TABLE IF EXISTS `class_topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `class_topic` (
  `class_topic_id` int(11) NOT NULL AUTO_INCREMENT,
  `class` varchar(3) NOT NULL,
  `topic` varchar(64) NOT NULL,
  `topic_image` varchar(16) DEFAULT NULL,
  `status` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`class_topic_id`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `classes` (
  `class_id` int(11) NOT NULL AUTO_INCREMENT,
  `class_name` varchar(255) NOT NULL,
  PRIMARY KEY (`class_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classroom_attributes`
--

DROP TABLE IF EXISTS `classroom_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `classroom_attributes` (
  `classroom_attribute_id` int(11) NOT NULL AUTO_INCREMENT,
  `classroom_attribute_num` varchar(255) NOT NULL,
  `classroom_attribute_description` varchar(255) NOT NULL,
  `classroom_attribute_value` varchar(255) NOT NULL,
  PRIMARY KEY (`classroom_attribute_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classzoo1.testacl`
--

DROP TABLE IF EXISTS `classzoo1.testacl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `classzoo1.testacl` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` mediumtext NOT NULL,
  `description` mediumtext NOT NULL,
  `playlist_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `comment_pinned`
--

DROP TABLE IF EXISTS `comment_pinned`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comment_pinned` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `message_image` varchar(255) DEFAULT NULL,
  `message_qid` int(11) DEFAULT NULL,
  `message_aid` int(11) DEFAULT NULL,
  `resource_id` int(11) NOT NULL,
  `resource_type` enum('question_id','course_assortment_id','default') NOT NULL,
  `comment_id` varchar(64) DEFAULT NULL,
  `username` varchar(180) NOT NULL DEFAULT 'Doubtnut',
  `user_img` varchar(255) NOT NULL DEFAULT 'https://d10lpgp6xz60nq.cloudfront.net/Logo%403x.png',
  `is_admin` tinyint(4) NOT NULL DEFAULT '1',
  `user_tag` varchar(255) NOT NULL DEFAULT 'Doubtnut Team',
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `publish_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `unpublish_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `batch` int(11) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `resource_type` (`resource_type`,`resource_id`,`is_active`,`publish_time`,`unpublish_time`,`batch`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `community_questions_meta`
--

DROP TABLE IF EXISTS `community_questions_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `community_questions_meta` (
  `id` int(255) NOT NULL AUTO_INCREMENT,
  `qid` int(255) NOT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `subtopic` varchar(255) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `qid` (`qid`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=1143375 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `community_questions_upvote`
--

DROP TABLE IF EXISTS `community_questions_upvote`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `community_questions_upvote` (
  `id` int(255) NOT NULL AUTO_INCREMENT,
  `qid` int(255) NOT NULL,
  `voter_id` int(255) NOT NULL,
  `voted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qid` (`qid`,`voter_id`),
  UNIQUE KEY `qid_2` (`qid`,`voter_id`),
  KEY `voted_at` (`voted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=12706 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `content_trend`
--

DROP TABLE IF EXISTS `content_trend`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_trend` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date_v` date NOT NULL,
  `class` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `chapter` varchar(500) NOT NULL,
  `subtopic` varchar(500) NOT NULL,
  `count_chapter` int(11) NOT NULL,
  `count_subtopic` int(11) NOT NULL,
  `hindi_subtopic` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=365341 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_debarred_students`
--

DROP TABLE IF EXISTS `contest_debarred_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_debarred_students` (
  `contest_id` int(100) NOT NULL,
  `student_id` int(100) NOT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`contest_id`,`student_id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_details`
--

DROP TABLE IF EXISTS `contest_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_details` (
  `id` int(50) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) DEFAULT NULL,
  `parameter` varchar(50) DEFAULT NULL,
  `headline` varchar(100) DEFAULT NULL,
  `logo` varchar(100) DEFAULT NULL,
  `bg_color` varchar(20) DEFAULT NULL,
  `description` text,
  `winner_count` int(50) DEFAULT NULL,
  `date_from` datetime NOT NULL,
  `date_till` datetime NOT NULL,
  `amount` varchar(500) DEFAULT NULL,
  `deduction` int(11) DEFAULT NULL,
  `text_string` varchar(500) DEFAULT NULL,
  `contest_name` text,
  `amount_distribution` varchar(2000) DEFAULT NULL,
  `lucky_draw_winner_count` int(11) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_list`
--

DROP TABLE IF EXISTS `contest_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_list` (
  `contest_id` int(11) NOT NULL AUTO_INCREMENT,
  `contest_name` varchar(255) NOT NULL,
  `contest_description` varchar(255) NOT NULL,
  PRIMARY KEY (`contest_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_paytm_txn`
--

DROP TABLE IF EXISTS `contest_paytm_txn`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_paytm_txn` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `mobile` varchar(10) NOT NULL,
  `amount` int(11) NOT NULL,
  `dn_remarks` varchar(500) NOT NULL,
  `payment_status` varchar(20) NOT NULL,
  `status_code` varchar(100) DEFAULT NULL,
  `status_message` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12566 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_paytm_txn_retry`
--

DROP TABLE IF EXISTS `contest_paytm_txn_retry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_paytm_txn_retry` (
  `order_id` varchar(100) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `mobile` varchar(10) NOT NULL,
  `amount` int(11) NOT NULL,
  `dn_remarks` varchar(500) NOT NULL,
  `payment_status` varchar(20) NOT NULL,
  `status_code` varchar(100) NOT NULL,
  `status_message` text NOT NULL,
  PRIMARY KEY (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_playlists`
--

DROP TABLE IF EXISTS `contest_playlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_playlists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `notification_type` varchar(10) NOT NULL,
  `playlist_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `doubt` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `doubt` (`doubt`),
  KEY `class` (`class`,`playlist_id`,`doubt`),
  KEY `class_2` (`class`,`notification_type`),
  KEY `class_3` (`class`,`doubt`)
) ENGINE=InnoDB AUTO_INCREMENT=2301 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_prize`
--

DROP TABLE IF EXISTS `contest_prize`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_prize` (
  `id` int(50) NOT NULL AUTO_INCREMENT,
  `position` int(50) NOT NULL,
  `amount` double NOT NULL,
  `image` varchar(500) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_query`
--

DROP TABLE IF EXISTS `contest_query`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_query` (
  `id` int(50) NOT NULL AUTO_INCREMENT,
  `previous_winner_list` varchar(500) DEFAULT NULL,
  `current_winner_list` varchar(500) DEFAULT NULL,
  `eligibility` varchar(500) DEFAULT NULL,
  `current_stats` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_questions`
--

DROP TABLE IF EXISTS `contest_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_questions` (
  `q_id` int(11) NOT NULL,
  `contest_id` int(11) NOT NULL,
  `question` varchar(255) NOT NULL,
  `options` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_results`
--

DROP TABLE IF EXISTS `contest_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `contest_id` int(11) NOT NULL,
  `q_no` int(11) NOT NULL,
  `ans_no` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`,`contest_id`,`q_no`),
  KEY `q_no` (`q_no`)
) ENGINE=InnoDB AUTO_INCREMENT=149 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_rules`
--

DROP TABLE IF EXISTS `contest_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_rules` (
  `id` int(50) NOT NULL AUTO_INCREMENT,
  `rules` varchar(500) NOT NULL,
  `type` varchar(500) DEFAULT NULL,
  `parameter` varchar(500) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_winners`
--

DROP TABLE IF EXISTS `contest_winners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_winners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(50) NOT NULL,
  `amount` double NOT NULL,
  `date` date NOT NULL,
  `position` int(50) NOT NULL,
  `contest_id` int(50) DEFAULT NULL,
  `course_id` int(50) DEFAULT NULL,
  `type` varchar(500) DEFAULT NULL,
  `parameter` varchar(500) DEFAULT NULL,
  `count` int(50) DEFAULT '0',
  `post_id` varchar(100) DEFAULT NULL,
  `order_id` varchar(100) DEFAULT NULL,
  `payment_mode` varchar(50) DEFAULT NULL,
  `payment_status` varchar(50) DEFAULT NULL,
  `payment_try_count` int(11) DEFAULT NULL,
  `status_code` varchar(25) DEFAULT NULL,
  `repayment_sms_sent` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `date` (`date`),
  KEY `amount` (`amount`),
  KEY `contest_id` (`contest_id`),
  KEY `payment_status` (`payment_status`),
  KEY `type` (`type`),
  KEY `parameter` (`parameter`)
) ENGINE=InnoDB AUTO_INCREMENT=8366371 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_winners_check`
--

DROP TABLE IF EXISTS `contest_winners_check`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_winners_check` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `student_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `hour_v` int(11) NOT NULL,
  `minute_v` int(11) NOT NULL,
  `count_v` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=163942 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_winners_test`
--

DROP TABLE IF EXISTS `contest_winners_test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_winners_test` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(50) NOT NULL,
  `amount` double NOT NULL,
  `date` date NOT NULL,
  `position` int(50) NOT NULL,
  `contest_id` int(50) DEFAULT NULL,
  `course_id` int(50) DEFAULT NULL,
  `type` varchar(500) DEFAULT NULL,
  `parameter` varchar(500) DEFAULT NULL,
  `count` int(50) DEFAULT '0',
  `post_id` varchar(100) DEFAULT NULL,
  `order_id` varchar(100) DEFAULT NULL,
  `payment_mode` varchar(50) DEFAULT NULL,
  `payment_status` varchar(50) DEFAULT NULL,
  `payment_try_count` int(11) DEFAULT NULL,
  `status_code` varchar(25) DEFAULT NULL,
  `repayment_sms_sent` int(11) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=546 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `corona_scrapped_questions`
--

DROP TABLE IF EXISTS `corona_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `corona_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(200) DEFAULT NULL,
  `subject` varchar(20) DEFAULT NULL,
  `answer` varchar(1500) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5157 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coupon_applicability`
--

DROP TABLE IF EXISTS `coupon_applicability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupon_applicability` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coupon_code` varchar(100) DEFAULT NULL,
  `type` enum('generic','specific','target-group','assortment-type') DEFAULT 'generic',
  `value` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ca_coupon_code_idx` (`coupon_code`),
  KEY `type` (`type`),
  KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=22513885 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coupon_package_id_mapping`
--

DROP TABLE IF EXISTS `coupon_package_id_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupon_package_id_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coupon_code` varchar(100) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coupon_idx` (`coupon_code`,`package_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1882653 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coupon_packages_intermediate`
--

DROP TABLE IF EXISTS `coupon_packages_intermediate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupon_packages_intermediate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coupon_code` varchar(100) DEFAULT NULL,
  `package_id` int(11) NOT NULL DEFAULT '0',
  `start_date` timestamp NOT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `coupon_code` (`coupon_code`),
  KEY `start_date` (`start_date`),
  KEY `end_date` (`end_date`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=260274 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coupon_reseller_mapping`
--

DROP TABLE IF EXISTS `coupon_reseller_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupon_reseller_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coupon_code` varchar(100) DEFAULT NULL,
  `reseller_student_id` int(11) DEFAULT NULL,
  `buyer_mobile` varchar(255) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `package_amount` int(11) DEFAULT NULL,
  `cash_collected` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `crm_rsid_idx` (`reseller_student_id`),
  KEY `crm_pid_idx` (`package_id`),
  KEY `crm_cc_idx` (`coupon_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coupon_timer_temp`
--

DROP TABLE IF EXISTS `coupon_timer_temp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupon_timer_temp` (
  `student_id` int(11) DEFAULT NULL,
  KEY `ct_s_id_idx` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupons` (
  `coupon_id` int(11) NOT NULL AUTO_INCREMENT,
  `coupon_code` varchar(255) NOT NULL,
  `scheme_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `coupon_redeemed` tinyint(4) NOT NULL DEFAULT '0',
  `added_by` int(11) NOT NULL DEFAULT '0',
  `added_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `system_time` varchar(50) NOT NULL,
  `coupon_value` int(11) NOT NULL,
  `coupon_sold` tinyint(4) NOT NULL DEFAULT '0',
  `sold_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sold_mobile` varchar(16) DEFAULT NULL,
  PRIMARY KEY (`coupon_id`),
  UNIQUE KEY `coupon_code` (`coupon_code`)
) ENGINE=InnoDB AUTO_INCREMENT=12158 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coupons_new`
--

DROP TABLE IF EXISTS `coupons_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupons_new` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(50) DEFAULT NULL,
  `description` varchar(100) DEFAULT NULL,
  `type` enum('trial','instant','extend','cashback','instant-trial') DEFAULT 'instant',
  `coupon_code` varchar(50) DEFAULT NULL,
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `value_type` enum('amount','percent','days','flat') DEFAULT 'amount',
  `value` int(11) DEFAULT NULL,
  `is_show` int(2) NOT NULL DEFAULT '0',
  `Is_active` int(2) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) DEFAULT NULL,
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `limit_per_student` int(11) DEFAULT '1',
  `claim_limit` int(11) DEFAULT NULL,
  `max_limit` int(11) DEFAULT NULL,
  `trial_coupon_assortment` int(11) DEFAULT NULL,
  `ignore_min_limit` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupon_code_UNIQUE` (`coupon_code`),
  KEY `coupon_idx` (`coupon_code`,`start_date`,`end_date`,`min_version_code`,`max_version_code`,`Is_active`),
  KEY `created_by_idx` (`created_by`),
  KEY `is_show_idx` (`is_show`)
) ENGINE=InnoDB AUTO_INCREMENT=22513930 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_ads`
--

DROP TABLE IF EXISTS `course_ads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_ads` (
  `ad_id` int(11) NOT NULL AUTO_INCREMENT,
  `assorment_id` int(11) DEFAULT NULL,
  `target_page` varchar(200) DEFAULT NULL,
  `cta` varchar(500) DEFAULT NULL,
  `button_cta` varchar(200) DEFAULT NULL,
  `target_group_id` int(11) DEFAULT NULL,
  `target_student_package` int(11) DEFAULT NULL,
  `target_video_subject` enum('BIOLOGY','CHEMISTRY','ENGLISH','PHYSICS','SOCIAL SCIENCE','SCIENCE','MATHS','DEFAULT') DEFAULT NULL,
  `target_class` int(11) DEFAULT NULL,
  `ad_limit` int(11) DEFAULT NULL,
  `skip_enable_at` int(11) DEFAULT NULL,
  `ad_qId` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `ads_endtime` timestamp NULL DEFAULT NULL,
  `is_new_ad` tinyint(4) DEFAULT NULL,
  `ad_position` varchar(100) DEFAULT NULL,
  `flag_id` int(10) DEFAULT NULL,
  `cta_flag` int(10) DEFAULT NULL,
  `ad_type` varchar(100) DEFAULT NULL,
  `ad_description` varchar(100) DEFAULT NULL,
  `show_new_user` int(11) NOT NULL DEFAULT '0',
  `max_ad_limit` int(11) NOT NULL DEFAULT '10',
  `priority` int(11) NOT NULL DEFAULT '0',
  `banner_id` varchar(50) DEFAULT NULL,
  `is_banner_active` int(11) DEFAULT '0',
  `show_paid_users` int(11) DEFAULT '1',
  `offer_banner_is_active` int(11) NOT NULL DEFAULT '0',
  `offer_start_time` timestamp NULL DEFAULT NULL,
  `offer_end_time` timestamp NULL DEFAULT NULL,
  `offer_banner` varchar(255) DEFAULT NULL,
  `offer_banner_deeplink` varchar(200) DEFAULT NULL,
  `studentid_package_mapping` int(11) DEFAULT NULL,
  `time_period` int(11) DEFAULT NULL,
  PRIMARY KEY (`ad_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1443 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_ads_LF`
--

DROP TABLE IF EXISTS `course_ads_LF`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_ads_LF` (
  `ad_id` int(11) NOT NULL AUTO_INCREMENT,
  `assorment_id` int(11) DEFAULT NULL,
  `target_page` varchar(200) DEFAULT NULL,
  `cta` varchar(500) DEFAULT NULL,
  `button_cta` varchar(200) DEFAULT NULL,
  `target_group_id` int(11) DEFAULT NULL,
  `target_video_subject` enum('BIOLOGY','CHEMISTRY','ENGLISH','PHYSICS','SOCIAL SCIENCE','SCIENCE','MATHS') DEFAULT NULL,
  `target_class` int(11) DEFAULT NULL,
  `ad_limit` int(11) DEFAULT NULL,
  `skip_enable_at` int(11) DEFAULT NULL,
  `ad_qId` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `ad_position` varchar(100) DEFAULT NULL,
  `ad_type` varchar(100) DEFAULT NULL,
  `ad_description` varchar(100) DEFAULT NULL,
  `max_ad_limit` int(11) NOT NULL DEFAULT '1',
  `priority` int(11) NOT NULL DEFAULT '0',
  `banner_id` varchar(50) DEFAULT NULL,
  `is_banner_active` int(11) DEFAULT '0',
  `show_paid_users` int(11) DEFAULT '1',
  `offer_banner_is_active` int(11) NOT NULL DEFAULT '0',
  `offer_end_time` datetime DEFAULT NULL,
  `offer_banner` varchar(255) DEFAULT NULL,
  `offer_banner_deeplink` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`ad_id`)
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_ads_engagetime_stats`
--

DROP TABLE IF EXISTS `course_ads_engagetime_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_ads_engagetime_stats` (
  `uuid` varchar(200) NOT NULL DEFAULT '',
  `engage_time` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`uuid`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_ads_stories`
--

DROP TABLE IF EXISTS `course_ads_stories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_ads_stories` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `ccm_id` int(11) unsigned DEFAULT NULL,
  `img_url` varchar(1000) DEFAULT NULL,
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `cta_text` varchar(100) DEFAULT NULL,
  `cta_url` varchar(100) DEFAULT NULL,
  `locale` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `position` varchar(100) DEFAULT NULL,
  `caption` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1210 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_ads_view_stats`
--

DROP TABLE IF EXISTS `course_ads_view_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_ads_view_stats` (
  `uuid` varchar(200) NOT NULL,
  `ad_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_LF` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uuid`),
  KEY `ad_id` (`ad_id`),
  KEY `student_id` (`student_id`),
  KEY `created_at` (`created_at`),
  KEY `is_LF` (`is_LF`),
  KEY `idx_student_id_is_LF` (`student_id`,`is_LF`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_assortment_batch_mapping`
--

DROP TABLE IF EXISTS `course_assortment_batch_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_assortment_batch_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) DEFAULT NULL,
  `batch_id` int(11) DEFAULT NULL,
  `target_group` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `batch_start_date` timestamp NULL DEFAULT NULL,
  `batch_end_date` timestamp NULL DEFAULT NULL,
  `demo_video_qid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assortment_id` (`assortment_id`,`batch_id`),
  KEY `course_assortment_batch_mapping_assortment_id_IDX` (`assortment_id`,`is_active`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2543 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_batch_old_data_mapping`
--

DROP TABLE IF EXISTS `course_batch_old_data_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_batch_old_data_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `old_detail_id` int(11) NOT NULL,
  `primary_assortment_id` int(11) NOT NULL,
  `new_live_at` timestamp NOT NULL,
  `is_processed` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `old_detail_id` (`old_detail_id`),
  KEY `primary_assortment_id` (`primary_assortment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5715 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_browse_history`
--

DROP TABLE IF EXISTS `course_browse_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_browse_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(150) NOT NULL,
  `class` varchar(50) NOT NULL,
  `course` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=10542363 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_calling_card_callback_logs`
--

DROP TABLE IF EXISTS `course_calling_card_callback_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_calling_card_callback_logs` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `assortment_id` int(11) DEFAULT NULL,
  `callback_request_date` date DEFAULT NULL,
  `active_subscription_id` int(11) DEFAULT NULL,
  `requested_package_id` int(11) DEFAULT NULL,
  `request_type` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id_2` (`student_id`,`callback_request_date`,`assortment_id`,`request_type`)
) ENGINE=InnoDB AUTO_INCREMENT=262061 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_carousel`
--

DROP TABLE IF EXISTS `course_carousel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_carousel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `carousel_type` varchar(100) DEFAULT NULL,
  `data_type` varchar(100) DEFAULT NULL,
  `view_type` varchar(100) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `carousel_order` int(11) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `class` varchar(100) DEFAULT NULL,
  `locale` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `ccm_id` int(11) DEFAULT NULL,
  `filters` text,
  `assortment_list` text,
  `query_to_use` mediumtext,
  `resource_types` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `show_see_more` varchar(1024) DEFAULT NULL,
  `is_vip` varchar(1024) DEFAULT NULL,
  `subject_filter` varchar(1024) DEFAULT NULL,
  `description` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_carousel_min_version_code_IDX` (`min_version_code`) USING BTREE,
  KEY `course_carousel_max_version_code_IDX` (`max_version_code`) USING BTREE,
  KEY `course_carousel_is_active_IDX` (`is_active`) USING BTREE,
  KEY `course_carousel_category_IDX` (`category`) USING BTREE,
  KEY `image_url` (`image_url`)
) ENGINE=InnoDB AUTO_INCREMENT=1454 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_carousel_bk1`
--

DROP TABLE IF EXISTS `course_carousel_bk1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_carousel_bk1` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `carousel_type` varchar(100) DEFAULT NULL,
  `data_type` varchar(100) DEFAULT NULL,
  `view_type` varchar(100) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `carousel_order` int(11) DEFAULT NULL,
  `image_url` varchar(100) DEFAULT NULL,
  `class` varchar(100) DEFAULT NULL,
  `locale` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `ccm_id` int(11) DEFAULT NULL,
  `filters` text,
  `assortment_list` text,
  `query_to_use` mediumtext,
  `resource_types` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=358 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_carousel_v1`
--

DROP TABLE IF EXISTS `course_carousel_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_carousel_v1` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `carousel_type` varchar(100) DEFAULT NULL,
  `data_type` varchar(100) DEFAULT NULL,
  `view_type` varchar(100) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `carousel_order` int(11) DEFAULT NULL,
  `image_url` varchar(100) DEFAULT NULL,
  `class` varchar(100) DEFAULT NULL,
  `locale` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `ccm_id` int(11) DEFAULT NULL,
  `filters` text,
  `assortment_list` text,
  `query_to_use` mediumtext,
  `resource_types` varchar(100) DEFAULT NULL,
  `category` varchar(1024) DEFAULT NULL,
  `show_see_more` varchar(1024) DEFAULT NULL,
  `is_vip` varchar(1024) DEFAULT NULL,
  `subject_filter` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=598 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_categories`
--

DROP TABLE IF EXISTS `course_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(100) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `master_filter` varchar(100) DEFAULT NULL,
  `child_filter` varchar(100) DEFAULT NULL,
  `child_filter_id` varchar(100) DEFAULT NULL,
  `is_default` tinyint(4) DEFAULT NULL,
  `assortment_id` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `locale` varchar(10) DEFAULT 'en',
  PRIMARY KEY (`id`),
  KEY `category` (`category`),
  KEY `class` (`class`),
  KEY `is_active` (`is_active`),
  KEY `locale` (`locale`)
) ENGINE=InnoDB AUTO_INCREMENT=401 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_demo_videos`
--

DROP TABLE IF EXISTS `course_demo_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_demo_videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `subject_ass_id` int(11) NOT NULL,
  `subject_name` varchar(255) DEFAULT NULL,
  `chapter_ass_id` int(11) NOT NULL,
  `chapter_name` varchar(255) DEFAULT NULL,
  `video_ass_id` int(11) NOT NULL,
  `video_name` varchar(255) DEFAULT NULL,
  `video_ass_type` varchar(255) DEFAULT NULL,
  `resource_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `resource_type` varchar(255) DEFAULT NULL,
  `video_topic` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `assortment_id` (`assortment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2721 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_detail_page_cards`
--

DROP TABLE IF EXISTS `course_detail_page_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_detail_page_cards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) DEFAULT NULL,
  `image_url` varchar(300) DEFAULT NULL,
  `deeplink` varchar(500) DEFAULT NULL,
  `locale` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `card_order` int(11) DEFAULT NULL,
  `card_id` varchar(100) DEFAULT NULL,
  `grey_image_url` varchar(300) DEFAULT NULL,
  `subject_page` tinyint(4) DEFAULT NULL,
  `link_text` varchar(100) DEFAULT NULL,
  `assortment_level` varchar(100) DEFAULT NULL,
  `sub_level` varchar(50) DEFAULT NULL,
  `title_color` varchar(100) DEFAULT NULL,
  `title_size` int(11) DEFAULT NULL,
  `query_to_use` text,
  `assortment_list` text,
  `page_type` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_details`
--

DROP TABLE IF EXISTS `course_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_details` (
  `assortment_id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) DEFAULT NULL,
  `class` int(11) NOT NULL,
  `ccm_id` tinyint(4) DEFAULT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `display_description` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `display_image_rectangle` varchar(255) DEFAULT NULL,
  `display_image_square` varchar(255) DEFAULT NULL,
  `deeplink` varchar(255) DEFAULT NULL,
  `max_retail_price` float NOT NULL,
  `final_price` float NOT NULL,
  `meta_info` varchar(255) DEFAULT NULL,
  `max_limit` float NOT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `check_okay` tinyint(4) DEFAULT NULL,
  `start_date` timestamp NOT NULL,
  `end_date` timestamp NOT NULL,
  `expiry_date` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(255) DEFAULT NULL,
  `priority` tinyint(4) DEFAULT NULL,
  `dn_spotlight` tinyint(4) DEFAULT NULL,
  `promo_applicable` tinyint(4) DEFAULT NULL,
  `minimum_selling_price` float NOT NULL,
  `parent` int(11) DEFAULT NULL,
  `is_free` tinyint(4) DEFAULT '0',
  `assortment_type` varchar(50) DEFAULT NULL,
  `display_icon_image` varchar(200) DEFAULT NULL,
  `faculty_avatars` varchar(2000) DEFAULT NULL,
  `demo_video_thumbnail` varchar(500) DEFAULT NULL,
  `demo_video_qid` varchar(100) DEFAULT NULL,
  `rating` varchar(10) DEFAULT NULL,
  `subtitle` varchar(200) DEFAULT NULL,
  `sub_assortment_type` varchar(50) DEFAULT NULL,
  `year_exam` int(11) DEFAULT NULL,
  `category_type` varchar(50) DEFAULT NULL,
  `is_active_sales` int(11) DEFAULT '0',
  `show_on_app` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`assortment_id`,`class`),
  KEY `course_details_class_IDX` (`class`) USING BTREE,
  KEY `course_details_is_active_IDX` (`is_active`) USING BTREE,
  KEY `course_details_category_IDX` (`category`) USING BTREE,
  KEY `display_name` (`display_name`),
  KEY `sub_assortment_type` (`sub_assortment_type`),
  KEY `year_exam` (`year_exam`),
  KEY `category_type` (`category_type`),
  KEY `meta_info` (`meta_info`),
  KEY `parent` (`parent`),
  KEY `is_free` (`is_free`),
  KEY `is_active_sales` (`is_active_sales`),
  KEY `assortment_type` (`assortment_type`),
  KEY `priority` (`priority`),
  KEY `idx_combo` (`class`,`assortment_type`,`is_free`),
  KEY `end_date` (`end_date`),
  KEY `meta_info_2` (`meta_info`,`end_date`,`category_type`)
) ENGINE=InnoDB AUTO_INCREMENT=587959 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_details_banners`
--

DROP TABLE IF EXISTS `course_details_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_details_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) DEFAULT NULL,
  `locale` varchar(2) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `pdf_url` varchar(255) DEFAULT NULL,
  `action_data` varchar(255) DEFAULT NULL,
  `banner_order` int(11) DEFAULT NULL,
  `is_active` tinyint(2) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `prepurchase_pdf_url` varchar(255) DEFAULT NULL,
  `prepurchase_action_data` varchar(255) DEFAULT NULL,
  `batch_id` int(11) NOT NULL DEFAULT '1',
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `description` varchar(200) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `target_group_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cdb_assortment_id_idx` (`assortment_id`),
  KEY `cdb_banner_order_idx` (`banner_order`),
  KEY `cdb_is_active_idx` (`is_active`),
  KEY `course_details_banners_end_date_IDX` (`end_date`,`start_date`,`type`) USING BTREE,
  KEY `course_details_banners_batch_id_IDX` (`batch_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7873 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_details_bk1`
--

DROP TABLE IF EXISTS `course_details_bk1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_details_bk1` (
  `assortment_id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) DEFAULT NULL,
  `class` int(11) NOT NULL,
  `ccm_id` varchar(255) DEFAULT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `display_description` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `display_image_rectangle` varchar(255) DEFAULT NULL,
  `display_image_square` varchar(255) DEFAULT NULL,
  `deeplink` varchar(255) DEFAULT NULL,
  `max_retail_price` float NOT NULL,
  `final_price` float NOT NULL,
  `meta_info` varchar(255) DEFAULT NULL,
  `max_limit` float NOT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `check_okay` tinyint(4) DEFAULT NULL,
  `start_date` timestamp NOT NULL,
  `end_date` timestamp NOT NULL,
  `expiry_date` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(255) DEFAULT NULL,
  `priority` tinyint(4) DEFAULT NULL,
  `dn_spotlight` tinyint(4) DEFAULT NULL,
  `promo_applicable` tinyint(4) DEFAULT NULL,
  `minimum_selling_price` float NOT NULL,
  `parent` int(11) DEFAULT NULL,
  `is_free` tinyint(4) DEFAULT '0',
  `assortment_type` varchar(50) DEFAULT NULL,
  `display_icon_image` varchar(200) DEFAULT NULL,
  `faculty_avatars` varchar(2000) DEFAULT NULL,
  KEY `asortment_id` (`assortment_id`),
  KEY `assortmen_type` (`assortment_type`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=101381 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_details_class`
--

DROP TABLE IF EXISTS `course_details_class`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_details_class` (
  `assortment_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  PRIMARY KEY (`assortment_id`,`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_details_distinct`
--

DROP TABLE IF EXISTS `course_details_distinct`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_details_distinct` (
  `assortment_id` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `class` int(11) NOT NULL,
  `ccm_id` varchar(255) DEFAULT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `display_description` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `display_image_rectangle` varchar(255) DEFAULT NULL,
  `display_image_square` varchar(255) DEFAULT NULL,
  `deeplink` varchar(255) DEFAULT NULL,
  `max_retail_price` float NOT NULL,
  `final_price` float NOT NULL,
  `meta_info` varchar(255) DEFAULT NULL,
  `max_limit` float NOT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `check_okay` tinyint(4) DEFAULT NULL,
  `start_date` timestamp NOT NULL,
  `end_date` timestamp NOT NULL,
  `expiry_date` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `priority` tinyint(4) DEFAULT NULL,
  `dn_spotlight` tinyint(4) DEFAULT NULL,
  `promo_applicable` tinyint(4) DEFAULT NULL,
  `minimum_selling_price` float NOT NULL,
  `parent` int(11) DEFAULT NULL,
  `is_free` int(11) DEFAULT NULL,
  `assortment_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_details_info_deeplinks`
--

DROP TABLE IF EXISTS `course_details_info_deeplinks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_details_info_deeplinks` (
  `assortment_id` int(11) NOT NULL,
  `dl_notes` varchar(50) NOT NULL,
  `dl_recent` varchar(50) NOT NULL,
  `dl_hw` varchar(50) NOT NULL,
  `dl_pyp` varchar(50) NOT NULL,
  `dl_books` varchar(50) NOT NULL,
  `dl_tests` varchar(50) NOT NULL,
  `dl_upcoming` varchar(50) NOT NULL,
  `dl_ncert` varchar(50) NOT NULL,
  PRIMARY KEY (`assortment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_details_liveclass_course_mapping`
--

DROP TABLE IF EXISTS `course_details_liveclass_course_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_details_liveclass_course_mapping` (
  `assortment_id` int(11) NOT NULL,
  `liveclass_course_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL DEFAULT '1',
  `is_free` int(11) NOT NULL DEFAULT '1',
  `board` varchar(20) DEFAULT NULL,
  `exam` varchar(50) DEFAULT NULL,
  `locale` varchar(30) DEFAULT NULL,
  `course_type` enum('LIVE_CLASS','VMC_VOD','VMC_DAILY','VMC_COMBO','VOD_ETOOS') NOT NULL DEFAULT 'LIVE_CLASS',
  `class_type` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`assortment_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `class_type` (`class_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_details_locale`
--

DROP TABLE IF EXISTS `course_details_locale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_details_locale` (
  `assortment_id` int(11) NOT NULL DEFAULT '0',
  `meta_info` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`assortment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_details_thumbnails`
--

DROP TABLE IF EXISTS `course_details_thumbnails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_details_thumbnails` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `type` varchar(25) DEFAULT NULL,
  `image_url` varchar(150) DEFAULT NULL,
  `priority` int(11) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=377 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_display_ordering_mapping`
--

DROP TABLE IF EXISTS `course_display_ordering_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_display_ordering_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_name` varchar(255) NOT NULL,
  `hindi_name` varchar(255) NOT NULL,
  `hindi_meta` varchar(500) NOT NULL,
  `english_order` int(11) NOT NULL,
  `hindi_order` int(11) NOT NULL,
  `bengali_order` int(11) NOT NULL,
  `marathi_order` int(11) NOT NULL,
  `gujarati_order` int(11) NOT NULL,
  `tamil_order` int(11) NOT NULL,
  `telugu_order` int(11) NOT NULL,
  `kannada_order` int(11) NOT NULL,
  `nepali_order` int(11) NOT NULL,
  `punjabi_order` int(11) NOT NULL,
  `malayalam_order` int(11) NOT NULL,
  `urdu_order` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_dn_creds`
--

DROP TABLE IF EXISTS `course_dn_creds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_dn_creds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dimension_id` int(11) NOT NULL,
  `dimension` varchar(200) NOT NULL,
  `summary_remark` varchar(5000) NOT NULL,
  `summary_url` varchar(500) DEFAULT NULL,
  `summary_images` varchar(1000) DEFAULT NULL,
  `summary_question_id` int(11) DEFAULT NULL,
  `summary_qid_deeplink` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_dn_special`
--

DROP TABLE IF EXISTS `course_dn_special`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_dn_special` (
  `id` int(11) NOT NULL,
  `assortment_id` int(11) NOT NULL,
  `dimension` varchar(500) NOT NULL,
  `summary_remark` varchar(10000) NOT NULL,
  PRIMARY KEY (`id`,`assortment_id`),
  KEY `id` (`id`,`assortment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_dn_usp`
--

DROP TABLE IF EXISTS `course_dn_usp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_dn_usp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dimension` varchar(1000) NOT NULL,
  `summary_remark` varchar(5000) NOT NULL,
  `summary_question_id` int(11) DEFAULT NULL,
  `summary_qid_deeplink` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dimension` (`dimension`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_dn_vs_competition`
--

DROP TABLE IF EXISTS `course_dn_vs_competition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_dn_vs_competition` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comp_id` int(11) NOT NULL,
  `comp_name` varchar(200) NOT NULL,
  `comparison_dimension` varchar(200) NOT NULL,
  `dn_score` int(11) NOT NULL,
  `comp_score` int(11) NOT NULL,
  `summary_remarks` varchar(5000) NOT NULL,
  `summary_question_id` int(11) DEFAULT NULL,
  `summary_qid_deeplink` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `comp_id` (`comp_id`),
  KEY `comparison_dimension` (`comparison_dimension`),
  KEY `comp_name` (`comp_name`),
  KEY `summary_question_id` (`summary_question_id`),
  KEY `summary_qid_deeplink` (`summary_qid_deeplink`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_enrollments`
--

DROP TABLE IF EXISTS `course_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_enrollments` (
  `course_enrollment_id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` varchar(255) NOT NULL,
  `student_id` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`course_enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_hindi_english_mapping`
--

DROP TABLE IF EXISTS `course_hindi_english_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_hindi_english_mapping` (
  `english_assortment_id` int(11) NOT NULL,
  `english_name` varchar(255) DEFAULT NULL,
  `hindi_assortment_id` int(11) NOT NULL,
  `hindi_name` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `category_type` varchar(255) DEFAULT NULL,
  `assortment_type` varchar(255) DEFAULT NULL,
  `course_type` varchar(255) DEFAULT NULL,
  `class_type` varchar(255) DEFAULT NULL,
  KEY `english_assortment_id` (`english_assortment_id`),
  KEY `hindi_assortment_id` (`hindi_assortment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_inclusions`
--

DROP TABLE IF EXISTS `course_inclusions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_inclusions` (
  `assortment_id` int(11) NOT NULL,
  `inclusions` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_instructor_mapper`
--

DROP TABLE IF EXISTS `course_instructor_mapper`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_instructor_mapper` (
  `course_instructor_mapper_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` varchar(255) NOT NULL,
  `instructor_id` varchar(255) NOT NULL,
  `course_fee` float NOT NULL,
  PRIMARY KEY (`course_instructor_mapper_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_payment_tutorial`
--

DROP TABLE IF EXISTS `course_payment_tutorial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_payment_tutorial` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `payment_mode` varchar(100) NOT NULL,
  `video_link` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `payment_mode` (`payment_mode`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_pre_purchase_highlights`
--

DROP TABLE IF EXISTS `course_pre_purchase_highlights`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_pre_purchase_highlights` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) DEFAULT NULL,
  `priority` int(11) DEFAULT NULL,
  `locale` varchar(20) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `subtitle` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` int(1) DEFAULT '1',
  `image_url` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_pre_purchase_highlights_assortment_id_IDX` (`assortment_id`,`locale`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7493 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_primary_assortment_mapping`
--

DROP TABLE IF EXISTS `course_primary_assortment_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_primary_assortment_mapping` (
  `assortment_id` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `primary_assortment_id` int(11) NOT NULL,
  PRIMARY KEY (`assortment_id`,`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_promo_images`
--

DROP TABLE IF EXISTS `course_promo_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_promo_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `assortment_type` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `poll_id` int(11) NOT NULL,
  `startdate` timestamp NOT NULL,
  `enddate` timestamp NOT NULL,
  `order` int(11) NOT NULL,
  `is_active` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_repo`
--

DROP TABLE IF EXISTS `course_repo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_repo` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `img_url` varchar(255) DEFAULT NULL,
  `ui_type` varchar(55) NOT NULL,
  `meta1` int(55) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_resource_mapping`
--

DROP TABLE IF EXISTS `course_resource_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_resource_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `course_resource_id` int(11) NOT NULL,
  `resource_type` char(10) NOT NULL,
  `name` varchar(3000) DEFAULT NULL,
  `schedule_type` varchar(50) NOT NULL,
  `live_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_trial` int(11) DEFAULT NULL,
  `is_replay` int(11) DEFAULT NULL,
  `old_resource_id` int(11) NOT NULL,
  `resource_name` varchar(1000) DEFAULT NULL,
  `batch_id` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `course_resource_mapping_assortment_id_IDX` (`assortment_id`) USING BTREE,
  KEY `course_resource_mapping_course_resource_id_IDX` (`course_resource_id`) USING BTREE,
  KEY `course_resource_mapping_resource_type_IDX` (`resource_type`) USING BTREE,
  KEY `course_resource_mapping_schedule_type_IDX` (`schedule_type`) USING BTREE,
  KEY `course_resource_mapping_live_at_IDX` (`live_at`) USING BTREE,
  KEY `course_resource_mapping_is_replay_IDX` (`is_replay`) USING BTREE,
  KEY `batch_id` (`batch_id`),
  KEY `idx_aid_live_r_type` (`assortment_id`,`live_at`,`resource_type`)
) ENGINE=InnoDB AUTO_INCREMENT=2413576 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_resource_mapping_bk1`
--

DROP TABLE IF EXISTS `course_resource_mapping_bk1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_resource_mapping_bk1` (
  `id` int(11) NOT NULL,
  `assortment_id` int(11) NOT NULL,
  `course_resource_id` int(11) NOT NULL,
  `resource_type` char(10) NOT NULL,
  `name` varchar(3000) DEFAULT NULL,
  `schedule_type` varchar(50) NOT NULL,
  `live_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_trial` int(4) DEFAULT NULL,
  `is_replay` int(11) DEFAULT NULL,
  `old_resource_id` int(11) NOT NULL,
  `resource_name` varchar(1000) DEFAULT NULL,
  KEY `resource_type` (`resource_type`,`schedule_type`),
  KEY `old_resource_id` (`old_resource_id`),
  KEY `course_resource_id` (`course_resource_id`),
  KEY `live_at` (`live_at`),
  KEY `is_replay` (`is_replay`),
  KEY `schedule_type` (`schedule_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_resource_paid`
--

DROP TABLE IF EXISTS `course_resource_paid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_resource_paid` (
  `assortment_id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `class` int(11) DEFAULT NULL,
  `resource_type` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_resources`
--

DROP TABLE IF EXISTS `course_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resource_reference` varchar(255) DEFAULT NULL,
  `resource_type` tinyint(4) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `topic` varchar(255) NOT NULL,
  `expert_name` varchar(150) DEFAULT NULL,
  `expert_image` varchar(255) DEFAULT NULL,
  `q_order` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `player_type` varchar(255) NOT NULL,
  `meta_info` varchar(255) DEFAULT NULL,
  `tags` varchar(1000) DEFAULT NULL,
  `name` varchar(500) DEFAULT NULL,
  `display` varchar(500) DEFAULT NULL,
  `description` mediumtext,
  `chapter` varchar(200) DEFAULT NULL,
  `chapter_order` varchar(11) DEFAULT NULL,
  `exam` varchar(100) DEFAULT NULL,
  `board` varchar(100) DEFAULT NULL,
  `ccm_id` int(11) DEFAULT NULL,
  `book` varchar(100) DEFAULT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `stream_start_time` datetime DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `locale` varchar(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `old_resource_id` int(11) DEFAULT NULL,
  `stream_end_time` datetime DEFAULT NULL,
  `stream_push_url` varchar(255) DEFAULT NULL,
  `stream_vod_url` varchar(255) DEFAULT NULL,
  `stream_status` enum('ACTIVE','INACTIVE') DEFAULT NULL,
  `old_detail_id` int(11) DEFAULT NULL,
  `lecture_type` varchar(50) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `old_resource_id` (`old_resource_id`,`old_detail_id`),
  KEY `resource_reference` (`resource_reference`),
  KEY `resource_type` (`resource_type`),
  KEY `stream_status` (`stream_status`),
  KEY `course_resources_subject_IDX` (`subject`) USING BTREE,
  KEY `course_resources_topic_IDX` (`topic`) USING BTREE,
  KEY `course_resources_chapter_IDX` (`chapter`) USING BTREE,
  KEY `course_resources_stream_start_time_IDX` (`stream_start_time`) USING BTREE,
  KEY `course_resources_faculty_id_IDX` (`faculty_id`) USING BTREE,
  KEY `course_resources_class_IDX` (`class`) USING BTREE,
  KEY `locale` (`locale`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=441029 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_resources_bk1`
--

DROP TABLE IF EXISTS `course_resources_bk1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_resources_bk1` (
  `id` int(11) NOT NULL,
  `resource_reference` varchar(200) DEFAULT NULL,
  `resource_type` tinyint(4) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `topic` varchar(255) NOT NULL,
  `expert_name` varchar(50) DEFAULT NULL,
  `expert_image` varchar(100) DEFAULT NULL,
  `q_order` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `player_type` varchar(255) NOT NULL,
  `meta_info` varchar(255) DEFAULT NULL,
  `tags` varchar(1000) DEFAULT NULL,
  `name` varchar(500) DEFAULT NULL,
  `display` varchar(500) DEFAULT NULL,
  `description` mediumtext,
  `chapter` varchar(200) DEFAULT NULL,
  `chapter_order` varchar(11) DEFAULT NULL,
  `exam` varchar(100) DEFAULT NULL,
  `board` varchar(100) DEFAULT NULL,
  `ccm_id` int(11) DEFAULT NULL,
  `book` varchar(100) DEFAULT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `stream_start_time` datetime DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `locale` varchar(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(50) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `old_resource_id` int(11) DEFAULT NULL,
  `stream_end_time` datetime DEFAULT NULL,
  `stream_push_url` varchar(255) DEFAULT NULL,
  `stream_vod_url` varchar(255) DEFAULT NULL,
  `stream_status` enum('ACTIVE','INACTIVE') DEFAULT NULL,
  `old_detail_id` int(11) DEFAULT NULL,
  KEY `old_resource_id` (`old_resource_id`,`old_detail_id`),
  KEY `resource_reference` (`resource_reference`),
  KEY `resource_type` (`resource_type`),
  KEY `stream_status` (`stream_status`),
  KEY `subject` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_reviews`
--

DROP TABLE IF EXISTS `course_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_reviews` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) DEFAULT NULL,
  `review_id` int(11) DEFAULT NULL,
  `review_type` varchar(100) DEFAULT NULL,
  `review_meta` varchar(100) DEFAULT NULL,
  `review_class` int(11) DEFAULT NULL,
  `super_category` varchar(100) DEFAULT NULL,
  `review_order` int(11) DEFAULT NULL,
  `student_name` varchar(100) DEFAULT NULL,
  `student_rating` int(11) DEFAULT NULL,
  `review_text` varchar(500) DEFAULT NULL,
  `student_image` varchar(200) DEFAULT NULL,
  `review_qid` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `review_qid_deeplink` varchar(200) DEFAULT NULL,
  `topper` int(11) DEFAULT NULL,
  `topper_text` text,
  `category` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_reviews_super_category_IDX` (`super_category`,`review_class`) USING BTREE,
  KEY `course_reviews_assortment_id_IDX` (`assortment_id`) USING BTREE,
  KEY `course_reviews_review_meta_IDX` (`review_meta`) USING BTREE,
  KEY `course_reviews_is_active_IDX` (`is_active`) USING BTREE,
  KEY `course_reviews_category_IDX` (`category`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=229 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_sample_pdf`
--

DROP TABLE IF EXISTS `course_sample_pdf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_sample_pdf` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `meta_info` varchar(50) NOT NULL,
  `course_resource_id` int(11) NOT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `resource_reference` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resource_type` int(11) NOT NULL DEFAULT '2',
  PRIMARY KEY (`id`),
  KEY `assortment_id` (`assortment_id`),
  KEY `resource_type` (`resource_type`)
) ENGINE=InnoDB AUTO_INCREMENT=2425 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_schedule`
--

DROP TABLE IF EXISTS `course_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_schedule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liveclass_course_id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `class` int(11) NOT NULL,
  `live_at` datetime NOT NULL,
  `is_free` tinyint(4) NOT NULL,
  `course_type` varchar(255) NOT NULL,
  `faculty_id` int(11) NOT NULL,
  `master_chapter` varchar(2000) NOT NULL,
  `description` varchar(2000) NOT NULL,
  `is_delete` tinyint(4) NOT NULL DEFAULT '0',
  `is_processed` tinyint(4) NOT NULL DEFAULT '0',
  `resource_created` tinyint(4) NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `course_detail_id` int(11) DEFAULT NULL,
  `is_multi` tinyint(4) NOT NULL DEFAULT '0',
  `shared_course_ids` varchar(255) NOT NULL DEFAULT '',
  `lecture_id` varchar(45) DEFAULT NULL,
  `lecture_type` varchar(50) DEFAULT NULL,
  `batch_id` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59165 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_study_groups`
--

DROP TABLE IF EXISTS `course_study_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_study_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `batch_id` int(11) DEFAULT NULL,
  `study_group_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `teacher_list` text,
  `img_url` varchar(500) DEFAULT NULL,
  `study_group_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_csg` (`assortment_id`,`batch_id`),
  KEY `idx_psg` (`assortment_id`,`batch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=556 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_subject_mapping`
--

DROP TABLE IF EXISTS `course_subject_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_subject_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `subject` varchar(45) DEFAULT NULL,
  `subject_name_localised` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assortment_id_2` (`assortment_id`,`subject`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4959 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_subtopics`
--

DROP TABLE IF EXISTS `course_subtopics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_subtopics` (
  `course_subtopic_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `course_subtopic` varchar(255) NOT NULL,
  PRIMARY KEY (`course_subtopic_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_syllabus_mapping`
--

DROP TABLE IF EXISTS `course_syllabus_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_syllabus_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `year_exam` varchar(10) DEFAULT NULL,
  `meta_info` varchar(100) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `book` varchar(100) DEFAULT NULL,
  `chapter_order` int(11) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `course_type` varchar(20) DEFAULT NULL,
  `class_type` varchar(20) DEFAULT NULL,
  `current_status` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `subject_display` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `book` (`book`),
  KEY `assortment_id` (`assortment_id`),
  KEY `subject_display` (`subject_display`)
) ENGINE=InnoDB AUTO_INCREMENT=50517 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_tags`
--

DROP TABLE IF EXISTS `course_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_tags` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `target_group` int(11) DEFAULT NULL,
  `course_tag` varchar(255) NOT NULL DEFAULT '',
  `priority` int(11) NOT NULL,
  `is_active` int(1) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assortment_id` (`assortment_id`),
  KEY `target_group` (`target_group`),
  KEY `priority` (`priority`),
  KEY `is_active` (`is_active`),
  KEY `type` (`type`),
  KEY `start_date` (`start_date`),
  KEY `end_date` (`end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=16394 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_teacher_mapping`
--

DROP TABLE IF EXISTS `course_teacher_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_teacher_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `subject` varchar(45) DEFAULT NULL,
  `subject_name_localised` varchar(45) DEFAULT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `faculty_name` varchar(45) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `degree` varchar(45) DEFAULT NULL,
  `college` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `rating` float DEFAULT NULL,
  `experience_in_hours` int(11) DEFAULT NULL,
  `students_mentored` int(11) DEFAULT NULL,
  `demo_qid` int(11) DEFAULT NULL,
  `is_free` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `assortment_id` (`assortment_id`,`subject`,`faculty_id`),
  KEY `subject_name_localised` (`subject_name_localised`),
  KEY `created_at` (`created_at`),
  KEY `demo_qid` (`demo_qid`)
) ENGINE=InnoDB AUTO_INCREMENT=2847 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_testimonials`
--

DROP TABLE IF EXISTS `course_testimonials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_testimonials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `review_class` varchar(45) DEFAULT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `review_order` int(11) NOT NULL,
  `student_image` varchar(255) DEFAULT NULL,
  `review_qid` int(11) DEFAULT NULL,
  `review_qid_deeplink` varchar(255) DEFAULT NULL,
  `review_text` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `assortment_id` (`assortment_id`,`review_class`,`review_qid`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3267 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_timetable`
--

DROP TABLE IF EXISTS `course_timetable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_timetable` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(4) DEFAULT '1',
  `assortment_id` int(11) DEFAULT NULL,
  `week_of` varchar(100) DEFAULT NULL,
  `week_number` int(11) DEFAULT NULL,
  `topic_covered` varchar(100) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14369 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_tree`
--

DROP TABLE IF EXISTS `course_tree`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_tree` (
  `course_tree_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id_1` int(11) NOT NULL,
  `course_id_2` int(11) NOT NULL,
  PRIMARY KEY (`course_tree_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courses` (
  `course_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_subject` varchar(255) NOT NULL,
  `course_topic` varchar(255) NOT NULL,
  `course_grade_benchmark` varchar(255) NOT NULL,
  `course_type` varchar(255) NOT NULL,
  `num_class` int(11) NOT NULL,
  `parent_course_id` varchar(255) NOT NULL,
  `course_content_online` varchar(255) NOT NULL,
  PRIMARY KEY (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courses_new`
--

DROP TABLE IF EXISTS `courses_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courses_new` (
  `id` int(11) NOT NULL,
  `class` varchar(20) DEFAULT NULL,
  `chapter` varchar(100) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `microcencepts_query` varchar(500) DEFAULT NULL,
  `free_questions_query` varchar(500) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courses_package`
--

DROP TABLE IF EXISTS `courses_package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courses_package` (
  `id` int(11) NOT NULL,
  `no_of_courses` int(11) DEFAULT NULL,
  `class` varchar(20) DEFAULT NULL,
  `discount` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crm_sales_logging`
--

DROP TABLE IF EXISTS `crm_sales_logging`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `crm_sales_logging` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login_id` varchar(255) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `assortment_list` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_login_id` (`login_id`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=474996 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cross_questions_mappings_result`
--

DROP TABLE IF EXISTS `cross_questions_mappings_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cross_questions_mappings_result` (
  `id` int(11) NOT NULL,
  `qid_1` int(55) NOT NULL,
  `ocr_1` text,
  `qid_2` int(11) NOT NULL,
  `ocr_2` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cross_questions_mappings_results`
--

DROP TABLE IF EXISTS `cross_questions_mappings_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cross_questions_mappings_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `qid_1` int(55) NOT NULL,
  `ocr_1` text,
  `qid_2` int(11) NOT NULL,
  `ocr_2` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_qids` (`qid_1`,`qid_2`),
  KEY `qid_2` (`qid_2`)
) ENGINE=InnoDB AUTO_INCREMENT=410 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `custom_qoutes`
--

DROP TABLE IF EXISTS `custom_qoutes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `custom_qoutes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(255) NOT NULL,
  `qoute` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `custom_quotes`
--

DROP TABLE IF EXISTS `custom_quotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `custom_quotes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(255) NOT NULL,
  `action` varchar(255) DEFAULT NULL,
  `quote` text NOT NULL,
  `quote_message` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `daily_contest_design`
--

DROP TABLE IF EXISTS `daily_contest_design`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `daily_contest_design` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contest_type` varchar(100) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `description` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contest_type` (`contest_type`,`entity_type`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `daily_doubt`
--

DROP TABLE IF EXISTS `daily_doubt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `daily_doubt` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sid` int(255) NOT NULL,
  `qid_list` varchar(255) NOT NULL,
  `topic` varchar(255) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `subject` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sid` (`sid`),
  KEY `date` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=36868350 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `daily_doubt_resources`
--

DROP TABLE IF EXISTS `daily_doubt_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `daily_doubt_resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(30) NOT NULL,
  `data_list` longtext NOT NULL,
  `is_viewed` tinyint(1) NOT NULL,
  `topic_reference` int(11) NOT NULL,
  `old_complete_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `topic_reference` (`topic_reference`),
  KEY `is_viewed` (`is_viewed`),
  KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=3723451 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `daily_paytm_payment_status`
--

DROP TABLE IF EXISTS `daily_paytm_payment_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `daily_paytm_payment_status` (
  `payment_id` varchar(50) NOT NULL,
  `txn_id` int(11) DEFAULT NULL,
  `mobile` int(11) NOT NULL,
  `winning_amount` int(11) NOT NULL,
  `remarks` text NOT NULL,
  `payment_status` text NOT NULL,
  `error_code` varchar(25) NOT NULL,
  `paytm_remarks` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `daily_revision_problems`
--

DROP TABLE IF EXISTS `daily_revision_problems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `daily_revision_problems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day_num` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `class` int(11) DEFAULT NULL,
  `subject` varchar(50) DEFAULT NULL,
  `chapter` varchar(500) DEFAULT NULL,
  `exam_board` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`,`class`,`subject`,`chapter`,`day_num`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `daily_views`
--

DROP TABLE IF EXISTS `daily_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `daily_views` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(255) DEFAULT NULL,
  `cur_date` date NOT NULL,
  `view_id` int(255) DEFAULT NULL,
  `view_count` int(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`,`cur_date`),
  KEY `student_id_2` (`student_id`,`view_id`,`cur_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dashboard_users`
--

DROP TABLE IF EXISTS `dashboard_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dashboard_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(60) NOT NULL,
  `name` varchar(60) NOT NULL,
  `password` varchar(60) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `type` varchar(11) DEFAULT 'FACULTY',
  `description` text,
  `subject` varchar(50) DEFAULT NULL,
  `course` varchar(50) DEFAULT NULL,
  `experience` varchar(50) DEFAULT NULL,
  `degree` varchar(50) DEFAULT NULL,
  `college` varchar(200) DEFAULT NULL,
  `image_bg_liveclass` varchar(100) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `etoos_faculty_mapping` int(11) DEFAULT NULL,
  `gender` enum('Male','Female') DEFAULT NULL,
  `nickname` varchar(100) DEFAULT NULL,
  `name_hindi` varchar(200) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `student_id` int(11) NOT NULL DEFAULT '98',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=776 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dear_sir_raw`
--

DROP TABLE IF EXISTS `dear_sir_raw`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dear_sir_raw` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `book` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `question` mediumtext NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `question_image` varchar(255) DEFAULT NULL,
  `is_allocated` varchar(255) NOT NULL DEFAULT '0',
  `allocated_to` varchar(55) NOT NULL DEFAULT '0',
  `allocation_time` varchar(255) DEFAULT NULL,
  `is_answered` int(55) NOT NULL DEFAULT '0',
  `is_text_answered` tinyint(4) DEFAULT '0',
  `ocr_done` int(11) DEFAULT '0',
  `ocr_text` text,
  `original_ocr_text` text,
  `matched_question` int(11) DEFAULT NULL,
  `question_credit` tinyint(4) NOT NULL DEFAULT '1',
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_trial` tinyint(4) NOT NULL DEFAULT '0',
  `is_skipped` tinyint(4) NOT NULL DEFAULT '0',
  `parent_id` int(11) DEFAULT NULL,
  `incorrect_ocr` int(11) DEFAULT NULL,
  `skip_question` int(11) DEFAULT NULL,
  `locale` varchar(50) DEFAULT 'en',
  `difficulty` tinyint(4) DEFAULT NULL,
  `is_community` tinyint(1) NOT NULL DEFAULT '0',
  `matched_app_questions` tinyint(1) DEFAULT NULL,
  `wrong_image` tinyint(4) NOT NULL DEFAULT '0',
  `youtube_id` varchar(11) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `answer_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=208 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deeplink_number`
--

DROP TABLE IF EXISTS `deeplink_number`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deeplink_number` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `number` text NOT NULL,
  `source` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=146767 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `delete_tc_fix`
--

DROP TABLE IF EXISTS `delete_tc_fix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `delete_tc_fix` (
  `original_student_id` int(11) NOT NULL,
  `new_student_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deleted_student_accounts`
--

DROP TABLE IF EXISTS `deleted_student_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deleted_student_accounts` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `mobile` varchar(15) NOT NULL,
  `student_id` int(15) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `comments` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=216 DEFAULT CHARSET=utf8 COMMENT='This table is used to store the records of students who had requested to delete the account. In the students table, the phone number has been tampered and gcm_reg_id set to NULL before adding data to this table.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diagram_questions`
--

DROP TABLE IF EXISTS `diagram_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `diagram_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  `ocr_text` text,
  `subject` varchar(50) DEFAULT NULL,
  `new_ocr` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4230 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `digitized_books`
--

DROP TABLE IF EXISTS `digitized_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `digitized_books` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `subject` varchar(45) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `page_no` int(11) DEFAULT NULL,
  `snip_no` int(11) DEFAULT NULL,
  `snip_url` varchar(255) DEFAULT NULL,
  `ocr_text` text,
  `original_ocr_text` text,
  `is_active` tinyint(4) DEFAULT '1',
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1895 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `distinct_chapters`
--

DROP TABLE IF EXISTS `distinct_chapters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `distinct_chapters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chapter` varchar(255) NOT NULL,
  `class` int(11) NOT NULL,
  `subject` varchar(50) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=808 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `district_admin_form`
--

DROP TABLE IF EXISTS `district_admin_form`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `district_admin_form` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `mobile` varchar(255) NOT NULL DEFAULT '',
  `name` varchar(255) NOT NULL DEFAULT '',
  `district` varchar(255) NOT NULL DEFAULT '',
  `state` varchar(255) NOT NULL DEFAULT '',
  `student_id` int(11) NOT NULL,
  `friends_count` int(10) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=472 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_admin_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint(5) unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin__content_type_id_c4bce8eb_fk_django_content_type_id` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin__content_type_id_c4bce8eb_fk_django_content_type_id` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_de54fa62` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `djcelery_crontabschedule`
--

DROP TABLE IF EXISTS `djcelery_crontabschedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `djcelery_crontabschedule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `minute` varchar(64) NOT NULL,
  `hour` varchar(64) NOT NULL,
  `day_of_week` varchar(64) NOT NULL,
  `day_of_month` varchar(64) NOT NULL,
  `month_of_year` varchar(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `djcelery_intervalschedule`
--

DROP TABLE IF EXISTS `djcelery_intervalschedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `djcelery_intervalschedule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `every` int(11) NOT NULL,
  `period` varchar(24) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `djcelery_periodictask`
--

DROP TABLE IF EXISTS `djcelery_periodictask`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `djcelery_periodictask` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `task` varchar(200) NOT NULL,
  `args` longtext NOT NULL,
  `kwargs` longtext NOT NULL,
  `queue` varchar(200) DEFAULT NULL,
  `exchange` varchar(200) DEFAULT NULL,
  `routing_key` varchar(200) DEFAULT NULL,
  `expires` datetime(6) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL,
  `last_run_at` datetime(6) DEFAULT NULL,
  `total_run_count` int(10) unsigned NOT NULL,
  `date_changed` datetime(6) NOT NULL,
  `description` longtext NOT NULL,
  `crontab_id` int(11) DEFAULT NULL,
  `interval_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `djcelery_peri_crontab_id_75609bab_fk_djcelery_crontabschedule_id` (`crontab_id`),
  KEY `djcelery_pe_interval_id_b426ab02_fk_djcelery_intervalschedule_id` (`interval_id`),
  CONSTRAINT `djcelery_pe_interval_id_b426ab02_fk_djcelery_intervalschedule_id` FOREIGN KEY (`interval_id`) REFERENCES `djcelery_intervalschedule` (`id`),
  CONSTRAINT `djcelery_peri_crontab_id_75609bab_fk_djcelery_crontabschedule_id` FOREIGN KEY (`crontab_id`) REFERENCES `djcelery_crontabschedule` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `djcelery_periodictasks`
--

DROP TABLE IF EXISTS `djcelery_periodictasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `djcelery_periodictasks` (
  `ident` smallint(6) NOT NULL,
  `last_update` datetime(6) NOT NULL,
  PRIMARY KEY (`ident`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `djcelery_taskstate`
--

DROP TABLE IF EXISTS `djcelery_taskstate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `djcelery_taskstate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `state` varchar(64) NOT NULL,
  `task_id` varchar(36) NOT NULL,
  `name` varchar(200) DEFAULT NULL,
  `tstamp` datetime(6) NOT NULL,
  `args` longtext,
  `kwargs` longtext,
  `eta` datetime(6) DEFAULT NULL,
  `expires` datetime(6) DEFAULT NULL,
  `result` longtext,
  `traceback` longtext,
  `runtime` double DEFAULT NULL,
  `retries` int(11) NOT NULL,
  `hidden` tinyint(1) NOT NULL,
  `worker_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `task_id` (`task_id`),
  KEY `djcelery_taskstate_9ed39e2e` (`state`),
  KEY `djcelery_taskstate_b068931c` (`name`),
  KEY `djcelery_taskstate_863bb2ee` (`tstamp`),
  KEY `djcelery_taskstate_662f707d` (`hidden`),
  KEY `djcelery_taskstate_ce77e6ef` (`worker_id`),
  CONSTRAINT `djcelery_taskstate_worker_id_f7f57a05_fk_djcelery_workerstate_id` FOREIGN KEY (`worker_id`) REFERENCES `djcelery_workerstate` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `djcelery_workerstate`
--

DROP TABLE IF EXISTS `djcelery_workerstate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `djcelery_workerstate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hostname` varchar(255) NOT NULL,
  `last_heartbeat` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hostname` (`hostname`),
  KEY `djcelery_workerstate_f129901a` (`last_heartbeat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dn_bda_list`
--

DROP TABLE IF EXISTS `dn_bda_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dn_bda_list` (
  `id` varchar(50) NOT NULL,
  `bda_name` varchar(200) NOT NULL,
  `designation` varchar(200) NOT NULL,
  `email_id` varchar(300) NOT NULL,
  `mobile` varchar(10) NOT NULL,
  `is_done` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `bda_name` (`bda_name`,`designation`,`email_id`,`mobile`,`is_done`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dn_property`
--

DROP TABLE IF EXISTS `dn_property`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dn_property` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bucket` varchar(100) NOT NULL,
  `name` varchar(2000) NOT NULL,
  `value` mediumtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `priority` tinyint(1) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `offset_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dn_p_bucket_idx` (`bucket`),
  KEY `dn_p_active_idx` (`is_active`),
  KEY `dn_p_name_idx` (`name`(768))
) ENGINE=InnoDB AUTO_INCREMENT=6814 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dn_search_bank`
--

DROP TABLE IF EXISTS `dn_search_bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dn_search_bank` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  `ocr_text` mediumtext,
  `pretty_text` mediumtext,
  `english` mediumtext,
  `subject` varchar(255) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `video_language` varchar(255) DEFAULT NULL,
  `is_answered` int(11) DEFAULT NULL,
  `is_text_answered` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `package_language` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dn_tokens`
--

DROP TABLE IF EXISTS `dn_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dn_tokens` (
  `token` text NOT NULL,
  `language` enum('en','hi') DEFAULT NULL,
  `is_active` tinyint(2) NOT NULL DEFAULT '0',
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  KEY `language` (`language`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=75314 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dnrs`
--

DROP TABLE IF EXISTS `dnrs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dnrs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dnst_2021_rank_list`
--

DROP TABLE IF EXISTS `dnst_2021_rank_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dnst_2021_rank_list` (
  `test_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `eligible_score` int(11) NOT NULL DEFAULT '0',
  `total_marks` int(11) NOT NULL,
  `total_score` int(11) NOT NULL,
  `correct_ans` int(11) NOT NULL DEFAULT '0',
  `incorrect_ans` int(11) NOT NULL DEFAULT '0',
  `skipped_ans` int(11) NOT NULL DEFAULT '0',
  `time_taken` int(11) NOT NULL DEFAULT '0',
  `dnst_rank` int(11) NOT NULL DEFAULT '0',
  `mobile` varchar(10) DEFAULT NULL,
  `student_name` varchar(255) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  PRIMARY KEY (`test_id`,`student_id`),
  KEY `eligible_score` (`eligible_score`,`total_marks`,`total_score`,`correct_ans`,`incorrect_ans`,`skipped_ans`,`time_taken`,`dnst_rank`,`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `doubt_pe_charcha`
--

DROP TABLE IF EXISTS `doubt_pe_charcha`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `doubt_pe_charcha` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `is_host` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `room_id` varchar(255) NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `question_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `doubt_pe_charcha_room_id_index` (`room_id`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3659028 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `doubt_pe_charcha_feedback`
--

DROP TABLE IF EXISTS `doubt_pe_charcha_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `doubt_pe_charcha_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rating` int(11) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `student_id` int(11) NOT NULL,
  `rating_for_student` int(11) DEFAULT NULL,
  `room_id` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_room_id_student_id` (`room_id`,`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2485225 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dsat_registration_table`
--

DROP TABLE IF EXISTS `dsat_registration_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dsat_registration_table` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_name` varchar(100) NOT NULL,
  `class` varchar(100) NOT NULL,
  `target_exam` varchar(200) NOT NULL,
  `mobile_number` varchar(15) NOT NULL,
  `city` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `email_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile_number` (`mobile_number`)
) ENGINE=InnoDB AUTO_INCREMENT=4706 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `edit_ocr_feedback`
--

DROP TABLE IF EXISTS `edit_ocr_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `edit_ocr_feedback` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  `edited_ocr_text` mediumtext,
  `feedback` varchar(255) DEFAULT 'IMAGE',
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3883781 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `elastic_repo_info`
--

DROP TABLE IF EXISTS `elastic_repo_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `elastic_repo_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cluster_link` mediumtext NOT NULL,
  `repo_names` mediumtext NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `engagement`
--

DROP TABLE IF EXISTS `engagement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `engagement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(300) NOT NULL,
  `en_title` varchar(1000) CHARACTER SET utf8mb4 DEFAULT NULL,
  `en_text` text,
  `en_image` varchar(300) DEFAULT NULL,
  `en_options` varchar(500) DEFAULT NULL,
  `hi_title` varchar(1000) DEFAULT NULL,
  `hi_text` text,
  `hi_image` varchar(400) DEFAULT NULL,
  `hi_options` varchar(400) DEFAULT NULL,
  `ben_title` varchar(1000) DEFAULT NULL,
  `ben_text` text,
  `ben_image` varchar(400) DEFAULT NULL,
  `ben_options` varchar(400) DEFAULT NULL,
  `class` varchar(300) NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `start_time` time DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `end_time` varchar(300) DEFAULT NULL,
  `blog_url` varchar(300) DEFAULT NULL,
  `question_id` varchar(11) DEFAULT NULL,
  `poll_category` varchar(500) DEFAULT NULL,
  `en_correct_option` varchar(500) DEFAULT NULL,
  `data` varchar(100) DEFAULT NULL,
  `action` varchar(200) DEFAULT NULL,
  `isRenewed` tinyint(4) DEFAULT NULL,
  `aspect_ratio` varchar(45) DEFAULT '16:9',
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  KEY `start_date` (`start_date`),
  KEY `class` (`class`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=69773 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `english_hindi_chapter_mapping`
--

DROP TABLE IF EXISTS `english_hindi_chapter_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `english_hindi_chapter_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chapter_en` varchar(255) NOT NULL,
  `chapter_hi` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `chapter_en` (`chapter_en`)
) ENGINE=InnoDB AUTO_INCREMENT=862 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `english_hindi_mapping`
--

DROP TABLE IF EXISTS `english_hindi_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `english_hindi_mapping` (
  `hindi_code` varchar(200) NOT NULL,
  `english_code` varchar(200) NOT NULL,
  PRIMARY KEY (`hindi_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `english_hindi_subject_mapping`
--

DROP TABLE IF EXISTS `english_hindi_subject_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `english_hindi_subject_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_en` varchar(100) NOT NULL,
  `subject_hi` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_assortment_subject_mapping`
--

DROP TABLE IF EXISTS `etoos_assortment_subject_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_assortment_subject_mapping` (
  `assortment_id` int(11) NOT NULL,
  `category` varchar(50) NOT NULL,
  `subject` varchar(50) NOT NULL,
  `language` varchar(255) NOT NULL DEFAULT '''ENGLISH''',
  PRIMARY KEY (`assortment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_banners`
--

DROP TABLE IF EXISTS `etoos_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description` text,
  `image_url` varchar(500) NOT NULL,
  `action_activity` varchar(255) NOT NULL,
  `action_data` varchar(200) DEFAULT NULL,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `end_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `ecm_id` int(100) DEFAULT NULL,
  `banner_order` int(25) DEFAULT NULL,
  `type` varchar(50) NOT NULL DEFAULT '1x',
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_chapter`
--

DROP TABLE IF EXISTS `etoos_chapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_chapter` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ecm_id` int(11) NOT NULL,
  `subject` varchar(30) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `c_order` int(11) DEFAULT NULL,
  `top_course_order` int(255) NOT NULL,
  `popular_course_order` int(255) NOT NULL,
  `thumbnail` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `class` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ecm_id` (`ecm_id`),
  KEY `faculty_id` (`faculty_id`),
  KEY `top_course_order` (`top_course_order`),
  KEY `popular_course_order` (`popular_course_order`)
) ENGINE=InnoDB AUTO_INCREMENT=11302 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_course_caraousel`
--

DROP TABLE IF EXISTS `etoos_course_caraousel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_course_caraousel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) DEFAULT NULL,
  `locale` varchar(50) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `data_limit` int(10) DEFAULT NULL,
  `view_all` tinyint(1) DEFAULT NULL,
  `caraousel_order` int(25) DEFAULT NULL,
  `image_url` varchar(100) DEFAULT NULL,
  `meta_data` varchar(100) DEFAULT NULL,
  `meta_data2` varchar(255) DEFAULT NULL,
  `view_more_params` varchar(150) DEFAULT NULL,
  `action_data` varchar(255) DEFAULT NULL,
  `action_activity` varchar(255) DEFAULT NULL,
  `data_type` varchar(100) DEFAULT NULL,
  `ecm_id` int(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `mapped_ccm_id` int(11) DEFAULT NULL,
  `mapped_class` int(11) DEFAULT NULL,
  `show_home` tinyint(4) NOT NULL DEFAULT '0',
  `min_version_code` int(150) NOT NULL,
  `max_version_code` int(150) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `min_version_code` (`min_version_code`),
  KEY `max_version_code` (`max_version_code`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_course_mapping`
--

DROP TABLE IF EXISTS `etoos_course_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_course_mapping` (
  `id` int(11) NOT NULL,
  `display_name` varchar(20) NOT NULL,
  `course` varchar(50) NOT NULL,
  `class` int(15) DEFAULT NULL,
  `ecm_order` int(10) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL,
  `is_active` int(11) DEFAULT NULL,
  UNIQUE KEY `id` (`id`,`class`),
  KEY `ecm_order` (`ecm_order`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_dn_book_list`
--

DROP TABLE IF EXISTS `etoos_dn_book_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_dn_book_list` (
  `student_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `subject` varchar(50) NOT NULL,
  `language` varchar(50) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `exam` varchar(20) NOT NULL,
  `type` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_doubtnut_free_classes`
--

DROP TABLE IF EXISTS `etoos_doubtnut_free_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_doubtnut_free_classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(50) NOT NULL,
  `date` date DEFAULT NULL,
  `subject` varchar(50) NOT NULL,
  `question_id` int(11) NOT NULL,
  `course_resource_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ecm_id` (`assortment_id`),
  KEY `date` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=1167 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_faculty`
--

DROP TABLE IF EXISTS `etoos_faculty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_faculty` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(100) DEFAULT NULL,
  `description` longtext,
  `short_description` varchar(100) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `image_url` varchar(100) DEFAULT NULL,
  `raw_image_url` varchar(500) NOT NULL,
  `square_image_url` varchar(255) NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `mapped_faculty_id` int(10) DEFAULT NULL,
  `subject` varchar(25) DEFAULT NULL,
  `demo_qid` int(11) DEFAULT NULL,
  `ranking` int(10) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `degree_obtained` text NOT NULL,
  `college` text NOT NULL,
  `coaching` text NOT NULL,
  `years_experience` int(11) NOT NULL,
  `demo_image_url` varchar(500) NOT NULL,
  `home_image_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  KEY `subject` (`subject`),
  KEY `demo_qid` (`demo_qid`),
  KEY `ranking` (`ranking`)
) ENGINE=InnoDB AUTO_INCREMENT=773 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_faculty_class`
--

DROP TABLE IF EXISTS `etoos_faculty_class`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_faculty_class` (
  `faculty_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  PRIMARY KEY (`faculty_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_faculty_course`
--

DROP TABLE IF EXISTS `etoos_faculty_course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_faculty_course` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `faculty_id` int(50) DEFAULT NULL,
  `ecm_id` int(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `faculty_id` (`faculty_id`),
  KEY `ecm_id` (`ecm_id`)
) ENGINE=InnoDB AUTO_INCREMENT=223 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_faculty_highres`
--

DROP TABLE IF EXISTS `etoos_faculty_highres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_faculty_highres` (
  `faculty_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  PRIMARY KEY (`faculty_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_freemium_questions`
--

DROP TABLE IF EXISTS `etoos_freemium_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_freemium_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=550 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_inapp_data`
--

DROP TABLE IF EXISTS `etoos_inapp_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_inapp_data` (
  `question_id` int(11) NOT NULL,
  `lecture_id` int(11) NOT NULL DEFAULT '0',
  `chapter_id` int(11) DEFAULT '0',
  `faculty_id` int(11) DEFAULT '0',
  `ecm_id` int(11) NOT NULL,
  `class` int(15) NOT NULL,
  `subject` varchar(30),
  `lecture_name` text,
  `topic_name` varchar(255) DEFAULT NULL,
  `faculty_name` varchar(50) DEFAULT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `course` varchar(50),
  `TG` varchar(102) DEFAULT NULL,
  PRIMARY KEY (`question_id`,`ecm_id`,`class`),
  KEY `lecture_id` (`lecture_id`,`chapter_id`,`faculty_id`,`subject`),
  KEY `topic_name` (`topic_name`,`faculty_name`,`nickname`,`course`,`TG`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_invalid_urls`
--

DROP TABLE IF EXISTS `etoos_invalid_urls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_invalid_urls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `answer_id` int(11) NOT NULL,
  `answer_video` varchar(255) NOT NULL,
  `type` varchar(10) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=762 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_invalid_urls_revise`
--

DROP TABLE IF EXISTS `etoos_invalid_urls_revise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_invalid_urls_revise` (
  `answer_id` int(11) NOT NULL DEFAULT '0',
  `question_id` int(11) DEFAULT NULL,
  `count_id` bigint(21) NOT NULL DEFAULT '0',
  `name` text,
  `answer_video` varchar(255) CHARACTER SET latin1,
  `new_answer_video` varchar(306) CHARACTER SET latin1 DEFAULT NULL,
  PRIMARY KEY (`answer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_lecture`
--

DROP TABLE IF EXISTS `etoos_lecture`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_lecture` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chapter_id` int(11) DEFAULT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `name` text,
  `external_lecture_id` int(11) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `thumbnail` varchar(100) DEFAULT NULL,
  `is_demo` int(11) NOT NULL DEFAULT '0',
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `l_order` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `answer_url` varchar(500) NOT NULL,
  `duration` int(11) NOT NULL,
  `old_question_id` int(11) DEFAULT NULL,
  `content_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12968 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_lecture_reference`
--

DROP TABLE IF EXISTS `etoos_lecture_reference`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_lecture_reference` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chapter_id` int(11) DEFAULT NULL,
  `resource_type` varchar(10) NOT NULL,
  `resource_name` text NOT NULL,
  `resource_location` varchar(500) NOT NULL,
  `is_available` int(11) DEFAULT '1',
  `temp_location` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `resource_type` (`resource_type`)
) ENGINE=InnoDB AUTO_INCREMENT=1952 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_lecture_reference_raw`
--

DROP TABLE IF EXISTS `etoos_lecture_reference_raw`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_lecture_reference_raw` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chapter_id` int(11) DEFAULT NULL,
  `resource_type` varchar(10) NOT NULL,
  `resource_name` text NOT NULL,
  `resource_location` varchar(500) NOT NULL,
  `is_available` int(11) DEFAULT '1',
  `temp_location` varchar(500) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1211 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_master`
--

DROP TABLE IF EXISTS `etoos_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_master` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `faculty_name` varchar(255) NOT NULL,
  `faculty_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `nickname` varchar(255) NOT NULL,
  `gender` varchar(255) NOT NULL,
  `TG` varchar(255) NOT NULL,
  `etoos_course_id` varchar(255) NOT NULL,
  `course` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `mapped_class` varchar(255) NOT NULL,
  `lecture_id` varchar(255) NOT NULL,
  `topic_name` longtext NOT NULL,
  `lecture_name` longtext NOT NULL,
  `duration` int(11) NOT NULL,
  `cdn_url` varchar(500) NOT NULL,
  `content_id` varchar(100) DEFAULT NULL,
  `et_product_id` int(11) DEFAULT NULL,
  `et_video_id` int(11) DEFAULT NULL,
  `lecture_order` int(11) NOT NULL,
  `faculty_bio` longtext NOT NULL,
  `faculty_raw_image` varchar(500) NOT NULL,
  `demo_image` varchar(500) DEFAULT NULL,
  `home_image` varchar(500) DEFAULT NULL,
  `degree_obtained` varchar(50) DEFAULT NULL,
  `college` text,
  `coaching` text,
  `years_exp` int(11) DEFAULT NULL,
  `chapter_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12968 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_mc_course`
--

DROP TABLE IF EXISTS `etoos_mc_course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_mc_course` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mc_question_id` int(11) NOT NULL,
  `mc_id` varchar(50) DEFAULT NULL,
  `etoos_question_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `delete_flag` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `mc_id` (`mc_id`,`etoos_question_id`),
  KEY `mc_question_id` (`mc_question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23899 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_mc_update`
--

DROP TABLE IF EXISTS `etoos_mc_update`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_mc_update` (
  `id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `name` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_nj_sir`
--

DROP TABLE IF EXISTS `etoos_nj_sir`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_nj_sir` (
  `et_prod_id` int(11) NOT NULL,
  `et_video_id` int(11) NOT NULL,
  `ch_id` int(11) NOT NULL,
  `chapter` varchar(200) NOT NULL,
  `lecture_order` int(11) NOT NULL,
  `lecture_name` longtext NOT NULL,
  `cdn_url` varchar(500) NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `old_id` int(11) NOT NULL,
  PRIMARY KEY (`et_video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_original_pdf`
--

DROP TABLE IF EXISTS `etoos_original_pdf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_original_pdf` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liveclass_course_detail_id` int(11) NOT NULL,
  `etoos_path` varchar(1000) NOT NULL,
  `dn_filename` varchar(1000) NOT NULL,
  `dn_pdf_name` varchar(1000) DEFAULT NULL,
  `display_name` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `etoos_path` (`etoos_path`),
  KEY `display_name` (`display_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1965 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_sample_data`
--

DROP TABLE IF EXISTS `etoos_sample_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_sample_data` (
  `mobile` varchar(10) NOT NULL,
  PRIMARY KEY (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_structured_course`
--

DROP TABLE IF EXISTS `etoos_structured_course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_structured_course` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` varchar(100) DEFAULT NULL,
  `button_text` varchar(30) DEFAULT NULL,
  `banner` varchar(100) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `header_image` varchar(500) NOT NULL,
  `bottom_text` varchar(800) NOT NULL,
  `button_text_new` varchar(800) NOT NULL,
  `third_screen_banner` varchar(300) NOT NULL,
  `third_screen_banner_position` int(11) NOT NULL,
  `ecm_id` int(11) DEFAULT NULL,
  `course_order` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ecm_id` (`ecm_id`),
  KEY `logo` (`logo`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_structured_course_details`
--

DROP TABLE IF EXISTS `etoos_structured_course_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_structured_course_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `structured_course_id` int(11) NOT NULL DEFAULT '0',
  `subject` varchar(20) DEFAULT NULL,
  `chapter` varchar(100) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `live_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subject` (`subject`),
  KEY `live_at` (`live_at`),
  KEY `class` (`class`)
) ENGINE=InnoDB AUTO_INCREMENT=6215 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_structured_course_questionbank`
--

DROP TABLE IF EXISTS `etoos_structured_course_questionbank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_structured_course_questionbank` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date_course` date NOT NULL,
  `day_num` varchar(20) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `chapter` varchar(500) NOT NULL,
  `question_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `date_course` (`date_course`,`subject`),
  KEY `day_num` (`day_num`,`chapter`,`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_structured_course_questions_meta`
--

DROP TABLE IF EXISTS `etoos_structured_course_questions_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_structured_course_questions_meta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `tag` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_structured_course_raw`
--

DROP TABLE IF EXISTS `etoos_structured_course_raw`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_structured_course_raw` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date_course` date NOT NULL,
  `class` int(11) NOT NULL,
  `faculty_id` int(11) NOT NULL,
  `faculty_nickname` text NOT NULL,
  `ecm_id` int(11) NOT NULL,
  `structured_course_id` int(11) NOT NULL,
  `subject` varchar(30) NOT NULL,
  `chapter` text NOT NULL,
  `lecture_id` int(11) NOT NULL,
  `question_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5873 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_structured_course_resources`
--

DROP TABLE IF EXISTS `etoos_structured_course_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_structured_course_resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `structured_course_id` int(11) NOT NULL DEFAULT '0',
  `structured_course_detail_id` int(11) NOT NULL DEFAULT '0',
  `subject` varchar(20) DEFAULT NULL,
  `resource_reference` varchar(200) DEFAULT NULL,
  `topic` varchar(255) NOT NULL,
  `expert_name` varchar(50) DEFAULT NULL,
  `expert_image` varchar(100) DEFAULT NULL,
  `q_order` int(4) DEFAULT NULL,
  `resource_type` tinyint(4) NOT NULL,
  `class` int(11) DEFAULT NULL,
  `player_type` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `q_order` (`q_order`),
  KEY `resource_type` (`resource_type`),
  KEY `structured_course_detail_id` (`structured_course_detail_id`),
  KEY `resource_reference` (`resource_reference`),
  KEY `class` (`class`),
  KEY `structured_course_id` (`structured_course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11586 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `etoos_testimonials`
--

DROP TABLE IF EXISTS `etoos_testimonials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `etoos_testimonials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) DEFAULT NULL,
  `image_url` varchar(150) DEFAULT NULL,
  `description` text NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `ecm_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `is_active` (`is_active`),
  KEY `ecm_id` (`ecm_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exam_category_mapping`
--

DROP TABLE IF EXISTS `exam_category_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_category_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `exam` varchar(200) DEFAULT NULL,
  `category` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` int(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `exam` (`exam`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exam_corner`
--

DROP TABLE IF EXISTS `exam_corner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_corner` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` text NOT NULL,
  `ccm_id` int(11) DEFAULT NULL,
  `filter_type` enum('news','careers') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `class` varchar(10) NOT NULL,
  `locale` varchar(10) NOT NULL DEFAULT 'en',
  `is_live` tinyint(1) NOT NULL DEFAULT '0',
  `live_expiry_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `carousel_type` enum('autoplay','popular','default') NOT NULL,
  `question_id` int(11) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `button_cta_deeplink` varchar(255) DEFAULT NULL,
  `deeplink` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exam_corner_start_dates` (`start_date`),
  KEY `exam_corner_end_dates` (`end_date`),
  KEY `exam_corner_ccm_id` (`ccm_id`),
  KEY `exam_corner_type` (`filter_type`),
  KEY `exam_corner_locale` (`locale`),
  KEY `exam_corner_qid` (`question_id`),
  KEY `exam_corner_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=240 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exam_scrapped_questions`
--

DROP TABLE IF EXISTS `exam_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(500) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `answer` varchar(1500) DEFAULT NULL,
  `canonical_url` varchar(500) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50250 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exambook_scrapped_questions`
--

DROP TABLE IF EXISTS `exambook_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exambook_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(200) DEFAULT NULL,
  `option1` varchar(50) DEFAULT NULL,
  `option2` varchar(50) DEFAULT NULL,
  `option3` varchar(50) DEFAULT NULL,
  `option4` varchar(50) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `answer` varchar(100) DEFAULT NULL,
  `source_id` varchar(200) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25233 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `examveda_scrapped_questions`
--

DROP TABLE IF EXISTS `examveda_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `examveda_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(1000) DEFAULT NULL,
  `option1` varchar(500) DEFAULT NULL,
  `option2` varchar(500) DEFAULT NULL,
  `option3` varchar(500) DEFAULT NULL,
  `option4` varchar(500) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `answer` varchar(500) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32225 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `existing_user_truecaller_overrides`
--

DROP TABLE IF EXISTS `existing_user_truecaller_overrides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `existing_user_truecaller_overrides` (
  `old_student_id` int(11) NOT NULL,
  `mobile_number` varchar(255) NOT NULL,
  `current_student_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exp_yt_tagging`
--

DROP TABLE IF EXISTS `exp_yt_tagging`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exp_yt_tagging` (
  `question_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `active_tag` varchar(5000) DEFAULT NULL,
  `active_tag_timestamp` timestamp NULL DEFAULT NULL,
  `new_tag` varchar(5000) DEFAULT NULL,
  `matched_question` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `title_tag` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expert_pricing`
--

DROP TABLE IF EXISTS `expert_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `expert_pricing` (
  `expert_id` int(5) NOT NULL,
  `question_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `price` smallint(6) NOT NULL,
  `expert_price_id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`expert_price_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1330680 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expert_skipped_question`
--

DROP TABLE IF EXISTS `expert_skipped_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `expert_skipped_question` (
  `skip_id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `skipper_id` varchar(16) NOT NULL,
  `skip_message_id` int(11) NOT NULL,
  `skip_message` tinytext NOT NULL,
  `type` tinyint(4) NOT NULL DEFAULT '0',
  `alloc_time` varchar(128) DEFAULT NULL,
  `skipped_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `accept_reject` tinyint(4) NOT NULL DEFAULT '0',
  `reject_remark` tinytext,
  PRIMARY KEY (`skip_id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9118 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expert_transactions`
--

DROP TABLE IF EXISTS `expert_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `expert_transactions` (
  `expert_transaction_id` int(11) NOT NULL AUTO_INCREMENT,
  `expert_id` int(55) NOT NULL,
  `transaction_type` enum('credit','debit') NOT NULL,
  `transaction_amount` varchar(255) DEFAULT NULL,
  `transaction_description` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`expert_transaction_id`)
) ENGINE=InnoDB AUTO_INCREMENT=302 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `experts`
--

DROP TABLE IF EXISTS `experts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `experts` (
  `expert_id` int(11) NOT NULL AUTO_INCREMENT,
  `college_id` int(11) NOT NULL,
  `expert_fname` varchar(255) NOT NULL,
  `expert_lname` varchar(255) NOT NULL,
  `expert_dob` varchar(10) DEFAULT NULL,
  `expert_phn_number` varchar(10) DEFAULT NULL,
  `expert_title` varchar(255) NOT NULL,
  `expert_email` varchar(255) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `expert_role` enum('aspirant','student','teacher','expert','alumini') NOT NULL,
  `facebook_id` varchar(255) NOT NULL,
  `twitter_id` varchar(255) NOT NULL,
  `expert_profile_image` varchar(255) DEFAULT NULL,
  `reset_code` varchar(255) NOT NULL,
  `expert_status` enum('active','inactive') NOT NULL,
  `last_login` varchar(255) NOT NULL,
  `is_approve` int(11) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`expert_id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `external_platform_potential_leads`
--

DROP TABLE IF EXISTS `external_platform_potential_leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `external_platform_potential_leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mobile` varchar(45) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile_UNIQUE` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `facebook_delete_request`
--

DROP TABLE IF EXISTS `facebook_delete_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `facebook_delete_request` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `fb_user_id` varchar(45) DEFAULT NULL,
  `confirmation_code` varchar(15) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `facilities`
--

DROP TABLE IF EXISTS `facilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `facilities` (
  `facility_id` int(255) NOT NULL AUTO_INCREMENT,
  `facility_pincode` varchar(255) NOT NULL,
  `facility_phone` varchar(255) NOT NULL,
  `facility_num_classrooms` varchar(255) NOT NULL,
  `facility_attribute_1` varchar(255) DEFAULT NULL,
  `facility_attribute_2` varchar(255) DEFAULT NULL,
  `facility_attribute_3` varchar(255) DEFAULT NULL,
  `facility_attribute_4` varchar(255) DEFAULT NULL,
  `facility_attribute_5` varchar(255) DEFAULT NULL,
  `facility_attribute_6` varchar(255) DEFAULT NULL,
  `facility_attribute_7` varchar(255) DEFAULT NULL,
  `facility_attribute_8` varchar(255) DEFAULT NULL,
  `facility_attribute_9` varchar(255) DEFAULT NULL,
  `facility_attribute_10` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`facility_id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `facility_attributes`
--

DROP TABLE IF EXISTS `facility_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `facility_attributes` (
  `facility_attribute_id` int(11) NOT NULL AUTO_INCREMENT,
  `facility_attribute_num` varchar(255) NOT NULL,
  `facility_attribute_description` varchar(255) NOT NULL,
  `facility_attribute_value` varchar(255) NOT NULL,
  PRIMARY KEY (`facility_attribute_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `facility_classrooms`
--

DROP TABLE IF EXISTS `facility_classrooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `facility_classrooms` (
  `facility_classroom_id` int(255) NOT NULL AUTO_INCREMENT,
  `facility_id` varchar(255) NOT NULL,
  `classroom_id` varchar(255) NOT NULL,
  `classroom_capacity` varchar(255) NOT NULL,
  `classroom_attribute_1` varchar(255) DEFAULT NULL,
  `classroom_attribute_2` varchar(255) DEFAULT NULL,
  `classroom_attribute_3` varchar(255) DEFAULT NULL,
  `classroom_attribute_4` varchar(255) DEFAULT NULL,
  `classroom_attribute_5` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`facility_classroom_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fact_repo`
--

DROP TABLE IF EXISTS `fact_repo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fact_repo` (
  `id` int(25) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` varchar(1000) NOT NULL,
  `image_type_1` varchar(255) DEFAULT NULL,
  `image_type_2` varchar(255) DEFAULT NULL,
  `image_type_3` varchar(255) DEFAULT NULL,
  `whatsapp_image_1` varchar(255) DEFAULT NULL,
  `whatsapp_image_2` varchar(255) DEFAULT NULL,
  `whatsapp_image_3` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=602 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `faculty_ranking_for_top_teacher_carousel`
--

DROP TABLE IF EXISTS `faculty_ranking_for_top_teacher_carousel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `faculty_ranking_for_top_teacher_carousel` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) DEFAULT NULL,
  `faculty_id` int(255) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `faculty_name` varchar(255) NOT NULL,
  `class` int(11) DEFAULT NULL,
  `medium` varchar(255) NOT NULL,
  `course` varchar(255) NOT NULL,
  `alias_name` varchar(255) NOT NULL,
  `rank` int(11) NOT NULL,
  `ccm_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `faq`
--

DROP TABLE IF EXISTS `faq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `faq` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `bucket` varchar(25) DEFAULT NULL,
  `locale` varchar(10) DEFAULT NULL,
  `question` varchar(150) DEFAULT NULL,
  `answer` varchar(1500) DEFAULT NULL,
  `type` varchar(150) DEFAULT NULL,
  `question_id` int(15) DEFAULT NULL,
  `thumbnail` varchar(200) DEFAULT NULL,
  `priority` int(11) DEFAULT NULL,
  `is_active` int(11) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `video_orientation` varchar(200) DEFAULT NULL,
  `bucket_priority` int(11) DEFAULT NULL,
  `min_version_code` int(11) DEFAULT '100',
  `max_version_code` int(11) DEFAULT '1000',
  `batch_id` int(11) DEFAULT NULL,
  `offset_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `locale` (`locale`,`is_active`,`priority`),
  KEY `bucket` (`bucket`),
  KEY `version_code` (`min_version_code`,`max_version_code`)
) ENGINE=InnoDB AUTO_INCREMENT=38572 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fcm_notification_config`
--

DROP TABLE IF EXISTS `fcm_notification_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fcm_notification_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nudge_for` enum('video_view') NOT NULL,
  `count` int(11) NOT NULL,
  `image` varchar(255) NOT NULL,
  `event` varchar(255) NOT NULL,
  `data` varchar(2000) NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `message` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `firebase_eventtag` varchar(255) NOT NULL,
  `class` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feed_student_data`
--

DROP TABLE IF EXISTS `feed_student_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feed_student_data` (
  `student_id` int(11) NOT NULL,
  `date_active` date NOT NULL,
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback_from_question`
--

DROP TABLE IF EXISTS `feedback_from_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedback_from_question` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` bigint(20) NOT NULL,
  `student_id` bigint(20) NOT NULL,
  `feedback` int(11) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=192 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback_prefrences`
--

DROP TABLE IF EXISTS `feedback_prefrences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedback_prefrences` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `parent_id` int(55) DEFAULT NULL,
  `page` enum('SRP','video') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `locale` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback_prefrences_properties`
--

DROP TABLE IF EXISTS `feedback_prefrences_properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedback_prefrences_properties` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `parent_id` int(55) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `display` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback_prefrences_selections`
--

DROP TABLE IF EXISTS `feedback_prefrences_selections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedback_prefrences_selections` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) NOT NULL,
  `parent_id` int(55) DEFAULT NULL,
  `selection` int(55) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `parent_id` (`parent_id`),
  KEY `selection` (`selection`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback_properties`
--

DROP TABLE IF EXISTS `feedback_properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedback_properties` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `type` varchar(255) NOT NULL,
  `display` varchar(255) NOT NULL,
  `locale` enum('en','hi') NOT NULL DEFAULT 'en',
  `category` enum('positive','negative') NOT NULL,
  `page` enum('SRP','video') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback_selections`
--

DROP TABLE IF EXISTS `feedback_selections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedback_selections` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) DEFAULT NULL,
  `entity_id` int(255) DEFAULT NULL,
  `page` enum('SRP','video') NOT NULL,
  `selection` int(55) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `selection` (`selection`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback_subscription`
--

DROP TABLE IF EXISTS `feedback_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedback_subscription` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reason` varchar(1000) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `student_id` int(11) NOT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `country_code` varchar(5) DEFAULT '+91',
  `email` varchar(255) DEFAULT NULL,
  `class` varchar(255) NOT NULL,
  `username` varchar(25) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `country` varchar(10) NOT NULL DEFAULT 'IN',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback_web`
--

DROP TABLE IF EXISTS `feedback_web`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedback_web` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `feedback` varchar(3) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `flagr_student_info`
--

DROP TABLE IF EXISTS `flagr_student_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `flagr_student_info` (
  `flag_id` int(11) NOT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `student_id` int(255) DEFAULT NULL,
  `data` varchar(255) DEFAULT NULL,
  UNIQUE KEY `flag_id` (`flag_id`,`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_aggregate_difficulty_report`
--

DROP TABLE IF EXISTS `formula_aggregate_difficulty_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_aggregate_difficulty_report` (
  `subject_id` text,
  `chapter_id` text,
  `topic_id` text,
  `difficulty_level` int(11) DEFAULT NULL,
  `is_test` int(11) DEFAULT NULL,
  `number_correct` int(11) DEFAULT NULL,
  `number_incorrect` int(11) DEFAULT NULL,
  `number_unattempted` blob
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_chapter`
--

DROP TABLE IF EXISTS `formula_chapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_chapter` (
  `id` int(11) NOT NULL,
  `name` text,
  `seq` int(11) DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `icon_path` varchar(255) DEFAULT NULL,
  `super_chapter_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_cheatsheet`
--

DROP TABLE IF EXISTS `formula_cheatsheet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_cheatsheet` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text,
  `num_formulas` int(11) DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `student_id` int(11) NOT NULL,
  `seq` int(11) NOT NULL,
  `is_delete` tinyint(1) NOT NULL DEFAULT '0',
  `is_generic` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `is_delete` (`is_delete`)
) ENGINE=InnoDB AUTO_INCREMENT=128262 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_cheatsheet_formula`
--

DROP TABLE IF EXISTS `formula_cheatsheet_formula`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_cheatsheet_formula` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cheatsheet_id` int(11) DEFAULT NULL,
  `formula_id` int(11) DEFAULT NULL,
  `seq` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cheatsheet_id` (`cheatsheet_id`)
) ENGINE=InnoDB AUTO_INCREMENT=445596 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_constant_parameters`
--

DROP TABLE IF EXISTS `formula_constant_parameters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_constant_parameters` (
  `id` int(11) DEFAULT NULL,
  `short_name` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `formula_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_formula_mathjaxhtml`
--

DROP TABLE IF EXISTS `formula_formula_mathjaxhtml`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_formula_mathjaxhtml` (
  `formula_id` int(11) NOT NULL,
  `html` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_formulas`
--

DROP TABLE IF EXISTS `formula_formulas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_formulas` (
  `id` int(11) NOT NULL,
  `name` varchar(255) CHARACTER SET utf8 NOT NULL,
  `seq` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `super_chapter_id` int(11) NOT NULL,
  `chapter_id` int(11) NOT NULL,
  `formula_text` mediumtext CHARACTER SET utf8 NOT NULL,
  `image_url` mediumtext CHARACTER SET utf8 NOT NULL,
  `ocr` text CHARACTER SET utf8 NOT NULL,
  `html` mediumtext CHARACTER SET utf8 NOT NULL,
  `max_image_height` double DEFAULT NULL,
  `is_marked_for_memorize` tinyint(1) DEFAULT NULL,
  `topic_id` int(11) DEFAULT NULL,
  `webview_height` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_formulastest`
--

DROP TABLE IF EXISTS `formula_formulastest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_formulastest` (
  `id` int(11) NOT NULL,
  `name` varchar(255) CHARACTER SET utf8 NOT NULL,
  `seq` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `super_chapter_id` int(11) NOT NULL,
  `chapter_id` int(11) NOT NULL,
  `formula_text` text CHARACTER SET utf8 NOT NULL,
  `image_url` text CHARACTER SET utf8 NOT NULL,
  `ocr` text CHARACTER SET utf8 NOT NULL,
  `html` text CHARACTER SET utf8 NOT NULL,
  `max_image_height` double DEFAULT NULL,
  `is_marked_for_memorize` tinyint(1) DEFAULT NULL,
  `topic_id` int(11) DEFAULT NULL,
  `webview_height` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_keywords`
--

DROP TABLE IF EXISTS `formula_keywords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_keywords` (
  `id` int(11) DEFAULT NULL,
  `keyword` text,
  `formula_id` int(11) DEFAULT NULL,
  `keyword_type` int(11) DEFAULT NULL,
  `subject_id` text,
  `super_chapter_id` text,
  `chapter_id` text,
  `topic_id` text,
  `cheatsheet_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_legends`
--

DROP TABLE IF EXISTS `formula_legends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_legends` (
  `id` int(11) DEFAULT NULL,
  `short_name` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `formula_id` int(11) DEFAULT NULL,
  KEY `index1` (`formula_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_subject`
--

DROP TABLE IF EXISTS `formula_subject`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_subject` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text,
  `icon_path` varchar(200) DEFAULT NULL,
  `seq` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_super_chapter`
--

DROP TABLE IF EXISTS `formula_super_chapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_super_chapter` (
  `id` text,
  `name` text,
  `seq` int(11) DEFAULT NULL,
  `subject_id` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `formula_topic`
--

DROP TABLE IF EXISTS `formula_topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formula_topic` (
  `id` text,
  `name` text,
  `seq` int(11) DEFAULT NULL,
  `chapter_id` text,
  `subject_id` text,
  `icon_path` text,
  `parent_topic_id` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forum_feed_config`
--

DROP TABLE IF EXISTS `forum_feed_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `forum_feed_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property` varchar(100) NOT NULL,
  `value` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fuzzy_book_list`
--

DROP TABLE IF EXISTS `fuzzy_book_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fuzzy_book_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_name` varchar(500) NOT NULL,
  `image` varchar(500) NOT NULL,
  `class` int(11) NOT NULL,
  `playlist_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fuzzy_feedback`
--

DROP TABLE IF EXISTS `fuzzy_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fuzzy_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `book_student_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ga_master`
--

DROP TABLE IF EXISTS `ga_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ga_master` (
  `id` int(11) DEFAULT NULL,
  `dimension` varchar(275) DEFAULT NULL,
  `measure` varchar(275) DEFAULT NULL,
  `db` varchar(275) DEFAULT NULL,
  `table_name` varchar(255) DEFAULT NULL,
  `table_id` varchar(255) DEFAULT NULL,
  `flag` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `games` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(50) DEFAULT NULL,
  `download_url` varchar(100) DEFAULT NULL,
  `fallback_url` varchar(100) DEFAULT NULL,
  `image_url` varchar(100) DEFAULT NULL,
  `order_field` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `is_gamezop` int(11) NOT NULL,
  `profile_order` int(11) NOT NULL,
  `profile_image` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_field` (`order_field`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_action_config`
--

DROP TABLE IF EXISTS `gamification_action_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_action_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action` varchar(255) NOT NULL,
  `action_display` varchar(1000) NOT NULL,
  `xp` int(11) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL,
  `action_page` varchar(255) DEFAULT NULL,
  `stats_display_text` varchar(255) DEFAULT NULL,
  `show_in_stats` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_activity`
--

DROP TABLE IF EXISTS `gamification_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_activity` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `activity` varchar(255) NOT NULL,
  `refer_id` varchar(255) NOT NULL,
  `xp` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `v` int(11) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `activity` (`activity`)
) ENGINE=InnoDB AUTO_INCREMENT=752044534 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_badge_meta`
--

DROP TABLE IF EXISTS `gamification_badge_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_badge_meta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `nudge_description` text NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `visible_for` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `banner_img` varchar(255) DEFAULT NULL,
  `action_page` varchar(255) DEFAULT NULL,
  `blur_image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_badge_requirements`
--

DROP TABLE IF EXISTS `gamification_badge_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_badge_requirements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `badge_id` int(11) NOT NULL,
  `requirement_type` varchar(255) NOT NULL,
  `requirement` int(11) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_optional` tinyint(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_coins_transaction`
--

DROP TABLE IF EXISTS `gamification_coins_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_coins_transaction` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `transaction_type` enum('CREDIT','DEBIT','REDEEM') NOT NULL,
  `reference` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1912304 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_lvl_config`
--

DROP TABLE IF EXISTS `gamification_lvl_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_lvl_config` (
  `lvl` int(11) NOT NULL AUTO_INCREMENT,
  `xp` int(11) NOT NULL,
  PRIMARY KEY (`lvl`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_milestones`
--

DROP TABLE IF EXISTS `gamification_milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_milestones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `milestone_type` varchar(255) NOT NULL,
  `milestone` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `milestone_type` (`milestone_type`)
) ENGINE=InnoDB AUTO_INCREMENT=96316176 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_points_total`
--

DROP TABLE IF EXISTS `gamification_points_total`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_points_total` (
  `id` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `xp` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_redeem_inventory`
--

DROP TABLE IF EXISTS `gamification_redeem_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_redeem_inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resource_type` enum('pdf','MOCK_TEST','COINS','playlist') NOT NULL,
  `resource_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `img_url` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `price` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `display_category` varchar(255) NOT NULL DEFAULT 'BOOKS',
  `is_last` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_redeem_transactions`
--

DROP TABLE IF EXISTS `gamification_redeem_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_redeem_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  `transaction_type` enum('CREDIT','DEBIT') NOT NULL,
  `is_redeemed` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Transaction` (`item_id`,`user_id`,`is_redeemed`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2029924 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_user_action_summary`
--

DROP TABLE IF EXISTS `gamification_user_action_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_user_action_summary` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `action_type` varchar(255) NOT NULL,
  `action_id` int(11) NOT NULL,
  `metric` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_user_meta`
--

DROP TABLE IF EXISTS `gamification_user_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_user_meta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `lvl` int(11) NOT NULL DEFAULT '0',
  `points` int(11) NOT NULL DEFAULT '0',
  `redeemable_points` int(11) NOT NULL DEFAULT '0',
  `coins` int(11) NOT NULL DEFAULT '0',
  `badges` varchar(255) NOT NULL DEFAULT '',
  `daily_streak` int(11) NOT NULL DEFAULT '1',
  `max_daily_streak` int(11) NOT NULL DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `banner_img` varchar(255) DEFAULT ' https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/D311E77D-34D7-751A-8B7D-379FD0868BC7.webp',
  `coins_earned` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `lvl` (`lvl`)
) ENGINE=InnoDB AUTO_INCREMENT=27857210 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gamification_user_streak`
--

DROP TABLE IF EXISTS `gamification_user_streak`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gamification_user_streak` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `action_id` int(11) NOT NULL,
  `streak` int(11) NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `google_app_rating_users`
--

DROP TABLE IF EXISTS `google_app_rating_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `google_app_rating_users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT '0',
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3133544 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `google_scrapped_questions`
--

DROP TABLE IF EXISTS `google_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `google_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(200) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `source_id` varchar(50) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `source_url` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1574525 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `groupchat_room`
--

DROP TABLE IF EXISTS `groupchat_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `groupchat_room` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `class` varchar(11) NOT NULL,
  `icon_path` varchar(255) NOT NULL,
  `helper_text` text NOT NULL,
  `type` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `active_from` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `active_till` datetime DEFAULT NULL,
  `is_delete` tinyint(1) NOT NULL DEFAULT '0',
  `group_creator` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `groupchat_room_moderators`
--

DROP TABLE IF EXISTS `groupchat_room_moderators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `groupchat_room_moderators` (
  `group_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `is_moderator` tinyint(1) NOT NULL,
  `is_applied` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `health_check`
--

DROP TABLE IF EXISTS `health_check`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `health_check` (
  `timestamp` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hindi_matches`
--

DROP TABLE IF EXISTS `hindi_matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hindi_matches` (
  `question_id` int(11) NOT NULL,
  `locale` varchar(2) DEFAULT NULL,
  `matched_question` int(11) DEFAULT NULL,
  UNIQUE KEY `question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hinglish_translation`
--

DROP TABLE IF EXISTS `hinglish_translation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hinglish_translation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hinglish` varchar(100) NOT NULL,
  `hindi` varchar(100) NOT NULL,
  `detection_for_language` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16848 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `home_banner`
--

DROP TABLE IF EXISTS `home_banner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `home_banner` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ccm_id` varchar(255) DEFAULT NULL,
  `student_class` int(11) NOT NULL,
  `img_url` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cta_link` varchar(255) NOT NULL,
  `priority` int(11) NOT NULL,
  `locale` varchar(10) NOT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `min_version` int(11) NOT NULL,
  `max_version` int(11) NOT NULL,
  `flagr_variant` smallint(6) NOT NULL DEFAULT '-1',
  `user_days` smallint(6) NOT NULL DEFAULT '-1',
  PRIMARY KEY (`id`),
  KEY `end_date` (`end_date`),
  KEY `is_active` (`is_active`),
  KEY `student_class` (`student_class`),
  KEY `start_date` (`start_date`),
  KEY `home_banner_type_IDX` (`type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `home_caraousels`
--

DROP TABLE IF EXISTS `home_caraousels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `home_caraousels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(100) DEFAULT NULL,
  `data_type` varchar(50) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `caraousel_order` int(100) DEFAULT NULL,
  `scroll_type` varchar(100) DEFAULT NULL,
  `scroll_size` varchar(50) DEFAULT NULL,
  `data_limit` int(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view_all` tinyint(1) DEFAULT '1',
  `secondary_data` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(1) NOT NULL DEFAULT '0',
  `class` varchar(50) DEFAULT NULL,
  `sharing_message` varchar(500) DEFAULT NULL,
  `mapped_playlist_id` varchar(250) DEFAULT NULL,
  `locale` varchar(10) NOT NULL DEFAULT 'en',
  `ccm_id` int(11) DEFAULT NULL,
  `min_version_code` int(11) NOT NULL DEFAULT '100',
  `max_version_code` int(11) NOT NULL DEFAULT '10000',
  `flagVariant` int(11) NOT NULL DEFAULT '-1',
  `carousel_order` int(11) DEFAULT NULL,
  `action_text` varchar(60) DEFAULT NULL,
  `icons_list` text,
  `image_url` text,
  `action_deeplink` text,
  `ccmid_list` text,
  `title_hindi` text,
  `subtitle_hindi` text,
  PRIMARY KEY (`id`),
  KEY `is_delete` (`is_delete`),
  KEY `is_active` (`is_active`),
  KEY `type` (`type`),
  KEY `caraousel_order` (`caraousel_order`),
  KEY `class` (`class`),
  KEY `min_version_code` (`min_version_code`,`max_version_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1579 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `home_caraousels_test`
--

DROP TABLE IF EXISTS `home_caraousels_test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `home_caraousels_test` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(100) DEFAULT NULL,
  `data_type` varchar(50) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `caraousel_order` int(100) DEFAULT NULL,
  `scroll_type` varchar(100) DEFAULT NULL,
  `scroll_size` varchar(50) DEFAULT NULL,
  `data_limit` int(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view_all` tinyint(1) DEFAULT '1',
  `secondary_data` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(1) NOT NULL DEFAULT '0',
  `class` varchar(50) DEFAULT NULL,
  `sharing_message` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `is_delete` (`is_delete`),
  KEY `is_active` (`is_active`),
  KEY `type` (`type`),
  KEY `caraousel_order` (`caraousel_order`),
  KEY `class` (`class`)
) ENGINE=InnoDB AUTO_INCREMENT=139 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `home_widget_submissions`
--

DROP TABLE IF EXISTS `home_widget_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `home_widget_submissions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `widget_name` varchar(255) DEFAULT NULL,
  `response` varchar(10) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=870654 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homepage`
--

DROP TABLE IF EXISTS `homepage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepage` (
  `student_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `widget_name` varchar(255) NOT NULL,
  `response` varchar(10) DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homepage_category_icons`
--

DROP TABLE IF EXISTS `homepage_category_icons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepage_category_icons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) DEFAULT NULL,
  `image_url` varchar(200) DEFAULT NULL,
  `deeplink` varchar(250) DEFAULT NULL,
  `parent_category` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `locale` varchar(10) DEFAULT NULL,
  `title_hindi` varchar(100) DEFAULT NULL,
  `description` text,
  `class` int(11) DEFAULT NULL,
  `description_hindi` text,
  `add_prefix` tinyint(1) DEFAULT NULL,
  `ccmid_list` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=333 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homepage_questions_master`
--

DROP TABLE IF EXISTS `homepage_questions_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepage_questions_master` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `widget_name` enum('CHALLENGE_OF_THE_DAY','BOARD_EXAM_BOOSTER','TOPIC_BOOSTER','') NOT NULL,
  `question_id` int(55) NOT NULL,
  `class` int(55) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `table_mapped` varchar(255) DEFAULT NULL,
  `is_active` int(11) NOT NULL DEFAULT '1',
  `master_chapter_alias` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widget_name` (`widget_name`,`is_active`),
  KEY `topic_booster` (`class`,`subject`,`chapter`)
) ENGINE=InnoDB AUTO_INCREMENT=219833 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homepage_questions_master_delete`
--

DROP TABLE IF EXISTS `homepage_questions_master_delete`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepage_questions_master_delete` (
  `id` int(55) NOT NULL DEFAULT '0',
  `widget_name` enum('CHALLENGE_OF_THE_DAY','BOARD_EXAM_BOOSTER','TOPIC_BOOSTER','') NOT NULL,
  `question_id` int(55) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homepage_subjects`
--

DROP TABLE IF EXISTS `homepage_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepage_subjects` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `subject` varchar(55) NOT NULL,
  `display` varchar(55) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `type` varchar(55) NOT NULL DEFAULT 'SUBJECT_QUESTION',
  `locale` varchar(10) NOT NULL,
  `description` varchar(255) NOT NULL,
  `ccm_meta` varchar(55) NOT NULL,
  `is_active` int(5) NOT NULL DEFAULT '1',
  `priority` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homepage_widgets`
--

DROP TABLE IF EXISTS `homepage_widgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepage_widgets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(100) NOT NULL,
  `data_type` varchar(100) NOT NULL,
  `default_type` int(11) NOT NULL,
  `multi_select` int(11) NOT NULL DEFAULT '0',
  `title` varchar(200) NOT NULL,
  `locale` varchar(11) NOT NULL DEFAULT 'en',
  `img_url` varchar(255) DEFAULT NULL,
  `sharing_message` varchar(155) DEFAULT NULL,
  `mapped_playlist_id` varchar(100) DEFAULT NULL,
  `scroll_type` varchar(55) NOT NULL,
  `scroll_size` varchar(55) NOT NULL,
  `view_all` varchar(55) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `active_classes` varchar(100) NOT NULL,
  `priority` int(55) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `min_version_code` (`min_version_code`),
  KEY `max_version_code` (`max_version_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homepage_widgets_test`
--

DROP TABLE IF EXISTS `homepage_widgets_test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `homepage_widgets_test` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(55) NOT NULL,
  `data_type` varchar(55) NOT NULL,
  `default_type` int(11) NOT NULL,
  `multi_select` int(11) NOT NULL DEFAULT '0',
  `title` varchar(255) NOT NULL,
  `locale` varchar(11) NOT NULL DEFAULT 'en',
  `img_url` varchar(255) DEFAULT NULL,
  `sharing_message` varchar(255) DEFAULT NULL,
  `mapped_playlist_id` varchar(55) DEFAULT NULL,
  `scroll_type` varchar(55) NOT NULL,
  `scroll_size` varchar(55) NOT NULL,
  `view_all` varchar(55) NOT NULL DEFAULT '0',
  `bg_color` varchar(55) NOT NULL,
  `is_active` int(10) NOT NULL DEFAULT '1',
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `sub_url` varchar(255) DEFAULT NULL,
  `data_limit` int(11) NOT NULL,
  `widget_order` int(10) NOT NULL DEFAULT '0',
  `active_classes` varchar(55) NOT NULL,
  `priority` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ias_advanced_filter`
--

DROP TABLE IF EXISTS `ias_advanced_filter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ias_advanced_filter` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tab_type` varchar(250) DEFAULT NULL,
  `tab_type_value` varchar(250) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `language` varchar(250) DEFAULT NULL,
  `subject` varchar(250) DEFAULT NULL,
  `chapter` varchar(250) DEFAULT NULL,
  `expert_name` varchar(250) DEFAULT NULL,
  `author` varchar(250) DEFAULT NULL,
  `publication` varchar(250) DEFAULT NULL,
  `exam_boards` varchar(250) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=39664 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `icons`
--

DROP TABLE IF EXISTS `icons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `icons` (
  `id` int(50) NOT NULL AUTO_INCREMENT,
  `feature_type` varchar(100) NOT NULL,
  `title` varchar(250) NOT NULL,
  `position` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `class` varchar(100) NOT NULL DEFAULT 'all',
  `link` varchar(100) DEFAULT NULL,
  `is_show` varchar(50) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `icons_latest`
--

DROP TABLE IF EXISTS `icons_latest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `icons_latest` (
  `id` int(50) NOT NULL AUTO_INCREMENT,
  `feature_type` varchar(100) NOT NULL,
  `title` varchar(250) NOT NULL,
  `position` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `class` varchar(100) NOT NULL DEFAULT 'all',
  `link` varchar(120) DEFAULT NULL,
  `is_show` varchar(50) NOT NULL DEFAULT '1',
  `app_version` varchar(100) DEFAULT NULL,
  `data` varchar(255) DEFAULT NULL,
  `version_flag` int(11) DEFAULT NULL,
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `flag_variants` int(11) NOT NULL DEFAULT '1',
  `deeplink` varchar(200) DEFAULT NULL,
  `new_link` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `version_flag` (`version_flag`)
) ENGINE=InnoDB AUTO_INCREMENT=1017 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `image_data`
--

DROP TABLE IF EXISTS `image_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `image_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_path` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `height` varchar(255) NOT NULL,
  `width` varchar(255) NOT NULL,
  `image` varchar(100) DEFAULT NULL,
  `path` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `image` (`image`),
  KEY `path` (`path`),
  KEY `image_path` (`image_path`)
) ENGINE=InnoDB AUTO_INCREMENT=23635365 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `image_gupshup_banned`
--

DROP TABLE IF EXISTS `image_gupshup_banned`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `image_gupshup_banned` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `entity_id` varchar(50) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inapp_logs`
--

DROP TABLE IF EXISTS `inapp_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inapp_logs` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `student_class` varchar(255) NOT NULL,
  `input_str` varchar(255) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `api_resp_itr1` text NOT NULL,
  `resp_type_itr1` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `eventType` varchar(255) DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  `updated_by` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3814155 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inapp_search_data`
--

DROP TABLE IF EXISTS `inapp_search_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inapp_search_data` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `class` int(11) NOT NULL,
  `subject` text NOT NULL,
  `parent` int(11) DEFAULT NULL,
  `resource_type` text NOT NULL,
  `resource_path` text,
  `image_url` text,
  `is_first` int(11) NOT NULL,
  `is_last` int(11) NOT NULL,
  `is_active` int(11) NOT NULL,
  `is_delete` int(11) NOT NULL,
  `parent_chain` text,
  `parent_tags` text,
  `thumbnail_img_url` varchar(250) DEFAULT NULL,
  `name_language_1` varchar(5000) DEFAULT NULL,
  `parent_tags_language_1` varchar(5000) DEFAULT NULL,
  `thumbnail_img_url_hindi` varchar(250) DEFAULT NULL,
  `items_count` int(11) DEFAULT NULL,
  `title` varchar(1000) DEFAULT NULL,
  `tags` varchar(1000) DEFAULT NULL,
  `chapter_order` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `name_language_1` (`name_language_1`(1024)),
  KEY `parent_tags_language_1` (`parent_tags_language_1`(1024)),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inapp_search_filter`
--

DROP TABLE IF EXISTS `inapp_search_filter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inapp_search_filter` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `find_str` varchar(250) NOT NULL,
  `replace_word` varchar(250) NOT NULL,
  `type` varchar(250) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`,`find_str`),
  FULLTEXT KEY `find_str` (`find_str`)
) ENGINE=InnoDB AUTO_INCREMENT=471 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inapp_search_suggestion_pdf`
--

DROP TABLE IF EXISTS `inapp_search_suggestion_pdf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inapp_search_suggestion_pdf` (
  `id` int(11) NOT NULL,
  `name` varchar(250) NOT NULL,
  `description` varchar(250) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_last` tinyint(4) NOT NULL DEFAULT '0',
  `type` enum('book','topic_pdf','topic_exam','') NOT NULL,
  `resource_type` varchar(100) NOT NULL,
  `resource_path` varchar(500) DEFAULT NULL,
  `class` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `is_active` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `class` (`class`,`type`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inapp_search_suggestion_video`
--

DROP TABLE IF EXISTS `inapp_search_suggestion_video`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inapp_search_suggestion_video` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `doubt` varchar(100) DEFAULT NULL,
  `ocr_text` varchar(500) NOT NULL,
  `question` varchar(500) NOT NULL,
  `type` enum('recent_watched','most_watched','recent_watched_v2') NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `id` (`id`),
  KEY `class` (`class`,`type`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=282845 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inapp_search_top_tags`
--

DROP TABLE IF EXISTS `inapp_search_top_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inapp_search_top_tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_class` int(11) NOT NULL,
  `data` varchar(2500) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_class` (`student_class`,`is_active`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inapp_search_translate`
--

DROP TABLE IF EXISTS `inapp_search_translate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inapp_search_translate` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_language_1` varchar(5000) DEFAULT NULL,
  `translated_english` varchar(1000) DEFAULT NULL,
  `translated_hindi` varchar(5000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inapp_ssearch_logs`
--

DROP TABLE IF EXISTS `inapp_ssearch_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inapp_ssearch_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `input_str` int(11) NOT NULL,
  `api_resp_itr1 (text)` int(11) NOT NULL,
  `resp_type_itr1` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `influencers_deeplink`
--

DROP TABLE IF EXISTS `influencers_deeplink`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `influencers_deeplink` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coupon_code` varchar(100) DEFAULT NULL,
  `deeplink` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `instructor_wishlist`
--

DROP TABLE IF EXISTS `instructor_wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `instructor_wishlist` (
  `instructor_wishlist_id` int(11) NOT NULL AUTO_INCREMENT,
  `instructor_id` varchar(255) NOT NULL,
  `course_id` varchar(255) NOT NULL,
  PRIMARY KEY (`instructor_wishlist_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `instructors`
--

DROP TABLE IF EXISTS `instructors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `instructors` (
  `instructor_id` int(255) NOT NULL AUTO_INCREMENT,
  `instructor_name` varchar(255) NOT NULL,
  `instructor_email` varchar(255) NOT NULL,
  `instructor_mobile` varchar(255) NOT NULL,
  `instructor_gender` varchar(255) NOT NULL,
  `instructor_pincode` varchar(255) NOT NULL,
  `instructor_referral_code` varchar(255) NOT NULL,
  `instructor_qualification_1` varchar(255) NOT NULL,
  `instructor_current_job` varchar(255) NOT NULL,
  `instructor_facility` enum('yes','no') NOT NULL,
  `instructor_subject` int(255) NOT NULL,
  `instructor_subject_grade_level` int(55) NOT NULL COMMENT 'class id',
  PRIMARY KEY (`instructor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `intern_edited_ocr`
--

DROP TABLE IF EXISTS `intern_edited_ocr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `intern_edited_ocr` (
  `question_id` int(11) NOT NULL,
  `edited_ocr` varchar(255) NOT NULL,
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `intern_matches`
--

DROP TABLE IF EXISTS `intern_matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `intern_matches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `intern_id` int(11) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `matched_to` int(11) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1483 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `internal_all_subsctiptions`
--

DROP TABLE IF EXISTS `internal_all_subsctiptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `internal_all_subsctiptions` (
  `mobile` varchar(10) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `user_name` varchar(50) NOT NULL,
  `created_by` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_processed` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`mobile`),
  UNIQUE KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `internal_subscription`
--

DROP TABLE IF EXISTS `internal_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `internal_subscription` (
  `student_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` enum('INTERNAL','SALES','INVESTOR','','STUDIO OPS') DEFAULT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `internet_experts`
--

DROP TABLE IF EXISTS `internet_experts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `internet_experts` (
  `iexpert_id` int(11) NOT NULL AUTO_INCREMENT,
  `expert_name` varchar(32) DEFAULT NULL,
  `expert_email` varchar(100) DEFAULT NULL,
  `hashed_password` varchar(64) DEFAULT NULL,
  `expert_dob` date DEFAULT NULL,
  `expert_mobile` varchar(14) DEFAULT NULL,
  `expert_whatsapp` varchar(14) DEFAULT NULL,
  `expert_img` varchar(64) DEFAULT NULL,
  `degree1_college` varchar(128) DEFAULT NULL,
  `degree1` varchar(32) DEFAULT NULL,
  `degree1_dept` varchar(32) DEFAULT NULL,
  `degree1_year` int(11) DEFAULT NULL,
  `degree1_marks` varchar(8) DEFAULT NULL,
  `degree2_college` varchar(64) DEFAULT NULL,
  `degree2` varchar(32) DEFAULT NULL,
  `degree2_dept` varchar(32) DEFAULT NULL,
  `degree2_year` varchar(5) DEFAULT NULL,
  `degree2_marks` varchar(8) DEFAULT NULL,
  `x_from` varchar(64) DEFAULT NULL,
  `x_marks` varchar(8) DEFAULT NULL,
  `xii_from` varchar(64) DEFAULT NULL,
  `xii_marks` varchar(8) DEFAULT NULL,
  `xii_coaching` varchar(64) DEFAULT NULL,
  `expertise_chapters` text,
  `jee_year` int(11) DEFAULT NULL,
  `jee_advanced_air` int(11) DEFAULT NULL,
  `jee_mains_air` int(11) DEFAULT NULL,
  `jee_cat` varchar(10) DEFAULT NULL,
  `expert_status` tinyint(4) DEFAULT '0',
  `verification_code` varchar(6) DEFAULT NULL,
  `mobile_verified` tinyint(4) DEFAULT '0',
  `reset_code` varchar(255) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_password_changed` tinyint(1) DEFAULT '0',
  `is_approve` tinyint(4) DEFAULT NULL,
  `bank_name` varchar(64) DEFAULT NULL,
  `bank_account_number` varchar(20) DEFAULT NULL,
  `ifsc_code` varchar(16) DEFAULT NULL,
  `aadhar_number` varchar(12) DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `last_login` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `inHouse` tinyint(4) NOT NULL DEFAULT '0',
  `mc_expert` int(11) DEFAULT NULL,
  `is_intern` int(12) NOT NULL DEFAULT '0',
  `is_vendor` int(11) NOT NULL DEFAULT '0',
  `sales_role_flag` smallint(2) DEFAULT '0',
  `agent_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`iexpert_id`),
  KEY `sales_role_flag` (`sales_role_flag`)
) ENGINE=InnoDB AUTO_INCREMENT=19773 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `interns`
--

DROP TABLE IF EXISTS `interns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `interns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) DEFAULT NULL,
  `email` varchar(32) DEFAULT NULL,
  `hashed_password` varchar(64) DEFAULT NULL,
  `phone` varchar(14) DEFAULT NULL,
  `isActive` tinyint(4) DEFAULT '1',
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `interview`
--

DROP TABLE IF EXISTS `interview`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `interview` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL,
  `slot_alloted_display_text` varchar(200) DEFAULT NULL,
  `slot_start_time` timestamp NULL DEFAULT NULL,
  `slot_end_time` timestamp NULL DEFAULT NULL,
  `progress_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`student_id`,`test_id`),
  UNIQUE KEY `id` (`id`),
  KEY `progress_id` (`progress_id`)
) ENGINE=InnoDB AUTO_INCREMENT=261 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invalid_payments`
--

DROP TABLE IF EXISTS `invalid_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invalid_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_info_id` int(11) DEFAULT NULL,
  `partner_txn_id` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jeemain20_marksheet_upload`
--

DROP TABLE IF EXISTS `jeemain20_marksheet_upload`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jeemain20_marksheet_upload` (
  `student_id` int(11) NOT NULL,
  `upload_url` varchar(300) NOT NULL,
  `message` varchar(500) NOT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `language_code_mapping`
--

DROP TABLE IF EXISTS `language_code_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `language_code_mapping` (
  `lang_code` varchar(10) NOT NULL,
  `lang_name` varchar(100) NOT NULL,
  PRIMARY KEY (`lang_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `language_mapping`
--

DROP TABLE IF EXISTS `language_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `language_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lang_code` varchar(11) NOT NULL,
  `lang_name` varchar(60) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `language_translation`
--

DROP TABLE IF EXISTS `language_translation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `language_translation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(100) NOT NULL,
  `column_name` varchar(100) NOT NULL,
  `locale` varchar(45) NOT NULL,
  `row_id` int(11) NOT NULL,
  `translation` varchar(500) NOT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lt_table_name_idx` (`table_name`),
  KEY `lt_row_id_idx` (`row_id`),
  KEY `is_active` (`is_active`),
  KEY `translation` (`translation`),
  KEY `column_name` (`column_name`),
  KEY `locale` (`locale`)
) ENGINE=InnoDB AUTO_INCREMENT=65270 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `languages` (
  `id` int(255) NOT NULL,
  `language` varchar(300) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `icons` varchar(100) DEFAULT NULL,
  `language_display` varchar(256) DEFAULT NULL,
  `language_order` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `is_active` (`is_active`),
  KEY `language_order` (`language_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `last_day_liveclass_pdfs`
--

DROP TABLE IF EXISTS `last_day_liveclass_pdfs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `last_day_liveclass_pdfs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `html` text NOT NULL,
  `pdf_link` varchar(255) NOT NULL,
  `pdf_created` tinyint(255) NOT NULL DEFAULT '0',
  `notif_sent` tinyint(4) NOT NULL DEFAULT '0',
  `entity_type` varchar(50) NOT NULL DEFAULT 'LAST_DAY_CLASSES',
  PRIMARY KEY (`id`),
  KEY `ldlp_assortment_id_idx` (`assortment_id`),
  KEY `ldlp_date_idx` (`date`)
) ENGINE=InnoDB AUTO_INCREMENT=27160 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `library_parent_child_mapping`
--

DROP TABLE IF EXISTS `library_parent_child_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `library_parent_child_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(100) DEFAULT NULL,
  `parent_id` bigint(10) DEFAULT NULL,
  `child_id` bigint(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lpcm_parent_idx` (`parent_id`),
  KEY `lpcm_child_idx` (`child_id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `library_playlist_ccm_mapping`
--

DROP TABLE IF EXISTS `library_playlist_ccm_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `library_playlist_ccm_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `library_playlists_ccm_mapping`
--

DROP TABLE IF EXISTS `library_playlists_ccm_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `library_playlists_ccm_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `class` int(11) DEFAULT NULL,
  `ccm_id` int(11) DEFAULT NULL,
  `playlist_id` int(11) DEFAULT NULL,
  `locale` varchar(25) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `class` (`class`),
  KEY `ccm_id` (`ccm_id`),
  KEY `is_active` (`is_active`),
  KEY `locale` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `library_tree`
--

DROP TABLE IF EXISTS `library_tree`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `library_tree` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_id` int(11) NOT NULL,
  `name_tree` varchar(500) NOT NULL,
  `resource_type` varchar(8) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `first_id` (`first_id`,`name_tree`),
  KEY `resource_type` (`resource_type`)
) ENGINE=InnoDB AUTO_INCREMENT=13506 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `library_tree_20200702`
--

DROP TABLE IF EXISTS `library_tree_20200702`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `library_tree_20200702` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_id` int(11) NOT NULL,
  `last_id` int(11) NOT NULL,
  `name_tree` varchar(500) NOT NULL,
  `resource_type` varchar(8) NOT NULL,
  `resource_path` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=199 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `library_tree_20210307`
--

DROP TABLE IF EXISTS `library_tree_20210307`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `library_tree_20210307` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_id` int(11) NOT NULL,
  `name_tree` varchar(500) NOT NULL,
  `resource_type` varchar(8) NOT NULL,
  `resource_path` text,
  `last_id` int(11) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `first_id` (`first_id`,`name_tree`,`resource_type`)
) ENGINE=InnoDB AUTO_INCREMENT=28747 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `library_tree_20210324`
--

DROP TABLE IF EXISTS `library_tree_20210324`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `library_tree_20210324` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_id` int(11) NOT NULL,
  `name_tree` varchar(500) NOT NULL,
  `resource_type` varchar(8) NOT NULL,
  `resource_path` text,
  `last_id` int(11) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `first_id` (`first_id`,`name_tree`,`resource_type`)
) ENGINE=InnoDB AUTO_INCREMENT=1484 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `library_tree_new`
--

DROP TABLE IF EXISTS `library_tree_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `library_tree_new` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_id` int(11) NOT NULL,
  `name_tree` varchar(500) NOT NULL,
  `resource_type` varchar(8) NOT NULL,
  `resource_path` text,
  PRIMARY KEY (`id`),
  KEY `first_id` (`first_id`,`name_tree`,`resource_type`)
) ENGINE=InnoDB AUTO_INCREMENT=17912 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_formula`
--

DROP TABLE IF EXISTS `list_formula`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `list_formula` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `chapter` varchar(100) NOT NULL,
  `formula` text NOT NULL,
  `is_active` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1469 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `listing_page_content`
--

DROP TABLE IF EXISTS `listing_page_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `listing_page_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `topic` varchar(255) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `exercise` varchar(255) DEFAULT NULL,
  `subtopic` varchar(255) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `heading` varchar(255) NOT NULL,
  `content` longtext,
  `chapter_order` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `topic` (`topic`),
  KEY `class` (`class`),
  KEY `chapter` (`chapter`),
  KEY `exercise` (`exercise`),
  KEY `subtopic` (`subtopic`),
  KEY `year` (`year`)
) ENGINE=InnoDB AUTO_INCREMENT=393 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_class_daily_thumbnail`
--

DROP TABLE IF EXISTS `live_class_daily_thumbnail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_class_daily_thumbnail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` bigint(20) NOT NULL,
  `png_link` varchar(255) NOT NULL,
  `webp_link` varchar(255) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6264 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_class_notification_records`
--

DROP TABLE IF EXISTS `live_class_notification_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_class_notification_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=742936 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_class_old_thumbnail`
--

DROP TABLE IF EXISTS `live_class_old_thumbnail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_class_old_thumbnail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` bigint(20) NOT NULL,
  `png_link` varchar(255) NOT NULL,
  `webp_link` varchar(255) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2114 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_classes_user_code`
--

DROP TABLE IF EXISTS `live_classes_user_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_classes_user_code` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `locale` varchar(20) NOT NULL,
  `subject` varchar(50) NOT NULL,
  `exam` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_classes_user_code_student_mapping`
--

DROP TABLE IF EXISTS `live_classes_user_code_student_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_classes_user_code_student_mapping` (
  `student_id` int(11) NOT NULL DEFAULT '0',
  `user_code` int(11) NOT NULL DEFAULT '0',
  `chapter` varchar(200) DEFAULT NULL,
  `chapter_class` varchar(30) DEFAULT NULL,
  `microconcept` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`),
  KEY `user_code` (`user_code`),
  KEY `updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_broadcasts_templates`
--

DROP TABLE IF EXISTS `liveclass_broadcasts_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_broadcasts_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` text CHARACTER SET utf8mb4 NOT NULL,
  `tag` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_class_notes`
--

DROP TABLE IF EXISTS `liveclass_class_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_class_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `chapter_order` int(11) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `content_type` varchar(20) NOT NULL,
  `section` varchar(255) DEFAULT NULL,
  `subsection` varchar(255) DEFAULT NULL,
  `notes_text` text,
  `solution_text` text,
  `question_list` text,
  `chapter_english` varchar(500) DEFAULT NULL,
  `subject_english` varchar(50) DEFAULT NULL,
  `content_order` int(11) NOT NULL,
  `exam_board` varchar(100) NOT NULL,
  `language` varchar(20) NOT NULL DEFAULT 'hindi',
  PRIMARY KEY (`id`),
  KEY `class` (`class`),
  KEY `subject` (`subject`),
  KEY `chapter` (`chapter`),
  KEY `content_type` (`content_type`),
  KEY `section` (`section`),
  KEY `subsection` (`subsection`),
  KEY `chapter_english` (`chapter_english`),
  KEY `subject_english` (`subject_english`)
) ENGINE=InnoDB AUTO_INCREMENT=16800 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_class_notes_2`
--

DROP TABLE IF EXISTS `liveclass_class_notes_2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_class_notes_2` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `chapter_order` int(11) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `content_type` varchar(20) NOT NULL,
  `section` varchar(255) DEFAULT NULL,
  `subsection` varchar(255) DEFAULT NULL,
  `notes_text` text,
  `solution_text` text,
  `question_list` text,
  `chapter_english` varchar(500) DEFAULT NULL,
  `subject_english` varchar(50) DEFAULT NULL,
  `content_order` int(11) NOT NULL,
  `exam_board` varchar(100) NOT NULL,
  `language` varchar(20) NOT NULL DEFAULT 'hindi',
  `faculty_id` int(11) NOT NULL,
  `faculty_name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `class` (`class`,`subject`,`chapter_order`,`exam_board`,`language`)
) ENGINE=InnoDB AUTO_INCREMENT=153958 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_class_notes_tracker`
--

DROP TABLE IF EXISTS `liveclass_class_notes_tracker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_class_notes_tracker` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `subject_english` varchar(50) NOT NULL,
  `chapter_order` int(11) NOT NULL,
  `chapter_english` varchar(500) DEFAULT NULL,
  `language` varchar(20) NOT NULL DEFAULT 'hindi',
  `is_done` int(1) NOT NULL DEFAULT '0',
  `filename` varchar(1000) DEFAULT NULL,
  `key_id` varchar(1000) DEFAULT NULL,
  `theory_location` varchar(1000) DEFAULT NULL,
  `exercises_location` varchar(1000) DEFAULT NULL,
  `ncert_location` varchar(1000) DEFAULT NULL,
  `exam_board` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `filename` (`filename`),
  KEY `is_done` (`is_done`),
  KEY `key_id` (`key_id`),
  KEY `exam_board` (`exam_board`)
) ENGINE=InnoDB AUTO_INCREMENT=836 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_class_notes_tracker_2`
--

DROP TABLE IF EXISTS `liveclass_class_notes_tracker_2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_class_notes_tracker_2` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `subject_english` varchar(50) NOT NULL,
  `chapter_order` int(11) NOT NULL,
  `chapter_english` varchar(500) DEFAULT NULL,
  `language` varchar(20) NOT NULL DEFAULT 'hindi',
  `is_done` int(1) NOT NULL DEFAULT '0',
  `filename` varchar(1000) DEFAULT NULL,
  `key_id` varchar(1000) DEFAULT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `faculty_name` varchar(100) DEFAULT NULL,
  `exam_board` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `exam_board` (`exam_board`)
) ENGINE=InnoDB AUTO_INCREMENT=2085 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_comment_timeouts`
--

DROP TABLE IF EXISTS `liveclass_comment_timeouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_comment_timeouts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14266 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_course`
--

DROP TABLE IF EXISTS `liveclass_course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_course` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` varchar(100) DEFAULT NULL,
  `banner` varchar(100) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `header_image` varchar(500) NOT NULL,
  `locale` varchar(800) NOT NULL DEFAULT '',
  `class` int(11) NOT NULL,
  `course_order` int(11) NOT NULL,
  `ecm_id` int(11) NOT NULL,
  `ecm_display` varchar(100) DEFAULT NULL,
  `course_type` varchar(25) DEFAULT NULL,
  `is_live` int(11) DEFAULT NULL,
  `image_title` varchar(25) DEFAULT NULL,
  `bottom_subtitle` varchar(50) DEFAULT NULL,
  `faculty_avatars` varchar(2000) DEFAULT NULL,
  `is_old` int(11) NOT NULL DEFAULT '1',
  `package_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `is_free` int(11) DEFAULT '0',
  `is_show` varchar(50) DEFAULT 'all',
  `home_carousel_title` varchar(100) DEFAULT NULL,
  `timetable` varchar(200) DEFAULT NULL,
  `intro_video` varchar(100) DEFAULT NULL,
  `course_board` varchar(20) DEFAULT NULL,
  `course_exam` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`,`class`,`ecm_id`),
  KEY `ecmId` (`ecm_id`) USING BTREE,
  KEY `liveclass_course_course_type_IDX` (`course_type`) USING BTREE,
  KEY `is_live` (`is_live`),
  KEY `idx_ecm_id_class` (`ecm_id`,`class`)
) ENGINE=InnoDB AUTO_INCREMENT=597 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_course_details`
--

DROP TABLE IF EXISTS `liveclass_course_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_course_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liveclass_course_id` int(11) NOT NULL DEFAULT '0',
  `subject` varchar(255) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `live_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_free` tinyint(1) DEFAULT '0',
  `master_chapter` varchar(500) DEFAULT NULL,
  `course_type` varchar(50) DEFAULT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `is_replay` tinyint(1) DEFAULT '0',
  `batch_id` int(10) NOT NULL DEFAULT '1',
  `lecture_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subject` (`subject`),
  KEY `live_at` (`live_at`),
  KEY `class` (`class`),
  KEY `is_free` (`is_free`),
  KEY `idx_liveclass_course_id` (`liveclass_course_id`),
  KEY `idx_liveclass_course_id_subject` (`liveclass_course_id`,`subject`)
) ENGINE=InnoDB AUTO_INCREMENT=395234 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_course_details_bk`
--

DROP TABLE IF EXISTS `liveclass_course_details_bk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_course_details_bk` (
  `id` int(11) NOT NULL,
  `liveclass_course_id` int(11) NOT NULL DEFAULT '0',
  `subject` varchar(20) DEFAULT NULL,
  `chapter` varchar(100) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `live_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_free` tinyint(1) DEFAULT '0',
  `master_chapter` varchar(500) DEFAULT NULL,
  `course_type` varchar(50) DEFAULT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `is_replay` tinyint(1) DEFAULT '0',
  KEY `subject` (`subject`),
  KEY `live_at` (`live_at`),
  KEY `class` (`class`),
  KEY `is_free` (`is_free`),
  KEY `id` (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_course_resources`
--

DROP TABLE IF EXISTS `liveclass_course_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_course_resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liveclass_course_id` int(11) NOT NULL DEFAULT '0',
  `liveclass_course_detail_id` int(11) NOT NULL DEFAULT '0',
  `subject` varchar(255) DEFAULT NULL,
  `resource_reference` varchar(255) DEFAULT NULL,
  `topic` varchar(255) NOT NULL,
  `expert_name` varchar(50) DEFAULT NULL,
  `expert_image` varchar(100) DEFAULT NULL,
  `q_order` int(4) DEFAULT NULL,
  `resource_type` tinyint(4) NOT NULL,
  `class` int(11) DEFAULT NULL,
  `player_type` varchar(255) NOT NULL,
  `meta_info` varchar(255) DEFAULT NULL,
  `tags` varchar(2000) DEFAULT NULL,
  `title` varchar(1000) DEFAULT NULL,
  `is_processed` int(11) DEFAULT '0',
  `is_resource_created` int(11) DEFAULT '0',
  `lecture_type` varchar(50) DEFAULT NULL,
  `batch_id` int(11) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `resource_reference` (`resource_reference`),
  KEY `resource_type` (`resource_type`) USING BTREE,
  KEY `liveclass_course_detail_id` (`liveclass_course_detail_id`) USING BTREE,
  KEY `idx_liveclass_course_resources_class` (`class`),
  KEY `expert_name` (`expert_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1390533 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_course_resources_bk`
--

DROP TABLE IF EXISTS `liveclass_course_resources_bk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_course_resources_bk` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liveclass_course_id` int(11) NOT NULL DEFAULT '0',
  `liveclass_course_detail_id` int(11) NOT NULL DEFAULT '0',
  `subject` varchar(20) DEFAULT NULL,
  `resource_reference` varchar(200) DEFAULT NULL,
  `topic` varchar(255) NOT NULL,
  `expert_name` varchar(50) DEFAULT NULL,
  `expert_image` varchar(100) DEFAULT NULL,
  `q_order` int(4) DEFAULT NULL,
  `resource_type` tinyint(4) NOT NULL,
  `class` int(11) DEFAULT NULL,
  `player_type` varchar(255) NOT NULL,
  `meta_info` varchar(255) DEFAULT NULL,
  `tags` varchar(2000) DEFAULT NULL,
  `title` varchar(1000) DEFAULT NULL,
  `is_migrated` int(11) NOT NULL DEFAULT '0',
  `is_duplicate` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `is_migrated` (`is_migrated`),
  KEY `is_duplicate` (`is_duplicate`)
) ENGINE=InnoDB AUTO_INCREMENT=139923 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_courses`
--

DROP TABLE IF EXISTS `liveclass_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_detail_faculty_mapping`
--

DROP TABLE IF EXISTS `liveclass_detail_faculty_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_detail_faculty_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `detail_id` int(100) DEFAULT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `detail_id` (`detail_id`,`faculty_id`),
  KEY `faculty_id` (`faculty_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=230468 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_faculty_timetable`
--

DROP TABLE IF EXISTS `liveclass_faculty_timetable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_faculty_timetable` (
  `faculty_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `subject_fac` varchar(50) NOT NULL,
  `class` int(11) NOT NULL,
  `days_class` varchar(100) NOT NULL,
  `time_hours` int(11) NOT NULL,
  `time_pm` varchar(20) NOT NULL,
  `subject_class` varchar(50) NOT NULL,
  `days_class_all` varchar(100) DEFAULT NULL,
  `locale` varchar(20) NOT NULL,
  `subject_local` varchar(100) NOT NULL,
  `class_local` varchar(50) NOT NULL,
  PRIMARY KEY (`faculty_id`,`course_id`,`class`,`days_class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_feedback`
--

DROP TABLE IF EXISTS `liveclass_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `subtitle` varchar(2000) CHARACTER SET utf8mb4 DEFAULT NULL,
  `star_rating` int(11) DEFAULT NULL,
  `options` text CHARACTER SET utf8mb4,
  `options_show_textbox` text,
  `show_textbox` int(11) DEFAULT NULL,
  `is_active` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `locale` varchar(45) DEFAULT 'en',
  `textbox_title` varchar(255) DEFAULT NULL,
  `et_from` int(11) DEFAULT NULL,
  `et_to` int(11) DEFAULT NULL,
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `text_cue` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `version_code` (`min_version_code`,`max_version_code`),
  KEY `et_from` (`et_from`),
  KEY `et_to` (`et_to`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_feedback_response`
--

DROP TABLE IF EXISTS `liveclass_feedback_response`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_feedback_response` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `detail_id` varchar(45) DEFAULT NULL,
  `star_rating` int(11) NOT NULL,
  `options` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `review` varchar(255) DEFAULT NULL,
  `Is_active` tinyint(4) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `engage_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index2` (`student_id`,`detail_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2387351 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_homework`
--

DROP TABLE IF EXISTS `liveclass_homework`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_homework` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liveclass_detail_id` int(11) NOT NULL,
  `hw_type` varchar(20) NOT NULL,
  `question_list` varchar(5000) NOT NULL,
  `location` varchar(1000) DEFAULT NULL,
  `hw_status` int(11) NOT NULL DEFAULT '0',
  `new_location` varchar(500) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `metainfo` varchar(255) NOT NULL DEFAULT 'HOMEWORK',
  `batch_id` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `liveclass_detail_id_2` (`liveclass_detail_id`,`question_id`,`metainfo`,`batch_id`),
  KEY `liveclass_detail_id` (`liveclass_detail_id`),
  KEY `question_id` (`question_id`),
  KEY `question_list` (`question_list`(1024)),
  KEY `hw_type` (`hw_type`),
  KEY `batch_id` (`batch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2365983 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_homework_response`
--

DROP TABLE IF EXISTS `liveclass_homework_response`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_homework_response` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(100) DEFAULT NULL,
  `homework_resource_id` int(11) DEFAULT NULL,
  `resource_reference` int(11) DEFAULT NULL,
  `quiz_question_id` int(11) DEFAULT NULL,
  `option_id` varchar(11) DEFAULT NULL,
  `is_correct` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`,`resource_reference`,`quiz_question_id`),
  KEY `liveclass_homework_response_homework_resource_id` (`homework_resource_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13303115 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_homework_temp`
--

DROP TABLE IF EXISTS `liveclass_homework_temp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_homework_temp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liveclass_detail_id` int(11) NOT NULL,
  `hw_type` varchar(20) NOT NULL,
  `question_list` varchar(5000) NOT NULL,
  `location` varchar(1000) DEFAULT NULL,
  `hw_status` int(11) NOT NULL DEFAULT '0',
  `new_location` varchar(500) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `metainfo` varchar(255) NOT NULL DEFAULT 'HOMEWORK',
  `batch_id` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `liveclass_detail_id_2` (`liveclass_detail_id`,`question_id`,`metainfo`,`batch_id`),
  KEY `liveclass_detail_id` (`liveclass_detail_id`),
  KEY `question_id` (`question_id`),
  KEY `question_list` (`question_list`(1024)),
  KEY `hw_type` (`hw_type`),
  KEY `batch_id` (`batch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=58635 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_inactive_views_stats`
--

DROP TABLE IF EXISTS `liveclass_inactive_views_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_inactive_views_stats` (
  `question_id` int(255) DEFAULT NULL,
  `student_id` int(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `view_from` varchar(255) DEFAULT NULL,
  `view_uuid` varchar(255) NOT NULL,
  PRIMARY KEY (`view_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_poll_response`
--

DROP TABLE IF EXISTS `liveclass_poll_response`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_poll_response` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liveclass_publish_id` int(11) NOT NULL,
  `poll_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submit_option` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lcpr_unique` (`liveclass_publish_id`,`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3776609 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_polls`
--

DROP TABLE IF EXISTS `liveclass_polls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_polls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` text CHARACTER SET utf8mb4,
  `options` text CHARACTER SET utf8mb4,
  `tag` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `is_active` tinyint(4) NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `show_result` tinyint(4) NOT NULL DEFAULT '1',
  `category` enum('GEN','NONGEN') NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `language` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_2` (`id`,`tag`,`is_active`,`created_at`,`category`)
) ENGINE=InnoDB AUTO_INCREMENT=330 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_publish`
--

DROP TABLE IF EXISTS `liveclass_publish`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_publish` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `detail_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `info` text CHARACTER SET utf8mb4 NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=87037 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_quiz_logs`
--

DROP TABLE IF EXISTS `liveclass_quiz_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_quiz_logs` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `resource_id` int(11) DEFAULT NULL,
  `resource_detail_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `detail_id` int(11) DEFAULT NULL,
  `liveclass_resource_id` int(11) DEFAULT NULL,
  `quiz_resource_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `resource_id_2` (`resource_id`,`liveclass_resource_id`,`quiz_resource_id`)
) ENGINE=InnoDB AUTO_INCREMENT=91129 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_quiz_response`
--

DROP TABLE IF EXISTS `liveclass_quiz_response`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_quiz_response` (
  `resource_reference` int(11) NOT NULL,
  `quiz_question_id` int(11) NOT NULL,
  `option_id` varchar(50) NOT NULL,
  `student_id` int(11) NOT NULL,
  `is_correct` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `detail_id` int(11) DEFAULT NULL,
  `resource_detail_id` int(11) DEFAULT NULL,
  `points` int(11) DEFAULT '0',
  `is_live` tinyint(4) DEFAULT NULL,
  `version_code` int(11) DEFAULT NULL,
  UNIQUE KEY `liveclass_id` (`resource_reference`,`quiz_question_id`,`student_id`),
  KEY `detail_id` (`detail_id`),
  KEY `resource_detail_id` (`resource_detail_id`),
  KEY `created_at` (`created_at`),
  KEY `student_id` (`student_id`),
  KEY `version_code` (`version_code`),
  KEY `is_correct` (`is_correct`),
  KEY `is_live` (`is_live`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_resource_chapter`
--

DROP TABLE IF EXISTS `liveclass_resource_chapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_resource_chapter` (
  `detail_id` int(11) NOT NULL,
  `chapter_id` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`detail_id`,`chapter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_schedule_202106`
--

DROP TABLE IF EXISTS `liveclass_schedule_202106`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_schedule_202106` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_type` varchar(100) NOT NULL,
  `class_type` varchar(100) NOT NULL,
  `category_type` varchar(200) NOT NULL,
  `is_free` int(11) NOT NULL,
  `year_exam` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `meta_info` varchar(50) NOT NULL,
  `week_day` varchar(50) NOT NULL,
  `schedule_time` time NOT NULL,
  `subject` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `course_type` (`course_type`,`class_type`,`category_type`,`is_free`,`year_exam`,`class`,`meta_info`)
) ENGINE=InnoDB AUTO_INCREMENT=489 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_schedule_all`
--

DROP TABLE IF EXISTS `liveclass_schedule_all`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_schedule_all` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `assortment_type` varchar(100) NOT NULL,
  `display_name` varchar(500) NOT NULL,
  `category` varchar(100) NOT NULL,
  `course_type` varchar(100) NOT NULL,
  `class_type` varchar(100) NOT NULL,
  `category_type` varchar(200) NOT NULL,
  `is_free` int(11) NOT NULL,
  `year_exam` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `meta_info` varchar(50) NOT NULL,
  `week_day` varchar(50) NOT NULL,
  `schedule_time` time NOT NULL,
  `subject` varchar(100) NOT NULL,
  `subject_display_name` varchar(100) DEFAULT NULL,
  `week_day_num` int(11) DEFAULT NULL,
  `course_details_deeplink` varchar(200) DEFAULT NULL,
  `subject_name_localised` varchar(200) NOT NULL,
  `group_week_days` varchar(50) DEFAULT NULL,
  `slot_number` int(11) NOT NULL DEFAULT '0',
  `class_duration` int(11) NOT NULL DEFAULT '60',
  `calendar_link` varchar(2000) DEFAULT NULL,
  `calendar_title` varchar(200) DEFAULT NULL,
  `calendar_description` varchar(1000) DEFAULT NULL,
  `calendar_start_time` varchar(15) DEFAULT NULL,
  `calendar_end_time` varchar(15) DEFAULT NULL,
  `calendar_until` varchar(8) DEFAULT NULL,
  `pdf_url` varchar(2000) DEFAULT NULL,
  `post_purchase_pdf_url` varchar(1000) DEFAULT NULL,
  `batch_id` int(11) NOT NULL DEFAULT '1',
  `is_active` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `course_type` (`assortment_id`,`assortment_type`,`category`,`course_type`,`class_type`,`category_type`,`is_free`,`year_exam`,`class`,`meta_info`),
  KEY `subject` (`subject`,`subject_display_name`,`subject_name_localised`),
  KEY `batch_id` (`batch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=212721 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_schedule_all_batch_mapping`
--

DROP TABLE IF EXISTS `liveclass_schedule_all_batch_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_schedule_all_batch_mapping` (
  `primary_assortment_id` int(11) NOT NULL,
  `secondary_assortment_id` int(11) NOT NULL,
  `cd_deeplink` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_stream`
--

DROP TABLE IF EXISTS `liveclass_stream`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_stream` (
  `detail_id` int(255) NOT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `push_url` varchar(255) DEFAULT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`detail_id`),
  KEY `is_active` (`is_active`),
  KEY `faculty_id` (`faculty_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_subscribers`
--

DROP TABLE IF EXISTS `liveclass_subscribers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_subscribers` (
  `resource_reference` int(255) NOT NULL,
  `student_id` int(11) NOT NULL,
  `engage_time` int(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `detail_id` int(15) DEFAULT NULL,
  `is_interested` tinyint(1) DEFAULT NULL,
  `is_view` tinyint(1) DEFAULT NULL,
  `version_code` int(50) DEFAULT NULL,
  `is_pushed` tinyint(4) DEFAULT NULL,
  `is_live` tinyint(4) DEFAULT NULL,
  `live_at` timestamp NULL DEFAULT NULL,
  UNIQUE KEY `live_class_id` (`resource_reference`,`student_id`),
  UNIQUE KEY `resource_reference` (`resource_reference`,`student_id`,`is_pushed`),
  KEY `version_code` (`version_code`),
  KEY `is_pushed` (`is_pushed`),
  KEY `liveclass_subscribers_student_id_IDX` (`student_id`) USING BTREE,
  KEY `live_at` (`live_at`),
  KEY `is_interested` (`is_interested`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_team`
--

DROP TABLE IF EXISTS `liveclass_team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_team` (
  `mobile` varchar(10) NOT NULL,
  `type` varchar(50) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_trending_lectures`
--

DROP TABLE IF EXISTS `liveclass_trending_lectures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_trending_lectures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` varchar(100) DEFAULT NULL,
  `ecm_id` int(11) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `resource_type` int(11) DEFAULT NULL,
  `player_type` varchar(100) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `video_time` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `liveclass_trending_lectures_course_id_IDX` (`course_id`) USING BTREE,
  KEY `liveclass_trending_lectures_ecm_id_IDX` (`ecm_id`) USING BTREE,
  KEY `liveclass_trending_lectures_subject_IDX` (`subject`) USING BTREE,
  KEY `liveclass_trending_lectures_question_id_IDX` (`question_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=703 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_video_caraousel`
--

DROP TABLE IF EXISTS `liveclass_video_caraousel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_video_caraousel` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  `q_order` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `liveclass_yt_deeplinks`
--

DROP TABLE IF EXISTS `liveclass_yt_deeplinks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `liveclass_yt_deeplinks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `liveclass_course_id` int(11) NOT NULL,
  `course_assortment_id` int(11) NOT NULL,
  `subject_ass_id` int(11) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `chapter_ass_id` int(11) NOT NULL,
  `chapter_name` varchar(255) NOT NULL,
  `video_ass_id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `resource_type` int(11) NOT NULL,
  `topic` varchar(255) NOT NULL,
  `name` varchar(1000) NOT NULL,
  `expert_name` varchar(255) NOT NULL,
  `faculty_id` int(11) NOT NULL,
  `deeplink` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `liveclass_course_id` (`liveclass_course_id`,`course_assortment_id`,`subject_ass_id`,`subject_name`,`chapter_ass_id`,`chapter_name`,`resource_id`,`question_id`,`resource_type`,`topic`),
  KEY `deeplink` (`deeplink`),
  KEY `faculty_id` (`faculty_id`),
  KEY `expert_name` (`expert_name`)
) ENGINE=InnoDB AUTO_INCREMENT=24797 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `localised_strings`
--

DROP TABLE IF EXISTS `localised_strings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `localised_strings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `english` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `bengali` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `gujarati` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `hindi` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `kannada` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `malayalam` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `marathi` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `nepali` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `punjabi` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `tamil` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `telugu` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `urdu` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `localized_RDS_chapter`
--

DROP TABLE IF EXISTS `localized_RDS_chapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `localized_RDS_chapter` (
  `class` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `chapter_english` varchar(1000) NOT NULL,
  `chapter_hindi` varchar(5000) NOT NULL,
  KEY `class` (`class`),
  KEY `chapter_english` (`chapter_english`),
  KEY `chapter_hindi` (`chapter_hindi`(1024))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `localized_app_strings`
--

DROP TABLE IF EXISTS `localized_app_strings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `localized_app_strings` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `key_name` varchar(255) NOT NULL,
  `key_value` varchar(255) NOT NULL,
  `english` varchar(255) DEFAULT NULL,
  `to_translate` int(55) NOT NULL,
  `hindi` varchar(255) DEFAULT NULL,
  `bengali` varchar(255) DEFAULT NULL,
  `gujarati` varchar(255) DEFAULT NULL,
  `kannada` varchar(255) DEFAULT NULL,
  `malayalam` varchar(255) DEFAULT NULL,
  `marathi` varchar(255) DEFAULT NULL,
  `nepali` varchar(255) DEFAULT NULL,
  `punjabi` varchar(255) DEFAULT NULL,
  `Tamil` varchar(255) DEFAULT NULL,
  `Telugu` varchar(255) DEFAULT NULL,
  `Urdu` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=218 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `localized_chapter`
--

DROP TABLE IF EXISTS `localized_chapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `localized_chapter` (
  `class` int(55) NOT NULL,
  `course` varchar(255) NOT NULL,
  `chapter_order` int(55) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `english` varchar(255) DEFAULT NULL,
  `hindi` varchar(255) DEFAULT NULL,
  `bengali` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `gujarati` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `kannada` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `malayalam` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `marathi` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `nepali` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `punjabi` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `Tamil` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `Telugu` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `Urdu` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  UNIQUE KEY `class` (`class`,`course`,`chapter_order`),
  KEY `chapter` (`chapter`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `localized_mc_course_mapping`
--

DROP TABLE IF EXISTS `localized_mc_course_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `localized_mc_course_mapping` (
  `mc_id` varchar(10) NOT NULL,
  `class` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `subject_hindi` varchar(255) NOT NULL,
  `chapter` varchar(1000) NOT NULL,
  `chapter_hindi` varchar(1000) NOT NULL,
  `subtopic` varchar(2000) NOT NULL,
  `subtopic_hindi` varchar(2000) NOT NULL,
  `mc_text` varchar(5000) NOT NULL,
  `mc_text_hindi` varchar(5000) NOT NULL,
  PRIMARY KEY (`mc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `localized_microconcepts`
--

DROP TABLE IF EXISTS `localized_microconcepts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `localized_microconcepts` (
  `mc_id` varchar(255) NOT NULL,
  `mc_text` varchar(5000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `english` varchar(5000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `hindi` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `bengali` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `gujarati` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `kannada` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `malayalam` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `marathi` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `nepali` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `punjabi` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `Tamil` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `Telugu` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `Urdu` varchar(1000) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`mc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `localized_ncert_chapter`
--

DROP TABLE IF EXISTS `localized_ncert_chapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `localized_ncert_chapter` (
  `class` int(55) NOT NULL,
  `course` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `english` varchar(255) DEFAULT NULL,
  `hindi` varchar(255) DEFAULT NULL,
  `bengali` varchar(255) DEFAULT NULL,
  `gujarati` varchar(255) DEFAULT NULL,
  `kannada` varchar(255) DEFAULT NULL,
  `malayalam` varchar(255) DEFAULT NULL,
  `marathi` varchar(255) DEFAULT NULL,
  `nepali` varchar(255) DEFAULT NULL,
  `punjabi` varchar(255) DEFAULT NULL,
  `Tamil` varchar(255) DEFAULT NULL,
  `Telugu` varchar(255) DEFAULT NULL,
  `Urdu` varchar(255) DEFAULT NULL,
  KEY `chapter` (`chapter`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `localized_questions`
--

DROP TABLE IF EXISTS `localized_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `localized_questions` (
  `question_id` int(55) NOT NULL,
  `english` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `hindi` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `bengali` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `gujarati` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `kannada` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `malayalam` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `marathi` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `nepali` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `punjabi` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `Tamil` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `Telugu` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `Urdu` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `localized_subtopic`
--

DROP TABLE IF EXISTS `localized_subtopic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `localized_subtopic` (
  `class` int(55) NOT NULL,
  `course` varchar(255) NOT NULL,
  `chapter_order` int(55) NOT NULL,
  `subtopic_order` int(55) NOT NULL,
  `subtopic` varchar(255) NOT NULL,
  `english` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `hindi` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `bengali` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `gujarati` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `kannada` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `malayalam` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `marathi` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `nepali` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `punjabi` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `Tamil` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `Telugu` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `Urdu` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  UNIQUE KEY `class` (`class`,`course`,`chapter_order`,`subtopic_order`),
  KEY `subtopic` (`subtopic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `localized_subtopic_cen`
--

DROP TABLE IF EXISTS `localized_subtopic_cen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `localized_subtopic_cen` (
  `chapter` varchar(200) NOT NULL,
  `subtopic` varchar(200) NOT NULL,
  `chapter_hindi` varchar(200) NOT NULL,
  `subtopic_hindi` varchar(200) NOT NULL,
  KEY `chapter` (`chapter`),
  KEY `subtopic` (`subtopic`),
  KEY `chapter_hindi` (`chapter_hindi`),
  KEY `subtopic_hindi` (`subtopic_hindi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `localized_subtopics_new`
--

DROP TABLE IF EXISTS `localized_subtopics_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `localized_subtopics_new` (
  `subtopic_english` varchar(2000) NOT NULL,
  `subtopic_hindi` varchar(5000) NOT NULL,
  KEY `subtopic_english` (`subtopic_english`(1024)),
  KEY `subtopic_hindi` (`subtopic_hindi`(1024))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `location_mappings`
--

DROP TABLE IF EXISTS `location_mappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `location_mappings` (
  `pincode` int(11) NOT NULL,
  `location` varchar(255) NOT NULL,
  PRIMARY KEY (`pincode`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `manual_uninstall_wa_sms`
--

DROP TABLE IF EXISTS `manual_uninstall_wa_sms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `manual_uninstall_wa_sms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uninstall_timestamp` timestamp NOT NULL,
  `student_id` bigint(20) NOT NULL,
  `qa` int(11) DEFAULT NULL,
  `et` bigint(20) DEFAULT NULL,
  `vt` bigint(20) DEFAULT NULL,
  `rank` int(11) DEFAULT NULL,
  `language` varchar(200) DEFAULT NULL,
  `mobile` varchar(50) DEFAULT NULL,
  `sent_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uninstall_timestamp` (`uninstall_timestamp`),
  KEY `student_id` (`student_id`),
  KEY `qa` (`qa`),
  KEY `et` (`et`),
  KEY `sent_date` (`sent_date`)
) ENGINE=InnoDB AUTO_INCREMENT=3262768 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mapped_icon_library`
--

DROP TABLE IF EXISTS `mapped_icon_library`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mapped_icon_library` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mapped_playlist_id` int(11) NOT NULL,
  `title` varchar(500) NOT NULL,
  `class` varchar(100) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `app_version` varchar(100) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=178 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `marketing_transaction`
--

DROP TABLE IF EXISTS `marketing_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `marketing_transaction` (
  `row` int(11) DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  `source` varchar(1000) DEFAULT NULL,
  `medium` varchar(1000) DEFAULT NULL,
  `campaign` varchar(5000) DEFAULT NULL,
  `transactionId` varchar(1000) DEFAULT NULL,
  `transactions` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_chapter_mapping`
--

DROP TABLE IF EXISTS `master_chapter_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_chapter_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `chapter` varchar(2000) NOT NULL,
  `notes_meta` varchar(2000) NOT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT '0',
  `is_processed` tinyint(4) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes_resource_ids` varchar(255) DEFAULT NULL,
  `chapter_order` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `chapter` (`chapter`(1024))
) ENGINE=InnoDB AUTO_INCREMENT=13305 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `master_microconcepts`
--

DROP TABLE IF EXISTS `master_microconcepts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_microconcepts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `microconcept` varchar(500) DEFAULT NULL,
  `is_answered` int(11) DEFAULT NULL,
  `answer_timestamp` timestamp NULL DEFAULT NULL,
  `is_reviewed` int(11) DEFAULT NULL,
  `review_rating` int(11) DEFAULT NULL,
  `expert_answer` int(11) DEFAULT NULL,
  `expert_review` int(11) DEFAULT NULL,
  `review_timestamp` timestamp NULL DEFAULT NULL,
  `answer_video` varchar(255) DEFAULT NULL,
  `youtube_id` varchar(255) DEFAULT NULL,
  `youtube_playlist_id` varchar(255) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `matched_questions`
--

DROP TABLE IF EXISTS `matched_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `matched_questions` (
  `q_id` int(11) NOT NULL,
  `matched_id` int(11) NOT NULL,
  `ocr_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `m_p` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='storage of matched questions';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mc_course_mapping`
--

DROP TABLE IF EXISTS `mc_course_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mc_course_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chapter_order` int(11) DEFAULT NULL,
  `sub_topic_order` int(11) NOT NULL,
  `micro_concept_order` int(11) NOT NULL,
  `final_order` int(11) NOT NULL,
  `mc_id` varchar(255) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `course` varchar(255) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `subtopic` varchar(255) DEFAULT NULL,
  `mc_text` varchar(1000) DEFAULT NULL,
  `active_status` int(11) NOT NULL DEFAULT '0',
  `subject` varchar(50) DEFAULT NULL,
  `key_web` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class` (`class`),
  KEY `mc_id` (`mc_id`),
  KEY `mc_text` (`mc_text`),
  KEY `course` (`course`),
  KEY `chapter` (`chapter`),
  KEY `mc_order` (`chapter_order`),
  KEY `subtopic` (`subtopic`),
  KEY `SubTopicOrder` (`sub_topic_order`),
  KEY `MicroConceptOrder` (`micro_concept_order`),
  KEY `FinalOrder` (`final_order`),
  KEY `active_status` (`active_status`),
  KEY `subject` (`subject`)
) ENGINE=InnoDB AUTO_INCREMENT=30830 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mc_question_mapping`
--

DROP TABLE IF EXISTS `mc_question_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mc_question_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mc_id` varchar(255) DEFAULT NULL,
  `class` int(11) NOT NULL,
  `course` varchar(255) DEFAULT NULL,
  `level` varchar(255) DEFAULT NULL,
  `level_name` varchar(255) DEFAULT NULL,
  `q_num` int(11) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `subtopic` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mc_id` (`mc_id`),
  KEY `course` (`course`),
  KEY `level` (`level`),
  KEY `code` (`code`),
  KEY `q_num` (`q_num`),
  KEY `question_id` (`question_id`),
  KEY `level_name` (`level_name`),
  KEY `class` (`class`)
) ENGINE=InnoDB AUTO_INCREMENT=64645 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meritnation_scrapped_questions`
--

DROP TABLE IF EXISTS `meritnation_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meritnation_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(4500) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `answer` varchar(5500) DEFAULT NULL,
  `canonical_url` varchar(5000) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54987 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `milestones`
--

DROP TABLE IF EXISTS `milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `milestones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `count` int(150) NOT NULL,
  `text` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=114229027 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `missing_answer_videos`
--

DROP TABLE IF EXISTS `missing_answer_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `missing_answer_videos` (
  `answer_video_missing` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mock_test_master_data`
--

DROP TABLE IF EXISTS `mock_test_master_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mock_test_master_data` (
  `test_id` int(11) NOT NULL,
  `paper_code` varchar(100) NOT NULL,
  `section_code` varchar(25) DEFAULT NULL,
  `q_type` varchar(25) DEFAULT NULL,
  `q_text` varchar(5000) CHARACTER SET utf8mb4 DEFAULT NULL,
  `op_1` varchar(1000) DEFAULT NULL,
  `op_2` varchar(1000) DEFAULT NULL,
  `op_3` varchar(1000) DEFAULT NULL,
  `op_4` varchar(1000) DEFAULT NULL,
  `correct_op` varchar(1000) DEFAULT NULL,
  `q_solution` varchar(5000) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `op_1_correct` int(11) DEFAULT '0',
  `op_2_correct` int(11) DEFAULT '0',
  `op_3_correct` int(11) DEFAULT '0',
  `op_4_correct` int(11) DEFAULT '0',
  `answer_type` varchar(20) NOT NULL DEFAULT 'SINGLE',
  `correct_marks` float NOT NULL DEFAULT '4',
  `incorrect_marks` float NOT NULL DEFAULT '-1',
  `all_options` varchar(2000) NOT NULL,
  `all_answers` varchar(2000) NOT NULL,
  `qid` int(11) DEFAULT NULL,
  PRIMARY KEY (`paper_code`),
  KEY `test_id` (`test_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mock_test_master_data_check`
--

DROP TABLE IF EXISTS `mock_test_master_data_check`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mock_test_master_data_check` (
  `test_id` int(11) NOT NULL,
  `paper_code` varchar(50) NOT NULL,
  `section_code` varchar(25) DEFAULT NULL,
  `q_type` varchar(25) DEFAULT NULL,
  `q_text` varchar(5000) DEFAULT NULL,
  `op_1` varchar(1000) DEFAULT NULL,
  `op_2` varchar(1000) DEFAULT NULL,
  `op_3` varchar(1000) DEFAULT NULL,
  `op_4` varchar(1000) DEFAULT NULL,
  `correct_op` varchar(1000) DEFAULT NULL,
  `q_solution` varchar(5000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `moengage_segments`
--

DROP TABLE IF EXISTS `moengage_segments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `moengage_segments` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `class` smallint(5) unsigned NOT NULL,
  `language` varchar(20) DEFAULT NULL,
  `board` varchar(50) DEFAULT NULL,
  `exam` varchar(50) DEFAULT NULL,
  `segment_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `most_watched`
--

DROP TABLE IF EXISTS `most_watched`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `most_watched` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ccm_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1369 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `motivation_video_list`
--

DROP TABLE IF EXISTS `motivation_video_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `motivation_video_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `channel_name` text,
  `yt_link` text NOT NULL,
  `title_text` text NOT NULL,
  `duration` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `duration` (`duration`)
) ENGINE=InnoDB AUTO_INCREMENT=283 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mpd40Sep2021_all`
--

DROP TABLE IF EXISTS `mpd40Sep2021_all`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mpd40Sep2021_all` (
  `student_id` int(11) unsigned NOT NULL,
  `gcm_reg_id` mediumtext,
  `locale` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mpd40Sep2021_en`
--

DROP TABLE IF EXISTS `mpd40Sep2021_en`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mpd40Sep2021_en` (
  `student_id` int(11) unsigned NOT NULL,
  `gcm_reg_id` mediumtext,
  `locale` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mpd40Sep2021_hi`
--

DROP TABLE IF EXISTS `mpd40Sep2021_hi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mpd40Sep2021_hi` (
  `student_id` int(11) unsigned NOT NULL,
  `gcm_reg_id` mediumtext,
  `locale` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_hindi_all`
--

DROP TABLE IF EXISTS `ncert_hindi_all`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_hindi_all` (
  `question_id` int(11) NOT NULL,
  `class` int(11) NOT NULL DEFAULT '0',
  `chapter` varchar(255) NOT NULL DEFAULT '',
  `chapter_order` int(11) NOT NULL DEFAULT '0',
  `exercise_name` varchar(255) NOT NULL DEFAULT '',
  `exercise_type` varchar(255) NOT NULL DEFAULT '',
  `exercise_order` bigint(20) NOT NULL DEFAULT '0',
  `ncert_exercise_name` varchar(100) NOT NULL DEFAULT '',
  `question_order` int(11) NOT NULL DEFAULT '0',
  `ocr_text` mediumtext,
  `subject` varchar(25) DEFAULT NULL,
  `thumbnail_img_url` varchar(250) DEFAULT NULL,
  `thumbnail_img_url_hindi` varchar(250) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `question_tag` varchar(200) DEFAULT NULL,
  `question` text NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `chapter_hindi` varchar(1000) DEFAULT NULL,
  `exercise_name_hindi` varchar(200) DEFAULT NULL,
  `ex_code` varchar(255) DEFAULT NULL,
  `q_code` varchar(255) DEFAULT NULL,
  `yt_description` text,
  `tags_yt` text,
  PRIMARY KEY (`question_id`),
  KEY `class` (`class`,`chapter`,`doubt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_hindi_english_mapping`
--

DROP TABLE IF EXISTS `ncert_hindi_english_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_hindi_english_mapping` (
  `question_id` int(55) NOT NULL DEFAULT '0',
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `ocr_text` text,
  `question` mediumtext NOT NULL,
  `matched_question` int(11) DEFAULT NULL,
  `original_ocr_text` text,
  `hindi_doubt` varchar(100) NOT NULL,
  `english_doubt` varchar(100) NOT NULL,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_hindi_exercise`
--

DROP TABLE IF EXISTS `ncert_hindi_exercise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_hindi_exercise` (
  `class` int(11) NOT NULL,
  `subject` varchar(20) NOT NULL,
  `chapter` varchar(500) NOT NULL,
  `ex_code` varchar(100) NOT NULL,
  `ex_name` varchar(200) NOT NULL,
  `ch_code` varchar(100) NOT NULL,
  `ch_key` varchar(500) NOT NULL,
  `ex_description` varchar(500) NOT NULL,
  `library_id` int(11) NOT NULL,
  `library_parent_id` int(11) NOT NULL,
  `ch_description` varchar(500) NOT NULL,
  PRIMARY KEY (`ex_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_icons`
--

DROP TABLE IF EXISTS `ncert_icons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_icons` (
  `class` int(11) NOT NULL,
  `chapter_order` int(11) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `icon_name` varchar(255) NOT NULL,
  UNIQUE KEY `class` (`class`,`chapter_order`),
  UNIQUE KEY `class_2` (`class`,`chapter_order`,`chapter`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_library_mapping`
--

DROP TABLE IF EXISTS `ncert_library_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_library_mapping` (
  `id` int(11) NOT NULL,
  `class` int(11) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `chapter_order` int(11) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `exercise_name` varchar(500) NOT NULL,
  `ncert_exercise_name` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `class_2` (`class`,`subject`,`chapter_order`,`ncert_exercise_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_neet_video_list`
--

DROP TABLE IF EXISTS `ncert_neet_video_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_neet_video_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `yt_link` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `duration` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_playlists`
--

DROP TABLE IF EXISTS `ncert_playlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_playlists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(255) NOT NULL,
  `playlist_name` varchar(1000) NOT NULL,
  `playlist_description` varchar(2000) NOT NULL,
  `yt_playlist_id` varchar(255) DEFAULT NULL,
  `thumbnail_status` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=608 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_questions_details`
--

DROP TABLE IF EXISTS `ncert_questions_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_questions_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `main_playlist_id` int(11) NOT NULL,
  `student_class` int(11) NOT NULL,
  `book_playlist_id` int(11) NOT NULL,
  `book_name` varchar(500) NOT NULL,
  `chapter_playlist_id` int(11) NOT NULL,
  `chapter_number` int(11) NOT NULL,
  `chapter_name` varchar(500) NOT NULL,
  `exercise_playlist_id` int(11) NOT NULL,
  `exercise_name` varchar(500) NOT NULL,
  `exercise_number` int(11) NOT NULL,
  `question_id` int(55) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `main_playlist_id` (`main_playlist_id`),
  KEY `question_id` (`question_id`),
  KEY `exercise_playlist_id` (`exercise_playlist_id`),
  KEY `chapter_playlist_id` (`chapter_playlist_id`),
  KEY `book_playlist_id` (`book_playlist_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27854 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_video_all`
--

DROP TABLE IF EXISTS `ncert_video_all`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_video_all` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL DEFAULT '0',
  `class` int(11) NOT NULL DEFAULT '0',
  `chapter` varchar(255) NOT NULL DEFAULT '',
  `chapter_order` int(11) NOT NULL DEFAULT '0',
  `exercise_name` varchar(255) NOT NULL DEFAULT '',
  `exercise_type` varchar(255) NOT NULL DEFAULT '',
  `exercise_order` bigint(20) NOT NULL DEFAULT '0',
  `ncert_exercise_name` varchar(100) NOT NULL DEFAULT '',
  `question_order` int(11) NOT NULL DEFAULT '0',
  `ocr_text` mediumtext,
  `subject` varchar(25) DEFAULT NULL,
  `thumbnail_img_url` varchar(250) DEFAULT NULL,
  `thumbnail_img_url_hindi` varchar(250) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `question_tag` varchar(200) DEFAULT NULL,
  `question` text NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `chapter_hindi` varchar(1000) DEFAULT NULL,
  `exercise_name_hindi` varchar(200) DEFAULT NULL,
  `ex_code` varchar(255) DEFAULT NULL,
  `q_code` varchar(255) DEFAULT NULL,
  `yt_description` text,
  `tags_yt` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_id` (`question_id`),
  KEY `class` (`class`,`chapter`,`chapter_order`,`ncert_exercise_name`,`question_order`,`subject`),
  KEY `parent_id` (`parent_id`),
  KEY `question_tag` (`question_tag`),
  KEY `doubt` (`doubt`)
) ENGINE=InnoDB AUTO_INCREMENT=19280 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_video_meta`
--

DROP TABLE IF EXISTS `ncert_video_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_video_meta` (
  `question_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `ex_code` varchar(255) NOT NULL,
  `q_code` varchar(255) NOT NULL,
  `chapter_order` int(11) NOT NULL,
  `exercise_name` varchar(255) NOT NULL,
  `exercise_type` varchar(255) NOT NULL,
  `exercise_order` int(11) NOT NULL,
  `ncert_exercise_name` varchar(100) NOT NULL,
  `question_order` int(11) NOT NULL,
  `subtopic` text,
  `microconcept` text,
  `yt_title` varchar(255) NOT NULL,
  `yt_description` text NOT NULL,
  `playlist_1` varchar(255) NOT NULL,
  `playlist_2` varchar(255) NOT NULL,
  `playlist_id1` varchar(50) DEFAULT NULL,
  `playlist_id2` varchar(50) DEFAULT NULL,
  `youtube_id` varchar(255) DEFAULT NULL,
  `new_youtube_id` varchar(25) DEFAULT NULL,
  `new_answer_video` varchar(50) DEFAULT NULL,
  `ocr_text` text,
  `question` text,
  `comment_hi_1` varchar(200) DEFAULT NULL,
  `comment_hi_2` varchar(255) DEFAULT NULL,
  `comment_en_1` varchar(200) DEFAULT NULL,
  `comment_en_2` varchar(255) DEFAULT NULL,
  `tags_description` text,
  `tags_yt` text,
  `update_tags` int(11) NOT NULL DEFAULT '0',
  `update_comment` text,
  `hashtag_old` text,
  `hashtag_new` text,
  `chapter_img_url` varchar(250) DEFAULT NULL,
  `subject` text,
  `thumbnail_img_url` varchar(250) DEFAULT NULL,
  `thumbnail_img_url_hindi` varchar(240) DEFAULT NULL,
  PRIMARY KEY (`question_id`),
  KEY `class` (`class`),
  KEY `chapter` (`chapter`),
  KEY `chapter_order` (`chapter_order`),
  KEY `ncert_exercise_name` (`ncert_exercise_name`),
  KEY `question_order` (`question_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_video_meta_1`
--

DROP TABLE IF EXISTS `ncert_video_meta_1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_video_meta_1` (
  `question_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `ex_code` varchar(255) NOT NULL,
  `q_code` varchar(255) NOT NULL,
  `chapter_order` int(11) DEFAULT NULL,
  `exercise_name` varchar(255) DEFAULT NULL,
  `exercise_type` varchar(255) DEFAULT NULL,
  `exercise_order` int(11) DEFAULT NULL,
  `ncert_exercise_name` varchar(100) DEFAULT NULL,
  `question_order` int(11) DEFAULT NULL,
  `subtopic` text,
  `microconcept` text,
  `yt_title` varchar(255) DEFAULT NULL,
  `yt_description` text,
  `playlist_1` varchar(255) DEFAULT NULL,
  `playlist_2` varchar(255) DEFAULT NULL,
  `playlist_id1` varchar(50) DEFAULT NULL,
  `playlist_id2` varchar(50) DEFAULT NULL,
  `youtube_id` varchar(255) DEFAULT NULL,
  `new_youtube_id` varchar(25) DEFAULT NULL,
  `new_answer_video` varchar(50) DEFAULT NULL,
  `ocr_text` text,
  `question` text,
  `comment_hi_1` varchar(200) DEFAULT NULL,
  `comment_hi_2` varchar(255) DEFAULT NULL,
  `comment_en_1` varchar(200) DEFAULT NULL,
  `comment_en_2` varchar(255) DEFAULT NULL,
  `tags_description` text,
  `tags_yt` text,
  `update_tags` int(11) NOT NULL DEFAULT '0',
  `update_comment` text,
  `hashtag_old` text,
  `hashtag_new` text,
  `chapter_img_url` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`question_id`),
  KEY `class` (`class`),
  KEY `chapter` (`chapter`),
  KEY `chapter_order` (`chapter_order`),
  KEY `ncert_exercise_name` (`ncert_exercise_name`),
  KEY `question_order` (`question_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_video_meta_hindi`
--

DROP TABLE IF EXISTS `ncert_video_meta_hindi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_video_meta_hindi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `subject` varchar(100) NOT NULL DEFAULT 'MATHS',
  `exercise_name` varchar(255) NOT NULL,
  `exercise_type` varchar(255) NOT NULL,
  `exercise_order` int(11) NOT NULL,
  `ncert_exercise_name` varchar(100) NOT NULL,
  `name_language_1` varchar(5000) DEFAULT NULL,
  `hindi` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class` (`class`,`chapter`,`ncert_exercise_name`),
  KEY `name_language_1` (`name_language_1`(1024)),
  KEY `hindi` (`hindi`)
) ENGINE=InnoDB AUTO_INCREMENT=696 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ncert_video_meta_new`
--

DROP TABLE IF EXISTS `ncert_video_meta_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ncert_video_meta_new` (
  `question_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL DEFAULT '1',
  `class` int(11) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `ex_code` varchar(255) NOT NULL,
  `q_code` varchar(255) NOT NULL,
  `chapter_order` int(11) NOT NULL,
  `exercise_name` varchar(255) NOT NULL,
  `exercise_type` varchar(255) NOT NULL,
  `volume_order` int(11) NOT NULL,
  `ncert_exercise_name` varchar(100) NOT NULL,
  `question_order` int(11) NOT NULL,
  `subtopic` text,
  `microconcept` text,
  `yt_title` varchar(255) NOT NULL,
  `yt_description` text NOT NULL,
  `playlist_1` varchar(255) NOT NULL,
  `playlist_2` varchar(255) NOT NULL,
  `playlist_id1` varchar(50) DEFAULT NULL,
  `playlist_id2` varchar(50) DEFAULT NULL,
  `youtube_id` varchar(255) DEFAULT NULL,
  `new_youtube_id` varchar(25) DEFAULT NULL,
  `new_answer_video` varchar(50) DEFAULT NULL,
  `ocr_text` text,
  `question` text,
  `comment_hi_1` varchar(200) DEFAULT NULL,
  `comment_hi_2` varchar(255) DEFAULT NULL,
  `comment_en_1` varchar(200) DEFAULT NULL,
  `comment_en_2` varchar(255) DEFAULT NULL,
  `tags_description` text,
  `tags_yt` text,
  `update_tags` int(11) NOT NULL DEFAULT '0',
  `update_comment` text,
  `hashtag_old` text,
  `hashtag_new` text,
  `chapter_img_url` varchar(250) DEFAULT NULL,
  `subject` text,
  `is_answered` tinyint(4) NOT NULL DEFAULT '1',
  `is_text_answered` tinyint(4) NOT NULL DEFAULT '0',
  `thumbnail_img_url` varchar(250) DEFAULT NULL,
  `thumbnail_img_url_hindi` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`question_id`),
  KEY `class` (`class`),
  KEY `chapter` (`chapter`),
  KEY `chapter_order` (`chapter_order`),
  KEY `ncert_exercise_name` (`ncert_exercise_name`),
  KEY `question_order` (`question_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nda_ads_student_id`
--

DROP TABLE IF EXISTS `nda_ads_student_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nda_ads_student_id` (
  `student_id` int(100) NOT NULL,
  `mobile` varchar(50) DEFAULT NULL,
  `locale` varchar(25) DEFAULT NULL,
  PRIMARY KEY (`student_id`),
  KEY `locale` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `neet_scrapped_answers`
--

DROP TABLE IF EXISTS `neet_scrapped_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `neet_scrapped_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solution` varchar(50) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `source` varchar(50) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_canonical_url` (`canonical_url`)
) ENGINE=InnoDB AUTO_INCREMENT=32901 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `neet_scrapped_questions`
--

DROP TABLE IF EXISTS `neet_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `neet_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(600) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `source_id` varchar(50) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32909 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_app_notifications`
--

DROP TABLE IF EXISTS `new_app_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `new_app_notifications` (
  `id` int(255) NOT NULL AUTO_INCREMENT,
  `event_name` varchar(300) NOT NULL,
  `description` varchar(500) NOT NULL,
  `type` varchar(300) NOT NULL DEFAULT 'marketing',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_content_announcement`
--

DROP TABLE IF EXISTS `new_content_announcement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `new_content_announcement` (
  `id` bigint(10) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `from_table` varchar(255) NOT NULL,
  `row_id` bigint(10) DEFAULT NULL,
  `type` enum('red_dot','new') DEFAULT NULL,
  `valid_till` datetime DEFAULT NULL,
  `valid_from` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `nca_from_table_idx` (`from_table`),
  KEY `nca_row_id_idx` (`row_id`),
  KEY `nca_valid_till_idx` (`valid_till`),
  KEY `nca_valid_from_idx` (`valid_from`),
  KEY `nca_type_idx` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_formula_sheet`
--

DROP TABLE IF EXISTS `new_formula_sheet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `new_formula_sheet` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `target_group` varchar(100) NOT NULL,
  `doubt` varchar(100) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `chapter` varchar(500) NOT NULL,
  `subtopic` varchar(1000) NOT NULL,
  `formula_name` varchar(2000) NOT NULL,
  `formula` varchar(2000) NOT NULL,
  `remarks` varchar(5000) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_library`
--

DROP TABLE IF EXISTS `new_library`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `new_library` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_first` tinyint(1) NOT NULL DEFAULT '0',
  `is_last` tinyint(1) NOT NULL DEFAULT '0',
  `empty_text` varchar(2000) DEFAULT NULL,
  `is_admin_created` tinyint(1) NOT NULL DEFAULT '1',
  `parent` varchar(50) DEFAULT NULL,
  `resource_type` varchar(100) DEFAULT NULL,
  `resource_description` varchar(250) DEFAULT NULL,
  `resource_path` varchar(10000) DEFAULT NULL,
  `student_class` varchar(100) DEFAULT NULL,
  `student_course` varchar(100) DEFAULT NULL,
  `new_student_course` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `playlist_order` int(11) NOT NULL,
  `new_playlist_order` varchar(100) DEFAULT NULL,
  `student_id` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `is_delete` tinyint(4) NOT NULL DEFAULT '0',
  `empty_playlist_id` int(11) DEFAULT NULL,
  `master_parent` varchar(1000) DEFAULT NULL,
  `size` varchar(50) DEFAULT NULL,
  `subject` varchar(50) NOT NULL DEFAULT 'MATHS',
  `view_type` varchar(100) DEFAULT 'LIST',
  `main_description` varchar(200) DEFAULT NULL,
  `min_version_code` int(11) NOT NULL,
  `max_version_code` int(11) NOT NULL,
  `is_chapter_active` varchar(45) DEFAULT '1',
  `items_count` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `page_type` (`empty_playlist_id`),
  KEY `subject` (`subject`),
  KEY `nl_active_idx` (`is_active`),
  KEY `nl_delete_idx` (`is_delete`),
  KEY `nl_student_class_idx` (`student_class`),
  KEY `nl_resource_type_idx` (`resource_type`),
  KEY `nl_student_id_idx` (`student_id`),
  KEY `nl_is_admin_created_idx` (`is_admin_created`),
  KEY `is_first` (`is_first`),
  KEY `is_last` (`is_last`),
  KEY `created_at` (`created_at`),
  KEY `playlist_order` (`playlist_order`),
  KEY `parent` (`parent`),
  KEY `min_version_code` (`min_version_code`,`max_version_code`),
  KEY `is_chapter_active` (`is_chapter_active`),
  KEY `nl_name_idx` (`name`),
  KEY `nl_new_playlist_order_idx` (`new_playlist_order`)
) ENGINE=InnoDB AUTO_INCREMENT=471790 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_library_playlist_question_mapping`
--

DROP TABLE IF EXISTS `new_library_playlist_question_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `new_library_playlist_question_mapping` (
  `playlist_id` int(11) NOT NULL,
  `is_last` int(11) NOT NULL,
  `playlist_type` varchar(10) NOT NULL,
  `question_id` int(11) NOT NULL,
  PRIMARY KEY (`playlist_id`,`question_id`),
  KEY `playlist_type` (`playlist_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_library_popular`
--

DROP TABLE IF EXISTS `new_library_popular`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `new_library_popular` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `library_id` int(11) DEFAULT NULL,
  `is_trending` tinyint(1) NOT NULL DEFAULT '0',
  `is_expert` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_library_tab_config`
--

DROP TABLE IF EXISTS `new_library_tab_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `new_library_tab_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `class` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(4) NOT NULL DEFAULT '0',
  `action` varchar(250) NOT NULL,
  `tab_order` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_pdf_schema`
--

DROP TABLE IF EXISTS `new_pdf_schema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `new_pdf_schema` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  `image_url` varchar(100) DEFAULT NULL,
  `is_first` tinyint(1) NOT NULL DEFAULT '0',
  `is_last` tinyint(1) NOT NULL DEFAULT '0',
  `childrens` varchar(200) DEFAULT NULL,
  `is_admin_created` tinyint(1) NOT NULL DEFAULT '1',
  `parent` varchar(50) DEFAULT NULL,
  `parent_chain` varchar(255) DEFAULT NULL,
  `resource_type` varchar(100) DEFAULT NULL,
  `resource_description` varchar(250) DEFAULT NULL,
  `resource_path` varchar(10000) DEFAULT NULL,
  `student_class` varchar(100) DEFAULT NULL,
  `student_course` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pdf_order` int(11) NOT NULL,
  `student_id` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `is_delete` tinyint(4) NOT NULL DEFAULT '0',
  `page_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_thumbnail_experiment`
--

DROP TABLE IF EXISTS `new_thumbnail_experiment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `new_thumbnail_experiment` (
  `old_detail_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `question_id` varchar(255) NOT NULL,
  `is_active` int(11) DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `old_detail_id` (`old_detail_id`),
  KEY `class` (`class`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_thumbnail_stats`
--

DROP TABLE IF EXISTS `new_thumbnail_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `new_thumbnail_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=72392 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_users_notifications`
--

DROP TABLE IF EXISTS `new_users_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `new_users_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) DEFAULT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 DEFAULT NULL,
  `message` varchar(500) CHARACTER SET utf8mb4 DEFAULT NULL,
  `image` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `newton`
--

DROP TABLE IF EXISTS `newton`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `newton` (
  `id` int(11) NOT NULL,
  `title` longtext,
  `options` longtext,
  `tags` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notes_image_qid_mapping`
--

DROP TABLE IF EXISTS `notes_image_qid_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notes_image_qid_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lecture_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `note_id` int(11) NOT NULL,
  `table_name` varchar(30) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `chapter_english` varchar(500) DEFAULT NULL,
  `subject_english` varchar(50) DEFAULT NULL,
  `exam_board` varchar(100) NOT NULL,
  `language` varchar(20) NOT NULL DEFAULT 'hindi',
  `chapter_order` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `class` (`class`,`subject`,`exam_board`,`language`)
) ENGINE=InnoDB AUTO_INCREMENT=11658 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notice`
--

DROP TABLE IF EXISTS `notice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ccm_id` varchar(255) DEFAULT NULL,
  `student_class` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `heading` varchar(255) NOT NULL,
  `content` mediumtext NOT NULL,
  `caption` varchar(100) NOT NULL,
  `img_url` varchar(255) NOT NULL,
  `notice_type` varchar(255) NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cta_text` varchar(255) NOT NULL,
  `cta_link` varchar(255) NOT NULL,
  `priority` int(11) NOT NULL,
  `locale` varchar(10) NOT NULL,
  `sharing_text` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `min_version` smallint(6) NOT NULL DEFAULT '700',
  `max_version` smallint(6) NOT NULL DEFAULT '1000',
  `flagr_variant` smallint(6) NOT NULL DEFAULT '-1',
  `user_days` smallint(6) NOT NULL DEFAULT '-1',
  PRIMARY KEY (`id`),
  KEY `end_date` (`end_date`),
  KEY `is_active` (`is_active`),
  KEY `student_class` (`student_class`)
) ENGINE=InnoDB AUTO_INCREMENT=617 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_campaigns`
--

DROP TABLE IF EXISTS `notification_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_campaigns` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `push_title` varchar(255) DEFAULT NULL,
  `push_subtitle` varchar(255) DEFAULT NULL,
  `app_deeplink` varchar(100) DEFAULT NULL,
  `image_url` varchar(100) DEFAULT NULL,
  `target_query` varchar(255) DEFAULT NULL,
  `target_query_db` enum('MYSQL') DEFAULT NULL,
  `tracking_tag` varchar(15) DEFAULT NULL,
  `is_scheduled` tinyint(1) DEFAULT NULL,
  `schedule_time` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(10) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `locale` varchar(11) DEFAULT NULL,
  `email_push` tinyint(1) DEFAULT '0',
  `fcm_push` tinyint(4) DEFAULT '1',
  `whatsapp_push` tinyint(11) DEFAULT '0',
  `inapp_push` tinyint(11) DEFAULT '0',
  `name` varchar(11) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_content_liveclass`
--

DROP TABLE IF EXISTS `notification_content_liveclass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_content_liveclass` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `language` varchar(16) NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` varchar(100) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_segment_liveclass`
--

DROP TABLE IF EXISTS `notification_segment_liveclass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_segment_liveclass` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `locale` varchar(20) NOT NULL,
  `board` varchar(50) NOT NULL,
  `exam` varchar(50) NOT NULL,
  `moe_segment_name` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `notify_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `content` varchar(2048) NOT NULL,
  `is_read` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notify_id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=84138 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notify_activity`
--

DROP TABLE IF EXISTS `notify_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notify_activity` (
  `notify_id` int(11) NOT NULL AUTO_INCREMENT,
  `notify_type` varchar(128) NOT NULL,
  `notify_desc` varchar(128) NOT NULL,
  `notify_activity` varchar(128) NOT NULL,
  `extra_param` varchar(128) DEFAULT NULL,
  `image` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_New_App` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`notify_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nta_mock_test_details`
--

DROP TABLE IF EXISTS `nta_mock_test_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nta_mock_test_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `exam_group` varchar(10) NOT NULL,
  `exam_name` varchar(100) NOT NULL,
  `subject` varchar(20) NOT NULL,
  `doubt` varchar(100) NOT NULL,
  `test_code` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_name` (`exam_name`,`subject`),
  KEY `student_id_2` (`student_id`,`exam_name`,`subject`,`doubt`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nudges`
--

DROP TABLE IF EXISTS `nudges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `nudges` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `text` varchar(255) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `coupon_id` varchar(100) DEFAULT NULL,
  `trigger_events` varchar(100) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `resource_id` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `deeplink` varchar(200) DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `count` int(11) DEFAULT NULL,
  `is_active` tinyint(11) DEFAULT '1',
  `nudge_order` int(11) DEFAULT NULL,
  `display_text` varchar(200) DEFAULT NULL,
  `price_text` varchar(100) DEFAULT '',
  `subtitle_text` varchar(100) DEFAULT NULL,
  `optional_display_text1` varchar(100) DEFAULT NULL,
  `background_color` varchar(100) DEFAULT NULL,
  `display_image_rectangle` varchar(500) DEFAULT NULL,
  `display_image_square` varchar(500) DEFAULT NULL,
  `target_group` int(11) DEFAULT NULL,
  `start_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `is_active` (`is_active`),
  KEY `trigger_events` (`trigger_events`),
  KEY `end_time` (`end_time`),
  KEY `class` (`class`),
  KEY `nudge_order` (`nudge_order`),
  KEY `nudges_start_time_IDX` (`start_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=708 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ocr_check`
--

DROP TABLE IF EXISTS `ocr_check`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ocr_check` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr` text CHARACTER SET utf8mb4,
  `type` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ocr_latest`
--

DROP TABLE IF EXISTS `ocr_latest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ocr_latest` (
  `question_id` int(11) NOT NULL,
  `ocr_text` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ocr_done` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ocr_test_dataset`
--

DROP TABLE IF EXISTS `ocr_test_dataset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ocr_test_dataset` (
  `question_id` int(11) NOT NULL,
  `question_image` varchar(255) NOT NULL,
  `original_ocr_text` varchar(2000) NOT NULL,
  `new_ocr_text` text,
  `matched_question_id` int(11) NOT NULL,
  `manual_ocr_text` varchar(2000) NOT NULL,
  `meta_class` int(11) NOT NULL,
  `meta_chapter` varchar(200) NOT NULL,
  `q_class` int(11) NOT NULL,
  `q_chapter` varchar(200) NOT NULL,
  `student_id` int(11) NOT NULL,
  `matches_i` varchar(100) DEFAULT NULL,
  `matches_o` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`question_id`),
  KEY `question_image` (`question_image`,`matched_question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `old_new_mc_mapping`
--

DROP TABLE IF EXISTS `old_new_mc_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `old_new_mc_mapping` (
  `old_mc_id` varchar(255) NOT NULL,
  `new_mc_id` varchar(255) NOT NULL,
  `old_question_id` int(11) DEFAULT NULL,
  `new_question_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`old_mc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `old_package_migration_new_assortment`
--

DROP TABLE IF EXISTS `old_package_migration_new_assortment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `old_package_migration_new_assortment` (
  `old_assortment_id` int(11) NOT NULL,
  `new_assortment_id` int(11) NOT NULL,
  `new_package_id` int(11) NOT NULL,
  `new_assortment_title` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `old_package_migration_students`
--

DROP TABLE IF EXISTS `old_package_migration_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `old_package_migration_students` (
  `student_id` int(11) NOT NULL,
  `assortment_id` int(11) NOT NULL,
  `end_date` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `olympiad_registered_students`
--

DROP TABLE IF EXISTS `olympiad_registered_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `olympiad_registered_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `school_name` varchar(250) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `student_id` int(255) DEFAULT NULL,
  `registered_on_doubtnut` int(11) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `olympiad_registered_students_username` (`username`),
  KEY `olympiad_registered_students_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `on_board_language`
--

DROP TABLE IF EXISTS `on_board_language`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `on_board_language` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gcm_id` varchar(500) DEFAULT NULL,
  `udid` varchar(150) NOT NULL,
  `locale` varchar(20) DEFAULT NULL,
  `time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41687491 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `onboarding_data`
--

DROP TABLE IF EXISTS `onboarding_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `onboarding_data` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(50) DEFAULT NULL,
  `description` varchar(200) DEFAULT NULL,
  `audio_url` varchar(200) DEFAULT NULL,
  `sorting_id` int(11) DEFAULT NULL,
  `is_active` int(11) DEFAULT '1',
  `locale` varchar(10) DEFAULT NULL,
  `source` varchar(25) DEFAULT NULL,
  `session_count` int(11) DEFAULT NULL,
  `recorded_position` int(11) DEFAULT NULL,
  `non_recorded_position` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `opening_closing_ranks`
--

DROP TABLE IF EXISTS `opening_closing_ranks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `opening_closing_ranks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `year` int(11) NOT NULL,
  `college_name` text NOT NULL,
  `college_type` text NOT NULL,
  `state_short` text NOT NULL,
  `state_long` text NOT NULL,
  `department` text NOT NULL,
  `quota` text NOT NULL,
  `category` text NOT NULL,
  `round_num` int(11) NOT NULL,
  `opening_rank` int(11) NOT NULL,
  `closing_rank` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13577 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `organic_questions_with_image`
--

DROP TABLE IF EXISTS `organic_questions_with_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organic_questions_with_image` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  `ocr_text` text NOT NULL,
  `new_ocr` text,
  `error` varchar(3000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3259 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otp_delivery_status`
--

DROP TABLE IF EXISTS `otp_delivery_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `otp_delivery_status` (
  `id` int(255) NOT NULL AUTO_INCREMENT,
  `number` varchar(15) NOT NULL,
  `session_id` varchar(200) NOT NULL,
  `status` varchar(50) NOT NULL,
  `status_code` varchar(255) NOT NULL,
  `error_code` varchar(20) NOT NULL,
  `retry` int(11) NOT NULL DEFAULT '0',
  `circle` varchar(255) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=128088 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otp_on_call`
--

DROP TABLE IF EXISTS `otp_on_call`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `otp_on_call` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mobile` varchar(15) NOT NULL,
  `status` enum('SUCCESS','FAILED') NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otp_records`
--

DROP TABLE IF EXISTS `otp_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `otp_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mobile` varchar(20) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `session_id` varchar(500) NOT NULL,
  `service_type` varchar(100) NOT NULL,
  `status` enum('PENDING','VERIFIED','EXPIRED','INVALID','API ERROR','UDID NOT FOUND','ERROR') NOT NULL,
  `err_msg` varchar(2000) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_web` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `mobile` (`mobile`),
  KEY `status` (`status`),
  KEY `idx_status_time` (`status`,`time`)
) ENGINE=InnoDB AUTO_INCREMENT=11459429 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `p2p_wfc_coupons_table`
--

DROP TABLE IF EXISTS `p2p_wfc_coupons_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `p2p_wfc_coupons_table` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sid_idx` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8416 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `package`
--

DROP TABLE IF EXISTS `package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `package` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `duration_in_days` int(11) DEFAULT NULL,
  `image_url_square` varchar(255) DEFAULT NULL,
  `image_url_rectangle` varchar(255) DEFAULT NULL,
  `package_order` int(11) DEFAULT NULL,
  `parent` int(11) DEFAULT NULL,
  `is_last` int(11) DEFAULT NULL,
  `master_parent` int(11) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `is_multi_year` tinyint(4) DEFAULT NULL,
  `reference_type` enum('default','v3','onlyPanel','doubt') DEFAULT 'v3',
  `max_limit` int(11) DEFAULT NULL,
  `is_active` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `emi_order` int(11) DEFAULT NULL,
  `is_default` int(11) DEFAULT NULL,
  `emi_duration` int(11) DEFAULT NULL,
  `emi_amount` decimal(10,2) DEFAULT NULL,
  `package_target_group_id` int(11) DEFAULT NULL,
  `min_limit` int(11) NOT NULL DEFAULT '0',
  `min_limit_percentage` int(3) unsigned DEFAULT '50',
  `variant_id` int(11) DEFAULT NULL,
  `doubt_ask` int(11) DEFAULT '-1',
  `total_emi` int(2) DEFAULT NULL,
  `flag_id` int(11) DEFAULT NULL,
  `flag_key` varchar(100) DEFAULT NULL,
  `country` varchar(45) DEFAULT 'IN',
  `batch_id` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `index1` (`variant_id`,`type`,`master_parent`,`reference_type`),
  KEY `package_flag_key_IDX` (`flag_key`) USING BTREE,
  KEY `package_master_parent_IDX` (`master_parent`) USING BTREE,
  KEY `package_reference_type_IDX` (`reference_type`) USING BTREE,
  KEY `package_is_active_IDX` (`is_active`) USING BTREE,
  KEY `assortment_id` (`assortment_id`),
  KEY `duration_in_days` (`duration_in_days`)
) ENGINE=InnoDB AUTO_INCREMENT=5428983 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `package_bk`
--

DROP TABLE IF EXISTS `package_bk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `package_bk` (
  `id` int(11) unsigned NOT NULL,
  `assortment_id` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `duration_in_days` int(11) DEFAULT NULL,
  `image_url_square` varchar(11) DEFAULT NULL,
  `image_url_rectangle` varchar(11) DEFAULT '',
  `package_order` int(11) DEFAULT NULL,
  `parent` int(11) DEFAULT NULL,
  `is_last` int(11) DEFAULT NULL,
  `master_parent` int(11) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `reference_type` enum('default','v3','onlyPanel') DEFAULT 'onlyPanel',
  `max_limit` int(11) DEFAULT NULL,
  `is_active` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `emi_order` int(11) DEFAULT NULL,
  `is_default` int(11) DEFAULT NULL,
  `emi_duration` int(11) DEFAULT NULL,
  `emi_amount` decimal(10,2) DEFAULT NULL,
  `package_target_group_id` int(11) DEFAULT NULL,
  `min_limit` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `doubt_ask` int(11) DEFAULT '-1',
  `total_emi` int(2) DEFAULT NULL,
  `flag_id` int(11) DEFAULT NULL,
  `flag_key` varchar(100) DEFAULT NULL,
  `country` varchar(255) NOT NULL,
  KEY `variant_id` (`variant_id`),
  KEY `assortment_id` (`assortment_id`),
  KEY `flag_key` (`flag_key`),
  KEY `reference_type` (`reference_type`),
  KEY `type` (`type`),
  KEY `master_parent` (`master_parent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `package_name_transliterate`
--

DROP TABLE IF EXISTS `package_name_transliterate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `package_name_transliterate` (
  `package_id` int(11) NOT NULL,
  `package_name` varchar(500) NOT NULL,
  `package_name_trans` varchar(1000) DEFAULT NULL,
  `package_name_trans_manual` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`package_id`),
  KEY `package_name_trans_manual` (`package_name_trans_manual`(1024)),
  KEY `package_name_trans` (`package_name_trans`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `package_resources`
--

DROP TABLE IF EXISTS `package_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `package_resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `student_package_id` int(11) DEFAULT NULL,
  `resource_reference` varchar(100) DEFAULT NULL,
  `class` varchar(50) DEFAULT NULL,
  `subject` varchar(50) DEFAULT NULL,
  `chapter` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `table_name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=608 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `package_unit`
--

DROP TABLE IF EXISTS `package_unit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `package_unit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `package_unit_resourses`
--

DROP TABLE IF EXISTS `package_unit_resourses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `package_unit_resourses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_package_id` int(11) DEFAULT '1',
  `resource_reference` varchar(45) DEFAULT NULL,
  `description` varchar(45) DEFAULT NULL,
  `class` varchar(45) DEFAULT NULL,
  `subject` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `package_v2`
--

DROP TABLE IF EXISTS `package_v2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `package_v2` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `duration_in_days` int(11) DEFAULT NULL,
  `image_url_square` varchar(11) DEFAULT NULL,
  `image_url_rectangle` varchar(11) DEFAULT '',
  `package_order` int(11) DEFAULT NULL,
  `parent` int(11) DEFAULT NULL,
  `is_last` int(11) DEFAULT NULL,
  `master_parent` int(11) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `reference_type` enum('default','v3','onlyPanel') DEFAULT 'onlyPanel',
  `max_limit` int(11) DEFAULT NULL,
  `is_active` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `emi_order` int(11) DEFAULT NULL,
  `is_default` int(11) DEFAULT NULL,
  `emi_duration` int(11) DEFAULT NULL,
  `emi_amount` decimal(10,2) DEFAULT NULL,
  `package_target_group_id` int(11) DEFAULT NULL,
  `min_limit` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `doubt_ask` int(11) DEFAULT '-1',
  `total_emi` int(2) DEFAULT NULL,
  `flag_id` int(11) DEFAULT NULL,
  `flag_key` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assortment_id` (`assortment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6714 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paid_red_flag_users`
--

DROP TABLE IF EXISTS `paid_red_flag_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paid_red_flag_users` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `created_at` date DEFAULT NULL,
  `student_id` int(255) DEFAULT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `yesterday_ET` int(255) DEFAULT NULL,
  `day_before_ET` int(255) DEFAULT NULL,
  `prev_week_avg_ET` int(255) DEFAULT NULL,
  `tagg` enum('2_day_0ET','1day_0_et','>45min_et','<30min_et','et_drop_25%','green') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `prfu_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=662107 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_subjects`
--

DROP TABLE IF EXISTS `panel_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_code` varchar(100) DEFAULT NULL,
  `subject_display` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `panel_users`
--

DROP TABLE IF EXISTS `panel_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(120) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_failure`
--

DROP TABLE IF EXISTS `payment_failure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_failure` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_info_id` int(11) NOT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `description` varchar(200) DEFAULT NULL,
  `source` varchar(200) DEFAULT NULL,
  `step` varchar(200) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pf_pi_idx` (`payment_info_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1367455 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_inapp_billing`
--

DROP TABLE IF EXISTS `payment_inapp_billing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_inapp_billing` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `purchase_token` varchar(500) DEFAULT NULL,
  `subscription_id` varchar(45) DEFAULT NULL,
  `payment_state` int(1) DEFAULT NULL,
  `partner_order_id` varchar(45) DEFAULT NULL,
  `auto_renewing` tinyint(1) DEFAULT '1',
  `cancel_reason` int(11) DEFAULT NULL,
  `expiry` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info`
--

DROP TABLE IF EXISTS `payment_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `order_id` varchar(200) NOT NULL,
  `partner_order_id` varchar(45) DEFAULT NULL,
  `student_id` int(11) NOT NULL,
  `amount` decimal(10,2) DEFAULT '0.00',
  `payment_for` varchar(45) NOT NULL,
  `payment_for_id` varchar(45) DEFAULT NULL,
  `status` varchar(45) NOT NULL,
  `partner_txn_id` varchar(200) DEFAULT NULL,
  `partner_txn_time` timestamp NULL DEFAULT NULL,
  `partner_txn_response` text,
  `source` varchar(45) DEFAULT NULL,
  `mode` varchar(45) DEFAULT NULL,
  `updated_by` varchar(45) NOT NULL DEFAULT 'system',
  `coupon_code` varchar(100) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `variant_id` int(11) DEFAULT NULL,
  `created_from` varchar(45) DEFAULT NULL,
  `wallet_amount` decimal(10,2) DEFAULT '0.00',
  `currency` varchar(45) DEFAULT 'INR',
  PRIMARY KEY (`id`),
  KEY `pi_order_idx` (`order_id`),
  KEY `pi_student_id_idx` (`student_id`),
  KEY `pi_partner_order_id_idx` (`partner_order_id`),
  KEY `pi_status_idx` (`status`),
  KEY `pi_partner_txn_id_idx` (`partner_txn_id`),
  KEY `pi_source_idx` (`source`),
  KEY `pi_amount_idx` (`amount`),
  KEY `idx_coupon_code` (`coupon_code`),
  KEY `pi_updated_at_idx` (`updated_at`),
  KEY `pi_variant_idx` (`variant_id`),
  KEY `pi_created_at_idx` (`created_at`),
  KEY `pi_partner_txn_time_idx` (`partner_txn_time`)
) ENGINE=InnoDB AUTO_INCREMENT=2844714 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_bbps`
--

DROP TABLE IF EXISTS `payment_info_bbps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_bbps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `student_id` int(11) NOT NULL,
  `payment_info_id` int(11) NOT NULL,
  `status` enum('ACTIVE','INACTIVE','USED') NOT NULL DEFAULT 'ACTIVE',
  `unique_payment_ref_id` varchar(45) DEFAULT NULL,
  `platform_transaction_ref_id` varchar(45) DEFAULT NULL,
  `platform_bill_id` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=51338 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_bbps_attempt`
--

DROP TABLE IF EXISTS `payment_info_bbps_attempt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_bbps_attempt` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `student_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2217 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_invoice`
--

DROP TABLE IF EXISTS `payment_info_invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_invoice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `payment_info_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31497 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_meta`
--

DROP TABLE IF EXISTS `payment_info_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_meta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_info_id` int(11) NOT NULL,
  `is_web` tinyint(1) DEFAULT '0',
  `wallet_cash_amount` decimal(10,2) DEFAULT '0.00',
  `wallet_reward_amount` decimal(10,2) DEFAULT '0.00',
  `notes` varchar(255) DEFAULT NULL,
  `method` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pim_pi_idx` (`payment_info_id`)
) ENGINE=InnoDB AUTO_INCREMENT=309938 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_paypal`
--

DROP TABLE IF EXISTS `payment_info_paypal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_paypal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `subscription_id` varchar(45) NOT NULL,
  `plan_id` varchar(45) NOT NULL,
  `status` varchar(45) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `response` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_paytm`
--

DROP TABLE IF EXISTS `payment_info_paytm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_paytm` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `student_id` int(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id_UNIQUE` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=409692 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_qr`
--

DROP TABLE IF EXISTS `payment_info_qr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_qr` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_info_id` int(11) DEFAULT NULL,
  `amount_expected` decimal(10,2) DEFAULT NULL,
  `amount_paid` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `qr_id` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `piq_pi_idx` (`payment_info_id`),
  KEY `piq_qr_idx` (`qr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=167204 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_reconcile`
--

DROP TABLE IF EXISTS `payment_info_reconcile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_reconcile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_info_id` int(11) NOT NULL,
  `status` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pid` (`payment_info_id`),
  CONSTRAINT `payment_info_reconcile_ibfk_1` FOREIGN KEY (`payment_info_id`) REFERENCES `payment_info` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_sales_attribution`
--

DROP TABLE IF EXISTS `payment_info_sales_attribution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_sales_attribution` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_info_id` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `bda_name` varchar(100) DEFAULT NULL,
  `tl_name` varchar(100) DEFAULT NULL,
  `sm_name` varchar(100) DEFAULT NULL,
  `auto_tele` varchar(100) DEFAULT NULL,
  `osp_status` varchar(100) DEFAULT NULL,
  `final_status` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_info_id_UNIQUE` (`payment_info_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2004806 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_shiprocket`
--

DROP TABLE IF EXISTS `payment_info_shiprocket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_shiprocket` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `shiprocket_order_id` int(11) DEFAULT NULL,
  `shipment_id` int(11) DEFAULT NULL,
  `student_address_mapping_id` int(11) DEFAULT NULL,
  `payment_info_id` int(11) DEFAULT NULL,
  `shipment_address` varchar(500) DEFAULT NULL,
  `order_status` varchar(45) DEFAULT NULL,
  `etd` datetime DEFAULT NULL,
  `unique_code` varchar(20) DEFAULT NULL,
  `sps_id` int(11) DEFAULT NULL,
  `is_active` int(11) DEFAULT NULL,
  `is_otp_verified` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `shipment_ready` int(11) NOT NULL DEFAULT '0',
  `shipment_prepared_by` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pis_sid_idx` (`student_id`),
  KEY `shipment_ready` (`shipment_ready`)
) ENGINE=InnoDB AUTO_INCREMENT=5972 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_smart_collect`
--

DROP TABLE IF EXISTS `payment_info_smart_collect`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_smart_collect` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `is_active` tinyint(1) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `bank_name` varchar(45) DEFAULT NULL,
  `virtual_account_id` varchar(45) DEFAULT NULL,
  `account_number` varchar(45) DEFAULT NULL,
  `ifsc_code` varchar(45) DEFAULT NULL,
  `upi_id` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(45) DEFAULT NULL,
  `amount_paid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pisc_sid_idx` (`student_id`),
  KEY `pisc_vid_idx` (`virtual_account_id`),
  KEY `account_number` (`account_number`)
) ENGINE=InnoDB AUTO_INCREMENT=149099 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_info_wallet_meta`
--

DROP TABLE IF EXISTS `payment_info_wallet_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_info_wallet_meta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_info_id` int(11) NOT NULL,
  `cash_amount` decimal(10,2) DEFAULT '0.00',
  `reward_amount` decimal(10,2) DEFAULT '0.00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_invoice`
--

DROP TABLE IF EXISTS `payment_invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_invoice` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `entity_id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `entity_type` varchar(24) NOT NULL,
  `url` varchar(255) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_invoice_entity_id_entity_type` (`entity_id`,`entity_type`),
  UNIQUE KEY `payment_invoice_entity_id_entity_type_payment_id` (`entity_id`,`entity_type`,`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_link_razorpay`
--

DROP TABLE IF EXISTS `payment_link_razorpay`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_link_razorpay` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `invoice_id` varchar(45) DEFAULT NULL,
  `short_url` varchar(45) DEFAULT NULL,
  `payment_info_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_parameters`
--

DROP TABLE IF EXISTS `payment_parameters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_parameters` (
  `base_price` int(4) NOT NULL,
  `repo_base_price` int(4) NOT NULL,
  `cliff_period1` float NOT NULL,
  `raised_price1` int(4) NOT NULL,
  `cliff_period2` int(4) NOT NULL,
  `raised_price2` int(4) NOT NULL,
  `max_limit` int(4) NOT NULL,
  `params_id` int(11) NOT NULL AUTO_INCREMENT,
  `n_ans_base_price` int(4) NOT NULL,
  `timing` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`params_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_refund`
--

DROP TABLE IF EXISTS `payment_refund`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_refund` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `payment_info_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `partner_txn_id` varchar(45) DEFAULT NULL,
  `partner_txn_response` varchar(500) DEFAULT NULL,
  `updated_by` varchar(45) NOT NULL DEFAULT 'sytem',
  `reason` varchar(255) DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `wallet_status` varchar(45) DEFAULT NULL,
  `wallet_amount` decimal(10,2) DEFAULT NULL,
  `wallet_response` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1368 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_summary`
--

DROP TABLE IF EXISTS `payment_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_summary` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `package_amount` int(11) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `package_duration` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `amount_paid` int(11) DEFAULT NULL,
  `txn_id` varchar(100) DEFAULT NULL,
  `payment_type` varchar(100) DEFAULT NULL,
  `next_part_payment_amount` int(11) DEFAULT NULL,
  `next_part_payment_date` datetime DEFAULT NULL,
  `discount_amount` int(11) DEFAULT NULL,
  `discount_code` varchar(100) DEFAULT NULL,
  `pending_amount` int(11) DEFAULT NULL,
  `is_valid` int(11) DEFAULT NULL,
  `package_validity` datetime DEFAULT NULL,
  `master_package_id` int(11) DEFAULT NULL,
  `is_refunded` tinyint(1) DEFAULT NULL,
  `refund_amount` int(11) DEFAULT NULL,
  `refund_id` varchar(100) DEFAULT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `subscription_start` datetime DEFAULT NULL,
  `master_subscription_start_date` datetime DEFAULT NULL,
  `master_subscription_end_date` datetime DEFAULT NULL,
  `emi_order` int(11) DEFAULT NULL,
  `total_emi` int(11) DEFAULT NULL,
  `next_package_id` int(11) DEFAULT NULL,
  `next_ps_id` int(11) DEFAULT NULL,
  `delta_revenue` int(11) DEFAULT '0',
  `coupon_code` varchar(100) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `variant_id` int(11) DEFAULT NULL,
  `new_package_id` int(11) DEFAULT NULL,
  `master_variant_id` int(11) DEFAULT NULL,
  `update_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_renewed` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `package_id` (`package_id`),
  KEY `subscription_id` (`subscription_id`),
  KEY `ps_txn_id_idx` (`txn_id`)
) ENGINE=InnoDB AUTO_INCREMENT=289631 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_summary_v2`
--

DROP TABLE IF EXISTS `payment_summary_v2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_summary_v2` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `package_amount` int(11) DEFAULT NULL,
  `type` varchar(25) DEFAULT NULL,
  `package_duration` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `amount_paid` int(11) DEFAULT NULL,
  `txn_id` varchar(100) DEFAULT NULL,
  `payment_type` varchar(100) DEFAULT NULL,
  `next_part_payment_amount` int(11) DEFAULT NULL,
  `next_part_payment_date` datetime DEFAULT NULL,
  `discount_amount` int(11) DEFAULT NULL,
  `discount_code` int(11) DEFAULT NULL,
  `pending_amount` int(11) DEFAULT NULL,
  `is_valid` int(11) DEFAULT NULL,
  `package_validity` datetime DEFAULT NULL,
  `master_package_id` int(11) DEFAULT NULL,
  `is_refunded` tinyint(4) DEFAULT NULL,
  `refund_amount` int(11) DEFAULT NULL,
  `refund_id` varchar(100) DEFAULT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `subscription_start` datetime DEFAULT NULL,
  `master_subscription_start_date` datetime DEFAULT NULL,
  `master_subscription_end_date` datetime DEFAULT NULL,
  `emi_order` int(11) DEFAULT NULL,
  `total_emi` int(11) DEFAULT NULL,
  `next_package_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=383 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_summary_v3`
--

DROP TABLE IF EXISTS `payment_summary_v3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_summary_v3` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `package_amount` int(11) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `package_duration` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `amount_paid` int(11) DEFAULT NULL,
  `txn_id` varchar(100) DEFAULT NULL,
  `payment_type` varchar(100) DEFAULT NULL,
  `next_part_payment_amount` int(11) DEFAULT NULL,
  `next_part_payment_date` datetime DEFAULT NULL,
  `discount_amount` int(11) DEFAULT NULL,
  `discount_code` varchar(100) DEFAULT NULL,
  `pending_amount` int(11) DEFAULT NULL,
  `is_valid` int(11) DEFAULT NULL,
  `package_validity` datetime DEFAULT NULL,
  `master_package_id` int(11) DEFAULT NULL,
  `is_refunded` tinyint(1) DEFAULT NULL,
  `refund_amount` int(11) DEFAULT NULL,
  `refund_id` varchar(100) DEFAULT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `subscription_start` datetime DEFAULT NULL,
  `master_subscription_start_date` datetime DEFAULT NULL,
  `master_subscription_end_date` datetime DEFAULT NULL,
  `emi_order` int(11) DEFAULT NULL,
  `total_emi` int(11) DEFAULT NULL,
  `next_package_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3139 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paypal_subscription_repo`
--

DROP TABLE IF EXISTS `paypal_subscription_repo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paypal_subscription_repo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_id` varchar(45) NOT NULL,
  `has_trial` tinyint(1) NOT NULL DEFAULT '0',
  `trial_variant_id` int(11) DEFAULT NULL,
  `subscription_variant_id` varchar(45) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paytm_disburse_contest`
--

DROP TABLE IF EXISTS `paytm_disburse_contest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `paytm_disburse_contest` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(45) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `order_id` varchar(45) DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `response` text,
  `comments` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `phone` (`phone`),
  KEY `status` (`status`),
  KEY `comments` (`comments`)
) ENGINE=InnoDB AUTO_INCREMENT=282 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_creation_data`
--

DROP TABLE IF EXISTS `pdf_creation_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_creation_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject` text NOT NULL,
  `series` text NOT NULL,
  `chapter` text NOT NULL,
  `question_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `pdf_name` varchar(1000) DEFAULT NULL,
  `marks` int(11) DEFAULT NULL,
  `question_number` int(11) DEFAULT NULL,
  `is_or` int(11) NOT NULL DEFAULT '0',
  `paper_num` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`,`class`)
) ENGINE=InnoDB AUTO_INCREMENT=14125 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_download`
--

DROP TABLE IF EXISTS `pdf_download`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_download` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_id` int(11) DEFAULT NULL,
  `package` varchar(100) NOT NULL,
  `level1` varchar(100) DEFAULT NULL,
  `level2` varchar(100) DEFAULT NULL,
  `location` varchar(500) DEFAULT NULL,
  `class` varchar(11) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  `package_order` int(11) NOT NULL,
  `img_url` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2993 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_download_feature`
--

DROP TABLE IF EXISTS `pdf_download_feature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_download_feature` (
  `student_id` int(11) NOT NULL,
  `package` varchar(255) NOT NULL,
  `package_language` enum('en','bn','hi','ta','te','gu','kn','ml','mr') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `video_language` enum('en','bn-en','hi-en','ta-en','te-en','gu-en','kn-en','ml-en','mr-en','en','bn','hi','ta','te','gu','kn','ml','mr') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `class` varchar(255),
  `subject` varchar(255),
  `chapter` varchar(255),
  `priority_order` int(11) NOT NULL DEFAULT '0',
  KEY `package` (`package`),
  KEY `class` (`class`),
  KEY `subject` (`subject`),
  KEY `student_id_4` (`student_id`,`package`,`class`,`subject`),
  KEY `chapter` (`chapter`),
  KEY `package_language` (`package_language`,`video_language`),
  KEY `student_id_5` (`student_id`,`package`,`package_language`,`class`,`subject`,`chapter`),
  KEY `priority_order` (`priority_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_download_level_mapping`
--

DROP TABLE IF EXISTS `pdf_download_level_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_download_level_mapping` (
  `id` int(11) NOT NULL,
  `package` text NOT NULL,
  `level1` text,
  `level2` text,
  `status` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_download_location`
--

DROP TABLE IF EXISTS `pdf_download_location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_download_location` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package` text,
  `level_1` text,
  `level_2` text,
  `location` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8857 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_download_stats`
--

DROP TABLE IF EXISTS `pdf_download_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_download_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resource_reference` varchar(300) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resource_id` int(11) DEFAULT NULL,
  `is_view` tinyint(4) DEFAULT NULL,
  `is_download` tinyint(4) DEFAULT NULL,
  `count` int(11) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `pdf_download_stats_student_id_IDX` (`student_id`) USING BTREE,
  KEY `pdf_download_stats_resource_id_IDX` (`resource_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2906416 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_model_test_paper_scheme`
--

DROP TABLE IF EXISTS `pdf_model_test_paper_scheme`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_model_test_paper_scheme` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `question_num` int(11) NOT NULL,
  `question_type` int(11) NOT NULL,
  `marks` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_model_test_papers`
--

DROP TABLE IF EXISTS `pdf_model_test_papers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_model_test_papers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `code` varchar(8) NOT NULL,
  `question_type` int(11) NOT NULL,
  `marks` int(11) NOT NULL,
  `question_number` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `class` (`class`,`code`,`question_type`,`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=853 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_phy_formula`
--

DROP TABLE IF EXISTS `pdf_phy_formula`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_phy_formula` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject` text NOT NULL,
  `code` varchar(50) NOT NULL,
  `chapter` text NOT NULL,
  `subtopic` text NOT NULL,
  `formula` varchar(2000) NOT NULL,
  `has_image` int(11) NOT NULL DEFAULT '0',
  `image_names` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=8286 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_questions`
--

DROP TABLE IF EXISTS `pdf_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `imageURL` varchar(1000) DEFAULT NULL,
  `ocr_text` varchar(2500) DEFAULT NULL,
  `canonical_url` varchar(2000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2881 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_sample_paper_adhoc`
--

DROP TABLE IF EXISTS `pdf_sample_paper_adhoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_sample_paper_adhoc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `section_num` varchar(20) NOT NULL,
  `question_text` varchar(5000) NOT NULL,
  `answer_text` varchar(10000) DEFAULT NULL,
  `has_figure` int(11) NOT NULL DEFAULT '0',
  `class` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id` (`id`,`code`)
) ENGINE=InnoDB AUTO_INCREMENT=287 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pdf_super60`
--

DROP TABLE IF EXISTS `pdf_super60`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdf_super60` (
  `code` varchar(20) NOT NULL,
  `chapter` varchar(200) NOT NULL,
  `question_id` int(11) NOT NULL,
  `q_answer` varchar(1000) NOT NULL,
  PRIMARY KEY (`code`,`chapter`,`question_id`),
  KEY `chapter` (`chapter`,`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `percona_test_table`
--

DROP TABLE IF EXISTS `percona_test_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `percona_test_table` (
  `id` int(11) NOT NULL,
  `c1` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_at1` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personalization_distinct_mc`
--

DROP TABLE IF EXISTS `personalization_distinct_mc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personalization_distinct_mc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `playlist_id` int(11) NOT NULL,
  `chapter` varchar(300) NOT NULL,
  `chapter_class` int(10) NOT NULL,
  `microconcept` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personalization_distinct_mc_questions`
--

DROP TABLE IF EXISTS `personalization_distinct_mc_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personalization_distinct_mc_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personalization_distinct_mc_id` int(11) NOT NULL,
  `playlist_id` int(11) NOT NULL,
  `type` int(10) NOT NULL,
  `question_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=39345 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personalization_distinct_mc_questions_latest`
--

DROP TABLE IF EXISTS `personalization_distinct_mc_questions_latest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personalization_distinct_mc_questions_latest` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personalization_distinct_mc_id` int(11) NOT NULL,
  `playlist_id` int(11) NOT NULL,
  `type` int(10) NOT NULL,
  `question_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32420 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personalization_distinct_microconcept`
--

DROP TABLE IF EXISTS `personalization_distinct_microconcept`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personalization_distinct_microconcept` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `playlist_id` int(11) NOT NULL,
  `chapter` varchar(300) NOT NULL,
  `chapter_class` int(10) NOT NULL,
  `microconcept` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12067 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personalization_distinct_microconcept_latest`
--

DROP TABLE IF EXISTS `personalization_distinct_microconcept_latest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personalization_distinct_microconcept_latest` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `playlist_id` int(11) NOT NULL,
  `chapter` varchar(300) NOT NULL,
  `chapter_class` int(10) NOT NULL,
  `microconcept` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8387 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pincode_service_area`
--

DROP TABLE IF EXISTS `pincode_service_area`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pincode_service_area` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pincode` int(11) DEFAULT '0',
  `partner` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pincode` (`pincode`),
  KEY `partner` (`partner`)
) ENGINE=InnoDB AUTO_INCREMENT=46812 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pinned_post`
--

DROP TABLE IF EXISTS `pinned_post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pinned_post` (
  `id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `post_type` varchar(50) NOT NULL,
  `title` varchar(400) CHARACTER SET utf8mb4 DEFAULT NULL,
  `student_id` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` varchar(100) DEFAULT NULL,
  `class` varchar(50) NOT NULL,
  `question_id` varchar(50) DEFAULT NULL,
  `audio_url` varchar(100) DEFAULT NULL,
  `start_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` datetime DEFAULT NULL,
  `app_version` varchar(255) DEFAULT '0.0.0',
  `youtube_id` varchar(20) DEFAULT NULL,
  `locale` varchar(10) DEFAULT 'all',
  UNIQUE KEY `id_3` (`id`,`class`),
  KEY `type` (`type`),
  KEY `post_type` (`post_type`),
  KEY `student_id` (`student_id`),
  KEY `is_active` (`is_active`),
  KEY `created_at` (`created_at`),
  KEY `class` (`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pinned_post_experiments`
--

DROP TABLE IF EXISTS `pinned_post_experiments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pinned_post_experiments` (
  `id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `post_type` varchar(50) NOT NULL,
  `title` varchar(400) CHARACTER SET utf8mb4 DEFAULT NULL,
  `student_id` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` varchar(150) DEFAULT NULL,
  `class` varchar(50) NOT NULL,
  `question_id` varchar(50) DEFAULT NULL,
  `audio_url` varchar(100) DEFAULT NULL,
  `start_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` datetime DEFAULT NULL,
  `app_version` varchar(255) DEFAULT '0.0.0',
  `youtube_id` varchar(20) DEFAULT NULL,
  `locale` varchar(10) DEFAULT 'all',
  UNIQUE KEY `id_3` (`id`,`class`),
  KEY `type` (`type`),
  KEY `post_type` (`post_type`),
  KEY `student_id` (`student_id`),
  KEY `is_active` (`is_active`),
  KEY `created_at` (`created_at`),
  KEY `class` (`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `playlist_questions_mapping`
--

DROP TABLE IF EXISTS `playlist_questions_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `playlist_questions_mapping` (
  `playlist_id` varchar(50) NOT NULL,
  `question_id` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `student_id` int(50) NOT NULL,
  PRIMARY KEY (`playlist_id`,`question_id`,`student_id`) USING BTREE,
  KEY `question_id` (`question_id`),
  KEY `created_at` (`created_at`),
  KEY `is_active` (`is_active`),
  KEY `playlist_id_2` (`playlist_id`,`student_id`,`is_active`,`created_at`) USING BTREE,
  KEY `idx_test1` (`student_id`,`is_active`,`playlist_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `playlist_studentid_qid_mapping`
--

DROP TABLE IF EXISTS `playlist_studentid_qid_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `playlist_studentid_qid_mapping` (
  `new_student_id` int(11) NOT NULL,
  `old_question_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `thumbnail_url` varchar(1000) NOT NULL,
  `playlist_name` varchar(1000) NOT NULL,
  `chapter` varchar(1000) NOT NULL,
  `exercise_name` varchar(1000) NOT NULL,
  `package_language` varchar(10) NOT NULL,
  `video_language` varchar(10) NOT NULL,
  `target_group` varchar(255) NOT NULL,
  `target_group_type` varchar(255) NOT NULL,
  `content_format` varchar(100) NOT NULL,
  `is_processed` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`new_student_id`,`old_question_id`),
  KEY `playlist_name` (`playlist_name`),
  KEY `chapter` (`chapter`),
  KEY `exercise_name` (`exercise_name`),
  KEY `package_language` (`package_language`),
  KEY `video_language` (`video_language`),
  KEY `target_group` (`target_group`,`target_group_type`,`content_format`),
  KEY `is_processed` (`is_processed`),
  KEY `created_at` (`created_at`,`updated_at`),
  KEY `class` (`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `playstore_reviews_ratings_web`
--

DROP TABLE IF EXISTS `playstore_reviews_ratings_web`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `playstore_reviews_ratings_web` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(100) DEFAULT NULL,
  `rating` int(2) NOT NULL,
  `review_text` varchar(500) DEFAULT NULL,
  `review_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=141572 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pre_login_onboarding`
--

DROP TABLE IF EXISTS `pre_login_onboarding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pre_login_onboarding` (
  `id` int(255) NOT NULL AUTO_INCREMENT,
  `udid` varchar(255) NOT NULL,
  `gcm_reg_id` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_converted` int(255) DEFAULT NULL,
  `is_back` int(255) DEFAULT NULL,
  `app_version` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `udid_idx` (`udid`),
  KEY `created_at` (`created_at`),
  KEY `is_converted` (`is_converted`),
  KEY `gcm_reg_id` (`gcm_reg_id`)
) ENGINE=InnoDB AUTO_INCREMENT=46882119 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `premium_content_block_view_log`
--

DROP TABLE IF EXISTS `premium_content_block_view_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `premium_content_block_view_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `view_id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `is_vip` tinyint(1) NOT NULL DEFAULT '0',
  `cta_viewed` tinyint(1) NOT NULL DEFAULT '1',
  `cta_clicked` tinyint(4) DEFAULT NULL,
  `view_from` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=951361 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `premium_video_experiment_config`
--

DROP TABLE IF EXISTS `premium_video_experiment_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `premium_video_experiment_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` varchar(500) NOT NULL,
  `lock_time_sec` int(11) NOT NULL DEFAULT '0',
  `lock_window_day` int(11) NOT NULL DEFAULT '0',
  `locale` varchar(50) NOT NULL,
  `message_title` varchar(500) DEFAULT NULL,
  `message_description` varchar(500) DEFAULT NULL,
  `course_details_button_text` varchar(500) DEFAULT NULL,
  `course_details_button_deeplink` varchar(500) DEFAULT NULL,
  `course_purchase_button_text` varchar(500) DEFAULT NULL,
  `course_purchase_button_deeplink` varchar(500) DEFAULT NULL,
  `page` varchar(100) DEFAULT NULL,
  `variant_id` int(11) NOT NULL,
  `is_video_lock` tinyint(4) NOT NULL DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `primary`
--

DROP TABLE IF EXISTS `primary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `primary` (
  `id` int(11) NOT NULL,
  `name` varchar(255) CHARACTER SET utf8 NOT NULL,
  `seq` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `super_chapter_id` int(11) NOT NULL,
  `chapter_id` int(11) NOT NULL,
  `formula_text` mediumtext CHARACTER SET utf8 NOT NULL,
  `image_url` mediumtext CHARACTER SET utf8 NOT NULL,
  `ocr` text CHARACTER SET utf8 NOT NULL,
  `html` mediumtext CHARACTER SET utf8 NOT NULL,
  `max_image_height` double DEFAULT NULL,
  `is_marked_for_memorize` tinyint(1) DEFAULT NULL,
  `topic_id` int(11) DEFAULT NULL,
  `webview_height` double DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `profile_properties`
--

DROP TABLE IF EXISTS `profile_properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `profile_properties` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '0',
  `type` varchar(45) NOT NULL,
  `option` varchar(100) NOT NULL,
  `option_id` int(55) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `img_url` varchar(500) DEFAULT NULL,
  `locale` varchar(45) DEFAULT NULL,
  `meta_1` enum('GRID_MULTI_SELECT_OTHER_ITEM','GRID_MULTI_SELECT_ITEM','GRID_SINGLE_SELECT_OTHER_ITEM','GRID_SINGLE_SELECT_ITEM','LIST_MULTI_SELECT_ITEM','LIST_SINGLE_SELECT_ITEM','LIST_SINGLE_SELECT_OTHER_ITEM','LIST_MULTI_SELECT_OTHER_ITEM') DEFAULT NULL,
  `meta_2` text,
  `priority` int(2) DEFAULT NULL,
  `region` varchar(45) DEFAULT 'IN',
  PRIMARY KEY (`id`),
  KEY `priority` (`priority`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_coupons`
--

DROP TABLE IF EXISTS `promo_coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promo_coupons` (
  `coupon_id` int(11) NOT NULL AUTO_INCREMENT,
  `coupon_code` varchar(10) NOT NULL,
  `discount_identifier` int(11) NOT NULL,
  `valid_from` varchar(16) NOT NULL,
  `valid_to` varchar(16) NOT NULL,
  `coupon_type` int(11) NOT NULL,
  `reffered_by` int(11) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valid_country` tinyint(4) NOT NULL DEFAULT '0',
  `coupon_status` int(11) NOT NULL,
  `coupon_value` int(11) NOT NULL,
  `coupon_questions` int(11) NOT NULL DEFAULT '0',
  `validity_days` int(11) NOT NULL,
  PRIMARY KEY (`coupon_id`),
  UNIQUE KEY `coupon_code` (`coupon_code`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pzn_similar`
--

DROP TABLE IF EXISTS `pzn_similar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pzn_similar` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `target_group` varchar(70) DEFAULT NULL,
  `mc_id` varchar(25) DEFAULT NULL,
  `locale` varchar(11) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32899 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `q_a_5`
--

DROP TABLE IF EXISTS `q_a_5`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `q_a_5` (
  `student_id` varchar(20) NOT NULL,
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `q_a_8`
--

DROP TABLE IF EXISTS `q_a_8`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `q_a_8` (
  `student_id` varchar(20) NOT NULL,
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `q_corpus`
--

DROP TABLE IF EXISTS `q_corpus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `q_corpus` (
  `q_id` int(11) NOT NULL,
  `question` text NOT NULL,
  `class` varchar(5) NOT NULL,
  `subject` varchar(32) NOT NULL,
  `chapter` varchar(64) NOT NULL,
  `q_id_word` varchar(64) NOT NULL,
  `video_id` varchar(70) NOT NULL,
  `created_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `q_text`
--

DROP TABLE IF EXISTS `q_text`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `q_text` (
  `q_id` int(11) NOT NULL,
  `q_text` text,
  PRIMARY KEY (`q_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `q_word_list`
--

DROP TABLE IF EXISTS `q_word_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `q_word_list` (
  `question_id` varchar(32) NOT NULL,
  `question` text NOT NULL,
  `mathml` text CHARACTER SET utf8 NOT NULL,
  `class` int(11) NOT NULL,
  `topic` varchar(64) NOT NULL,
  `expert_id` int(11) NOT NULL,
  `is_answered` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qc_history`
--

DROP TABLE IF EXISTS `qc_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qc_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expert_id` int(11) NOT NULL,
  `review_expert_id` int(11) NOT NULL,
  `reviewed_answer_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  `video_time` int(11) DEFAULT NULL,
  `engage_time` int(11) DEFAULT NULL,
  `feedback` varchar(255) DEFAULT NULL,
  `redone` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `m_question_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5930436 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qc_remarks`
--

DROP TABLE IF EXISTS `qc_remarks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qc_remarks` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `question_id` int(55) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `expert_id` int(55) NOT NULL,
  `q_expert_id` int(55) NOT NULL,
  `remarks` varchar(1000) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=545835 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qc_status`
--

DROP TABLE IF EXISTS `qc_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qc_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expert_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `review_expert_id` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  `video_time` int(11) DEFAULT NULL,
  `engage_time` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `feedback` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `redone` int(11) NOT NULL DEFAULT '0',
  `answer_id` int(11) DEFAULT NULL,
  `reviewed_answer_id` int(11) NOT NULL,
  `m_question_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_id` (`question_id`),
  KEY `expert_id` (`expert_id`),
  KEY `review_expert_id` (`review_expert_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=2330061 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_ask_retry_logging`
--

DROP TABLE IF EXISTS `question_ask_retry_logging`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_ask_retry_logging` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  `retry_counter` int(11) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45000648 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_ask_stats`
--

DROP TABLE IF EXISTS `question_ask_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_ask_stats` (
  `question_id` varchar(255) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_bookmarked`
--

DROP TABLE IF EXISTS `question_bookmarked`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_bookmarked` (
  `student_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `added_date` datetime NOT NULL,
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_chapter_alias`
--

DROP TABLE IF EXISTS `question_chapter_alias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_chapter_alias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `chapter` varchar(250) NOT NULL,
  `ocr_text` text NOT NULL,
  `question` text NOT NULL,
  `matched_question` int(11) DEFAULT NULL,
  `chapter_alias` varchar(250) NOT NULL,
  `master_chapter_alias` varchar(500) DEFAULT NULL,
  `package_id` varchar(250) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `chapter_alias_2` (`chapter_alias`,`class`),
  KEY `question_id` (`question_id`),
  KEY `class` (`class`,`master_chapter_alias`,`package_id`)
) ENGINE=InnoDB AUTO_INCREMENT=33889 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_id_answer_mapping`
--

DROP TABLE IF EXISTS `question_id_answer_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_id_answer_mapping` (
  `question_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  PRIMARY KEY (`question_id`),
  KEY `question_id` (`question_id`),
  KEY `answer_id` (`answer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_image_draft`
--

DROP TABLE IF EXISTS `question_image_draft`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_image_draft` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book` varchar(255) NOT NULL,
  `class` int(11) NOT NULL,
  `subject` varchar(30) NOT NULL,
  `chapter` varchar(150) NOT NULL,
  `page` tinytext NOT NULL,
  `img_link` varchar(255) NOT NULL,
  `ocr_text` longtext NOT NULL,
  `status` enum('PROCESSED','PENDING') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_iteration_mapping`
--

DROP TABLE IF EXISTS `question_iteration_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_iteration_mapping` (
  `question_id` int(11) NOT NULL,
  `iteration_name` varchar(255) DEFAULT NULL,
  UNIQUE KEY `question_id` (`question_id`),
  KEY `iteration_name` (`iteration_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_mapping`
--

DROP TABLE IF EXISTS `question_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `package_language` varchar(50) DEFAULT NULL,
  `ocr` text,
  PRIMARY KEY (`id`),
  KEY `package_language` (`package_language`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=62508 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_mappings_result`
--

DROP TABLE IF EXISTS `question_mappings_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_mappings_result` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `qid_1` int(55) NOT NULL,
  `ocr_1` text,
  `qid_2` int(11) NOT NULL,
  `ocr_2` text,
  PRIMARY KEY (`id`),
  KEY `qid_1` (`qid_1`),
  KEY `qid_2` (`qid_2`)
) ENGINE=InnoDB AUTO_INCREMENT=9961 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_package_mapping`
--

DROP TABLE IF EXISTS `question_package_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_package_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `packages` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `student_id` (`student_id`),
  KEY `packages` (`packages`)
) ENGINE=InnoDB AUTO_INCREMENT=59765 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_pucho_rewards`
--

DROP TABLE IF EXISTS `question_pucho_rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_pucho_rewards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) NOT NULL,
  `whatsapp_phone_number` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `contest_date` timestamp NOT NULL,
  `reward` text,
  `is_sent` tinyint(1) DEFAULT '0',
  `pincode` text,
  `flat_number` text,
  `street` text,
  `landmark` text,
  `name` text,
  PRIMARY KEY (`id`),
  KEY `question_pucho_contest_student_id` (`student_id`),
  KEY `question_pucho_contest_contest_date` (`contest_date`)
) ENGINE=InnoDB AUTO_INCREMENT=1068 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_web_deeplinks`
--

DROP TABLE IF EXISTS `question_web_deeplinks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_web_deeplinks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `deep_links` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions` (
  `question_id` int(55) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `book` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `question` mediumtext NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `question_image` varchar(255) DEFAULT NULL,
  `is_allocated` varchar(255) NOT NULL DEFAULT '0',
  `allocated_to` varchar(55) NOT NULL DEFAULT '0',
  `allocation_time` varchar(255) DEFAULT NULL,
  `is_answered` int(55) NOT NULL DEFAULT '0',
  `is_text_answered` tinyint(4) DEFAULT '0',
  `ocr_done` int(11) DEFAULT '0',
  `ocr_text` text,
  `original_ocr_text` text,
  `matched_question` int(11) DEFAULT NULL,
  `question_credit` tinyint(4) NOT NULL DEFAULT '1',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_trial` tinyint(4) NOT NULL DEFAULT '0',
  `is_skipped` tinyint(4) NOT NULL DEFAULT '0',
  `parent_id` int(11) DEFAULT NULL,
  `incorrect_ocr` int(11) DEFAULT NULL,
  `skip_question` int(11) DEFAULT NULL,
  `locale` varchar(50) DEFAULT 'en',
  `difficulty` tinyint(4) DEFAULT NULL,
  `is_community` tinyint(1) NOT NULL DEFAULT '0',
  `matched_app_questions` tinyint(1) DEFAULT NULL,
  `wrong_image` tinyint(4) NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`),
  KEY `student_id` (`student_id`),
  KEY `is_answered` (`is_answered`),
  KEY `class` (`class`),
  KEY `is_community` (`is_community`),
  KEY `chapter` (`chapter`),
  KEY `question_credit` (`question_credit`),
  KEY `timestamp` (`timestamp`),
  KEY `is_skipped` (`is_skipped`),
  KEY `matched_question` (`matched_question`),
  KEY `is_allocated` (`is_allocated`),
  KEY `subject` (`subject`),
  KEY `allocated_to` (`allocated_to`),
  KEY `is_text_answered` (`is_text_answered`),
  KEY `doubt&student_id` (`doubt`,`student_id`),
  KEY `idx_updated_at` (`updated_at`)
) ENGINE=InnoDB AUTO_INCREMENT=648671152 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_asked`
--

DROP TABLE IF EXISTS `questions_asked`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_asked` (
  `question_id` int(55) NOT NULL COMMENT 'removing primary key and auto increment',
  `student_id` int(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `book` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `question` mediumtext NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `question_image` varchar(255) DEFAULT NULL,
  `is_allocated` varchar(255) NOT NULL DEFAULT '0',
  `allocated_to` varchar(55) NOT NULL DEFAULT '0',
  `allocation_time` varchar(255) DEFAULT NULL,
  `is_answered` int(55) NOT NULL DEFAULT '0',
  `is_text_answered` tinyint(4) DEFAULT '0',
  `ocr_done` int(11) DEFAULT '0',
  `ocr_text` text,
  `original_ocr_text` text,
  `matched_question` int(11) DEFAULT NULL,
  `question_credit` tinyint(4) NOT NULL DEFAULT '1',
  `timestamp` timestamp NULL DEFAULT NULL,
  `is_trial` tinyint(4) NOT NULL DEFAULT '0',
  `is_skipped` tinyint(4) NOT NULL DEFAULT '0',
  `parent_id` int(11) DEFAULT NULL,
  `incorrect_ocr` int(11) DEFAULT NULL,
  `skip_question` int(11) DEFAULT NULL,
  `locale` varchar(50) DEFAULT 'en',
  `difficulty` tinyint(4) DEFAULT NULL,
  `is_community` tinyint(1) NOT NULL DEFAULT '0',
  `matched_app_questions` tinyint(1) DEFAULT NULL,
  `wrong_image` tinyint(4) NOT NULL DEFAULT '0',
  `uuid` varchar(36) NOT NULL COMMENT 'renaming UUID to uuid',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'CURRENT_TIMESTAMP',
  PRIMARY KEY (`uuid`),
  KEY `student_id` (`student_id`),
  KEY `doubt` (`doubt`),
  KEY `is_answered` (`is_answered`),
  KEY `class` (`class`),
  KEY `is_community` (`is_community`),
  KEY `chapter` (`chapter`),
  KEY `question_credit` (`question_credit`),
  KEY `timestamp` (`timestamp`),
  KEY `is_skipped` (`is_skipped`),
  KEY `matched_question` (`matched_question`),
  KEY `is_allocated` (`is_allocated`),
  KEY `matched_app_questions` (`matched_app_questions`),
  KEY `subject` (`subject`),
  KEY `allocated_to` (`allocated_to`),
  KEY `wrong_image` (`wrong_image`),
  KEY `is_text_answered` (`is_text_answered`),
  KEY `question_id` (`question_id`),
  FULLTEXT KEY `ocr_text` (`ocr_text`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_book_meta`
--

DROP TABLE IF EXISTS `questions_book_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_book_meta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  `subject` varchar(200),
  `book_meta` varchar(5000) DEFAULT NULL,
  `tag` varchar(2000) DEFAULT NULL,
  `matched_question` int(11) DEFAULT NULL,
  `matched_tag` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`,`matched_question`),
  KEY `subject` (`subject`),
  KEY `book_meta` (`book_meta`(1024)),
  KEY `tag` (`tag`(1024)),
  KEY `matched_tag` (`matched_tag`(1024))
) ENGINE=InnoDB AUTO_INCREMENT=617659 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_book_meta_final`
--

DROP TABLE IF EXISTS `questions_book_meta_final`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_book_meta_final` (
  `question_id` int(11) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `book_meta` varchar(1000) DEFAULT NULL,
  `tag` varchar(1000) DEFAULT NULL,
  KEY `question_id_2` (`question_id`,`book_meta`),
  KEY `tag` (`tag`),
  KEY `question_id_3` (`question_id`,`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_draft`
--

DROP TABLE IF EXISTS `questions_draft`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_draft` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `img_id` int(11) NOT NULL,
  `ocr` longtext NOT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_exact_match`
--

DROP TABLE IF EXISTS `questions_exact_match`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_exact_match` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(55) NOT NULL,
  `student_id` int(255) NOT NULL,
  `video_watched` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38342839 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_hindi_thumbnail`
--

DROP TABLE IF EXISTS `questions_hindi_thumbnail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_hindi_thumbnail` (
  `question_id` int(11) NOT NULL,
  `question_text` varchar(255) NOT NULL,
  `question_hindi` varchar(255) NOT NULL,
  `thumbnail_done` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_localized`
--

DROP TABLE IF EXISTS `questions_localized`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_localized` (
  `question_id` int(55) NOT NULL,
  `english` longtext,
  `hindi` longtext,
  `bengali` longtext,
  `gujarati` longtext,
  `kannada` longtext,
  `malayalam` longtext,
  `marathi` longtext,
  `nepali` longtext,
  `punjabi` longtext,
  `Tamil` longtext,
  `Telugu` longtext,
  `Urdu` longtext,
  `thumbnail_done` varchar(20) DEFAULT '1',
  `corrected_english` text,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_localized_test`
--

DROP TABLE IF EXISTS `questions_localized_test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_localized_test` (
  `question_id` int(55) NOT NULL,
  `english` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `hindi` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `bengali` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `gujarati` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `kannada` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `malayalam` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `marathi` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `nepali` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `punjabi` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `Tamil` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `Telugu` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `Urdu` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_mapping`
--

DROP TABLE IF EXISTS `questions_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_mapping` (
  `id` int(11) NOT NULL,
  `question_id` int(55) NOT NULL,
  `package_language` tinytext,
  `ocr` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_mappings_result`
--

DROP TABLE IF EXISTS `questions_mappings_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_mappings_result` (
  `id` int(11) NOT NULL,
  `qid_1` int(55) NOT NULL,
  `ocr_1` text,
  `qid_2` int(11) NOT NULL,
  `ocr_2` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_mathjaxhtml`
--

DROP TABLE IF EXISTS `questions_mathjaxhtml`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_mathjaxhtml` (
  `question_id` int(11) NOT NULL,
  `html` text NOT NULL,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_mathjaxhtml_error`
--

DROP TABLE IF EXISTS `questions_mathjaxhtml_error`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_mathjaxhtml_error` (
  `question_id` int(11) NOT NULL,
  `error` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_meta`
--

DROP TABLE IF EXISTS `questions_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_meta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(55) DEFAULT NULL,
  `intern_id` int(22) NOT NULL,
  `assigned_to` varchar(20) DEFAULT NULL,
  `class` varchar(30) DEFAULT NULL,
  `chapter` varchar(200) DEFAULT NULL,
  `subtopic` varchar(200) DEFAULT NULL,
  `microconcept` varchar(200) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `target_course` varchar(50) DEFAULT NULL,
  `package` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `q_options` varchar(900) DEFAULT NULL,
  `q_answer` varchar(900) DEFAULT NULL,
  `diagram_type` varchar(50) DEFAULT NULL,
  `concept_type` varchar(50) DEFAULT NULL,
  `chapter_type` varchar(100) DEFAULT NULL,
  `we_type` varchar(30) DEFAULT NULL,
  `ei_type` varchar(30) DEFAULT NULL,
  `aptitude_type` varchar(30) DEFAULT NULL,
  `pfs_type` varchar(100) DEFAULT NULL,
  `symbol_type` varchar(50) DEFAULT NULL,
  `doubtnut_recommended` varchar(50) DEFAULT NULL,
  `secondary_class` varchar(20) DEFAULT NULL,
  `secondary_chapter` varchar(300) DEFAULT NULL,
  `secondary_subtopic` varchar(300) DEFAULT NULL,
  `secondary_microconcept` varchar(300) DEFAULT NULL,
  `video_quality` varchar(50) DEFAULT NULL,
  `audio_quality` varchar(50) DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  `ocr_quality` varchar(50) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_skipped` tinyint(4) DEFAULT '0',
  `subject` varchar(100) DEFAULT NULL,
  `questions_title` varchar(1000) DEFAULT NULL,
  `meta_tags` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_id` (`question_id`),
  KEY `doubtnut_recommended` (`doubtnut_recommended`),
  KEY `class` (`class`),
  KEY `is_skipped` (`is_skipped`),
  KEY `microconcept` (`microconcept`),
  KEY `secondary_microconcept` (`secondary_microconcept`),
  KEY `chapter` (`chapter`,`subtopic`,`level`,`target_course`,`timestamp`),
  KEY `target_course` (`target_course`)
) ENGINE=InnoDB AUTO_INCREMENT=7431497 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_meta_dummy`
--

DROP TABLE IF EXISTS `questions_meta_dummy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_meta_dummy` (
  `id` int(11) NOT NULL DEFAULT '0',
  `question_id` int(55) DEFAULT NULL,
  `intern_id` int(22) NOT NULL,
  `assigned_to` varchar(20) DEFAULT NULL,
  `class` varchar(30) DEFAULT NULL,
  `chapter` varchar(200) DEFAULT NULL,
  `subtopic` varchar(200) DEFAULT NULL,
  `microconcept` varchar(200) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  `target_course` varchar(50) DEFAULT NULL,
  `package` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `q_options` varchar(900) DEFAULT NULL,
  `q_answer` varchar(900) DEFAULT NULL,
  `diagram_type` varchar(50) DEFAULT NULL,
  `concept_type` varchar(50) DEFAULT NULL,
  `chapter_type` varchar(100) DEFAULT NULL,
  `we_type` varchar(30) DEFAULT NULL,
  `ei_type` varchar(30) DEFAULT NULL,
  `aptitude_type` varchar(30) DEFAULT NULL,
  `pfs_type` varchar(100) DEFAULT NULL,
  `symbol_type` varchar(50) DEFAULT NULL,
  `doubtnut_recommended` varchar(50) DEFAULT NULL,
  `secondary_class` varchar(20) DEFAULT NULL,
  `secondary_chapter` varchar(300) DEFAULT NULL,
  `secondary_subtopic` varchar(300) DEFAULT NULL,
  `secondary_microconcept` varchar(300) DEFAULT NULL,
  `video_quality` varchar(50) DEFAULT NULL,
  `audio_quality` varchar(50) DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  `ocr_quality` varchar(50) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_skipped` tinyint(4) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_new`
--

DROP TABLE IF EXISTS `questions_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_new` (
  `question_id` int(55) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `book` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `question` mediumtext NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `question_image` varchar(255) DEFAULT NULL,
  `is_allocated` varchar(255) NOT NULL DEFAULT '0',
  `allocated_to` varchar(55) NOT NULL DEFAULT '0',
  `allocation_time` varchar(255) DEFAULT NULL,
  `is_answered` int(55) NOT NULL DEFAULT '0',
  `is_text_answered` tinyint(4) DEFAULT '0',
  `ocr_done` int(11) DEFAULT '0',
  `ocr_text` text,
  `original_ocr_text` text,
  `matched_question` int(11) DEFAULT NULL,
  `question_credit` tinyint(4) NOT NULL DEFAULT '1',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_trial` tinyint(4) NOT NULL DEFAULT '0',
  `is_skipped` tinyint(4) NOT NULL DEFAULT '0',
  `parent_id` int(11) DEFAULT NULL,
  `incorrect_ocr` int(11) DEFAULT NULL,
  `skip_question` int(11) DEFAULT NULL,
  `locale` varchar(50) DEFAULT 'en',
  `difficulty` tinyint(4) DEFAULT NULL,
  `is_community` tinyint(1) NOT NULL DEFAULT '0',
  `matched_app_questions` tinyint(1) DEFAULT NULL,
  `wrong_image` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`question_id`),
  KEY `student_id` (`student_id`),
  KEY `is_answered` (`is_answered`),
  KEY `class` (`class`),
  KEY `is_community` (`is_community`),
  KEY `chapter` (`chapter`),
  KEY `question_credit` (`question_credit`),
  KEY `timestamp` (`timestamp`),
  KEY `is_skipped` (`is_skipped`),
  KEY `matched_question` (`matched_question`),
  KEY `is_allocated` (`is_allocated`),
  KEY `subject` (`subject`),
  KEY `allocated_to` (`allocated_to`),
  KEY `is_text_answered` (`is_text_answered`),
  KEY `doubt&student_id` (`doubt`,`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1189820634 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_new_temp_v1`
--

DROP TABLE IF EXISTS `questions_new_temp_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_new_temp_v1` (
  `question_id` int(55) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `student_id` int(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `book` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `question` mediumtext NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `question_image` varchar(255) DEFAULT NULL,
  `is_allocated` varchar(255) NOT NULL DEFAULT '0',
  `allocated_to` varchar(55) NOT NULL DEFAULT '0',
  `allocation_time` varchar(255) DEFAULT NULL,
  `is_answered` int(55) NOT NULL DEFAULT '0',
  `is_text_answered` tinyint(4) DEFAULT '0',
  `ocr_done` int(11) DEFAULT '0',
  `ocr_text` text,
  `original_ocr_text` text,
  `matched_question` int(11) DEFAULT NULL,
  `question_credit` tinyint(4) NOT NULL DEFAULT '1',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_trial` tinyint(4) NOT NULL DEFAULT '0',
  `is_skipped` tinyint(4) NOT NULL DEFAULT '0',
  `parent_id` int(11) DEFAULT NULL,
  `incorrect_ocr` int(11) DEFAULT NULL,
  `skip_question` int(11) DEFAULT NULL,
  `locale` varchar(50) DEFAULT 'en',
  `difficulty` tinyint(4) DEFAULT NULL,
  `is_community` tinyint(1) NOT NULL DEFAULT '0',
  `matched_app_questions` tinyint(1) DEFAULT NULL,
  `wrong_image` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`question_id`),
  KEY `student_id` (`student_id`),
  KEY `uuid` (`uuid`),
  KEY `is_answered` (`is_answered`),
  KEY `class` (`class`),
  KEY `is_community` (`is_community`),
  KEY `chapter` (`chapter`),
  KEY `question_credit` (`question_credit`),
  KEY `timestamp` (`timestamp`),
  KEY `is_skipped` (`is_skipped`),
  KEY `matched_question` (`matched_question`),
  KEY `is_allocated` (`is_allocated`),
  KEY `subject` (`subject`),
  KEY `allocated_to` (`allocated_to`),
  KEY `is_text_answered` (`is_text_answered`),
  KEY `doubt&student_id` (`doubt`,`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_ocr`
--

DROP TABLE IF EXISTS `questions_ocr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_ocr` (
  `question_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `question` mediumtext NOT NULL,
  `ocr_text` text,
  `original_ocr_text` text,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `locale` varchar(50) NOT NULL DEFAULT 'en',
  `matched_app_questions` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=121089569 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_pre_signed_url_mapping`
--

DROP TABLE IF EXISTS `questions_pre_signed_url_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_pre_signed_url_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `is_uploaded` int(11) DEFAULT '0',
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `timestamp` (`timestamp`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=238078720 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_web`
--

DROP TABLE IF EXISTS `questions_web`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_web` (
  `question_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `doubt` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `class` varchar(10) DEFAULT NULL,
  `chapter` varchar(200) DEFAULT NULL,
  `chapter_hi` varchar(200) DEFAULT NULL,
  `subtopic` varchar(200) DEFAULT NULL,
  `subtopic_hi` varchar(200) DEFAULT NULL,
  `ocr_text` longtext,
  `ocr_text_hi` longtext,
  `package` varchar(100) DEFAULT NULL,
  `target_course` varchar(50) DEFAULT NULL,
  `mc_id` varchar(200) DEFAULT NULL,
  `mc_text` varchar(500) DEFAULT NULL,
  `mc_text_hi` varchar(500) DEFAULT NULL,
  `question_timestamp` timestamp NULL DEFAULT NULL,
  `matched_question` int(11) DEFAULT NULL,
  `packages` varchar(255) DEFAULT NULL,
  `matched_student_id` int(11) DEFAULT NULL,
  `is_answered` int(11) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `chapter_clean` varchar(255) DEFAULT NULL,
  `subtopic_clean` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`question_id`),
  KEY `question_id` (`question_id`,`chapter`,`chapter_hi`,`subtopic`,`subtopic_hi`),
  KEY `question_timestamp` (`question_timestamp`),
  KEY `doubt` (`doubt`,`class`,`mc_id`,`matched_question`,`matched_student_id`),
  KEY `is_answered` (`is_answered`),
  KEY `subject` (`subject`),
  KEY `created_at` (`created_at`),
  KEY `idx_combo` (`student_id`,`subtopic_clean`,`chapter_clean`)
) ENGINE=InnoDB AUTO_INCREMENT=648627268 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_web_external`
--

DROP TABLE IF EXISTS `questions_web_external`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_web_external` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_id` int(11) DEFAULT '1',
  `question` text,
  `source_question_id` int(11) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `canonical_url` varchar(255) DEFAULT NULL,
  `subject_id` int(11) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `matched_question` int(11) DEFAULT NULL,
  `matched_to` int(11) DEFAULT NULL,
  `status` tinyint(4) NOT NULL DEFAULT '0',
  `invalid_question` varchar(5) NOT NULL DEFAULT 'No',
  `is_assigned_to` varchar(30) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `status` (`status`),
  KEY `questions_web_external_url_IDX` (`url`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1387377 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `questions_youtube`
--

DROP TABLE IF EXISTS `questions_youtube`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions_youtube` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(55) NOT NULL,
  `student_id` int(255) NOT NULL,
  `youtube_id` varchar(255) NOT NULL,
  `is_show` tinyint(4) NOT NULL DEFAULT '0',
  `is_click` tinyint(4) NOT NULL DEFAULT '0',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `is_show` (`is_show`),
  KEY `is_click` (`is_click`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=156149 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz`
--

DROP TABLE IF EXISTS `quiz`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz` (
  `quiz_id` int(255) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `time_start` time NOT NULL,
  `time_end` time NOT NULL,
  `subject` varchar(255) NOT NULL,
  `class` enum('6','7','8','9','10','11','12','14') NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` int(255) NOT NULL DEFAULT '0',
  `image_url` varchar(100) DEFAULT NULL,
  `is_data_sync` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`quiz_id`),
  KEY `is_active` (`is_active`),
  KEY `class` (`class`)
) ENGINE=InnoDB AUTO_INCREMENT=24008 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_master_data`
--

DROP TABLE IF EXISTS `quiz_master_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_master_data` (
  `quiz_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL AUTO_INCREMENT,
  `question_text_en` longtext NOT NULL,
  `question_text_hi` longtext NOT NULL,
  `question_image` varchar(300) NOT NULL,
  `q_pos_mark` int(11) NOT NULL,
  `q_neg_mark` int(11) NOT NULL,
  `q_type` int(11) NOT NULL,
  `op1` varchar(255) NOT NULL,
  `op2` varchar(255) NOT NULL,
  `op3` varchar(255) NOT NULL,
  `op4` varchar(255) NOT NULL,
  `op1_correct` int(11) NOT NULL,
  `op2_correct` int(11) NOT NULL,
  `op3_correct` int(11) NOT NULL,
  `op4_correct` int(11) NOT NULL,
  `is_data_sync` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=231896 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_notifications`
--

DROP TABLE IF EXISTS `quiz_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day` int(11) NOT NULL,
  `notification` varchar(50) NOT NULL,
  `notification_type` varchar(50) NOT NULL,
  `heading` varchar(100) NOT NULL,
  `heading_hi` varchar(100) DEFAULT NULL,
  `button_text` varchar(25) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `title_hi` varchar(100) DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `is_skipable` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_question_options`
--

DROP TABLE IF EXISTS `quiz_question_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_question_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `option_value` varchar(255) NOT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_data_sync` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `is_active` (`is_active`),
  KEY `quiz_id` (`quiz_id`)
) ENGINE=InnoDB AUTO_INCREMENT=410518 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_questions`
--

DROP TABLE IF EXISTS `quiz_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_questions` (
  `question_id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `q_text_en` text NOT NULL,
  `q_type` int(10) NOT NULL,
  `q_image` varchar(255) DEFAULT NULL,
  `q_video` varchar(255) DEFAULT NULL,
  `q_pos_mark` int(11) NOT NULL,
  `q_neg_mark` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_data_sync` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`question_id`),
  KEY `quiz_id` (`quiz_id`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=231896 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_rules`
--

DROP TABLE IF EXISTS `quiz_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_rules` (
  `quiz_id` int(11) NOT NULL,
  `rule_id` int(11) NOT NULL,
  `rule` longtext NOT NULL,
  UNIQUE KEY `quiz_id_2` (`quiz_id`,`rule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_sms_campaign_data`
--

DROP TABLE IF EXISTS `quiz_sms_campaign_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_sms_campaign_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mobile` varchar(45) DEFAULT NULL,
  `response` varchar(255) DEFAULT NULL,
  `deeplink` varchar(45) DEFAULT NULL,
  `type` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2581362 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_student_question`
--

DROP TABLE IF EXISTS `quiz_student_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_student_question` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `opt_selected` varchar(50) NOT NULL,
  `score` int(11) NOT NULL,
  `is_correct` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `eligible` tinyint(1) DEFAULT NULL,
  `is_skipped` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `quiz_id_2` (`quiz_id`,`student_id`,`question_id`),
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`),
  KEY `is_correct` (`is_correct`),
  KEY `opt_selected` (`opt_selected`),
  KEY `eligible` (`eligible`),
  KEY `is_skipped` (`is_skipped`)
) ENGINE=InnoDB AUTO_INCREMENT=705811 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_web_details`
--

DROP TABLE IF EXISTS `quiz_web_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_web_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) NOT NULL,
  `student_id` varchar(255) NOT NULL,
  `is_completed` varchar(10) DEFAULT NULL,
  `questions` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `class` int(11) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `language` varchar(10) DEFAULT NULL,
  `source` varchar(20) DEFAULT 'WEB',
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `student_id` (`student_id`),
  KEY `is_completed` (`is_completed`),
  KEY `questions` (`questions`),
  KEY `created_at` (`created_at`),
  KEY `class` (`class`),
  KEY `subject` (`subject`),
  KEY `chapter` (`chapter`),
  KEY `language` (`language`),
  KEY `source` (`source`)
) ENGINE=InnoDB AUTO_INCREMENT=2095217 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_web_details_logs`
--

DROP TABLE IF EXISTS `quiz_web_details_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_web_details_logs` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `session_id` varchar(255) NOT NULL,
  `student_id` varchar(255) NOT NULL,
  `question_id` int(11) DEFAULT NULL,
  `selected_option` varchar(10) DEFAULT NULL,
  `is_correct` varchar(10) DEFAULT NULL,
  `correct_option` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=9290238 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_winners`
--

DROP TABLE IF EXISTS `quiz_winners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_winners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `final_submit_time` timestamp NULL DEFAULT NULL,
  `student_username` text NOT NULL,
  `student_fname` text NOT NULL,
  `student_email` text NOT NULL,
  `mobile` varchar(11) NOT NULL,
  `gcm_reg_id` varchar(255) NOT NULL,
  `date_q` date NOT NULL,
  `class` enum('6','7','8','9','10','11','12','14') NOT NULL,
  `payment_status` varchar(500) NOT NULL DEFAULT '0',
  `img_url` varchar(255) DEFAULT NULL,
  `taken_from` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quiz_id` (`quiz_id`),
  KEY `student_id` (`student_id`),
  KEY `date_q` (`date_q`),
  KEY `final_submit_time` (`final_submit_time`),
  KEY `payment_status` (`payment_status`)
) ENGINE=InnoDB AUTO_INCREMENT=1902843 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiztfs_rewards`
--

DROP TABLE IF EXISTS `quiztfs_rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiztfs_rewards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `milestone_score` int(11) NOT NULL,
  `coupon_code` varchar(11) NOT NULL,
  `scratch_date` date NOT NULL,
  `valid_till` date NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `is_redeemed` tinyint(4) NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`,`milestone_score`,`scratch_date`)
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiztfs_sessions_details`
--

DROP TABLE IF EXISTS `quiztfs_sessions_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiztfs_sessions_details` (
  `session_id` varchar(55) NOT NULL,
  `student_id` int(11) NOT NULL,
  `test_question_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `class` varchar(55) NOT NULL,
  `subject` varchar(55) NOT NULL,
  `language` varchar(55) NOT NULL,
  `answer` text NOT NULL,
  `pts_received` int(11) NOT NULL,
  `actual_answer` varchar(55) NOT NULL,
  `type` varchar(55) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `session_id` (`session_id`,`student_id`,`test_question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `random_questions`
--

DROP TABLE IF EXISTS `random_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `random_questions` (
  `question_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ratings_temp_12_noneet`
--

DROP TABLE IF EXISTS `ratings_temp_12_noneet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ratings_temp_12_noneet` (
  `student_id` int(255) NOT NULL DEFAULT '0',
  `gcm_reg_id` mediumtext,
  `is_new_app` tinyint(1) NOT NULL DEFAULT '0',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `locale` varchar(10) NOT NULL DEFAULT 'en'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `raw_ocr`
--

DROP TABLE IF EXISTS `raw_ocr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `raw_ocr` (
  `question_id` int(11) NOT NULL,
  `ocr_text` text,
  `ocr1_text` text,
  `old_ocr2_text` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ocr_done` int(11) NOT NULL DEFAULT '1',
  `old_ocr2_done` int(11) DEFAULT NULL,
  PRIMARY KEY (`question_id`),
  KEY `ocr_done` (`ocr_done`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `raw_question_text`
--

DROP TABLE IF EXISTS `raw_question_text`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `raw_question_text` (
  `question_id` int(11) NOT NULL,
  `manual_text` longtext NOT NULL,
  `google_vision_ocr_response` longtext NOT NULL,
  `mathpix_v1_response` longtext NOT NULL,
  `mathpix_v2_response` longtext NOT NULL,
  UNIQUE KEY `question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rds_chapters_list`
--

DROP TABLE IF EXISTS `rds_chapters_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rds_chapters_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book` varchar(100) NOT NULL,
  `class` int(11) DEFAULT NULL,
  `chapter_order` int(11) DEFAULT NULL,
  `rds_chapter` varchar(500) DEFAULT NULL,
  `ncert_chapter` varchar(500) DEFAULT NULL,
  `code` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class` (`class`,`chapter_order`,`rds_chapter`,`code`)
) ENGINE=InnoDB AUTO_INCREMENT=184 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reassignment_question`
--

DROP TABLE IF EXISTS `reassignment_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reassignment_question` (
  `reassignment_question_id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `allocated_to` int(11) NOT NULL,
  `allocation_time` varchar(255) NOT NULL,
  PRIMARY KEY (`reassignment_question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=586720 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recommendation_message_submit_logs`
--

DROP TABLE IF EXISTS `recommendation_message_submit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recommendation_message_submit_logs` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `message_id` int(11) DEFAULT NULL,
  `selected_option` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`,`student_id`,`message_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9767082 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recommendation_messages`
--

DROP TABLE IF EXISTS `recommendation_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recommendation_messages` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(50) DEFAULT NULL,
  `message` text,
  `backpress_message` text,
  `sql` varchar(100) DEFAULT NULL,
  `user_class` int(11) DEFAULT NULL,
  `locale` varchar(15) DEFAULT NULL,
  `message_order_group` int(11) DEFAULT NULL,
  `message_order` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `options` varchar(255) DEFAULT NULL,
  `deeplinks` varchar(255) DEFAULT NULL,
  `icon_urls` varchar(2000) DEFAULT NULL,
  `min_version_code` int(11) DEFAULT NULL,
  `max_version_code` int(11) DEFAULT NULL,
  `page` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `message_order_group` (`message_order_group`,`locale`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recommendation_sticky_notification`
--

DROP TABLE IF EXISTS `recommendation_sticky_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recommendation_sticky_notification` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `assortment_id` int(11) DEFAULT NULL,
  `is_sent` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34199 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `referral_iteration_views`
--

DROP TABLE IF EXISTS `referral_iteration_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referral_iteration_views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `source` varchar(45) DEFAULT NULL,
  `iteration` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `riv_student_id_idx` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=149475170 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `referral_messages`
--

DROP TABLE IF EXISTS `referral_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referral_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text CHARACTER SET utf8mb4 NOT NULL,
  `campaign_id` varchar(100) NOT NULL,
  `locale` varchar(45) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `iteration` varchar(45) DEFAULT 'referral_course',
  `is_active` tinyint(2) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `campaign_id_UNIQUE` (`campaign_id`),
  KEY `idx_comb` (`locale`,`iteration`,`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `referral_tx`
--

DROP TABLE IF EXISTS `referral_tx`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referral_tx` (
  `ref_tx_id` int(11) NOT NULL AUTO_INCREMENT,
  `ref_student_id` int(11) NOT NULL,
  `ref_type` int(11) NOT NULL,
  `referred_amount` int(11) NOT NULL,
  `amount` int(11) DEFAULT NULL,
  `txn_id` varchar(32) DEFAULT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ref_tx_id`)
) ENGINE=InnoDB AUTO_INCREMENT=402 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `remove_unanswered`
--

DROP TABLE IF EXISTS `remove_unanswered`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `remove_unanswered` (
  `question_id` int(55) NOT NULL DEFAULT '0',
  `subject` text NOT NULL,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `report_spam`
--

DROP TABLE IF EXISTS `report_spam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `report_spam` (
  `student_id` int(11) NOT NULL,
  `text` text NOT NULL,
  `type` varchar(20) NOT NULL,
  `id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reported_users`
--

DROP TABLE IF EXISTS `reported_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reported_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `reported_user_id` int(11) NOT NULL,
  `is_active` int(11) NOT NULL,
  `is_reviewed` tinyint(4) NOT NULL DEFAULT '0',
  `reviewed_by` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=473072 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reseller_info`
--

DROP TABLE IF EXISTS `reseller_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reseller_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ri_student_idx` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `retarget_msg_log`
--

DROP TABLE IF EXISTS `retarget_msg_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `retarget_msg_log` (
  `student_id` int(255) NOT NULL,
  `retarget_type` tinyint(4) NOT NULL,
  `status` tinyint(4) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `msg_id` varchar(100) NOT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tp_response` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `msg_log_FK` (`student_id`),
  CONSTRAINT `msg_log_FK` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `retarget_student_churn`
--

DROP TABLE IF EXISTS `retarget_student_churn`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `retarget_student_churn` (
  `student_id` int(255) NOT NULL,
  `can_be_targeted` tinyint(1) NOT NULL DEFAULT '1',
  `loss_type` tinyint(4) NOT NULL,
  `uninstall_timestamp` datetime DEFAULT NULL,
  `reinstall_timestamp` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  KEY `students_lost_FK` (`student_id`),
  KEY `uninstall_timestamp` (`uninstall_timestamp`),
  KEY `reinstall_timestamp` (`reinstall_timestamp`),
  CONSTRAINT `students_lost_FK` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53682346 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rzp_payment_link`
--

DROP TABLE IF EXISTS `rzp_payment_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rzp_payment_link` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_info_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `link_id` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `rpl_sid_idx` (`student_id`),
  KEY `rpl_status_idx` (`status`),
  KEY `rpl_link_idx` (`link_id`)
) ENGINE=InnoDB AUTO_INCREMENT=58003 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sales_analytics`
--

DROP TABLE IF EXISTS `sales_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales_analytics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `view` varchar(200) NOT NULL,
  `login_id` varchar(200) NOT NULL,
  `cli` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sarthaks_scrapped_questions`
--

DROP TABLE IF EXISTS `sarthaks_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sarthaks_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(4500) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `answer` varchar(5500) DEFAULT NULL,
  `canonical_url` varchar(2500) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=232334 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schedule_ugc`
--

DROP TABLE IF EXISTS `schedule_ugc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `schedule_ugc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mongo_id` varchar(255) DEFAULT NULL,
  `student_id` int(11) NOT NULL,
  `type` varchar(25) NOT NULL,
  `student_avatar` varchar(255) NOT NULL,
  `student_username` varchar(25) NOT NULL,
  `texts` varchar(255) NOT NULL,
  `image_url` varchar(150) NOT NULL,
  `audio` varchar(50) DEFAULT NULL,
  `start_date` timestamp NOT NULL,
  `student_class` varchar(25) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2604 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scheduled_notification`
--

DROP TABLE IF EXISTS `scheduled_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `scheduled_notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(128) DEFAULT NULL,
  `query` varchar(1200) DEFAULT NULL,
  `image_url` varchar(300) DEFAULT NULL,
  `message` varchar(500) CHARACTER SET utf8mb4 DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `title` varchar(200) CHARACTER SET utf8mb4 DEFAULT NULL,
  `notify_activity` varchar(128) DEFAULT NULL,
  `extra_param` varchar(128) DEFAULT NULL,
  `question_query` varchar(1000) DEFAULT NULL,
  `learntype` varchar(50) DEFAULT NULL,
  `year` varchar(50) DEFAULT NULL,
  `chapter` varchar(50) DEFAULT NULL,
  `class` varchar(50) DEFAULT NULL,
  `course` varchar(50) DEFAULT NULL,
  `exercise` varchar(50) DEFAULT NULL,
  `notify_id` varchar(15) NOT NULL,
  `is_schedule` tinyint(1) DEFAULT NULL,
  `notification_start_time` date DEFAULT NULL,
  `notification_end_time` date DEFAULT NULL,
  `hour` varchar(12) DEFAULT NULL,
  `url` text,
  `playlist_title` varchar(150) DEFAULT NULL,
  `playlist_id` varchar(30) DEFAULT NULL,
  `entity_type` varchar(500) DEFAULT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `downloadpdf_level_one` varchar(100) DEFAULT NULL,
  `downloadpdf_level_two` varchar(100) DEFAULT NULL,
  `contest_id` varchar(50) DEFAULT NULL,
  `firebase_eventtag` varchar(100) DEFAULT NULL,
  `forum_feed_type` varchar(50) DEFAULT NULL,
  `course_id` varchar(100) DEFAULT NULL,
  `course_detail_id` varchar(100) DEFAULT NULL,
  `subject` varchar(50) DEFAULT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `ecm_id` int(11) DEFAULT NULL,
  `chapter_id` int(11) DEFAULT NULL,
  `sent` int(11) DEFAULT NULL,
  `received` int(11) DEFAULT NULL,
  `db_type` int(11) NOT NULL DEFAULT '0',
  `mocktest_id` int(11) NOT NULL DEFAULT '0',
  `post_id` int(11) DEFAULT NULL,
  `country_code` varchar(4) DEFAULT 'IN',
  PRIMARY KEY (`id`),
  KEY `notification_start_time` (`notification_start_time`),
  KEY `notification_end_time` (`notification_end_time`),
  KEY `is_schedule` (`is_schedule`)
) ENGINE=InnoDB AUTO_INCREMENT=26579 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schemes`
--

DROP TABLE IF EXISTS `schemes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `schemes` (
  `scheme_id` int(255) NOT NULL AUTO_INCREMENT,
  `scheme_title` varchar(255) NOT NULL,
  `scheme_price` varchar(255) NOT NULL,
  `scheme_validity` varchar(255) NOT NULL,
  `scheme_questions` varchar(255) NOT NULL,
  `scheme_access` varchar(128) DEFAULT NULL,
  `scheme_quizzes` varchar(128) DEFAULT NULL,
  `scheme_feedback` varchar(128) DEFAULT NULL,
  `scheme_couns` varchar(128) DEFAULT NULL,
  `scheme_enrollments` int(11) NOT NULL DEFAULT '0',
  `scheme_status` varchar(255) DEFAULT NULL,
  `created_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) NOT NULL DEFAULT '1',
  `valid_country` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`scheme_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scholarship_banners`
--

DROP TABLE IF EXISTS `scholarship_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `scholarship_banners` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(100) DEFAULT NULL,
  `url` varchar(300) DEFAULT NULL,
  `deeplink` varchar(255) DEFAULT NULL,
  `locale` varchar(100) DEFAULT NULL,
  `test_id` int(11) DEFAULT NULL,
  `coupon_code` varchar(100) DEFAULT NULL,
  `progress_id` int(11) DEFAULT NULL,
  `is_active` int(11) DEFAULT '1',
  `description` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3871 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scholarship_coupons`
--

DROP TABLE IF EXISTS `scholarship_coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `scholarship_coupons` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `test_id` varchar(255) DEFAULT NULL,
  `rank_range` varchar(255) DEFAULT NULL,
  `discount` varchar(255) DEFAULT NULL,
  `coupon_code` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scholarship_exam`
--

DROP TABLE IF EXISTS `scholarship_exam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `scholarship_exam` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `priority` int(11) DEFAULT NULL,
  `test_name` varchar(100) DEFAULT NULL,
  `test_class` varchar(100) DEFAULT NULL,
  `test_time` varchar(100) DEFAULT NULL,
  `test_date` varchar(100) DEFAULT NULL,
  `interview_date` varchar(100) DEFAULT NULL,
  `batch_date` varchar(100) DEFAULT NULL,
  `test_id` int(11) DEFAULT NULL,
  `test_locale` varchar(100) DEFAULT NULL,
  `test_branchlink` varchar(100) DEFAULT NULL,
  `is_active` int(11) DEFAULT NULL,
  `scholarship_class` varchar(100) DEFAULT NULL,
  `publish_time` datetime DEFAULT NULL,
  `unpublish_time` datetime DEFAULT NULL,
  `resources_titles` varchar(1500) DEFAULT NULL,
  `resources` varchar(1500) DEFAULT NULL,
  `resources_deeplink` varchar(1500) DEFAULT NULL,
  `assortment_ids` varchar(300) DEFAULT NULL,
  `assortment_class` varchar(50) DEFAULT NULL,
  `solution_branchlink` varchar(100) DEFAULT NULL,
  `solution_deeplink` varchar(200) DEFAULT NULL,
  `default_coupon_before` varchar(100) DEFAULT NULL,
  `default_coupon_after` varchar(100) DEFAULT NULL,
  `video` varchar(200) DEFAULT NULL,
  `video_thumbnail` varchar(800) DEFAULT NULL,
  `strip_banner` varchar(800) DEFAULT NULL,
  `faq_bucket` varchar(100) DEFAULT NULL,
  `target_group_id` int(11) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `other_result_tests` varchar(100) DEFAULT NULL,
  `tile_tab` varchar(100) DEFAULT NULL,
  `registration_rules` varchar(1000) DEFAULT NULL,
  `result_time` varchar(100) DEFAULT NULL,
  `coursepage_info` varchar(100) DEFAULT NULL,
  `homepage_banner_date` varchar(100) DEFAULT NULL,
  `explorepage_banner_date` varchar(100) DEFAULT NULL,
  `coursepage_subheading` varchar(100) DEFAULT NULL,
  `notification_time` varchar(100) DEFAULT NULL,
  `share_branchlink` varchar(100) DEFAULT NULL,
  `sms_branchlink` varchar(100) DEFAULT NULL,
  `round2_registration_endtime` datetime DEFAULT NULL,
  `round2_result_time` datetime DEFAULT NULL,
  `assortment_ids2` varchar(300) DEFAULT NULL,
  `interview_form_round2` varchar(100) DEFAULT NULL,
  `reward_form_round2` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=245 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scholarship_test`
--

DROP TABLE IF EXISTS `scholarship_test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `scholarship_test` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `progress_id` int(11) NOT NULL DEFAULT '1',
  `coupon_code` varchar(100) DEFAULT NULL,
  `discount_percent` varchar(100) DEFAULT NULL,
  `rank` int(10) DEFAULT NULL,
  `is_active` int(11) NOT NULL DEFAULT '1',
  `marks` int(11) DEFAULT NULL,
  `time_taken` int(11) DEFAULT NULL,
  `use_name` int(11) DEFAULT NULL,
  `subject_level_marks` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`student_id`,`test_id`),
  UNIQUE KEY `id` (`id`),
  KEY `progress_id` (`progress_id`)
) ENGINE=InnoDB AUTO_INCREMENT=585511 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_name` varchar(255) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  PRIMARY KEY (`setting_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sharing_messages`
--

DROP TABLE IF EXISTS `sharing_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sharing_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` varchar(150) DEFAULT NULL,
  `screen` varchar(50) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `foreign_id` int(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shipment_status_track`
--

DROP TABLE IF EXISTS `shipment_status_track`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shipment_status_track` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shiprocket_order_id` int(11) DEFAULT NULL,
  `shipment_activity` varchar(500) DEFAULT NULL,
  `shipment_location` varchar(500) DEFAULT NULL,
  `shipment_date` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shiprocket_shipment_status`
--

DROP TABLE IF EXISTS `shiprocket_shipment_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shiprocket_shipment_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(20) DEFAULT NULL,
  `shipment_activity` varchar(500) DEFAULT NULL,
  `shipment_location` varchar(500) DEFAULT NULL,
  `shipment_date` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `order_status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=138512 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `similar_pdf`
--

DROP TABLE IF EXISTS `similar_pdf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `similar_pdf` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_id` varchar(255) NOT NULL,
  `pdf_link` varchar(255) NOT NULL,
  `entity_type` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sitemap_invalid`
--

DROP TABLE IF EXISTS `sitemap_invalid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sitemap_invalid` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sitemap_name` varchar(100) NOT NULL,
  `invalid_url` varchar(200) NOT NULL,
  `question_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1053627 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `skip_messages`
--

DROP TABLE IF EXISTS `skip_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `skip_messages` (
  `skip_message_id` int(11) NOT NULL AUTO_INCREMENT,
  `skip_message` tinytext NOT NULL,
  `notification_text` varchar(255) DEFAULT NULL,
  `notification_image` varchar(255) DEFAULT NULL,
  `message_type` tinyint(4) NOT NULL,
  PRIMARY KEY (`skip_message_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `skip_messages_qc`
--

DROP TABLE IF EXISTS `skip_messages_qc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `skip_messages_qc` (
  `skip_message_id` int(11) NOT NULL AUTO_INCREMENT,
  `skip_message` tinytext NOT NULL,
  `notification_text` varchar(255) DEFAULT NULL,
  `notification_image` varchar(255) DEFAULT NULL,
  `message_type` tinyint(4) NOT NULL,
  PRIMARY KEY (`skip_message_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `smart_content_video`
--

DROP TABLE IF EXISTS `smart_content_video`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `smart_content_video` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ccm_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `next_question_id` int(11) NOT NULL,
  `skip_second` int(11) NOT NULL,
  `number_of_users` int(11) NOT NULL,
  `time` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`,`number_of_users`),
  KEY `number_of_users` (`number_of_users`)
) ENGINE=InnoDB AUTO_INCREMENT=1104533 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sms_campaign`
--

DROP TABLE IF EXISTS `sms_campaign`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sms_campaign` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `mobile` varchar(25) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=911 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stackexchange_biology_scrapped_questions`
--

DROP TABLE IF EXISTS `stackexchange_biology_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stackexchange_biology_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(4500) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `answer` varchar(5500) DEFAULT NULL,
  `canonical_url` varchar(2500) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24232 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stackexchange_chem_scrapped_questions`
--

DROP TABLE IF EXISTS `stackexchange_chem_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stackexchange_chem_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(4500) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `answer` varchar(5500) DEFAULT NULL,
  `canonical_url` varchar(2500) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34263 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stackexchange_math_scrapped_questions`
--

DROP TABLE IF EXISTS `stackexchange_math_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stackexchange_math_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(4500) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `answer` varchar(5500) DEFAULT NULL,
  `canonical_url` varchar(2500) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=172690 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stackexchange_scrapped_questions`
--

DROP TABLE IF EXISTS `stackexchange_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stackexchange_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(4500) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `answer` varchar(5500) DEFAULT NULL,
  `canonical_url` varchar(2500) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1278900 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sticky_notification`
--

DROP TABLE IF EXISTS `sticky_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sticky_notification` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) DEFAULT NULL,
  `image_url` varchar(300) DEFAULT NULL,
  `title_image_notification` varchar(500) DEFAULT NULL,
  `message_image_notification` varchar(500) DEFAULT NULL,
  `title_text_notification` varchar(500) DEFAULT NULL,
  `message_text_notification` varchar(500) DEFAULT NULL,
  `text_under_price` varchar(500) DEFAULT NULL,
  `is_vanish` int(11) DEFAULT NULL,
  `is_campaign` int(11) DEFAULT NULL,
  `deeplink_banner` varchar(300) DEFAULT NULL,
  `deeplink_button` varchar(300) DEFAULT NULL,
  `button_cta` varchar(100) DEFAULT NULL,
  `offset` int(11) DEFAULT NULL,
  `target_group_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_processed` int(11) DEFAULT '0',
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3492 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `structured_course`
--

DROP TABLE IF EXISTS `structured_course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `structured_course` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` varchar(100) DEFAULT NULL,
  `button_text` varchar(30) DEFAULT NULL,
  `banner` varchar(100) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `header_image` varchar(500) NOT NULL,
  `bottom_text` varchar(800) NOT NULL,
  `button_text_new` varchar(800) NOT NULL,
  `third_screen_banner` varchar(300) NOT NULL,
  `third_screen_banner_position` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `structured_course_details`
--

DROP TABLE IF EXISTS `structured_course_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `structured_course_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `structured_course_id` int(11) NOT NULL DEFAULT '0',
  `subject` varchar(20) DEFAULT NULL,
  `chapter` varchar(100) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `live_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subject` (`subject`),
  KEY `live_at` (`live_at`),
  KEY `class` (`class`)
) ENGINE=InnoDB AUTO_INCREMENT=718 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `structured_course_questionbank`
--

DROP TABLE IF EXISTS `structured_course_questionbank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `structured_course_questionbank` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date_course` date NOT NULL,
  `day_num` varchar(20) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `chapter` varchar(500) NOT NULL,
  `question_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `date_course` (`date_course`,`subject`),
  KEY `day_num` (`day_num`,`chapter`,`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1901 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `structured_course_questions_meta`
--

DROP TABLE IF EXISTS `structured_course_questions_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `structured_course_questions_meta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `tag` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1225 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `structured_course_resources`
--

DROP TABLE IF EXISTS `structured_course_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `structured_course_resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `structured_course_id` int(11) NOT NULL DEFAULT '0',
  `structured_course_detail_id` int(11) NOT NULL DEFAULT '0',
  `subject` varchar(20) DEFAULT NULL,
  `resource_reference` varchar(200) DEFAULT NULL,
  `topic` varchar(255) NOT NULL,
  `expert_name` varchar(50) DEFAULT NULL,
  `expert_image` varchar(100) DEFAULT NULL,
  `q_order` int(4) DEFAULT NULL,
  `resource_type` tinyint(4) NOT NULL,
  `class` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `q_order` (`q_order`),
  KEY `resource_type` (`resource_type`),
  KEY `structured_course_detail_id` (`structured_course_detail_id`),
  KEY `resource_reference` (`resource_reference`),
  KEY `class` (`class`),
  KEY `structured_course_id` (`structured_course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2491 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_address_mapping`
--

DROP TABLE IF EXISTS `student_address_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_address_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `student_name` varchar(500) DEFAULT NULL,
  `pincode` int(11) DEFAULT NULL,
  `address_line_1` varchar(500) DEFAULT NULL,
  `address_line_2` varchar(500) DEFAULT NULL,
  `landmark` varchar(500) DEFAULT NULL,
  `city` varchar(225) DEFAULT NULL,
  `state` varchar(225) DEFAULT NULL,
  `student_mobile` varchar(255) DEFAULT NULL,
  `email` varchar(500) DEFAULT NULL,
  `is_active` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `guardian_name` varchar(500) DEFAULT NULL,
  `guardian_mobile` varchar(225) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11258 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_assortment_progress`
--

DROP TABLE IF EXISTS `student_assortment_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_assortment_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `assortment_id` int(11) DEFAULT NULL,
  `videos_count` int(11) DEFAULT NULL,
  `pdf_count` int(11) DEFAULT NULL,
  `test_count` int(11) DEFAULT NULL,
  `total_count` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `video_history` text,
  `videos_engage_time` bigint(255) DEFAULT '0',
  `homework_count` int(11) DEFAULT '0',
  `quiz_count` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_assortment_progress_UN` (`student_id`,`package_id`),
  KEY `student_assortment_progress_student_id_IDX` (`student_id`,`assortment_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=423911 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_bookmarked_resources`
--

DROP TABLE IF EXISTS `student_bookmarked_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_bookmarked_resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `course_resource_id` int(11) DEFAULT NULL,
  `is_bookmarked` tinyint(4) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_doubt` tinyint(4) DEFAULT '0',
  `course_assortment_id` int(11) DEFAULT NULL,
  `comment_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_chapter_coverage`
--

DROP TABLE IF EXISTS `student_chapter_coverage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_chapter_coverage` (
  `chapter` varchar(255) NOT NULL,
  `class` int(10) NOT NULL,
  `microconcept_count` int(11) NOT NULL DEFAULT '0',
  `max_microconcept_count` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`chapter`,`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_course_mapping`
--

DROP TABLE IF EXISTS `student_course_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_course_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `ccm_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=98218933 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_credit`
--

DROP TABLE IF EXISTS `student_credit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_credit` (
  `student_credit_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `credit_amount` float NOT NULL,
  `credit_type` varchar(255) NOT NULL,
  `transaction_id` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_credit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_daily_problems_qid`
--

DROP TABLE IF EXISTS `student_daily_problems_qid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_daily_problems_qid` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `student_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `chapter` varchar(200) NOT NULL,
  `question_id` int(11) NOT NULL,
  `level` varchar(200) NOT NULL,
  `target_course` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=202761 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_data_table`
--

DROP TABLE IF EXISTS `student_data_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_data_table` (
  `id` int(50) NOT NULL AUTO_INCREMENT,
  `student_id` int(50) NOT NULL,
  `data` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=303009 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_debit`
--

DROP TABLE IF EXISTS `student_debit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_debit` (
  `student_debit_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(255) NOT NULL,
  `class_id` varchar(255) NOT NULL,
  `class_fee` float NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_debit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_doubt_paywall`
--

DROP TABLE IF EXISTS `student_doubt_paywall`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_doubt_paywall` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id_UNIQUE` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7152 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_exam_corner_bookmarked`
--

DROP TABLE IF EXISTS `student_exam_corner_bookmarked`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_exam_corner_bookmarked` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `exam_corner_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_exam_corner_id_unique` (`student_id`,`exam_corner_id`),
  KEY `exam_corner_student_id` (`student_id`),
  KEY `exam_corner_bookmarks_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=2960 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_location`
--

DROP TABLE IF EXISTS `student_location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_location` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `pincode` int(11) DEFAULT NULL,
  `big_six` int(11) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `country_code` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `sl_city` (`city`),
  KEY `sl_state` (`state`),
  KEY `sl_country` (`country`),
  KEY `sl_updated_at` (`updated_at`),
  KEY `sl_lat` (`latitude`),
  KEY `sl_long` (`longitude`),
  KEY `pincode` (`pincode`)
) ENGINE=InnoDB AUTO_INCREMENT=3234201 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_location_2`
--

DROP TABLE IF EXISTS `student_location_2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_location_2` (
  `id` int(11) NOT NULL DEFAULT '0',
  `student_id` int(11) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `pincode` int(11) DEFAULT NULL,
  `big_six` int(11) DEFAULT NULL,
  `city` text,
  `state` text,
  `country` text,
  `country_code` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`,`pincode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_location_pincode`
--

DROP TABLE IF EXISTS `student_location_pincode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_location_pincode` (
  `country` varchar(200) NOT NULL,
  `state` varchar(200) NOT NULL,
  `city` text NOT NULL,
  `street` text NOT NULL,
  `pincode` varchar(6) NOT NULL,
  `country_code` varchar(10) NOT NULL,
  `formatted_address` text NOT NULL,
  `sl_id` int(11) NOT NULL,
  KEY `sl_id` (`sl_id`),
  KEY `pincode` (`pincode`),
  KEY `state` (`state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_master_package`
--

DROP TABLE IF EXISTS `student_master_package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_master_package` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_subcategory` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `course_type` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_onboard`
--

DROP TABLE IF EXISTS `student_onboard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_onboard` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `udid` varchar(50) NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `device` varchar(150) DEFAULT NULL,
  `network` varchar(150) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `udid` (`udid`),
  KEY `udid_2` (`udid`,`created_at`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=50142418 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_package`
--

DROP TABLE IF EXISTS `student_package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_package` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` int(11) NOT NULL DEFAULT '0',
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `original_amount` decimal(10,2) NOT NULL,
  `offer_amount` decimal(10,2) NOT NULL,
  `duration_in_days` int(11) NOT NULL DEFAULT '30',
  `image_set` varchar(1000) DEFAULT NULL,
  `doubt_ask` int(11) DEFAULT '-1',
  `valid_on` datetime DEFAULT NULL,
  `doubt_limit` int(11) DEFAULT NULL,
  `type` varchar(45) DEFAULT NULL,
  `reference_package` int(11) DEFAULT NULL,
  `priority` int(3) DEFAULT '0',
  `reference_type` varchar(25) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `parent` int(11) DEFAULT NULL,
  `is_last` int(11) DEFAULT '0',
  `master_parent` int(11) DEFAULT NULL,
  `emi_order` int(11) DEFAULT NULL,
  `subcategory_id` int(11) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `s_p_type_idx` (`type`),
  KEY `s_p_ref_idx` (`reference_package`),
  KEY `s_p_name_idx` (`name`),
  KEY `sp_active_idx` (`is_active`),
  KEY `reference_type` (`reference_type`),
  KEY `reference_id` (`reference_id`)
) ENGINE=InnoDB AUTO_INCREMENT=337 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_package_feedback`
--

DROP TABLE IF EXISTS `student_package_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_package_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `student_id` int(11) NOT NULL,
  `feedback` varchar(1000) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4522 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_package_subscription`
--

DROP TABLE IF EXISTS `student_package_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_package_subscription` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `student_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `student_package_id` int(11) NOT NULL,
  `doubt_ask` int(11) DEFAULT NULL,
  `updated_by` varchar(45) DEFAULT 'system',
  `meta_info` varchar(100) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `new_package_id` int(11) DEFAULT NULL,
  `payment_info_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sps_student_idx` (`student_id`),
  KEY `sps_active_idx` (`is_active`),
  KEY `sps_startdate_idx` (`start_date`),
  KEY `sps_enddate_idx` (`end_date`),
  KEY `sps_spid_idx` (`student_package_id`),
  KEY `new_package_id` (`new_package_id`),
  KEY `variant_id` (`variant_id`),
  KEY `amount` (`amount`),
  KEY `sps_pi_idx` (`payment_info_id`),
  KEY `sps_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=1458906 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_package_subscription_old_vip`
--

DROP TABLE IF EXISTS `student_package_subscription_old_vip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_package_subscription_old_vip` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `student_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `student_package_id` int(11) NOT NULL,
  `doubt_ask` int(11) DEFAULT NULL,
  `updated_by` varchar(45) DEFAULT 'system',
  PRIMARY KEY (`id`),
  KEY `sps_student_idx` (`student_id`),
  KEY `sps_active_idx` (`is_active`),
  KEY `sps_startdate_idx` (`start_date`),
  KEY `sps_enddate_idx` (`end_date`),
  KEY `sps_spid_idx` (`student_package_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7457 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_package_v1`
--

DROP TABLE IF EXISTS `student_package_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_package_v1` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` int(11) NOT NULL DEFAULT '0',
  `name` varchar(45) DEFAULT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `original_amount` decimal(10,2) NOT NULL,
  `offer_amount` decimal(10,2) NOT NULL,
  `duration_in_days` int(11) DEFAULT NULL,
  `image_set` varchar(1000) DEFAULT NULL,
  `type` varchar(45) DEFAULT NULL,
  `parent` int(11) DEFAULT NULL,
  `is_last` int(11) DEFAULT '0',
  `master_parent` int(11) DEFAULT NULL,
  `emi_order` int(11) DEFAULT NULL,
  `showBuyNow` int(11) DEFAULT '1',
  `showPanel` int(11) DEFAULT '1',
  `previous_package_id` varchar(45) DEFAULT NULL,
  `emi_duration` int(11) DEFAULT NULL,
  `emi_amount` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_payout_details`
--

DROP TABLE IF EXISTS `student_payout_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_payout_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '0',
  `student_id` int(11) DEFAULT NULL,
  `paytm_number` varchar(45) DEFAULT NULL,
  `upi_id` varchar(45) DEFAULT NULL,
  `account_number` varchar(45) DEFAULT NULL,
  `ifsc` varchar(45) DEFAULT NULL,
  `official_name` varchar(45) DEFAULT NULL,
  `payment_status` varchar(11) DEFAULT NULL,
  `contest_winners_id` varchar(100) DEFAULT NULL,
  `order_id` varchar(100) DEFAULT NULL,
  `status_code` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`,`contest_winners_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_playlists`
--

DROP TABLE IF EXISTS `student_playlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_playlists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(50) DEFAULT NULL,
  `course` varchar(50) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `student_id` int(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `times_shared` int(100) NOT NULL DEFAULT '0',
  `refer_id` int(100) DEFAULT NULL,
  `show_library` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`,`student_id`),
  KEY `student_id` (`student_id`),
  KEY `is_active` (`is_active`),
  KEY `created_at` (`created_at`),
  KEY `refer_id` (`refer_id`),
  KEY `show_library` (`show_library`)
) ENGINE=InnoDB AUTO_INCREMENT=30156 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_properties`
--

DROP TABLE IF EXISTS `student_properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_properties` (
  `student_id` int(11) NOT NULL,
  `properties` text,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_rating`
--

DROP TABLE IF EXISTS `student_rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_rating` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `feedback` longtext NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=924996 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_referral_course_coupons`
--

DROP TABLE IF EXISTS `student_referral_course_coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_referral_course_coupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `coupon_code` varchar(100) DEFAULT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(20) DEFAULT 'system',
  `discount_amount` int(5) DEFAULT '500',
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id_UNIQUE` (`student_id`),
  UNIQUE KEY `coupon_code_UNIQUE` (`coupon_code`),
  KEY `src_sid_idx` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21286911 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_referral_paytm_disbursement`
--

DROP TABLE IF EXISTS `student_referral_paytm_disbursement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_referral_paytm_disbursement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invitor_student_id` int(11) DEFAULT NULL,
  `mobile` varchar(100) DEFAULT NULL,
  `invitee_student_id` int(11) DEFAULT NULL,
  `amount` int(11) DEFAULT NULL,
  `order_id` varchar(200) DEFAULT NULL,
  `is_paytm_disbursed` tinyint(2) DEFAULT NULL,
  `paytm_response` varchar(500) DEFAULT NULL,
  `mobile_retry` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `paytm_response_retry` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=733 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_referrals`
--

DROP TABLE IF EXISTS `student_referrals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_referrals` (
  `student_referral_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(255) NOT NULL,
  `referral_code` varchar(255) NOT NULL,
  `student_credit_amount` float NOT NULL,
  `referred_student_credit_amount` float NOT NULL,
  PRIMARY KEY (`student_referral_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_referrals_mapping`
--

DROP TABLE IF EXISTS `student_referrals_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_referrals_mapping` (
  `student_referral_mapping_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(255) NOT NULL,
  `referral_code` varchar(255) NOT NULL,
  `referred_student_id` varchar(255) NOT NULL,
  `student_credit_amount` float NOT NULL,
  `referred_student_credit_amount` float NOT NULL,
  PRIMARY KEY (`student_referral_mapping_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_renewal_target_group`
--

DROP TABLE IF EXISTS `student_renewal_target_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_renewal_target_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `coupon` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `assortment_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_renewal_target_group_is_active_IDX` (`is_active`) USING BTREE,
  KEY `student_renewal_target_group_coupon_IDX` (`coupon`) USING BTREE,
  KEY `student_renewal_target_group_student_id_IDX` (`student_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=36581 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_slot_mapping`
--

DROP TABLE IF EXISTS `student_slot_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_slot_mapping` (
  `student_id` int(32) NOT NULL,
  `lf_1` int(11) DEFAULT NULL,
  `lf_2` int(11) DEFAULT NULL,
  `lf_3` int(11) DEFAULT NULL,
  `sf_1` int(11) DEFAULT NULL,
  `sf_2` int(11) DEFAULT NULL,
  `sf_3` int(11) DEFAULT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_subscription_help_requests`
--

DROP TABLE IF EXISTS `student_subscription_help_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_subscription_help_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `active_subscription_id` int(11) DEFAULT NULL,
  `requested_package` int(11) DEFAULT NULL,
  `request_type` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_subscriptions`
--

DROP TABLE IF EXISTS `student_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_subscriptions` (
  `subscription_id` int(11) NOT NULL,
  `txnid` varchar(128) DEFAULT NULL,
  `coupon_id` int(11) DEFAULT NULL,
  `student_id` varchar(255) NOT NULL,
  `scheme_id` varchar(255) NOT NULL,
  `start_date` varchar(255) DEFAULT NULL,
  `end_date` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_wishlist`
--

DROP TABLE IF EXISTS `student_wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_wishlist` (
  `student_wishlist_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(255) NOT NULL,
  `course_id` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_wishlist_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `studentid_package_details`
--

DROP TABLE IF EXISTS `studentid_package_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `studentid_package_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `thumbnail_name` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `package` varchar(500) DEFAULT NULL,
  `package_language` varchar(50) DEFAULT NULL,
  `video_language` varchar(50) DEFAULT NULL,
  `target_group` varchar(250) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `subject` varchar(250) DEFAULT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `publication` varchar(500) DEFAULT NULL,
  `author_name` varchar(250) DEFAULT NULL,
  `original_book_name` varchar(500) DEFAULT NULL,
  `book_meta` varchar(1000) DEFAULT NULL,
  `package_type` varchar(250) DEFAULT NULL,
  `book_type` varchar(250) DEFAULT NULL,
  `book_order` int(11) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `class` (`class`,`package_language`,`package_type`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1512 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `studentid_package_mapping`
--

DROP TABLE IF EXISTS `studentid_package_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `studentid_package_mapping` (
  `student_id` int(11) NOT NULL,
  `package` varchar(255) NOT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `studentid_package_mapping_new`
--

DROP TABLE IF EXISTS `studentid_package_mapping_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `studentid_package_mapping_new` (
  `student_id` int(11) NOT NULL,
  `package` varchar(255) NOT NULL,
  `package_language` enum('en','bn','hi','ta','te','gu','kn','ml','mr','od','pu','as','ne','pa','ur') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `video_language` enum('en','bn-en','hi-en','ta-en','te-en','gu-en','kn-en','ml-en','mr-en','en','bn','hi','ta','te','gu','kn','ml','mr','od','pu','as','od-en','pu-en','as-en','ne','pa','ur') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hi-en',
  `target_group` enum('IIT JEE','NEET','CBSE','Bihar Board','UP Board','West Bengal Board','Karnataka Board','Tamil Nadu Board','Telangana Board','Andhra Pradesh Board','Madhya Pradesh Board','Maharashtra Board','Rajasthan Board','Chhattisgarh Board','FOUNDATION','GOVT','NDA','SAT','ACT','INTERNAL','Punjab Board','Odisha Board','Assam Board','Gujarat Board','Kerala Board','Haryana Board','Jharkhand Board','Polytechnic','ICSE','CTET','JNV','KVS') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CBSE',
  `is_uploaded` int(1) NOT NULL DEFAULT '0',
  `to_index` int(11) NOT NULL DEFAULT '1',
  `answers_done` int(11) NOT NULL DEFAULT '0',
  `content_format` enum('LECTURE VIDEOS','QNA VIDEOS','NON-ACADEMIC VIDEOS') NOT NULL DEFAULT 'QNA VIDEOS',
  `vendor_id` int(11) NOT NULL DEFAULT '1',
  `target_group_type` varchar(100) DEFAULT NULL,
  `quiz_tfs_enable` tinyint(4) NOT NULL DEFAULT '0',
  `quiz_tfs_duration` int(11) NOT NULL DEFAULT '60',
  PRIMARY KEY (`student_id`),
  KEY `to_index` (`to_index`),
  KEY `answers_done` (`answers_done`),
  KEY `content_format` (`content_format`),
  KEY `target_group_type` (`target_group_type`),
  KEY `video_language` (`video_language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `student_id` int(255) NOT NULL AUTO_INCREMENT,
  `ip` varchar(255) DEFAULT NULL,
  `gcm_reg_id` mediumtext,
  `clevertap_id` varchar(255) DEFAULT NULL,
  `gaid` varchar(255) DEFAULT NULL,
  `student_fname` varchar(255) DEFAULT NULL,
  `student_lname` varchar(255) DEFAULT NULL,
  `gender` tinyint(1) DEFAULT NULL,
  `student_email` varchar(255) DEFAULT NULL,
  `img_url` varchar(256) DEFAULT NULL,
  `school_name` varchar(128) DEFAULT NULL,
  `ex_board` varchar(128) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `country_code` varchar(5) NOT NULL DEFAULT '+91',
  `pincode` varchar(255) DEFAULT NULL,
  `device_type` varchar(255) DEFAULT NULL,
  `hashed_password` varchar(255) DEFAULT NULL,
  `email_verification_code` varchar(255) DEFAULT NULL,
  `mobile_verification_code` varchar(255) DEFAULT NULL,
  `is_email_verified` varchar(255) DEFAULT NULL,
  `is_mobile_verfied` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `reset_code` varchar(255) NOT NULL DEFAULT '''''',
  `last_login` varchar(255) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_online` int(11) DEFAULT NULL,
  `student_class` varchar(255) NOT NULL,
  `referral_code` varchar(16) DEFAULT NULL,
  `udid` varchar(150) DEFAULT NULL,
  `primary_user` int(11) DEFAULT NULL,
  `app_version` varchar(50) DEFAULT NULL,
  `fingerprints` varchar(1000) DEFAULT NULL,
  `is_uninstalled` tinyint(4) DEFAULT '0',
  `is_web` tinyint(1) NOT NULL DEFAULT '0',
  `locale` varchar(10) NOT NULL DEFAULT 'en',
  `student_username` varchar(25) DEFAULT NULL,
  `is_new_app` tinyint(1) NOT NULL DEFAULT '0',
  `coaching` varchar(50) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`),
  KEY `locale` (`locale`),
  KEY `student_username` (`student_username`),
  KEY `is_new_app` (`is_new_app`),
  KEY `mobile` (`mobile`),
  KEY `app_version` (`app_version`),
  KEY `udid` (`udid`),
  KEY `timestamp` (`timestamp`),
  KEY `is_web` (`is_web`),
  KEY `dob` (`dob`),
  KEY `clevertap_id` (`clevertap_id`),
  KEY `student_class` (`student_class`),
  KEY `is_online` (`is_online`),
  KEY `idx_student_email` (`student_email`),
  KEY `email_verification_code` (`email_verification_code`),
  KEY `idx_updated_at` (`updated_at`)
) ENGINE=InnoDB AUTO_INCREMENT=152948727 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_alternate_numbers`
--

DROP TABLE IF EXISTS `students_alternate_numbers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_alternate_numbers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `alternate_number` varchar(255) DEFAULT NULL,
  `relation` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_studentid_alternatenumber` (`student_id`,`alternate_number`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=586596 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_daily_problems`
--

DROP TABLE IF EXISTS `students_daily_problems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_daily_problems` (
  `timestamp` timestamp NOT NULL,
  `student_id` int(11) NOT NULL,
  `class` int(11) DEFAULT NULL,
  `chapter` varchar(200) NOT NULL,
  `view_count` int(11) NOT NULL,
  KEY `timestamp` (`timestamp`,`chapter`),
  KEY `student_id` (`student_id`),
  KEY `class` (`class`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_device_mapping`
--

DROP TABLE IF EXISTS `students_device_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_device_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(55) NOT NULL,
  `udid` varchar(255) NOT NULL,
  `mobile` varchar(255) NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `udid` (`udid`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=11337367 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_iit`
--

DROP TABLE IF EXISTS `students_iit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_iit` (
  `student_id` int(11) NOT NULL,
  `iit_roll_no` varchar(50) NOT NULL,
  `dob` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`,`iit_roll_no`) USING BTREE,
  UNIQUE KEY `student_idx` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_invites`
--

DROP TABLE IF EXISTS `students_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_invites` (
  `received_id` int(50) NOT NULL,
  `sent_id` int(50) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`received_id`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_login`
--

DROP TABLE IF EXISTS `students_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_login` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `udid` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mobile` varchar(15) NOT NULL,
  `source` tinyint(4) NOT NULL,
  `is_login` tinyint(4) NOT NULL DEFAULT '0',
  `is_web` int(11) NOT NULL DEFAULT '0',
  `is_verified` tinyint(4) DEFAULT '0',
  `session_id` varchar(36) DEFAULT NULL,
  `country` varchar(10) DEFAULT NULL,
  `sess_id` varchar(100) DEFAULT NULL,
  KEY `created_at` (`created_at`),
  KEY `phone` (`mobile`),
  KEY `id` (`id`),
  KEY `students_login_session_id_IDX` (`session_id`) USING BTREE,
  KEY `students_login_sess_id_IDX` (`sess_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=80107546 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_new_class`
--

DROP TABLE IF EXISTS `students_new_class`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_new_class` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `student_class` int(11) NOT NULL,
  `updated` int(11) NOT NULL DEFAULT '0',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=757190 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_pin`
--

DROP TABLE IF EXISTS `students_pin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_pin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mobile` varchar(51) NOT NULL DEFAULT '',
  `pin` varchar(4) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `app_country` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mobile` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=702806 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_pin_metrics`
--

DROP TABLE IF EXISTS `students_pin_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_pin_metrics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) NOT NULL,
  `mobile` varchar(12) NOT NULL,
  `pin` varchar(4) NOT NULL,
  `gaid` varchar(255) NOT NULL,
  `gcm_id` mediumtext NOT NULL,
  `udid` varchar(150) NOT NULL,
  `status_details` varchar(255) NOT NULL,
  `status` enum('Success','Failed','Mismatched','Pin Success','Pin Failed') NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `mobile` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=1827333 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_pre_applied_coupons`
--

DROP TABLE IF EXISTS `students_pre_applied_coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_pre_applied_coupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `coupon_code` varchar(45) NOT NULL,
  `source` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(2) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `student_id_index` (`student_id`),
  KEY `idx_coupon_code` (`coupon_code`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5658925 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_selfie`
--

DROP TABLE IF EXISTS `students_selfie`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_selfie` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `filepath` varchar(260) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7284290 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_study_plan`
--

DROP TABLE IF EXISTS `students_study_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_study_plan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `chapter_id` int(11) NOT NULL,
  `chapter` varchar(100) NOT NULL,
  `chapter_class` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_upload_marksheet`
--

DROP TABLE IF EXISTS `students_upload_marksheet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_upload_marksheet` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `hash` varchar(400) NOT NULL,
  `is_marksheet_uploaded` tinyint(2) NOT NULL,
  `file` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` tinyint(2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `hash` (`hash`)
) ENGINE=InnoDB AUTO_INCREMENT=8694 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_vikramhap_20210906`
--

DROP TABLE IF EXISTS `students_vikramhap_20210906`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_vikramhap_20210906` (
  `mobile` varchar(10) NOT NULL,
  `student_fname` varchar(50) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `old_user` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students_web`
--

DROP TABLE IF EXISTS `students_web`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students_web` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gcm_reg_id` varchar(255) NOT NULL,
  `udid` varchar(100) NOT NULL,
  `email_id` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100153 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_chat`
--

DROP TABLE IF EXISTS `study_chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_chat` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `chat_id` varchar(255) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `inviter` int(11) NOT NULL,
  `invitee` int(11) NOT NULL,
  `invitation_status` int(10) NOT NULL DEFAULT '0',
  `invitation_updated_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `study_chat_chat_id_index` (`chat_id`),
  KEY `study_chat_id_index` (`id`),
  KEY `study_chat_invitation_status_index` (`invitation_status`),
  KEY `study_chat_invitee_index` (`invitee`),
  KEY `study_chat_inviter_index` (`inviter`)
) ENGINE=InnoDB AUTO_INCREMENT=436421 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_chat_members`
--

DROP TABLE IF EXISTS `study_chat_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_chat_members` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `study_chat_id` int(11) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_blocked` tinyint(4) NOT NULL DEFAULT '0',
  `blocked_at` datetime DEFAULT NULL,
  `muted_till` datetime DEFAULT NULL,
  KEY `study_chat_members_id_index` (`id`),
  KEY `study_chat_members_student_id_index` (`student_id`),
  KEY `study_chat_members_study_chat_id_index` (`study_chat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_group`
--

DROP TABLE IF EXISTS `study_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` varchar(255) NOT NULL,
  `group_type` int(11) NOT NULL DEFAULT '1',
  `group_name` varchar(255) NOT NULL,
  `group_image` varchar(512) DEFAULT NULL,
  `name_updated_by` int(11) NOT NULL,
  `name_updated_at` datetime DEFAULT NULL,
  `last_message_sent_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `can_member_post` tinyint(4) DEFAULT '1',
  `member_post_updated_by` int(11) DEFAULT NULL,
  `member_post_updated_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_by_class` int(11) DEFAULT NULL,
  `total_members` int(11) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `deactivated_at` datetime DEFAULT NULL,
  `image_updated_by` int(11) NOT NULL,
  `image_updated_at` datetime DEFAULT NULL,
  `is_verified` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`,`group_id`),
  UNIQUE KEY `group_id_UNIQUE` (`group_id`),
  KEY `study_group_group_type_index` (`group_type`),
  KEY `study_group_group_name_index` (`group_name`),
  KEY `study_group_created_by_class_index` (`created_by_class`),
  KEY `study_group_total_members_index` (`total_members`),
  KEY `study_group_is_verified_index` (`is_verified`)
) ENGINE=InnoDB AUTO_INCREMENT=588510 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_group_invites`
--

DROP TABLE IF EXISTS `study_group_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_group_invites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `inviter` int(11) DEFAULT NULL,
  `invitee` int(11) DEFAULT NULL,
  `group_id` int(11) NOT NULL,
  `is_accepted` tinyint(1) DEFAULT '0',
  `accepted_at` datetime DEFAULT NULL,
  `is_invited_by_admin` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`,`group_id`),
  KEY `group_id_idx` (`group_id`),
  KEY `sgi_invitee_ix` (`invitee`),
  KEY `sgi_inviter_ix` (`inviter`),
  CONSTRAINT `study_group_id` FOREIGN KEY (`group_id`) REFERENCES `study_group` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=2747995 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_group_members`
--

DROP TABLE IF EXISTS `study_group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_group_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `study_group_id` int(11) NOT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_blocked` tinyint(1) DEFAULT '0',
  `blocked_by` int(11) DEFAULT NULL,
  `blocked_at` datetime DEFAULT NULL,
  `is_left` tinyint(1) DEFAULT '0',
  `left_at` datetime DEFAULT NULL,
  `muted_till` datetime DEFAULT NULL,
  PRIMARY KEY (`id`,`study_group_id`),
  KEY `group_id_idx` (`study_group_id`),
  KEY `study_group_members_student_id_index` (`student_id`),
  KEY `sgm_is_active_ix` (`is_active`),
  KEY `sgm_is_blocked_ix` (`is_blocked`),
  CONSTRAINT `group_id` FOREIGN KEY (`study_group_id`) REFERENCES `study_group` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1470044 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_group_notification`
--

DROP TABLE IF EXISTS `study_group_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_group_notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `is_mute` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `study_group_notification_student_id_index` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=529296 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_group_promotional_messages`
--

DROP TABLE IF EXISTS `study_group_promotional_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_group_promotional_messages` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `type` varchar(10) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `property_url` varchar(255) DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `audio_duration` int(10) DEFAULT NULL,
  `cta_text` varchar(20) DEFAULT NULL,
  `cta_deeplink` varchar(150) DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `filter_operator` varchar(5) NOT NULL,
  `member_count` int(4) DEFAULT NULL,
  `group_created_at` datetime DEFAULT NULL,
  `message_count` int(10) DEFAULT NULL,
  `is_active` tinyint(3) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `study_group_promotional_messages_start_date_index` (`start_date`),
  KEY `study_group_promotional_messages_end_date_index` (`end_date`),
  KEY `study_group_promotional_messages_is_active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_group_reporting`
--

DROP TABLE IF EXISTS `study_group_reporting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_group_reporting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `study_group_id` varchar(255) DEFAULT NULL,
  `status` smallint(6) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `study_group_reporting_student_id_index` (`student_id`),
  KEY `study_group_reporting_study_group_id_index` (`study_group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1714 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_group_reportings`
--

DROP TABLE IF EXISTS `study_group_reportings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_group_reportings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_group_warning`
--

DROP TABLE IF EXISTS `study_group_warning`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_group_warning` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `group_id` varchar(255) NOT NULL,
  `type` tinyint(4) NOT NULL,
  `status` tinyint(4) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `study_group_warning_group_id_index` (`group_id`),
  KEY `study_group_warning_student_id_index` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_groups`
--

DROP TABLE IF EXISTS `study_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `study_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `studydost`
--

DROP TABLE IF EXISTS `studydost`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `studydost` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student1` int(11) NOT NULL,
  `student2` int(11) NOT NULL,
  `status` smallint(2) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `room_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `studydost_room_id_uindex` (`room_id`),
  KEY `studydost_student1_IDX` (`student1`,`student2`) USING BTREE,
  KEY `idx_studydost_student1_student2` (`student1`,`student2`)
) ENGINE=InnoDB AUTO_INCREMENT=31949 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `studydost_requests`
--

DROP TABLE IF EXISTS `studydost_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `studydost_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41667 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subject_icon_links`
--

DROP TABLE IF EXISTS `subject_icon_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subject_icon_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_name` varchar(150) NOT NULL,
  `subject_name_hi` varchar(150) NOT NULL,
  `icon_link` varchar(300) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `subject_name` (`subject_name`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subject_synonyms`
--

DROP TABLE IF EXISTS `subject_synonyms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subject_synonyms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `keyword` varchar(100) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `chapter` varchar(100) NOT NULL,
  `type` varchar(100) NOT NULL,
  `language` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=352 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subject_web_url_mapping`
--

DROP TABLE IF EXISTS `subject_web_url_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subject_web_url_mapping` (
  `subject` varchar(255) NOT NULL,
  `url_prefix` varchar(255) NOT NULL,
  PRIMARY KEY (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subjects` (
  `subject_id` int(11) NOT NULL AUTO_INCREMENT,
  `class_name` varchar(255) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  PRIMARY KEY (`subject_id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscriptions` (
  `subscription_id` int(11) NOT NULL AUTO_INCREMENT,
  `txnid` varchar(128) DEFAULT NULL,
  `coupon_id` int(11) DEFAULT NULL,
  `student_id` varchar(255) NOT NULL,
  `scheme_id` varchar(255) NOT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  `start_date` varchar(255) DEFAULT NULL,
  `end_date` varchar(255) DEFAULT NULL,
  `questions_can_be_asked` int(11) NOT NULL DEFAULT '1',
  `questions_asked` int(11) DEFAULT '0',
  `questions_answered` int(11) DEFAULT '0',
  PRIMARY KEY (`subscription_id`),
  KEY `student_id` (`student_id`),
  KEY `scheme_id` (`scheme_id`),
  KEY `start_date` (`start_date`),
  KEY `end_date` (`end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=112812 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subtopic_cen`
--

DROP TABLE IF EXISTS `subtopic_cen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subtopic_cen` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(25) DEFAULT NULL,
  `subtopic` varchar(255) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `youtube_playlist_id` varchar(255) DEFAULT NULL,
  `subtopic_order` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `code` (`code`),
  KEY `subtopic` (`subtopic`),
  KEY `chapter` (`chapter`),
  KEY `subtopic_order` (`subtopic_order`)
) ENGINE=InnoDB AUTO_INCREMENT=10734 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `survey_details`
--

DROP TABLE IF EXISTS `survey_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `survey_name` varchar(255) NOT NULL,
  `survey_description` varchar(500) NOT NULL,
  `headline_text` varchar(255) NOT NULL,
  `sub_headline_text` varchar(255) NOT NULL,
  `button_text` varchar(255) NOT NULL,
  `ending_heading_text` varchar(255) NOT NULL,
  `ending_sub_heading_text` varchar(255) NOT NULL,
  `ending_button_text` varchar(255) NOT NULL,
  `starting_img_url` varchar(255) NOT NULL,
  `ending_img_url` varchar(255) NOT NULL,
  `locale` varchar(10) NOT NULL,
  `user_set` longtext NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `target_group` int(11) DEFAULT NULL,
  `trigger_event` varchar(100) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`,`locale`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `survey_feedback`
--

DROP TABLE IF EXISTS `survey_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `survey_id` int(11) NOT NULL,
  `student_id` int(255) NOT NULL,
  `question_id` int(255) NOT NULL DEFAULT '0',
  `feedback` longtext NOT NULL,
  `type` enum('feedback','started') NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `survey_id` (`survey_id`),
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`),
  KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=651424 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `survey_options`
--

DROP TABLE IF EXISTS `survey_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `options_text` varchar(1000) NOT NULL,
  `hi_options_text` varchar(255) NOT NULL,
  `alert_text` varchar(255) NOT NULL,
  `option_type` enum('date','single','multiple','rating','description') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `survey_questions`
--

DROP TABLE IF EXISTS `survey_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `survey_id` int(11) NOT NULL,
  `question_text` varchar(255) NOT NULL,
  `hi_question_text` varchar(255) NOT NULL,
  `question_img` mediumtext NOT NULL,
  `skippable` tinyint(1) NOT NULL DEFAULT '0',
  `question_order` int(11) NOT NULL,
  `next_text` varchar(50) NOT NULL,
  `skip_text` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `survey_id` (`survey_id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `survey_results_ssc`
--

DROP TABLE IF EXISTS `survey_results_ssc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_results_ssc` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `apx_event_name` varchar(500) DEFAULT NULL,
  `answers` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7273 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `survey_users`
--

DROP TABLE IF EXISTS `survey_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `survey_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `survey_id` int(11) NOT NULL,
  `student_id` int(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=521645 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `target_group`
--

DROP TABLE IF EXISTS `target_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `target_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_exam` varchar(255) DEFAULT NULL,
  `user_class` int(11) DEFAULT NULL,
  `user_locale` varchar(10) DEFAULT NULL,
  `sql` text,
  `description` text,
  `created_by` varchar(20) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(45) DEFAULT NULL,
  `tag` varchar(100) DEFAULT NULL,
  `es_query` text,
  `fetch_from_cache` tinyint(1) DEFAULT '0',
  `db_to_use` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sql` (`sql`(1024)),
  KEY `user_exam` (`user_exam`,`user_class`,`user_locale`)
) ENGINE=InnoDB AUTO_INCREMENT=1648 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tc_fix`
--

DROP TABLE IF EXISTS `tc_fix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tc_fix` (
  `student_id` int(11) DEFAULT NULL,
  `wrong_mobile` bigint(11) DEFAULT NULL,
  `correct_mobile` bigint(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teachers` (
  `teacher_id` int(255) NOT NULL AUTO_INCREMENT,
  `ip` varchar(255) DEFAULT NULL,
  `gcm_reg_id` mediumtext,
  `fname` varchar(255) DEFAULT NULL,
  `lname` varchar(255) DEFAULT NULL,
  `gender` varchar(25) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `img_url` varchar(256) DEFAULT 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/E9F16D21-A0BC-C5AC-77D3-678C95588DFD.webp',
  `college` varchar(128) DEFAULT NULL,
  `degree` varchar(128) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `country_code` varchar(5) NOT NULL DEFAULT '+91',
  `pincode` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `about_me` text,
  `year_of_experience` int(10) DEFAULT NULL,
  `udid` varchar(150) DEFAULT NULL,
  `app_version` varchar(50) DEFAULT NULL,
  `is_web` tinyint(1) NOT NULL DEFAULT '0',
  `locale` varchar(10) NOT NULL DEFAULT 'en',
  `username` varchar(25) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `mapped_user_id` int(11) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`teacher_id`),
  UNIQUE KEY `mobile` (`mobile`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=136080469 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers_board_mapping`
--

DROP TABLE IF EXISTS `teachers_board_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teachers_board_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) DEFAULT NULL,
  `board` varchar(50) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_id` (`teacher_id`,`board`)
) ENGINE=InnoDB AUTO_INCREMENT=12015 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers_class_mapping`
--

DROP TABLE IF EXISTS `teachers_class_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teachers_class_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) DEFAULT NULL,
  `class` varchar(50) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_id` (`teacher_id`,`class`)
) ENGINE=InnoDB AUTO_INCREMENT=15280 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers_exam_mapping`
--

DROP TABLE IF EXISTS `teachers_exam_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teachers_exam_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) DEFAULT NULL,
  `exam` varchar(50) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_id` (`teacher_id`,`exam`)
) ENGINE=InnoDB AUTO_INCREMENT=6605 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers_locale_mapping`
--

DROP TABLE IF EXISTS `teachers_locale_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teachers_locale_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) DEFAULT NULL,
  `locale` varchar(50) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_id` (`teacher_id`,`locale`)
) ENGINE=InnoDB AUTO_INCREMENT=4008 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers_payment_mapping`
--

DROP TABLE IF EXISTS `teachers_payment_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teachers_payment_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_code` varchar(100) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `ifsc_code` varchar(50) DEFAULT NULL,
  `is_default` tinyint(4) DEFAULT '0',
  `is_active` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_id` (`teacher_id`,`bank_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1145 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers_resource_upload`
--

DROP TABLE IF EXISTS `teachers_resource_upload`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teachers_resource_upload` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) DEFAULT NULL,
  `course_resource_id` int(11) DEFAULT NULL,
  `is_uploaded` int(11) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_id_2` (`teacher_id`,`course_resource_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `course_resource_id` (`course_resource_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1116 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers_stats`
--

DROP TABLE IF EXISTS `teachers_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teachers_stats` (
  `course_resource_id` int(11) unsigned NOT NULL,
  `question_id` varchar(255) DEFAULT NULL,
  `views` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`course_resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers_student_subscription`
--

DROP TABLE IF EXISTS `teachers_student_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teachers_student_subscription` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `is_active` int(11) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_id_2` (`teacher_id`,`student_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9809 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers_subject_mapping`
--

DROP TABLE IF EXISTS `teachers_subject_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teachers_subject_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) DEFAULT NULL,
  `subject` varchar(50) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_id` (`teacher_id`,`subject`)
) ENGINE=InnoDB AUTO_INCREMENT=5887 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `techno_users_2019`
--

DROP TABLE IF EXISTS `techno_users_2019`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `techno_users_2019` (
  `mobile` varchar(10) NOT NULL,
  PRIMARY KEY (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tele_sales_expert_link_mapping`
--

DROP TABLE IF EXISTS `tele_sales_expert_link_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tele_sales_expert_link_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expert_id` varchar(100) NOT NULL,
  `student_id` int(11) NOT NULL,
  `type` tinyint(2) NOT NULL,
  `link` varchar(60) DEFAULT NULL,
  `vba_details` varchar(200) DEFAULT NULL,
  `pi_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `variant_id` int(11) DEFAULT NULL,
  `sale_type` varchar(45) DEFAULT NULL,
  `package_from` int(11) DEFAULT NULL,
  `coupon_code` varchar(45) DEFAULT NULL,
  `wallet_amount` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=125218 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_as_dnk_no_new`
--

DROP TABLE IF EXISTS `temp_as_dnk_no_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_as_dnk_no_new` (
  `student_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `old_end_date` timestamp NULL DEFAULT NULL,
  `flag` int(11) DEFAULT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_dj_subject`
--

DROP TABLE IF EXISTS `temp_dj_subject`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_dj_subject` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject` varchar(100) NOT NULL,
  `chapter_order` int(11) NOT NULL,
  `chapter` varchar(1000) NOT NULL,
  `meta_info` varchar(100) DEFAULT NULL,
  `chapter_display` varchar(500) DEFAULT NULL,
  `subject_display` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_expert_agent_id`
--

DROP TABLE IF EXISTS `temp_expert_agent_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_expert_agent_id` (
  `agent_id` varchar(36) NOT NULL,
  `expert_email` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_hindi_strings`
--

DROP TABLE IF EXISTS `temp_hindi_strings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_hindi_strings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hindi_string` varchar(500) NOT NULL,
  `hindi_string_tr` varchar(1000) DEFAULT NULL,
  `hindi_str_tr_manual` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hindi_string_2` (`hindi_string`),
  KEY `hindi_string_tr` (`hindi_string_tr`),
  KEY `hindi_str_tr_manual` (`hindi_str_tr_manual`)
) ENGINE=InnoDB AUTO_INCREMENT=11963 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_html_pdf_mapping`
--

DROP TABLE IF EXISTS `temp_html_pdf_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_html_pdf_mapping` (
  `html` varchar(1000) NOT NULL,
  `pdf` varchar(1000) NOT NULL,
  PRIMARY KEY (`html`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_liveclass_schedule_all`
--

DROP TABLE IF EXISTS `temp_liveclass_schedule_all`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_liveclass_schedule_all` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assortment_id` int(11) NOT NULL,
  `assortment_type` varchar(100) NOT NULL,
  `display_name` varchar(500) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `course_type` varchar(100) NOT NULL,
  `class_type` varchar(100) NOT NULL,
  `category_type` varchar(200) DEFAULT NULL,
  `is_free` int(11) NOT NULL,
  `year_exam` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `meta_info` varchar(50) NOT NULL,
  `week_day` varchar(50) NOT NULL,
  `schedule_time` time NOT NULL,
  `subject` varchar(100) NOT NULL,
  `subject_display_name` varchar(100) DEFAULT NULL,
  `week_day_num` int(11) DEFAULT NULL,
  `course_details_deeplink` varchar(200) DEFAULT NULL,
  `subject_name_localised` varchar(200) NOT NULL,
  `group_week_days` varchar(50) DEFAULT NULL,
  `slot_number` int(11) NOT NULL DEFAULT '0',
  `class_duration` int(11) NOT NULL DEFAULT '60',
  `calendar_link` varchar(2000) DEFAULT NULL,
  `calendar_title` varchar(200) DEFAULT NULL,
  `calendar_description` varchar(1000) DEFAULT NULL,
  `calendar_start_time` varchar(15) DEFAULT NULL,
  `calendar_end_time` varchar(15) DEFAULT NULL,
  `calendar_until` varchar(8) DEFAULT NULL,
  `pdf_url` varchar(2000) DEFAULT NULL,
  `post_purchase_pdf_url` varchar(1000) DEFAULT NULL,
  `batch_id` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=577 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_download`
--

DROP TABLE IF EXISTS `temp_yt_download`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_download` (
  `resource_reference` varchar(200) NOT NULL,
  `meta_info` varchar(255) NOT NULL,
  `dl_status` int(1) NOT NULL DEFAULT '0',
  `old_answer_video` varchar(200) NOT NULL,
  `answer_video` varchar(200) NOT NULL,
  `duration` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`resource_reference`,`meta_info`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_hindi`
--

DROP TABLE IF EXISTS `temp_yt_hindi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_hindi` (
  `id` int(11) NOT NULL,
  `description_hindi` text NOT NULL,
  `desc_1` varchar(255) DEFAULT NULL,
  `desc_2` varchar(255) DEFAULT NULL,
  `desc_3` varchar(255) DEFAULT NULL,
  `desc_4` varchar(255) DEFAULT NULL,
  `desc_5` varchar(255) DEFAULT NULL,
  `desc_6` varchar(255) DEFAULT NULL,
  `desc_7` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_id_20200611`
--

DROP TABLE IF EXISTS `temp_yt_id_20200611`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_id_20200611` (
  `youtube_id` varchar(11) NOT NULL,
  `answer_video` varchar(50) NOT NULL,
  KEY `answer_video` (`answer_video`),
  KEY `youtube_id` (`youtube_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_id_20200617`
--

DROP TABLE IF EXISTS `temp_yt_id_20200617`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_id_20200617` (
  `answer_video` varchar(500) NOT NULL,
  `youtube_id` varchar(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_id_update`
--

DROP TABLE IF EXISTS `temp_yt_id_update`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_id_update` (
  `question_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `yt_url` varchar(28) NOT NULL,
  `yt_id` varchar(11) NOT NULL,
  `is_error` tinyint(4) NOT NULL DEFAULT '0',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`answer_id`),
  KEY `answer_id` (`answer_id`,`yt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_mpd_mapping`
--

DROP TABLE IF EXISTS `temp_yt_mpd_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_mpd_mapping` (
  `question_id` int(11) NOT NULL,
  `youtube_id` varchar(100) NOT NULL,
  `length_yt` int(11) NOT NULL,
  `is_valid_yt` int(11) NOT NULL,
  `answer_video` varchar(500) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `is_yt_1` int(11) NOT NULL,
  `vdo_cipher_id` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_upload_20200330`
--

DROP TABLE IF EXISTS `temp_yt_upload_20200330`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_upload_20200330` (
  `question_id` int(55) NOT NULL DEFAULT '0',
  `student_id` int(255) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `youtube_id` varchar(256) CHARACTER SET latin1 DEFAULT NULL,
  `answer_video` varchar(255) CHARACTER SET latin1,
  `package_language` enum('en','bn','hi','ta','te','gu','kn','ml','mr') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `is_answered` int(55) NOT NULL DEFAULT '0',
  PRIMARY KEY (`answer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_upload_20200411`
--

DROP TABLE IF EXISTS `temp_yt_upload_20200411`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_upload_20200411` (
  `question_id` int(55) NOT NULL DEFAULT '0',
  `student_id` int(255) NOT NULL,
  `answer_id` int(11) DEFAULT NULL,
  `youtube_id` varchar(256) CHARACTER SET latin1 DEFAULT NULL,
  `answer_video` varchar(255) CHARACTER SET latin1,
  `package_language` enum('en','bn','hi','ta','te','gu','kn','ml','mr') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `is_answered` int(55) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_upload_20200502`
--

DROP TABLE IF EXISTS `temp_yt_upload_20200502`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_upload_20200502` (
  `question_id` int(55) NOT NULL DEFAULT '0',
  `student_id` int(255) NOT NULL,
  `answer_id` int(11) DEFAULT NULL,
  `youtube_id` varchar(256) CHARACTER SET latin1 DEFAULT NULL,
  `answer_video` varchar(255) CHARACTER SET latin1,
  `video_language` enum('en','bn-en','hi-en','ta-en','te-en','gu-en','kn-en','ml-en','mr-en','en','bn','hi','ta','te','gu','kn','ml','mr') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'hi-en',
  `is_answered` int(55) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_upload_20200513`
--

DROP TABLE IF EXISTS `temp_yt_upload_20200513`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_upload_20200513` (
  `question_id` int(55) NOT NULL DEFAULT '0',
  `student_id` int(255) NOT NULL,
  `answer_id` int(11) DEFAULT NULL,
  `youtube_id` varchar(256) CHARACTER SET latin1 DEFAULT NULL,
  `answer_video` varchar(255) CHARACTER SET latin1,
  `video_language` enum('en','bn-en','hi-en','ta-en','te-en','gu-en','kn-en','ml-en','mr-en','en','bn','hi','ta','te','gu','kn','ml','mr') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'hi-en',
  `is_answered` int(55) NOT NULL DEFAULT '0',
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_upload_20200526`
--

DROP TABLE IF EXISTS `temp_yt_upload_20200526`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_upload_20200526` (
  `question_id` int(55) NOT NULL DEFAULT '0',
  `student_id` int(255) NOT NULL,
  `answer_id` int(11) DEFAULT NULL,
  `youtube_id` varchar(256) CHARACTER SET latin1 DEFAULT NULL,
  `answer_video` varchar(255) CHARACTER SET latin1,
  `video_language` enum('en','bn-en','hi-en','ta-en','te-en','gu-en','kn-en','ml-en','mr-en','en','bn','hi','ta','te','gu','kn','ml','mr') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'hi-en',
  `is_answered` int(55) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_upload_20200617`
--

DROP TABLE IF EXISTS `temp_yt_upload_20200617`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_upload_20200617` (
  `question_id` int(55) NOT NULL DEFAULT '0',
  `student_id` int(255) NOT NULL,
  `answer_id` int(11) DEFAULT NULL,
  `youtube_id` varchar(256) CHARACTER SET latin1 DEFAULT NULL,
  `answer_video` varchar(255) CHARACTER SET latin1,
  `video_language` enum('en','bn-en','hi-en','ta-en','te-en','gu-en','kn-en','ml-en','mr-en','en','bn','hi','ta','te','gu','kn','ml','mr') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'hi-en',
  `is_answered` int(55) NOT NULL DEFAULT '0',
  `merged_video` varchar(1000) DEFAULT NULL,
  `is_uploaded` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`question_id`),
  KEY `student_id` (`student_id`,`answer_id`,`youtube_id`,`answer_video`,`video_language`),
  KEY `merged_video` (`merged_video`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp_yt_upload_all_20200611`
--

DROP TABLE IF EXISTS `temp_yt_upload_all_20200611`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `temp_yt_upload_all_20200611` (
  `question_id` int(55) NOT NULL DEFAULT '0',
  `student_id` int(255) NOT NULL DEFAULT '0',
  `answer_id` int(11) NOT NULL,
  `youtube_id` varchar(256) CHARACTER SET latin1 DEFAULT NULL,
  `answer_video` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `package_language` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_answered` int(55) NOT NULL DEFAULT '0',
  PRIMARY KEY (`answer_id`),
  KEY `question_id` (`question_id`,`answer_id`,`youtube_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_hindi_data`
--

DROP TABLE IF EXISTS `test_hindi_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `test_hindi_data` (
  `paper_code` varchar(50) NOT NULL,
  `section_code` varchar(25) DEFAULT NULL,
  `q_type` varchar(25) DEFAULT NULL,
  `q_text` varchar(5000) CHARACTER SET utf32 COLLATE utf32_unicode_ci DEFAULT NULL,
  `op_1` varchar(1000) CHARACTER SET utf32 COLLATE utf32_unicode_ci DEFAULT NULL,
  `op_2` varchar(1000) CHARACTER SET utf32 COLLATE utf32_unicode_ci DEFAULT NULL,
  `op_3` varchar(1000) CHARACTER SET utf32 COLLATE utf32_unicode_ci DEFAULT NULL,
  `op_4` varchar(1000) CHARACTER SET utf32 COLLATE utf32_unicode_ci DEFAULT NULL,
  `correct_op` varchar(1000) CHARACTER SET utf32 COLLATE utf32_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`paper_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_html_rendered`
--

DROP TABLE IF EXISTS `test_html_rendered`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `test_html_rendered` (
  `id` int(11) NOT NULL,
  `original_html` varchar(500) NOT NULL,
  `rendered_html` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_table`
--

DROP TABLE IF EXISTS `test_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `test_table` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_udid`
--

DROP TABLE IF EXISTS `test_udid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `test_udid` (
  `referred_udid` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_video_view`
--

DROP TABLE IF EXISTS `test_video_view`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `test_video_view` (
  `view_id` int(11) NOT NULL,
  `student_id` int(25) NOT NULL,
  `question_id` int(25) NOT NULL,
  `answer_id` int(25) NOT NULL,
  `answer_video` varchar(128) NOT NULL,
  `video_time` int(128) NOT NULL,
  `engage_time` bigint(255) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `parent_id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL DEFAULT '0',
  `tab_id` varchar(50) DEFAULT '0',
  `is_back` tinyint(1) NOT NULL,
  `ip_address` varchar(25) NOT NULL DEFAULT '0',
  `source` varchar(25) NOT NULL DEFAULT '0',
  `refer_id` varchar(125) NOT NULL DEFAULT '0',
  `view_from` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_view_stats_new`
--

DROP TABLE IF EXISTS `test_view_stats_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `test_view_stats_new` (
  `view_id` int(11) NOT NULL,
  `student_id` int(25) NOT NULL,
  `question_id` int(25) NOT NULL,
  `answer_id` int(25) NOT NULL,
  `answer_video` varchar(128) NOT NULL,
  `video_time` int(128) NOT NULL,
  `engage_time` bigint(255) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `parent_id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL DEFAULT '0',
  `tab_id` varchar(50) DEFAULT '0',
  `is_back` tinyint(1) NOT NULL,
  `ip_address` varchar(25) NOT NULL DEFAULT '0',
  `source` varchar(25) NOT NULL DEFAULT '0',
  `refer_id` varchar(125) NOT NULL DEFAULT '0',
  `view_from` varchar(50) DEFAULT NULL,
  KEY `view_id` (`student_id`,`answer_video`),
  KEY `session_id` (`session_id`,`tab_id`),
  KEY `question_id` (`question_id`,`answer_id`,`answer_video`,`video_time`),
  KEY `new_view_id` (`view_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `test_view_stats_new_new`
--

DROP TABLE IF EXISTS `test_view_stats_new_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `test_view_stats_new_new` (
  `view_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(25) NOT NULL,
  `question_id` int(25) NOT NULL,
  `answer_id` int(25) NOT NULL,
  `answer_video` varchar(128) NOT NULL,
  `video_time` int(128) NOT NULL,
  `engage_time` bigint(255) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `parent_id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL DEFAULT '0',
  `tab_id` varchar(50) DEFAULT '0',
  `is_back` tinyint(1) NOT NULL,
  `ip_address` varchar(25) NOT NULL DEFAULT '0',
  `source` varchar(25) NOT NULL DEFAULT '0',
  `refer_id` varchar(125) NOT NULL DEFAULT '0',
  `view_from` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`view_id`),
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`),
  KEY `answer_id` (`answer_id`),
  KEY `session_id` (`session_id`),
  KEY `engage_time` (`engage_time`),
  KEY `refer_id` (`refer_id`),
  KEY `video_time` (`video_time`),
  KEY `answer_video` (`answer_video`),
  KEY `view_from` (`view_from`),
  KEY `created_at` (`created_at`),
  KEY `is_back` (`is_back`),
  KEY `parent_id` (`parent_id`),
  KEY `source` (`source`)
) ENGINE=InnoDB AUTO_INCREMENT=5083785 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tests`
--

DROP TABLE IF EXISTS `tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries`
--

DROP TABLE IF EXISTS `testseries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries` (
  `test_id` int(11) NOT NULL AUTO_INCREMENT,
  `class_code` enum('6','7','8','9','10','11','12','14') CHARACTER SET utf8 DEFAULT NULL,
  `app_module` enum('QUIZ','TEST','TEST1','COURSE','CHAPTER') CHARACTER SET utf8 NOT NULL DEFAULT 'QUIZ',
  `course` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `subject_code` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `chapter_code` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `duration_in_min` int(11) DEFAULT NULL,
  `publish_time` datetime DEFAULT NULL,
  `unpublish_time` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `difficulty_type` varchar(45) CHARACTER SET utf8 DEFAULT NULL,
  `type` varchar(11) CHARACTER SET utf8 NOT NULL DEFAULT 'TEST',
  `rule_id` int(11) DEFAULT NULL,
  `is_sectioned` tinyint(1) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `no_of_questions` int(11) NOT NULL,
  `is_reward` tinyint(1) NOT NULL,
  `is_shuffle` tinyint(1) NOT NULL,
  `solution_pdf` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `solution_playlist` int(11) DEFAULT NULL,
  `image_url` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `is_free` int(11) NOT NULL DEFAULT '1',
  `category` varchar(100) CHARACTER SET utf8mb4 DEFAULT NULL,
  PRIMARY KEY (`test_id`),
  KEY `publish_time` (`publish_time`),
  KEY `app_module` (`app_module`),
  KEY `class_code` (`class_code`),
  KEY `is_active_2` (`is_active`,`class_code`,`app_module`),
  KEY `difficulty_type` (`difficulty_type`)
) ENGINE=InnoDB AUTO_INCREMENT=700538 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_question_answers`
--

DROP TABLE IF EXISTS `testseries_question_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_question_answers` (
  `option_code` varchar(20) CHARACTER SET utf8 NOT NULL,
  `questionbank_id` int(11) NOT NULL,
  `title` text CHARACTER SET utf8,
  `description` varchar(45) CHARACTER SET utf8 DEFAULT NULL,
  `is_answer` varchar(45) CHARACTER SET utf8 DEFAULT NULL,
  `answer` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `loc_lang` varchar(45) CHARACTER SET utf8 DEFAULT NULL,
  `difficulty_type` enum('SUPEREASY','EASY','MEDIUM','HARD','SUPERHARD') CHARACTER SET utf8 NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`option_code`,`questionbank_id`),
  KEY `questionbank_id` (`questionbank_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_question_bank`
--

DROP TABLE IF EXISTS `testseries_question_bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_question_bank` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_uuid` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `subject_code` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `chapter_code` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `subtopic_code` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `class_code` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `mc_code` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `difficulty_type` enum('SUPEREASY','EASY','MEDIUM','HARD','SUPERHARD') CHARACTER SET utf8 DEFAULT NULL,
  `type` enum('BOOLEAN','TEXT','SINGLE','MULTI','IMAGE','AUDIO','VIDEO','MATRIX') CHARACTER SET utf8 DEFAULT NULL,
  `loc_lang` varchar(20) CHARACTER SET utf8 DEFAULT NULL,
  `text` text CHARACTER SET utf8,
  `image_url` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `video_url` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `audio_url` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `doubtnut_questionid` int(11) DEFAULT NULL,
  `qid_type` enum('TEXT','VIDEO') DEFAULT NULL,
  `text_solution` longtext CHARACTER SET utf8,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `question_uuid` (`question_uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=231896 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_questions`
--

DROP TABLE IF EXISTS `testseries_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_questions` (
  `test_id` int(11) NOT NULL,
  `section_code` varchar(255) CHARACTER SET utf8 NOT NULL,
  `questionbank_id` int(11) NOT NULL,
  `difficulty_type` enum('SUPEREASY','EASY','MEDIUM') CHARACTER SET utf8 NOT NULL,
  `correct_reward` int(11) DEFAULT NULL,
  `incorrect_reward` int(11) DEFAULT NULL,
  `validity` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`test_id`,`section_code`,`questionbank_id`),
  KEY `questionbank_id` (`questionbank_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_rules`
--

DROP TABLE IF EXISTS `testseries_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rule_code` varchar(11) NOT NULL,
  `rule_text` longtext,
  `is_active` varchar(45) CHARACTER SET latin1 DEFAULT NULL,
  `type` varchar(45) CHARACTER SET latin1 DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=142 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_sections`
--

DROP TABLE IF EXISTS `testseries_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_sections` (
  `section_code` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `test_id` int(11) NOT NULL,
  `subject_code` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `chapter_code` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `mc_code` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  `type` varchar(45) CHARACTER SET utf8mb4 DEFAULT NULL,
  `duration_in_min` int(11) DEFAULT NULL,
  `order_pref` int(11) DEFAULT NULL,
  `rule_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `attempt_limit` int(11) DEFAULT NULL,
  PRIMARY KEY (`section_code`,`test_id`),
  KEY `test_id` (`test_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_student_reportcards`
--

DROP TABLE IF EXISTS `testseries_student_reportcards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_student_reportcards` (
  `student_id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL,
  `test_subscription_id` int(11) NOT NULL,
  `totalscore` int(11) NOT NULL,
  `totalmarks` int(11) NOT NULL,
  `correct` text NOT NULL,
  `incorrect` text NOT NULL,
  `skipped` text NOT NULL,
  `eligiblescore` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`,`test_id`,`test_subscription_id`),
  KEY `test_id` (`test_id`),
  KEY `test_subscription_id` (`test_subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_student_responses`
--

DROP TABLE IF EXISTS `testseries_student_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_student_responses` (
  `student_id` int(11) NOT NULL,
  `test_subscription_id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL,
  `questionbank_id` int(11) NOT NULL,
  `question_type` enum('BOOLEAN','TEXT','SINGLE','MULTI','IMAGE','AUDIO','VIDEO','MATRIX') NOT NULL,
  `action_type` enum('SKIP','ANS') DEFAULT NULL,
  `review_status` enum('MARKED','REVIEWED','NOTMARKED') DEFAULT 'NOTMARKED',
  `option_codes` varchar(255) DEFAULT NULL,
  `section_code` varchar(255) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_eligible` tinyint(1) NOT NULL,
  `time_taken` int(11) NOT NULL,
  PRIMARY KEY (`test_subscription_id`,`questionbank_id`),
  KEY `student_id_2` (`student_id`,`test_subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_student_responses2`
--

DROP TABLE IF EXISTS `testseries_student_responses2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_student_responses2` (
  `student_id` int(11) NOT NULL,
  `test_subscription_id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL,
  `questionbank_id` int(11) NOT NULL,
  `question_type` enum('BOOLEAN','TEXT','SINGLE','MULTI','IMAGE','AUDIO','VIDEO','MATRIX') NOT NULL,
  `action_type` enum('SKIP','ANS') DEFAULT NULL,
  `review_status` enum('MARKED','REVIEWED','NOTMARKED') DEFAULT 'NOTMARKED',
  `option_codes` varchar(255) DEFAULT NULL,
  `section_code` varchar(11) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_eligible` tinyint(1) NOT NULL,
  `time_taken` int(11) NOT NULL,
  PRIMARY KEY (`test_subscription_id`,`questionbank_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_student_responses_4`
--

DROP TABLE IF EXISTS `testseries_student_responses_4`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_student_responses_4` (
  `student_id` int(11) NOT NULL,
  `test_subscription_id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL,
  `questionbank_id` int(11) NOT NULL,
  `question_type` enum('BOOLEAN','TEXT','SINGLE','MULTI','IMAGE','AUDIO','VIDEO','MATRIX') NOT NULL,
  `action_type` enum('SKIP','ANS') DEFAULT NULL,
  `review_status` enum('MARKED','REVIEWED','NOTMARKED') DEFAULT 'NOTMARKED',
  `option_codes` varchar(255) DEFAULT NULL,
  `section_code` varchar(50) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_eligible` tinyint(1) NOT NULL,
  `time_taken` int(11) NOT NULL,
  PRIMARY KEY (`test_subscription_id`,`questionbank_id`),
  KEY `student_id` (`test_subscription_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_student_responses_test`
--

DROP TABLE IF EXISTS `testseries_student_responses_test`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_student_responses_test` (
  `student_id` int(11) NOT NULL,
  `test_subscription_id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL,
  `questionbank_id` int(11) NOT NULL,
  `question_type` enum('BOOLEAN','TEXT','SINGLE','MULTI','IMAGE','AUDIO','VIDEO','MATRIX') NOT NULL,
  `action_type` enum('SKIP','ANS') DEFAULT NULL,
  `review_status` enum('MARKED','REVIEWED','NOTMARKED') DEFAULT 'NOTMARKED',
  `option_codes` varchar(255) DEFAULT NULL,
  `section_code` varchar(50) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_eligible` tinyint(1) NOT NULL,
  `time_taken` int(11) NOT NULL,
  PRIMARY KEY (`test_subscription_id`,`questionbank_id`),
  KEY `student_id_2` (`student_id`,`test_subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_student_results`
--

DROP TABLE IF EXISTS `testseries_student_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_student_results` (
  `student_id` int(11) NOT NULL,
  `test_id` int(11) NOT NULL,
  `test_subscription_id` int(11) NOT NULL,
  `questionbank_id` int(11) NOT NULL,
  `section_code` varchar(11) NOT NULL,
  `subject_code` varchar(11) DEFAULT NULL,
  `chapter_code` varchar(11) DEFAULT NULL,
  `subtopic_code` varchar(11) DEFAULT NULL,
  `mc_code` varchar(11) DEFAULT NULL,
  `correct_options` varchar(255) DEFAULT NULL,
  `response_options` varchar(255) DEFAULT NULL,
  `marks` varchar(45) DEFAULT NULL,
  `marks_scored` int(11) DEFAULT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `is_skipped` tinyint(1) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `matrix_correct_rows` int(11) DEFAULT NULL,
  `matrix_incorrect_rows` int(11) NOT NULL,
  PRIMARY KEY (`test_id`,`student_id`,`test_subscription_id`,`questionbank_id`) USING BTREE,
  KEY `test_subscription_id` (`test_subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `testseries_student_subscriptions`
--

DROP TABLE IF EXISTS `testseries_student_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testseries_student_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `test_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `class_code` enum('6','7','8','9','10','11','12','14') NOT NULL,
  `status` enum('SUBSCRIBED','COMPLETED','','') DEFAULT NULL,
  `registered_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`,`test_id`,`student_id`),
  UNIQUE KEY `test_id` (`test_id`,`student_id`,`status`,`id`) USING BTREE,
  KEY `student_id_2` (`student_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=24463893 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `text_answers`
--

DROP TABLE IF EXISTS `text_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `text_answers` (
  `answer_id` int(55) NOT NULL AUTO_INCREMENT,
  `question_id` int(55) NOT NULL,
  `answer_text` text CHARACTER SET utf8mb4 NOT NULL,
  `answer_math` text CHARACTER SET utf8mb4 NOT NULL,
  PRIMARY KEY (`answer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=713 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `text_solution_assigned_to`
--

DROP TABLE IF EXISTS `text_solution_assigned_to`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `text_solution_assigned_to` (
  `question_id` int(11) NOT NULL,
  `expert_id` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `text_solutions`
--

DROP TABLE IF EXISTS `text_solutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `text_solutions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(55) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `page_no` int(11) DEFAULT NULL,
  `sub_obj` varchar(11) DEFAULT NULL,
  `opt_1` text,
  `opt_2` text,
  `opt_3` text,
  `opt_4` text,
  `answer` text,
  `subtopic` varchar(55) NOT NULL,
  `tag1` varchar(255) DEFAULT NULL,
  `tag2` varchar(255) DEFAULT NULL,
  `solutions` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_at` (`created_at`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16774185 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `third_party_coupon`
--

DROP TABLE IF EXISTS `third_party_coupon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `third_party_coupon` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `student_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) DEFAULT NULL,
  `code` varchar(10) DEFAULT NULL,
  `expiry` datetime DEFAULT NULL,
  `status` enum('ACTIVE','USED') DEFAULT 'ACTIVE',
  `vendor` varchar(45) DEFAULT NULL,
  `transaction_id` varchar(45) DEFAULT NULL,
  `session_id` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_UNIQUE` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=208707 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `thumbnail_course_details`
--

DROP TABLE IF EXISTS `thumbnail_course_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `thumbnail_course_details` (
  `assortment_id` int(11) NOT NULL,
  `module` varchar(50) DEFAULT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `faculty_name` varchar(255) DEFAULT NULL,
  `faculty_nickname` varchar(255) DEFAULT NULL,
  `language` varchar(255) DEFAULT NULL,
  `display_image_square` varchar(255) DEFAULT NULL,
  `faculty_image` varchar(255) DEFAULT NULL,
  `final_thumbnail` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`assortment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tier1_pincode_mapping`
--

DROP TABLE IF EXISTS `tier1_pincode_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tier1_pincode_mapping` (
  `pincode` int(11) NOT NULL,
  PRIMARY KEY (`pincode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tiktok_links`
--

DROP TABLE IF EXISTS `tiktok_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tiktok_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `link` varchar(500) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tiktok_scrapped_views`
--

DROP TABLE IF EXISTS `tiktok_scrapped_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tiktok_scrapped_views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `link` varchar(50) NOT NULL,
  `title` varchar(1000) NOT NULL,
  `views` varchar(50) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6306 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `time_table`
--

DROP TABLE IF EXISTS `time_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `time_table` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(100) NOT NULL,
  `title` varchar(100) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `note` varchar(255) NOT NULL,
  `date` varchar(100) NOT NULL,
  `schedule` varchar(100) NOT NULL,
  `start_time` varchar(100) NOT NULL,
  `end_time` varchar(100) NOT NULL,
  `recurring` tinyint(1) NOT NULL,
  `date_in_milliseconds` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `student_id` int(25) NOT NULL,
  `student_class` varchar(100) NOT NULL,
  `is_active` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `top_free_classes`
--

DROP TABLE IF EXISTS `top_free_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `top_free_classes` (
  `id` int(11) unsigned NOT NULL,
  `liveclass_course_id` int(11) DEFAULT NULL,
  `course_exam` varchar(50) DEFAULT NULL,
  `locale` varchar(10) DEFAULT NULL,
  `detail_id` int(11) DEFAULT NULL,
  `chapter_order` int(11) DEFAULT NULL,
  `master_chapter` varchar(100) DEFAULT NULL,
  `chapter` varchar(100) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `subject` varchar(25) DEFAULT NULL,
  `expert_name` varchar(25) DEFAULT NULL,
  `question_id` int(25) DEFAULT NULL,
  `average_rating` float DEFAULT NULL,
  `et_per_st` float DEFAULT NULL,
  `is_active` int(11) DEFAULT '1',
  `expert_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class_locale_is_active_idx` (`class`,`locale`,`is_active`),
  KEY `question_id` (`question_id`),
  KEY `subject` (`subject`),
  KEY `master_chapter` (`master_chapter`),
  KEY `chapter` (`chapter`),
  KEY `et_per_st` (`et_per_st`),
  KEY `expert_id` (`expert_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `top_questions_by_chapter`
--

DROP TABLE IF EXISTS `top_questions_by_chapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `top_questions_by_chapter` (
  `primary_key` int(11) NOT NULL AUTO_INCREMENT,
  `id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `assigned_to` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `subtopic` varchar(255) NOT NULL,
  `microconcept` varchar(255) NOT NULL,
  `level` varchar(255) NOT NULL,
  `target_course` varchar(255) NOT NULL,
  `package` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `q_options` varchar(255) NOT NULL,
  `q_answer` longtext,
  `diagram_type` varchar(255) DEFAULT NULL,
  `concept_type` varchar(50) DEFAULT NULL,
  `chapter_type` varchar(50) DEFAULT NULL,
  `we_type` varchar(50) DEFAULT NULL,
  `ei_type` varchar(50) DEFAULT NULL,
  `aptitude_type` varchar(10) DEFAULT NULL,
  `pfs_type` varchar(10) DEFAULT NULL,
  `symbol_type` varchar(255) NOT NULL,
  `doubtnut_recommended` varchar(255) NOT NULL,
  `secondary_class` varchar(255) NOT NULL,
  `secondary_chapter` varchar(255) NOT NULL,
  `secondary_subtopic` varchar(255) NOT NULL,
  `secondary_microconcept` varchar(255) NOT NULL,
  `video_quality` varchar(255) NOT NULL,
  `audio_quality` varchar(255) NOT NULL,
  `language` varchar(255) NOT NULL,
  `ocr_quality` varchar(50) NOT NULL,
  `timestamp` timestamp NOT NULL,
  `is_skipped` int(11) NOT NULL,
  `ocr_text` longtext NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `question` longtext NOT NULL,
  `resource_type` varchar(20) NOT NULL,
  `duration` varchar(10) NOT NULL,
  `thumbnail_image` varchar(500) NOT NULL,
  PRIMARY KEY (`primary_key`),
  KEY `class` (`class`),
  KEY `chapter` (`chapter`)
) ENGINE=InnoDB AUTO_INCREMENT=11015 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `top_questions_web`
--

DROP TABLE IF EXISTS `top_questions_web`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `top_questions_web` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `top_viewed_chapter`
--

DROP TABLE IF EXISTS `top_viewed_chapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `top_viewed_chapter` (
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `view_count` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `class` int(25) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=309657 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `top_viewed_class_chapter`
--

DROP TABLE IF EXISTS `top_viewed_class_chapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `top_viewed_class_chapter` (
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `count_v` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `question_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `answer_video` varchar(255) NOT NULL,
  `ocr_text` text NOT NULL,
  `doubt` varchar(100) NOT NULL,
  `question` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=689 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `top_viewed_video`
--

DROP TABLE IF EXISTS `top_viewed_video`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `top_viewed_video` (
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `answer_video` varchar(128) NOT NULL,
  `view_count` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `class` int(25) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `m_class` int(11) DEFAULT NULL,
  `m_chapter` varchar(255) DEFAULT NULL,
  `m_subtopic` varchar(500) DEFAULT NULL,
  `m_level` varchar(25) DEFAULT NULL,
  `ocr_text` text,
  `question` text,
  PRIMARY KEY (`id`),
  KEY `timestamp` (`timestamp`,`question_id`,`answer_id`,`answer_video`,`student_id`,`class`,`chapter`),
  KEY `m_class` (`m_class`,`m_chapter`)
) ENGINE=InnoDB AUTO_INCREMENT=309064 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `traceback_reward_mapping`
--

DROP TABLE IF EXISTS `traceback_reward_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `traceback_reward_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `assortment_id` int(11) NOT NULL,
  `traceback_reward_used` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `trm_sid_idx` (`student_id`),
  KEY `trm_aid_idx` (`assortment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=96899 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transactions` (
  `tx_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tx_hash` varchar(128) NOT NULL,
  `tx_student_id` int(10) unsigned NOT NULL,
  `tx_amount` int(11) NOT NULL,
  `tx_status` varchar(50) NOT NULL,
  `result_code` varchar(10) DEFAULT NULL,
  `result_message` varchar(255) DEFAULT NULL,
  `pg_source` varchar(16) DEFAULT NULL,
  `pg_reference` varchar(100) DEFAULT NULL,
  `pg_bank_ref_num` varchar(32) DEFAULT NULL,
  `pg_bankcode` varchar(10) DEFAULT NULL,
  `pg_net_amount_debit` varchar(10) DEFAULT NULL,
  `tx_type` varchar(50) NOT NULL,
  `pg_type` varchar(32) DEFAULT NULL,
  `pg_used` varchar(32) DEFAULT NULL,
  `tx_scheme_id` varchar(32) NOT NULL,
  `display_message` varchar(255) DEFAULT NULL,
  `refund` tinyint(4) NOT NULL DEFAULT '0',
  `refund_remark` varchar(255) DEFAULT NULL,
  `datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `coupon_deduct` varchar(32) DEFAULT '""' COMMENT 'REF_tx_id, PROMO_ID',
  `invoice_name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`tx_id`),
  UNIQUE KEY `tx_hash` (`tx_hash`),
  KEY `tx_student_id` (`tx_student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9926 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `translation_index_ocrs`
--

DROP TABLE IF EXISTS `translation_index_ocrs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `translation_index_ocrs` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `question_id` int(55) NOT NULL,
  `ocr_text_hi` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1348681 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trending_video_logs`
--

DROP TABLE IF EXISTS `trending_video_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `trending_video_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `notification_id` varchar(50) NOT NULL,
  `class` int(11) NOT NULL,
  `question_id` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notification_id` (`notification_id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trending_videos`
--

DROP TABLE IF EXISTS `trending_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `trending_videos` (
  `id` int(50) NOT NULL AUTO_INCREMENT,
  `question_id` int(50) NOT NULL,
  `class` varchar(300) NOT NULL,
  `course` varchar(300) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_at` (`created_at`),
  KEY `class` (`class`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21621 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tricky_question_csv`
--

DROP TABLE IF EXISTS `tricky_question_csv`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tricky_question_csv` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `week_num` int(11) NOT NULL,
  `class` int(11) NOT NULL,
  `subject` text NOT NULL,
  `chapter` text NOT NULL,
  `question_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `week_num` (`week_num`,`class`,`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14214 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `truecaller_student_fix`
--

DROP TABLE IF EXISTS `truecaller_student_fix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `truecaller_student_fix` (
  `id` int(11) unsigned NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unban_requests`
--

DROP TABLE IF EXISTS `unban_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unban_requests` (
  `student_id` int(11) NOT NULL,
  `review_status` tinyint(1) DEFAULT NULL,
  `unban_status` varchar(255) DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `reviewer_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unmatched_questions`
--

DROP TABLE IF EXISTS `unmatched_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unmatched_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `upboard_previous_year`
--

DROP TABLE IF EXISTS `upboard_previous_year`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `upboard_previous_year` (
  `doubt` varchar(1000) NOT NULL,
  `tag1` varchar(1000) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `chapter` varchar(1000) DEFAULT NULL,
  `q_type` varchar(1000) DEFAULT NULL,
  `q_type_code` int(11) DEFAULT NULL,
  `class` int(11) NOT NULL,
  PRIMARY KEY (`doubt`),
  KEY `tag1` (`tag1`,`question_id`,`q_type_code`,`class`),
  KEY `question_id` (`question_id`),
  KEY `chapter` (`chapter`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `update_truecaller_logins`
--

DROP TABLE IF EXISTS `update_truecaller_logins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `update_truecaller_logins` (
  `student_id` int(55) NOT NULL,
  `mobile_number` varchar(255) NOT NULL,
  `original_phone_number` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `us_feedbacks`
--

DROP TABLE IF EXISTS `us_feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `us_feedbacks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_answer_feedback`
--

DROP TABLE IF EXISTS `user_answer_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_answer_feedback` (
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `student_id` int(11) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `answer_id` int(11) DEFAULT NULL,
  `answer_video` varchar(50) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `feedback` varchar(255) DEFAULT NULL,
  `rating_id` int(11) NOT NULL AUTO_INCREMENT,
  `view_time` int(11) NOT NULL,
  `is_active` int(10) NOT NULL DEFAULT '1',
  `page` varchar(50) DEFAULT NULL,
  `view_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`rating_id`),
  KEY `is_active` (`is_active`),
  KEY `answer_video` (`answer_video`),
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`),
  KEY `rating` (`rating`),
  KEY `page` (`page`)
) ENGINE=InnoDB AUTO_INCREMENT=30150624 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_badges`
--

DROP TABLE IF EXISTS `user_badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_badges` (
  `id` int(255) NOT NULL,
  `type` varchar(25) NOT NULL,
  `upper_count` int(11) NOT NULL,
  `lower_count` int(11) NOT NULL,
  `url` varchar(120) NOT NULL,
  `is_active` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_combo` (`is_active`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_city_state_mapping`
--

DROP TABLE IF EXISTS `user_city_state_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_city_state_mapping` (
  `student_id` int(11) NOT NULL,
  `city` varchar(500) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `state` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_connections`
--

DROP TABLE IF EXISTS `user_connections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_connections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `connection_type` enum('Follow','Friend','Block') NOT NULL,
  `connection_id` int(11) NOT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT '0',
  `is_removed` tinyint(4) NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`,`connection_id`),
  KEY `created_at` (`created_at`,`is_deleted`,`connection_id`),
  KEY `connection_id_2` (`connection_id`,`is_deleted`),
  KEY `idx_is_deleted_user_id` (`is_deleted`,`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16721667 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_engagement_feedback`
--

DROP TABLE IF EXISTS `user_engagement_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_engagement_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resource_type` varchar(50) DEFAULT NULL,
  `resource_id` varchar(100) DEFAULT NULL,
  `is_like` tinyint(1) DEFAULT NULL,
  `student_id` int(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `resource_type` (`resource_type`,`resource_id`,`student_id`),
  KEY `is_like` (`is_like`),
  KEY `student_id` (`student_id`),
  KEY `resource_id` (`resource_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=5036089 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_feedback_revision`
--

DROP TABLE IF EXISTS `user_feedback_revision`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_feedback_revision` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  `answer_id` int(11) DEFAULT NULL,
  `answer_video` varchar(500) NOT NULL,
  `ocr_text` text NOT NULL,
  `avg_rating` decimal(14,4) DEFAULT NULL,
  `count_r` bigint(21) NOT NULL DEFAULT '0',
  `class` varchar(255),
  `subject` varchar(255),
  `chapter` varchar(255),
  `original_expert_id` int(11) NOT NULL,
  `is_redone` tinyint(1) NOT NULL DEFAULT '0',
  `redone_expert_id` int(11) NOT NULL DEFAULT '0',
  `add_timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `redone_timestamp` timestamp NULL DEFAULT NULL,
  `revised_answer_id` int(11) DEFAULT NULL,
  `revised_answer_video` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27041 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_first_questions`
--

DROP TABLE IF EXISTS `user_first_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_first_questions` (
  `id` int(55) NOT NULL AUTO_INCREMENT,
  `question_id` int(55) NOT NULL,
  `student_id` int(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `is_answered` int(55) NOT NULL,
  `question_image` varchar(255) NOT NULL,
  `matched_app_questions` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2223733 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_journey_skip`
--

DROP TABLE IF EXISTS `user_journey_skip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_journey_skip` (
  `question_id` int(11) DEFAULT NULL,
  `skip_reason_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_match_skips`
--

DROP TABLE IF EXISTS `user_match_skips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_match_skips` (
  `question_id` int(11) DEFAULT NULL,
  `skip_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_matched_questions`
--

DROP TABLE IF EXISTS `user_matched_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_matched_questions` (
  `question_id` bigint(20) NOT NULL,
  `image_clear` int(11) DEFAULT NULL,
  `valid_question` int(11) DEFAULT NULL,
  `math_question` int(11) DEFAULT NULL,
  `question_in_english` int(11) DEFAULT NULL,
  `printed_question` int(11) DEFAULT NULL,
  `cropped_to_one_question` int(11) DEFAULT NULL,
  `image_horizontal` int(11) DEFAULT NULL,
  `chapter` varchar(255) DEFAULT NULL,
  `class` varchar(255) DEFAULT NULL,
  `equation` varchar(255) DEFAULT NULL,
  `exists_in_catalog` int(11) DEFAULT NULL,
  `same_chapter_results` int(11) DEFAULT NULL,
  `exact_or_similar_match` int(11) DEFAULT NULL,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_matched_skip_reasons`
--

DROP TABLE IF EXISTS `user_matched_skip_reasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_matched_skip_reasons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reason` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_notification`
--

DROP TABLE IF EXISTS `user_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(128) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `button_text` varchar(25) NOT NULL DEFAULT 'Goto',
  `notification_type` varchar(25) DEFAULT NULL,
  `image_url` varchar(150) DEFAULT '',
  `message` varchar(500) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  KEY `notification_type` (`notification_type`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_poll_results`
--

DROP TABLE IF EXISTS `user_poll_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_poll_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `poll_id` int(11) DEFAULT NULL,
  `student_id` int(50) DEFAULT NULL,
  `option_id` int(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `poll_id` (`poll_id`),
  KEY `student_id` (`student_id`),
  KEY `option_id` (`option_id`)
) ENGINE=InnoDB AUTO_INCREMENT=727382 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_questions`
--

DROP TABLE IF EXISTS `user_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_questions` (
  `uuid` varchar(150) NOT NULL,
  `question_id` varchar(150) DEFAULT NULL,
  `student_id` int(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `book` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `question` mediumtext NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `question_image` varchar(255) DEFAULT NULL,
  `ocr_done` int(11) DEFAULT '0',
  `ocr_text` text,
  `original_ocr_text` text,
  `matched_question` varchar(50) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_trial` tinyint(4) NOT NULL DEFAULT '0',
  `locale` varchar(50) DEFAULT 'en',
  `difficulty` tinyint(4) DEFAULT NULL,
  `wrong_image` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_processed` tinyint(1) NOT NULL DEFAULT '0',
  UNIQUE KEY `question_id` (`uuid`),
  KEY `original_question_id` (`question_id`),
  KEY `asked_at` (`created_at`),
  KEY `is_process` (`is_processed`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_questions_archive`
--

DROP TABLE IF EXISTS `user_questions_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_questions_archive` (
  `question_id` int(55) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `book` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `question` mediumtext NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `question_image` varchar(255) DEFAULT NULL,
  `is_allocated` varchar(255) NOT NULL DEFAULT '0',
  `allocated_to` varchar(55) NOT NULL DEFAULT '0',
  `allocation_time` varchar(255) DEFAULT NULL,
  `is_answered` int(55) NOT NULL DEFAULT '0',
  `is_text_answered` tinyint(4) DEFAULT '0',
  `ocr_done` int(11) DEFAULT '0',
  `ocr_text` text,
  `original_ocr_text` text,
  `matched_question` int(11) DEFAULT NULL,
  `question_credit` tinyint(4) NOT NULL DEFAULT '1',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_trial` tinyint(4) NOT NULL DEFAULT '0',
  `is_skipped` tinyint(4) NOT NULL DEFAULT '0',
  `parent_id` int(11) DEFAULT NULL,
  `incorrect_ocr` int(11) DEFAULT NULL,
  `skip_question` int(11) DEFAULT NULL,
  `locale` varchar(50) DEFAULT 'en',
  `difficulty` tinyint(4) DEFAULT NULL,
  `is_community` tinyint(1) NOT NULL DEFAULT '0',
  `matched_app_questions` tinyint(1) DEFAULT NULL,
  `wrong_image` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`question_id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_questions_community`
--

DROP TABLE IF EXISTS `user_questions_community`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_questions_community` (
  `question_id` varchar(150) DEFAULT NULL,
  `asked_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_processed` tinyint(1) NOT NULL DEFAULT '0',
  UNIQUE KEY `question_id` (`question_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_questions_final`
--

DROP TABLE IF EXISTS `user_questions_final`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_questions_final` (
  `question_id` varchar(255) NOT NULL,
  `student_id` int(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `book` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `question` mediumtext NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `question_image` varchar(255) DEFAULT NULL,
  `is_allocated` varchar(255) NOT NULL DEFAULT '0',
  `allocated_to` varchar(55) NOT NULL DEFAULT '0',
  `allocation_time` varchar(255) DEFAULT NULL,
  `is_answered` int(55) NOT NULL DEFAULT '0',
  `is_text_answered` tinyint(4) DEFAULT '0',
  `ocr_done` int(11) DEFAULT '0',
  `ocr_text` text,
  `original_ocr_text` text,
  `matched_question` int(11) DEFAULT NULL,
  `question_credit` tinyint(4) NOT NULL DEFAULT '1',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_trial` tinyint(4) NOT NULL DEFAULT '0',
  `is_skipped` tinyint(4) NOT NULL DEFAULT '0',
  `parent_id` int(11) DEFAULT NULL,
  `incorrect_ocr` int(11) DEFAULT NULL,
  `skip_question` int(11) DEFAULT NULL,
  `locale` varchar(50) DEFAULT 'en',
  `difficulty` tinyint(4) DEFAULT NULL,
  `is_community` tinyint(1) NOT NULL DEFAULT '0',
  `matched_app_questions` tinyint(1) DEFAULT NULL,
  `wrong_image` tinyint(4) NOT NULL DEFAULT '0',
  `uuid` varchar(150) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`),
  KEY `student_id` (`student_id`),
  KEY `doubt` (`doubt`),
  KEY `class` (`class`),
  KEY `timestamp` (`timestamp`),
  KEY `matched_app_questions` (`matched_app_questions`),
  KEY `udid` (`uuid`),
  KEY `is_community` (`is_community`),
  KEY `question_image` (`question_image`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_questions_init`
--

DROP TABLE IF EXISTS `user_questions_init`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_questions_init` (
  `uuid` varchar(150) NOT NULL,
  `question_id` varchar(150) DEFAULT NULL,
  `student_id` varchar(150) DEFAULT NULL,
  `class` int(25) DEFAULT NULL,
  `subject` varchar(150) DEFAULT NULL,
  `book` varchar(150) DEFAULT NULL,
  `chapter` varchar(150) DEFAULT NULL,
  `question` varchar(150) DEFAULT NULL,
  `doubt` varchar(150) DEFAULT NULL,
  `locale` varchar(150) DEFAULT NULL,
  `asked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_processed` tinyint(1) NOT NULL DEFAULT '0',
  UNIQUE KEY `question_id` (`uuid`),
  KEY `student_id` (`student_id`),
  KEY `class` (`class`),
  KEY `doubt` (`doubt`),
  KEY `created_at` (`created_at`),
  KEY `original_question_id` (`question_id`),
  KEY `asked_at` (`asked_at`),
  KEY `is_processed` (`is_processed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_questions_matched`
--

DROP TABLE IF EXISTS `user_questions_matched`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_questions_matched` (
  `question_id` varchar(150) DEFAULT NULL,
  `matched_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_processed` tinyint(1) NOT NULL DEFAULT '0',
  UNIQUE KEY `question_id_2` (`question_id`),
  KEY `created_at` (`created_at`),
  KEY `is_processed` (`is_processed`),
  KEY `matched_at` (`matched_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_questions_web`
--

DROP TABLE IF EXISTS `user_questions_web`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_questions_web` (
  `question_id` int(55) NOT NULL,
  `student_id` int(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `book` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `doubt` varchar(255) NOT NULL,
  `question_image` varchar(255) DEFAULT NULL,
  `ocr_text` text,
  `original_ocr_text` text,
  `full_ocr_url` varchar(1000) DEFAULT NULL,
  `ocr_url` varchar(100) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `locale` varchar(50) DEFAULT 'en',
  `duplicate` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`),
  UNIQUE KEY `full_ocr_url` (`full_ocr_url`),
  KEY `ocr_url` (`ocr_url`),
  KEY `created_at` (`created_at`),
  KEY `duplicate` (`duplicate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_sessions` (
  `session_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `udid` varchar(255) DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `location` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`session_id`),
  KEY `udid` (`udid`)
) ENGINE=InnoDB AUTO_INCREMENT=2181397 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_unsubscribe_posts`
--

DROP TABLE IF EXISTS `user_unsubscribe_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_unsubscribe_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_id` varchar(50) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `student_id` int(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `entity_id` (`entity_id`,`entity_type`,`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1755144 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int(255) NOT NULL AUTO_INCREMENT,
  `gcm_reg_id` text,
  `iphone_device_token` text,
  `username` varchar(255) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `user_status` varchar(255) NOT NULL,
  `user_role` enum('student','parent','instructor','admin') NOT NULL,
  `profile_id` enum('student_id','instructor_id','admin_id','parent_id') NOT NULL,
  `reset_code` varchar(255) NOT NULL,
  `last_login_timestamp` varchar(255) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `device_type` varchar(255) NOT NULL,
  `is_online` int(11) NOT NULL,
  `user_class` varchar(255) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `variants`
--

DROP TABLE IF EXISTS `variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `variants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_id` int(11) DEFAULT NULL,
  `base_price` int(11) DEFAULT NULL,
  `display_price` int(11) DEFAULT NULL,
  `previous_package_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `master_parent_variant_id` int(11) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT NULL,
  `is_show` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `is_show_panel` tinyint(1) DEFAULT '1',
  `flagr_variant_id` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index2` (`previous_package_id`,`is_show`,`is_active`,`is_default`),
  KEY `variants_package_id_IDX` (`package_id`) USING BTREE,
  KEY `variants_master_parent_variant_id_IDX` (`master_parent_variant_id`) USING BTREE,
  KEY `variants_is_default_IDX` (`is_default`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=410351 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `variants_bk`
--

DROP TABLE IF EXISTS `variants_bk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `variants_bk` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_id` int(11) DEFAULT NULL,
  `base_price` int(11) DEFAULT NULL,
  `display_price` int(11) DEFAULT NULL,
  `previous_package_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `master_parent_variant_id` int(11) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT NULL,
  `is_show` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `previous_package_id` (`previous_package_id`),
  KEY `is_show` (`is_show`),
  KEY `package_id` (`package_id`),
  KEY `is_default` (`is_default`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=11081 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `variants_v2`
--

DROP TABLE IF EXISTS `variants_v2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `variants_v2` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_id` int(11) DEFAULT NULL,
  `base_price` int(11) DEFAULT NULL,
  `display_price` int(11) DEFAULT NULL,
  `previous_package_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `master_parent_variant_id` int(11) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT NULL,
  `is_show` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6833 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vendor_expert_rules`
--

DROP TABLE IF EXISTS `vendor_expert_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendor_expert_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expert_id` varchar(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `target_group` varchar(255) NOT NULL,
  `package_language` varchar(255) NOT NULL,
  `video_language` varchar(255) NOT NULL,
  `student_id` int(255) NOT NULL,
  `book` varchar(255) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `is_active` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13016 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vendor_expert_skipped_questions`
--

DROP TABLE IF EXISTS `vendor_expert_skipped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendor_expert_skipped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(55) NOT NULL,
  `expert_id` int(55) NOT NULL,
  `is_skipped` tinyint(4) NOT NULL DEFAULT '0',
  `skipped_reason` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1854130 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendors` (
  `vendor_id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_fname` varchar(255) NOT NULL,
  `vendor_lname` varchar(255) NOT NULL,
  `vendor_dob` varchar(10) DEFAULT NULL,
  `vendor_phn_number` varchar(10) DEFAULT NULL,
  `vendor_title` varchar(255) NOT NULL,
  `vendor_email` varchar(255) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `vendor_role` enum('aspirant','student','teacher','expert','alumini') NOT NULL,
  `facebook_id` varchar(255) NOT NULL,
  `twitter_id` varchar(255) NOT NULL,
  `vendor_profile_image` varchar(255) DEFAULT NULL,
  `reset_code` varchar(255) NOT NULL,
  `vendor_status` enum('active','inactive') NOT NULL,
  `last_login` varchar(255) NOT NULL,
  `is_approve` int(11) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `version_code_mapping`
--

DROP TABLE IF EXISTS `version_code_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `version_code_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_version` varchar(20) NOT NULL,
  `version_code` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=231 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vertical_image_wha`
--

DROP TABLE IF EXISTS `vertical_image_wha`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vertical_image_wha` (
  `question_id` int(11) NOT NULL,
  `question_image` varchar(20) DEFAULT NULL,
  `90_url` varchar(50) DEFAULT NULL,
  `270_url` varchar(50) DEFAULT NULL,
  `90_ocr2` text,
  `270_ocr2` text,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_ads`
--

DROP TABLE IF EXISTS `video_ads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_ads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` varchar(11) NOT NULL,
  `ad_description` text NOT NULL,
  `ad_video` varchar(255) NOT NULL,
  `ad_type` varchar(10) NOT NULL,
  `created_at` timestamp NOT NULL,
  `is_active` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `ad_type` (`ad_type`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_download`
--

DROP TABLE IF EXISTS `video_download`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_download` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `is_delete` tinyint(4) NOT NULL DEFAULT '0',
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_id` (`question_id`,`answer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_farm`
--

DROP TABLE IF EXISTS `video_farm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_farm` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(45) DEFAULT NULL,
  `input_path` varchar(500) NOT NULL,
  `command` varchar(500) NOT NULL,
  `output_path` varchar(500) DEFAULT NULL,
  `status` varchar(45) DEFAULT 'QC',
  `bucket_name` varchar(100) NOT NULL,
  `priority` int(1) NOT NULL,
  `ref_meta` varchar(500) DEFAULT NULL,
  `language` varchar(45) DEFAULT NULL,
  `file_name` varchar(100) DEFAULT NULL,
  `content_id` varchar(100) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `v_f_status_idx` (`status`),
  KEY `input_path` (`input_path`)
) ENGINE=InnoDB AUTO_INCREMENT=1468288 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_feature`
--

DROP TABLE IF EXISTS `video_feature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_feature` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  `answer_id` int(11) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `resource_reference` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resource_meta` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `answer_id` (`answer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_homepage_ad`
--

DROP TABLE IF EXISTS `video_homepage_ad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_homepage_ad` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ccm_id` varchar(200) DEFAULT NULL,
  `language` varchar(10) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `link` varchar(200) NOT NULL,
  `deeplink` varchar(200) DEFAULT NULL,
  `duration` int(5) DEFAULT NULL,
  `video_order` int(11) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(45) NOT NULL DEFAULT 'system',
  `thumbnail_img` varchar(200) DEFAULT NULL,
  `min_version` smallint(6) NOT NULL DEFAULT '700',
  `max_version` smallint(6) NOT NULL DEFAULT '1000',
  `flagr_variant` smallint(6) NOT NULL DEFAULT '-1',
  `user_days` smallint(6) NOT NULL DEFAULT '-1',
  `page` varchar(100) DEFAULT 'HOMEPAGE',
  PRIMARY KEY (`id`),
  KEY `vha_ccm_id_idx` (`ccm_id`),
  KEY `vha_language_idx` (`language`),
  KEY `vha_is_active_idx` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=1797 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_recommendation`
--

DROP TABLE IF EXISTS `video_recommendation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_recommendation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ccm_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `referred_answer_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `question_id` (`answer_id`),
  KEY `ccm_id` (`ccm_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1265723 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_summary_image`
--

DROP TABLE IF EXISTS `video_summary_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_summary_image` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `image_url` varchar(200) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5619 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_view_logs`
--

DROP TABLE IF EXISTS `video_view_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_view_logs` (
  `view_id` int(25) DEFAULT NULL,
  `student_id` int(25) NOT NULL,
  `question_id` int(25) DEFAULT NULL,
  `answer_id` int(25) DEFAULT NULL,
  `answer_video` varchar(128) DEFAULT NULL,
  `video_time` int(128) NOT NULL,
  `engage_time` bigint(255) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `parent_id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL DEFAULT '0',
  `tab_id` varchar(50) DEFAULT '0',
  `is_back` tinyint(1) DEFAULT NULL,
  `ip_address` varchar(25) DEFAULT NULL,
  `source` varchar(25) NOT NULL DEFAULT '0',
  `refer_id` varchar(125) NOT NULL DEFAULT '0',
  `view_from` varchar(50) DEFAULT NULL,
  `referred_st_id` int(11) NOT NULL DEFAULT '0',
  `uuid` varchar(36) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `question_uuid` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`uuid`),
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`),
  KEY `view_id` (`view_id`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_view_stats`
--

DROP TABLE IF EXISTS `video_view_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_view_stats` (
  `view_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(25) NOT NULL,
  `question_id` int(25) NOT NULL,
  `answer_id` int(25) NOT NULL,
  `answer_video` varchar(128) NOT NULL,
  `video_time` int(128) NOT NULL,
  `engage_time` bigint(255) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `parent_id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL DEFAULT '0',
  `tab_id` varchar(50) DEFAULT '0',
  `is_back` tinyint(1) NOT NULL,
  `ip_address` varchar(25) DEFAULT NULL,
  `source` varchar(25) NOT NULL DEFAULT '0',
  `refer_id` varchar(125) NOT NULL DEFAULT '0',
  `view_from` varchar(50) DEFAULT NULL,
  `referred_st_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`view_id`),
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`),
  KEY `answer_id` (`answer_id`),
  KEY `engage_time` (`engage_time`),
  KEY `refer_id` (`refer_id`),
  KEY `view_from` (`view_from`),
  KEY `created_at` (`created_at`),
  KEY `parent_id` (`parent_id`),
  KEY `source` (`source`),
  KEY `compund_slow` (`is_back`,`source`,`student_id`),
  KEY `is_back_2` (`is_back`,`refer_id`),
  KEY `idx_updated_at` (`updated_at`),
  KEY `idx_source_created_at` (`source`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2386031740 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_view_stats_archive`
--

DROP TABLE IF EXISTS `video_view_stats_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_view_stats_archive` (
  `view_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `student_id` int(25) NOT NULL,
  `question_id` int(25) NOT NULL,
  `answer_id` int(25) NOT NULL,
  `answer_video` varchar(128) NOT NULL,
  `video_time` int(128) NOT NULL,
  `engage_time` bigint(255) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `parent_id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL DEFAULT '0',
  `tab_id` varchar(50) DEFAULT '0',
  `is_back` tinyint(1) NOT NULL,
  `ip_address` varchar(25) DEFAULT NULL,
  `source` varchar(25) NOT NULL DEFAULT '0',
  `refer_id` varchar(125) NOT NULL DEFAULT '0',
  `view_from` varchar(50) DEFAULT NULL,
  `referred_st_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`view_id`),
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`),
  KEY `answer_id` (`answer_id`),
  KEY `engage_time` (`engage_time`),
  KEY `refer_id` (`refer_id`),
  KEY `view_from` (`view_from`),
  KEY `created_at` (`created_at`),
  KEY `parent_id` (`parent_id`),
  KEY `source` (`source`),
  KEY `compund_slow` (`is_back`,`source`,`student_id`),
  KEY `is_back_2` (`is_back`,`refer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2054430366 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_view_stats_archive_v1`
--

DROP TABLE IF EXISTS `video_view_stats_archive_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_view_stats_archive_v1` (
  `view_id` int(11) NOT NULL DEFAULT '0',
  `student_id` int(25) NOT NULL,
  `question_id` int(25) NOT NULL,
  `answer_id` int(25) NOT NULL,
  `answer_video` varchar(128) NOT NULL,
  `video_time` int(128) NOT NULL,
  `engage_time` bigint(255) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `parent_id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL DEFAULT '0',
  `tab_id` varchar(50) DEFAULT '0',
  `is_back` tinyint(1) NOT NULL,
  `ip_address` varchar(25) DEFAULT NULL,
  `source` varchar(25) NOT NULL DEFAULT '0',
  `refer_id` varchar(125) NOT NULL DEFAULT '0',
  `view_from` varchar(50) DEFAULT NULL,
  `referred_st_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`view_id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video_view_stats_temp_v1`
--

DROP TABLE IF EXISTS `video_view_stats_temp_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `video_view_stats_temp_v1` (
  `view_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) DEFAULT NULL,
  `student_id` int(25) NOT NULL,
  `question_id` int(25) NOT NULL,
  `answer_id` int(25) NOT NULL,
  `answer_video` varchar(128) NOT NULL,
  `video_time` int(128) NOT NULL,
  `engage_time` bigint(255) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `parent_id` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL DEFAULT '0',
  `tab_id` varchar(50) DEFAULT '0',
  `is_back` tinyint(1) NOT NULL,
  `ip_address` varchar(25) DEFAULT NULL,
  `source` varchar(25) NOT NULL DEFAULT '0',
  `refer_id` varchar(125) NOT NULL DEFAULT '0',
  `view_from` varchar(50) DEFAULT NULL,
  `referred_st_id` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`view_id`),
  KEY `student_id` (`student_id`),
  KEY `uuid` (`uuid`),
  KEY `question_id` (`question_id`),
  KEY `answer_id` (`answer_id`),
  KEY `engage_time` (`engage_time`),
  KEY `refer_id` (`refer_id`),
  KEY `view_from` (`view_from`),
  KEY `created_at` (`created_at`),
  KEY `parent_id` (`parent_id`),
  KEY `source` (`source`),
  KEY `compund_slow` (`is_back`,`source`,`student_id`),
  KEY `is_back_2` (`is_back`,`refer_id`),
  KEY `idx_updated_at` (`updated_at`),
  KEY `idx_source_created_at` (`source`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `view_download_stats`
--

DROP TABLE IF EXISTS `view_download_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `view_download_stats` (
  `view_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `what_done` tinyint(4) NOT NULL,
  `question_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `answer_video` varchar(128) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`view_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2053072 DEFAULT CHARSET=latin1 COMMENT='Table to store stats';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `view_download_stats_new`
--

DROP TABLE IF EXISTS `view_download_stats_new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `view_download_stats_new` (
  `view_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `what_done` tinyint(4) NOT NULL,
  `question_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `answer_video` varchar(128) NOT NULL,
  `video_time` varchar(128) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `parent_id` int(11) DEFAULT NULL,
  `is_duplicate` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`view_id`),
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`),
  KEY `answer_id` (`answer_id`),
  KEY `created_at` (`created_at`),
  KEY `is_duplicate` (`is_duplicate`)
) ENGINE=InnoDB AUTO_INCREMENT=2181051 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `viral_videos_split`
--

DROP TABLE IF EXISTS `viral_videos_split`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `viral_videos_split` (
  `question_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  KEY `question_id` (`question_id`,`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vls_schedule`
--

DROP TABLE IF EXISTS `vls_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vls_schedule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `chapter` varchar(255) NOT NULL,
  `subtopics` varchar(255) NOT NULL,
  `duration` int(11) NOT NULL,
  `date_of_delivery` datetime NOT NULL,
  `slot_of_delivery` varchar(255) NOT NULL,
  `date_of_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `question_id` int(11) DEFAULT NULL,
  `applink` varchar(255) DEFAULT NULL,
  `facebook` varchar(255) DEFAULT NULL,
  `youtube` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(255) DEFAULT NULL,
  `yt_description` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=212 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vmc_chapter_resources`
--

DROP TABLE IF EXISTS `vmc_chapter_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vmc_chapter_resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chapter_id` int(11) DEFAULT NULL,
  `resource_type` varchar(10) NOT NULL,
  `resource_name` text NOT NULL,
  `resource_location` varchar(500) NOT NULL,
  `is_available` int(11) DEFAULT '1',
  `temp_location` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1776 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vmc_vod_filename`
--

DROP TABLE IF EXISTS `vmc_vod_filename`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vmc_vod_filename` (
  `file_name` varchar(1000) NOT NULL,
  `output_path` varchar(1000) DEFAULT NULL,
  `content_id` varchar(50) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  PRIMARY KEY (`file_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vod_chapter_mapping`
--

DROP TABLE IF EXISTS `vod_chapter_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vod_chapter_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `subject` varchar(45) NOT NULL,
  `state` varchar(45) NOT NULL,
  `language` varchar(45) NOT NULL,
  `book` varchar(45) NOT NULL,
  `chapter` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `chapter_order` int(11) NOT NULL,
  `sub_subject` varchar(255) DEFAULT NULL,
  `type` enum('GEN') NOT NULL,
  `mc_id` int(11) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `is_deleted` tinyint(4) NOT NULL DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chapter` (`chapter`),
  KEY `class` (`class`)
) ENGINE=InnoDB AUTO_INCREMENT=14454 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vod_class_subject_course_mapping`
--

DROP TABLE IF EXISTS `vod_class_subject_course_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vod_class_subject_course_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` int(11) NOT NULL,
  `language` varchar(45) NOT NULL,
  `subject` varchar(45) NOT NULL,
  `course_id` int(11) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `state` varchar(255) NOT NULL,
  `assortment_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vod_class_subject_course_mapping_assortment_id_IDX` (`assortment_id`) USING BTREE,
  KEY `subject` (`subject`) USING BTREE,
  KEY `class` (`class`) USING BTREE,
  KEY `language` (`language`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=12603 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vod_schedule`
--

DROP TABLE IF EXISTS `vod_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vod_schedule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `faculty_id` int(11) NOT NULL,
  `subject` varchar(50) NOT NULL,
  `class` varchar(50) NOT NULL,
  `state` varchar(50) NOT NULL,
  `is_free` tinyint(4) NOT NULL DEFAULT '0',
  `course_type` enum('FREE','PAID') NOT NULL,
  `master_chapter` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `live_at` datetime DEFAULT NULL,
  `description` varchar(1000) CHARACTER SET utf8mb4 NOT NULL,
  `question_id` int(11) NOT NULL,
  `is_video_processed` tinyint(11) NOT NULL DEFAULT '0',
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  `is_deleted` tinyint(4) NOT NULL DEFAULT '0',
  `is_processed` tinyint(4) NOT NULL DEFAULT '0',
  `is_resource_created` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `language` varchar(45) DEFAULT NULL,
  `is_reused` tinyint(4) NOT NULL DEFAULT '0',
  `batch_id` tinyint(4) NOT NULL DEFAULT '1',
  `lecture_no` int(11) DEFAULT NULL,
  `lecture_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29920 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vod_schedule_multiple_state_map`
--

DROP TABLE IF EXISTS `vod_schedule_multiple_state_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vod_schedule_multiple_state_map` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) NOT NULL,
  `state` varchar(45) NOT NULL,
  `language` varchar(45) NOT NULL,
  `is_deleted` varchar(45) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5971 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vod_schedule_notes`
--

DROP TABLE IF EXISTS `vod_schedule_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vod_schedule_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vod_schedule_id` int(11) NOT NULL,
  `notes_type` varchar(255) NOT NULL,
  `notes_link` varchar(255) NOT NULL,
  `is_processed` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vod_schedule_topic_mapping`
--

DROP TABLE IF EXISTS `vod_schedule_topic_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vod_schedule_topic_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `topic` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `visibility_timestamp` int(11) NOT NULL,
  `topic_playlist_id` int(11) NOT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT '0',
  `duration` int(11) DEFAULT NULL,
  `vod_schedule_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=67316 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vod_schedule_video_mapping`
--

DROP TABLE IF EXISTS `vod_schedule_video_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vod_schedule_video_mapping` (
  `id` int(255) NOT NULL AUTO_INCREMENT,
  `faculty_url` varchar(255) DEFAULT NULL,
  `editor_url` varchar(255) DEFAULT NULL,
  `edited_by` int(255) DEFAULT NULL,
  `is_qualified` int(11) NOT NULL,
  `vod_schedule_id` int(11) NOT NULL,
  `studio_no` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vod_schedule_widget_mapping`
--

DROP TABLE IF EXISTS `vod_schedule_widget_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vod_schedule_widget_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `widget_type` enum('QUIZ','POLL','BROADCAST') NOT NULL,
  `widget_data` varchar(500) NOT NULL,
  `widget_meta` varchar(500) NOT NULL,
  `visibility_timestamp` int(11) NOT NULL,
  `is_deleted` tinyint(4) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `vod_schedule_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36637 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voice_search_ocrs`
--

DROP TABLE IF EXISTS `voice_search_ocrs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `voice_search_ocrs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(255) NOT NULL,
  `ocr_text` text NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10588552 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voice_search_questions`
--

DROP TABLE IF EXISTS `voice_search_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `voice_search_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(255) NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=828076 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wa_retention_old`
--

DROP TABLE IF EXISTS `wa_retention_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wa_retention_old` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mobile` varchar(20) NOT NULL,
  `question_count` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mobile` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=17924 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wallet_credit_students_experiment`
--

DROP TABLE IF EXISTS `wallet_credit_students_experiment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wallet_credit_students_experiment` (
  `student_id` int(11) NOT NULL,
  UNIQUE KEY `student_id_UNIQUE` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wallet_summary`
--

DROP TABLE IF EXISTS `wallet_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wallet_summary` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `cash_amount` decimal(10,2) DEFAULT '0.00',
  `reward_amount` decimal(10,2) DEFAULT '0.00',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id_UNIQUE` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2242327 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wallet_summary_recon`
--

DROP TABLE IF EXISTS `wallet_summary_recon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wallet_summary_recon` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `status` varchar(45) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id_UNIQUE` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1552565 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wallet_transaction`
--

DROP TABLE IF EXISTS `wallet_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wallet_transaction` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `cash_amount` decimal(10,2) DEFAULT '0.00',
  `reward_amount` decimal(10,2) DEFAULT '0.00',
  `cash_balance_post_transaction` decimal(10,2) DEFAULT NULL,
  `reward_balance_post_transaction` decimal(10,2) DEFAULT NULL,
  `balance_post_transaction` decimal(10,2) DEFAULT NULL,
  `type` enum('CREDIT','DEBIT') NOT NULL,
  `reason` varchar(45) DEFAULT NULL,
  `payment_info_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expiry` datetime DEFAULT NULL,
  `reason_ref_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `wt_sid_idx` (`student_id`),
  KEY `wt_reason_idx` (`reason`),
  KEY `wt_pid_idx` (`payment_info_id`),
  KEY `wt_expiry_idx` (`expiry`),
  KEY `wt_reason_ref_idx` (`reason_ref_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3411162 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wallet_transaction_expiry`
--

DROP TABLE IF EXISTS `wallet_transaction_expiry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wallet_transaction_expiry` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wallet_transaction_id` int(11) NOT NULL,
  `amount_left` decimal(10,2) DEFAULT NULL,
  `status` enum('ACTIVE','USED','EXPIRED') DEFAULT 'ACTIVE',
  `wallet_transaction_ref_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `wte_wt_id_idx` (`wallet_transaction_id`),
  KEY `wte_status_idx` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=657745 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web2app_analytics`
--

DROP TABLE IF EXISTS `web2app_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web2app_analytics` (
  `id` bigint(20) NOT NULL,
  `qid` int(11) NOT NULL,
  `platform` mediumtext NOT NULL,
  `download_date` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_activity`
--

DROP TABLE IF EXISTS `web_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_activity` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` bigint(20) NOT NULL,
  `type` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `type` (`type`),
  KEY `idx_combo` (`question_id`,`type`)
) ENGINE=InnoDB AUTO_INCREMENT=229953106 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_analytics`
--

DROP TABLE IF EXISTS `web_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_analytics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `event` varchar(100) DEFAULT NULL,
  `page_url` varchar(300) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `platform` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `FK_web_analytics_question_id` (`question_id`),
  CONSTRAINT `FK_web_analytics_question_id` FOREIGN KEY (`question_id`) REFERENCES `questions` (`question_id`),
  CONSTRAINT `web_analytics_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=188774555 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_carousels`
--

DROP TABLE IF EXISTS `web_carousels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_carousels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `carousel_name` varchar(100) DEFAULT NULL,
  `slide_question_1` int(11) DEFAULT NULL,
  `slide_question_2` int(11) DEFAULT NULL,
  `slide_question_3` int(11) DEFAULT NULL,
  `slide_question_4` int(11) DEFAULT NULL,
  `slide_question_5` int(11) DEFAULT NULL,
  `slide_question_6` int(11) DEFAULT NULL,
  `slide_question_7` int(11) DEFAULT NULL,
  `slide_question_8` int(11) DEFAULT NULL,
  `slide_question_9` int(11) DEFAULT NULL,
  `slide_question_10` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_clutchprep`
--

DROP TABLE IF EXISTS `web_clutchprep`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_clutchprep` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(4500) DEFAULT NULL,
  `answer` varchar(200) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `canonical_url` varchar(500) DEFAULT NULL,
  `scraped_from` varchar(75) DEFAULT NULL,
  `source_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=171037 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_content_users`
--

DROP TABLE IF EXISTS `web_content_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_content_users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(50) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_download_request`
--

DROP TABLE IF EXISTS `web_download_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_download_request` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contact` varchar(20) DEFAULT NULL,
  `question_id` int(15) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14164 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_external_question_rating`
--

DROP TABLE IF EXISTS `web_external_question_rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_external_question_rating` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `qid` int(11) NOT NULL,
  `gcm_id` mediumtext NOT NULL,
  `rating` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=279225 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_external_source`
--

DROP TABLE IF EXISTS `web_external_source`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_external_source` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_external_text_answers`
--

DROP TABLE IF EXISTS `web_external_text_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_external_text_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_question_id` int(11) NOT NULL,
  `answers` varchar(255) NOT NULL,
  `question_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_forum_topic`
--

DROP TABLE IF EXISTS `web_forum_topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_forum_topic` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` longtext NOT NULL,
  `content` longtext NOT NULL,
  `cat_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1601 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_forum_user`
--

DROP TABLE IF EXISTS `web_forum_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_forum_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_hien_ocr`
--

DROP TABLE IF EXISTS `web_hien_ocr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_hien_ocr` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_id` varchar(50) DEFAULT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `ocr_text_hi` varchar(200) DEFAULT NULL,
  `ocr_text_hi_en` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_source_id` (`source_id`)
) ENGINE=InnoDB AUTO_INCREMENT=957515 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_image_answers`
--

DROP TABLE IF EXISTS `web_image_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_image_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `answer_img_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `web_image_answers_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_img_questions`
--

DROP TABLE IF EXISTS `web_img_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_img_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(2000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1253591 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_imp_chapters_questions`
--

DROP TABLE IF EXISTS `web_imp_chapters_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_imp_chapters_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class` varchar(10) DEFAULT NULL,
  `subject` varchar(25) DEFAULT NULL,
  `chapter` varchar(200) DEFAULT NULL,
  `chapter_hi` varchar(200) DEFAULT NULL,
  `question_id` int(11) NOT NULL,
  `ocr_text` longtext,
  `ocr_text_hi` longtext,
  `total_views` int(11) DEFAULT '0',
  `url_text` varchar(255) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `class` (`class`),
  KEY `subject` (`subject`),
  KEY `chapter` (`chapter`),
  CONSTRAINT `web_imp_chapters_questions_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions_web` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=117569 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_noindex`
--

DROP TABLE IF EXISTS `web_noindex`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_noindex` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `event` varchar(100) DEFAULT NULL,
  `page_url` varchar(300) DEFAULT NULL,
  `question_id` int(11) NOT NULL,
  `platform` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `web_noindex_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=58946455 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_payment_info`
--

DROP TABLE IF EXISTS `web_payment_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_payment_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `order_id` varchar(200) NOT NULL,
  `partner_order_id` varchar(45) DEFAULT NULL,
  `student_id` int(11) NOT NULL,
  `amount` decimal(10,2) DEFAULT '0.00',
  `payment_for` varchar(45) NOT NULL,
  `payment_for_id` varchar(45) DEFAULT NULL,
  `status` varchar(45) NOT NULL,
  `partner_txn_id` varchar(200) DEFAULT NULL,
  `partner_txn_response` text,
  `source` varchar(45) DEFAULT NULL,
  `mode` varchar(45) DEFAULT NULL,
  `updated_by` varchar(45) NOT NULL DEFAULT 'system',
  PRIMARY KEY (`id`),
  KEY `pi_order_idx` (`order_id`),
  KEY `pi_student_id_idx` (`student_id`),
  KEY `pi_partner_order_id_idx` (`partner_order_id`),
  KEY `pi_status_idx` (`status`),
  KEY `pi_partner_txn_id_idx` (`partner_txn_id`),
  KEY `pi_source_idx` (`source`),
  KEY `pi_amount_idx` (`amount`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_payments`
--

DROP TABLE IF EXISTS `web_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(15) NOT NULL,
  `order_id` varchar(30) DEFAULT NULL,
  `payment_id` varchar(30) DEFAULT NULL,
  `payment_source` varchar(45) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=295 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_physics_dictionary`
--

DROP TABLE IF EXISTS `web_physics_dictionary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_physics_dictionary` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `word` varchar(100) DEFAULT NULL,
  `meaning` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1143 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_qa_pv`
--

DROP TABLE IF EXISTS `web_qa_pv`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_qa_pv` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `event` varchar(100) DEFAULT NULL,
  `page_url` varchar(300) DEFAULT NULL,
  `question_id` int(11) NOT NULL,
  `subject` varchar(25) DEFAULT NULL,
  `is_answered` int(55) NOT NULL DEFAULT '0',
  `is_text_answered` tinyint(4) DEFAULT '0',
  `platform` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=257294883 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_question_url`
--

DROP TABLE IF EXISTS `web_question_url`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_question_url` (
  `question_id` int(11) NOT NULL,
  `url_text` varchar(255) NOT NULL,
  `matched_question_id` int(11) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`question_id`),
  KEY `url_text` (`url_text`),
  KEY `canonical_url` (`canonical_url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_reviews`
--

DROP TABLE IF EXISTS `web_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(100) DEFAULT NULL,
  `rating` int(2) NOT NULL,
  `review_text` varchar(500) DEFAULT NULL,
  `review_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=141574 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_scrapped_answers`
--

DROP TABLE IF EXISTS `web_scrapped_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_scrapped_answers` (
  `answer_id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` varchar(50) DEFAULT NULL,
  `answer` varchar(800) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`answer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_scrapped_questions`
--

DROP TABLE IF EXISTS `web_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(200) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `source_id` varchar(50) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `source_id` (`source_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10789926 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_student_mapping`
--

DROP TABLE IF EXISTS `web_student_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_student_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mobile` bigint(20) NOT NULL,
  `web_student_id` int(11) DEFAULT NULL,
  `app_student_id` int(11) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile_2` (`mobile`),
  KEY `web_student_id` (`web_student_id`),
  KEY `app_student_id` (`app_student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=46803 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_students`
--

DROP TABLE IF EXISTS `web_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `udid` mediumtext NOT NULL,
  `gcm` mediumtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=142473 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_subjects`
--

DROP TABLE IF EXISTS `web_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_subscription_request`
--

DROP TABLE IF EXISTS `web_subscription_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_subscription_request` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contact` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2027 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_test_cleaning`
--

DROP TABLE IF EXISTS `web_test_cleaning`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_test_cleaning` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(200) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `source_id` varchar(50) DEFAULT NULL,
  `canonical_url` varchar(200) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `source_id` (`source_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19925 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_url_content`
--

DROP TABLE IF EXISTS `web_url_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_url_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` longtext NOT NULL,
  `url` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `url` (`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_url_content_sample_table`
--

DROP TABLE IF EXISTS `web_url_content_sample_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_url_content_sample_table` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` longtext NOT NULL,
  `url` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `url` (`url`)
) ENGINE=InnoDB AUTO_INCREMENT=1628 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_url_content_us_table`
--

DROP TABLE IF EXISTS `web_url_content_us_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_url_content_us_table` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` longtext NOT NULL,
  `url` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `url` (`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_video_comments`
--

DROP TABLE IF EXISTS `web_video_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_video_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comment` varchar(500) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_fname` varchar(255) DEFAULT NULL,
  `user_lname` varchar(255) DEFAULT NULL,
  `video_id` int(25) NOT NULL,
  `user_mobile` varchar(20) NOT NULL,
  `user_student_id` int(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=376 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `web_video_content`
--

DROP TABLE IF EXISTS `web_video_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `web_video_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` longtext NOT NULL,
  `question_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wha_students_mapping`
--

DROP TABLE IF EXISTS `wha_students_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wha_students_mapping` (
  `wha_student_id` int(11) NOT NULL DEFAULT '0',
  `ref_student_id` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `wha_ref_key` (`wha_student_id`,`ref_student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `whatsapp_campaign`
--

DROP TABLE IF EXISTS `whatsapp_campaign`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `whatsapp_campaign` (
  `id` int(25) NOT NULL AUTO_INCREMENT,
  `detail` varchar(400) NOT NULL,
  `img_url` varchar(200) DEFAULT NULL,
  `query` varchar(300) NOT NULL,
  `caption` varchar(1000) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `whatsapp_daily_quiz_contest_questions`
--

DROP TABLE IF EXISTS `whatsapp_daily_quiz_contest_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `whatsapp_daily_quiz_contest_questions` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `quiz_date` timestamp NOT NULL,
  `batch_id` tinyint(4) NOT NULL,
  `locale` enum('en','hi') NOT NULL DEFAULT 'en',
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `quiz_date` (`quiz_date`)
) ENGINE=InnoDB AUTO_INCREMENT=601 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `whatsapp_optins`
--

DROP TABLE IF EXISTS `whatsapp_optins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `whatsapp_optins` (
  `phone` varchar(20) DEFAULT NULL,
  `source` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=38020135 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `whatsapp_push`
--

DROP TABLE IF EXISTS `whatsapp_push`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `whatsapp_push` (
  `mobile_w` varchar(255) DEFAULT NULL,
  `WHO` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `whatsapp_rating`
--

DROP TABLE IF EXISTS `whatsapp_rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `whatsapp_rating` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `yes_no` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `feedback` longtext NOT NULL,
  `report` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=661150 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `whatsapp_share_stats`
--

DROP TABLE IF EXISTS `whatsapp_share_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `whatsapp_share_stats` (
  `id` int(25) NOT NULL AUTO_INCREMENT,
  `student_id` int(25) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(25) NOT NULL,
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18619155 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `whatsapp_students`
--

DROP TABLE IF EXISTS `whatsapp_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `whatsapp_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `mobile` varchar(50) DEFAULT NULL,
  `fingerprints` varchar(20) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `student_class` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `fingerprints` (`fingerprints`),
  KEY `timestamp` (`timestamp`),
  KEY `mobile` (`mobile`)
) ENGINE=InnoDB AUTO_INCREMENT=7800575 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wordpress_data`
--

DROP TABLE IF EXISTS `wordpress_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wordpress_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `aboutus` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `tnc` longtext,
  `privacy` longtext,
  `refunds` longtext,
  `contactus` longtext,
  `region` varchar(45) DEFAULT 'IN',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `youtube_fetched_data`
--

DROP TABLE IF EXISTS `youtube_fetched_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `youtube_fetched_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `video_url` varchar(1000) DEFAULT NULL,
  `title` varchar(1000) DEFAULT NULL,
  `subject` varchar(500) DEFAULT NULL,
  `channel_name` varchar(1000) DEFAULT NULL,
  `channel_url` varchar(1000) DEFAULT NULL,
  `channel_subscribers_count` varchar(500) DEFAULT NULL,
  `views` varchar(500) DEFAULT NULL,
  `likes` varchar(500) DEFAULT NULL,
  `dislikes` varchar(500) DEFAULT NULL,
  `publish_date` varchar(500) DEFAULT NULL,
  `canonical_url` varchar(1500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=153049 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `youtube_id_bk`
--

DROP TABLE IF EXISTS `youtube_id_bk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `youtube_id_bk` (
  `question_id` int(11) NOT NULL,
  `youtube_id` varchar(100) NOT NULL,
  PRIMARY KEY (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `youtube_links`
--

DROP TABLE IF EXISTS `youtube_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `youtube_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `link` varchar(500) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `youtube_qid`
--

DROP TABLE IF EXISTS `youtube_qid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `youtube_qid` (
  `qid_youtube` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `youtube_scrapped_questions`
--

DROP TABLE IF EXISTS `youtube_scrapped_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `youtube_scrapped_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ocr_text` varchar(1000) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `answer` varchar(500) DEFAULT NULL,
  `canonical_url` varchar(1600) DEFAULT NULL,
  `language` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64135 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `youtube_scrapped_views`
--

DROP TABLE IF EXISTS `youtube_scrapped_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `youtube_scrapped_views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `link` varchar(50) NOT NULL,
  `title` varchar(1000) NOT NULL,
  `views` varchar(50) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4303 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `youtube_uploads`
--

DROP TABLE IF EXISTS `youtube_uploads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `youtube_uploads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) DEFAULT NULL,
  `answer_id` int(11) DEFAULT NULL,
  `answer_video` varchar(255) DEFAULT NULL,
  `youtube_id` varchar(150) DEFAULT NULL,
  `yt_title` varchar(110) DEFAULT NULL,
  `yt_description` text CHARACTER SET utf8mb4,
  `privacy_status` varchar(45) DEFAULT NULL,
  `isIntroStitched` tinyint(4) DEFAULT '1',
  `skip_reason` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=341696 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `yt_20s_expt`
--

DROP TABLE IF EXISTS `yt_20s_expt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `yt_20s_expt` (
  `code` varchar(255) DEFAULT NULL,
  `answer_id` int(11) DEFAULT NULL,
  `answer_video` varchar(255) DEFAULT NULL,
  `youtube_id` varchar(255) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `new_youtube_id` varchar(255) DEFAULT NULL,
  `new_youtube_status` varchar(255) DEFAULT NULL,
  `old_youtube_status` varchar(255) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT NULL,
  `ocr_text` longtext,
  `yt_title` varchar(100) DEFAULT NULL,
  `yt_description` longtext,
  `yt_tag` varchar(450) DEFAULT NULL,
  `cut_time` time DEFAULT '00:00:35',
  `video_link` varchar(255) DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `answer_rating` int(11) DEFAULT NULL,
  `question` longtext,
  `shortLink` varchar(100) DEFAULT NULL,
  `branch_deep_link` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=320 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `yt_analytics_data`
--

DROP TABLE IF EXISTS `yt_analytics_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `yt_analytics_data` (
  `youtube_id` text NOT NULL,
  `view_date` text NOT NULL,
  `views` int(11) NOT NULL,
  `avg_view_duration` int(11) NOT NULL,
  `minutes_watched` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `yt_deeplinks`
--

DROP TABLE IF EXISTS `yt_deeplinks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `yt_deeplinks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date_c` int(11) NOT NULL,
  `video_sl` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `level` int(11) NOT NULL,
  `campaign_short_code` varchar(50) NOT NULL,
  `campaign_code` varchar(50) NOT NULL,
  `channel` varchar(100) NOT NULL,
  `feature` varchar(100) NOT NULL,
  `student_id` int(11) NOT NULL,
  `question_id` int(11) DEFAULT NULL,
  `og_title` varchar(200) DEFAULT NULL,
  `og_description` varchar(500) DEFAULT NULL,
  `og_image_url` varchar(500) DEFAULT NULL,
  `level_one` varchar(100) DEFAULT NULL,
  `level_two` varchar(100) DEFAULT NULL,
  `deeplink` varchar(200) DEFAULT NULL,
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1462 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `yt_id_update`
--

DROP TABLE IF EXISTS `yt_id_update`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `yt_id_update` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `answer_id` int(11) NOT NULL,
  `yt_url` varchar(28) NOT NULL,
  `yt_id` varchar(11) NOT NULL,
  `is_error` tinyint(4) NOT NULL DEFAULT '0',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`answer_id`),
  UNIQUE KEY `id` (`id`),
  KEY `answer_id` (`answer_id`,`yt_id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=151502 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `yt_old_playlists`
--

DROP TABLE IF EXISTS `yt_old_playlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `yt_old_playlists` (
  `playlist_id` varchar(255) NOT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `playlist_title` varchar(255) DEFAULT NULL,
  `playlist_description` text,
  `new_playlist_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1068 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `yt_playlist`
--

DROP TABLE IF EXISTS `yt_playlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `yt_playlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` mediumtext NOT NULL,
  `description` mediumtext NOT NULL,
  `playlist_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `yt_upload_completed_20200623`
--

DROP TABLE IF EXISTS `yt_upload_completed_20200623`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `yt_upload_completed_20200623` (
  `id` int(11) NOT NULL DEFAULT '0',
  `input_path` varchar(500) NOT NULL,
  `output_path` varchar(500) DEFAULT NULL,
  `bucket_name` varchar(100) NOT NULL,
  `language` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `input_path` (`input_path`),
  KEY `output_path` (`output_path`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `z_old_youtube_playlist`
--

DROP TABLE IF EXISTS `z_old_youtube_playlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `z_old_youtube_playlist` (
  `playlist_id` int(11) NOT NULL AUTO_INCREMENT,
  `playlist_title` varchar(100) NOT NULL,
  `playlist_description` varchar(500) DEFAULT NULL,
  `download_link` varchar(100) DEFAULT NULL,
  `youtube_playlist_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`playlist_id`)
) ENGINE=InnoDB AUTO_INCREMENT=716 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'classzoo1'
--

--
-- GTID state at the end of the backup
--

SET @@GLOBAL.GTID_PURGED='';
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-12-30 14:58:44
