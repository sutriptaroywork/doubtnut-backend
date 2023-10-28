# import MySQLdb
import csv
import smtplib

# getting the query / funtion to return the query 
# make the query template

def user_videos_watch_count(title , day_count , source , frequency ='daily'):
	if(source =='APP'):
		return [title ,f"select count(distinct student_id) from video_view_stats WHERE  (source like 'and%' or (source like 'WHA%' and view_from like 'DEEPLINK')) and created_at>= DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and created_at<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY)"]
	elif(source =='WEB'):
		return [title ,f"select count(distinct student_id) from video_view_stats WHERE  (source like 'WEB%' or (source like 'WHA%' and view_from like 'DEEPLINK_WEB')) and created_at>= DATE_SUB(CURRENT_DATE, INTERVAl {day_count} DAY) and created_at<DATE_SUB(CURRENT_DATE, INTERVAl {day_count-1} DAY)"]
	elif(source =='WA'):
		return 1
	else:
		return 1
