import MySQLdb
import os
import sys
from selenium import webdriver
from depot.manager import DepotManager
import time
import certifi
import datetime
import re
import json
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
from webptools import webplib as webp

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

message = Mail(
    from_email='tech@doubtnut.com',
    to_emails='sutripta@doubtnut.com',
    subject='Error running Thumbnail script 5',
    html_content='<strong>Error Occured while making thumbnail</strong>')

def create_html(ocr_text, qid):
    html = "<!DOCTYPE html><html><head><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML'></script><script type='text/x-mathjax-config'> MathJax.Hub.Config({CommonHTML: { linebreaks: { automatic: true } }, 'HTML-CSS': { linebreaks: { automatic: true } },SVG: { linebreaks: { automatic: true } }});</script><meta charset='UTF-8'></head><body style='background: #ffffff'><div id='ocr' style='margin:0; padding:0; font-size: 12px;'>"+ocr_text+"</div></body></html>"
    with open(str(qid)+'.html', 'w') as the_file:
        the_file.write(html)

def create_chapter_html(chapter, subject):
    chapter= re.escape(chapter)
    subject= re.escape(subject)
    # html = "<!DOCTYPE html><html><head><script type='text/javascript' async src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML'></script><script type='text/x-mathjax-config'> MathJax.Hub.Config({CommonHTML: { linebreaks: { automatic: true } }, 'HTML-CSS': { linebreaks: { automatic: true } },SVG: { linebreaks: { automatic: true } }});</script><meta charset='UTF-8'></head><body style='background: #ffffff'><div id='ocr' style='margin:0; padding:0; font-size: 12px;'>"+ocr_text+"</div></body></html>"
    html="<!DOCTYPE html><html><head><style>@font-face {font-family: myFirstFont;src: url(AEH.ttf);}</style></head><body style='height: 100%;width: 100%;background-image: url(/home/uday/personalization/thumbnails/chapters/chapter_template.png);position: relative;'><p style='font-family: myFirstFont;font-size: 100px;/* float: left; *//* margin-left: 5%; *//* line-height: 52%; */color: white;top: 100px;position: absolute;left: 80px;width: 45%;height: auto;text-align: center;'>"+chapter+"</p><div style='width:100%;position: absolute;margin-top:75%;margin-left:-10px;background-color:#78959b;left:0px;min-height:146px;opacity:0.7'><p style='font-family: myFirstFont;font-size: 60px;float: right;margin-right: 20%;line-height: 52%;'>"+subject+"</p></div></body></html>"
    with open('test.html', 'w') as the_file:
        the_file.write(html)

def screenshot_main():
    depot = DepotManager.get()
    driver = webdriver.PhantomJS('/usr/local/bin/phantomjs')
    driver.get('test.html')
    size = driver.get_window_size()
    driver.maximize_window()
    driver.set_window_size(1351, 1351)
    driver.save_screenshot('test.png')

def upload_to_s3(aws_access_key_id1, aws_secret_access_key1, file, bucket, key, qid, callback=None, md5=None, reduced_redundancy=False, content_type=None):
    transfer = S3Transfer(boto3.client('s3', 'ap-south-1',
                                   aws_access_key_id = aws_access_key_id1,
                                   aws_secret_access_key=aws_secret_access_key1))
    client = boto3.client('s3')
    transfer.upload_file(file, bucket, "personalization_chapters/"+key,extra_args={'ContentType': "image/png", "CacheControl":"max-age=2592000"})
    webpFile = file.replace('.png', '.webp')
    webpKey = key.replace('.png','.webp')
    webp.cwebp(file, webpFile, "-q 80")
    os.system("convert "+ file +" "+webpFile +" 2>&1")
    print "webp converted"
    transfer.upload_file(webpFile, bucket, "personalization_chapters/"+webpKey,extra_args={'ContentType': "image/webp", "CacheControl":"max-age=2592000"})
    print "webp uploaded"
    os.remove("test.png")
    os.remove(webpFile)

def updateDB(url, id):
    cur.execute("UPDATE `distinct_chapters` SET `image_url` = %s WHERE `distinct_chapters`.`id` = %s", (url, str(id)))
    db.commit()


try:
    
    servername = "XXXX";
    username = "XXXX";
    password = "XXXX";
    dbname = "XXXX";

    db = MySQLdb.connect(host=servername,user=username,passwd=password,db=dbname)
    db.set_character_set('utf8')
    cur = db.cursor()
    cur.execute("SELECT * FROM `distinct_chapters` where id> 81 and subject is not null")
    chpater_data = cur.fetchall()
    for row in chpater_data:
        print(row[0])
        create_chapter_html(row[1], row[3])
        screenshot_main()'[^A-z0-9 -]'
        chapter =  re.sub('[^A-Za-z0-9]+', '', row[1]).replace(" ", "_").lower()
        upload_to_s3("XXXXX", "XXXXX", "test.png", "doubtnut-static", str(chapter)+".png", chapter)
        updateDB("https://d10lpgp6xz60nq.cloudfront.net/personalization_chapters/"+chapter+".png", row[0])
    print "Successfully ran at ::: "+str(datetime.datetime.now())

except Exception as e:
  print str(e)
  sg = SendGridAPIClient(os.environ.get('XXXX'))
  response = sg.send(message)
except MySQLdb.Error:
  print e
  sg = SendGridAPIClient(os.environ.get('XXXX'))
  response = sg.send(message)
