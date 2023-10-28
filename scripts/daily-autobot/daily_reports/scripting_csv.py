import MySQLdb
import pandas as pd
import numpy as np  


try:
	# report = ""
	db = MySQLdb.connect(host="analytics-reader.cpymfjcydr4n.ap-south-1.rds.amazonaws.com",    # your host, usually localhost
								user="dn-prod",         # your username
								passwd="D0ubtnut@2143",  # your password
								db="classzoo1"
								)
	cur = db.cursor()

	df2 = pd.read_csv('/Users/apple/Downloads/non-blur-dataset.csv')
	qid_list = df2.iloc[:,0].values
	
	for i in range(len(qid_list)):
		sql_query =f"SELECT question_image from questions where question_id  = {qid_list[i]}"
		print(sql_query)
		cur.execute(sql_query)
		rows = cur.fetchall()
		print(rows[0][0])

except Error as e:
        print(e)

finally:
	cur.close()	