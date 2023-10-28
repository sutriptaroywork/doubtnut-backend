<?php
ini_set("memory_limit", "-1");
ini_set('max_execution_time', "-1");
ini_set('mysql.connect_timeout', "-1");
require 'config.php';
$conW = mysqli_connect(PROD_DB_WRITE, USERNAME, PASSWORD, DATABASE);
$conR = mysqli_connect(ANALYTICS_DB_CONN, USERNAME, PASSWORD, DATABASE);
$conW->set_charset("utf8");
$conR->set_charset("utf8");
$query_1 = mysqli_query($conR, "SELECT distinct student_id, class from questions where student_id<90 and student_id>0 order by student_id, class");
// $query_1 = mysqli_query($conR, "SELECT student_id, student_class from students where student_id ='724515'");

try{
    while ($q_array_1 = mysqli_fetch_array($query_1)) {

    $student_id=$q_array_1['student_id'];
    $class = $q_array_1['class'];
    // $class = $q_array_1['student_class'];
     $query1= "select * from (Select a.question_id, a.count_v, b.class, b.chapter, b.student_id, b.ocr_text, b.question from (SELECT question_id, count(view_id) as count_v FROM video_view_stats group by question_id) as a left join (select class, chapter, student_id, ocr_text, question_id, question from questions where student_id ='".$student_id."' and class = '".$class."') as b on a.question_id=b.question_id order by a.count_v desc) as c left join (Select question_id, max(answer_id) as answer_id from answers group by question_id) as d on c.question_id=d.question_id left join answers as e on d.answer_id=e.answer_id left join questions_meta as f on c.question_id=f.question_id where c.class=f.class order by c.count_v desc limit 5";
    $result = mysqli_query($conR, $query1);
    while ($row = mysqli_fetch_array($result)) {
        $query2 = "INSERT INTO `top_viewed_video`(question_id,answer_id, answer_video, view_count, student_id, class, chapter, m_class, m_chapter, m_subtopic, m_level, ocr_text, question) VALUES ('".$row["question_id"]."', '". $row["answer_id"]."','".$row["answer_video"]."', '".$row["count_v"]."', '".$row["student_id"]."', '".$row["class"]."', '".$row["chapter"]."', '".$row[29]."', '".$row[30]."', '".$row["subtopic"]."', '".$row["level"]."', '".$row["ocr_text"]."', '".$row["question"]."')";
        $query_2 = mysqli_query($conW, $query2);

    }
    $query2 = "SELECT sum(c.count_v) as count_c, c.student_id, c.class, c.l_chapter from (SELECT a.question_id, a.count_v, b.student_id, b.class,case when b.student_id = 1 then b.chapter else c.chapter end as l_chapter from (SELECT question_id, count(view_id) as count_v FROM video_view_stats group by question_id) as a left join 
    questions as b on a.question_id=b.question_id  left join questions_meta as c on a.question_id = c.question_id where b.student_id ='".$student_id."' and b.class = '".$class."' and c.class = '".$class."') as c group by c.student_id, c.class, c.l_chapter order by count_c desc limit 5";
     $result = mysqli_query($conR, $query2);
    while ($row = mysqli_fetch_array($result)) {
        $query2 = "INSERT INTO `top_viewed_chapter`(view_count, student_id, class, chapter) VALUES ('".$row["count_c"]."', '".$row["student_id"]."', '".$row["class"]."', '".$row["l_chapter"]."')";
        $query_2 = mysqli_query($conW, $query2);
    }
    echo "\n".$student_id." - - - ".$class."\n";

}


$date = new DateTime();

echo "send top videos ran successfully at " . $date->format("y:m:d h:i:s");
}catch(Exception $e){
    var_dump($e);
}finally {
    mysqli_close($conW);
    mysqli_close($conR);
}
?>