# default imports for the mailing function in each report
# import MySQLdb
from dotenv import load_dotenv
load_dotenv()


import pymysql
import sys
import csv
from master_query import * 
from mail import sendMail
from cloud_service import make_graph_and_s3upload
import datetime
from csv_updater import writeCSV
import pandas as pd
from mail import sendMessage
import numpy as np
import os
# import gspread
# from oauth2client.service_account import ServiceAccountCredentials
from pprint import pprint


# scopes = ["https://spreadsheets.google.com/feeds","https://www.googleapis.com/auth/spreadsheets","https://www.googleapis.com/auth/drive.file","https://www.googleapis.com/auth/drive"]
# creds = ServiceAccountCredentials.from_json_keyfile_name("google sheets-94e9b4ecb174.json",scopes)
# client = gspread.authorize(creds)
# sheet = client.open('data_test').sheet1
# data = sheet.get_all_records()
# row_count = len(data)
# row_data = sheet.row_values(row_count+1)

# //try to make databse connection and get results and send email

def getDate():
	return datetime.date.today() + datetime.timedelta(-1)



def getPercentage(cur_value ,prev_value):
	per = (round((cur_value - prev_value)/prev_value,2)*100)
	return per

# print("check percentage value")
# print(getPercentage(10,20))
cur_date =  getDate()
web_csv_result = [cur_date]
app_csv_result = [cur_date]
whatsapp_csv_result = [cur_date]

# global_query_list =[]

web_queries  = get_web_queries(1)
app_queries = get_app_queries(1)
whatsapp_queries = get_whatsapp_queries(1)

# global_query_list.extend(web_queries)
# global_query_list.extend(whatsapp_queries)
# global_query_list.extend(app_queries)

# print(global_query_list)

# print(web_queries)
# print(app_queries)
# print(whatsapp_queries)

mysql_host = os.environ.get('MYSQL_ANALYTICS_HOST')
mysql_username =os.environ.get('MYSQL_READ_USER')
mysql_password = os.environ.get('MYSQL_READ_PWD')
mysql_database = os.environ.get('MYSQL_READ_DATABASE')



# try:
report = ""
db = pymysql.connect(host=mysql_host,    # your host, usually localhost
							user=mysql_username,         # your username
							passwd=mysql_password,  # your password
							db=mysql_database
							)
cur = db.cursor()
print("connected")
# queries = global_query_list
# query ="SELECT count(referred_udid) FROM `branch_events` WHERE created_at>= DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE AND name like  'INSTALL'"
# print(queries)
# print(len(global_query_list))

# for i in range(len(global_query_list)):
# 	# print("ok")
# 	desc = global_query_list[i][0]
# 	print("desc")
# 	print(desc)
# 	print(i)
# 	# print(global_query_list[i][1])
# 	print("query")
# 	print(global_query_list[i][1])
# 	cur.execute(global_query_list[i][1])
# 	rows = cur.fetchall()

# 	for row in rows:
# 		# print(row[0])
# 		# cur_csv_result.append(row[0])
# 		report  =  report + f"<h4>{str(row[0])}</h4>"+ desc 
report ="""
		<div style="width:1000px;height:200px;background:white;  box-shadow: 0 8px 6px -8px black;padding:20px;">
		 <p style="font-size:30px;font-family:'Comic Sans MS',cursive,sans-serif;text-align:center;">Daily Analytics Report - {}</p>
		</div>""".format(str(datetime.date.today() + datetime.timedelta(-1)))

# removing fabric from now , google sheets integration as will not be able to maintain from next month
		# <p style="font-size:30px;font-family:'Comic Sans MS',cursive,sans-serif;">DAU(Daily Active Users) - 574.9K <span style='font-size:15px;'> -1.73%</span></p>
		# <p style="font-size:30px;font-family:'Comic Sans MS',cursive,sans-serif;">Daily New Users- 40.22K <span style='font-size:15px;'> -.31%</span></p>

df_pre_app =  pd.read_csv('master_app_report.csv')
df_pre_web = pd.read_csv('master_web_report.csv')
df_pre_whatsapp = pd.read_csv('master_whatsapp_report.csv')
# print(df_pre_app)
app_last_row =np.array(df_pre_app.iloc[-1:])
web_last_row =  np.array(df_pre_web.iloc[-1:])
whatsapp_last_row =  np.array(df_pre_whatsapp.iloc[-1:])
# print(last_row[0][1])


report =  report +"<br>"+ str(datetime.date.today() + datetime.timedelta(-1)) +" <b>--- App - Metrics ---</b><br><br>"
for i in range(len(app_queries)):
	print("app_queries")
	desc = app_queries[i][0]
	print(desc)
	print(app_queries[i][1])
	cur.execute(app_queries[i][1])
	rows = cur.fetchall()
	# if(i > 5):
	# 	values = [row[1] for row in rows] 
	# 	print(values)
	# else:
	if(1):
		# if(i==0):
		# 	values =[30047]
		# else:
		values = [row[0] for row in rows] 
		print(values)
	# for row in rows:
	# 	print(row[0])
	app_csv_result.append(values[0])
	comparsion_stats = getPercentage(int(values[0]),int(app_last_row[0][i+1]))
	print("comparsion_stats")
	print(comparsion_stats)
	if(comparsion_stats >= 0):
		html_comparison = "<span style='color:green;font-size:15px;'>&uarr;</span>"
	else:
		html_comparison = "<span style='color:red;'>&darr;</span>"
	report  = report + f"<span><b>{str(values[0])}</b>({html_comparison}{str(comparsion_stats)}%)</span>&nbsp;&nbsp;"+ desc + "<br>"

print(report)
report =  report +"<br>"+str(datetime.date.today() + datetime.timedelta(-1))+"<b>--- WEB - Metrics ---</b><br><br>"


for i in range(len(web_queries)):
	print("web_queries")
	desc = web_queries[i][0]
	print(desc)
	print(web_queries[i][1])
	cur.execute(web_queries[i][1])
	rows = cur.fetchall()

	if(i > 5):
		values = [row[1] for row in rows] 
		print(values)
	else:
		values = [row[0] for row in rows] 
		print(values)

	# for row in rows:
	# 	print(row[0])
	# 	web_csv_result.append(row[0])
	# 	report  =  report + f"<b>{str(row[0])}</b>&nbsp;&nbsp;"+ desc + "<br>"
	web_csv_result.append(values[0])
	comparsion_stats = getPercentage(int(values[0]),int(web_last_row[0][i+1]))
	print("comparsion_stats")
	print(comparsion_stats)
	if(comparsion_stats >= 0):
		html_comparison = "<span style='color:green;font-size:15px;'>&uarr;</span>"
	else:
		html_comparison = "<span style='color:red;'>&darr;</span>"	
	report  = report + f"<span><b>{str(values[0])}</b>({html_comparison}{str(comparsion_stats)}%)</span>&nbsp;&nbsp;"+ desc + "<br>"

print(report)

report =  report +"<br>"+ str(datetime.date.today() + datetime.timedelta(-1))+"<b> ---WHATSAPP - Metrics--</b><br><br>"
wa_dummy_arr =[[6374],[9080]]
for i in range(len(whatsapp_queries)):
	print("whatsapp_queries")
	desc = whatsapp_queries[i][0]
	print(desc)
	print(whatsapp_queries[i][1])
	if(1):
		cur.execute(whatsapp_queries[i][1])
		rows = cur.fetchall()
		print(i)
	# if(i > 2):
	# 	# values = [row[1] for row in rows] 
	# 	values = wa_dummy_arr[i-3]
	# 	print(values)
	# 	print(type(values))
	# else:
		values = [row[0] for row in rows] 
		print(values)
		print(type(values))

	# for row in rows:
	# 	print(row[0])
		# cur_value = row[0]
		# df_prev = pd.read_csv("./last15_app_report.csv")
		# prev_value = df_prev.iloc[-1,1:][i]
		# print(cur_value , prev_value)
		# print(prev_value)
	whatsapp_csv_result.append(values[0])
	comparsion_stats = getPercentage(int(values[0]),int(whatsapp_last_row[0][i+1]))
	print("comparsion_stats")
	print(comparsion_stats)
	if(comparsion_stats >= 0):
		html_comparison = "<span style='color:green;font-size:15px;'>&uarr;</span>"
	else:
		html_comparison = "<span style='color:red;'>&darr;</span>"	
	report  = report + f"<span><b>{str(values[0])}</b>({html_comparison}{str(comparsion_stats)}%)</span>&nbsp;&nbsp;"+ desc + "<br>"

	# report  =  report + f"<b>{str(values[0])}</b>&nbsp;&nbsp;"+desc +"<br>"

print(report)

print("data starting")
print(app_csv_result)
print(web_csv_result)
print(whatsapp_csv_result)
print("data stopping")


writeCSV('master_app_report.csv',app_csv_result)
writeCSV('master_web_report.csv',web_csv_result)	
writeCSV('master_whatsapp_report.csv',whatsapp_csv_result)





htmTable = "<h2>Last 15 days metrics - APP</h2>"
df1 = pd.read_csv("./master_app_report.csv")
plot_app_data = df1[-15:]
df1 = df1.iloc[::-1]

html_pre_data_1 = df1.iloc[:15,:]
dates_array = np.array(plot_app_data['date'])
dates_array = list(map(lambda x : x[-2:] , dates_array))



# adding the code for inserting column metrics


# ------------------------- APP ----------------------------

# adding registrations/ installs
app_branch_installs_array  = np.array(html_pre_data_1.iloc[:,1:2])
app_registrations_array = np.array(html_pre_data_1.iloc[:,2:3])
app_ratios_1 =[]

for i in range(len(app_registrations_array)):
	app_ratios_1.append(str(round(((app_registrations_array[i] / app_branch_installs_array[i])[0]),2)*100)+" %")

html_pre_data_1.insert(3,"reg/install", app_ratios_1)

# adding  total questions_asked / users asking questions_asked
app_questions_asked_array  = np.array(html_pre_data_1.iloc[:,4:5])
app_users_asked_array = np.array(html_pre_data_1.iloc[:,5:6])
app_ratios_2 =[]

for i in range(len(app_questions_asked_array)):
	app_ratios_2.append(round(((app_questions_asked_array[i] / app_users_asked_array[i])[0]),2))

html_pre_data_1.insert(6,"Q-Total/Users", app_ratios_2)

# total videos watched / total students watching videos
app_videos_watch_array  = np.array(html_pre_data_1.iloc[:,7:8])
app_users_watch_array = np.array(html_pre_data_1.iloc[:,8:9])
app_ratios_3 =[]

for i in range(len(app_videos_watch_array)):
	app_ratios_3.append(round(((app_videos_watch_array[i] / app_users_watch_array[i])[0]),2))

html_pre_data_1.insert(9,"Videos-Total/Users", app_ratios_3)

html_pre_data_1.reset_index(drop=True, inplace =True)
html_data_1 = html_pre_data_1.to_html()

# ADDING PLOTS FOR APP ---- METRICS

#installations
#questions_asked
#video_views

# graph_installs_app_url
# graph_questions_asked_app_url
# graph_videos_views_app_url
#PARAMS -----  x_array,y_array,x_label,y_label,title,uploaded_image_name
app_plot_array_1 = np.array(plot_app_data['branch_installs']) 
print("branch_installs")
print(app_plot_array_1)
app_plot_array_2 = np.array(plot_app_data['total_questions_asked']) 
print("questions asked")
print(app_plot_array_2)
app_plot_array_3 = np.array(plot_app_data['total_videos_watched']) 
print("video views")
print(app_plot_array_3)

plot_name1 =str(datetime.date.today() + datetime.timedelta(-1)) + "app_installs.png"
plot_name2 =str(datetime.date.today() + datetime.timedelta(-1)) + "app_questions_asked.png"
plot_name3 =str(datetime.date.today() + datetime.timedelta(-1)) + "app_video_views.png"

graph_installs_app_url = make_graph_and_s3upload(dates_array,app_plot_array_1,'Date','App-Installs','App-Installations Stats',plot_name1)
graph_questions_ask_app_url = make_graph_and_s3upload(dates_array,app_plot_array_2,'Dates','Q-Asks','Questions-Asked Stats',plot_name2)
graph_video_views_app_url = make_graph_and_s3upload(dates_array,app_plot_array_3,'Dates','Video-Views','Video-Views Stats',plot_name3)


print(graph_installs_app_url)
print(graph_questions_ask_app_url)
print(graph_video_views_app_url)

htmTable = htmTable + f"<img style='width:400px;height:auto;' src={graph_installs_app_url }> "
htmTable = htmTable + f"<img style='width:400px;height:auto;' src={graph_questions_ask_app_url}>"
htmTable = htmTable + f"<img style='width:400px;height:auto;' src={graph_video_views_app_url}>"
# ------------------------- WEB ----------------------------


htmTable = htmTable  + html_data_1  + "<h2>Last 15 days metrics - WEB</h2>"

df2 = pd.read_csv("./master_web_report.csv")
plot_web_data = df2[-15:]
df2 = df2.iloc[::-1]
# df2.insert(0, {'name': 'dean', 'age': 45, 'sex': 'male'})
html_pre_data_2 = df2.iloc[:15,:]






# adding  total questions_asked / users asking questions_asked

web_questions_asked_array  = np.array(html_pre_data_2.iloc[:,2:3])
web_users_asked_array = np.array(html_pre_data_2.iloc[:,3:4])
web_ratios_1 =[]

for i in range(len(web_questions_asked_array)):
	print("ratio1",web_questions_asked_array[i])
	print("ratio2",web_users_asked_array[i])
	print("ratio3",(web_questions_asked_array[i] / web_users_asked_array[i])[0])
	web_ratios_1.append(round(((web_questions_asked_array[i] / web_users_asked_array[i])[0]),2))

html_pre_data_2.insert(4,"Q-Total/Users", web_ratios_1)



# total videos watched / total students watching videos

web_videos_watch_array  = np.array(html_pre_data_2.iloc[:,5:6])
web_users_watch_array = np.array(html_pre_data_2.iloc[:,6:7])
web_ratios_2 =[]

for i in range(len(web_videos_watch_array)):
	web_ratios_2.append(round(((web_videos_watch_array[i] / web_users_watch_array[i])[0]),2))

html_pre_data_2.insert(7,"Videos-Total/Users", web_ratios_2)
html_pre_data_2.reset_index(drop=True , inplace =True)
html_data_2 = html_pre_data_2.to_html()




web_plot_array_1 = np.array(plot_web_data['registrations']) 
print("branch_installs")
print(web_plot_array_1)
web_plot_array_2 = np.array(plot_web_data['total_questions_asked']) 
print("questions asked")
print(web_plot_array_2)
web_plot_array_3 = np.array(plot_web_data['total_videos_watched']) 
print("video views")
print(web_plot_array_3)

web_plot_name1 =str(datetime.date.today() + datetime.timedelta(-1)) + "web_installs.png"
web_plot_name2 =str(datetime.date.today() + datetime.timedelta(-1)) + "web_questions_asked.png"
web_plot_name3 =str(datetime.date.today() + datetime.timedelta(-1)) + "web_video_views.png"

graph_installs_web_url = make_graph_and_s3upload(dates_array,web_plot_array_1,'Date','App-Installs','WEB-Installations Stats',web_plot_name1)
graph_questions_ask_web_url = make_graph_and_s3upload(dates_array,web_plot_array_2,'Dates','Q-Asks','Questions-Asked Stats',web_plot_name2)
graph_video_views_web_url = make_graph_and_s3upload(dates_array,web_plot_array_3,'Dates','Video-Views','Video-Views Stats',web_plot_name3)


print(graph_installs_web_url)
print(graph_questions_ask_web_url)
print(graph_video_views_web_url)

htmTable = htmTable + f"<img style='width:400px;height:auto;' src={graph_installs_web_url }>"
htmTable = htmTable + f"<img style='width:400px;height:auto;' src={graph_questions_ask_web_url}>"
htmTable = htmTable + f"<img style='width:400px;height:auto;'  src={graph_video_views_web_url}>"

htmTable = htmTable + html_data_2+"<h2>Last 15 days metrics - WHATSAPP</h2>" 
df3 = pd.read_csv("./master_whatsapp_report.csv")
plot_wa_data = df3[-15:]
df3 = df3.iloc[::-1]

html_pre_data_3 = df3.iloc[:15,:]


	# ---------------------------- WHATSAPP ----------------------------

wa_questions_asked_array  = np.array(html_pre_data_3.iloc[:,2:3])
wa_users_asked_array = np.array(html_pre_data_3.iloc[:,3:4])
wa_ratios_1 =[]

for i in range(len(wa_questions_asked_array)):
	wa_ratios_1.append(round(((wa_questions_asked_array[i] / wa_users_asked_array[i])[0]),3))

html_pre_data_3.insert(4,"Q-Total/Users", wa_ratios_1)



# adding  total questions_asked / users asking questions_asked



html_pre_data_3.reset_index(drop=True, inplace =True)
html_data_3 = html_pre_data_3.to_html()





wa_plot_array_1 = np.array(plot_wa_data['registrations']) 
print("branch_installs")
print(wa_plot_array_1)
wa_plot_array_2 = np.array(plot_wa_data['total_questions_asked']) 
print("questions asked")
print(wa_plot_array_2)
# wa_plot_array_3 = np.array(plot_wa_data['total_videos_watched']) 
# print("video views")
# print(wa_plot_array_3)

wa_plot_name1 =str(datetime.date.today() + datetime.timedelta(-1)) + "wa_installs.png"
wa_plot_name2 =str(datetime.date.today() + datetime.timedelta(-1)) + "wa_questions_asked.png"
# wa_plot_name3 =str(datetime.date.today() + datetime.timedelta(-1)) + "wa_video_views.png"

graph_installs_wa_url = make_graph_and_s3upload(dates_array,wa_plot_array_1,'Date','App-Installs','WA-Registrations Stats',wa_plot_name1)
graph_questions_ask_wa_url = make_graph_and_s3upload(dates_array,wa_plot_array_2,'Dates','Q-Asks','Questions-Asked Stats',wa_plot_name2)
# graph_video_views_wa_url = make_graph_and_upload(dates_array,wa_plot_array_3,'Dates','Video-Views','Video-Views Stats',wa_plot_name3)


print(graph_installs_wa_url)
print(graph_questions_ask_wa_url)
# print(graph_video_views_wa_url)

htmTable = htmTable + f"<img style='width:400px;height:auto;'   src={graph_installs_wa_url }>"
htmTable = htmTable + f"<img style='width:400px;height:auto;'  src={graph_questions_ask_wa_url}>"
# htmTable = htmTable + f"<img src={graph_video_views_wa_url}>"

htmTable = htmTable +html_data_3 

df1.to_csv('./'+str(datetime.date.today() + datetime.timedelta(-1))+'@APP',index =None ,header=True)
df2.to_csv('./'+str(datetime.date.today() + datetime.timedelta(-1))+'@WEB',index =None ,header=True)
df3.to_csv('./'+str(datetime.date.today() + datetime.timedelta(-1))+'@WHATSAPP',index =None ,header=True)



# csv_reports_to_write= ['master_app_report.csv','master_web_report.csv','master_whatsapp_report.csv']
# csv_datas = [app_csv_result ,web_csv_result ,whatsapp_csv_result]
# i=0
# for file_name in csv_reports_to_write:
# 	with open(file_name ,'w')  as  writeFile:
# 		writer = csv.writer(writeFile)
# 		writer.writerow(csv_datas[i])
# 		i = i + 1
# 		writeFile.close()

# with open('master_app_report.csv', 'w',newline="") as writeFile1:
# 	writer = csv.writer(writeFile1)
# 	writer.writerow(app_csv_result)
# 	writeFile1.close()

#    with open('master_web_report.csv', 'w',newline="") as writeFile2:
#    	writer = csv.writer(writeFile2)
#    	writer.writerow(web_csv_result)
#    	writeFile2.close()

#    with open('master_whatsapp_report.csv', 'w',newline="") as writeFile3:
#    	writer = csv.writer(writeFile3)
#    	writer.writerow(whatsapp_csv_result)
#    	writeFile3.close()


# print(df)
# print(html_data)


# files_attaching = ['master_app_report.csv','master_whatsapp_report.csv']

# sendMail(report + htmTable,'daily_reports/master_app_report.csv','daily_pcm_video_views')

files_to_attach = []
files_to_attach.append(str(datetime.date.today() + datetime.timedelta(-1))+'@APP')
files_to_attach.append(str(datetime.date.today() + datetime.timedelta(-1))+'@WEB')
files_to_attach.append(str(datetime.date.today() + datetime.timedelta(-1))+'@WHATSAPP')


sendMessage(report + htmTable,files_to_attach)

# except:
print("not working")

# finally:
cur.close()	


