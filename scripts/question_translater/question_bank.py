import mysql.connector


class QuestionBank:
    def __init__(self):
        self._cnx = mysql.connector.connect(user='doubtnut',
                                      password='Iamlegend123king',
                                      host='db-production-latest-ap-south-1b.cpymfjcydr4n.ap-south-1.rds.amazonaws.com',
                                      database='classzoo1')

        self._cur = self._cnx.cursor()

    def get_query_results(self):
        self._cur.execute(
            "SELECT * from questions where "
            "(is_answered=1 or is_text_answered=1) and subject='physics' and matched_question is null;"
        )

        for zz in self._cur:
            yield zz

        self._cur.close()
        self._cnx.close()


