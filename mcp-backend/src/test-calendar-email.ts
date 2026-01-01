
import 'dotenv/config';
import { sendVisitConfirmation } from './services/emailService.js';

async function main() {
  const recipient = 'gokulvijayanand@gmail.com';
  console.log(`📧 Sending Calendar Invite test email to ${recipient}...`);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  try {
    const result = await sendVisitConfirmation({
      to: recipient,
      subject: 'Site Visit: 123 Main St',
      propertyName: '123 Main St, Springfield',
      visitTime: tomorrow.toISOString(),
      summary: 'Scheduled inspection of the property grounds.'
    });

    if (result.error) {
      console.error('❌ Error sending email:', result.error);
    } else {
      console.log('✅ Calendar Email sent successfully!');
      console.log('🆔 ID:', result.id);
      console.log('📅 Date used:', tomorrow.toISOString());
    }

  } catch (error: any) {
    console.error('❌ Exception:', error.message);
  }
}

main();
