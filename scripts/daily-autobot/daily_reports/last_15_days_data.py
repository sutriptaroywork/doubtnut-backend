# default imports for the mailing function in each report
import MySQLdb
from dotenv import load_dotenv
load_dotenv()
import sys
import csv
from master_query import * 
from mail import sendMail
import datetime
from csv_updater import writeCSV
import pandas as pd


# //try to make databse connection and get results and send email

mysql_host = os.environ.get('MYSQL_ANALYTICS_HOST')
mysql_username =os.environ.get('MYSQL_READ_USER')
mysql_password = os.environ.get('MYSQL_READ_PWD')
mysql_database = os.environ.get('MYSQL_READ_DATABASE')


for i in range(15):
	cur_date =  datetime.date.today() + datetime.timedelta(-i)
	web_csv_result = [cur_date]
	app_csv_result = [cur_date]
	whatsapp_csv_result = [cur_date]
	web_queries  = get_web_queries(i)
	app_queries = get_app_queries(i)
	whatsapp_queries = get_whatsapp_queries(i)

	try:
		db = MySQLdb.connect(host=mysql_host,    # your host, usually localhost
							user=mysql_username,         # your username
							passwd=mysql_password,  # your password
							db=mysql_database
							)
		cur = db.cursor()

		for i in range(len(app_queries)):
			print("app_queries")
			desc = app_queries[i][0]
			print(desc)
			print(app_queries[i][1])
			cur.execute(app_queries[i][1])
			rows = cur.fetchall()

			for row in rows:
				print(row[0])
				app_csv_result.append(row[0])

		for i in range(len(web_queries)):
			print("web_queries")
			desc = web_queries[i][0]
			print(desc)
			print(web_queries[i][1])
			cur.execute(web_queries[i][1])
			rows = cur.fetchall()

			for row in rows:
				print(row[0])
				web_csv_result.append(row[0])

		for i in range(len(whatsapp_queries)):
			print("whatsapp_queries")
			desc = whatsapp_queries[i][0]
			print(desc)
			print(whatsapp_queries[i][1])
			cur.execute(whatsapp_queries[i][1])
			rows = cur.fetchall()

			for row in rows:
				print(row[0])
				whatsapp_csv_result.append(row[0])


		writeCSV('web_reports_15_latest.csv',web_csv_result)
		writeCSV('app_reports_15_latest.csv',app_csv_result)
		writeCSV('whatsapp_reports_15_latest.csv',whatsapp_csv_result)

	except Error as e:
		print(e)

	finally:
		cur.close()	



