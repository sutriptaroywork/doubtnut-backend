
#!/bin/bash
sudo chmod +x "/home/ubuntu/doubtnut_backend/scripts/clear_space.sh"
PM2_LOGPATH="/home/ubuntu/.pm2/logs"
IMAGE_UPLOAD="/home/ubuntu/doubtnut_backend/api_server/public/uploads"
IMAGE_UPLOAD_2="/home/ubuntu/public/uploads/"
cd $IMAGE_UPLOAD
#find . -name \*.jpg -mmin +5 -delete > /dev/null
find . -name \* -mmin +5 -delete > /dev/null
cd $IMAGE_UPLOAD_2
find . -name \* -mmin +5 -delete > /dev/null
cd $PM2_LOGPATH

truncate * --size 0
