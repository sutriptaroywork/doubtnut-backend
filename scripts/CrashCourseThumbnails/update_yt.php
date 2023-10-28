<?php
require 'vendor/autoload.php'; // If you're using Composer (recommended)


$servername = "dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com";
$username = "dn-prod";
$password = "D0ubtnut@2143";
$dbname = "classzoo1";
$conn = new mysqli($servername, $username, $password, $dbname);
$redisApiConnection = new Redis();
$redisApiConnection->connect("dn-prod-redis.jro06t.ng.0001.aps1.cache.amazonaws.com", "6379");
$file = fopen('sheet.csv', 'r');
while (($line = fgetcsv($file)) !== FALSE) {
   // print_r($line);
	echo $line[0];
	$sql = "update answers set youtube_id='" . $line[1] . "' where question_id = " . $line[0];
    $result = $conn->query($sql);
    echo $result;
    $redisApiConnection->hDel('answers',$line[0]);
 	$redisApiConnection->hDel('answers_with_text_solution', $line[0]);
}
fclose($file);

?>