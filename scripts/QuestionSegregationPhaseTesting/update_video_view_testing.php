<?php
$conR = new mysqli("test-db-uday.cpymfjcydr4n.ap-south-1.rds.amazonaws.com","dn-prod","D0ubtnut@2143","classzoo1");
date_default_timezone_set('Asia/Kolkata');
mysqli_set_charset($conR, "utf8");

function update($view_id, $video_time, $engage_time){
	$curl = curl_init();

	curl_setopt_array($curl, array(
	  CURLOPT_URL => "http://neil.doubtnut.com/v3/answers/update-answer-view",
	  CURLOPT_RETURNTRANSFER => true,
	  CURLOPT_ENCODING => "",
	  CURLOPT_MAXREDIRS => 10,
	  CURLOPT_TIMEOUT => 30,
	  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
	  CURLOPT_CUSTOMREQUEST => "POST",
	  CURLOPT_POSTFIELDS => "view_id=".$view_id."&video_time=".$video_time."&engage_time=".$engage_time."&is_back=0",
	  CURLOPT_HTTPHEADER => array(
	    "cache-control: no-cache",
	    "content-type: application/x-www-form-urlencoded",
	    "postman-token: c5d55c10-b996-3ffa-6538-8e1836a02a0c",
	    "x-auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjUyNDY0MSwiaWF0IjoxNTcxOTA5Mzg3LCJleHAiOjE2MzQ5ODEzODd9.xTMTMW1bF2KpQcIcC1TCIrimevK7kM-GzIQ0sMqqtZQ"
	  ),
	));

	$response = curl_exec($curl);
	$err = curl_error($curl);

	curl_close($curl);

	if ($err) {
	  echo "cURL Error #:" . $err;
	} else {
	  echo $response;
	}
}
//At the end of string , select count(*) from video_view_logs where video_time =3; : should be 5500

try{
  $sql="select * from video_view_logs";
  // $sql="select * from students where student_id=4739249 and gcm_reg_id is not null";
  $result = $conR->query($sql);
  if ($result->num_rows > 0) {
    // output data of each row
    while ($row = $result->fetch_assoc()) {
      update($row["view_id"],4,11);
    }
  }
}catch (Exception $e) {
  echo "Exception";
  print_r($e);
  echo "\n";
}finally {
    $conR->close();
}