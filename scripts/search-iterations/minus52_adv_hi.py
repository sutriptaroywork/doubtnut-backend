from datetime import datetime
import pymongo
import psycopg2
import pandas as pd
import re
import time
import operator
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from scipy.sparse import csr_matrix
import sparse_dot_topn.sparse_dot_topn as ct
import networkx as nx
import requests
import json
import mysql.connector
from elasticsearch import Elasticsearch
from fuzzywuzzy import fuzz


con = psycopg2.connect(dbname='prodredshift', host='rs-prod-dn.cdde349bo4cr.ap-south-1.redshift.amazonaws.com',
                       port='5439', user='', password='')
cur = con.cursor()

query = """
select a.question_id, a.ocr_text, a.locale as question_locale, c.locale as user_locale, a.question_image, a.student_id from ((select * from 
classzoo1.questions_ocr where curtimestamp>=CURRENT_DATE-7 and locale = 'hi') as a left join (select * from classzoo1.video_view_stats vvs)
as b on a.question_id=b.parent_id join (select * from classzoo1.students) as c on a.student_id=c.student_id) where b.parent_id
is null
"""

cur.execute(query)

data1 = cur.fetchall()
df = pd.DataFrame(data1)

doc_count = df.shape[0]

cur.close()
con.close()
esClient1 = Elasticsearch(['https://vpc-dn-private-xwfzzm23aa4eqclkbg2igad5zm.ap-south-1.es.amazonaws.com/'],
                          timeout=30, max_retries=10, retry_on_timeout=True)
print("connected es")


class StringMatch():

    def __init__(self, source_names, target_names):
        self.source_names = source_names
        self.target_names = target_names
        self.ct_vect = None
        self.tfidf_vect = None
        self.vocab = None
        self.sprse_mtx = None

    def tokenize(self, analyzer='word', n=3):
        '''
        Tokenizes the list of strings, based on the selected analyzer

        :param str analyzer: Type of analyzer ('char_wb', 'word'). Default is trigram
        :param str n: If using n-gram analyzer, the gram length
        '''
        # Create initial count vectorizer & fit it on both lists to get vocab
        self.ct_vect = CountVectorizer(analyzer=analyzer, ngram_range=(n, n))
        self.vocab = self.ct_vect.fit(
            self.source_names + self.target_names).vocabulary_

        # Create tf-idf vectorizer
        self.tfidf_vect = TfidfVectorizer(
            vocabulary=self.vocab, analyzer=analyzer, ngram_range=(n, n))

    def match(self, ntop=1000, lower_bound=0.975, output_fmt='df'):
        '''
        Main match function. Default settings return only the top candidate for every source string.

        :param int ntop: The number of top-n candidates that should be returned
        :param float lower_bound: The lower-bound threshold for keeping a candidate, between 0-1.
                                   Default set to 0, so consider all canidates
        :param str output_fmt: The output format. Either dataframe ('df') or dict ('dict')
        '''
        ntop=2000
        self._awesome_cossim_top(ntop, lower_bound)

        if output_fmt == 'df':
            match_output = self._make_matchdf()
        elif output_fmt == 'dict':
            match_output = self._make_matchdict()

        return match_output

    def _awesome_cossim_top(self, ntop, lower_bound):
        ''' https://gist.github.com/ymwdalex/5c363ddc1af447a9ff0b58ba14828fd6#file-awesome_sparse_dot_top-py '''
        # To CSR Matrix, if needed
        A = self.tfidf_vect.fit_transform(self.source_names).tocsr()
        B = self.tfidf_vect.fit_transform(
            self.target_names).transpose().tocsr()
        M, _ = A.shape
        _, N = B.shape

        idx_dtype = np.int32

        nnz_max = M * ntop

        indptr = np.zeros(M + 1, dtype=idx_dtype)
        indices = np.zeros(nnz_max, dtype=idx_dtype)
        data = np.zeros(nnz_max, dtype=A.dtype)

        ct.sparse_dot_topn(
            M, N, np.asarray(A.indptr, dtype=idx_dtype),
            np.asarray(A.indices, dtype=idx_dtype),
            A.data,
            np.asarray(B.indptr, dtype=idx_dtype),
            np.asarray(B.indices, dtype=idx_dtype),
            B.data,
            ntop,
            lower_bound,
            indptr, indices, data)

        self.sprse_mtx = csr_matrix((data, indices, indptr), shape=(M, N))

    def _make_matchdf(self):
        ''' Build dataframe for result return '''
        # CSR matrix -> COO matrix
        cx = self.sprse_mtx.tocoo()

        # COO matrix to list of tuples
        match_list = []
        for row, col, val in zip(cx.row, cx.col, cx.data):
            match_list.append(
                (row, self.source_names[row], col, self.target_names[col], val))

        # List of tuples to dataframe
        colnames = ['Row Idx', 'Title',
                    'Candidate Idx', 'Candidate Title', 'Score']
        match_df = pd.DataFrame(match_list, columns=colnames)

        return match_df

    def _make_matchdict(self):
        ''' Build dictionary for result return '''
        # CSR matrix -> COO matrix
        cx = self.sprse_mtx.tocoo()

        # dict value should be tuple of values
        match_dict = {}
        for row, col, val in zip(cx.row, cx.col, cx.data):
            if match_dict.get(row):
                match_dict[row].append((col, val))
            else:
                match_dict[row] = [(col, val)]

        return match_dict


def getTopicClassificationForQuestion(question_text):
    uri = 'http://preprocess.doubtnut.internal/api/v1/detect-ocr-topic'
    payload = {
        "ocrText": question_text
    }
    headers = {
        'Content-Type': 'application/json',
    }
    response = requests.post(uri, data=json.dumps(payload), headers=headers)
    json_res = response.json()
    return json_res


def getUpdateAndInsertQuestionRow(question_id):
    try:
       # print('inside sql function')
        db = mysql.connector.connect(
            host="dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
            # your host, usually localhost
            user="meghna",  # your username
            passwd="9H0vh/1YGZiVgVTGQng=",  # your password
            db="classzoo1"
        )
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
                            SELECT * FROM 
                            questions_new 
                            WHERE 
                            question_id = {}
                    """.format(question_id))
        question_rows = cursor.fetchall()

        insert_dict = question_rows[0]
        del insert_dict['question_id']
        student_id_dict = {'student_id': -52}
        topic_detection_ocr_text = insert_dict['ocr_text']
        topic_data_response = getTopicClassificationForQuestion(
            topic_detection_ocr_text)
        chapter_detected = topic_data_response.get('data').get('topic')[0]
        if (chapter_detected is None or len(chapter_detected) == 0):
            chapter_detected = 'NONE'
        chapter_dict = {'chapter': chapter_detected}
        insert_dict.update(student_id_dict)
        insert_dict.update(chapter_dict)
        table_name = 'questions'
        placeholder = ", ".join(["%s"] * len(insert_dict))
        stmt = "insert into `{table}` ({columns}) values ({values});".format(table=table_name,
                                                                             columns=",".join(
                                                                                 insert_dict.keys()),
                                                                             values=placeholder)
        cursor.execute(stmt, list(insert_dict.values()))
        # print('inserted in mysql')
        db.commit()
    except Exception as e:
        print(e)
    finally:
        cursor.close()


def call_flagr():
    uri = 'https://flagr.internal.doubtnut.com/api/v1/evaluation'
    payload = {
        "entityContext": {
            "studentId": 0
        },
        "flagID": 3,
    }
    headers = {
        'Content-Type': 'application/json',
    }
    response = requests.post(uri, data=json.dumps(payload), headers=headers)
    json_res = response.json()
    return json_res


def call_search_service(iterations):
    uri = f'http://search-service.doubtnut.internal{iterations.get("apiUrl")}'
    headers = {
        'Content-Type': 'application/json',
    }
    response = requests.post(uri, data=json.dumps(iterations), headers=headers)
    json_res = response.json()
    return json_res


df.columns = ['question_id', 'ocr', 'question_locale',
              'app_language', 'question_image', 'student_id']

qid_ocr_dict = {}
qid_stdid_dict = {}
qid_queloc_dict = {}
stid_apploc_dict = {}
qid_qimage_dict = {}
for i, j in df.iterrows():
    qid_ocr_dict[j['ocr']] = j['question_id']
    qid_stdid_dict[j['question_id']] = j['student_id']
    qid_qimage_dict[j['question_id']] = j['question_image']

for i, j in df.iterrows():
    stid_apploc_dict[j['student_id']] = j['app_language']


df = df['ocr']

df.columns = ['feedback']

df = df.to_frame()
df.columns = ['feedback']

df = df[df['feedback'].notnull()]


search_list = df.feedback.values.tolist()
set_search_list = sorted(set(search_list))

titlematch = StringMatch(set_search_list, search_list)
titlematch.tokenize()
match_df = titlematch.match(2000, 0.975)

match_df = match_df[match_df['Row Idx'] != match_df['Candidate Idx']]
match_df['mer'] = pd.Series(
    list(zip(match_df["Title"], match_df["Candidate Title"]))).map(list)

match_df = match_df[~match_df['mer'].isnull()]

l = match_df['mer'].values.tolist()

g1 = nx.Graph(l)
o = nx.connected_components(g1)

out = list(o)

llis = []
for i in out:
    llis.append(sorted(i))

comb_df_hi = pd.DataFrame({'text': llis})

comb_df_hi['freq'] = comb_df_hi['text'].apply(lambda x: len(x))

comb_df_hi['qid_map'] = comb_df_hi['text'].apply(
    lambda x: [qid_ocr_dict.get(item, item) for item in x])

comb_df_hi['std_id_map'] = comb_df_hi['qid_map'].apply(
    lambda x: [qid_stdid_dict.get(item, item) for item in x])
comb_df_hi['queimg_map'] = comb_df_hi['qid_map'].apply(
    lambda x: [qid_qimage_dict.get(item, item) for item in x])
comb_df_hi['apploc_map'] = comb_df_hi['std_id_map'].apply(
    lambda x: [stid_apploc_dict.get(item, item) for item in x])

comb_df_hi['unique_freq'] = comb_df_hi['std_id_map'].apply(
    lambda x: len(sorted(set(x))))

comb_df_hi = comb_df_hi.sort_values('unique_freq', ascending=False)

comb_df_hi = comb_df_hi[comb_df_hi['unique_freq'] >= 10]

# final_comb_df = comb_df.head(5)
# print(comb_df.shape)


comb_df_hi1 = comb_df_hi.reset_index(drop='true')


final_hi_coc = pd.DataFrame()
for i in range(comb_df_hi1.shape[0]):
    search_list = comb_df_hi1['text'][i]
    set_search_list = sorted(set(search_list))

    titlematch = StringMatch(set_search_list, search_list)
    titlematch.tokenize()
    match_df_hi1 = titlematch.match(2000, 0.985)
    match_df_hi1 = match_df_hi1[match_df_hi1['Row Idx']
                                != match_df_hi1['Candidate Idx']]
    match_df_hi1['mer'] = pd.Series(
        list(zip(match_df_hi1["Title"], match_df_hi1["Candidate Title"]))).map(list)

    match_df_hi1 = match_df_hi1[~match_df_hi1['mer'].isnull()]
    l = match_df_hi1['mer'].values.tolist()

    g1 = nx.Graph(l)
    o = nx.connected_components(g1)

    out = list(o)

    llis = []
    for i in out:
        llis.append(sorted(i))

    coc = pd.DataFrame({'text': llis})

    final_hi_coc = final_hi_coc.append(coc, ignore_index=True)


final_hi_coc['freq'] = final_hi_coc['text'].apply(lambda x: len(x))

final_hi_coc['qid_map'] = final_hi_coc['text'].apply(
    lambda x: [qid_ocr_dict.get(item, item) for item in x])
final_hi_coc['std_id_map'] = final_hi_coc['qid_map'].apply(
    lambda x: [qid_stdid_dict.get(item, item) for item in x])
final_hi_coc['std_id_map'] = final_hi_coc['qid_map'].apply(
    lambda x: [qid_stdid_dict.get(item, item) for item in x])
final_hi_coc['queimg_map'] = final_hi_coc['qid_map'].apply(
    lambda x: [qid_qimage_dict.get(item, item) for item in x])
final_hi_coc['apploc_map'] = final_hi_coc['std_id_map'].apply(
    lambda x: [stid_apploc_dict.get(item, item) for item in x])

final_hi_coc['unique_freq'] = final_hi_coc['std_id_map'].apply(
    lambda x: len(sorted(set(x))))

final_hi_coc = final_hi_coc.sort_values('unique_freq', ascending=False)

final_hi_coc = final_hi_coc[final_hi_coc['unique_freq'] >= 10]
print("LENGTH_OG_DF", len(final_hi_coc))

final_hi_coc['priority'] = final_hi_coc['freq']/doc_count

# for i in range(final_hi_coc.shape[0]):
#     print("*******************************************")
#     print(final_hi_coc['text'][i])

final_hi_coc = final_hi_coc.reset_index(drop=True)

vlang = pd.DataFrame(['hi'], columns=['video_lang'])

a = pd.concat([vlang]*final_hi_coc.shape[0]).reset_index(drop=True)
b = pd.concat([final_hi_coc]*3).sort_index().reset_index(drop=True)

hindi_df = a.join(b)
print("LENGTH_RETRO_DF", len(hindi_df))


myclient = pymongo.MongoClient(
    "mongodb://mongo-rs1-1.doubtnut.internal:27017,mongo-rs1-2.doubtnut.internal:27017,mongo-rs1-3.doubtnut.internal:27017/{database}?replicaSet=rs0&readPreference=secondaryPreferred&connectTimeoutMS=60000&socketTimeoutMS=60000&retryWrites=true")
mydb = myclient["doubtnut"]
mycol = mydb["unmatched_user_questions_weekly_clusters"]
print(mydb)
print(mycol)

count = 0
for index, row in hindi_df.iterrows():
    question_id_map = row['qid_map']
    mydict1 = {
        "createtime": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "cluster_id":  datetime.now().strftime("%s") + str(count),
        "question_locale": 'hi',
        "freq": row['freq'],
        "video_locale": row['video_lang'],
        "priority": row['priority'],
        "is_answered": 0,
        "cluster_type":"hindi"
    }
    for iter_counter, question_id in enumerate(question_id_map):
        dict2 = {}
        dict2.update(mydict1)
        dict2.update({
            "question_id": question_id,
            "text": row['text'][iter_counter],
            "student_id": row['std_id_map'][iter_counter],
            "question_image": row['queimg_map'][iter_counter],
            "user_locale": row['apploc_map'][iter_counter],
        })
        count += 1
        print("inserted")
        x = mycol.insert_one(dict2)
