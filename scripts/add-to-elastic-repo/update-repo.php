<?php
    require('vendor/autoload.php');
    require '../config.php';
    use Elasticsearch\ClientBuilder;

    try{
        $servername = PROD_DB_WRITE;
        $username = USERNAME;
        $password = PASSWORD;
        $dbname = DATABASE;

        $conn = new mysqli($servername, $username, $password, $dbname);

        $hosts = [
            VPC_HOST
        ];
        $client = ClientBuilder::create()->setHosts($hosts)->build();

        $sql = "SELECT question_id, is_answered, is_text_answered, ocr_text FROM questions WHERE (subject LIKE 'BIOLOGY' OR subject LIKE 'math' OR subject LIKE 'phy' OR subject LIKE 'chem') AND is_text_answered = 1 AND is_answered = 0 AND is_skipped = 0 AND matched_question IS NULL";
        $result = $conn->query($sql);

        $count = 1;

        if ($result->num_rows > 0) {
            // output data of each row
            while ($row = $result->fetch_assoc()) {
                $count++;
                echo "\n".$count;

                $question_id = $row['question_id'];
                $subject = $row['subject'];
                $ocr_text = $row['ocr_text'];
                $ocr_text = mb_convert_encoding($ocr_text, 'UTF-8', 'UTF-8');

                $search_ocr = preg_replace('/<img[^>]+>/i', "", $ocr_text);
                $search_ocr = str_replace("<br>", "", $search_ocr);
                $search_ocr = str_replace("`", "", $search_ocr);
                
                $params = [
                    'index' => "question_bank",
                    'type' => "repository",
                    'id' => $question_id,
                    'body' => [
                        'search_ocr' => $search_ocr,
                        'subject' => $subject
                    ]
                ];

                $params = [
                    'index' => "question_bank_meta",
                    'type' => "repository",
                    'id' => $question_id,
                    'body' => [
                        'search_ocr' => $search_ocr
                    ]
                ];
                
                $response = $client->insert($params);
            }
        }
        $conn->close();
    }catch(Exception $e){
        echo 'Message: ' .$e->getMessage();
        //$conn->close();
        //continue;
    }

?>
