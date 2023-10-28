#!/bin/bash
sudo cp -f /home/ubuntu/doubtnut_backend/config/filebeat.yml.$DEPLOYMENT_GROUP_NAME /etc/filebeat/filebeat.yml
sudo chmod go-w /etc/filebeat/filebeat.yml
sudo systemctl restart filebeat  