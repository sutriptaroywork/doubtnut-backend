<?php
require 'config.php';

function sendRequest($regids,$message) {
  $url = 'https://fcm.googleapis.com/fcm/send';
  $reg = $regids;
  $data = [$message];print_r($message);
  $fields = array(
    'registration_ids' => $reg,
    'data' => $message
  );
  $headers = array(
    'Authorization: key=' . GOOGLE_API_KEY . '',
    'Authorization: key='.GOOGLE_API_KEY.'',
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


$is_prod = 0;


if($is_prod){
  $servername = "52.187.1.240";
  $username = "name";
  $password = "abc123";
  $dbname = "classzoo1";

}else{
  $servername = Test_DB_CONNECTION;
  $username = USERNAME;
  $password = PASSWORD;
  $dbname = DATABASE;
}


// Create connection

$conn = new mysqli($servername, $username, $password, $dbname);

date_default_timezone_set('Asia/Kolkata');


$hour=date("H");

$sql = "select * from scheduled_notification where is_schedule = 1 and (notification_start_time<=CURDATE() and notification_end_time>=CURDATE())";

$result = $conn->query($sql);

if ($result->num_rows > 0) {
  $row = $result->fetch_assoc();

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

    $course=$row["course"];
    $url=$row["url"];
    $qid="";
    if($row['isActive'] && $row['hour']==$hour){

      $sql2 = $query;
      $result2 = $conn->query($sql2);
      if($question_id!=null && $question_id!=''){
        $sql3=$question_id;
        $result3 = $conn->query($sql3);
        if ($result3->num_rows > 0) {
          $res = $result3->fetch_assoc();
          $question_id = $res["question_id"];
          $qid=$question_id;
        }
      }


      $message_to_send = array();

      if ($type == 'video') {
        $data = new stdClass();
        $data->page = "NOTIFICATION";
        $data->qid = $qid;

        $message_to_send = array(
          "event" => "video",
          "data" => json_encode($data),
          "title" => $title,
          "message" => $message,
          "image" => $image_url
        );
      }

      if ($type == 'app_share') {
        $message_to_send = array(
          "event" => "app_share",
          "title" => $title,
          "message" => $message,
          "image" => $image_url,
          "button_action" => "www.google.com",
          "button_label" => "Share this app"
        );
      }


      if ($type == 'video_share') {
        $data = new stdClass();
        $data->page = "REFER";
        $data->qid = $qid;

        $message_to_send = array(
          "event" => "video_share",
          "title" => $title,
          "message" => $message,
          "image" => $image_url,
          "button_action" => "www.google.com",
          "button_label" => "Share this video",
          "data" => json_encode($data)

        );
      }


      if ($type == 'external_url') {
        $data = new stdClass();
        $data->url = $url;

        $message_to_send = array(
          "event" => "external_url",
          "title" => $title,
          "message" => $message,
          "image" => $image_url,
          "data" => json_encode($data)
        );
      }

      if ($type == 'camera') {


        $message_to_send = array(
          "event" => "camera",
          "title" => $title,
          "message" => $message,
          "image" => $image_url

        );
      }

      if ($type == 'question_of_the_day') {


        $message_to_send = array(
          "event" => "question_of_the_day",
          "title" => $title,
          "message" => $message,
          "image" => $image_url
        );
      }

      if ($type == 'playlist') {
        if ($learn_type == "JEE MAINS") {
          $data = new stdClass();
          $data->playlist_id = "JEE_MAIN";
          $data->year = $year;

          $message_to_send = array(
            "event" => "playlist",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data)
          );
        }

        if ($learn_type == "JEE ADVANCE") {
          $data = new stdClass();

          $data->playlist_id = "JEE_Advance";
          $data->year = $year;

          $message_to_send = array(
            "event" => "playlist",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data)
          );
        }


        if ($learn_type == "XII Boards") {
          $data = new stdClass();

          $data->playlist_id = "BOARDS_12";
          $data->year = $year;

          $message_to_send = array(
            "event" => "playlist",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data)
          );
        }


        if ($learn_type == "X Boards") {
          $data = new stdClass();

          $data->playlist_id = "BOARDS_10";
          $data->year = $year;

          $message_to_send = array(
            "event" => "playlist",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data)
          );
        }


        if ($learn_type == "NCERT ALL CLASSES") {
          $data = new stdClass();

          $data->playlist_id = "BOARDS_10";
          $data->class = $class;
          $data->chapter = $chapter;
          $data->exercise = $exercise;

          $message_to_send = array(
            "event" => "playlist",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data)
          );
        }



      }

      if ($type == "forum_answered") {

        $data = new stdClass();

        $data->qid = $qid;
        $data->page = "NOTIFICATION";

        $message_to_send = array(
          "event" => "forum_answered",
          "title" => $title,
          "message" => $message,
          "image" => $image_url,
          "data" => json_encode($data)
        );
      }

      if ($type == "forum") {

        $message_to_send = array(
          "event" => "forum",
          "title" => $title,
          "message" => $message,
          "image" => $image_url
        );
      }

      if ($type == "forum_unanswered") {
        $data = new stdClass();
        $data->qid = $qid;
        $message_to_send = array(
          "event" => "forum_unanswered",
          "title" => $title,
          "message" => $message,
          "image" => $image_url,
          "data" => json_encode($data)
        );
      }

      if ($type == "quiz_15_prompt") {
        $data = new stdClass();
        $data->qid = $qid;
        $message_to_send = array(
          "event" => "quiz_15_prompt",
          "title" => $title,
          "message" => $message,
          "image" => $image_url,
          "data" => json_encode($data)
        );
      }

      if ($type == "learn_chapter") {
        $data = new stdClass();
        $data->class = $class;
        $data->course = $course;
        $data->chapter = $chapter;


        $message_to_send = array(
          "event" => "learn_chapter",
          "title" => $title,
          "message" => $message,
          "image" => $image_url,
          "data" => json_encode($data)
        );
      }

      if ($type == "microconcept") {
        $data = new stdClass();

        $data->page = "NOTIFICATION";
        $data->qid = $qid;


        $message_to_send = array(
          "event" => "microconcept",
          "title" => $title,
          "message" => $message,
          "image" => $image_url,
          "data" => json_encode($data)
        );

      }


      print_r($message_to_send);

      /* Sending notification now */
      if ($result2->num_rows > 0) {
        $regids = array();
        $i=1;
        while($student = $result2->fetch_assoc()) {
          if ($student["gcm_reg_id"]) {
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
//}

$date = new DateTime();

echo "send push notification ran successfully at ".$date->format("y:m:d h:i:s");
?>
