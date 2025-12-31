
import { Resend } from 'resend';

// Load keys from env and split by comma
const RESEND_KEYS = (process.env.RESEND_API_KEYS || process.env.RESEND_API_KEY || '').split(',').map(k => k.trim()).filter(k => k);
let currentKeyIndex = 0;

// Helper to get current client
function getResendClient() {
  if (RESEND_KEYS.length === 0) return null;
  const key = RESEND_KEYS[currentKeyIndex];
  // Rotate index for next time (Round Robin)
  currentKeyIndex = (currentKeyIndex + 1) % RESEND_KEYS.length;
  console.log(`[EmailService] Using Resend Key [${currentKeyIndex}]`);
  return new Resend(key);
}

interface EmailPayload {
  to: string;
  subject: string;
  propertyName: string;
  visitTime: string;
  summary: string;
}

export async function sendVisitConfirmation(data: EmailPayload) {
  const resend = getResendClient();

  if (!resend) {
    console.warn('[EmailService] RESEND_API_KEYS not set. Skipping email.');
    return { success: false, error: 'RESEND_API_KEYS missing' };
  }

  try {
    const response = await resend.emails.send({
      from: 'Tera Truce <onboarding@resend.dev>', // Update with verified domain in prod
      to: [data.to],
      subject: data.subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 12px;">
          
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #2563EB; font-size: 24px; margin: 0;">Tera Truce 🏡</h1>
            <p style="color: #6b7280; margin-top: 8px;">Real Estate Intelligence</p>
          </div>

          <div style="background-color: white; padding: 24px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Site Visit Confirmed! ✅</h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">
              Hello, your site visit for <strong>${data.propertyName}</strong> has been successfully scheduled.
            </p>

            <div style="background-color: #eff6ff; border-left: 4px solid #2563EB; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-family: monospace;">
                📅 <strong>Time:</strong> ${data.visitTime}
              </p>
              <p style="margin: 8px 0 0; color: #1e40af;">
                📍 <strong>Location:</strong> ${data.propertyName}
              </p>
            </div>

            <p style="color: #4b5563; font-size: 14px;">"${data.summary}"</p>

            <div style="margin-top: 24px; text-align: center;">
              <a href="http://localhost:5173/dashboard" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
            <p>Powered by Gemini AI & Tera Truce Platform</p>
            <p>This is an automated message.</p>
          </div>

        </div>
      `,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    console.log(`[EmailService] Sent confirmation to ${data.to} (ID: ${response.data?.id})`);
    return { success: true, id: response.data?.id };

  } catch (error: any) {
    console.error("[EmailService] Failed:", error);
    return { success: false, error: error.message };
  }
}
