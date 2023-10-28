
# import MySQLdb
import csv
import smtplib

def new_users_video_views_count(title,day_count , source ,frequency ='daily'):
	if(source =='APP'):
		# return [title,f"select date(a.created_at),count(distinct a.student_id) from `video_view_stats` as a left join `students` as b on a.student_id =b.student_id WHERE (a.source like 'and%' or (a.source like 'WHA%' and a.view_from like 'DEEPLINK')) and date(b.timestamp)>=DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and b.timestamp<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY) and date(a.created_at)>=DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and a.created_at<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY)"]
		return [title , f"SELECT count(DISTINCT (a.student_id)) from (SELECT view_id,student_id FROM `video_view_stats` where (source like 'android' or (source like 'WHA' and view_from like 'DEEPLINK')) and created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE) as a left join (SELECT student_id from students where is_web<>1 and timestamp>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and timestamp<CURRENT_DATE) as b on a.student_id=b.student_id where b.student_id is not NULL"]
	elif(source =='WEB'):
		return 1
	elif(source =='WA'):
		return 1
	else:
		return 1
