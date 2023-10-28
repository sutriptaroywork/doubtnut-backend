
#!/bin/bash
cd "/var/log/mysql"
sudo find /var/log/mysql/ -type f -name 'mysql-bin.*' -mtime +2 -exec rm {} \;
sudo find /home/vivek29vivek/doubtnut_backend/api_server/public/uploads/ -type f -name '*.png' -mtime +1 -exec rm {} \;

