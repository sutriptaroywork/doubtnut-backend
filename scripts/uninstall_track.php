<?php
ini_set("memory_limit", "-1");
ini_set('max_execution_time', "-1");
ini_set('mysql.connect_timeout', "-1");
require 'config.php';
function sendRequest($regid, $student_id, $conn)
{
  echo $regid;
  $url = 'https://fcm.googleapis.com/fcm/send';
  $fields = array(
    'to' => $regid,
    'notification' => array("message" => "")
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
  // var_dump($result);
  // Close connection
  $response = json_decode($result);
  
  if($response->success){
    updateUninstall($student_id, 0, $conn);
  }else if(!$response->success && $response->results[0]->error == "InvalidRegistration"){
    updateUninstall($student_id, 2, $conn);
  }else if(!$response->success && $response->results[0]->error == "NotRegistered"){
    updateUninstall($student_id, 1, $conn);
  }else{
    updateUninstall($student_id, 3, $conn);
  }
  curl_close($ch);
}

function updateUninstall($student_id, $is_uninstalled, $conn){
  if($is_uninstalled ==1 || $is_uninstalled ==2 || $is_uninstalled ==3){
    $sql="update students set is_uninstalled=". $is_uninstalled.", gcm_reg_id=NULL where student_id=".$student_id;
  }else{
    $sql="update students set is_uninstalled=". $is_uninstalled." where student_id=".$student_id;
  }
  $result = $conn->query($sql);
}

$conW = new mysqli(PROD_DB_WRITE, USERNAME, PASSWORD, DATABASE);
$conR = new mysqli(ANALYTICS_DB_CONN, USERNAME, PASSWORD, DATABASE);
date_default_timezone_set('Asia/Kolkata');
mysqli_set_charset($conR, "utf8");
mysqli_set_charset($conW, "utf8");

try{
  $sql="select gcm_reg_id,student_id  from students where is_web=0 and gcm_reg_id is not null limit 1000000";
  // $sql="select * from students where student_id=4739249 and gcm_reg_id is not null";
  $result = $conR->query($sql);
  if ($result->num_rows > 0) {
    // output data of each row
    while ($row = $result->fetch_assoc()) {
      var_dump($row);
      echo $row["student_id"];
      sendRequest($row["gcm_reg_id"],$row["student_id"], $conW);
    }
    $date = new DateTime();
    echo "uninstall ran successfully at " . $date->format("y:m:d h:i:s") . "\n";
  }
}catch (Exception $e) {
  echo "Exception";
  print_r($e);
  echo "\n";
}finally {
    $conW->close();
    $conR->close();
}
?>