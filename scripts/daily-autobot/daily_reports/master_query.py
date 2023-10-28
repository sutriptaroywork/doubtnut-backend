# import MySQLdb
import csv
import smtplib


from sql_query.branch_installs import branch_installs
from sql_query.registrations import registrations
from sql_query.video_views import video_views_count
from sql_query.user_video_views import user_videos_watch_count
from sql_query.questions import questions_asked_count
from sql_query.user_questions_ask import user_asked_questions_count
from sql_query.new_questions import new_questions_ask_count
from sql_query.new_users_questions import new_users_questions_ask_count
from sql_query.new_videos import new_video_views_count
from sql_query.new_users_videos import  new_users_video_views_count
# from sql_query.questions_asked import questions_asked_count

# append all the queries here in the list for the daily reports one
# with the text too to be sent and formatted

# get app queries
def get_app_queries(i):
	queries_list =[]
	queries_list.append( branch_installs('App Installations  ' ,i,'APP'))
	queries_list.append( registrations('  App Registrations ',i ,'APP'))
	queries_list.append(questions_asked_count('Number of Questions Asked ',i,'APP'))
	queries_list.append(user_asked_questions_count('Number of Students who asked Questions',i,'APP'))
	queries_list.append( video_views_count('Number of Videos Watched ',i,'APP'))
	queries_list.append(user_videos_watch_count('Number of Users Watching Video ' ,i,'APP'))
	queries_list.append(new_users_questions_ask_count('Number of New Users Asking Questions ' ,i,'APP'))
	queries_list.append(new_questions_ask_count('Number of  Questions asked by New Users ' ,i,'APP'))
	queries_list.append(new_users_video_views_count('Number of New Users Watching Video ' ,i,'APP'))
	queries_list.append(new_video_views_count('Number of Video Views By New Users' ,i,'APP'))
	return queries_list
# get web queries
def get_web_queries(i):
	queries_list =[]
	queries_list.append( registrations(' Registrations ',i ,'WEB'))
	queries_list.append(questions_asked_count('Number of Questions asked',i,'WEB'))
	queries_list.append(user_asked_questions_count('Number of Students who asked Questions',i,'WEB'))
	queries_list.append( video_views_count('Number of Videos Watched ',i,'WEB'))
	queries_list.append(user_videos_watch_count(' Number of Users Watching Video' , i, 'WEB'))
	return queries_list
	
# get whatsapp queries
def get_whatsapp_queries(i):
	queries_list =[]
	queries_list.append( registrations('  Registrations',i ,'WA'))
	queries_list.append(questions_asked_count('Number of Questions Asked',i,'WA'))
	queries_list.append( user_asked_questions_count('Number of Students Asking Questions',i,'WA'))
	queries_list.append(new_users_questions_ask_count('Number of New Users Asking Questions ' ,i,'WA'))
	queries_list.append(new_questions_ask_count('Number of  Questions asked by New Users ' ,i,'WA'))
	return queries_list




# sample function
# def get_query_list():
# 	queries_list =[]
# 	queries_list.append( branch_installs('were total app installations that took place today' ,1,'WA'))
# 	queries_list.append( registrations(' werer total app installtions that took place 2 days ago',1 ,'APP'))
# 	queries_list.append( video_views_count('were the total count of students that happened today',1,'APP'))
# 	return queries_list




# print(get_query_list())



