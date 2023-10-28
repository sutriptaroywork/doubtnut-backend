# import MySQLdb
import csv
import smtplib

# getting the query / funtion to return the query 
# make the query template

def user_asked_questions_count(title , day_count , source ,frequency ='daily'):
	if(source =='APP'):
		return [title,f"select count(distinct student_id) from questions WHERE student_id >100 and doubt not like 'WEB' and doubt not like 'WHA%' and timestamp >= DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and timestamp<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY)"]
	elif(source =='WEB'):
		return [title ,f"select count(distinct student_id) from questions WHERE student_id >100 and doubt like 'WEB' and timestamp >= DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and timestamp<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY)"]
	elif(source =='WA'):
		return [title , f"select count(distinct student_id) from questions WHERE student_id >100 and doubt like 'WHA%' and timestamp >= DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and timestamp<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY)"]
	else:
		return 1