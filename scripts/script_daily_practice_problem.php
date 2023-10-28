<?php

require 'config.php';

$con_w = mysqli_connect(PROD_DB_WRITE, USERNAME, PASSWORD, DATABASE);
$con_r = mysqli_connect(ANALYTICS_DB_CONN, USERNAME, PASSWORD, DATABASE);
$con_w->set_charset("utf8");
$con_r->set_charset("utf8");

$insert_query1 = "INSERT INTO students_daily_problems (timestamp, student_id, class, chapter, view_count) Select CURRENT_TIMESTAMP, t3.student_id, t4.class, t4.chapter, t3.view_chapter from (Select t1.student_id, max(t1.view_Chapter) as view_chapter from (SELECT a.student_id, b.chapter, b.class, count(a.view_id) as view_chapter from (Select * from video_view_stats where created_at>DATE_SUB(CURRENT_DATE, INTERVAl 7 DAY) and created_at<CURRENT_DATE and source = 'android')  as a inner join questions_meta as b on a.question_id=b.question_id where b.chapter is not NULL AND b.chapter <> '' AND b.chapter not like 'TIPS%' group by a.student_id, b.chapter, b.class order by a.student_id desc, view_chapter DESC) as t1  group by t1.student_id having max(t1.view_chapter)>3) as t3 left join (SELECT c.student_id, d.chapter, d.class, count(c.view_id) as view_chapter from (Select * from video_view_stats where created_at>DATE_SUB(CURRENT_DATE, INTERVAl 7 DAY) and created_at<CURRENT_DATE and source = 'android')  as c inner join questions_meta as d on c.question_id=d.question_id where d.chapter is not NULL OR d.chapter <> '' group by c.student_id, d.chapter, d.class) as t4 on t3.student_id = t4.student_id and t3.view_chapter = t4.view_chapter";


$run_insert_query1 = mysqli_query($con_w, $insert_query1);
$chapter_query = mysqli_query($con_r, "SELECT * FROM students_daily_problems ORDER BY student_id DESC");
while ($chapter_array = mysqli_fetch_array($chapter_query)) {
  $student_id = $chapter_array['student_id'];
  $chapter = $chapter_array['chapter'];
  $class = $chapter_array['class'];
  $questions_query = mysqli_query($con_r, "SELECT * from questions_meta WHERE chapter = '" . $chapter . "' and class ='" . $class . "' and language like 'hin%' and doubtnut_recommended like 'Reco%' ORDER BY RAND() LIMIT 10");
  while ($questions_array = mysqli_fetch_array($questions_query)) {

    $question_id = $questions_array['question_id'];
    $level = $questions_array['level'];
    $target_course = $questions_array['target_course'];
    $insert_query2 = "INSERT INTO student_daily_problems_qid VALUES (NULL,CURRENT_TIMESTAMP, " . $student_id . "," . $class . ",'" . $chapter . "'," . $question_id . ",'" . $level . "','" . $target_course . "')";
    $run_insert_query2 = mysqli_query($con_w, $insert_query2);
    echo "\n" . $student_id . "-" . $class . "-" . $chapter . "-" . $question_id . "-" . $run_insert_query2;

  }


}
$delete_query1 = mysqli_query($con_w, "DELETE FROM students_daily_problems where timestamp < CURRENT_DATE");
$delete_query2 = mysqli_query($con_w, "DELETE FROM student_daily_problems_qid where timestamp < CURRENT_DATE");
mysqli_close($con_w);
mysqli_close($con_r);


?>
