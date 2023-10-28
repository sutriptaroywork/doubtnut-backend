<?php

require 'config.php';

$is_prod = 1;
if ($is_prod) {
    $servername = PROD_DB_WRITE;
    $username = USERNAME;
    $password = PASSWORD;
    $dbname = DATABASE;
} else {
    $servername = "13.127.249.21";
    $username = "root";
    $password = "root";
    $dbname = "classzoo1";
}

try{
	$conn = new mysqli($servername, $username, $password, $dbname);
	date_default_timezone_set('Asia/Kolkata');
	mysqli_set_charset($conn, "utf8");
	$sql = "SELECT * FROM `questions` WHERE `matched_question` IS NOT NULL and is_skipped=0 and is_answered=1 and question_id > 1065 ORDER BY `question_id` ASC";
	$result = $conn->query($sql);
	if ($result->num_rows > 0) {
		while ($row = $result->fetch_assoc()) {
			$matched_question = $row["matched_question"];
			echo($row["question_id"]);
			echo " : ";
			echo($matched_question);
						echo " : ";
			$sql1 = "SELECT * from questions_meta WHERE question_id='".$matched_question."'";
			$result1 = $conn->query($sql1);
			if ($result1->num_rows == 1) {
				while ($row1 = $result1->fetch_assoc()) {
					echo "inside ";
					$row1["intern_id"] = "10004";
					$row1["assigned_to"] = "10004";
					$row1["question_id"] = $row["question_id"];
					$sql3 = "INSERT INTO `questions_meta` (`question_id`, `intern_id`, `assigned_to`, `class`, `chapter`, `subtopic`, `microconcept`, `level`, `target_course`, `package`, `type`, `q_options`, `q_answer`, `diagram_type`, `concept_type`, `chapter_type`, `we_type`, `ei_type`, `aptitude_type`, `pfs_type`, `symbol_type`, `doubtnut_recommended`, `secondary_class`, `secondary_chapter`, `secondary_subtopic`, `secondary_microconcept`, `video_quality`, `audio_quality`, `language`, `ocr_quality`, `is_skipped`) VALUES
('".$row1['question_id']."', '".$row1['intern_id']."', '".$row1['assigned_to']."', '".$row1['class']."', '".$row1['chapter']."', '".$row1['subtopic']."',  '".$row1['microconcept']."', '".$row1['level']."', '".$row1['target_course']."',  '".$row1['package']."',  '".$row1['type']."', '".$row1['q_options']."', '".$row1['q_answer']."', '".$row1['diagram_type']."',  '".$row1['concept_type']."',  '".$row1['chapter_type']."', '".$row1['we_type']."', '".$row1['ei_type']."',  '".$row1['aptitude_type']."', '".$row1['pfs_type']."',  '".$row1['symbol_type']."',  '".$row1['doubtnut_recommended']."', '".$row1['secondary_class']."', '".$row1['secondary_chapter']."', '".$row1['secondary_subtopic']."', '".$row1['secondary_microconcept']."', '".$row1['video_quality']."', '".$row1['audio_quality']."',  '".$row1['language']."', '".$row1['ocr_quality']."','".$row1['is_skipped']."');";
					$result3 = $conn->query($sql3);
					// echo $sql3;
					var_dump($result3);
				}
			}
		}
	}


	$conn->close();
}catch(Exception $e){
	var_dump($e);
	$conn->close();
}

?>