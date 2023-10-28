<?php
    // require('vendor/autoload.php');
    require __DIR__ . '/vendor/autoload.php';
    require '../config.php';
    use Elasticsearch\ClientBuilder;

    $email = new \SendGrid\Mail\Mail();
    date_default_timezone_set('Asia/Kolkata');
    function send_mail_on_error($email)
    {
        $email->setFrom("info@doubtnut.com", "Script Error Sender");
        $email->setSubject("Error running Daily Question to Elastic Repo script");
        $email->addTo("tech@doubtnut.com", "Doubtnut Tech");
        $email->addContent("text/plain", "Error Occured while adding questions to elastic repo");
        $email->addContent(
            "text/html", "<strong>Error Occured while adding questions to elastic repo</strong>"
        );
        $sendgrid = new \SendGrid(SENDGRID_KEY);
        try {
            $response = $sendgrid->send($email);
            // print $response->statusCode() . "\n";
            // print_r($response->headers());
            // print $response->body() . "\n";
        } catch (Exception $e) {
            echo 'Caught exception: '. $e->getMessage() ."\n";
        }
    }

    try{
        $servername = ANALYTICS_DB_CONN;
        $username = USERNAME;
        $password = PASSWORD;
        $dbname = DATABASE;

        $conn = new mysqli($servername, $username, $password, $dbname);

        $hosts = [
            VPC_HOST
        ];
        $client = ClientBuilder::create()->setHosts($hosts)->build();

        $sql = "select a.*, b.english as english from (SELECT question_id, subject, is_answered, is_text_answered, ocr_text FROM questions WHERE (is_text_answered = 1 OR is_answered = 1) AND date(timestamp) = date(DATE_SUB(CURDATE(),INTERVAL 1 DAY)) AND is_skipped = 0 AND matched_question IS NULL and student_id in (22,69,73,77,78,88)) as a LEFT JOIN `questions_localized` as b on a.question_id = b.question_id and b.question_id is not null and b.english is not null";
        $result = $conn->query($sql);

        $count = 0;

        if ($result->num_rows > 0) {
            $celery_local = new Celery('13.126.58.207', '', 'abc_123', '/');
            // output data of each row
            while ($row = $result->fetch_assoc()) {
                $count++;
                echo "\n".$count;
                echo "\n".$row['question_id'];
                echo "\n".$row['ocr_text'];
                echo "\n".$row['english'];
                $question_id = $row['question_id'];
                $subject = $row['subject'];
                $is_answered = $row['is_answered'];
                $is_text_answered = $row['is_text_answered'];
                $ocr_text = $row['ocr_text'];
                $english_ocr_text = $row['english'];
                $ocr_text = mb_convert_encoding($english_ocr_text, 'UTF-8', 'UTF-8');

                $search_ocr = preg_replace('/<img[^>]+>/i', "", $ocr_text);
                $search_ocr = str_replace("<br>", "", $search_ocr);
                $search_ocr = str_replace("`", "", $search_ocr);

                try{
                    $params = [
                        'index' => "question_bank_meta",
                        'type' => 'repository',
                        'id' => $question_id,
                        'body' => [
                            'pretty_text' => mb_convert_encoding($row['english'], 'UTF-8', 'UTF-8')
                        ]
                    ];
                    // Update doc at /my_index/my_type/my_id
                    $response = $client->index($params);
                    var_dump($response);
                }catch(Exception $e){
                    var_dump($e);
                    send_mail_on_error($email);
                }

                try{
                    $params = [
                        'index' => "question_bank",
                        'type' => 'repository',
                        'id' => $question_id,
                        'body' => [
                            'subject' => $subject,
                            'ocr_text' => $search_ocr,
                            'is_text_answered' => $is_text_answered,
                            'is_answered' => $is_answered
                        ]
                    ];
                    // Update doc at /my_index/my_type/my_id
                    $response = $client->index($params);
                    var_dump($response);
                }catch(Exception $e){
                    var_dump($e);
                    send_mail_on_error($email);
                }
                try{
                    $params = [
                        'index' => "question_bank_tokens_limit",
                        'type' => 'repository',
                        'id' => $question_id,
                        'body' => [
                            'subject' => $subject,
                            'ocr_text' => $search_ocr,
                            'is_text_answered' => $is_text_answered,
                            'is_answered' => $is_answered
                        ]
                    ];
                    // Update doc at /my_index/my_type/my_id
                    $response = $client->index($params);
                    var_dump($response);
                }catch(Exception $e){
                    var_dump($e);
                    send_mail_on_error($email);
                }
                try{
                    $params = [
                        'index' => "question_bank_bm25_b_075_k1_12",
                        'type' => 'repository',
                        'id' => $question_id,
                        'body' => [
                            'subject' => $subject,
                            'ocr_text' => $search_ocr,
                            'is_text_answered' => $is_text_answered,
                            'is_answered' => $is_answered
                        ]
                    ];
                    // Update doc at /my_index/my_type/my_id
                    $response = $client->index($params);
                    var_dump($response);
                }catch(Exception $e){
                    var_dump($e);
                    send_mail_on_error($email);
                }
                $celery_local->PostTask('task1.tasks.upload_thumbnail', array($ocr_text, "hi_".$question_id));
            }
        }
        echo "success at: ".date('m/d/Y h:i:s a', time());
        $conn->close();
    }catch(Exception $e){
        echo 'Message: ' .$e->getMessage();
        send_mail_on_error($email);
    }

?>
