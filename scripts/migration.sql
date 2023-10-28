# -- --------------------------------------------------------
#
# --
# -- Table structure for table `app_constants`
# --
#
# # CREATE TABLE `app_constants` (
# #   `id` int(11) NOT NULL,
# #   `constant_key` varchar(50) NOT NULL,
# #   `value` varchar(50) NOT NULL,
# #   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
# # ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
# #
# # -- --------------------------------------------------------
# #
# # -- add question_id in app_feedbacks_response
# # ALTER TABLE `app_feedbacks_response` ADD `question_id` VARCHAR(25) NULL DEFAULT NULL AFTER `feedback_id`, ADD INDEX (`question_id`);
#
# -- --------------------------------------------------------
# ALTER TABLE `community_questions_meta` CHANGE `chapter` `chapter` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
#
# ALTER TABLE `community_questions_meta` CHANGE `subtopic` `subtopic` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
#
#
# # --
# # -- Table structure for table `community_questions_meta`
# # --
# #
# # # CREATE TABLE `community_questions_meta` (
# # #   `id` int(255) NOT NULL,
# # #   `qid` int(255) NOT NULL,
# # #   `chapter` varchar(255) DEFAULT NULL,
# # #   `subtopic` varchar(255) DEFAULT NULL,
# # #   `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
# # # ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
# #
# # -- --------------------------------------------------------
# #
# # --
# # -- Table structure for table `community_questions_upvote`
# # --
# #
# # CREATE TABLE `community_questions_upvote` (
# #   `id` int(255) NOT NULL,
# #   `qid` int(255) NOT NULL,
# #   `voter_id` int(255) NOT NULL,
# #   `voted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
# # ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
# #
# # -- --------------------------------------------------------
# #
# #
# # -- --------------------------------------------------------
# #
# # --
# # -- Table structure for table `courses_new`
# # --
# #
# # CREATE TABLE `courses_new` (
# #   `id` int(11) NOT NULL,
# #   `class` varchar(20) DEFAULT NULL,
# #   `chapter` varchar(100) DEFAULT NULL,
# #   `type` varchar(100) DEFAULT NULL,
# #   `microcencepts_query` varchar(500) DEFAULT NULL,
# #   `free_questions_query` varchar(500) DEFAULT NULL,
# #   `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
# # ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
# #
# # -- --------------------------------------------------------
# #
# # --
# # -- Table structure for table `courses_package`
# # --
# #
# # CREATE TABLE `courses_package` (
# #   `id` int(11) NOT NULL,
# #   `no_of_courses` int(11) DEFAULT NULL,
# #   `class` varchar(20) DEFAULT NULL,
# #   `discount` varchar(50) DEFAULT NULL
# # ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
# #
# # -- --------------------------------------------------------
# #
# # --
# # -- Table structure for table `course_browse_history`
# # --
# #
# # CREATE TABLE `course_browse_history` (
# #   `id` int(11) NOT NULL,
# #   `student_id` varchar(200) NOT NULL,
# #   `class` varchar(100) NOT NULL,
# #   `course` varchar(400) NOT NULL,
# #   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
# # ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
# #
# # -- --------------------------------------------------------
# #
# # -- --------------------------------------------------------
# #
# # --
# # -- Table structure for table `languages`
# # --
# #
# # CREATE TABLE `languages` (
# #   `id` int(255) NOT NULL,
# #   `language` varchar(300) NOT NULL,
# #   `code` varchar(50) DEFAULT NULL,
# #   `is_active` tinyint(1) NOT NULL DEFAULT '1',
# #   `icons` varchar(100) DEFAULT NULL
# # ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
# #
# # -- --------------------------------------------------------
# #
# # ALTER TABLE `mc_course_mapping` CHANGE `FinalOrder` `final_order` INT(11) NOT NULL;
# #
# #
# # ALTER TABLE `ncert_video_meta` CHANGE `subtopic` `subtopic` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `microconcept` `microconcept` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `yt_description` `yt_description` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL, CHANGE `playlist_1` `playlist_1` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL, CHANGE `playlist_2` `playlist_2` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL, CHANGE `playlist_id1` `playlist_id1` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `playlist_id2` `playlist_id2` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `youtube_id` `youtube_id` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `new_youtube_id` `new_youtube_id` VARCHAR(25) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `new_answer_video` `new_answer_video` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `ocr_text` `ocr_text` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `question` `question` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `comment_hi_1` `comment_hi_1` VARCHAR(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `comment_hi_2` `comment_hi_2` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `comment_en_1` `comment_en_1` VARCHAR(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `comment_en_2` `comment_en_2` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `tags_description` `tags_description` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL, CHANGE `tags_yt` `tags_yt` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
# #
# #
# # -- --------------------------------------------------------
# #
# # --
# # -- Table structure for table `new_app_notifications`
# # --
# #
# # CREATE TABLE `new_app_notifications` (
# #   `id` int(255) NOT NULL,
# #   `event_name` varchar(300) NOT NULL,
# #   `description` varchar(500) NOT NULL,
# #   `type` varchar(300) NOT NULL DEFAULT 'marketing',
# #   `is_active` tinyint(1) DEFAULT '1'
# # ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
#
# -- --------------------------------------------------------
#
# -- --------------------------------------------------------
#
# --
# -- Table structure for table `playlist_questions_mapping`
# --
#
# CREATE TABLE `playlist_questions_mapping` (
#   `playlist_id` varchar(50) NOT NULL,
#   `question_id` varchar(100) NOT NULL,
#   `is_active` tinyint(1) NOT NULL DEFAULT '1',
#   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
# ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
#
# -- --------------------------------------------------------
#
# ALTER TABLE `questions` ADD `is_community` TINYINT(1) NOT NULL DEFAULT '0' AFTER `difficulty`, ADD INDEX (`is_community`);
#
#
# -- --------------------------------------------------------
#
# --
# -- Table structure for table `questions_localized`
# --
#
# CREATE TABLE `questions_localized` (
#   `question_id` int(55) NOT NULL,
#   `english` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `hindi` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `bengali` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `gujarati` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `kannada` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `malayalam` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `marathi` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `nepali` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `punjabi` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `Tamil` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `Telugu` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
#   `Urdu` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
# ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
#
# -- --------------------------------------------------------
#
# ALTER TABLE `question_package_mapping` ADD `id` INT NOT NULL AUTO_INCREMENT FIRST, ADD PRIMARY KEY (`id`);
#
# -- --------------------------------------------------------
#
# --
# -- Table structure for table `quiz`
# --
#
# CREATE TABLE `quiz` (
#   `quiz_id` int(255) NOT NULL,
#   `date` date NOT NULL,
#   `time_start` time NOT NULL,
#   `time_end` time NOT NULL,
#   `subject` varchar(255) NOT NULL,
#   `class` int(255) NOT NULL,
#   `description` varchar(255) NOT NULL,
#   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
#   `is_active` int(255) NOT NULL DEFAULT '0'
# ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
#
# -- --------------------------------------------------------
#
# --
# -- Table structure for table `quiz_questions`
# --
#
# CREATE TABLE `quiz_questions` (
#   `question_id` int(11) NOT NULL,
#   `quiz_id` int(11) NOT NULL,
#   `q_text_en` varchar(255) NOT NULL,
#   `q_type` varchar(255) NOT NULL,
#   `q_image` varchar(255) NOT NULL,
#   `q_video` varchar(255) NOT NULL,
#   `q_pos_mark` int(11) NOT NULL,
#   `q_neg_mark` int(11) NOT NULL
# ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
#
# -- --------------------------------------------------------
#
# --
# -- Table structure for table `quiz_question_options`
# --
#
# CREATE TABLE `quiz_question_options` (
#   `id` int(11) NOT NULL,
#   `quiz_id` int(11) NOT NULL,
#   `question_id` int(11) NOT NULL,
#   `option_value` varchar(255) NOT NULL,
#   `is_correct` tinyint(1) NOT NULL
# ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
#
# -- --------------------------------------------------------
#
# --
# -- Table structure for table `quiz_student_question`
# --
#
# CREATE TABLE `quiz_student_question` (
#   `id` int(11) NOT NULL,
#   `quiz_id` int(11) NOT NULL,
#   `student_id` int(11) NOT NULL,
#   `question_id` int(11) NOT NULL,
#   `opt_selected` varchar(255) NOT NULL,
#   `score` int(11) NOT NULL,
#   `is_correct` int(11) NOT NULL,
#   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
# ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
#
# -- --------------------------------------------------------
#
# ALTER TABLE `scheduled_notification` ADD `course` VARCHAR(255) NULL DEFAULT NULL AFTER `class`;
#
# ALTER TABLE `students` CHANGE `is_online` `is_online` INT(11) NULL DEFAULT NULL;
#
# ALTER TABLE `students` ADD `locale` VARCHAR(10) NOT NULL DEFAULT 'en' AFTER `is_web`, ADD `student_username` VARCHAR(25) NULL DEFAULT NULL AFTER `locale`, ADD `is_new_app` TINYINT(1) NOT NULL DEFAULT '0' AFTER `student_username`, ADD INDEX (`locale`), ADD INDEX (`student_username`), ADD INDEX (`is_new_app`);
#
# -- --------------------------------------------------------
#
# --
# -- Table structure for table `student_playlists`
# --
#
# CREATE TABLE `student_playlists` (
#   `id` int(11) NOT NULL,
#   `class` int(50) DEFAULT NULL,
#   `course` varchar(50) DEFAULT NULL,
#   `name` varchar(100) DEFAULT NULL,
#   `student_id` varchar(50) DEFAULT NULL,
#   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
#   `is_active` tinyint(1) NOT NULL DEFAULT '1',
#   `times_shared` int(100) NOT NULL DEFAULT '0'
# ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
#
# -- --------------------------------------------------------
#
# -- --------------------------------------------------------
#
# --
# -- Table structure for table `student_subscriptions`
# --
#
# CREATE TABLE `student_subscriptions` (
#   `subscription_id` int(11) NOT NULL,
#   `txnid` varchar(128) DEFAULT NULL,
#   `coupon_id` int(11) DEFAULT NULL,
#   `student_id` varchar(255) NOT NULL,
#   `scheme_id` varchar(255) NOT NULL,
#   `start_date` varchar(255) DEFAULT NULL,
#   `end_date` varchar(255) DEFAULT NULL
# ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
#
# -- --------------------------------------------------------
#
# -- --------------------------------------------------------
#
# --
# -- Table structure for table `trending_videos`
# --
#
# CREATE TABLE `trending_videos` (
#   `id` int(50) NOT NULL,
#   `question_id` int(50) NOT NULL,
#   `class` varchar(300) NOT NULL,
#   `course` varchar(300) NOT NULL,
#   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
# ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
#
# -- --------------------------------------------------------
#
# ALTER TABLE `user_answer_feedback` ADD `is_active` INT(10) NOT NULL DEFAULT '1' AFTER `view_time`, ADD INDEX (`is_active`);
#
# -- --------------------------------------------------------
#
# --
# -- Table structure for table `user_badges`
# --
#
# CREATE TABLE `user_badges` (
#   `id` int(255) NOT NULL,
#   `type` varchar(25) NOT NULL,
#   `upper_count` int(11) NOT NULL,
#   `lower_count` int(11) NOT NULL,
#   `url` varchar(120) NOT NULL,
#   `is_active` int(11) NOT NULL,
#   `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
# ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
#
# -- --------------------------------------------------------
#
# ALTER TABLE `user_notification` ADD `button_text` VARCHAR(25) NOT NULL DEFAULT 'Goto' AFTER `title`;
#
# ALTER TABLE `video_view_stats` ADD `view_from` VARCHAR(50) NULL DEFAULT NULL AFTER `refer_id`, ADD INDEX (`view_from`);
#
#
#
# ############################DATA################
# INSERT INTO `app_constants` (`id`, `constant_key`, `value`, `created_at`) VALUES
#   (1, 'cdn_static', 'https://d10lpgp6xz60nq.cloudfront.net', '2018-06-12 10:49:41');
#
#
# INSERT INTO `user_notification` (`id`, `type`, `title`, `image_url`, `message`, `button_text`, `created_on`, `isActive`) VALUES
#   (26, 'upvote_question', 'YAYY !!', 'http://getdrawings.com/images/winter-tree-drawing-31.jpg', 'CONGO !! Someone just upvoted your question you asked in community', 'Goto', '2018-07-24 15:13:15', 1),
#   (25, 'videowatch_benchmark_hit', 'WoW ! you earned a badge', 'www.google.com', 'We like your watching videos on doublet,thereby awarding a badge on the benchmark hit.Keep Going', 'Goto', '2018-07-24 15:13:15', 1),
#   (24, 'ask_benchmark_hit', 'WoW ! you earned a Badge', 'www.google.com', 'we like your asking questions on doubtnut,thereby awarding you a badge ', 'Goto', '2018-07-24 15:11:44', 1),
#   (23, 'resume_video', 'Video page', 'https://doubtnutvideobiz.blob.core.windows.net/q-thumbnail/', 'Begin where you left last time', 'Goto', '2018-07-24 13:00:20', 1),
#   (22, 'comm_answered_unwatched', 'Hey !! We answered your Video', 'www.google.com', 'You didn\'t watch the video you asked in community', 'Goto', '2018-07-24 13:00:20', 1),
#   (21, 'referred_video', 'Your friend watched a video shared by you', 'https://www.dropbox.com/s/94obz34ztyp69mr/01.png?dl=1', 'Your friend watched a video shared by you', 'Goto', '2018-07-20 13:01:12', 1),
#   (20, 'first_5_video_watch', 'YAYY! FIRST FIVE VIDEO WATHCED TODAY!!', 'https://www.dropbox.com/s/291tkihvt4zmgqm/17.png?dl=1', 'We love your pace. Keep it up. We love it when you watch videos', 'Goto', '2018-07-20 08:08:06', 1),
#   (19, 'first_5_question', 'Yayy ! you asked 5 questions today.', 'https://www.dropbox.com/s/x16nm9692s8vety/02.png?dl=1', 'You can ask UNLIMITED questions on Doubtnut, Ask more questions & learn better!\r\nStudents who ask questions on Doubtnut, score better grades than before!', 'Goto', '2018-07-20 08:06:13', 1),
#   (18, 'first_video_watch', 'YAYY! FIRST VIDEO WATHCED', 'www.image.url', 'Hurray! first video watched on doubtnut . Hope you liked it ,Enjoy more videos', 'Goto', '2018-07-19 14:04:45', 1);
#
# INSERT INTO `user_badges` (`id`, `type`, `upper_count`, `lower_count`, `url`, `is_active`, `created_at`) VALUES
#   (1, 'question', 10, 0, '  https://d10lpgp6xz60nq.cloudfront.net/images/question_asked_novice.png', 1, '2018-07-25 11:15:28'),
#   (2, 'question', 50, 10, 'https://d10lpgp6xz60nq.cloudfront.net/images/question_asked_intermediate.png', 1, '2018-07-25 11:15:31'),
#   (3, 'question', 250, 50, 'https://d10lpgp6xz60nq.cloudfront.net/images/question_asked_expert.png', 1, '2018-07-25 11:15:32'),
#   (4, 'question', 1000, 250, 'https://d10lpgp6xz60nq.cloudfront.net/images/question_asked_boss.png', 1, '2018-07-25 11:15:35'),
#   (5, 'question', 1500, 1000, 'https://d10lpgp6xz60nq.cloudfront.net/images/question_asked_boss.png', 1, '2018-07-25 11:15:37'),
#   (6, 'question', 2000, 1500, 'https://d10lpgp6xz60nq.cloudfront.net/images/question_asked_boss.png', 1, '2018-07-25 11:15:37'),
#   (7, 'question', 2500, 2000, 'https://d10lpgp6xz60nq.cloudfront.net/images/question_asked_boss.png', 1, '2018-07-25 11:15:39'),
#   (8, 'videos_viewed', 0, 10, 'https://d10lpgp6xz60nq.cloudfront.net/images/video_watched_novice.png', 1, '2018-08-01 12:28:31'),
#   (9, 'videos_viewed', 50, 10, 'https://d10lpgp6xz60nq.cloudfront.net/images/video_watched_intermediate.png', 1, '2018-08-06 14:44:54'),
#   (10, 'videos_viewed', 250, 50, 'https://d10lpgp6xz60nq.cloudfront.net/images/video_watched_expert.png', 1, '2018-08-06 14:44:29'),
#   (11, 'videos_viewed', 1000, 250, 'https://d10lpgp6xz60nq.cloudfront.net/images/video_watched_boss.png', 1, '2018-08-01 12:29:12'),
#   (12, 'videos_viewed', 1500, 1000, 'https://d10lpgp6xz60nq.cloudfront.net/images/video_watched_boss.png', 1, '2018-08-01 12:29:14'),
#   (13, 'videos_viewed', 2000, 1500, 'https://d10lpgp6xz60nq.cloudfront.net/images/video_watched_boss.png', 1, '2018-08-01 12:29:16');
# ALTER TABLE `user_answer_feedback` CHANGE `answer_video` `answer_video` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
# ALTER TABLE `scheduled_notification` CHANGE `course` `course` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
# ALTER TABLE `students` CHANGE `udid` `udid` VARCHAR(150) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL;
# ALTER TABLE `user_answer_feedback` CHANGE `answer_video` `answer_video` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
#
#
# ALTER TABLE `class_chapter_image_mapping` ADD `chapter_display` VARCHAR(100) NULL DEFAULT NULL AFTER `chapter`;
#
# ALTER TABLE `wordpress_data` ADD `contactus` LONGTEXT NULL DEFAULT NULL AFTER `refunds`;
#
#
#
# ALTER TABLE `answers`
#   ADD KEY `timestamp` (`timestamp`),
#   ADD KEY `question_id_2` (`question_id`);
#
# --
# -- Indexes for table `app_constants`
# --
# ALTER TABLE `app_constants`
#   ADD PRIMARY KEY (`id`),
#   ADD KEY `costant_key` (`constant_key`);
#
# ALTER TABLE `app_feedbacks`
#   ADD KEY `isActive` (`isActive`);
#
# ALTER TABLE `campaigns`
#   ADD KEY `start` (`start`),
#   ADD KEY `end` (`end`);
#
# ALTER TABLE `campaign_students`
#   ADD KEY `campaign_id` (`campaign_id`),
#   ADD KEY `student_id` (`student_id`);
#
# ALTER TABLE `class_chapter_image_mapping`
#   ADD KEY `chapter_order` (`chapter_order`);
#
# --
# -- Indexes for table `community_questions_meta`
# --
# ALTER TABLE `community_questions_meta`
#   ADD PRIMARY KEY (`id`),
#   ADD KEY `qid` (`qid`),
#   ADD KEY `timestamp` (`timestamp`);
#
# --
# -- Indexes for table `community_questions_upvote`
# --
# ALTER TABLE `community_questions_upvote`
#   ADD PRIMARY KEY (`id`),
#   ADD UNIQUE KEY `qid` (`qid`,`voter_id`),
#   ADD UNIQUE KEY `qid_2` (`qid`,`voter_id`),
#   ADD KEY `voted_at` (`voted_at`);
#
# --
# -- Indexes for table `courses_new`
# --
# ALTER TABLE `courses_new`
#   ADD PRIMARY KEY (`id`);
#
# --
# -- Indexes for table `courses_package`
# --
# ALTER TABLE `courses_package`
#   ADD PRIMARY KEY (`id`);
#
# --
# -- Indexes for table `course_browse_history`
# --
# ALTER TABLE `course_browse_history`
#   ADD PRIMARY KEY (`id`),
#   ADD KEY `student_id` (`student_id`),
#   ADD KEY `created_at` (`created_at`);
#
#
# ALTER TABLE `expert_skipped_question`
#   ADD KEY `question_id` (`question_id`);
#
#
# --
# -- Indexes for table `languages`
# --
# ALTER TABLE `languages`
#   ADD PRIMARY KEY (`id`),
#   ADD KEY `is_active` (`is_active`);
#
# ALTER TABLE `notifications`
#   ADD KEY `student_id` (`student_id`);
#
# ALTER TABLE `playlist_questions_mapping`
#   ADD PRIMARY KEY (`playlist_id`,`question_id`),
#   ADD UNIQUE KEY `playlist_id_2` (`playlist_id`,`question_id`),
#   ADD KEY `playlist_id` (`playlist_id`),
#   ADD KEY `question_id` (`question_id`),
#   ADD KEY `created_at` (`created_at`),
#   ADD KEY `is_active` (`is_active`);
#
# ALTER TABLE `questions`
#   ADD KEY `chapter` (`chapter`),
#   ADD KEY `question_credit` (`question_credit`),
#   ADD KEY `timestamp` (`timestamp`),
#   ADD KEY `is_skipped` (`is_skipped`),
#   ADD KEY `matched_question` (`matched_question`);
#
#
# ALTER TABLE `questions_localized`
#   ADD KEY `question_id` (`question_id`);
#
# ALTER TABLE `questions_meta`
#   ADD KEY `doubtnut_recommended` (`doubtnut_recommended`),
#   ADD KEY `class` (`class`),
#   ADD KEY `is_skipped` (`is_skipped`),
#   ADD KEY `microconcept` (`microconcept`),
#   ADD KEY `secondary_microconcept` (`secondary_microconcept`),
#   ADD KEY `chapter` (`chapter`,`subtopic`,`level`,`target_course`,`timestamp`);
#
# ALTER TABLE `question_package_mapping`
#   ADD KEY `student_id` (`student_id`),
#   ADD KEY `packages` (`packages`);
#
# ALTER TABLE `students`
# #   ADD KEY `is_new_app` (`is_new_app`),
# #   ADD KEY `student_username` (`student_username`),
#   ADD KEY `mobile` (`mobile`);
#
# ALTER TABLE `student_playlists`
#   ADD PRIMARY KEY (`id`),
#   ADD UNIQUE KEY `name` (`name`,`student_id`),
#   ADD KEY `id` (`id`),
#   ADD KEY `student_id` (`student_id`),
#   ADD KEY `is_active` (`is_active`),
#   ADD KEY `created_at` (`created_at`);
#
# ALTER TABLE `subscriptions`
#   ADD KEY `student_id` (`student_id`),
#   ADD KEY `scheme_id` (`scheme_id`),
#   ADD KEY `start_date` (`start_date`),
#   ADD KEY `end_date` (`end_date`);
#
# ALTER TABLE `trending_videos`
#   ADD PRIMARY KEY (`id`),
#   ADD KEY `created_at` (`created_at`),
#   ADD KEY `class` (`class`),
#   ADD KEY `question_id` (`question_id`);
#
# ALTER TABLE `user_answer_feedback`
#   ADD KEY `answer_video` (`answer_video`),
#   ADD KEY `student_id` (`student_id`),
#   ADD KEY `question_id` (`question_id`);
#
# ALTER TABLE `user_badges`
#   ADD PRIMARY KEY (`id`);
#
#
# ALTER TABLE `video_view_stats`
#   ADD KEY `created_at` (`created_at`),
#   ADD KEY `is_back` (`is_back`);
#
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 2;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 3;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 4;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 5;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 6;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 7;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 8;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 9;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 10;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 11;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 12;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 13;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 14;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 15;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 16;
# DELETE FROM `user_notification` WHERE `user_notification`.`id` = 17;
ALTER TABLE `user_notification` ADD `button_text` VARCHAR(25) NULL DEFAULT NULL AFTER `isActive`, ADD `notification_type` VARCHAR(25) NULL DEFAULT NULL AFTER `button_text`, ADD INDEX (`notification_type`);

ALTER TABLE `user_notification`
  ADD KEY `type` (`type`);
INSERT INTO `user_notification` (`id`, `type`, `title`, `image_url`, `message`, `button_text`, `created_on`, `isActive`, `notification_type`) VALUES
  (2, 'signup', 'WELCOME TO DOUBTNUT!', 'https://www.dropbox.com/s/jxsoequgvee8rs3/01.png?dl=1', 'Ask Unlimited Math Questions on Doubtnut App. Get Access to more than 1 Lakh Video Solutions!', 'Ask Now', '2018-03-06 08:34:20', 1, 'push_notification'),
  (3, 'first_question', 'FIRST OF MANY QUESTIONS ASKED', 'https://www.dropbox.com/s/h7bx8ztnj8dxhq7/02.png?dl=1', 'You can ask Unlimited Math questions on Doubtnut! Keep Asking and Learning :)', 'Ask Now', '2018-03-07 06:16:07', 1, 'push_notification'),
  (4, 'solve_it_for_me', 'THANKS FOR ASKING', 'https://www.dropbox.com/s/5x90f3chh526t86/03.png?dl=1', 'Our experts have received your question & will create a new video solution just for you!\nIt may take upto 24 hours to respond, till then why don’t you watch some videos in our Learn module', 'Goto', '2018-03-07 10:10:26', 1, 'push_notification'),
  (5, 'question_assigned', 'IITian EXPERT IS SOLVING YOUR DOUBT NOW', 'https://www.dropbox.com/s/tq3064msi94kjb0/04.png?dl=1', 'One of our IITian expert has picked up your question to solve!\nAn awesome answer videos is on its way!\n', 'Goto', '2018-03-16 05:49:23', 1, 'push_notification'),
  (6, 'question_skipped', 'OOPS! YOUR DOUBT WAS SKIPPED', '', ' ', 'Goto', '2018-03-16 07:25:35', 1, 'push_notification'),
  (7, 'negative_question_answered', 'NEW ANSWER UPLOADED', 'https://www.dropbox.com/s/8qgy2lf64yd8slk/07.png?dl=1', 'A new video has been uploaded for a question viewed by you. Have a look!We have added a new answer to the question you had asked previously!\nWatch it now and let us know your feedback!', 'Goto', '2018-03-16 08:11:11', 1, 'push_notification'),
  (8, 'user_like_answers', 'WE NEED SOME LOVE', 'https://www.dropbox.com/s/i61valuwjtgcu0i/08.png?dl=1', 'Please rate us on Play Store. It help us grow and serve you better!\n', 'Goto', '2018-03-16 10:56:40', 0, 'push_notification'),
  (9, 'asked_questions_no_subscription', 'BUY SUBSCRIPTION', 'https://www.dropbox.com/s/l3unrowxvk5cude/11.png?dl=1', 'To get access to all features & to get doubts solved by IITian expert buy now!\nYou can continue to ask unlimited doubts for free, like now!\n', 'Goto', '2018-03-16 12:13:42', 0, 'push_notification'),
  (10, 'user_dislike_answers', 'SORRY FOR THE MISTAKE', 'https://www.dropbox.com/s/unmaew2rqw3m47e/13.png?dl=1', 'We are sorry. Our experts are recreating the video just for you. Just hang on!!', 'Goto', '2018-03-16 13:49:10', 0, 'push_notification'),
  (11, 'question_diificulty', 'Your Questions has been tagged Easy ::  Your Questions has been tagged medium :: Your Questions has been tagged Difficult', 'https://www.dropbox.com/s/67alfbdvk6yvmji/Update-FreeSearch.png?dl=1', 'Your Questions has been tagged Easy ::  Your Questions has been tagged medium :: Your Questions has been tagged Difficult', 'Goto', '2018-03-19 06:49:29', 0, 'push_notification'),
  (12, 'asked_questions_day', 'LEARNING LIKE A BOSS', 'https://www.dropbox.com/s/291tkihvt4zmgqm/17.png?dl=1', 'You have asked 10 questions in a day, continue Learning with Doubtnut!', 'Ask More', '2018-03-19 07:33:21', 1, 'push_notification'),
  (13, 'question_answered', 'IITian EXPERT HAS ANSWERED', 'https://www.dropbox.com/s/fex0z1vc0safiq0/05.png?dl=1', 'One of our IITian expert has sent you the answer video for your doubt!\nPlease watch it now and let us know your feedback!\n', 'Goto', '2018-03-19 08:43:54', 1, 'push_notification'),
  (14, 'didnt_ask_questions_5', 'WE MISS YOU', 'https://www.dropbox.com/s/d97ks7iyfss59bz/09.png?dl=1', 'Students watched 1000s of videos on Doubtnut yesterday. Get back on Doubtnut & Ask UNLIMITED question!\n', 'Goto', '2018-03-19 13:51:00', 1, 'push_notification'),
  (15, 'subscription_ending', 'RENEW SUSBCRIPTION', 'https://www.dropbox.com/s/d6jxh1jd5rynffm/10.png?dl=1', 'Your subscription is ending soon, renew now to keep asking all your doubts!\nWe will love to answer all your doubst :)', 'Goto', '2018-03-19 14:19:30', 1, 'push_notification'),
  (16, 'no_activity', 'WE MISS YOU', 'https://www.dropbox.com/s/unmaew2rqw3m47e/13.png?dl=1', 'We haven’t seen you on the App for long!\nIf something is amiss or wrong, let us know! We will do our best to make your experience better!', 'Goto', '2018-03-19 14:42:59', 1, 'push_notification'),
  (17, 'after_buy_subscription', 'THANKS FOR BUYING', 'https://www.dropbox.com/s/nwdkb44k8kw6io9/12.png?dl=1', 'You can get unlimited questions answered by IITian experts\nWe take upto 24 hours to create new video solution just for you!', 'Goto', '2018-03-20 05:11:05', 1, 'push_notification'),
  (18, 'first_video_watch', 'WATCH UNLIMITED VIDEOS', 'https://www.dropbox.com/s/1kp1efec35fhiol/03.png?dl=1', 'Watch Unlimited Videos to clear all your doubts and learn all Math concepts!', 'Watch Now', '2018-07-19 14:04:45', 1, 'push_notification'),
  (19, 'first_n_question', 'YOU ARE ON A ROLL', 'https://www.dropbox.com/s/he74rh7g2gw8ous/04.png?dl=1', 'Keep Asking all your Math Doubts! ', 'Ask Again', '2018-07-20 08:06:13', 1, 'push_notification'),
  (20, 'first_n_video_watch', 'YOU ARE ON A ROLL', 'https://www.dropbox.com/s/l7zqkauyyo0qno4/05.png?dl=1', 'We have more than 100000 Math Videos - Keep watching and Learning :)', 'Watch More', '2018-07-20 08:08:06', 1, 'push_notification'),
  (21, 'referred_video', 'Yayy! YOUR FRIEND WATCHED', 'https://www.dropbox.com/s/xnnhcgut0et7l8g/08.png?dl=1', 'from the link you shared! Thanks for spreading awesomeness of Doubtnut!', 'Thanks', '2018-07-20 13:01:12', 1, 'push_notification'),
  (22, 'comm_answered_unwatched', 'YOU QUESTION ON FORUM WAS ANSWERED', 'https://www.dropbox.com/s/sqfb1dfambc2qhb/17.png?dl=1', 'Watch it now', 'Watch Now', '2018-07-24 13:00:20', 1, 'in_app'),
  (23, 'resume_video', 'YOU WERE WATCHING', 'https://doubtnutvideobiz.blob.core.windows.net/q-thumbnail/', '...continue watching from here:', 'Watch Now', '2018-07-24 13:00:20', 1, 'in_app'),
  (24, 'ask_benchmark_hit', 'NEW BADGE UNLOCKED', 'https://www.dropbox.com/s/o09j7mz6c6a0n1o/14.jpeg?dl=0', 'You are on a roll - Keep Learning - Thanks for using Doubtnut!', 'Yayy!', '2018-07-24 15:11:44', 1, 'push_notification'),
  (25, 'videowatch_benchmark_hit', 'NEW BADGE UNLOCKED', 'https://www.dropbox.com/s/o09j7mz6c6a0n1o/14.jpeg?dl=0', 'You are on a roll - Keep Learning - Thanks for using Doubtnut!', 'Yayy!', '2018-07-24 15:13:15', 1, 'push_notification'),
  (26, 'upvote_question', 'A FRIEND VOTED YOUR QUESTION', NULL, 'Ask your other friends to help you get the answer for your doubt!', 'Share Now', '2018-07-24 15:13:15', 1, 'push_notification'),
  (30, 'user_question_streak', 'LEARNING LIKE A BOSS', 'https://www.dropbox.com/s/0ipi6b6iwgqg6a0/07.png?dl=1', 'You have asked 10 questions in a day, continue Learning with Doubtnut!', 'Ask More', '2018-07-24 15:13:15', 1, 'push_notification'),
  (31, 'video_trending', 'WHAT OTHERS ARE WATCHING', 'https://www.dropbox.com/s/6lk8fngfz12hesr/06.png?dl=1', '1000\'s of Students watched these videos yesterday! Did you?', 'Watch Now', '2018-07-24 15:13:15', 1, 'push_notification'),
  (32, 'expert_community_answered', 'Your Question was Answered!', 'http://getdrawings.com/images/winter-tree-drawing-31.jpg', 'Yayy! Doubtnut has solved your question - Watch it now!', 'Watch Now', '2018-07-24 15:13:15', 1, 'push_notification'),
  (33, 'user_video_streak', 'LEARNING LIKE A BOSS', 'https://www.dropbox.com/s/0ipi6b6iwgqg6a0/07.png?dl=1', 'You have watched 10 questions in a day, continue Learning with Doubtnut!', 'Watch More', '2018-07-24 15:13:15', 1, 'push_notification'),
  (34, 'next_badge_video', 'GET AHEAD OF THE REST', NULL, 'Watch more videos to earn the next Badge!', 'Watch Now', '2018-07-24 15:13:15', 1, 'push_notification'),
  (35, 'next_badge_question', 'GET AHEAD OF THE REST', NULL, 'Ask more questions to earn the next Badge!', 'Ask Now', '2018-07-24 15:13:15', 1, 'push_notification');

INSERT INTO `languages` (`id`, `language`, `code`, `is_active`, `icons`) VALUES
  (1, 'hindi', 'hi', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/hindi.png'),
  (2, 'english', 'en', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/english.png'),
  (3, 'bengali', 'bn', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/bengali.png'),
  (4, 'gujarati', 'gu', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/telegu.png'),
  (5, 'kannada', 'ka', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/kannada.png'),
  (6, 'malayalam', 'ml', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/malyalam.png'),
  (7, 'marathi', 'mr', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/marathi.png'),
  (8, 'nepali', 'ne', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/nepali.png'),
  (9, 'punjabi', 'pa', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/punjabi.png'),
  (10, 'Tamil', 'ta', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/tamil.png'),
  (11, 'Telugu', 'te', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/telegu.png'),
  (12, 'Urdu', 'ur', 1, 'https://d10lpgp6xz60nq.cloudfront.net/images/urdu.png');

