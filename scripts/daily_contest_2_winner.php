<?php
date_default_timezone_set("Asia/Calcutta");
require 'config.php';
$environment = "production";
if ($environment == "development") {
    $conn = mysqli_connect(Test_DB_CONNECTION, USERNAME, PASSWORD, DATABASE);


} else {
    $conW = mysqli_connect(PROD_DB_WRITE, USERNAME, PASSWORD, DATABASE);
    $conR = mysqli_connect(ANALYTICS_DB_CONN, USERNAME, PASSWORD, DATABASE);
}

//$con_dev = '';

//Query to get all active contests

$getActiveContests = "SELECT * FROM contest_details where date_from<=curdate() && date_till>=curdate() and id = 2";

//if($environment=="development")


$activeContestsRes = mysqli_query($conR, $getActiveContests);
//else if($environment=="production")
//	$activeContestsRes=mysqli_query($con_prod,$getActiveContests);

// Getting All Active Contests

while ($row = mysqli_fetch_assoc($activeContestsRes)) {

    if ($row['type'] == "top") {
//	    print_r($row);
//	    exit;
        previousWinnerListForTop($row['id'], $row['type'], $row['parameter'], $row['amount'], $row['winner_count'], $conR, $conW);
    } else if ($row['type'] == "lottery") {
        previousWinnerListForLottery($row['id'], $row['type'], $row['parameter'], $row['amount'], $row['winner_count'], $conR, $conW);
    } else if ($row['type'] == "streak") {
        previousWinnerListForStreak($row['id'], $row['type'], $row['parameter'], $row['amount'], $row['winner_count'], $conR, $conW);
    }
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

function previousWinnerListForTop($contest_id, $contest_type, $contest_parameter, $amount, $winner_count, $conR, $conW)
{

    $sql = "";
    if ($contest_parameter == "max_views") {
        $sql = "SELECT a.*,b.gcm_reg_id,b.student_username, b.student_fname, b.img_url as profile_image from (SELECT student_id, count(view_id) as count, sum(engage_time) as total_engagement_time FROM video_view_stats where created_at>=date_sub(CURRENT_DATE, INTERVAL 1 DAY) and created_at<CURRENT_DATE and engage_time >=30 and refer_id=0 and source like 'android' and student_id not in (SELECT student_id from contest_debarred_students WHERE contest_id='$contest_id') group by student_id  order by count(view_id) desc, sum(engage_time) desc limit " . $winner_count . ") as a left join students as b on a.student_id=b.student_id";


    }


//	if($environment=="development")
    $winnersRes = mysqli_query($conR, $sql);
//	else if($environment=="production")
//		$winnersRes=mysqli_query($con_prod,$sql);

    $i = 1;
    $regids1 = array();

    while ($row = mysqli_fetch_assoc($winnersRes)) {
        $student_id = $row['student_id'];
        $date = date('Y-m-d', strtotime(' -1 day'));
        $position = $i;
        $regids1[] = $row["gcm_reg_id"];
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
    sendRequest($regids1, $message_to_send);

}

function previousWinnerListForLottery($contest_id, $contest_type, $contest_parameter, $amount, $winner_count, $conR, $conW)
{
/*    select * from (SELECT student_id, count(view_id) as count_r,sum(engage_time) as total_engagement_time FROM video_view_stats where created_at>=date_sub(CURRENT_DATE, INTERVAL 1 DAY) and created_at<CURRENT_DATE and engage_time >=30 and refer_id=0  group by student_id having count(view_id)>=10 order by rand() limit 1) as a where  a.student_id not in (SELECT student_id from contest_debarred_students WHERE contest_id='4')
*/
    $sql = "";
    if ($contest_parameter == "min_views") {
//        $sql = "SELECT student_id, count(view_id) as count_r,sum(engage_time) as total_engagement_time FROM video_view_stats where created_at>=date_sub(CURRENT_DATE, INTERVAL 1 DAY) and created_at<CURRENT_DATE and engage_time >=30 and refer_id=0 and student_id not in (SELECT student_id from contest_debarred_students WHERE contest_id='$contest_id') group by student_id having count(view_id)>=20 order by rand() limit " . $winner_count;

        // $sql = "select * from (SELECT student_id, count(view_id) as count_r,sum(engage_time) as total_engagement_time FROM video_view_stats where created_at>=date_sub(CURRENT_DATE, INTERVAL 0 DAY) and created_at<CURRENT_DATE and engage_time >=30 and refer_id=0 and source like 'android'  group by student_id having count(view_id)>=20 order by rand() limit " . $winner_count . ") as a where  a.student_id not in (SELECT student_id from contest_debarred_students WHERE contest_id='" . $contest_id . "')";
        // $sql = "select * from (select * from (SELECT student_id, count(view_id) as count_r,sum(engage_time) as total_engagement_time, max(created_at),min(created_at) FROM video_view_stats where created_at>=date_sub(CURRENT_DATE, INTERVAL 0 DAY) and engage_time >=30 and refer_id=0 and source like 'android' group by student_id having count(view_id)>=20) as a where a.student_id not in (SELECT student_id from contest_debarred_students WHERE contest_id='".$contest_id."') order by rand() LIMIT ".$winner_count.") as x left join (select gcm_reg_id,student_id from students) as y on x.student_id=y.student_id";
      $upperLimit = $winner_count + 50;
      $sql = "Select a.*, d.mobile,d.gcm_reg_id from (SELECT student_id, count(view_id) as count_r,sum(engage_time) as total_engagement_time, max(created_at),min(created_at) FROM video_view_stats where created_at>=date_sub(CURRENT_DATE, INTERVAL 0 DAY) and engage_time >=30 and refer_id=0 and source like 'android' group by student_id having count(view_id)>=40 order by rand() limit ". $upperLimit .") as a left join contest_debarred_students as b on a.student_id = b.student_id left join (Select student_id from contest_winners where contest_id = '".$contest_id."' and date >date_sub(CURRENT_DATE, INTERVAL 10 DAY)) as c on a.student_id =c.student_id left join students as d on a.student_id = d.student_id where c.student_id is null and b.student_id is null and d.mobile is not null order by rand() LIMIT ".$winner_count;
    } else if ($contest_parameter == "min_referral") {
        //$sql = "SELECT sent_id as student_id, count(received_id) as count_r, min(timestamp) as min_r from students_invites where month(timestamp)=month(date_sub(CURRENT_DATE, INTERVAL 1 DAY)) and year(timestamp)=year(date_sub(CURRENT_DATE, INTERVAL 1 DAY)) group by sent_id order by count_r DESC, min_r asc limit " . $winner_count;
        $sql = "SELECT sent_id as student_id, count(received_id) as count_r, min(timestamp) as min_r from students_invites where date(timestamp)=date_sub(CURRENT_DATE, INTERVAL 1 DAY) and sent_id not in (SELECT student_id from contest_debarred_students WHERE contest_id='$contest_id') group by student_id having count(received_id)>=5 order by rand() limit " . $winner_count;
    }
//    exit;
//	if($environment=="development")
//		$winnersRes=mysqli_query($con_dev,$sql);
//	else if($environment=="production")
    $winnersRes = mysqli_query($conR, $sql);
//print_r($winnersRes);
//exit;
    $regids1 = array();

    $i = 1;
    // $row = mysqli_fetch_assoc($winnersRes);
    // print_r($row);
    // print_r(count($row));
    while ($row = mysqli_fetch_assoc($winnersRes)) {
        $student_id = $row['student_id'];
        $regids2[] = $row["gcm_reg_id"];

        $date = date('Y-m-d', strtotime(' 0 day'));
        $position = $i;
        $count = $row['count_r'];
        $insertSql = "INSERT INTO `contest_winners`(`student_id`, `amount`, `date`, `position`, `contest_id`, `type`, `parameter`,`count`) VALUES ('" . $student_id . "','" . $amount . "','" . $date . "','" . $position . "','" . $contest_id . "','" . $contest_type . "','" . $contest_parameter . "','" . $count . "')";
        // $insertSql = "";

//		if($environment=="development")
//			$res=mysqli_query($con_dev,$insertSql);
//		else if($environment=="production")
        $res = mysqli_query($conW, $insertSql);


        $i++;
    }
    $message_to_send = array(
        "event" => "profile",
        "title" => "Mubarak Ho :D ..yahooo!",
        "message" => "Aap daily contest ke vijeta hai :) Aapka Paytm cash aap tak jald pahonchega! Phirse Bhaag lijiye abhi! :)",
        "image" => "");
        print_r($regids2);
    sendRequest($regids2, $message_to_send);

}

function previousWinnerListForStreak($contest_id, $contest_type, $contest_parameter, $amount, $winner_count, $conR, $conW)
{


    $sql = "select * from (SELECT a.student_id, sum(a.student_eligible) as sum_eligible,a.video_count from (SELECT student_id, date(created_at), count(view_id) as video_count,sum(engage_time) as total_engagement_time, case when count(view_id)>=5 then 1 else 0 end as student_eligible  FROM video_view_stats where date(created_at)>=date_sub(CURRENT_DATE, INTERVAL 5 DAY) and date(created_at)<=date_sub(CURRENT_DATE, INTERVAL 1 DAY) and engage_time >=30 and refer_id=0 and source like 'android' and student_id not in (SELECT student_id from contest_debarred_students WHERE contest_id='$contest_id') group by student_id, date(created_at)) as a group by a.student_id having sum(a.student_eligible) >=5 order by RAND() LIMIT " . $winner_count.") as x left join (select gcm_reg_id,student_id as sid from students) as y on x.student_id=y.sid";
//print_r($sql);
//	if($environment=="development")
//		$winnersRes=mysqli_query($con_dev,$sql);
//	else if($environment=="production")
    $winnersRes = mysqli_query($conR, $sql);

    $i = 1;
    $row = mysqli_fetch_assoc($winnersRes);
    print_r($row);
    print_r(count($row));
        while ($row) {

        $student_id = $row['student_id'];
        $regids1[] = $row["gcm_reg_id"];

        $date = date('Y-m-d', strtotime(' -1 day'));
        $position = $i;
        $count = $row['sum_eligible'];
        // $insertSql = "INSERT INTO `contest_winners`(`student_id`, `amount`, `date`, `position`, `contest_id`, `type`, `parameter`,`count`) VALUES ('" . $student_id . "','" . $amount . "','" . $date . "','" . $position . "','" . $contest_id . "','" . $contest_type . "','" . $contest_parameter . "','" . $count . "')";
        // $insertSql = "";


//		if($environment=="development")
        // $res = mysqli_query($conW, $insertSql);
//		else if($environment=="production")
//			$res=mysqli_query($con_prod,$insertSql);

        $i++;
    }
    $message_to_send = array(
        "event" => "profile",
        "title" => "Mubarak Ho :D ..yahooo!",
        "message" => "Aap daily contest ke vijeta hai :) Aapka Paytm cash aap tak jald pahonchega! Phirse Bhaag lijiye abhi! :)",
        "image" => "");
    sendRequest($regids1, $message_to_send);
}

print_r("Script ran at" . date('Y-m-d'));
mysqli_close($conR);
mysqli_close($conW);

?>
