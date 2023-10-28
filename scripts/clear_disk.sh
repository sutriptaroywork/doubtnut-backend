
#!/bin/bash
sudo chmod +x "/home/doubtnut/doubtnut_backend/scripts/clear_disk.sh"
PROD_DOUBTNUT="/var/www/html/doubtnut/public"
TEST_DOUBTNUT="/var/www/html/doubtnut_test/public"
cd $PROD_DOUBTNUT
cd "question_image"
sudo find . -type f -name \*.png -delete
cd ".."
cd "question_video"
sudo find . -type f -name \*.mp4 -delete
cd ".."
cp V4_INTRO_720p.mp4 "question_video"
cp V4_OUTRO_720p.mp4 "question_video"
sudo chmod 777 "V4_INTRO_720p.mp4"
sudo chmod 777 "V4_OUTRO_720p.mp4"
cd $TEST_DOUBTNUT
cd "question_image"
sudo find . -type f -name \*.png -delete
cd ".."
cd "question_video"
sudo find . -type f -name \*.mp4 -delete
cd ".."
cp V4_INTRO_720p.mp4 "question_video"
cp V4_OUTRO_720p.mp4 "question_video"
sudo chmod 777 "V4_INTRO_720p.mp4"
sudo chmod 777 "V4_OUTRO_720p.mp4"

