import gspread
from oauth2client.service_account import ServiceAccountCredentials
from pprint import pprint

scopes = ["https://spreadsheets.google.com/feeds","https://www.googleapis.com/auth/spreadsheets","https://www.googleapis.com/auth/drive.file","https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name("google sheets-94e9b4ecb174.json",scopes)

client = gspread.authorize(creds)

sheet = client.open('data_test').sheet1
# row = sheet.row_values(2)
# pprint("ROW")
# pprint(row)
# col = sheet.col_values(1)
# pprint("COL")
# pprint(col)
data = sheet.get_all_records()
# pprint('DATA')
# pprint(data)
row_count = len(data)
row_data = sheet.row_values(row_count+1)
print(row_data)
new_row = ['a','b','c','d']
sheet.insert_row(new_row ,2)
pprint(col)
#