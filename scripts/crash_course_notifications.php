<?php
ini_set("memory_limit", "-1");
ini_set('max_execution_time', 18000);
ini_set('mysql.connect_timeout', 300);
ini_set('default_socket_timeout', 300);
require 'config.php';


function sendScheduledNotification($users,$message) {
    $url = "https://micro.internal.doubtnut.com/api/newton/notification/send";
    $fields = array(
      'user' => $users,
      'notificationInfo' => $message
    );
    // print_r($fields);
    echo "no of users".count($users);
    // var_dump($users);
    $headers = array(
      'Content-Type: application/json'
    );
    // Open connection
    $ch = curl_init();

    // Set the url, number of POST vars, POST data
    curl_setopt($ch, CURLOPT_URL, $url);

    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    // Disabling SSL Certificate support temporarly
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));

    // Execute post
    $result = curl_exec($ch);
    if ($result === FALSE) {
      echo('Curl failed: ' . curl_error($ch));
      sendMail();
    } 
    print_r($result);
    // Close connection
    curl_close($ch);

    return $result;
  }

  $servername = ANALYTICS_DB_CONN;
  $username = USERNAME;
  $password = PASSWORD;
  $dbname = DATABASE;
  $conn = new mysqli($servername, $username, $password, $dbname);

  $sql = "select timestamp, is_new_app, gcm_reg_id, student_id from students where gcm_reg_id is not NULL and student_class in (11,12) and (app_version like '6%' or app_version like '7%') and app_version not like '7.4.1' order by student_id desc";
 // $sql = "select * from students where mobile in ('9899032961', '7838740548', '8588829810')";
  $result = $conn->query($sql);
  echo $result->num_rows;
  //update query
  $data = [];
  $data['firebase_eventtag'] ="12VID102204";
  $data['library_screen_selected_Tab'] = "1";
  $data['course_id']="0";
  $data['subject']="maths";
  $data['url'] = "https://play.google.com/store/apps/details?id=com.doubtnutapp";
  $message_to_send2 = array(
    "event" => "external_url",
    "data" => json_encode($data),
    "title" => "JEE Main Crash Course Live Now! 🔥🔥",
    "message" => "Abhi Check Karen 😃 😃",
    "image" => "https://d10lpgp6xz60nq.cloudfront.net/images/crash_221020191230.webp",
    "firebase_eventtag"=> "12VID102204"
  );

  // if (false) {
  if ($result->num_rows > 0) {
  	$regids1 = array();
    // output data of each row
    while ($row = $result->fetch_assoc()) {
	   $stu = array(
          "id"=> $row['student_id'],
          "gcmId"=> $row['gcm_reg_id']
        );
      $regids1[] = $stu;
	  }
    if(count($regids1) > 0){
      $chunks =  array_chunk($regids1, 100000, false);
      foreach ($chunks as $chunk) {
        sendScheduledNotification($chunk, $message_to_send2);
      }
    }
  }