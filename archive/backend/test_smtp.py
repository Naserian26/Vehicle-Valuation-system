import smtplib
from email.mime.text import MIMEText

# Credentials
EMAIL = "naserianmercy20@gmail.com"
PASSWORD = "wusd oihe mzav akue" # App Password

msg = MIMEText("Test email from port 465 SSL script")
msg['Subject'] = "SMTP Port 465 Test"
msg['From'] = EMAIL
msg['To'] = EMAIL

try:
    print("Connecting to smtp.gmail.com:465 (SSL)...")
    server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
    server.set_debuglevel(1)
    print("Logging in...")
    server.login(EMAIL, PASSWORD)
    print("Sending mail...")
    server.send_message(msg)
    server.quit()
    print("SUCCESS: Email sent via Port 465!")
except Exception as e:
    print(f"FAILURE: {e}")
