import re


class QuestionTextExtraction:

    def __init__(self):
        pass

    @staticmethod
    def extract_question_text(question_data):
        if re.match('.*?<math.*?', question_data[15]):
            return question_data[6]
        else:
            return question_data[15]