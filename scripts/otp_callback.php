<?php
require 'vendor/autoload.php';

use Aws\Sns\SnsClient;
use Aws\Exception\AwsException;

$client = SnsClient::factory(
  array(
      'version' => 'latest',
      'region' => 'ap-south-1',
      'credentials' => [
          'key' => 'XXX',
          'secret' => 'XXX',
          ]
  )
);
 try {
     if(isset($_GET) && isset($_GET['Status']) && ($_GET['Status'] !== 'DELIVERED')){
         $payload = array(
              'TopicArn' => 'arn:aws:sns:ap-south-1:942682721582:otp-callback',
              'Message' => json_encode($_GET),
              'MessageStructure' => 'string',
          );
           $client->publish( $payload );
           echo 'Success!';
     }
 } catch ( Exception $e ) {
       echo "Failure!\n" . $e->getMessage();
}
?>
