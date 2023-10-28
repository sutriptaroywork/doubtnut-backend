<?php
date_default_timezone_set("Asia/Calcutta");
require 'config-tmp.php';
$environment = "production";
if ($environment == "development") {
    $conn = mysqli_connect(Test_DB_CONNECTION, USERNAME, PASSWORD, DATABASE);


} else {
      $conW = mysqli_connect(PROD_DB_WRITE, USERNAME, PASSWORD, DATABASE);
      $conR = mysqli_connect(ANALYTICS_DB_CONN, USERNAME, PASSWORD, DATABASE);
}

//$con_dev = '';

//Query to get all active contests
$off = 1;
$getActiveContests = "SELECT * FROM contest_details where date_from<=curdate() && date_till>=curdate() and id not in (3,5)";

//if($environment=="development")


$activeContestsRes = mysqli_query($conR, $getActiveContests);
//else if($environment=="production")
//	$activeContestsRes=mysqli_query($con_prod,$getActiveContests);

// Getting All Active Contests

while ($row = mysqli_fetch_assoc($activeContestsRes)) {
  // for ($i=$off; $i > 0; $i--) {
    if ($row['type'] == "top") {
        previousWinnerListForTop($row['id'], $row['type'], $row['parameter'], $row['amount'], $row['winner_count'], $off, $conR, $conW);
    } else if ($row['type'] == "lottery") {
        previousWinnerListForLottery($row['id'], $row['type'], $row['parameter'], $row['amount'], $row['winner_count'], $off, $conR, $conW);
    } else if ($row['type'] == "streak") {
        previousWinnerListForStreak($row['id'], $row['type'], $row['parameter'], $row['amount'], $row['winner_count'], $off, $conR, $conW);
    }
  // }
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

function previousWinnerListForTop($contest_id, $contest_type, $contest_parameter, $amount, $winner_count, $offset, $conR, $conW)
{

    $sql = "";
    $o2 = $offset - 1;
    if ($contest_parameter == "max_views") {
        $sql = "SELECT a.*,b.gcm_reg_id,b.student_username, b.student_fname, b.img_url as profile_image from (SELECT student_id, count(view_id) as count, sum(engage_time) as total_engagement_time FROM video_view_stats where created_at>=date_sub(CURRENT_DATE, INTERVAL ".$offset." DAY) and created_at<date_sub(CURRENT_DATE, INTERVAL ".$o2." DAY) and engage_time >=30 and refer_id=0 and source like 'android' and student_id not in (SELECT student_id from contest_debarred_students WHERE contest_id='$contest_id') group by student_id  order by count(view_id) desc, sum(engage_time) desc limit " . $winner_count . ") as a left join students as b on a.student_id=b.student_id";
    }


//	if($environment=="development")
    $winnersRes = mysqli_query($conR, $sql);
//	else if($environment=="production")
//		$winnersRes=mysqli_query($con_prod,$sql);

    $i = 1;
    $regids1 = array();

    while ($row = mysqli_fetch_assoc($winnersRes)) {
        $student_id = $row['student_id'];
        $date = date('Y-m-d', strtotime(" -".$offset." day"));
        $position = $i;
        $stu = array(
            "id"=> $row["student_id"],
            "gcmId"=> $row["gcm_reg_id"]
          );
        $regids1[] = $stu;
        // $regids1[] = $row["gcm_reg_id"];
        $count = $row['count'];
        //$insertSql="INSERT INTO `contest_winners`(`student_id`, `amount`, `date`, `position`, `contest_id`, `type`, `parameter`,`count`) VALUES ('$student_id','$amount','$date','$position','$contest_id','$contest_type','$contest_parameter','$count')";
        $insertSql = "INSERT INTO `contest_winners`(`student_id`, `amount`, `date`, `position`, `contest_id`, `type`, `parameter`,`count`) VALUES ('" . $student_id . "','" . $amount . "','" . $date . "','" . $position . "','" . $contest_id . "','" . $contest_type . "','" . $contest_parameter . "','" . $count . "')";

        $res = mysqli_query($conW, $insertSql);

        $i++;
    }
    $message_to_send = array(
        "event" => "profile",
        "title" => "Mubarak Ho :D ..yahooo!",
        "message" => "Aap daily contest ke vijeta hai :) Aapka Paytm cash aap tak jald pahonchega! Phirse Bhaag lijiye abhi! :)",
        "image" => "");
    sendScheduledNotification($regids1, $message_to_send);

}

function previousWinnerListForLottery($contest_id, $contest_type, $contest_parameter, $amount, $winner_count, $offset, $conR, $conW)
{
    $sql = "";
    $o2 = $offset - 1;
    if ($contest_parameter == "min_views") {
        $sql = "select * from (SELECT student_id, count(view_id) as count_r,sum(engage_time) as total_engagement_time FROM video_view_stats where created_at>=date_sub(CURRENT_DATE, INTERVAL ".$offset." DAY) and created_at<=date_sub(CURRENT_DATE, INTERVAL ".$o2." DAY) and engage_time >=30 and refer_id=0 and source like 'android'  group by student_id having count(view_id)>=20 order by rand() limit " . $winner_count . ") as a where  a.student_id not in (SELECT student_id from contest_debarred_students WHERE contest_id='" . $contest_id . "')";
        echo $sql;
    } else if ($contest_parameter == "min_referral") {
        $sql = "SELECT sent_id as student_id, count(received_id) as count_r, min(timestamp) as min_r from students_invites where date(timestamp)=date_sub(CURRENT_DATE, INTERVAL ".$offset." DAY) and sent_id not in (SELECT student_id from contest_debarred_students WHERE contest_id='$contest_id') group by student_id having count(received_id)>=5 order by rand() limit " . $winner_count;
    }
    $winnersRes = mysqli_query($conR, $sql);
    $regids1 = array();

    $i = 1;
    while ($row = mysqli_fetch_assoc($winnersRes)) {
        $student_id = $row['student_id'];
        $date = date('Y-m-d', strtotime(" -".$offset." day"));
        $position = $i;
        $count = $row['count_r'];
        $insertSql = "INSERT INTO `contest_winners`(`student_id`, `amount`, `date`, `position`, `contest_id`, `type`, `parameter`,`count`) VALUES ('" . $student_id . "','" . $amount . "','" . $date . "','" . $position . "','" . $contest_id . "','" . $contest_type . "','" . $contest_parameter . "','" . $count . "')";
        $res = mysqli_query($conW, $insertSql);
        $i++;
    }

}

function previousWinnerListForStreak($contest_id, $contest_type, $contest_parameter, $amount, $winner_count, $offset, $conR, $conW)
{
  // $offset = 1;
  $offset2 = $offset + 4;
  $sql = "select * from (SELECT a.student_id, sum(a.student_eligible) as sum_eligible,a.video_count from (SELECT student_id, date(created_at), count(view_id) as video_count,sum(engage_time) as total_engagement_time, case when count(view_id)>=5 then 1 else 0 end as student_eligible  FROM video_view_stats where date(created_at)>=date_sub(CURRENT_DATE, INTERVAL ". $offset2." DAY) and date(created_at)<=date_sub(CURRENT_DATE, INTERVAL ".$offset." DAY) and engage_time >=30 and refer_id=0 and source like 'android' and student_id not in (SELECT student_id from contest_debarred_students WHERE contest_id='$contest_id') group by student_id, date(created_at)) as a group by a.student_id having sum(a.student_eligible) >=5 order by RAND() LIMIT " . $winner_count.") as x left join (select gcm_reg_id,student_id as sid from students) as y on x.student_id=y.sid";
    $winnersRes = mysqli_query($conR, $sql);
    $i = 1;
    while ($row = mysqli_fetch_assoc($winnersRes)) {
        $student_id = $row['student_id'];
        // $regids1[] = $row["gcm_reg_id"];
        $stu = array(
            "id"=> $row["student_id"],
            "gcmId"=> $row["gcm_reg_id"]
          );
        $regids1[] = $stu;
        $date = date('Y-m-d', strtotime(" -".$offset." day"));
        $position = $i;
        $count = $row['sum_eligible'];
        $insertSql = "INSERT INTO `contest_winners`(`student_id`, `amount`, `date`, `position`, `contest_id`, `type`, `parameter`,`count`) VALUES ('" . $student_id . "','" . $amount . "','" . $date . "','" . $position . "','" . $contest_id . "','" . $contest_type . "','" . $contest_parameter . "','" . $count . "')";
        $res = mysqli_query($conW, $insertSql);
        $i++;
    }
    $message_to_send = array(
        "event" => "profile",
        "title" => "Mubarak Ho :D ..yahooo!",
        "message" => "Aap daily contest ke vijeta hai :) Aapka Paytm cash aap tak jald pahonchega! Phirse Bhaag lijiye abhi! :)",
        "image" => "");
    sendScheduledNotification($regids1, $message_to_send);
}

print_r("Script ran at" . date('Y-m-d'));
mysqli_close($conR);
mysqli_close($conW);

?>
