#!/bin/sh
find ../api_server/public/uploads/  -mmin +30 -delete 
# This is a comment!
echo files older than 30 minutes removed successfully
