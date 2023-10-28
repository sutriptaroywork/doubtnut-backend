<?php
ini_set("memory_limit", "-1");
ini_set('max_execution_time', 18000);
ini_set('mysql.connect_timeout', 300);
ini_set('default_socket_timeout', 300);

require 'vendor/autoload.php'; // If you're using Composer (recommended)
require './config.php';

#$connStr = "Driver={/opt/amazon/redshiftodbc/lib/64/libamazonredshiftodbc64.so}; Server=".REDSHIFT_SERVER."; Database=".REDSHIFT_DB."; UID=".REDSHIFT_UID."; PWD=".REDSHIFT_PASSWORD."; Port=".REDSHIFT_PORT."";
#$connRedshift = odbc_pconnect($connStr,REDSHIFT_UID,REDSHIFT_PASSWORD);
$connStr = "Driver={/opt/amazon/redshiftodbc/lib/64/libamazonredshiftodbc64.so}; Server=rs-prod-dn.cdde349bo4cr.ap-south-1.redshift.amazonaws.com; Database=prodredshift; UID=dn_prod; PWD=D$&frfghjhdghfd321; Port=5439";
$connRedshift = odbc_pconnect($connStr,"dn_prod","D$&frfghjhdghfd321");
function sendScheduledNotification($users,$message, $country_code) {
    $url = "https://micro.internal.doubtnut.com/api/newton/notification/send";
    if($country_code == 'US') {
      //
      $url = 'http://newton.dn-us.internal:3000/notification/send';
    }
    $fields = array(
      'user' => $users,
      'notificationInfo' => $message
    );
    // print_r($users);
    echo "no of users".count($users);
    var_dump($message);
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

  function verifyRedshiftQueryRequest($query){
    echo "123";
    echo $query;
    $url = "http://172.31.24.221:3000/query/redshift/test";
    $fields = array(
      'query' => $query
    );
    $headers = array(
      'Content-Type: application/json'
    );
//  /print_r($fields);exit;
    // Open connection
    $ch = curl_init();

    // Set the url, number of POST vars, POST data
    curl_setopt($ch, CURLOPT_URL, $url);

    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // curl_setopt($ch, CURLOPT_TIMEOUT, 0);
    // Disabling SSL Certificate support temporarly
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));

    // Execute post
    $result = curl_exec($ch);
    #print_r($result);
    $result=json_decode($result);
    //print_r($result->{'result'});
    if ($result === FALSE) {
      die('Curl failed: ' . curl_error($ch));
    }
    // Close connection
    curl_close($ch);

    return $result;
}


function sendMail(){
  $email = new \SendGrid\Mail\Mail();
  $email->setFrom("autobot@doubtnut.com");
  $email->setSubject("Something wrong in schedule notification!!");
  $email->addTo("uday@doubtnut.com");
  $email->addTo("gunjan@doubtnut.com");
  $email->addTo("tech-alerts@doubtnut.com");
  // $email->addContent("text/plain", "and easy to do anywhere, even with PHP");
  $email->addContent(
      "text/html", "<p>Something wrong in schedule notification!!</p>"
  );
  $sendgrid = new \SendGrid(SENDGRID_KEY);
  try {
      $response = $sendgrid->send($email);
      print $response->statusCode() . "\n";
      print_r($response->headers());
      print $response->body() . "\n";
  } catch (Exception $e) {
    echo 'Caught exception: '. $e->getMessage() ."\n";
  }

}


function upsertTrending($id, $question_id, $class, $conn)
{
  //check if value exists
  $sql = "select * from trending_video_logs where notification_id = " . $id;
  $result = $conn->query($sql);
  if ($result->num_rows > 0) {
    //update
    $sql = "update trending_video_logs set question_id=" . $question_id . " , class =" . $class . " where notification_id = " . $id;
    return $conn->query($sql);
  } else {
    //insert
    $sql = "INSERT INTO trending_video_logs (id,notification_id, question_id, class) VALUES (''," . $id . ", " . $question_id . "," . $class . ")";
    return $conn->query($sql);
  }
}

function updateSent($id,$count,$conn){

    //update
    $sql = "UPDATE scheduled_notification SET sent=" . $count . " WHERE id = " . $id;
    return $conn->query($sql);

}
//
$is_prod = 1;
 //$is_prod = 0;
if ($is_prod) {
  $servername = ANALYTICS_DB_CONN ;
  $username = USERNAME;
  $password = PASSWORD;
  $dbname = DATABASE;
  $write_server_host = PROD_DB_WRITE;
} else {
  $servername = Test_DB_CONNECTION;
  $username = USERNAME;
  $password = PASSWORD;
  $dbname = DATABASE;
}

// sendMail();

// sendMail();
try {
  $conn = new mysqli($servername, $username, $password, $dbname);
  $conn_write = new mysqli($write_server_host, $username, $password, $dbname);
  date_default_timezone_set('Asia/Kolkata');
  mysqli_set_charset($conn, "utf8mb4");
  $hour = date("H");
  $minutes = date("i");

  $sql = "select * from scheduled_notification where is_schedule = 1 and (notification_start_time<=CURDATE() and notification_end_time>=CURDATE()) GROUP BY id DESC";
//  $sql = "select * from scheduled_notification where id= 17467";
  $result = $conn->query($sql);
  // if (false) {
  if ($result->num_rows > 0) {
    // output data of each row
    while ($row = $result->fetch_assoc()) {
        #echo $row['id'];
      $type = $row['type'];
        $query = $row['query'];
        #echo $query;
      $message = $row['message'];
      $image_url = $row['image_url'];
      $title = $row['title'];
      $question_id = $row["question_query"];
      $extra_param = $row["extra_param"];
      $learn_type = $row["learntype"];
      $year = $row["year"];
      $chapter = $row["chapter"];
      $exercise = $row["exercise"];
      $class = $row["class"];
      $course = $row["course"];
      $playlist_title = $row["playlist_title"];
      $url = $row["url"];
      $playlist_id = $row["playlist_id"];
      $entity_id = $row["entity_id"];
      $entity_type = $row["entity_type"];
      $forum_feed_type = $row["forum_feed_type"];
      $downloadpdf_level_one = $row["downloadpdf_level_one"];
      $downloadpdf_level_two = $row["downloadpdf_level_two"];
      $contest_id = $row["contest_id"];
      $firebase_eventtag = $row["firebase_eventtag"];
      $course_id = $row["course_id"];
      $course_detail_id = $row["course_detail_id"];
      $subject = $row["subject"];
      $id = $row['id'];
      $faculty_id = $row['faculty_id'];
      $ecm_id = $row['ecm_id'];
      $chapter_id = $row['chapter_id'];
      $db_type = $row['db_type'];
      $mock_test_subscribe_id =$row['mocktest_id'];
      $post_id  =$row['post_id'];
      $country_code  =$row['country_code'];
      // $db_type=0;
      $allow = false;

      if (strpos($row["hour"], ':') !== false) {
        $timeArray = explode(":", $row["hour"]);
        // if ($timeArray[0] == $hour && $minutes >= 30) {
        //   $allow = true;
        // }
        if ($timeArray[0] == $hour && $minutes >= 0 && $minutes < 15 && $timeArray[1] >= 0 && $timeArray[1] <15) {
          $allow = true;
        }else if($timeArray[0] == $hour && $minutes >= 15 && $minutes < 30 && $timeArray[1] >= 15 && $timeArray[1] <30){
            $allow = true;
        }else if($timeArray[0] == $hour && $minutes >= 30 && $minutes < 45 && $timeArray[1] >= 30 && $timeArray[1] <45){
            $allow = true;
        }else if($timeArray[0] == $hour && $minutes >= 45  && $timeArray[1] >= 45){
            $allow = true;
        }
      } else if($minutes < 15){
        if ($row['hour'] == $hour) {
          $allow = true;
        }
      }
      if (($row['isActive'] && $allow)) {
        $sql2 = $query;
        if($db_type == 1){
          // $result2 = verifyRedshiftQueryRequest($sql2);
          // print_r($result2);
          // $result2 = $result2->{'result'};
          // $result2= array_values($result2);
                $result2 = odbc_exec($connRedshift, $sql2);
                echo "got result";
        }else{
                $result2 = $conn->query($sql2);
                echo "got result";
          // $result2 = $result2->fetchAll();
          // $result2 = $result2 -> fetch_array(MYSQLI_ASSOC)[0];
          // print_r($result2);
          // $result2= array_values($result2);
        }
        if ($question_id != null && $question_id != '') {
          $sql3 = $question_id;
          $result3 = $conn->query($sql3);
          if ($result3->num_rows > 0) {
            $res = $result3->fetch_assoc();
            $question_id = $res["question_id"];
            if(isset($res["final_class"]) && $row['hour'] == 16 && $type == "video"){
              upsertTrending($id, $question_id, $res["final_class"], $conn_write);
            }
          }
        }
        $message_to_send1 = array(
            "message" => $message,
            "image-url" => $image_url,
            "notify-activity" => $row["notify_activity"],
            "page" => $row["extra_param"] ? $row["extra_param"] : "",
            "type" => $row["type"],
            "category" => "marketing",
            "title" => $row["title"],
            "question_id" => $question_id,
            "notify-id" => $row["id"],
            "notify_id" => $row["id"],
            "url" => $row["url"],
            "s_n_id" => $row["id"]
          );

        if ($type == "PLAYLIST PAGE") {

          if ($learn_type) {
            if ($learn_type == 'JEE MAINS') {

              if ($year != 0) {
                $message_to_send1['learntype'] = $learn_type;
                $message_to_send1['year'] = $year;
              }
            } else if ($learn_type == 'JEE ADVANCED') {

              if ($year != 0) {
                $message_to_send1['learntype'] = $learn_type;
                $message_to_send1['year'] = $year;
              }
            } else if ($learn_type == 'XII BOARDS') {
              if ($year != 0) {
                $message_to_send1['learntype'] = $learn_type;
                $message_to_send1['year'] = $year;
              }
            } else if ($learn_type == 'X BOARDS') {
              if ($year != 0) {
                $message_to_send1['learntype'] = $learn_type;
                $message_to_send1['year'] = $year;
              }
            } else if ($learn_type == 'IIT JEE PREP') {

              if (($chapter !== 0) && ($exercise !== 0)) {
                $message_to_send1['learntype'] = $learn_type;
                $message_to_send1['chapter'] = $chapter;
                $message_to_send1['exercise'] = $exercise;
              }
            } else if ($learn_type == 'NCERT ALL CLASSES') {
              if (($chapter !== 0) && ($class !== 0) && ($exercise !== 0)) {
                $message_to_send1['learntype'] = $learn_type;
                $message_to_send1['chapter'] = $chapter;
                $message_to_send1['grade'] = $class;
                $message_to_send1['exercise'] = $exercise;
              }
            }
          }
        }
        $data = [];
        $data["random"]="1";
        if ($type == 'video' || $type == 'course_video') {
          $data['page'] = "NOTIFICATION";
          $data['qid'] = $question_id;
          $data['resource_type'] = ($extra_param == null || $extra_param == '') ? 'video' : $extra_param;
          $message_to_send2 = array(
            "event" => "video",
            "data" => json_encode($data),
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }
        if ($type == 'live_class') {
          $data = [];
          $data["id"]=$question_id;
          $data["page"]="LIVECLASS_NOTIFICATION";
          $message_to_send2 = array(
            "event" => "live_class",
            "title" => $title,
            "message" => $message,
            "data" => json_encode($data),
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }

        if ($type == 'user_journey') {
          $message_to_send2 = array(
            "event" => "user_journey",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }
        if ($type == 'forum_feed') {
          $data["filter"] = $forum_feed_type;
          $message_to_send2 = array(
            "event" => "forum_feed",
            "data" => json_encode($data),
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }

        if ($type == 'test_series') {
          $message_to_send2 = array(
            "event" => "test_series",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }
        if ($type == 'invite') {
          $message_to_send2 = array(
            "event" => "invite",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }
        if($type == "quiz_alert"){
          $message_to_send2 = array(
            "event" => "quiz_alert",
            "data" => json_encode($data),
            "title" => "App update available",
            "message" => "Update App",
            "image" => $image_url,
            "notification_type" => "SILENT_QUIZ_NOTIFICATION",
            "s_n_id" => $row["id"]
          );
        }

        if ($type == 'daily_contest') {
          $message_to_send2 = array(
            "event" => "daily_contest",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }

        if ($type == 'course') {
          $message_to_send2 = array(
            "event" => "course",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }

        if ($type == 'profile') {
          $message_to_send2 = array(
            "event" => "profile",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }


        if ($type == 'feed_details') {
          $data['id'] = $entity_id;
          $data['type'] = $entity_type;
          $message_to_send2 = array(
            "event" => "feed_details",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => $data,
            "s_n_id" => $row["id"]
          );
        }
       if ($type == 'community_question') {
          $data['qid'] = $question_id;

          $message_to_send2 = array(
            "event" => "community_question",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }


        if ($type == 'external_url') {
          $data['url'] = $url;

          $message_to_send2 = array(
            "event" => "external_url",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }
        if ($type == "downloadpdf_level_one") {
          $data["pdf_package"] = $downloadpdf_level_one;
          $message_to_send2 = array(
            "event" => "downloadpdf_level_one",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }

        if ($type == "downloadpdf_level_two") {
          $data["pdf_package"] = $downloadpdf_level_one;
          $data["level_one"] = $downloadpdf_level_two;
          $message_to_send2 = array(
            "event" => "downloadpdf_level_two",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }

       if ($type == "daily_contest_with_contest_id") {
          $data["contest_id"] = $contest_id;
          $message_to_send2 = array(
            "event" => "daily_contest_with_contest_id",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }
        if ($type == "quiz") {
          $message_to_send2 = array(
            "event" => "quiz",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]

          );
        }
        if ($type == "vip") {
          $message_to_send2 = array(
            "event" => "vip",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]

          );
        }

        if ($type == "downloadpdf") {
          $message_to_send2 = array(
            "event" => "downloadpdf",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]

          );
        }
        if ($type == 'camera') {
          $message_to_send2 = array(
            "event" => "camera",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]

          );
        }
       if ($type == 'playlist') {
          if ($learn_type == "JEE MAINS") {
            $data['playlist_id'] = "JEE_MAIN";
            $data['playlist_title'] = $playlist_title;
            $data['is_last'] = $extra_param;
            $message_to_send2 = array(
              "event" => "playlist",
              "title" => $title,
              "message" => $message,
              "image" => $image_url,
              "data" => json_encode($data),
              "s_n_id" => $row["id"],
            );
          }
          if ($learn_type == "JEE ADVANCED") {
            $data['playlist_id'] = "JEE_ADVANCE";
            $data['playlist_title'] = $playlist_title;
            $data['is_last'] = $extra_param;

            $message_to_send2 = array(
              "event" => "playlist",
              "title" => $title,
              "message" => $message,
              "image" => $image_url,
              "data" => json_encode($data),
              "s_n_id" => $row["id"]
            );
          }

          if ($learn_type == "XII Boards") {
            $data['playlist_id'] = "BOARDS_12";
            $data['playlist_title'] = $playlist_title;
            $data['is_last'] = $extra_param;

            $message_to_send2 = array(
              "event" => "playlist",
              "title" => $title,
              "message" => $message,
              "image" => $image_url,
              "data" => json_encode($data),
              "s_n_id" => $row["id"]
            );
          }
          if ($learn_type == "X Boards") {
            $data['playlist_id'] = "BOARDS_10";
            $data['playlist_title'] = $playlist_title;
            $data['is_last'] = $extra_param;
            $message_to_send2 = array(
              "event" => "playlist",
              "title" => $title,
              "message" => $message,
              "image" => $image_url,
              "data" => json_encode($data),
              "s_n_id" => $row["id"]
            );
          }

          if ($learn_type == "NCERT ALL CLASSES") {
            $data['playlist_id'] = "NCERT";
            $data['playlist_title'] = $playlist_title;
            $data['is_last'] = $extra_param;
            $message_to_send2 = array(
              "event" => "playlist",
              "title" => $title,
              "message" => $message,
              "image" => $image_url,
              "data" => json_encode($data),
              "s_n_id" => $row["id"]
            );
          }

          if ($learn_type == "Custom playlist") {
            $data['playlist_id'] = $playlist_id;
            $data['class'] = null;
            //          $data['chapter'] = $chapter;
            //          $data['exercise'] = $exercise;
            $data['playlist_title'] = $playlist_title;
            // $data['is_last'] = "1";
            $data['is_last'] = $extra_param;
            $message_to_send2 = array(
              "event" => "playlist",
              "title" => $title,
              "message" => $message,
              "image" => $image_url,
              "data" => json_encode($data),
              "s_n_id" => $row["id"]
            );
          }

        }
       if ($type == "forum_answered") {

          $message_to_send2 = array(
            "event" => "forum_answered",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }

        if ($type == "forum_stats") {

          $message_to_send2 = array(
            "event" => "forum_stats",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }

        if ($type == "forum_unanswered") {
          $message_to_send2 = array(
            "event" => "forum_unanswered",
            "title" => $title,
            "data" => json_encode($data),
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]

          );
        }


        if ($type == "quiz_15_prompt") {
          $data['qid'] = $question_id;
          $message_to_send2 = array(
            "event" => "quiz_15_prompt",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }

        if ($type == "learn_chapter") {
          $data['class'] = $class;
          $data['course'] = $course;
          $data['chapter'] = $chapter;


          $message_to_send2 = array(
            "event" => "learn_chapter",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }

        if($type == "live_classes"){
          $data['library_screen_selected_Tab'] = '1';
          $data['course_id'] = '0';
          $data['subject'] = $subject;
          $message_to_send2 = array(
            "event" => "live_classes",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }

        if($type == "detail_live_classes"){
          $data['course_id'] = $course_id;
          $data['course_detail_id'] = $course_detail_id;
          $data['subject'] = $subject;
          $message_to_send2 = array(
            "event" => "detail_live_classes",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }
        if($type == 'faculty_details'){
          $data['faculty_id'] = $faculty_id;
          $data['ecm_id']=$ecm_id;
          $message_to_send2 = array(
            "event" => "faculty_details",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }

        if($type == 'course_details'){
          $data['id'] = $chapter_id;
          $message_to_send2 = array(
            "event" => "course_details",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }

        if($type == 'library_course'){
          $message_to_send2 = array(
            "event" => "library_course",
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "data" => json_encode($data),
            "s_n_id" => $row["id"]
          );
        }
        if($type == 'dn_games'){
          $message_to_send2 = array(
            "event" => "dn_games",
            "data" => json_encode($data),
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }
        if ($type == 'mock_test_subscribe') {
          $data["id"]=$mock_test_subscribe_id;
          $message_to_send2 = array(
            "event" => "mock_test_subscribe",
            "title" => $title,
            "message" => $message,
            "data" => json_encode($data),
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }

        if ($type == 'post_detail') {
          $data["post_id"]=$post_id;
          $message_to_send2 = array(
            "event" => "post_detail",
            "title" => $title,
            "message" => $message,
            "data" => json_encode($data),
            "image" => $image_url,
            "s_n_id" => $row["id"]
          );
        }

        if ($type == 'crop_page') {
         
          $data["image_url"] = $extra_param;
          $message_to_send2 = array(
            "event" => "camera",
            "data" => json_encode($data),
            "title" => $title,
            "message" => $message,
            "image" => $image_url,
            "s_n_id" => $row["id"]

          );
        }
        if (($db_type == 0 && $result2->num_rows > 0) || ($db_type == 1 && odbc_num_rows($result2) > 0)) {
          $regids1 = array();
          $regids2 = array();
          $i = 1;
          $j = 1;
          // while ($student = $result2->fetch_assoc()) {
          if($db_type == 1){
            // foreach ($result2 as $student) {
            while($student = odbc_fetch_array($result2)){
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

              $i++;
              $j++;
            }
            odbc_free_result($result2);
          }else{
            while ($student = $result2->fetch_assoc()) {
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

              $i++;
              $j++;
            }
          }


          $totalUsers1 = count($regids1);
          $totalUsers2 = count($regids2);
          $totalUsers =$totalUsers1 + $totalUsers2;


          //update in table here

         if($totalUsers1 > 0){

            $chunks =  array_chunk($regids1, 100000, false);
            foreach ($chunks as $chunk) {
              sendScheduledNotification($chunk, $message_to_send1, $country_code);
            }
          }
          if($totalUsers2 > 0){

            $chunks =  array_chunk($regids2, 100000, false);
            foreach ($chunks as $chunk) {
              $message_to_send2["firebase_eventtag"] = $firebase_eventtag;
              sendScheduledNotification($chunk, $message_to_send2, $country_code);
            }
          }

          if($totalUsers >0){
            updateSent($id,$totalUsers,$conn_write);

          }
        }

      }
    }

  }
  $conn->close();
  $conn_write->close();
  odbc_close($connRedshift);
  $date = new DateTime();
  echo "send push notification ran successfully at " . $date->format("y:m:d h:i:s") . "\n";

} catch (Exception $e) {
  sendMail();
  echo "Exception";
  print_r($e);
  echo "\n";
  $conn->close();
  $conn_write->close();
}

?>
