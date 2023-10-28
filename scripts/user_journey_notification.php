<?php

require 'config.php';
function sendRequest($regids, $message)
{
  $url = 'https://fcm.googleapis.com/fcm/send';
  $reg = $regids;
  $data = [$message];
  $fields = array(
    'registration_ids' => $reg,
    'data' => $message
  );
  $headers = array(
    'Authorization: key=' . GOOGLE_API_KEY . '',
    'Content-Type: application/json'
  );
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
  $result = curl_exec($ch);
  if ($result === FALSE) {
    die('Curl failed: ' . curl_error($ch));
  }
  curl_close($ch);
}

function sendScheduledNotification($users,$message) {
  $url = "https://micro.internal.doubtnut.com/api/newton/notification/send";
  $fields = array(
    'user' => $users,
    'notificationInfo' => $message
  );
  // print_r($fields);
  echo "no of users".count($users);
  var_dump($message);die;
  // $headers = array(
  //   'Content-Type: application/json'
  // );
  // // Open connection
  // $ch = curl_init();

  // // Set the url, number of POST vars, POST data
  // curl_setopt($ch, CURLOPT_URL, $url);

  // curl_setopt($ch, CURLOPT_POST, true);
  // curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  // curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

  // // Disabling SSL Certificate support temporarly
  // curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  // curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));

  // // Execute post
  // $result = curl_exec($ch);
  // if ($result === FALSE) {
  //   echo('Curl failed: ' . curl_error($ch));
  //   sendMail();
  // }
  // print_r($result);
  // // Close connection
  // curl_close($ch);

  // return $result;
}

$servername = ANALYTICS_DB_CONN;
$username = USERNAME;
$dbname = DATABASE;
$password = PASSWORD;
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully";
date_default_timezone_set('Asia/Kolkata');
mysqli_set_charset($conn, "utf8");
$sql = "select * from user_notification where id = 14";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
  while ($row = $result->fetch_assoc()) {
    if ($row["isActive"]) {
      //$regids = array();
      //$regids[] = "c7xd2n9daiI:APA91bGLZxU-Tf5RfsoQhHhY1GCo5JKQ6xrUSV4skrYRUfvVRdgq9Y8wC1hFGe4ArnFi4V5UpdEFburV88cXM1gHOi4OUrvsJnYf0VthDGBvFZQ229rxS99dV4wFBRdyHL7cXp4kieimRwxaRml4GUgKV_e1_9bj3Q";
      $message_to_send = array(
        "message" => $row["message"],
        "image-url" => $row["image_url"],
        "notify-activity" => "com.doubtnutapp.ui.Home.CameraActivity",
        "page" => "",
        "type" => "CAMERA PAGE",
        "category" => "marketing",
        "title" => $row["title"],
        "notify_id" => $row['id'],
        "notify-id" => $row['id']
      );
      $message_to_send2 = array(
        "message" => $row["message"],
        "image" => $row["image_url"],
        "title" => $row["title"],
        "event" => "user_journey"

      );
//print_r($message_to_send);
//exit;
      $result2 = $conn->query("select gcm_reg_id,is_new_app, timestamp from students where  student_id not in (select distinct student_id from `questions` where date(timestamp)>date_sub(CURRENT_DATE,INTERVAL 1 DAY)) and is_web=0 and gcm_reg_id is not null ORDER BY `students`.`student_id` DESC");
//      $result2 = $conn->query("select gcm_reg_id from students where mobile ='9873434911'");
      if ($result2->num_rows > 0) {
        $regids1 = array();
        $regids2 = array();
        $i = 1;
        $j = 1;
        while ($student = $result2->fetch_assoc()) {
          $timeSplit = explode(" ", $student["timestamp"]);
          $student_date = date($timeSplit[0]);
          $curr_date = date("Y-m-d");
          $date1=date_create($student_date);
          $date2=date_create($curr_date);
          $diff=date_diff($date1,$date2);
          if($diff->days >= 0){
            $stu = array(
              "id"=> $student["student_id"],
              "gcmId"=> $student["gcm_reg_id"]
            );
            if ($student["is_new_app"] == 1) {
              if ($student["gcm_reg_id"]) {
                $regids2[] = $stu;
              }
            } else {
              if ($student["gcm_reg_id"]) {
                $regids1[] = $stu;
              }
            }

            // if ($i % 1000 == 0 || $i == $result2->num_rows) {
            //   $ret1 = sendRequest($regids1, $message_to_send);
            //   $regids1 = array();
            // }
            // if ($j % 1000 == 0 || $j == $result2->num_rows) {
            //   $ret2 = sendRequest($regids2, $message_to_send2);
            //   $regids2 = array();
            // }
          }
          $i++;
          $j++;
        }
        $totalUsers1 = count($regids1);
        $totalUsers2 = count($regids2);
        $totalUsers =$totalUsers1 + $totalUsers2;


        //update in table here

       if($totalUsers1 > 0){

          $chunks =  array_chunk($regids1, 100000, false);
          foreach ($chunks as $chunk) {
            sendScheduledNotification($chunk, $message_to_send1);
          }
        }
        if($totalUsers2 > 0){

          $chunks =  array_chunk($regids2, 100000, false);
          foreach ($chunks as $chunk) {
            $message_to_send2["firebase_eventtag"] = $firebase_eventtag;
            sendScheduledNotification($chunk, $message_to_send2);
          }
        }
      }
    }
  }
}
$date = new DateTime();
echo "send push notification ran successfully at " . $date->format("y:m:d h:i:s");
$conn->close();
?>
