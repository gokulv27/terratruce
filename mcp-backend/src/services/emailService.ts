
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Gmail Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});



// --- Branding Configuration ---
const EMAIL_LOGO_URL = 'https://placehold.co/200x50/1e3a8a/white?text=Tera+Truce'; // TODO: Replace with actual hosted logo URL
const CALENDAR_ICON_URL = 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png'; // Simple calendar icon

/**
 * Wraps content in a professional HTML template with branding.
 * @param content The HTML body content.
 * @param title The page title.
 * @param dateObj Optional date to display in the header (defaults to now).
 */
function wrapEmailHtml(content: string, title: string = 'Notification', dateObj: Date = new Date()): string {
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., Mon
  const dayDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }); // e.g., Jan 1

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #1e3a8a; padding: 20px; display: flex; align-items: center; justify-content: space-between; }
        .header-left { display: flex; align-items: center; }
        .header-logo { height: 40px; margin-right: 15px; }
        .header-date { color: rgba(255,255,255,0.8); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-left: 1px solid rgba(255,255,255,0.3); padding-left: 15px; display: flex; flex-direction: column; justify-content: center; }
        .header-date .day { font-weight: 700; font-size: 14px; color: white; margin-bottom: 2px; }
        .header-calendar { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 6px; text-decoration: none; color: white; font-size: 12px; transition: background 0.2s; white-space: nowrap; }
        .header-calendar:hover { background: rgba(255,255,255,0.2); }
        .content { padding: 30px 24px; color: #374151; font-size: 16px; line-height: 1.6; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .btn { display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; border-radius: 0 !important; margin: 0 !important; }
          .header { flex-direction: column; align-items: flex-start; }
          .header-left { margin-bottom: 12px; width: 100%; justify-content: space-between; }
          .header-calendar { width: 100%; box-sizing: border-box; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <img src="${EMAIL_LOGO_URL}" alt="Tera Truce" class="header-logo">
            <div class="header-date">
              <span class="day">${dayName}</span>
              <span>${dayDate}</span>
            </div>
          </div>
          <a href="http://localhost:5173/calendar" class="header-calendar" title="Add to Calendar">
             <span>📅 Reminder</span>
          </a>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Tera Truce. Real Estate Intelligence.</p>
          <p>This is an automated message. Please do not reply directly to this email unless instructed.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// --- ICS Helper ---
function generateIcsContent(subject: string, description: string, location: string, startTime: string): string {
    // Basic formatting. For production, consider using 'ics' package.
    // Assuming startTime is a parseable date string.
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour duration
    
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Tera Truce//NONSGML v1.0//EN',
        'METHOD:REQUEST', // Critical for it to appear as an invite
        'BEGIN:VEVENT',
        `UID:${Date.now()}@terratruce.com`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(start)}`,
        `DTEND:${formatDate(end)}`,
        `SUMMARY:${subject}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
}

interface EmailPayload {
  to: string;
  subject: string;
  propertyName: string;
  visitTime: string; // ISO string expected ideally, or parseable string
  summary: string;
}

export async function sendVisitConfirmation(data: EmailPayload) {
  try {
    const htmlContent = `
      <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Site Visit Confirmed! ✅</h2>
      <p>Hello,</p>
      <p>Your site visit for <strong>${data.propertyName}</strong> has been successfully scheduled.</p>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #2563EB; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #1e40af; font-family: monospace;">
          📅 <strong>Time:</strong> ${data.visitTime}
        </p>
        <p style="margin: 8px 0 0; color: #1e40af;">
          📍 <strong>Location:</strong> ${data.propertyName}
        </p>
      </div>

      <p>"${data.summary}"</p>
      <p style="font-size: 14px; color: #6b7280;">A calendar invite has been attached to this email for your convenience.</p>

      <div style="text-align: center;">
        <a href="http://localhost:5173/dashboard" class="btn" style="color: white; text-decoration: none;">View Dashboard</a>
      </div>
    `;

    // Generate ICS
    const icsContent = generateIcsContent(
        `Site Visit: ${data.propertyName}`,
        data.summary,
        data.propertyName,
        data.visitTime
    );

    const visitDateObj = new Date(data.visitTime);
    
    const info = await transporter.sendMail({
      from: `"Tera Truce" <${process.env.GMAIL_USER}>`,
      to: data.to,
      subject: data.subject,
      html: wrapEmailHtml(htmlContent, 'Visit Confirmed', visitDateObj),
      alternatives: [
           {
             contentType: 'text/calendar; method=REQUEST',
             content: icsContent
           }
      ],
       attachments: [
        {
          filename: 'invite.ics',
          content: icsContent,
          contentType: 'text/calendar'
        }
      ]
    });

    console.log(`[EmailService] Sent confirmation to ${data.to} (Message ID: ${info.messageId})`);
    return { success: true, id: info.messageId };

  } catch (error: any) {
    console.error("[EmailService] Failed:", error);
    return { success: false, error: error.message };
  }
}

// --- Generic Email Operations (Adapted for Nodemailer) ---

export async function sendEmail(payload: {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  bcc?: string | string[];
  cc?: string | string[];
  replyTo?: string | string[];
  scheduledAt?: string;
  headers?: Record<string, string>;
  attachments?: { filename: string; content?: string | Buffer; path?: string; contentType?: string }[];
  tags?: { name: string; value: string }[];
  template?: any;
}) {
  
  // Apply wrapper if HTML is provided and not already full document (simple check)
  let finalHtml = payload.html;
  if (finalHtml && !finalHtml.trim().startsWith('<!DOCTYPE')) {
      finalHtml = wrapEmailHtml(finalHtml, payload.subject);
  }

  const mailOptions: any = {
    from: payload.from || `"Tera Truce" <${process.env.GMAIL_USER}>`,
    to: payload.to,
    subject: payload.subject,
    html: finalHtml,
    text: payload.text,
    cc: payload.cc,
    bcc: payload.bcc,
    replyTo: payload.replyTo,
    headers: payload.headers,
    attachments: payload.attachments,
  };

  if (payload.template && !payload.html) {
      console.warn('[EmailService] Templates are not natively supported. Sending raw data.');
      mailOptions.html = wrapEmailHtml(`<pre>${JSON.stringify(payload.template, null, 2)}</pre>`, 'Template Data');
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    return { data: { id: info.messageId }, error: null };
  } catch (error: any) {
    console.error('[EmailService] SendEmail Failed:', error);
    return { data: null, error: { message: error.message } };
  }
}

// --- Stubs for Resend-specific features not available in standard SMTP ---

export async function createApiKey(name: string) { throw new Error('Not supported with Gmail SMTP'); }
export async function listApiKeys() { throw new Error('Not supported with Gmail SMTP'); }
export async function deleteApiKey(id: string) { throw new Error('Not supported with Gmail SMTP'); }
export async function sendBatchEmails(payloads: any[]) { 
    // Basic loop implementation for batch
    const results = [];
    for (const p of payloads) {
        results.push(await sendEmail(p));
    }
    return { data: results, error: null };
}
export async function retrieveEmail(id: string) { throw new Error('Not supported with Gmail SMTP'); }
export async function updateEmail(id: string, scheduledAt: string) { throw new Error('Not supported with Gmail SMTP'); }
export async function cancelEmail(id: string) { throw new Error('Not supported with Gmail SMTP'); }
export async function listEmails() { throw new Error('Not supported with Gmail SMTP'); }
export async function listAttachments(emailId: string) { throw new Error('Not supported with Gmail SMTP'); }
export async function retrieveAttachment(emailId: string, attachmentId: string) { throw new Error('Not supported with Gmail SMTP'); }
