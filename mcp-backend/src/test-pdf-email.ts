
import 'dotenv/config';
import { sendEmail } from './services/emailService.js';

async function main() {
  const recipient = 'gokulvijayanand@gmail.com';
  console.log(`📧 Sending PDF test email to ${recipient}...`);

  // Create a dummy PDF content (just text, but with PDF mime type)
  // In a real scenario, this would be a buffer from a PDF generator
  const dummyPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello Tera Truce PDF!) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000248 00000 n \n0000000336 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n430\n%%EOF');

  try {
    const result = await sendEmail({
      to: recipient,
      subject: 'Tera Truce Report with PDF',
      html: `
        <h2>Monthly Report</h2>
        <p>Please find the attached PDF report for your review.</p>
        <p>This email should also have the <strong>Company Logo</strong> at the top.</p>
      `,
      attachments: [
        {
          filename: 'terratruce-report.pdf',
          content: dummyPdfContent,
          contentType: 'application/pdf'
        }
      ]
    });

    if (result.error) {
      console.error('❌ Error sending email:', result.error);
    } else {
      console.log('✅ Email with PDF sent successfully!');
      console.log('🆔 ID:', result.data?.id);
    }

  } catch (error: any) {
    console.error('❌ Exception:', error.message);
  }
}

main();
