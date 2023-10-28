# import MySQLdb
import csv
import smtplib

# getting the query / funtion to return the query 
# make the query template

def registrations(title , day_count, source ,frequency ='daily'):
	if(source =='APP'):
		return [title,f"SELECT count(student_id) FROM `students` WHERE is_web<>1 and (udid not like '' or udid is not NULL) and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE"]
		# return[title,f"SELECT count(student_id) FROM `students` WHERE is_web<>1 and (udid not like '' or udid is not NULL) and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY) and timestamp<CURRENT_DATE)"]
	elif(source =='WEB'):
		return [title,f"SELECT  count(student_id) FROM `students` WHERE timestamp>= DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and timestamp<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY) AND is_web =1"]
	elif(source =='WA'):
		return [title,f"SELECT count(student_id) FROM `whatsapp_students` WHERE timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE"]
		# return [title ,f"SELECT  count(student_id) FROM `students` WHERE timestamp>= DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and timestamp<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY) AND is_web =2"]
	else:
		return 1




## return [title,f"SELECT  count(student_id) FROM `students` WHERE timestamp>= DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and timestamp<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY) AND is_web<>1 and (udid not like '' or udid is not NULL)"]
