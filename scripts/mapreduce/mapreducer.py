from multiprocessing import Pool
from time import time
import mysql.connector
from elasticsearch import Elasticsearch
import json
import re
from elasticsearch import helpers
# from decouple import config
import certifi
index_name= "question_bank_v2"
meta_index_name= "question_bank_v2_meta"
type="repository"
db =mysql.connector.connect(host="reader-1.cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
                     # your host, usually localhost
                     user="dn-prod",  # your username
                     passwd="D0ubtnut@2143",  # your password
                     db="classzoo1"
                     )

cursor = db.cursor(dictionary=True)
print("connected mysql")
# esClient = Elasticsearch(['https://es-admin:D0ubtnut@123@es.doubtnut.com'])
# esClient = Elasticsearch(hosts = [{'host': 'https://es-admin:D0ubtnut@123@es.doubtnut.com'}])
esClient=Elasticsearch('es-admin:D0ubtnut@123@es.doubtnut.com',  use_ssl=True, verify_certs=True, ca_certs=certifi.where())
print("connected es")
"""
      {
        "_index": "question_bank_v1",
        "_type": "repository",
        "_id": "105",
        "_score": 1,
        "_source": {
          "chapter": 0,
          "is_answered": 1,
          "ocr_text": " Examine each of the following relations given below  and state in each case,giving reasons whether it is a  function or not? (i) R={(2,1),(3,1),(4,2)} (ii) R={(2,2),(2,4),(3,3),(4,4)}R={(1,2),(2,3),(3,4),(4,5),(5,6),(6,7)}",
          "is_text_answered": 0,
          "subject": "MATHS"
        }
      },

    {
        "_index": "question_bank_v1_meta",
        "_type": "repository",
        "_id": "89",
        "_score": 1,
        "_source": {
          "pretty_text": "List  all the subsets of the set `{1, 0, 1 }dot`"
        }
      }
"""

def _strip_html_tags_and_back_tick(ocr_text):
    """
    Strips the HTML tags such as <img>, <br> from the question text. Also removes the back-ticks.

    :param ocr_text: Input question text
    :type ocr_text: str
    :return: question OCR with all the HTML tags and back-ticks removed.
    :rtype: str
    """
    # Remove all the back-tick signs
    ocr_text = ocr_text.replace("`", "")
    # Remove all the html tags:
    ocr_text = re.sub("<[^>]*>", "", ocr_text)
    return ocr_text

def getDocsForIndexingHindi():
    try:
        #student_id in (69,73,77,78)
        cursor.execute("""SELECT a.*,b.english as english
                    from (SELECT question_id,is_answered,is_text_answered,ocr_text,student_id,subject from questions where student_id in (22,69,73,77,78,88) and (is_answered = 1 or is_text_answered=1))
                    as a LEFT JOIN `questions_localized` as b on a.question_id = b.question_id and b.question_id is not null and b.english is not null
                    """)
        rows_hindi = cursor.fetchall()
        print("rows3 length")
        print(rows_hindi)
        return rows_hindi
    except Exception as e:
        print("error")
        print(e)
    finally:
        print('ok')
        cursor.close()

def getDocsForIndexingOtherSubjects():
    try:
        #OTHER SUBJECTS
        cursor.execute("""
                    SELECT question_id,
                           chapter,
                           is_answered,
                           is_text_answered,
                           ocr_text,
                           student_id,
                           subject
                    FROM   questions
                    WHERE  subject <> 'MATHS'
                           AND (is_answered = 1 or is_text_answered=1)
                           AND is_skipped = 0
                           AND matched_question IS NULL
                           AND student_id not in (22,69,73,77,78,88,82,83,85,86)
                    """)
        rows_other = cursor.fetchall()
        print("rows2 length")
        print(rows_other)
        return rows_other
    except Exception as e:
        print("error")
        print(e)

def getDocsForIndexingMaths():
    try:
        #MATHS
        cursor.execute("""SELECT a.question_id, a.chapter, a.is_answered, a.is_text_answered, a.student_id,a.subject,
                CASE
                         WHEN b.ocr_text IS NOT NULL THEN b.ocr_text
                         WHEN a.ocr_text LIKE '%<math%' THEN a.question
                         ELSE a.ocr_text
                       END AS ocr_text
                FROM   (SELECT *
                        FROM   questions
                        WHERE  (is_answered = 1 or is_text_answered=1)
                               AND matched_question IS NULL
                               AND is_skipped = 0
                               AND subject LIKE 'MATHS' and student_id not in (22,69,73,77,78,88,82,83,85,86)) AS a
                       LEFT JOIN ocr_latest AS b
                              ON a.question_id = b.question_id""")
        rows = cursor.fetchall()
        return rows
        print("rows1 length")
        print(rows)
        return rows
    except Exception as e:
        print("error")
        print(e)




def addToIndexBulk(rows):
      print(rows['question_id'])
      a=[22,69,73,77,78]
      if(rows['student_id'] in a):
          if(rows['english'] is not None) :
            search_ocr = _strip_html_tags_and_back_tick(rows['english'])
            insert_obj = {
                  'ocr_text':search_ocr,
                  'is_answered':rows['is_answered'],
                  'is_text_answered':rows['is_text_answered'],
                  'subject':rows['subject'],
                  'chapter':0
              }
            res = esClient.index(index=index_name, id=rows['question_id'], doc_type=type ,body=insert_obj)
            insert_obj_meta = {
                  'pretty_text':rows['ocr_text']
              }
            res = esClient.index(index=meta_index_name, id=rows['question_id'], doc_type=type,body=insert_obj_meta)
      else:
        search_ocr = _strip_html_tags_and_back_tick(rows['ocr_text'])
        insert_obj = {
            'ocr_text':search_ocr,
            'is_answered':rows['is_answered'],
            'is_text_answered':rows['is_text_answered'],
            'subject':rows['subject'],
            'chapter':0
        }
        res = esClient.index(index=index_name, id=rows['question_id'], doc_type=type ,body=insert_obj)
        insert_obj_meta = {
            'pretty_text':rows['ocr_text']
        }
        res = esClient.index(index=meta_index_name, id=rows['question_id'], doc_type=type,body=insert_obj_meta)

      # helpers.bulk(es,arr)



#
if __name__ == "__main__":
    t1 = time()
    # es = Elasticsearch()
    docs = getDocsForIndexingMaths()
    print("length here")
    print(len(docs))
    p = Pool(10)
    result = p.map(addToIndexBulk,docs)
    p.close()
    p.join()
    docs1 = getDocsForIndexingOtherSubjects()
    p = Pool(10)
    result = p.map(addToIndexBulk,docs1)
    p.close()
    p.join()
    docs2 = getDocsForIndexingHindi()
    p = Pool(10)
    result = p.map(addToIndexBulk,docs2)
    p.close()
    p.join()
    print("it took around {} seconds".format(time()-t1))



# basic function for one by one
# if __name__ == "__main__":
#     t1 = time()
#     es = Elasticsearch()
#     docs =  getDocsForIndexing()
#     addToIndex(es,docs)
#
#     print("it finished in {} secs".format(time()-t1))



# 127.472193956 seconds
