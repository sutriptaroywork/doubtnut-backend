<?php
require 'config.php';

function main(){
$analytics = ANALYTICS_DB_CONN;
$writer = PROD_DB_WRITE;
$username = USERNAME;
$password = PASSWORD;
$dbname = DATABASE;
$con_r = new mysqli($analytics, $username, $password, $dbname);
$con_w = new mysqli($writer, $username, $password, $dbname);
$con_w->set_charset("utf8");
$con_r->set_charset("utf8");
echo "\n*************************************************************STARTED***********************************************************************************\n**************************************************************STARTED******************************************************************************\n\n";
$running_on =1;

// ONLY DN VOD COURSES
// $query002 ="SELECT c.meta_info as locale,c.category,a.liveclass_course_id,b.assortment_id,c.display_name,date(a.live_at) as date_live_at,date_format(a.live_at, '%D %M %Y') as today_date, min(c.class) as class from liveclass_course_details as a  left join course_details_liveclass_course_mapping as b on a.liveclass_course_id=b.liveclass_course_id left join course_details as c on b.assortment_id=c.assortment_id where date(a.live_at) = '2021-04-16' and b.is_free = 0 and b.vendor_id = 1 and a.liveclass_course_id >=52 and a.liveclass_course_id <=147 group by 1,2,3,4 order by 2 DESC";

// ALL PAID COURSES
$query002 ="SELECT c.meta_info as locale,c.category,a.liveclass_course_id,b.assortment_id,c.display_name,date(a.live_at) as date_live_at,date_format(a.live_at, '%D %M %Y') as today_date, min(c.class) as class from liveclass_course_details as a  left join course_details_liveclass_course_mapping as b on a.liveclass_course_id=b.liveclass_course_id left join course_details as c on b.assortment_id=c.assortment_id where date(a.live_at) = date(subdate(NOW(),interval 1 day)) and b.is_free = 0 and b.vendor_id = 1 group by 1,2,3,4 order by a.liveclass_course_id ASC";

$yt_query002 = mysqli_query($con_r, $query002);

 while ($youtube_array02 = mysqli_fetch_array($yt_query002)) {



        $course_id = $youtube_array02['liveclass_course_id'];
        $course_name = $youtube_array02['display_name'];
        $today_date = $youtube_array02['today_date'];
        $date_live_at = $youtube_array02['date_live_at'];
        $assortment_id = $youtube_array02['assortment_id'];
        $student_class = $youtube_array02['class'];
        $locale = $youtube_array02['locale'];
        $category =$youtube_array02['category'];
        $deeplink_course_detail = createDeepLink_course_details($assortment_id,$student_class);


                $cut_module= $course_name;

                if($locale == 'ENGLISH'){
                $cut_module2= $today_date.' | आपकी आज की कक्षायें';
                $cut_message='Click here to join now'   ;
                $ad_image_url='https://d10lpgp6xz60nq.cloudfront.net/images/20210416_daily_summary_banner_en.webp';
                }

                if($locale == 'HINDI'){
                $cut_module2= $today_date.' | Aapki Aaj ki Classes';
                $cut_message='शामिल होने के लिए अभी क्लिक करें';
                $ad_image_url='https://d10lpgp6xz60nq.cloudfront.net/images/20210416_daily_summary_banner_hi.webp';
                }

                $campaign = 'AMAD-POSTPURCHASE-PDF-'.$date_live_at.'-'.$assortment_id;
                $channel = 'DAILY-CLASS-PDF';
                $timetable_pdf_url='https://d10lpgp6xz60nq.cloudfront.net/pdf_open/20210402-doubtnut-course-only-timetable-'.$assortment_id.'.pdf';
                $timetable_pdf_download_url='https://d10lpgp6xz60nq.cloudfront.net/pdf_download/20210402-doubtnut-course-only-timetable-'.$assortment_id.'.pdf';

                $student_id = -1002;


                $path = './';

                echo "\n******".$cut_module.'-'.$cut_module2.'-'.$campaign.'-course_id'.$course_id."******\n\n";


                // die;

                create_html_for_pdf($con_r,$con_w,$student_id,$cut_module,$cut_module2,$cut_message, $path,$ad_image_url,$course_id,$course_name,$today_date,$date_live_at,$assortment_id,$campaign,$channel,$student_class,$locale,$deeplink_course_detail,$timetable_pdf_url,$timetable_pdf_download_url,$category);


            }

mysqli_close($con_w);
mysqli_close($con_r);

}


include 'yt_functions1.php';
main();
echo "\n*************************************************************DONE***********************************************************************************\n**************************************************************DONE******************************************************************************\n\n";


function create_html_for_pdf($con_r,$con_w,$student_id,$cut_module,$cut_module2,$cut_message, $path,$ad_image_url,$course_id,$course_name,$today_date,$date_live_at,$assortment_id,$campaign,$channel,$student_class,$locale,$deeplink_course_detail,$timetable_pdf_url,$timetable_pdf_download_url,$category)

{

try {

    $html = '<html>';
    $html .= '<head>';
    $html .= '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><link href="https://fonts.googleapis.com/css?family=Roboto&display=swap" rel="stylesheet">';
    $html .= "<script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML'></script>";
    $html .= "<script type='text/x-mathjax-config'> MathJax.Hub.Config({CommonHTML: { linebreaks: { automatic: true } }, 'HTML-CSS': { linebreaks: { automatic: true } },SVG: { linebreaks: { automatic: true } }, messageStyle: 'none', tex2jax: {preview: 'none'} });</script><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1'>";
    $html .= '<script src="https://code.jquery.com/jquery-3.3.1.min.js" integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>';
    $html .= '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.5/jspdf.min.js"></script>';
    $html .= '<script src="http://html2canvas.hertzen.com/dist/html2canvas.min.js" ></script>';

//css
    $html .= '<style>
table
{
    border-style:solid;
    border-width:0px;
    border-color:black;
}
html
{
    -webkit-print-color-adjust: exact;
}


body {
            margin: 0;
        }
        .main-div {
            background-color: #f5f5f5;
            padding: 15px 8px;
            font-family: Avenir, sans-serif;
        }
        .details {
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            font-family: Avenir, sans-serif;
            font-size: 20px;
            font-weight: bold;
            padding: 17px 0;
        }
        .ad-div {
            height: 60px;
            background-color: #e8e8e8;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }

        .ad-img {
            width: 100%;
        }

        .thumbnail-img {
            width: 100%;
            align-items: center;
        }


        .chapter-heading {
            width: 100%;
            font-family: Avenir, sans-serif;
            font-size: 22px;
            font-weight: bold;
            color: #ea532c;
            text-align: center;
            padding: 5px 0px 5px 0px;
        }

        .chapter-heading-1 {
            width: 100%;
            font-family: Avenir, sans-serif;
            font-size: 18px;
            color: #0000FF;
            text-align: center;
            padding: 5px 0px 5px 0px;
        }

        .overlap-head {
            position: absolute;
            font-size: 16px;
            font-weight: bold;
            color: #ffffff;
            background-color: #039d9a;
            border-radius: 4px;
            padding: 6px 12px;
            top: -16px;
        }
        .text-box {
            padding: 16px;
            border-radius: 4px;
            border: solid 1px #e6e6e6;
            background-color: #ffffff;
            position: relative;
            display: block;
            flex-direction: column;
            margin: 20px 0px;
            text-align: justify;

        }
        .text-box-1 {
            padding: 32px 16px 20px 16px;
            font-size: 16px;
            text-align: justify;

        }
        .text-box p {
            margin: 0;
            text-align: justify;
            line-height:40px;
        }
        .example-head {
            width: fit-content;
            font-family: Arial, sans-serif;
            font-size: 22px;
            font-weight: bold;
            color: #ffffff;
            background-color: #039d9a;
            border-radius: 2px;
            margin: 15px 0px 5px 0px;
            padding: 11px 9px;
            text-align: justify;
        }
         .example-head-1 {
            width: fit-content;
            font-family: Arial, sans-serif;
            font-size: 16px;
            font-weight: bold;
            color: #ffffff;
            background-color: #039d9a;
            border-radius: 2px;
            margin: 15px 0px 5px 0px;
            padding: 11px 9px;
            text-align: justify;
        }
        .example {
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
            line-height:40px;
        }
        .watch-video {
            height: 36px;
            display: flex;
            flex-direction: row;
            align-items: center;
            border-radius: 4px;
            border: solid 2px #ea532c;
            padding: 0px 11px;
            margin: 16px 0px 6px 0px;
        }
        .watch-video img {
            height: 24px;
            width: 24px;
            margin-right: 6px;
            flex-shrink: 0;
        }
        .watch-video div {
            font-family: Arial;
            font-size: 16px;
            font-weight: bold;
            color: #ea532c;
        }
        .text-solution-head {
            font-size: 16px;
            font-weight: bold;
            padding: 10px 0px;
        }
        .text-solution {
            font-size: 16px;
            text-align: justify;
            line-height:40px;
        }
        .question {
            padding: 18px 16px;
            border-radius: 4px;
            border: solid 1px #e6e6e6;
            background-color: #ffffff;
            margin: 20px 0px;
            position: relative;
            display: flex;
            flex-direction: column;
            text-align: justify;
            line-height:40px;
        }
        .question p {
            font-size: 16px;
            margin: 0px;
            text-align: justify;
            line-height:40px;
        }
        .question img {
            height: 55px;
            width: 43px;
            margin-left: 16px;
                    }
        b {display: inline !important
                                    }

@media print {
body {-webkit-print-color-adjust: exact;}
}
.no-break {
  page-break-inside: avoid;
  vertical-align: middle;
}

</style>

</head>';


    $branch_url_download = $deeplink_course_detail;

        if($locale=='HINDI'){
            $ques_tag = 'प्रश्न';
            $ans_tag = 'उत्तर';
            $exercise_tag = 'अभ्यास';
            $ncert_sid = 69;
            $proof_tag = 'उपपत्ति';
            $example_tag = 'उदाहरण';
            $button_text='क्लास देखने के लिए यहाँ क्लिक करें';
            $proof_button_text = 'उपपत्ति को वीडियो से समझें';
            $locale_medium='HINDI';
            $notes_click = 'नोट्स के लिए यहाँ क्लिक करें';
            $hw_click = 'होमवर्क के लिए यहाँ क्लिक करें';
            $download_timetable = 'अपने कोर्स का टाईमटेबल डाउनलोड करने के लिए यहाँ क्लिक करें';
        }
        if($locale=='ENGLISH'){
            $ques_tag = 'Question';
            $ans_tag = 'Answer';
            $sol_tag='Solution';
            $exercise_tag = 'Exercise';
            $ncert_sid = 1;
            $proof_tag = 'Proof';
            $example_tag = 'Example';
            $button_text='Click to Watch the Class';
            $button_text_2='View Text Solution';
            $proof_button_text = 'Watch Video Proof';
            $locale_medium='ENGLISH';
            $notes_click = 'Click here for notes';
            $hw_click = 'Click here to attempt the homework';
            $download_timetable = 'Download Timetable of Your Classes';
        }


    $html.='<div class="main-div">
            <a href="'.$branch_url_download.'" target="_blank" style="text-decoration:none; color:black; width:100%">
            <img class="ad-img" src="'.$ad_image_url.'" alt="ad"/>
            </a>
          `<div class="details"><br>
            <a href="'.$branch_url_download.'" target="_blank" style="text-decoration:none; color:black; width:100%">
                <div class="chapter-heading">'.$cut_module.'</div>
                <div class="chapter-heading-1"><u>'.$cut_message.'</u></div>
            </div></a>';

    // $html.='<a href="'.$branch_url_download.'" target="_blank" style="text-decoration:none; color:black; width:100%">
    //         <div class="chapter-heading">'.$cut_module2.'</div>
    //         </a>' ;


    $video_query ="SELECT DISTINCT a.chapter,a.id,a.subject,b.resource_reference,date_format(a.live_at,'%h:%i %p') as time_class,b.topic from (SELECT * from liveclass_course_details where liveclass_course_id = ".$course_id." and date(live_at) = '".$date_live_at."') as a left join liveclass_course_resources as b on a.id = b.liveclass_course_detail_id where b.resource_type in (1,8) order by a.live_at,b.resource_type" ;


    echo "\n\n\nVIDEO QUERY ---".$video_query."----\n\n";

    $yt_query = mysqli_query($con_r, $video_query);

    $html.='<div class="example-head" style="margin: 38px 0px 5px 0px;">'.$cut_module2.'</div>';

    $video_exist = 0;
    while ($youtube_array = mysqli_fetch_array($yt_query)) {
        $video_exist = 1;

        $question_id=$youtube_array['resource_reference'];
        $topic=$youtube_array['topic'];
        $time_class=$youtube_array['time_class'];
        $subject_class=$youtube_array['subject'];
        $detail_id=$youtube_array['id'];
        $chapter=$youtube_array['chapter'];
        $thumbnail_image_url = 'https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/'.$question_id.'.webp';
        echo "\n\n".$question_id;
        $branch_url=createDeepLink($question_id, $campaign, $channel, "video", $student_id);


                            $html.='<a href="'.$branch_url.'" target="_blank" style="text-decoration:none; color:black; width:100%"><div class="text-box text-box-1"><p><strong>'.$time_class.' | '.$subject_class.' | '.$chapter.'</strong><hr>';
                            $html.= '<ol style="line-height:50px;">';

                            if (strpos($topic, '#!#') !== true) {

                            $topic = str_replace('#!#', '|', $topic);

                            }

                            $topic = str_replace('||', '|', $topic);

                            $topic_explode = explode('|', $topic);

                            for($i=0;$i<=count($topic_explode)-1;$i++){
                                $html.= '<li>'.$topic_explode[$i].'</li>';

                            }

                            $html.='</ol></p></a>';

                            $html.='<a href="'.$branch_url.'" target="_blank" style="text-decoration:none; color:black; width:100%"> <img class="thumbnail-img" src="'.$thumbnail_image_url.'" alt="q-thumbnail"/></a> ';

                            $html.='<a href="'.$branch_url.'" target="_blank" style="text-decoration:none; color:black; width:100%"><div class="watch-video"><img src="https://d10lpgp6xz60nq.cloudfront.net/images/play-icon-rounded-play.svg" alt="play-icon" /><div>'.$button_text.'</div></div></a>';


                            $hw_query ="SELECT a.*,b.resource_reference,b.resource_type,b.meta_info from (SELECT * from liveclass_course_details where id =".$detail_id.") as a left join liveclass_course_resources as b on a.id = b.liveclass_course_detail_id where b.resource_type in (2) and meta_info = 'homework' order by a.id,b.resource_type" ;

                            $hw_query_run = mysqli_query($con_r,$hw_query);

                            $hw_rowcount=mysqli_num_rows($hw_query_run);

                            if($hw_rowcount>0){

                            $hw_deeplink = createDeepLink_homework($campaign,$channel,$question_id);

                            $html.='<br><a href="'.$hw_deeplink.'" target="_blank" style="text-decoration:none; color:black; width:100%"><div class="watch-video"><img src="https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/8E6EE4CD-F658-5852-70E1-21416E2AC243.webp" alt="HW-icon" /><div>'.$hw_click.'</div></div></a>';

                            }

                            $notes_query ="SELECT a.*,b.resource_reference,b.resource_type,b.meta_info from (SELECT * from liveclass_course_details where id =".$detail_id.") as a left join liveclass_course_resources as b on a.id = b.liveclass_course_detail_id where b.resource_type in (2) and meta_info like '%slides%' order by a.id,b.resource_type" ;

                            $notes_query_run = mysqli_query($con_r,$notes_query);

                            $notes_rowcount=mysqli_num_rows($notes_query_run);

                            if($notes_rowcount>0){

                            while ($notesarray = mysqli_fetch_array($notes_query_run)) {

                                    $notes_url=str_replace('pdf_open', 'pdf_download', $notesarray['resource_reference']);

                            $html.='<br><a href="'.$notes_url.'" target="_blank" style="text-decoration:none; color:black; width:100%"><div class="watch-video"><img src="https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/3A89FE35-07B8-9024-99C9-EB92E419A08F.webp" alt="PDF-icon" /><div>'.$notes_click.'</div></div></a>';

                            }
                        }


                            $html.='</div>';

    }

    // $html .= '<br>TIMETABLE<hr><embed src="'.$timetable_pdf_url.'#view=FitH" width="100%" height="100%">';

     if($course_id > 51 && $course_id < 148){
         $html.= '<p><a href="'.$timetable_pdf_download_url.'" target="_blank" style="text-decoration:none; color:white; width:100%"><div class="example-head-1" style="margin: 38px 0px 5px 0px;">'.$download_timetable.'</div></a></p>';
     }


    $html .= '</div>';

    $html .= "</body>";

    $html .= "</html>";

    $html = minify_html($html);

    if($video_exist){
        $insert_query ="INSERT INTO `last_day_liveclass_pdfs`(`id`, `assortment_id`, `date`,`html`) VALUES (NULL,".$assortment_id.",'".$date_live_at."','".$html."')";

                  echo "\n\n\nInSERT QUERY ---".$insert_query."----\n\n";

                  $yt_query004 = mysqli_query($con_w, $insert_query);
                  echo $yt_query004;
    }


//     $file_name ='doubtnut-summary-class-'.$date_live_at.'-course-'.$assortment_id.'-'.$category.'-'.$locale_medium;
//     $file_name=strtolower($file_name);
//     $file_name = str_replace("/\s+/", "-", $file_name);
//     $file_name = str_replace(" ", "-", $file_name);
//     $file_name = str_replace("'", "", $file_name);
//     $file_name = str_replace(".", "-", $file_name);
//     $file_name = str_replace("?", "-", $file_name);
//     $file_name = str_replace("(", "", $file_name);
//     $file_name = str_replace(")", "", $file_name);
//     $file_name = str_replace("&", "and", $file_name);
//     $file_name = str_replace(",", "-", $file_name);
//     $file_name = str_replace(" dot ", " ", $file_name);
//     $file_name = str_replace("?", "", $file_name);
//     $file_name = str_replace(".", "", $file_name);
//     $file_name = preg_replace("/[\n\r]/", " ", $file_name);
//     $file_name = preg_replace("/\s+/", " ", $file_name);
//     $file_name = preg_replace("/[ ]{2,}|[\t]/", " ", trim($file_name));
//     $file_name = preg_replace("!\s+!", " " ,$file_name);
//     $file_name = preg_replace('/\xc2\xa0/', ' ', $file_name);
//     $file_name = str_replace("\xc2\xa0", ' ', $file_name);
//     $file_name = preg_replace('/[[:^print:]]/', '', $file_name);
//     $file_name = str_replace("--", "-", $file_name);
//     $file_name = str_replace("--", "-", $file_name);
//     $file_name = str_replace(":", "-", $file_name);
//     $file_name = str_replace("/", "", $file_name);
//     $file_name = str_replace("\\", "", $file_name);
//
//     $file_name=$file_name.".html";

    //echo "\n\nFILE NAME".$file_name;

    // //file_put_contents($path."html/".$file_name,$html);

    // $update_tracker="UPDATE boards_previous_year set is_done = 1, html_name = '".$file_name."' where class = ".$class_on." and subject = '".$subject_name."' and state_board = '".$board_name."' and chapter_english = '".$chapter_english."'";
    // $update_tracker_query= mysqli_query($con_w, $update_tracker);
    // //mysqli_close($con);

   // // echo "\n".$cut_module2.":::".$file_name."\n\n\n";
    // die;


} catch (Html2PdfException $e) {
    $formatter = new ExceptionFormatter($e);
    echo $formatter->getHtmlMessage();
}

}

?>
