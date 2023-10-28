<?php

require 'config.php';
function sendScheduledNotification($users,$message) {
    try{
        $url = "https://micro.internal.doubtnut.com/api/newton/notification/send";
        $fields = array(
        'user' => $users,
        'notificationInfo' => $message
        );
        // print_r($fields);
        echo "no of users".count($users);
        // var_dump($message);
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
        }
        print_r($result);
        // Close connection
        curl_close($ch);

        return $result;
    }catch (Exception $e) {
        print_r($e);
        return 0;
      }
  }

  function getQuestionId($class, $chapter, $conn){
    try{
        $url = "http://172.31.14.169:3939/api/chapter/subject";
        $fields = array(
        'student_class' => $class,
        'chapter' => $chapter
        );
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
        }
        // print_r($result);
        // Close connection
        curl_close($ch);
        return json_decode($result, true);
    }catch (Exception $e) {
        print_r($e);
        return [];
      }
  }

  function getMicroconceptVideo($microconcept, $conn){
    $sql = "select question_id from questions where doubt ='".$microconcept."' and student_id=99 LIMIT 1";
    $result = $conn->query($sql); 
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return $row["question_id"];
    }
    return 0;
  }

  try{
    $conn = new mysqli(ANALYTICS_DB_CONN, USERNAME, PASSWORD, DATABASE);
    date_default_timezone_set('Asia/Kolkata');
    $sql = "select a.*,b.*, c.locale, c.gcm_reg_id from (SELECT MAX(view_id) as view_id, student_id, question_id,created_at FROM `video_view_stats` where created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 20 minute) and created_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 minute) and source= 'android' and view_from ='SRP' GROUP BY student_id) as a left join (select question_id, class, chapter, microconcept from questions_meta where class is not null and chapter is not null and microconcept is not null and (microconcept like 'CV_%' or microconcept like 'MC_%' )) as b on a.question_id=b.question_id left join students as c on a.student_id=c.student_id where b.question_id is not null ORDER BY `a`.`created_at` ASC";
    // $sql="select a.*,b.*, c.locale, c.gcm_reg_id from (SELECT MAX(view_id) as view_id, student_id, question_id,created_at FROM `video_view_stats` where student_id in ('6361977', '14067957', '2364890', '5699653') and source= 'android' GROUP BY student_id) as a left join (select question_id, class, chapter, microconcept from questions_meta where class is not null and chapter is not null and microconcept is not null and (microconcept like 'CV_%' or microconcept like 'MC_%' )) as b on a.question_id=b.question_id left join students as c on a.student_id=c.student_id where b.question_id is not null ORDER BY `a`.`created_at` ASC";
    $result = $conn->query($sql);
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $student_id = $row["student_id"];
            $question_id = $row["question_id"];
            $microconcept = $row["microconcept"];
            $locale = $row["locale"];
            //microconcept question notification
            if($student_id %2 == 0){
            // if(false){
                //get micro concept question_id
                $mc_question_id = getMicroconceptVideo($microconcept, $conn);
                if($mc_question_id){
                    if($locale == 'hi'){
                        $regids = array();
                        $stu = array(
                            "id"=> $row["student_id"],
                            "gcmId"=> $row["gcm_reg_id"]
                          );
                        $regids[] = $stu;
                        $data['page'] = "NOTIFICATION";
                        $data['qid'] = $mc_question_id;
                        $data['resource_type'] = 'video';
                        $message_to_send2 = array(
                            "event" => "video",
                            "title" => 'आपकी कक्षा के👨‍🏫',
                            "message" => 'बाकी बच्चों👨‍🎓ने देखा यह वीडियो इस डाउट के बाद💭👈',
                            "image" => 'https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/'.$mc_question_id.".png",
                            "data" => json_encode($data),
                            "s_n_id" => 'VIDHIPER10',
                            "firebase_eventtag" => 'VIDHIPER10'
                          );
                        sendScheduledNotification($regids, $message_to_send2);
                    }else{
                        $regids = array();
                        $stu = array(
                            "id"=> $row["student_id"],
                            "gcmId"=> $row["gcm_reg_id"]
                          );
                        $regids[] = $stu;
                        $data['page'] = "NOTIFICATION";
                        $data['qid'] = $mc_question_id;
                        $data['resource_type'] = 'video';
                        $message_to_send2 = array(
                            "event" => "video",
                            "title" => 'Aap ki class ke👨‍🏫',
                            "message" => 'Baki bachon👨‍🎓ne dekha yeh Video is doubt ke baad💭👈',
                            "image" => 'https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/'.$mc_question_id.".png",
                            "data" => json_encode($data),
                            "s_n_id" => 'VIDENPER10',
                            "firebase_eventtag" => 'VIDENPER10'
                          );
                        sendScheduledNotification($regids, $message_to_send2);
                    }
                }
            }else{
                //get question_id from chapter and class
                $n_questionList = getQuestionId($row['class'], $row['chapter'], $conn);
                if(count($n_questionList) > 0) {
                    $n_question_id = $n_questionList[0]['question_id'];
                    if($locale == 'hi'){
                        $regids = array();
                        $stu = array(
                            "id"=> $row["student_id"],
                            "gcmId"=> $row["gcm_reg_id"]
                          );
                        $regids[] = $stu;
                        $data['page'] = "NOTIFICATION";
                        $data['qid'] = $n_question_id;
                        $data['resource_type'] = 'video';
                        $message_to_send2 = array(
                            "event" => "video",
                            "title" => 'आपकी कक्षा के👨‍🏫',
                            "message" => 'बाकी बच्चों👨‍🎓ने पूछा यह सवाल इस डाउट के बाद💭👈',
                            "image" => 'https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/'.$n_question_id.".png",
                            "data" => json_encode($data),
                            "s_n_id" => 'QAHIPER10',
                            "firebase_eventtag" => 'QAHIPER10'
                          );
                        sendScheduledNotification($regids, $message_to_send2);
                    }else{
                        $regids = array();
                        $stu = array(
                            "id"=> $row["student_id"],
                            "gcmId"=> $row["gcm_reg_id"]
                          );
                        $regids[] = $stu;
                        $data['page'] = "NOTIFICATION";
                        $data['qid'] = $n_question_id;
                        $data['resource_type'] = 'video';
                        $message_to_send2 = array(
                            "event" => "video",
                            "title" => 'Aap ki class ke👨‍🏫',
                            "message" => 'Baki bachon👨‍🎓ne pucha yeh sawal is doubt ke baad💭👈',
                            "image" => 'https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/'.$n_question_id.".png",
                            "data" => json_encode($data),
                            "s_n_id" => 'QAENPER10',
                            "firebase_eventtag" => 'QAENPER10'
                          );
                        sendScheduledNotification($regids, $message_to_send2);
                    }
                }

            }
        }
    }
    $conn->close();
    $date = new DateTime();
    echo "send  notification ran successfully at " . $date->format("y:m:d h:i:s") . "\n";
  }catch (Exception $e) {
    echo "Exception";
    print_r($e);
    echo "\n";
    $conn->close();
  }

?>