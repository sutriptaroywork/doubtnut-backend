<?php

require 'config.php';

$con_w = mysqli_connect(PROD_DB_WRITE, USERNAME, PASSWORD, DATABASE);
$con_w->set_charset("utf8");

try{
		$sql1 = 'DROP TABLE `user_first_questions`';
		$result1= $con_w->query($sql1);

		if($result1){
			echo "table dropped \n";
		}else{
			echo "table doesn't exits \n";
		}

		$sql2 = 'CREATE TABLE `user_first_questions` (
		 `id` INT( 55 ) NOT NULL AUTO_INCREMENT,
		 `question_id` INT( 55 ) NOT NULL,
		 `student_id` INT( 255 ) NOT NULL,
		 `chapter` VARCHAR( 255 ) NOT NULL,
		 `doubt` VARCHAR( 255 ) NOT NULL,
		 `is_answered` INT( 55 ) NOT NULL,
		 `question_image` VARCHAR( 255 ) NOT NULL,
		 `matched_app_questions` TINYINT(1) NULL,
		 PRIMARY KEY ( id )
		 )';
		$result2= $con_w->query($sql2);

		if($result2){
			echo "table created \n";
		}else{
			echo "table already created \n";
		}


		$connStr = "Driver={/opt/amazon/redshiftodbc/lib/64/libamazonredshiftodbc64.so}; Server=rs-prod-dn.cdde349bo4cr.ap-south-1.redshift.amazonaws.com; Database=prodredshift; UID=dn_prod; PWD=D$&frfghjhdghfd321; Port=5439";
		$conn = odbc_pconnect($connStr,"dn_prod","D$&frfghjhdghfd321");

		// $query = odbc_exec($conn, "select *,date(CURRENT_TIMESTAMP-interval '1 day') as actual_ist_date,CURRENT_TIMESTAMP as table_updated_date from classzoo1.questions q where question_id in (select distinct question_id from (select a.*,rank() over(PARTITION by contact_number order by question_id )as rnk from (select  student_id as contact_number,question_id,date(curtimestamp+ interval '330 minute') as date from classzoo1.questions q where student_id>100 and lower(doubt) not like 'web' and lower(doubt) not like 'whatsapp%' and student_id  in (select distinct contact_number from(select  student_id as contact_number,min(date(curtimestamp+ interval '330 minute')) aquired_date from classzoo1.questions q where student_id>100 and lower(doubt) not like 'web' and lower(doubt) not like 'whatsapp%' group by 1 having min(date(curtimestamp+ interval '330 minute')) = date(CURRENT_TIMESTAMP-interval'1 day'))) and date(curtimestamp+ interval '330 minute') = date(CURRENT_TIMESTAMP-interval'1 day') group by 1,2,3)a)b where rnk=1) limit 400");
		$query = odbc_exec($conn, "select * from (select q.*,rank() over(PARTITION by q.student_id order by question_id )as rnk from classzoo1.questions_new q join classzoo1.students s on q.student_id = s.student_id and date(q.curtimestamp+ interval '330 minute') = date(s.curtimestamp+ interval '330 minute') where q.student_id>100 and lower(doubt) not like 'web' and lower(doubt) not like 'whatsapp%' and date(q.curtimestamp+ interval '330 minute') = date(CURRENT_TIMESTAMP-interval'0 day') and q.curtimestamp+ interval '330 minute' between (CURRENT_TIMESTAMP+interval '330 minute')-interval '1 hour' and  (CURRENT_TIMESTAMP+interval '330 minute')-interval '0 hour') where rnk=1 limit 400");
		// $data = array();
		// $i = 0;
		 while($row = odbc_fetch_array($query)){
			
			if($row['question_id']!= null){
				//foreach ($row as $key => $value) {
					// $data[$i][$key] = $value;
					 echo $row['question_id']."\n";
					 $sql3 = "INSERT INTO `user_first_questions` ( question_id, student_id, chapter, doubt, is_answered, question_image, matched_app_questions) VALUES ('".$row["question_id"]."', '".$row["student_id"]."', '".$row["chapter"]."', '".$row["doubt"]."', '".$row["is_answered"]."', '".$row["question_image"]."', '".$row["matched_app_questions"]."' )";
					 $result3= $con_w->query($sql3);
					 if($result3){
					 	echo "Inserted into table"."\n";
					 }
				//}
			}
		//     $i++;
		 }

$date = new DateTime();

echo "User first questions ran successfully at " . $date->format("y:m:d h:i:s") ."\n";
}catch(Exception $e){
    var_dump($e);
}finally {
    mysqli_close($con_w);
    odbc_close($conn);
}

?>
