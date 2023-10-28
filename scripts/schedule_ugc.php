<?php
$is_prod = 0;
require 'config.php';
if ($is_prod) {
  $mysqlHost = "latest-production.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com";
  $mysqlUser = USERNAME;
  $mysqlPassword = PASSWORD;
  $mysqlDb = "classzoo1";
  $mongoHost = MONGO_HOST;
} else {
  $mysqlHost = Test_DB_CONNECTION;
  $mysqlUser = USERNAME;
  $mysqlPassword = PASSWORD;
  $mysqlDb = DATABASE;
  $mongoHost = MONGO_HOST;
}

main($mysqlHost,$mysqlUser,$mysqlPassword,$mysqlDb,$mongoHost);
function main($mysqlHost, $mysqlUser, $mysqlPassword, $mysqlDb, $mongoHost)
{
  $sqlConn = createMysqlConnection($mysqlHost, $mysqlUser, $mysqlPassword, $mysqlDb);
  $mongoConn = createMongoConnection($mongoHost);
  //get Posts from mysql
  $posts = getMysqlData($sqlConn);
  $i = 0;
  $ret = array();
  if ($posts->num_rows > 0) {
    while ($row = $posts->fetch_assoc()) {
      // print_r($row);
      foreach ($row as $key => $value) {
        $ret[$i][$key] = $value;
      }
      $i++;
    }
  }
  insertMongo($mongoConn,$sqlConn,$ret);
  $date = new DateTime();
  $sqlConn->close();
  echo "send push notification ran successfully at " . $date->format("y:m:d h:i:s") . "\n";
}

function createMysqlConnection($host, $username, $password, $dbName)
{
  $con = new mysqli($host, $username, $password, $dbName);
  return $con;
//  $sql = "SELECT * FROM `schedule_ugc` WHERE start_date < CURRENT_TIMESTAMP AND start_date > date_sub(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE)";
//  $result = $con->query($sql);
//  $i = 0;
//  $ret = array();
//  if ($result->num_rows > 0) {
//    while ($row = $result->fetch_assoc()) {
//      // print_r($row);
//      foreach ($row as $key => $value) {
//        $ret[$i][$key] = $value;
//      }
//      $i++;
//    }
//
//  }
//  //print_r($ret);
//  return $ret;
}

function insertMongo($mongoConn, $mysqlConn, $postData)
{

  foreach ($postData as $data) {
    # code...
    //print_r($data);
    $sample=array();
    $extraObject=[];
    if($data['texts'] ==""){
    $extraObject['contain_text'] =false;
    }else{
      $extraObject['contain_text'] =true;
    }
    if($data['image_url'] ==""){
    $extraObject['contain_image'] =false;
    }else{
      $extraObject['contain_image'] =true;
    }
    if($data['audio'] ==""){
    $extraObject['contain_audio'] =false;
    }else{
      $extraObject['contain_audio'] =true;
    }
    $extraObject['contain_video']=false;
    $extraObject['is_deleted']=false;
    $extraObject['is_visible']=true;
    $extraObject['is_moderated']=false;
    $extraObject['student_id']=$data['student_id'];
    $extraObject['type']=$data['type'];
    $extraObject['text'] =$data['texts'];
    $extraObject['image']=$data['image_url'];
    $extraObject['audio']=$data['audio'];
    $extraObject['video']='';
    $extraObject['class_group']=$data['student_class'];
    $extraObject['student_username']=$data['student_username'];
    $extraObject['student_avatar']=$data['student_avatar']; 
    $extraObject['comments']=[];
    $extraObject['likes']=[];
    $extraObject['reports']=[];
    $date =$data['start_date'];
    $my_date =strtotime($date)*1000;
    $new_date=new MongoDB\BSON\UTCDateTime($my_date); 
    $extraObject['createdAt']=$new_date;
    $extraObject['updatedAt']=$new_date;
    $extraObject['_v']=0;
    array_push($sample,$extraObject);
    print_r($sample[0]);
    $sid = $data['id'];
    $bulkWriteManager = new MongoDB\Driver\BulkWrite;
    $ids = (string)$bulkWriteManager->insert($sample[0]); // Inserting Document
    $response = $mongoConn->executeBulkWrite('doubtnut.posts', $bulkWriteManager);
    updateMongoId($sid, $ids, $mysqlConn);
  }

}

function createMongoConnection($host)
{
//  $m = new MongoDB\Driver\Manager("mongodb://13.233.54.212:27017");
  $m = new MongoDB\Driver\Manager($host);
  return $m;

}

function getMysqlData($con)
{
  $sql = "SELECT * FROM `schedule_ugc` WHERE start_date < CURRENT_TIMESTAMP AND start_date > date_sub(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE ) and mongo_id is null";
  $result = $con->query($sql);
  return $result;
}

function updateMongoId($sid, $id, $con)
{
  $sql = "Update schedule_ugc set mongo_id ='" . $id . "' where id ='" . $sid . "' ";
  echo $sql . "\n";
  $result = $con->query($sql);
}

?>