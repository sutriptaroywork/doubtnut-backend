<?php

require 'vendor/autoload.php';
use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;
use WindowsAzure\Common\ServicesBuilder;
use WindowsAzure\Common\ServiceException;
use MicrosoftAzure\Storage\Blob\Models\CreateBlobOptions;


ini_set("memory_limit", "-1");
ini_set('max_execution_time', 0);

$download_path = getcwd()."/images/";
$connectionString = "DefaultEndpointsProtocol=https;AccountName=doubtnutvideobiz;AccountKey=dzF4dTfv+R9C8TIz9p/f5+yX37KpDKgVa1g5n2OGqiBoqlSWdDTu0zk+1quQTBKF15R2SOXoFe6o2U6Dg1Y7mQ==";
$source_container = "q-thumbnail";
$blobRestProxy = ServicesBuilder::getInstance()->createBlobService($connectionString);

// function upload_image_to_blob($file_name, $file_path)
// 	{

// 	// Create blob REST proxy.
// 	$content = fopen($file_path, "r");
//   	$blobRestProxy->createBlockBlob($source_container, $file_name, $content);
	
// }


function download_from_blob($name, $blobRestProxy, $source_container, $download_path)
{

    $file_path = $download_path.$name;
    $blob = $blobRestProxy->getBlob($source_container, $name);
    $content = stream_get_contents($blob->getContentStream());
    $file = fopen($file_path, 'w');
    fwrite($file, $content);
}

function upload_to_S3($img_name,$img_path){

	// Set Amazon s3 credentials
	$client = S3Client::factory(
	  array(
	    'key'    => "AKIAIVUFSD5BLE3YE5BQ",
	    'secret' => "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",
	    'signature' => 'v4', 'region'=>'ap-south-1',

	  )
	);
	$content_type = "image/".explode(".",$img_name)[1];

  $result=$client->putObject(array(
    'Bucket'=>'doubtnut-static',
    'Directory'=>'q-thumbnail',
    'Key' =>  'q-thumbnail/'.$img_name,
    'SourceFile' => $img_path,
	'CacheControl' => 'max-age=2592000',
	'ContentType' => $content_type
  ));
  $image_link=$result['ObjectURL'];
  return $image_link;
}

try{

	$is_prod = 1;
	if ($is_prod) {
	//    $servername = "35.200.190.26";
	 //   $username = "read";
	   // $password = "read@123";
	    $servername = "104.215.184.176";
	    $username = "name";
	    $password = "abc123";    
	    $dbname = "classzoo1";
	} else {
	    $servername = "13.127.249.21";
	    $username = "root";
	    $password = "root";
	    $dbname = "classzoo1";
	}


	// Create connection

	$conn = new mysqli($servername, $username, $password, $dbname);
	date_default_timezone_set('Asia/Kolkata');
	mysqli_set_charset($conn, "utf8");
	$hour = date("H");
	$sql = "select * from questions where is_answered=1 and matched_question is not null";
	$result = $conn->query($sql);
	if ($result->num_rows > 0) {
	    // output data of each row
	    while ($row = $result->fetch_assoc()) {
	    	echo $row["question_id"].":\n";
	    	 $image_name=$row["question_id"].".png";
	        // echo $image_name;
	        download_from_blob($image_name, $blobRestProxy, $source_container, $download_path);
	     	$link = upload_to_S3($image_name, $download_path.$image_name);
	     	unlink($download_path.$image_name);
		    }	

	}

 	// $blob_list = $blobRestProxy->listBlobs($source_container);
  //   $blobs = $blob_list->getBlobs();
    // $count = 1;
    // foreach($blobs as $blob)
    // {
    //     //echo $blob->getName().": ".$blob->getUrl()."<br /><br />";
    //     // echo $blob->getUrl()."<br />";
    //     $image_name=strtolower($blob->getName());
    //     echo $image_name;
    //     download_from_blob($image_name, $blobRestProxy, $source_container, $download_path);
    //  	$link = upload_to_S3($image_name, $download_path.$image_name);
    //  	echo $link."\n";
    //  	$count++;
    //  	echo $count;
    //  	unlink($download_path.$image_name);
    //     //echo $rs=upload_own_image("raagaimg",$photo_name,$blob->getUrl());
    //     //echo "<br /><br />";
    // }


}catch(ServiceException $e){
    // Handle exception based on error codes and messages.
    // Error codes and messages are here: 
    // http://msdn.microsoft.com/library/azure/dd179439.aspx
    $code = $e->getCode();
    $error_message = $e->getMessage();
    echo $code.": ".$error_message."<br />";
}

// catch(Exception $e){
// 	var_dump($e);
// }

$date = new DateTime();
echo "blob to s3 ran succesfully" . $date->format("y:m:d h:i:s");

?>