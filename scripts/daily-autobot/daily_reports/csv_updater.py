import csv
import pandas as pd
import datetime


def writeCSV(filename, data_arr):
	with open(filename,'a') as cur_csv:
		csv_writer = csv.writer(cur_csv, delimiter=',',quotechar='"', quoting=csv.QUOTE_MINIMAL)
		csv_writer.writerow(data_arr)
		# views_writer.writerow(['date(created_at)','count(DISTINCT student_id)','count(view_id)'])
		cur_csv.close()



# df = pd.read_csv('testing_video_views.csv')
# df = df.ix[-1:]
# print(df.ix[-1:].to_html)
