import 'dotenv/config';
import { sendVisitConfirmation } from './services/emailService.js';

async function testEmail() {
  console.log('📧 Testing Email Service...\n');
  console.log('⚠️  NOTE: Resend free tier only allows sending to verified email\n');
  console.log('Sending test email to: gokulvijayanand@gmail.com (verified)\n');

  const result = await sendVisitConfirmation({
    to: 'gokulvijayanand@gmail.com',
    subject: '🏠 Terra Truce - Email Service Test',
    propertyName: '123 Test Street, Mumbai, India',
    visitTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
    }),
    summary: 'This is a test email to verify that the Terra Truce email service is working correctly. If you receive this, the integration is successful!',
  });

  if (result.success) {
    console.log('✅ Email sent successfully!');
    console.log('📬 Email ID:', result.id);
    console.log('\n✉️  Please check your inbox at chorkoc.cse2023@citchennai.net');
    console.log('📁 Also check spam/junk folder if not in inbox\n');
  } else {
    console.error('❌ Failed to send email:', result.error);
    process.exit(1);
  }
}

testEmail();
