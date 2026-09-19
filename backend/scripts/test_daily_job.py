import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.worker.tasks import send_daily_notification_email
from dotenv import load_dotenv

load_dotenv()

def main():
    print("Testing Resend email notification...")
    # Put a valid email address here for testing, or use onboarding@resend.dev which will send to your registered email if the domain is not verified
    test_email = "delivered@resend.dev"
    
    send_daily_notification_email(test_email, "Test Child")
    print("Finished triggering email.")

if __name__ == "__main__":
    main()
