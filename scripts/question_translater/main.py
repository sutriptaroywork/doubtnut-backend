from hindi_translator import HindiTranslator
from question_bank import QuestionBank
from question_id_extraction import QuestionIdExtraction
from question_text_extraction import QuestionTextExtraction
import mysql.connector


if __name__ == '__main__':

    question_bank = QuestionBank()
    question_text_extractor = QuestionTextExtraction()
    question_id_extractor = QuestionIdExtraction()
    hindi_translator = HindiTranslator()

    cnx = mysql.connector.connect(user='doubtnut',
                                  password='Iamlegend123king',
                                  host='db-production-latest-ap-south-1b.cpymfjcydr4n.ap-south-1.rds.amazonaws.com',
                                  database='classzoo1')

    cur = cnx.cursor()

    for tup in question_bank.get_query_results():
        ques_text = question_text_extractor.extract_question_text(tup)
        ques_id = question_id_extractor.extract_question_id(tup)
        translated_ques_text = hindi_translator.translate(ques_text)
        print translated_ques_text
        print ques_id

        # TODO: Check if ques id exist, if exist then update else write new

        data = ("INSERT INTO questions_localized (question_id, english, hindi) "
                "VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE english = %s, hindi = %s")

        cur.execute(data, (ques_id, ques_text, translated_ques_text, ques_text, translated_ques_text))

    cnx.commit()

    cur.close()
    cnx.close()

