from dotenv import load_dotenv
load_dotenv()
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Mail, Attachment, FileContent, FileName,
    FileType, Disposition, ContentId)
import datetime
import os.path
import base64
import os,ssl



import urllib3


def sendMail(msg_to_send,file,type_data):
    email = 'akshatjain057@gmail.com'
    password = 'Akshat123'
    send_to_email = ['akshat.sandhaliya16@gmail.com','akshat@doubtnut.com']
    subject = 'Data'
    # message = 'here is the {0}'.format(type_data)
    message = msg_to_send
    # file_location = '/home/uday/albert/{0}'.format(file)
    file_location = '/Users/apple/Desktop/python/albert/{0}'.format(file)


    msg = MIMEMultipart()
    msg['From'] = email
    msg['To'] =  ', '.join(send_to_email)
    msg['Subject'] = subject

    msg.attach(MIMEText(message, 'html'))
    # msg.attach(MIMEText(message, 'text/html'))


  
    filename = os.path.basename(file_location)
    attachment = open(file_location, "rb")
    part = MIMEBase('application', 'octet-stream')
    part.set_payload(attachment.read())
    encoders.encode_base64(part)
    part.add_header('Content-Disposition', "attachment; filename= %s" % filename)
    part.add_header('Content-type' , 'text/html;charset=iso-8859-1')

   
    msg.attach(part)

    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(email, password)
    text = msg.as_string()
    server.sendmail(email, send_to_email, text)
    server.quit()


urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def sendMessage(html_content,attachments):
# import os, ssl
    if (not os.environ.get('PYTHONHTTPSVERIFY', '') and
        getattr(ssl, '_create_unverified_context', None)): 
        ssl._create_default_https_context = ssl._create_unverified_context

    message = Mail(
        from_email='autobot@doubtnut.com',
        to_emails=['product@doubtnut.com' , 'tech@doubtnut.com' ,'web@doubtnut.com','akshat@doubtnut.com','gunjan@doubtnut.com','rohan@doubtnut.com'],
        # to_emails=['akshat@doubtnut.com','akshat.sandhaliya16@gmail.com'],
        subject='Daily Analytics Report -'+str(datetime.date.today() + datetime.timedelta(-1)),
        html_content=html_content)
    file_paths = attachments
    attachments =[]
    file_names =['@App','@Web','@Whatsapp']
    for index,file_path in enumerate(file_paths):
    # file_path = './master_report.csv'
        with open(file_path, 'rb') as f:
            data = f.read()
            f.close()
        encoded = base64.b64encode(data).decode()
        attachment = Attachment()
        attachment.file_content = FileContent(encoded)
        attachment.file_type = FileType('text/csv')
        attachment.file_name = FileName(file_path+'.csv')
        attachment.disposition = Disposition('attachment')
        attachments.append(attachment)
    message.attachment = attachments
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        data = message.get()
        response = sg.send(message)
        print(response.status_code)
        # print(response.body)
        # print(response.headers)
    except Exception as e:
        print(e)
