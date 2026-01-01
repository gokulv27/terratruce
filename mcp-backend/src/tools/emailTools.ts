
import { z } from 'zod';
import { sendEmail } from '../services/emailService.js';

// =====================================================
// TOOL: Send General Email
// =====================================================

export const SendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]).describe('Recipient email address(es)'),
  subject: z.string().describe('Email subject'),
  html: z.string().describe('HTML content of the email'),
  text: z.string().optional().describe('Plain text version of the email (optional but recommended)'),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional().describe('CC recipient(s)'),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional().describe('BCC recipient(s)')
});

export async function sendGeneralEmail(args: z.infer<typeof SendEmailSchema>) {
  console.log(`[EmailTool] Sending email to ${args.to} with subject "${args.subject}"`);

  try {
    const response = await sendEmail({
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      cc: args.cc,
      bcc: args.bcc
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      status: 'success',
      message: `Email sent successfully to ${Array.isArray(args.to) ? args.to.join(', ') : args.to}`,
      id: response.data?.id
    };
  } catch (error: any) {
    console.error('[EmailTool] Failed to send email:', error);
    return {
      status: 'error',
      message: `Failed to send email: ${error.message}`
    };
  }
}
