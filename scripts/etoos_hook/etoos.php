<?php
require 'vendor/autoload.php';
use Aws\Kinesis\KinesisClient;
use Aws\Exception\AwsException;
  $is_prod = 1;
  $kinesisClient = new Aws\Kinesis\KinesisClient([
    'version' => 'latest',
    'region' => 'ap-south-1',
    'credentials' => [
        'key' => 'AKIAIVUFSD5BLE3YE5BQ',
        'secret' => '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',
  ]
]);
$streamName = "etoos-webhooks";
$is_prod = 1;
$data = (array)json_decode(file_get_contents('php://input'), true);
sendDataToKinesis($streamName, $data, $kinesisClient);


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

?>
