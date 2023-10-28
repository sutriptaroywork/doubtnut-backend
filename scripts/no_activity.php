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

$servername = ANALYTICS_DB_CONN;
$username = USERNAME;
$password = PASSWORD";
//$servername = "104.215.184.176";
//$username = "name";
//$password = "abc123";
$dbname = "classzoo1";
$conn = new mysqli($servername, $username, $password, $dbname);
date_default_timezone_set('Asia/Kolkata');
mysqli_set_charset($conn, "utf8");
$hour = date("H");
$sql = "Select a.student_id, a.timestamp, a.gcm_reg_id, b.student_id from (SELECT * FROM students where timestamp >= date_sub(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE) and timestamp <= date_sub(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE) and is_web=0) as a
left JOIN
(Select student_id, max(created_at) as max_t from video_view_stats where created_at >=date_sub(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE) group by student_id UNION select student_id, max(timestamp) as max_t from questions where timestamp>=date_sub(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE) group by student_id) as b
on a.student_id = b.student_id
where b.student_id is null";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    $i = 1;
    $regids1 = array();
    $message_to_send = array(
        "event" => "course",
        "title" => " पूछें अपना पहला सवाल फोटो खींच के",
        "message" => " किसी भी math सवाल का फोटो खींच कर डालें और तुरन्त वीडियो जवाब पाइए",
        "image" => "https://www.dropbox.com/s/sgsckgqvrqbjkj5/Ask-Click.png?dl=1"
    );
    while ($row = $result->fetch_assoc()) {
        if ($row["gcm_reg_id"]) {
            $regids1[] = $row["gcm_reg_id"];
        }
        if ($i % 1000 == 0 || $i == $result->num_rows) {
            if (isset($message_to_send)) {
                $ret1 = sendRequest($regids1, $message_to_send);
                $regids1 = array();
            }
        }
        $i++;
    }
}
$conn->close();
$date = new DateTime();
echo "send no acitvity push notification ran successfully at " . $date->format("y:m:d h:i:s");


?>
