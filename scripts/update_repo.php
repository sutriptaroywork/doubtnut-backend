<?php
        require('vendor/autoload.php');
        require 'config.php';

        use Elasticsearch\ClientBuilder;

$servername = PROD_DB_WRITE;
$username = USERNAME;
$password = PASSWORD;
$dbname = DATABASE;
$sql = "SELECT b.* from (SELECT question_id from questions where student_id=22) as a LEFT JOIN `questions_localized` as b on a.question_id = b.question_id and b.question_id is not null";
$hosts = [
     "http://vpc-dn-private-xwfzzm23aa4eqclkbg2igad5zm.ap-south-1.es.amazonaws.com:80"
 ];
$client = ClientBuilder::create()->setHosts($hosts)->build();
$conn = new mysqli($servername, $username, $password, $dbname);
try{

    $result = $conn->query($sql);
    echo $result->num_rows;
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            echo $row["question_id"].'\n';
            if($row["question_id"] != null){
                echo $row["english"];
                $search_ocr = preg_replace('/<img[^>]+>/i', "", $row["english"]);
                $search_ocr = str_replace("<br>", "", $search_ocr);
                $search_ocr = str_replace("`", "", $search_ocr);
                try{
                    $params = [
                        'index' => "doubtnut_new",
                        'type' => 'repository',
                        'id' => $row["question_id"],
                        'body' => [
                            'doc' => [
                                'elastic_ocr' => mb_convert_encoding($search_ocr, 'UTF-8', 'UTF-8')
                            ]
                        ]
                    ];
                    // Update doc at /my_index/my_type/my_id
                    $response = $client->update($params);
                    var_dump($response);
                }catch(Exception $e){
                    var_dump($e);
                }
                try{
                    $params = [
                        'index' => "doubtnut_new_physics_chemistry_maths_v3_yellow",
                        'type' => 'repository',
                        'id' => $row["question_id"],
                        'body' => [
                            'doc' => [
                                'ocr_text' => mb_convert_encoding($search_ocr, 'UTF-8', 'UTF-8')
                            ]
                        ]
                    ];
                    // Update doc at /my_index/my_type/my_id
                    $response = $client->update($params);
                    var_dump($response);
                }catch(Exception $e){
                    var_dump($e);
                }
                try{
                    $params = [
                        'index' => "doubtnut_new_physics_chemistry_maths_v4",
                        'type' => 'repository',
                        'id' => $row["question_id"],
                        'body' => [
                            'doc' => [
                                'ocr_text' => mb_convert_encoding($search_ocr, 'UTF-8', 'UTF-8')
                            ]
                        ]
                    ];
                    // Update doc at /my_index/my_type/my_id
                    $response = $client->update($params);
                    var_dump($response);
                }catch(Exception $e){
                    var_dump($e);
                }
                  
            }
          
        }
    }
}catch(Exception $e){
    echo 'Message: ' .$e->getMessage();
    //$conn->close();
    //continue;
}finally{
      $conn->close();
}

