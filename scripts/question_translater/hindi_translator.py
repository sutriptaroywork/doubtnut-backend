from googletrans import Translator
import re


class HindiTranslator:

    def __init__(self):
        pass

    @staticmethod
    def _hindi_translate(text):
        flag = 0
        output = ""
        store = ""
        temp = ""
        obj = Translator()

        for i in range(len(text)):

            if flag == 1:
                if text[i] == '`':
                    flag = 0
                    res = obj.translate(temp, 'hi')
                    output = output + res.text + store + '`'
                    temp = ""
                    store = ""
                else:
                    store = store + text[i]

            elif text[i] == '`' and flag == 0:
                store = store + text[i]
                flag = 1

            else:
                temp = temp + text[i]

        output = output + obj.translate(temp, "hi").text
        return output

    def translate(self, text):

        ques_parts = re.split('(<.*?>)', text)
        ans = ""

        for ele in ques_parts:
            if re.match('<img.*?>', ele):
                ans = ans + " " + ele

            elif re.match('<.*?>', ele):
                ans = ans + " " + ele

            else:
                ans = ans + self._hindi_translate(ele)

        return ans
