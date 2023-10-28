<?php

function view($version){
  $curl = curl_init();
  curl_setopt_array($curl, array(
   CURLOPT_URL => "http://neil.doubtnut.com/".$version."/answers/view-answer-by-question-id",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "POST",
    CURLOPT_POSTFIELDS => "tab_id=0&mc_class=&parent_id=0&student_id=3635920&mc_id=&id=1&page=HOME_FEED&source=android&mc_course=NCERT&qid=1&sid=3635920",
    CURLOPT_HTTPHEADER => array(
      "cache-control: no-cache",
      "content-type: application/x-www-form-urlencoded",
      "postman-token: 20edeacc-7be1-0aec-3c18-c3721a38463a",
      "version_code: 619",
      "x-auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjUyNDY0MSwiaWF0IjoxNTcxOTA5Mzg3LCJleHAiOjE2MzQ5ODEzODd9.xTMTMW1bF2KpQcIcC1TCIrimevK7kM-GzIQ0sMqqtZQ"
    ),
  ));

  $response = curl_exec($curl);
  $err = curl_error($curl);

  curl_close($curl);

  if ($err) {
    echo "cURL Error #:" . $err;
  } else {
    echo "done";
  }
}

function siege($version){
  $response = exec('siege -c50  -r10 -d1 -l --content-type "application/x-www-form-urlencoded" -H "x-auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjUyNDY0MSwiaWF0IjoxNTcxOTA5Mzg3LCJleHAiOjE2MzQ5ODEzODd9.xTMTMW1bF2KpQcIcC1TCIrimevK7kM-GzIQ0sMqqtZQ" "http://neil.doubtnut.com/"'.$version.'"/answers/view-answer-by-question-id POST tab_id=0&mc_class=&parent_id=0&student_id=3635920&mc_id=&id=1&page=HOME_FEED&source=android&mc_course=NCERT&qid=1&sid=3635920"');
  var_dump($response);


}
//Before running the script there were 0 rows in video_view_logs table
//After running this script there should be 5500 rows in video_view_logs table

// for($i=0;$i<=499;$i++){
  siege('v2');
  siege('v3');
  siege('v4');
  siege('v5');
  siege('v6');
  siege('v7');
  siege('v8');
  siege('v9');
  siege('v10');
  siege('v11');
  siege('v12');  
  // echo $i;
// }

/*
2019-11-11 13:16:20,    500,      53.79,           0,       4.40,        9.30,        0.00,       40.94,     500,       0
2019-11-11 13:17:20,    500,      60.09,           1,       4.98,        8.32,        0.02,       41.42,     500,       0
2019-11-11 13:18:23,    500,      62.84,           0,       5.21,        7.96,        0.00,       41.43,     500,       0
2019-11-11 13:19:29,    500,      66.02,           0,       5.54,        7.57,        0.00,       41.94,     500,       0
2019-11-11 13:20:41,    500,      72.33,           1,       6.61,        6.91,        0.01,       45.73,     500,       0
2019-11-11 13:21:56,    500,      75.27,           1,       6.69,        6.64,        0.01,       44.42,     500,       0
2019-11-11 13:23:59,    499,     122.47,           1,      10.65,        4.07,        0.01,       43.40,     499,       1
2019-11-11 13:25:18,    500,      79.29,           1,       7.27,        6.31,        0.01,       45.85,     500,       0
2019-11-11 13:26:46,    500,      87.38,           1,       8.15,        5.72,        0.01,       46.63,     500,       0
2019-11-11 13:28:16,    500,      90.09,           1,       8.35,        5.55,        0.01,       46.37,     500,       0
2019-11-11 13:29:49,    500,      93.37,           1,       8.74,        5.36,        0.01,       46.82,     500,       0


*/