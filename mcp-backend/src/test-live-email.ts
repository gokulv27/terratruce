
import 'dotenv/config';
import { sendEmail } from './services/emailService.js';

async function main() {
  const recipient = 'gokulvijayanand@gmail.com';
  console.log(`📧 Sending test email to ${recipient}...`);

  try {
    const result = await sendEmail({
      to: recipient,
      subject: 'Tera Truce Resend Integration Test',
      html: `
        <h1>Hello from Tera Truce! 🏡</h1>
        <p>This is a test email sent via the new authenticated Resend integration.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr />
        <p><em>Powered by Resend & Gemini</em></p>
      `
    });

    if (result.error) {
      console.error('❌ Error sending email:', result.error);
    } else {
      console.log('✅ Email sent successfully!');
      console.log('🆔 ID:', result.data?.id);
    }

  } catch (error: any) {
    console.error('❌ Exception:', error.message);
    if (error.message.includes('only_to_verified_email_addresses')) {
        console.log('\n⚠️  NOTE: On the Resend free tier, you can ONLY send emails to the address you signed up with.');
        console.log('   Please check if this email matches your Resend account email.');
    }
  }
}

main();
