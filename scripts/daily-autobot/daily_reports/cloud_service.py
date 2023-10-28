from dotenv import load_dotenv
load_dotenv()

import cloudinary
import cloudinary.uploader
import cloudinary.api
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import datetime 
import boto3
import os
import time

S3_BUCKET =os.environ.get('S3_BUCKET')
ACCESS_KEY =os.environ.get('AWS_ACCESS_ID')
SECRET_KEY = os.environ.get('AWS_SECRET')
# random color generator to be added in the email

# plot_name = str(datetime.date.today() + datetime.timedelta(-1)) + "web_installs.png"

def make_graph_and_upload(x_array,y_array,x_label,y_label,title,uploaded_image_name):

	cloudinary.config( 
	  cloud_name = "doubtnut123", 
	  api_key = "631735869232765",
	  api_secret ="3Y9kCJ3IAhrq4kFlucVpRxhqaAI"
	  # api_key = "698735742227757", 
	  # api_secret = "aq8eAaean0LK8TwJXZvLrQo6VJQ" 
	)

	# plt.figure(figsize=(5,4))
	plt.plot(x_array,y_array,marker='o',color=(0.8,0.2,0.5))
	plt.suptitle(title,fontsize =10)
	# for a,b in zip(dates_array,installations_array):
	# 	plt.text(a, b, str(b),fontsize=9)
	plt.ylabel(y_label)
	plt.xlabel(x_label)

	plt.savefig(uploaded_image_name , format ='png')
	# plt.draw()
	plt.show(block=False)

	upload_result = cloudinary.uploader.upload(uploaded_image_name)
	# result = cloudinary.uploader.upload('app.png', public_id="app")
	print(upload_result)
	# plt.show()
	plt.close()
	return upload_result['url']



def make_graph_and_s3upload(x_array,y_array,x_label,y_label,title,uploaded_image_name):


	bucket_name = S3_BUCKET
	s3 = boto3.client("s3",aws_access_key_id=ACCESS_KEY, aws_secret_access_key=SECRET_KEY)


	# plt.figure(figsize=(5,4))
	plt.plot(x_array,y_array,marker='o',color=(0.8,0.2,0.5))
	plt.suptitle(title,fontsize =10)
	# for a,b in zip(dates_array,installations_array):
	# 	plt.text(a, b, str(b),fontsize=9)
	plt.ylabel(y_label)
	plt.xlabel(x_label)

	plt.savefig(uploaded_image_name , format ='png')
	# plt.draw()
	plt.show(block=False)

	# upload_result = cloudinary.uploader.upload(uploaded_image_name)
	# filename = getFilename()


	bucket_resource = s3
	bucket_resource.upload_file(
	Bucket = bucket_name,
	Filename= uploaded_image_name,
	Key= 'd-images/{}'.format(uploaded_image_name)
	)
	# result = cloudinary.uploader.upload('app.png', public_id="app")
	upload_result = "https://d10lpgp6xz60nq.cloudfront.net/d-images/{}".format(uploaded_image_name)
	print(upload_result)
	# plt.show()
	plt.close()
	return upload_result





def getFilename():
	timestr = time.strftime("%Y%m%d-%H%M%S")
	return timestr




