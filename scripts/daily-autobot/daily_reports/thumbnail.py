import MySQLdb
import sys
import time
# from PyQt4.QtCore import *
# from PyQt4.QtGui import *
# from PyQt4.QtWebKit import *
from selenium import webdriver
from depot.manager import DepotManager
from azure.storage.blob import (
    BlockBlobService,
    PublicAccess,
    ContentSettings
    )
import boto3
import boto
from boto3.s3.transfer import S3Transfer
import os
​
def screenshot_main():
    depot = DepotManager.get()
    driver = webdriver.PhantomJS('/usr/local/bin/phantomjs')
    # driver = webdriver.PhantomJS('/home/sutripta/Downloads/youtube_scripts/node_modules/phantomjs/lib/phantom/bin/phantomjs')
    driver.set_window_size(300, 300) # set the window size that you need 
    driver.execute_script("document.body.style.zoom='400%'")
    driver.get('ocr.html')
    time.sleep(2)
    size = driver.get_window_size()
    driver.maximize_window()
    driver.set_window_size(size['width'], size['height']-200)
    print(size)
    driver.save_screenshot('ocr.png')
​
def _removeNonAscii(s):
    return "".join(i for i in s if ord(i)<128)
​
def upload_q_image(container, file, name):
    block_blob_service = BlockBlobService(account_name='doubtnutvideobiz',
        account_key = 'dzF4dTfv+R9C8TIz9p/f5+yX37KpDKgVa1g5n2OGqiBoqlSWdDTu0zk+1quQTBKF15R2SOXoFe6o2U6Dg1Y7mQ==')
        #account_key='e2Qboe1zhYzZs+PZQDYpEDWmFO/6vu1nWsudv6ScA6H4kOp+0Kh9e72o07WkOHB71DBnBRqgX4ZEFVhLGQvq6A==')
    #block_blob_service.create_container('mycontainer', public_access=PublicAccess.Container)
    #print(file)
    #print(block_blob_service)
    #print(name)
    block_blob_service.create_blob_from_path(
        container,
        name,
        file,
        content_settings=ContentSettings(content_type='image/png')
        )
​
def upload_to_s3(aws_access_key_id1, aws_secret_access_key1, file, bucket, key, callback=None, md5=None, reduced_redundancy=False, content_type=None):
    print file
    transfer = S3Transfer(boto3.client('s3', 'ap-south-1',
                                   aws_access_key_id = aws_access_key_id1,
                                   aws_secret_access_key=aws_secret_access_key1))
    client = boto3.client('s3')
    transfer.upload_file(file, bucket, "q-thumbnail/"+key,extra_args={'ContentType': "image/png", "CacheControl":"max-age=2592000"})
    webpFile = file.replace('.png', '.webp')
    webpKey = key.replace('.png','.webp')
    os.system("convert "+ file +" "+webpFile +" 2>&1")
    print "webp converted"
    transfer.upload_file(webpFile, bucket, "q-thumbnail/"+webpKey,extra_args={'ContentType': "image/webp", "CacheControl":"max-age=2592000"})
    print "webp uploaded"
    os.remove("ocr.png")
    os.remove(webpFile)
​
def upload_to_s3_white(aws_access_key_id1, aws_secret_access_key1, file, bucket, key, callback=None, md5=None, reduced_redundancy=False, content_type=None):
    print file
    transfer = S3Transfer(boto3.client('s3', 'ap-south-1',
                                   aws_access_key_id = aws_access_key_id1,
                                   aws_secret_access_key=aws_secret_access_key1))
    client = boto3.client('s3')
    transfer.upload_file(file, bucket, "thumbnail_white/"+key,extra_args={'ContentType': "image/png", "CacheControl":"max-age=2592000"})
    webpFile = file.replace('.png', '.webp')
    webpKey = key.replace('.png','.webp')
    os.system("convert "+ file +" "+webpFile +" 2>&1")
    print "webp converted"
    transfer.upload_file(webpFile, bucket, "thumbnail_white/"+webpKey,extra_args={'ContentType': "image/webp", "CacheControl":"max-age=2592000"})
    print "webp uploaded"
    os.remove("ocr.png")
    os.remove(webpFile)
​
​
def create_white_html(ocr_text):
    html = "<!DOCTYPE html><html><head><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML'></script><script type='text/x-mathjax-config'> MathJax.Hub.Config({CommonHTML: { linebreaks: { automatic: true } }, 'HTML-CSS': { linebreaks: { automatic: true } },SVG: { linebreaks: { automatic: true } }});</script><meta charset='UTF-8'></head><body style='background: #ffffff'><div id='ocr' style='width:300px;'><p>"+ocr_text+"</p></p></div></body></html>"
    with open('ocr.html', 'w') as the_file:
        the_file.write(html)
​
def create_html(ocr_text):
    html = "<!DOCTYPE html><html><head><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML'></script><script type='text/x-mathjax-config'> MathJax.Hub.Config({CommonHTML: { linebreaks: { automatic: true } }, 'HTML-CSS': { linebreaks: { automatic: true } },SVG: { linebreaks: { automatic: true } }});</script><meta charset='UTF-8'></head><body><div id='ocr' style='width:300px;'><p>"+ocr_text+"</p></p></div></body></html>"
    with open('ocr.html', 'w') as the_file:
        the_file.write(html)
​
def update_db(qid, db):
    cur2 = db.cursor()
    cur2.execute("UPDATE questions_hindi_thumbnail SET thumbnail_done=1 where question_id="+str(qid))
    db.commit()
​
try:
    count = 1
    db = MySQLdb.connect(host="dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",    # your host, usually localhost
                          user="dn-prod",         # your username
                          passwd="D0ubtnut@2143",  # your password
                          db="classzoo1"
                          )
    db.set_character_set('utf8')
    cur = db.cursor()
    cur.execute("SELECT * FROM questions_hindi_thumbnail WHERE question_id > 15218296 AND question_id < 20000000")
    if cur.rowcount > 0:
        for row in cur.fetchall():
            question_id =  row[0]
            ocr_text = row[2]
            # create_html(_removeNonAscii(ocr_text))
            create_html(ocr_text)
            # print ocr_text
            screenshot_main()
            upload_to_s3("AKIAIVUFSD5BLE3YE5BQ", "M6YQlSb9ljNoYMAHfKjbOvqMVZywQ1oTdx1CLO7E", "ocr.png", "doubtnut-static", "hi_"+str(question_id)+".png")
            create_white_html(ocr_text)
            screenshot_main()
            upload_to_s3_white("AKIAIVUFSD5BLE3YE5BQ", "M6YQlSb9ljNoYMAHfKjbOvqMVZywQ1oTdx1CLO7E", "ocr.png", "doubtnut-static", "hi_"+str(question_id)+".png")
            
            # upload_q_image("q-thumbnail","ocr.png","hi_"+str(question_id)+".png")
            # upload_q_image("thumbnail_white","ocr.png","hi_"+str(question_id)+".png")
            update_db(question_id,db)
            print question_id
            print count
            count = count + 1
except Exception as e:
  print str(e)
except MySQLdb.Error:
  print e