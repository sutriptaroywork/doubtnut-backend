<?php
//require_once "Mail.php";
//require_once "Mail/mime.php";
//print_r('test');
//exit;
require 'vendor/autoload.php';

//require_once "Mail.php";
//require_once "Mail/mime.php";
//print_r('test');
//exit;

use Aws\Kinesis\KinesisClient;
use Aws\Exception\AwsException;
  $is_prod = 1;
  $kinesisClient = new Aws\Kinesis\KinesisClient([
    'version' => 'latest',
    'region' => 'ap-south-1',
    'credentials' => [
        'key' => 'XXXXXXXX',
        'secret' => 'XXXXXXXX',
  ]
]);
$streamName = "branch-events";
$is_prod = 1;
$data = (array)json_decode(file_get_contents('php://input'), true);
//print_r($data);
//      sendMail($data,[]);

//exit;
//$model = 'XT1706';
//$model2 = 'ONEPLUS A3003';
//$model_array = ['XT1706','ONEPLUS A3003','Redmi Note 4'];

$conn = initMysql($is_prod);
try {
    switch ($data['name']) {
        case 'OPEN':

            $verified_data = verifyBranchHookData($data);
            //if (in_array($verified_data['model'], $model_array)) {
            //    sendMail($data,$verified_data);
            $resultl = insertBranchEvent($verified_data, $conn);
            if ($verified_data['developer_identity'] && $verified_data['aaid']) {
                updateDeveloperIdentity($verified_data['developer_identity'], $verified_data['aaid'], $conn);
            }else {
                //check last row where referred udid is not null of current aaid
                $row = getRecentUdid($verified_data['aaid'],$conn);
                $row = $row->fetch_assoc();
                if(count($row) && $verified_data['aaid']){
                    updateDeveloperIdentity($row['referred_udid'], $verified_data['aaid'], $conn);
                }
            }
            //}
            $conn->close();
            break;
        case 'REINSTALL':
            $verified_data = verifyBranchHookData($data);
            //if (in_array($verified_data['model'], $model_array)) {
            //sendMail($data,$verified_data);


            insertBranchEvent($verified_data, $conn);
            if ($verified_data['developer_identity'] && $verified_data['aaid']) {
                updateDeveloperIdentity($verified_data['developer_identity'], $verified_data['aaid'], $conn);
            }else {
                //check last row where referred udid is not null of current aaid
                $row = getRecentUdid($verified_data['aaid'],$conn);
                $row = $row->fetch_assoc();
                if(count($row)&& $verified_data['aaid']){
                    updateDeveloperIdentity($row['referred_udid'], $verified_data['aaid'], $conn);
                }
            }

            //}
            $conn->close();
            break;
        case 'INSTALL':
            $verified_data = verifyBranchHookData($data);

            //if (in_array($verified_data['model'], $model_array)) {
            //sendMail($data, $verified_data);

            insertBranchEvent($verified_data, $conn);
            if ($verified_data['developer_identity'] && $verified_data['aaid']) {
                updateDeveloperIdentity($verified_data['developer_identity'], $verified_data['aaid'], $conn);
                //}
            }else {
                //check last row where referred udid is not null of current aaid
                $row = getRecentUdid($verified_data['aaid'],$conn);
                $row = $row->fetch_assoc();
                if(count($row) && $verified_data['aaid']){
                    updateDeveloperIdentity($row['referred_udid'], $verified_data['aaid'], $conn);
                }
            }
            $conn->close();
            break;
        case 'BRANCH_DEEPLINK':

            $verified_data = verifyBranchHookData($data);
//    sendMail($data,$verified_data);

            //if (in_array($verified_data['model'], $model_array)) {
            //sendMail($data,$verified_data);
            insertBranchEvent($verified_data, $conn);
            if ($verified_data['developer_identity'] && $verified_data['aaid']) {
                updateDeveloperIdentity($verified_data['developer_identity'], $verified_data['aaid'], $conn);
            }else {
                //check last row where referred udid is not null of current aaid
                $row = getRecentUdid($verified_data['aaid'],$conn);
                $row = $row->fetch_assoc();
                if(count($row) && $verified_data['aaid']){
                    updateDeveloperIdentity($row['referred_udid'], $verified_data['aaid'], $conn);
                }
            }
            //}
            $conn->close();
            break;
        default:
            $conn->close();
            break;
    }
    sendDataToKinesis($streamName, $data, $kinesisClient);
} catch(Exception $e){
    $conn->close();
}
function sendDataToKinesis($name,$content, $kinesisClient)
{
    $stringified = json_encode($content);
    try {
        $result = $kinesisClient->PutRecord([
            'Data' => $stringified,
            'StreamName' => $name,
            'PartitionKey' => md5($stringified)
        ]);
    } catch (AwsException $e) {
        // output error message if fails
        echo $e->getMessage();
        echo "\n";
    }
}

function sendMail($data, $verified_data)
{
    $to = "udaykhatry91@gmail.com,vivek29vivek@gmail.com ";
    $subject = "Hook received";
    $body = "Data received from hook : " . (json_encode($data));
    $body .= "--------------Verified data : " . (json_encode($verified_data));
    $host = "smtp.gmail.com";
    $username = "notify.doubtnut@gmail.com";
    $password = "Doubtnut_2016";
    $from = "notify.doubtnut@gmail.com";
    $headers = array('From' => $from,
        'To' => $to,
        'Subject' => $subject);
    $smtp = Mail::factory('smtp',
        array('host' => $host,
            'auth' => true,
            'username' => $username,
            'password' => $password));

    $mail = $smtp->send("aditya@doubtnut.com", $headers, $body);
    $mail = $smtp->send("vivek29vivek@gmail.com", $headers, $body);
}

function initMysql($is_prod)
{
    if ($is_prod) {
        $servername = "";
        $username = "";
        $password = "";
        $dbname = "";
    } else {
        $servername = "";
        $username = "";
        $password = "";
        $dbname = "";
    }
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    return $conn;
}

function verifyBranchHookData($params)
{
//  print_r(((isset($params['user_data'])) && isset($params['user_data']['language'])) ? $params['user_data']['language'] : 0);
//  exit;
    $data = array();
    $data['name'] = $params['name'];
    $data['timestamp'] = $params['timestamp'];
    $city = ((isset($params['user_data'])) && isset($params['user_data']['geo_city_en'])) ? $params['user_data']['geo_city_en']) : 0;
    $data["os"] = ((isset($params['user_data'])) && isset($params['user_data']['os'])) ? $params['user_data']['os'] : 0;
    $data["os_version"] = ((isset($params['user_data'])) && isset($params['user_data']['os_version'])) ? $params['user_data']['os_version'] : 0;
    $data["environment"] = ((isset($params['user_data'])) && isset($params['user_data']['environment'])) ? $params['user_data']['environment'] : 0;
    $data["platform"] = ((isset($params['user_data'])) && isset($params['user_data']['platform'])) ? $params['user_data']['platform'] : 0;
    $data["aaid"] = ((isset($params['user_data'])) && isset($params['user_data']['aaid'])) ? $params['user_data']['aaid'] : 0;
    $data["limit_ad_tracking"] = ((isset($params['user_data'])) && isset($params['user_data']['limit_ad_tracking'])) ? ($params['user_data']['limit_ad_tracking']) ? 1 : 0 : 0;
    $data["user_agent"] = ((isset($params['user_data'])) && isset($params['user_data']['user_agent'])) ? $params['user_data']['user_agent'] : 0;
    $data["ip"] = ((isset($params['user_data'])) && isset($params['user_data']['ip'])) ? $params['user_data']['ip'] : 0;
    $data["developer_identity"] = ((isset($params['user_data'])) && isset($params['user_data']['developer_identity'])) ? $params['user_data']['developer_identity'] : 0;
    $data["country"] = ((isset($params['user_data'])) && isset($params['user_data']['country'])) ? $params['user_data']['country'] : 0;
    $data["language"] = ((isset($params['user_data'])) && isset($params['user_data']['language'])) ? $params['user_data']['language'] : 0;
    $data["sdk_version"] = ((isset($params['user_data'])) && isset($params['user_data']['sdk_version'])) ? $params['user_data']['sdk_version'] : 0;
    $data["app_version"] = ((isset($params['user_data'])) && isset($params['user_data']['app_version'])) ? $params['user_data']['app_version'] : 0;
    $data["brand"] = ((isset($params['user_data'])) && isset($params['user_data']['brand'])) ? $params['user_data']['brand'] : 0;
    $data["model"] = ((isset($params['user_data'])) && isset($params['user_data']['model'])) ? $params['user_data']['model'] : 0;
    $data["geo_dma_code"] = ((isset($params['user_data'])) && isset($params['user_data']['geo_dma_code'])) ? $params['user_data']['geo_dma_code'] : 0;
    $data["geo_country_code"] = ((isset($params['user_data'])) && isset($params['user_data']['geo_country_code'])) ? $params['user_data']['geo_country_code']."_". $city : 0;
    $data["latd_id"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~id'])) ? $params['last_attributed_touch_data']['~id'] : 0;
    $data["$3p"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['$3p'])) ? $params['last_attributed_touch_data']['$3p'] : 0;
    $data["advertising_partner_name"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~advertising_partner_name'])) ? $params['last_attributed_touch_data']['~advertising_partner_name'] : 0;
    $data["campaign"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~campaign'])) ? $params['last_attributed_touch_data']['~campaign'] : 0;
    $data["marketing"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~marketing'])) ? $params['last_attributed_touch_data']['~marketing'] : 0;
    $data["qid"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['qid'])) ? $params['last_attributed_touch_data']['qid'] : 0;
    $data["sid"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['sid'])) ? $params['last_attributed_touch_data']['sid'] : 0;
    $data["tags"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~tags'])) ? serialize($params['last_attributed_touch_data']['~tags']) : 0;
    $data["stage"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~stage'])) ? $params['last_attributed_touch_data']['~stage'] : 0;
    $data["url"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['+url'])) ? $params['last_attributed_touch_data']['+url'] : 0;
    $data["branch_ad_format"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~branch_ad_format'])) ? $params['last_attributed_touch_data']['~branch_ad_format'] : 0;
    $data["secondary_publisher"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~secondary_publisher'])) ? $params['last_attributed_touch_data']['~secondary_publisher'] : 0;
   $data["channel"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~channel'])) ? $params['last_attributed_touch_data']['~channel'] : 0;
    $data["feature"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~feature'])) ? $params['last_attributed_touch_data']['~feature'] : 0;
    $data["campaign_id"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~campaign_id'])) ? $params['last_attributed_touch_data']['~campaign_id'] : 0;
    $data["click_timestamp"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['+click_timestamp'])) ? $params['last_attributed_touch_data']['+click_timestamp'] : 0;
    $data["via_features"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['+via_features'])) ? serialize($params['last_attributed_touch_data']['+via_features']) : 0;
    $data["creation_source"] = ((isset($params['last_attributed_touch_data'])) && isset($params['last_attributed_touch_data']['~creation_source'])) ? ($params['last_attributed_touch_data']['~creation_source']) : 0;
    return $data;
}


function insertBranchEvent($data, $conn)
{
    $sql = "INSERT INTO branch_events_2020 (
            `name`,
            `os`,
            `os_version`,
            `environment`,
            `platform`,
            `aaid`,
            `limit_ad_tracking`,
            `user_agent`,
             `ip`,
            `referred_udid`,
            `country`,
            `language`,
            `sdk_version`,
            `app_version`,
            `brand`,
            `model`,
            `geo_dma_code`,
            `geo_country_code`,
            `latd_id`,
            `latd_$3p`,
            `advertising_partner_name`,
            `latd_campaign`,
            `latd_branch_ad_format`,
            `latd_channel`,
            `latd_feature`,
            `latd_stage`,
            `latd_tags`,
            `latd_url`,
            `latd_marketing`,
            `question_id`,
            `referrer_student_id`,
            `campaign_id`,
            `click_timestamp`,
            `latd_via_features`,
            `secondary_publisher`,
            `timestamp`,
            `creation_source`

  ) VALUES (
            '" . $data['name'] . "',
            '" . $data['os'] . "',
            '" . $data['os_version'] . "',
            '" . $data['environment'] . "',
            '" . $data['platform'] . "',
            '" . $data['aaid'] . "',
            '" . $data['limit_ad_tracking'] . "',
            '" . $data['user_agent'] . "',
            '" . $data['ip'] . "',
            '" . $data['developer_identity'] . "',
            '" . $data['country'] . "',
            '" . $data['language'] . "',
            '" . $data['sdk_version'] . "',
            '" . $data['app_version'] . "',
            '" . $data['brand'] . "',
            '" . $data['model'] . "',
            '" . $data['geo_dma_code'] . "',
            '" . $data['geo_country_code'] . "',
            '" . $data['latd_id'] . "',
            '" . $data['$3p'] . "',
           '" . $data['advertising_partner_name'] . "',
            '" . $data['campaign'] . "',
            '" . $data['branch_ad_format'] . "',
            '" . $data['channel'] . "',
            '" . $data['feature'] . "',
            '" . $data['stage'] . "',
            '" . $data['tags'] . "',
            '" . $data['url'] . "',
            '" . $data['marketing'] . "',
            '" . $data['qid'] . "',
            '" . $data['sid'] . "',
            '" . $data['campaign_id'] . "',
            '" . $data['click_timestamp'] . "',
            '" . $data['via_features'] . "',
            '" . $data['secondary_publisher'] . "',
            '" . $data['timestamp'] . "',
            '" . $data['creation_source'] . "'
            );";
    $result = $conn->query($sql);
    return $result;
}

function updateDeveloperIdentity($dev_identity, $aaid, $conn)
{
    $sql = "UPDATE branch_events_2020 SET referred_udid = '" . $dev_identity . "' WHERE aaid = '" . $aaid."'";
    $result = $conn->query($sql);
    return $result;
}
function getRecentUdid($aaid, $conn)
{
    $sql = "SELECT * from branch_events_2020 WHERE aaid = '" . $aaid . "' AND referred_udid <> '0' ORDER BY created_at DESC LIMIT 1";
    $result = $conn->query($sql);
    return $result;
}
?>
