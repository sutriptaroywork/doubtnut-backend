
# import MySQLdb
import csv
import smtplib

def new_users_questions_ask_count(title , day_count , source ,frequency ='daily'):
	if(source =='APP'):
		# return [title,f"select date(a.timestamp),count(distinct a.student_id) from `questions` as a left join `students` as b on a.student_id =b.student_id WHERE a.student_id >100 and a.doubt not like 'WEB' and a.doubt not like 'WHA%' and date(b.timestamp)>=DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and b.timestamp<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY) and date(a.timestamp)>=DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and a.timestamp<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY)"]
		return [title ,f"SELECT count(DISTINCT (a.student_id)) from (SELECT question_id,student_id FROM `questions` where doubt not like 'WEB' and doubt not like 'WHATSAPP' and timestamp>=DATE_SUB(CURRENT_DATE,INTERVAl 1 DAY) and timestamp<CURRENT_DATE) as a left join (SELECT student_id from students where timestamp>=DATE_SUB(CURRENT_DATE,INTERVAl 1 DAY) and timestamp<CURRENT_DATE and is_web<>1) as b on a.student_id=b.student_id where b.student_id is not NULL"]
	elif(source =='WEB'):
		return 1
	elif(source =='WA'):
		return [title,f"SELECT count(DISTINCT (a.student_id)) from (SELECT question_id,student_id FROM `questions` where doubt like 'WHATSAPP' and timestamp>=DATE_SUB(CURRENT_DATE,INTERVAl 1 DAY) and timestamp<CURRENT_DATE) as a left join (SELECT student_id from whatsapp_students where timestamp>=DATE_SUB(CURRENT_DATE,INTERVAl 1 DAY) and timestamp<CURRENT_DATE) as b on a.student_id=b.student_id where b.student_id is not NULL"]
	else:
		return 1


		# return [title ,f"select date(a.timestamp),count(distinct a.student_id) from `questions` as a left join `students` as b on a.student_id =b.student_id WHERE a.student_id >100 and a.doubt like 'WHA%' and date(b.timestamp)>=DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and b.timestamp<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY) and date(a.timestamp)>=DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and a.timestamp<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY)"]
