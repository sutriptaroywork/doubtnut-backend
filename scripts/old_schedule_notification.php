<?php

//include("config.php");
//$con = mysqli_connect("52.187.1.240","name","abc123", "classzoo1");

require 'config.php';

function sendRequest($regids,$message) {
  /*
      $result = $this->celery->PostTask('task2.tasks.notify_answer_done', array($regids, $message, "Doubtnut Update"));
*/
  // Set POST variables
  //$message = array("price" => $message);
  $url = 'https://fcm.googleapis.com/fcm/send';

  $reg = $regids;
  $data = [$message];
  $fields = array(
    'registration_ids' => $reg,
    'data' => $message
  );//print_r($message);
  $headers = array(
    //'Authorization: key=AIzaSyAXu2kaXxlwcRDMKd4qBinskEvsXV18FrM',
    'Authorization: key='.GOOGLE_API_KEY.'',
    'Content-Type: application/json'
  );

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
    die('Curl failed: ' . curl_error($ch));
  }
  // Close connection
  curl_close($ch);

}
$is_prod = 1;
if($is_prod){
  $servername = "52.187.1.240";
  $username = "name";
  $password = "abc123";
  $dbname = "classzoo1";
}else{
  $servername = "13.127.249.21";
  $username = "root";
  $password = "root";
  $dbname = "classzoo1";
}


// Create connection

$conn = new mysqli($servername, $username, $password, $dbname);
date_default_timezone_set('Asia/Kolkata');
mysqli_set_charset($conn,"utf8");
$hour=date("H");
$sql = "select * from scheduled_notification where is_schedule = 1 and (notification_start_time<=CURDATE() and notification_end_time>=CURDATE())";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
  // output data of each row
  while($row = $result->fetch_assoc()) {

    $type = $row['type'];
    $query = $row['query'];
    $message = $row['message'];
    $image_url = $row['image_url'];
    $title = $row['title'];
    $question_id = $row["question_query"];
    $learn_type = $row["learntype"];
    $year = $row["year"];
    $chapter = $row["chapter"];
    $exercise = $row["exercise"];
    $class = $row["class"];
    if($row['isActive'] && $row['hour']==$hour){

      $sql2 = $query;
      $result2 = $conn->query($sql2);
      if($question_id!=null && $question_id!=''){
        $sql3=$question_id;
        $result3 = $conn->query($sql3);
        if ($result3->num_rows > 0) {
          $res = $result3->fetch_assoc();
          $question_id = $res["question_id"];
        }
      }


      $message_to_send = array(
        "message"=>$message,
        "image-url" => $image_url,
        "notify-activity" => $row["notify_activity"],
        "page" => $row["extra_param"] ? $row["extra_param"] : "",
        "type" => $row["type"],
        "category" => "marketing",
        "title" => $row["title"],
        "question_id" => $question_id,
        "notify_id" => $row["id"],
        "notify-id" => $row["id"],
        "url" => $row["url"]
      );
      if($type == "PLAYLIST PAGE") {
        if ($learn_type) {
          if ($learn_type == 'JEE MAINS') {
            //check year
            if ($year != 0) {
              $message_to_send['learntype'] = $learn_type;
              $message_to_send['year'] = $year;
            }
          } else if ($learn_type == 'JEE ADVANCED') {
            //check year
            if ($year != 0) {
              $message_to_send['learntype'] = $learn_type;
              $message_to_send['year'] = $year;
            }
          } else if ($learn_type == 'XII BOARDS') {
            if ($year != 0) {
              $message_to_send['learntype'] = $learn_type;
              $message_to_send['year'] = $year;
            }
          } else if ($learn_type == 'X BOARDS') {
            if ($year != 0) {
              $message_to_send['learntype'] = $learn_type;
              $message_to_send['year'] = $year;
            }
          } else if ($learn_type == 'IIT JEE PREP') {

            if (($chapter !== 0) && ($exercise !== 0)) {
//                            print_r('test');
              $message_to_send['learntype'] = $learn_type;
              $message_to_send['chapter'] = $chapter;
              $message_to_send['exercise'] = $exercise;
            }
          } else if ($learn_type == 'NCERT ALL CLASSES') {
            if (($chapter !== 0) && ($class !== 0) && ($exercise !== 0)) {
              $message_to_send['learntype'] = $learn_type;
              $message_to_send['chapter'] = $chapter;
              $message_to_send['grade'] = $class;
              $message_to_send['exercise'] = $exercise;
            }
          }
        }
      }
      if ($result2->num_rows > 0) {


        $regids = array();
        $i=1;
        while($student = $result2->fetch_assoc()) {
          if ($student["gcm_reg_id"]) {


            //$retu = $this->sendRequest($student["gcm_reg_id"], $message_to_send);
            //var_dump($retu);
            $regids[]= $student["gcm_reg_id"];
          }
          if($i%1000 == 0 || $i == $result2->num_rows){
            $ret = sendRequest($regids, $message_to_send);
            $regids = array();

          }
          $i++;
        }
      }
    }
  }
}
$date = new DateTime();
echo "send push notification ran successfully at ".$date->format("y:m:d h:i:s");
?>