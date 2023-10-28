<?php
require_once __DIR__ . '/vendor/autoload.php';
use Elasticsearch\ClientBuilder;
require 'config.php';

use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

$servername = ANALYTICS_DB_CONN;
    $username = USERNAME;
    $password = PASSWORD;
    $dbname = DATABASE;
    $conn = new mysqli($servername, $username, $password, $dbname);
    //     $hosts = [
    //      "http://search-dn-prod-uvagwy4xinemomwze4nr6so32u.ap-south-1.es.amazonaws.com:80"
    //  ];
    //  $client = ClientBuilder::create()->setHosts($hosts)->build();
    $sql="select * from questions where is_answered=0 and is_text_answered=1 and matched_question is null and is_skipped=0 order by question_id DESC";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                try{
                  $question_id= $row["question_id"];
                  echo $question_id."\n";
                  $ocr_done=1;
                  $image_url= "https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/".$question_id.".png";
                  $student_id=$row["student_id"];
                    file_put_contents($question_id.".png", file_get_contents($image_url));
                    shell_exec("convert -flatten ".$question_id.".png ".$question_id."_.png");
                    uploadToS3($question_id.".png",$question_id."_.png" );
                    unlink($question_id.".png");
                    unlink($question_id."_.png");
                }
            }
        }

        function uploadToS3($img_name, $image_path){
            // Set Amazon s3 credentials
            $client = S3Client::factory(
              array(
                'key'    => "AKIAIVUFSD5BLE3YE5BQ",
                'secret' => "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",
                'signature' => 'v4', 'region'=>'ap-south-1'
          
              )
            );
            $content_type = "image/".explode(".",$img_name)[1];
          
            $result=$client->putObject(array(
              'Bucket'=>'doubtnut-static',
              'Directory'=>'thumbnail_white',
              'Key' =>  'thumbnail_white/'.$img_name,
              'SourceFile' => $image_path,
            'CacheControl' => 'max-age=2592000',
            'ContentType' => $content_type
            ));
            $image_link=$result['ObjectURL'];
            return $image_link;
          }
          
?>
