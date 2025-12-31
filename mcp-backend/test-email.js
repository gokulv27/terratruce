import { Resend } from 'resend';
import 'dotenv/config';

const resendKeys = (process.env.RESEND_API_KEYS || '').split(',').filter(k => k.trim());

if (resendKeys.length === 0) {
  console.error('❌ No Resend API keys found in .env');
  process.exit(1);
}

const resend = new Resend(resendKeys[0]);

async function sendTestEmail() {
  try {
    console.log('📧 Sending test email to chorkoc.cse2023@citchennai.net...\n');
    
    const { data, error } = await resend.emails.send({
      from: 'Terra Truce <onboarding@resend.dev>',
      to: ['chorkoc.cse2023@citchennai.net'],
      subject: 'Test Email from Terra Truce MCP Backend',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">🏠 Terra Truce</h1>
          <h2>Email Service Test</h2>
          
          <p>Hello!</p>
          
          <p>This is a test email from the Terra Truce MCP Backend to verify that the email service is working correctly.</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">✅ Email Service Status</h3>
            <ul>
              <li><strong>Service:</strong> Resend API</li>
              <li><strong>Status:</strong> Operational</li>
              <li><strong>Sent:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <p>If you received this email, it means the email integration is working perfectly!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
          
          <p style="color: #6B7280; font-size: 14px;">
            This is an automated test email from Terra Truce Property Intelligence Platform.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log('📬 Email ID:', data.id);
    console.log('\n✉️  Check your inbox at chorkoc.cse2023@citchennai.net');
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    process.exit(1);
  }
}

sendTestEmail();
