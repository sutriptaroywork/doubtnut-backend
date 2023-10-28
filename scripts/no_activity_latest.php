<?php
ini_set("memory_limit", "-1");
ini_set('max_execution_time', 18000);
ini_set('mysql.connect_timeout', 300);
ini_set('default_socket_timeout', 300);
require 'config.php';

function sendRequest($regids, $message)
{

    $url = 'https://fcm.googleapis.com/fcm/send';
    $reg = $regids;
    $data = [$message];
    $fields = array(
        'registration_ids' => $reg,
        'data' => $message
    );//print_r($message);
    $headers = array(
        //'Authorization: key=AIzaSyAXu2kaXxlwcRDMKd4qBinskEvsXV18FrM',
        'Authorization: key=' . GOOGLE_API_KEY . '',
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


function create_notification($title, $message, $image, $st_query, $event, $event_tag, $data_name_1, $data_value_1, $data_name_2, $data_value_2, $data_name_3, $data_value_3){
$servername = ANALYTICS_DB_CONN;
$username = USERNAME;
$password = PASSWORD;
$dbname = DATABASE;
$conn = new mysqli($servername, $username, $password, $dbname);
date_default_timezone_set('Asia/Kolkata');
mysqli_set_charset($conn, "utf8");
$hour = date("H");
$sql = $st_query;

$result = $conn->query($sql);
if ($result->num_rows > 0) {
    $i = 1;
    $regids1 = array();

    $data = [];
    
    if($data_name_1 != ''){
            $data[$data_name_1]=$data_value_1;
    }
    
    if($data_name_2 != ''){
            $data[$data_name_2]=$data_value_2;
    }
    
    if($data_name_3 != ''){
            $data[$data_name_3]=$data_value_3;
    }
    
 if (count($data)>0){
    $message_to_send = array(
        "event" => $event,
        "title" => $title,
        "message" => $message,
        "image" => $image,
        "firebase_eventtag" => $event_tag,
        "data" => json_encode($data)
    );
    }
    
    else{
    $message_to_send = array(
        "event" => $event,
        "title" => $title,
        "message" => $message,
        "image" => $image,
        "firebase_eventtag" => $event_tag
    );
    }




    while ($row = $result->fetch_assoc()) {
        if ($row["gcm_reg_id"]) {
            $stu = array(
                "id"=> $row["student_id"],
                "gcmId"=> $row["gcm_reg_id"]
              );
            $regids1[] = $stu;
        }
    }
    sendScheduledNotification($regids1, $message_to_send);
}
$conn->close();

}



function main(){

// TO BE RUN EVERY 15 MINUTES


//If they havent asked a question in first 30 min --- TO BE RUN EVERY 15 MINUTES
create_notification('क्या आप अपना पहले सवाल पूछने के लिए तैयार है ?', '1..2...3..  let\'s go! अभी पुछिये अपना पहला सवाल :)','','SELECT a.student_id, a.timestamp, a.gcm_reg_id from (SELECT * FROM students where timestamp >= date_sub(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE) and timestamp <= date_sub(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE) and is_web=0) as a left JOIN (select student_id, max(timestamp) as max_t from questions_new where timestamp>=date_sub(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE) group by student_id) as b on a.student_id = b.student_id where b.student_id is null', 'camera','M30_0Q', '','', '','','','');

//Run at fixed intervals and check students who came 1 hrs before but hasnt watched a match
create_notification('क्या आप अपना पहले सवाल पूछने के लिए तैयार है ?', '1..2...3..  let\'s go! अभी पुछिये अपना पहला सवाल :)','','SELECT a.student_id, a.timestamp, a.gcm_reg_id from (SELECT * FROM students where timestamp >= date_sub(CURRENT_TIMESTAMP, INTERVAL 75 MINUTE) and timestamp <= date_sub(CURRENT_TIMESTAMP, INTERVAL 60 MINUTE) and is_web=0) as a left JOIN (select student_id, max(parent_id) as parent_id from video_view_stats where created_at >=date_sub(CURRENT_TIMESTAMP, INTERVAL 75 MINUTE) group by student_id having max(parent_id)>0) as b on a.student_id = b.student_id where b.student_id is null', 'video','M60_0M' ,'qid','2116599', 'page','NOTIFICATION','','');

//Run at fixed intervals and check students who came 1 hrs before and have watched a match
create_notification('पढाई के साथ और भी बहुत कुछ :)', 'Jaaniye Doubtnut ke baare mein yahan click karke','','SELECT a.student_id, a.timestamp, a.gcm_reg_id from (SELECT * FROM students where timestamp >= date_sub(CURRENT_TIMESTAMP, INTERVAL 75 MINUTE) and timestamp <= date_sub(CURRENT_TIMESTAMP, INTERVAL 60 MINUTE) and is_web=0) as a left JOIN (SELECT student_id, max(parent_id) as parent_id from video_view_stats where created_at >=date_sub(CURRENT_TIMESTAMP, INTERVAL 75 MINUTE) group by student_id having max(parent_id)>0) as b on a.student_id = b.student_id where b.student_id is not null', 'video','M60_YM', 'qid','5682538', 'page','NOTIFICATION','','');

//Run at fixed intervals and check students who came 10 hrs 
create_notification('पढाई के साथ और भी बहुत कुछ :)', 'Jaaniye Doubtnut ke baare mein yahan click karke','','SELECT a.student_id, a.timestamp, a.gcm_reg_id from (SELECT * FROM students where timestamp >= date_sub(CURRENT_TIMESTAMP, INTERVAL 735 MINUTE) and timestamp <= date_sub(CURRENT_TIMESTAMP, INTERVAL 720 MINUTE) and is_web=0) as a left JOIN (SELECT student_id, max(created_at) as max_t from video_view_stats where created_at >=date_sub(CURRENT_TIMESTAMP, INTERVAL 735 MINUTE) group by student_id UNION select student_id, max(timestamp) as max_t from questions_new where timestamp>=date_sub(CURRENT_TIMESTAMP, INTERVAL 735 MINUTE) group by student_id) as b on a.student_id = b.student_id where b.student_id is null', 'video', 'H10_MORE','qid','5682538', 'page','NOTIFICATION','','');


// 24 hours after asking less than 5 questions.
create_notification('Koi Hai ? :P', 'आपके दोस्त Doubts पे Doubts clear किये जा रहे है आप कहाँ हो गुमशुदा ? :D पूछिये अपना अगला सवाल अभी! :) ','','SELECT a.student_id, a.timestamp, a.gcm_reg_id from (SELECT * FROM students where timestamp >= date_sub(CURRENT_TIMESTAMP, INTERVAL 1455 MINUTE) and timestamp <= date_sub(CURRENT_TIMESTAMP, INTERVAL 1440 MINUTE) and is_web=0) as a left JOIN (select student_id from questions_new where timestamp>=date_sub(CURRENT_TIMESTAMP, INTERVAL 1455 MINUTE) group by student_id having count(question_id)<5) as b on a.student_id = b.student_id where b.student_id is not null', 'camera','H24_L5Q', '','', '','','','');

//Remind to use the App 24 hours after last activity
create_notification('Kidhar Gayab? :P', 'Aapke friends roz 50 doubts clear kar rahe hai aur aap Mr. India ban gaye :P Jaldi puchiye apne sawaal :) ','','SELECT a.student_id, b.timestamp,b.student_id, b.gcm_reg_id from (Select student_id, max(created_at) as max_t from video_view_stats where source = "Android" and created_at >= date_sub(CURRENT_TIMESTAMP, INTERVAL 1455 MINUTE)  group by student_id having max_t <= date_sub(CURRENT_TIMESTAMP, INTERVAL 1440 MINUTE)) as a left join (Select * from students where is_web=0) as b on a.student_id=b.student_id', 'video','D1_NO', 'qid','5682003', 'page','NOTIFICATION','','');

//Remind to use the App 48 hours after last activity
create_notification('Class 6th se 12th, SSC & IIT-JEE level tak', 'Pao Free Instant video solutions (topic wise), PDFs, previous year papers, Concepts booster.., aur bhi bahut kuch :)','','SELECT a.student_id, b.timestamp,b.student_id, b.gcm_reg_id from (Select student_id, max(created_at) as max_t from video_view_stats where source = "Android" and created_at >= date_sub(CURRENT_TIMESTAMP, INTERVAL 2895 MINUTE)  group by student_id having max_t <= date_sub(CURRENT_TIMESTAMP, INTERVAL 2880 MINUTE)) as a left join (Select * from students where is_web=0) as b on a.student_id=b.student_id', 'video', 'D2_NO','qid','5682003', 'page','NOTIFICATION','','');

// Remind to use the App 72 hours after last activity
create_notification('पढ़ो.खेलो.जीतो  :D', 'Ji haan! kheliye Daily contests, Quiz etc aur jeetiye instant cash prize ROZANA :D','','SELECT a.student_id, b.timestamp,b.student_id, b.gcm_reg_id from (Select student_id, max(created_at) as max_t from video_view_stats where source = "Android" and created_at >= date_sub(CURRENT_TIMESTAMP, INTERVAL 4335 MINUTE)  group by student_id having max_t <= date_sub(CURRENT_TIMESTAMP, INTERVAL 4320 MINUTE)) as a left join (Select * from students where is_web=0) as b on a.student_id=b.student_id', 'daily_contest','D3_NO', '','', '','','','');

//Remind to use the App 96 hours after last activity 
create_notification('Ghumshuda ooo Ghumshuda :P ', 'Hume bhula diya? but maths ko kaise bhuloge? देरी मत करो पढ़ना शुरू करो :)','','SELECT a.student_id, b.timestamp,b.student_id, b.gcm_reg_id from (Select student_id, max(created_at) as max_t from video_view_stats where source = "Android" and created_at >= date_sub(CURRENT_TIMESTAMP, INTERVAL 5775 MINUTE)  group by student_id having max_t <= date_sub(CURRENT_TIMESTAMP, INTERVAL 5760 MINUTE)) as a left join (Select * from students where is_web=0) as b on a.student_id=b.student_id', 'downloadpdf','D4_NO', '','', '','','','');
}


try{
main();
$date = new DateTime();
echo "Push notification ran successfully at " . $date->format("y:m:d h:i:s");
}catch(Exception $e){
    var_dump($e);
}



?>
