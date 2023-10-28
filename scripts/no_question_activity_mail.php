<?php
require 'vendor/autoload.php';
require 'config.php';
// ini_set("memory_limit", "-1");
// ini_set('max_execution_time', 18000);
// ini_set('mysql.connect_timeout', 300);
// ini_set('default_socket_timeout', 300);
$sendgrid_apikey = SENDGRID_KEY;
$sendgrid = new SendGrid($sendgrid_apikey);
$from ='aditya.shankar@doubtnut.com';
$from_name ='Aditya Shankar';
$subject='Zabardast Doubtnut ke sang ab padhna hua aasan!';
$html = '<html>
<head>
		<!-- Latest compiled and minified CSS -->
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">

<!-- jQuery library -->
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>

<!-- Latest compiled JavaScript -->
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
	<meta charset=\'UTF-8\'>
	<script src="https://code.jquery.com/jquery-3.3.1.min.js" integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.5/jspdf.min.js"></script>
	<script src="http://html2canvas.hertzen.com/dist/html2canvas.min.js" ></script>

</head>
<body bgcolor="#FFFFFF">
<div id="ocr" style="text-align: justify; text-justify: inter-word; font-size: 40px; padding-right: 50px;   padding-left: 50px;   padding-top: 50px">


<!-- <b>Subject: Zabardast Doubtnut ke sang ab padhna hua aasan!</b><br/><br/> -->

	<div style="background: #2a394f; padding: 5% 0%; text-align: center;">
		<img src="https://d10lpgp6xz60nq.cloudfront.net/images/logo_big_tag.png" style="width: 40%">
	</div>
	<div style="font-size: 20px; margin-top: 3%; text-align: justify">
		<p>Hello Students, <p/>
		<p>
			Doubtnut ki duniya mein aapka swagat hai. Hum asha karte hain ki aapki padhai Doubtnut ke saath asaan aur mazedar ho jayegi.
		</p>
		<p>
			Kya aap jante hain ki videos padhne ka sabse achcha tarika hai? Issiliye doubtnut pe hum aapko dete hai aapke <b>Maths ke sawalon ka video solution</b>. Bas apne maths ke sawal ke photo kheech ke kijiye upload aur hum aapko denge uske sahi sahi jawab video ke dwara.
		</p>
		<p>Kyun hai naa mazedaar <img src="https://d10lpgp6xz60nq.cloudfront.net/images/smiley-mazedaar.png" style="width: 10%"> <img src="https://d10lpgp6xz60nq.cloudfront.net/images/smiley-mazedaar.png" style="width: 10%"> <img src="https://d10lpgp6xz60nq.cloudfront.net/images/smiley-mazedaar.png" style="width: 10%"> </p>
		<p>
			Sirf itna hi nahi paaye important topics ke lecture video aur PDF taaki aapke concepts ho bilkul clear. Toh ab intezaar kis baat ki, chaliye <i><a href="https://doubtnut.app.link/9B8QinVYTS" target="_blank" style="text-decoration:none; color:blue">shuru karte </a></i> hai sawaal poochna.
		</p>
		<table cellpadding="15" style="text-align:center; border-collapse: collapse; width: 100%; margin: 3% 0" border="0">
			<tr>
				<td>
					<a href="https://doubtnut.app.link/9B8QinVYTS" target="_blank">
						<button type="button" class="btn btn-info btn-lg" style="text-decoration:none; color: #ffffff; font-size: 20px; background: #5bc0de; border: 4px solid #46b8da; box-shadow: 5px 5px 10px rgba(0,0,0,.4); padding:2% 7%">ABHI POOCHEIN</button>
					</a>
				</td>
			</tr>
		</table>
		<p>
			Doubtnut aapki har zarurat ko poora karne ke liye pratibadh hai - agar aapko Doubtnut App par koi aur suvidha chahiye to bina sankoch kiye is ID par mail karein: <a href="mailto:aditya.shankar@doubtnut.com" target="_blank">aditya.shankar@doubtnut.com</a>
		</p>
		<br/>
		<p>Thanks,</p>
		<p>Aditya Shankar</p>
		<p style="line-height: 10px; font-size: 16px; color: #828282"><i>Co-founder, Doubtnut</i></p>
	</div>
</div>
</body>
</html>';
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
$password = PASSWORD;
//$servername = "104.215.184.176";
//$username = "name";
//$password = "abc123";
$dbname = "classzoo1";
$conn = new mysqli($servername, $username, $password, $dbname);
date_default_timezone_set('Asia/Kolkata');
mysqli_set_charset($conn, "utf8");
$hour = date("H");
$sql = "Select a.student_id, a.timestamp, a.gcm_reg_id, b.student_id, c.student_id, case when a.student_fname is null or a.student_fname = '' then a.student_username else a.student_fname end as student_fname,a.student_email, a.student_class from (SELECT * FROM students where timestamp >= date_sub(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE) and timestamp <= date_sub(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE) and is_web=0) as a
left JOIN
(Select student_id, max(created_at) as max_t from video_view_stats where created_at >=date_sub(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE) group by student_id) as b
on a.student_id = b.student_id
left join (select student_id, max(timestamp) as max_t from question_new where timestamp>=date_sub(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE) group by student_id) as c
on a.student_id = c.student_id
where b.student_id is not null and c.student_id is null and a.student_email is not null and a.student_class in (11,12)";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
    	//print_r($row);
    	$to = $row["student_email"];
    	$to_name =$row["student_fname"];
   sendEmailForNoQuestion($sendgrid,$sendgrid_apikey,$to,$to_name,$from,$from_name,$subject,$html);
    // exit;
    }
}
$conn->close();
 $date = new DateTime();
 echo "send no question acitvity push notification ran successfully at " . $date->format("y:m:d h:i:s");
  
function sendEmailForNoQuestion($sendgrid,$sendgrid_apikey,$to,$to_name,$from,$from_name,$subject,$html){

//Dotenv::load(_DIR_);
echo "test";
$url = 'https://api.sendgrid.com/';
//$pass = $sendgrid_apikey;
//$template_id = 'Template_20181224141631337_20181224142205321';
$template_id = 'c3d99c59-9bf9-46ff-a9af-382f9b6bf876';
$js = array(
    'sub' => array(':name' => array('Elmer')),
    'filters' => array('templates' => array('settings' => array('enable' => 1, 'template_id' => $template_id)))
);

$params = array(
    'to'        => $to,
    'toname'    => $to_name,
    'from'      => $from,
    'fromname'  => $from_name,
    'subject'   => $subject,
    // 'text'      => $text,
    'html'      => $html
//    'x-smtpapi' => json_encode($js),
);

$request =  $url.'api/mail.send.json';

// Generate curl request
$session = curl_init($request);
// Tell PHP not to use SSLv3 (instead opting for TLS)
curl_setopt($session, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);
curl_setopt($session, CURLOPT_HTTPHEADER, array('Authorization: Bearer ' . $sendgrid_apikey));
// Tell curl to use HTTP POST
curl_setopt ($session, CURLOPT_POST, true);
// Tell curl that this is the body of the POST
curl_setopt ($session, CURLOPT_POSTFIELDS, $params);
// Tell curl not to return headers, but do return the response
curl_setopt($session, CURLOPT_HEADER, false);
curl_setopt($session, CURLOPT_RETURNTRANSFER, true);

// obtain response
$response = curl_exec($session);
curl_close($session);

// print everything out
print_r($response);
}
?>

