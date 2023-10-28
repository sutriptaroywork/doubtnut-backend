<?php
function makeUrlRequest($url, $method = 'GET', $postFields = [], $headers = array('Content-Type:application/json'))
{
  $curl = curl_init();
  $options = array(
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_POSTFIELDS => json_encode($postFields),
    CURLOPT_HTTPHEADER => $headers,
  );
  curl_setopt_array($curl, $options);

  $response = curl_exec($curl);
  $err = curl_error($curl);

  curl_close($curl);

  if ($err) {
    throw new Exception("cURL Error #:" . $err);
  } else {
    return $response;
  }
}
function createDeepLink($level, $campaign, $channel, $feature, $student_id, $level_one='', $level_two='',$level_three=''){
  if(isset($qid) && $qid == 0 && isset($student_id) && $student_id == 0){
      $payload = array(
        'branch_key' => "key_live_cbx3cYpK30NM7Ph4H3OX7ihpqsn9tgQ4",
        'campaign' => $campaign,
        'channel' => $channel,
        'feature' => $feature,
        'tags'=> ['yt to app'],
        'type' => '2'
      );
  }else{
      $payload = array(
        'branch_key' => "key_live_cbx3cYpK30NM7Ph4H3OX7ihpqsn9tgQ4",
        'campaign' => $campaign,
        'channel' => $channel,
        'feature' => $feature,
        'tags'=> [''],
        'type' => '2',
        'data' => array(
        )
      );
  }
  $payload['data']['sid'] = $student_id;
  $payload['data']['library_screen_selected_Tab'] = 1;
    $payload['data']['course_id'] = "0";
  $payload['data']['subject'] = "MATHS";


  
   // if($level == 1){
   //   $payload['data']['pdf_package'] = $level_one;
   // }else if($level == 2){
   //   $payload['data']['playlist_id'] = $level_one;
   //   $payload['data']['playlist_title'] = $level_two;
   //   $payload['data']['is_last'] = $level_three;
   // }
   // $payload['data']['pdf_url']='https://d10lpgp6xz60nq.cloudfront.net/pdf_open/Bihar-Board-Class-10-Maths-Model-Question-Paper-Set-1.pdf';

  
  //$encoded_url = "https://m.doubtnut.com/showvideo/".base64_encode($qid);
  //$fallbackurl=urlencode($encoded_url);
  //$payload['$fallback_url'] = $fallbackurl;
  $response = makeUrlRequest("https://api.branch.io/v1/url",'POST',$payload);
  $response =  json_decode($response)->url;
  return $response;
}
//This is for level 0
//$response = createDeepLink(0, "uni_fb", "web_viral", "app", "110");

//This is for level 1
//$response = createDeepLink(1, "web_viral", "forum_CEN", "download_pdf_level_one", "110", "CENGAGE / G. TEWANI");

//This is for level 2
$response = createDeepLink(2, "web_viral", "crash_course", "live_classes", "110", "108191", "DC PANDEY","0");



print_r($response);
?>