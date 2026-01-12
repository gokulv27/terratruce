#!/usr/bin/env python3
"""
Simple email test script for TerraTruce MCP
Tests SMTP configuration with Gmail
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# SMTP Configuration
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "gokulreena3@gmail.com"
SMTP_PASSWORD = "xuyn iifq spng kkgg"
FROM_EMAIL = "gokulreena3@gmail.com"
FROM_NAME = "TerraTruce MCP"
TO_EMAIL = "gokulreena3@gmail.com"

def send_test_email():
    print("🧪 Testing Email Service...\n")
    print(f"📧 Configuration:")
    print(f"  SMTP Host: {SMTP_HOST}")
    print(f"  SMTP Port: {SMTP_PORT}")
    print(f"  From: {FROM_NAME} <{FROM_EMAIL}>")
    print(f"  To: {TO_EMAIL}\n")

    # Create message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "✅ MCP Email Service Test - SUCCESS!"
    msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg['To'] = TO_EMAIL

    # HTML content
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #F9FAFB;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #10B981; margin-bottom: 20px;">✅ Email Service Test SUCCESSFUL!</h2>
            <p style="font-size: 16px; color: #374151;">
                This is a test email from the TerraTruce MCP service.
            </p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
            <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1F2937; margin-top: 0;">SMTP Configuration</h3>
                <ul style="color: #4B5563;">
                    <li><strong>Host:</strong> {SMTP_HOST}</li>
                    <li><strong>Port:</strong> {SMTP_PORT}</li>
                    <li><strong>From:</strong> {FROM_NAME} &lt;{FROM_EMAIL}&gt;</li>
                    <li><strong>Authentication:</strong> ✓ Enabled</li>
                </ul>
            </div>
            <p style="color: #10B981; font-weight: bold; font-size: 18px;">
                ✓ Email service is working correctly!
            </p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
            <p style="color: #9CA3AF; font-size: 12px;">
                Sent from TerraTruce Model Control Proxy<br>
                Time: {datetime.utcnow().isoformat()}Z<br>
                Test ID: python-email-test-001
            </p>
        </div>
    </body>
    </html>
    """

    # Attach HTML part
    html_part = MIMEText(html, 'html')
    msg.attach(html_part)

    try:
        print("📤 Connecting to SMTP server...")
        
        # Create SMTP session
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.set_debuglevel(0)  # Set to 1 for verbose output
        
        print("🔐 Starting TLS...")
        server.starttls()
        
        print("🔑 Authenticating...")
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        print("📧 Sending email...")
        server.send_message(msg)
        
        print("✅ Email sent successfully!")
        print(f"\n🎉 SUCCESS! Check your inbox at {TO_EMAIL}")
        print("\nThe email should arrive within a few seconds.")
        
        server.quit()
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ Authentication failed: {e}")
        print("\n💡 Troubleshooting:")
        print("  1. Verify the Gmail App Password is correct")
        print("  2. Ensure 2-Factor Authentication is enabled on Gmail")
        print("  3. Generate a new App Password at: https://myaccount.google.com/apppasswords")
        return False
        
    except smtplib.SMTPException as e:
        print(f"❌ SMTP error: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = send_test_email()
    exit(0 if success else 1)
