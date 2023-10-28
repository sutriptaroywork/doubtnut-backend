import pandas as pd
import csv
import mysql.connector
import math
from tqdm import tqdm



db_read =mysql.connector.connect(host="", # your host, usually localhostcl
                            user="",  # your username
                            passwd="",  # your password
                            db="" # database
                            )

cursor = db_read.cursor(dictionary=True)


#fetch list of mobile numbers having duplicates
# all_mobile_number_with_duplicates = pd.read_csv('filepath')
filename = 'sample_mobile_list.csv'
all_mobile_number_with_duplicates = pd.read_csv(filename)
# test_all_mobile_number_with_duplicates  = all_mobile_number_with_duplicates.head(1)



#######  - - - - - - - -  code < begins > - - - - - - - -   #######

def getStudentRowsByMobile(mobile_number):
    cursor.execute("""
                            SELECT * FROM 
                            students 
                            WHERE 
                            mobile = '{}'
                    """.format(mobile_number))
    student_rows = cursor.fetchall()
    return student_rows


def checkStudentsWhoseVip(mobile_number):
    cursor.execute("""
                        SELECT distinct(a.student_id),a.timestamp
                        FROM ((select * from students where mobile ='{}')
                        AS a 
                        INNER JOIN 
                        (SELECT * FROM `student_package_subscription`) as b 
                        on a.student_id=b.student_id) 
                        ORDER by a.timestamp ASC
                        LIMIT 1
                    """.format(mobile_number))
    vip_student_rows = cursor.fetchall()
    return vip_student_rows

def updateAllDuplicateStudentRows(override_mobile,query_mobile_number,preserved_student_id):
    update_query="""UPDATE students SET mobile = '{}' where mobile = '{}' and student_id <> {}""".format(override_mobile,query_mobile_number,preserved_student_id)
    print(update_query)
    cursor.execute(update_query)
    db_read.commit()

 
# # duplicate_mobile_numbers_df 
# duplicate_mobile_numbers_df =pd.read_csv('./test.csv')


for  duplicate_row  in all_mobile_number_with_duplicates.itertuples():
    mobile_number = duplicate_row[1]
    override_mobile = 'dup{}dup'.format(mobile_number)
    # mobile_rows
    all_duplicate_rows = getStudentRowsByMobile(mobile_number)
    if(len(all_duplicate_rows) > 1):
        oldest_row_id = all_duplicate_rows[0].get('student_id')   # currently in use also ( every duplicate user would be referring to this only so why to lose data)
        print('Oldest row',oldest_row_id)
        get_student_vip_rows= checkStudentsWhoseVip(mobile_number)
        if(len(get_student_vip_rows) > 0):
            preserved_student_id = get_student_vip_rows[0][1]
            updateAllDuplicateStudentRows(override_mobile,mobile_number,preserved_student_id)
        else:   
            updateAllDuplicateStudentRows(override_mobile,mobile_number,oldest_row_id)

#########  - - - -- -  - code  < ends > - - -- -   ##########



