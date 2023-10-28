# importing libraries 

# import MySQLdb
import csv
import smtplib

# getting the query / funtion to return the query 
# make the query template

def branch_installs(title , day_count ,source,frequency ='daily'):
	if(source =='APP'):
		return [title,f"SELECT count(referred_udid) FROM `branch_events_2020` WHERE created_at>= DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and created_at<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY) AND name like 'INSTALL'"]
	elif(source =='WEB'):
		return 1
	elif(source =='WA'):
		return 1
	else:
		return 1


	# sql_query =f"select date(timestamp),count(DISTINCT student_id),count(question_id) from questions WHERE student_id >100 and student_id in (SELECT student_id from students where is_web=0) and timestamp >= DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and timestamp<CURRENT_DATE and created_at<CURRENT_DATE AND name like  'INSTALL'" 
	# return [title , sql_query]


