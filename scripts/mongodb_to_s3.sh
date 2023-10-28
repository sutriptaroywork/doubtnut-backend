#!/bin/bash
MONGODUMP_PATH="/usr/bin/mongodump"
TIMESTAMP=`date +%F-%H%M`

S3_CONFIG="/home/neil/.s3cfg"
CHUNK_SIZE="500m" # 500 mg
DUMPS_TO_KEEP=30
<<COMMENT
if [ $# -lt 2 ]
then
  echo "Usage: `basename $0` database s3_bucket temp_folder collections"
  exit 1
fi
COMMENT
# get instance address
DATABASE="doubtnut_test"

# get instance address
S3_BUCKET_NAME="dn-db-backup"

# temporary folder to perform the dump
TEMP_FOLDER="/home/neil/Office/doubtnut_tmp"

# collections
#COLLECTIONS=

echo "Backing up database..."

# navigate to to the temp folder
if [ -n "$TEMP_FOLDER" ]
then
  pushd $TEMP_FOLDER > /dev/null
fi

# exit if it's the master
isMaster=`mongo $DATABASE --eval "printjson(db.isMaster())" | grep secondary | grep false`
if [ -n "$isMaster" ]
then
  echo "DB is not secondary. Exiting."
  exit 0;
fi

# exit if something fails
set -e

# Create backup
echo "Performing the database dump..."
rm -rf dump
<<COMMENT
if [ -n "$COLLECTIONS" ]
then
  #split the array of collections by comma
  IFS=',' read -a array <<< "$COLLECTIONS"
  for c in ${array[@]}
  do
    $MONGODUMP_PATH --db $DATABASE -c $c
  done
else
COMMENT
  # all collections
  $MONGODUMP_PATH --db $DATABASE
#fi
echo "Done."

# Add timestamp to backup
echo "Archiving..."
rm -rf mongodb-*
mv dump mongodb-$DATABASE-$TIMESTAMP
tar cvzf mongodb-$DATABASE-$TIMESTAMP.tar.gz mongodb-$DATABASE-$TIMESTAMP
rm -rf mongodb-$DATABASE-$TIMESTAMP
echo "Done."

echo "Splitting..."
mkdir mongodb-$DATABASE-$TIMESTAMP
cd mongodb-$DATABASE-$TIMESTAMP
split -b${CHUNK_SIZE} ../mongodb-$DATABASE-$TIMESTAMP.tar.gz mongodb-$DATABASE-$TIMESTAMP.tar.gz-
cd ..
rm -rf mongodb-$DATABASE-$TIMESTAMP.tar.gz
echo "Done."

# Upload to S3
echo "Uploading to S3..."
s3cmd --config $S3_CONFIG put -r mongodb-$DATABASE-$TIMESTAMP s3://$S3_BUCKET_NAME/
rm -rf mongodb-$DATABASE-$TIMESTAMP
echo "Done."
<<COMMENT
echo "Removing old dumps..."
dumps=`s3cmd --config $S3_CONFIG ls s3://$S3_BUCKET_NAME | awk '{print $2}' | tac | tail -n+$DUMPS_TO_KEEP`
for dump in $dumps; do
  echo "Removing $dump"
  s3cmd --config $S3_CONFIG del --recursive $dump
done
echo "Done."
COMMENT
# exit the temp folder
if [ -n "$TEMP_FOLDER" ]
then
  popd > /dev/null
fi

echo "Backup saved to s3://$S3_BUCKET_NAME/mongodb-$DATABASE-$TIMESTAMP"