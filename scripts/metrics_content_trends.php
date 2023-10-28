<?php

require 'config.php';

$con_r=mysqli_connect(ANALYTICS_DB_CONN, USERNAME, PASSWORD, DATABASE);
$con_w=mysqli_connect(PROD_DB_WRITE, USERNAME, PASSWORD, DATABASE);


$class1=array("12","11","10","9","8","7","6","14");
//$class1=array("12","11");
$subject1=array("PHYSICS","CHEMISTRY","MATHS","BIOLOGY");
//$subject1=array("M");

$arrclasslength=count($class1);
$arrsublength=count($subject1);

for ($z=1; $z<2;$z++){

    $day_interval = $z;
    $prev_day_interval = $z-1;

    echo "\n".$day_interval."-".$prev_day_interval;


    for($x=0;$x<$arrclasslength;$x++)    
        {
        $sel_class=$class1[$x];

        for($y=0;$y<$arrsublength;$y++)
            {
            $sel_sub=$subject1[$y];

            //echo "\n".$z."--".$x."--".$y;
            //echo "\n".$sel_class."--".$sel_sub;

            $get_top_chapter = "SELECT c.class, d.subject, c.chapter, c.date_v, count(c.view_id) as count_v from (Select date(a.created_at) as date_v,a.view_id, b.class, b.chapter, b.subtopic from (SELECT * FROM `video_view_stats` where created_at>=DATE_SUB(CURRENT_DATE, INTERVAL ".$day_interval." DAY) and created_at < DATE_SUB(CURRENT_DATE, INTERVAL ".$prev_day_interval." DAY) and source like 'android' and view_from like 'SRP') as a left join  `questions_meta` as b on a.question_id=b.question_id  where b.chapter is not NULL and b.class = '".$sel_class."') as c  left join (Select DISTINCT class, subject, chapter from mc_course_mapping) as d on c.class = d.class and c.chapter=d.chapter where upper(d.subject) like '".$sel_sub."' group by c.date_v, c.class, d.subject, c.chapter order by count_v desc limit 5";

             $q_2_query = mysqli_query($con_r, $get_top_chapter);
        
             while ($quiz_2_array = mysqli_fetch_array($q_2_query)) { 
                 $class = $quiz_2_array['class'];
                 $subject = $quiz_2_array['subject'];
                 $chapter = addslashes($quiz_2_array['chapter']);
                 $count_ch = $quiz_2_array['count_v'];
                 $date_v = $quiz_2_array['date_v'];
                
//                echo "\n".$class."-".$subject."-".$chapter."-".$date_v;

                $get_top_subtopic = "SELECT c.class, c.subtopic, c.chapter, c.date_v, count(c.view_id) as count_st from (Select date(a.created_at) as date_v,a.view_id, b.class, b.chapter, b.subtopic from (SELECT * FROM `video_view_stats` where created_at>=DATE_SUB(CURRENT_DATE, INTERVAL ".$day_interval." DAY) and created_at < DATE_SUB(CURRENT_DATE, INTERVAL ".$prev_day_interval." DAY) and source like 'and%' and view_from like 'SRP') as a left join  `questions_meta` as b on a.question_id=b.question_id  where b.chapter like '".$chapter."' and b.class = ".$class.") as c group by c.date_v, c.class, c.subtopic, c.chapter order by count_st desc limit 5";

  //              echo "\n".$get_top_subtopic;
                
                $q_3_query = mysqli_query($con_r, $get_top_subtopic);
        
                while ($quiz_3_array = mysqli_fetch_array($q_3_query)) {

                    $subtopic = addslashes($quiz_3_array['subtopic']);
                    $count_st = $quiz_3_array['count_st'];

                    echo "\n----".$class."-".$subject."-".$chapter."-".$subtopic."-".$date_v;

    //                echo "\n"."INSERT INTO content_trend VALUES (NULL,'".$date_v."',".$class.",'".$subject."','".$chapter."','".$subtopic."',".$count_ch.",".$count_st.")\n";
                    
                    $insert_query = mysqli_query($con_w,"INSERT INTO content_trend VALUES (NULL,'".$date_v."',".$class.",'".$subject."','".$chapter."','".$subtopic."',".$count_ch.",".$count_st.")");

             }

            }
            //die; 
        }
    }
}
echo "\n"."-DONE\n";
mysqli_close($con_w);
mysqli_close($con_r);

    



?>
