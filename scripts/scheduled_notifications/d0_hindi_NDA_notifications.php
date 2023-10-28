<?php

require 'config.php';


function sendScheduledNotification($users,$message) {
    $url = "https://micro.internal.doubtnut.com/api/newton/notification/send";
    $fields = array(
      'user' => $users,
      'notificationInfo' => $message
    );
    // print_r($fields);
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


// $connStr = "Driver={/opt/amazon/redshift/lib/libamazonredshiftodbc.dylib}; Server=".REDSHIFT_SERVER."; Database=".REDSHIFT_DB."; UID=".REDSHIFT_UID."; PWD=".REDSHIFT_PASSWORD."; Port=".REDSHIFT_PORT."";
$connStr = "Driver={/opt/amazon/redshiftodbc/lib/64/libamazonredshiftodbc64.so}; Server=".REDSHIFT_SERVER."; Database=".REDSHIFT_DB."; UID=".REDSHIFT_UID."; PWD=".REDSHIFT_PASSWORD."; Port=".REDSHIFT_PORT."";
$conn = odbc_pconnect($connStr,REDSHIFT_UID,REDSHIFT_PASSWORD);


//sending notification for hindi users
$regidsHindi6 = array();
$regidsHindi7 = array();
$regidsHindi8 = array();
$regidsHindi9 = array();
$regidsHindi10 = array();
$regidsHindi11 = array();
$regidsHindi12 = array();
$query = odbc_exec($conn, "select student_id, gcm_reg_id, student_class from classzoo1.students where to_date(curtimestamp+ interval '330 minutes', 'YYYY|MM|DD') = CURRENT_DATE and locale ='hi' and gcm_reg_id is not null");
// $query = odbc_exec($conn, "select student_id, gcm_reg_id, student_class from classzoo1.students where mobile=9899032961");
while($row = odbc_fetch_array($query)){
    var_dump($row);
    $stu = array(
        "id"=> $row["student_id"],
        "gcmId"=> $row["gcm_reg_id"]
      );
    if ($row["gcm_reg_id"] && $row["student_class"] =='6') {
        $regidsHindi6[] = $stu;
    }elseif($row["gcm_reg_id"] && $row["student_class"] == '7'){
        $regidsHindi7[] = $stu;
    }elseif($row["gcm_reg_id"] && $row["student_class"] == '8'){
        $regidsHindi8[] = $stu;
    }elseif($row["gcm_reg_id"] && $row["student_class"] == '9'){
        $regidsHindi9[] = $stu;
    }elseif($row["gcm_reg_id"] && $row["student_class"] == '10'){
        $regidsHindi10[] = $stu;
    }elseif($row["gcm_reg_id"] && $row["student_class"] == '11'){
        $regidsHindi11[] = $stu;
    }elseif($row["gcm_reg_id"] && $row["student_class"] == '12'){
        $regidsHindi12[] = $stu;
    }
}

if(count($regidsHindi6) > 0){
    $data['playlist_id'] = 119701;
    $data['class'] = null;
    $data['playlist_title'] = 'NCERT गणित ';
    $data['is_last'] = '0';
    $message_to_send2 = array(
        "event" => "playlist",
        "title" => 'Padhaayi banaao asaan NCERT MATHS ke sath📚',
        "message" => 'Sirf DOUBTNUT par milega🙅‍♂️COMPLETE BOOK SOLUTION😮️',
        "image" => '',
        "data" => json_encode($data),
        "s_n_id" => '6NCERT042',
        "firebase_eventtag" => '6NCERT042'
      );
    sendScheduledNotification($regidsHindi6, $message_to_send2);
}elseif(count($regidsHindi7) > 0){
        $data['playlist_id'] = 119703;
        $data['class'] = null;
        $data['playlist_title'] = 'NCERT गणित ';
        $data['is_last'] = '0';
        $message_to_send2 = array(
            "event" => "playlist",
            "title" => 'Padhaayi banaao asaan NCERT MATHS ke sath📚',
            "message" => 'Sirf DOUBTNUT par milega🙅‍♂️COMPLETE BOOK SOLUTION😮️',
            "image" => '',
            "data" => json_encode($data),
            "s_n_id" => '7NCERT042',
            "firebase_eventtag" => '7NCERT042'
          );
        sendScheduledNotification($regidsHindi7, $message_to_send2);
}elseif(count($regidsHindi8) > 0){
    $data['playlist_id'] = 119702;
    $data['class'] = null;
    $data['playlist_title'] = 'NCERT गणित ';
    $data['is_last'] = '0';
    $message_to_send2 = array(
        "event" => "playlist",
        "title" => 'Padhaayi banaao asaan NCERT MATHS ke sath📚',
        "message" => 'Sirf DOUBTNUT par milega🙅‍♂️COMPLETE BOOK SOLUTION😮️',
        "image" => '',
        "data" => json_encode($data),
        "s_n_id" => '8NCERT042',
        "firebase_eventtag" => '8NCERT042'
      );
    sendScheduledNotification($regidsHindi8, $message_to_send2);
}elseif(count($regidsHindi9) > 0){
    $data['playlist_id'] = 119699;
    $data['class'] = null;
    $data['playlist_title'] = 'NCERT गणित ';
    $data['is_last'] = '0';
    $message_to_send2 = array(
        "event" => "playlist",
        "title" => 'Padhaayi banaao asaan NCERT MATHS ke sath📚',
        "message" => 'Sirf DOUBTNUT par milega🙅‍♂️COMPLETE BOOK SOLUTION😮️',
        "image" => '',
        "data" => json_encode($data),
        "s_n_id" => '9NCERT042',
        "firebase_eventtag" => '9NCERT042'
      );
    sendScheduledNotification($regidsHindi9, $message_to_send2);
}elseif(count($regidsHindi10) > 0){
    $data['playlist_id'] = 119700;
    $data['class'] = null;
    $data['playlist_title'] = 'NCERT गणित ';
    $data['is_last'] = '0';
    $message_to_send2 = array(
        "event" => "playlist",
        "title" => 'Padhaayi banaao asaan NCERT MATHS ke sath📚',
        "message" => 'Sirf DOUBTNUT par milega🙅‍♂️COMPLETE BOOK SOLUTION😮️',
        "image" => '',
        "data" => json_encode($data),
        "s_n_id" => '10NCERT042',
        "firebase_eventtag" => '10NCERT042'
      );
    sendScheduledNotification($regidsHindi10, $message_to_send2);
}elseif(count($regidsHindi11) > 0){
    $data['playlist_id'] = 119697;
    $data['class'] = null;
    $data['playlist_title'] = 'NCERT गणित ';
    $data['is_last'] = '0';
    $message_to_send2 = array(
        "event" => "playlist",
        "title" => 'Padhaayi banaao asaan NCERT MATHS ke sath📚',
        "message" => 'Sirf DOUBTNUT par milega🙅‍♂️COMPLETE BOOK SOLUTION😮️',
        "image" => '',
        "data" => json_encode($data),
        "s_n_id" => '11NCERT042',
        "firebase_eventtag" => '11NCERT042'
      );
    sendScheduledNotification($regidsHindi11, $message_to_send2);
}elseif(count($regidsHindi12) > 0){
    $data['playlist_id'] = 119698;
    $data['class'] = '12';
    $data['playlist_title'] = 'NCERT गणित ';
    $data['is_last'] = '0';
    $message_to_send2 = array(
        "event" => "playlist",
        "title" => 'Padhaayi banaao asaan NCERT MATHS ke sath📚',
        "message" => 'Sirf DOUBTNUT par milega🙅‍♂️COMPLETE BOOK SOLUTION😮️',
        "image" => '',
        "data" => json_encode($data),
        "s_n_id" => '12NCERT042',
        "firebase_eventtag" => '12NCERT042'
      );
    sendScheduledNotification($regidsHindi12, $message_to_send2);
}

//sending notification for NDA users
$regidsNDA = array();
$query = odbc_exec($conn, "select DISTINCT(a.student_id),a.gcm_reg_id from (select student_id, gcm_reg_id, student_class from classzoo1.students where to_date(curtimestamp+ interval '330 minutes', 'YYYY|MM|DD') = CURRENT_DATE and gcm_reg_id is not null) as a left join (select * from classzoo1.student_course_mapping) as b on a.student_id=b.student_id left join (select * from classzoo1.class_course_mapping where course='NDA' AND category = 'exam') as c on c.id=b.ccm_id where c.id is not null and b.student_id is not null");
// $query = odbc_exec($conn, "select student_id, gcm_reg_id, student_class from classzoo1.students where mobile=9899032961");
while($row = odbc_fetch_array($query)){
    $stu = array(
        "id"=> $row["student_id"],
        "gcmId"=> $row["gcm_reg_id"]
      );
      $regidsNDA[] = $stu;
}
if(count($regidsNDA) > 0){
    $data['playlist_id'] = 120797;
    $data['class'] = null;
    $data['playlist_title'] = 'Pathfinder';
    $data['is_last'] = '0';
    $message_to_send2 = array(
        "event" => "playlist",
        "title" => 'Padhaayi banaao asaan Pathfinder  ke sath📚',
        "message" => 'Sirf DOUBTNUT par milega🙅‍♂️COMPLETE BOOK SOLUTION😮️',
        "image" => 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/8E4E7B5F-CE62-C450-EECD-BFA700EC96E2.webp',
        "data" => json_encode($data),
        "s_n_id" => 'NDA042',
        "firebase_eventtag" => 'NDA042'
      );
    sendScheduledNotification($regidsNDA, $message_to_send2);
}
odbc_close($conn);
$date = new DateTime();
echo "send push notification ran successfully at " . $date->format("y:m:d h:i:s") . "\n";
///opt/amazon/redshiftodbc/lib/64/libamazonredshiftodbc64.so
?>